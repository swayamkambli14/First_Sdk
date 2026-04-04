import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { findAppsByPrefix } from '../repositories/app.repo.js';
import { AuthenticationError } from '../utils/errors.js';
import { App } from '@prisma/client';
import logger from '../utils/logger.js';

// Extend Fastify request type to carry the authenticated app
declare module 'fastify' {
  interface FastifyRequest {
    app?: App;
  }
}

/**
 * API key middleware for server-to-server calls (SaaS apps).
 * Uses a two-step lookup: prefix index first (fast), then bcrypt compare (secure).
 * This prevents full-table scans on every request.
 */
export async function apiKeyMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or invalid Authorization header', 'MISSING_API_KEY');
  }

  const rawKey = authHeader.slice(7); // strip "Bearer "
  if (!rawKey || rawKey.length < 6) {
    throw new AuthenticationError('Invalid API key format', 'INVALID_API_KEY');
  }

  // Step 1: Fast lookup by non-secret prefix
  const prefix = rawKey.substring(0, 6);
  const candidates = await findAppsByPrefix(prefix);

  if (candidates.length === 0) {
    throw new AuthenticationError('Invalid API key', 'INVALID_API_KEY');
  }

  // Step 2: Timing-safe bcrypt compare against each candidate
  let matchedApp: App | null = null;
  for (const app of candidates) {
    try {
      const matches = await bcrypt.compare(rawKey, app.apiKeyHash);
      if (matches) {
        matchedApp = app;
        break;
      }
    } catch {
      logger.warn('bcrypt compare error during API key validation');
    }
  }

  if (!matchedApp) {
    throw new AuthenticationError('Invalid API key', 'INVALID_API_KEY');
  }

  request.app = matchedApp;
}
