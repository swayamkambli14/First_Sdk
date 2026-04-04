import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { findAppsByPrefix, findAppById } from '../repositories/app.repo.js';
import { AuthenticationError } from '../utils/errors.js';
import { App } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// Extend Fastify request type to carry the authenticated app
declare module 'fastify' {
  interface FastifyRequest {
    app?: App;
  }
}

/**
 * API key middleware for business dashboard and server-to-server calls.
 *
 * Accepts two auth modes:
 *   1. Bearer sk_live_... — raw API key (existing flow)
 *   2. Bearer <session_token> + x-app-id header — company session token (dashboard login)
 */
export async function apiKeyMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or invalid Authorization header', 'MISSING_API_KEY');
  }

  const rawToken = authHeader.slice(7);
  if (!rawToken || rawToken.length < 6) {
    throw new AuthenticationError('Invalid API key format', 'INVALID_API_KEY');
  }

  // ── Mode 2: Company session token + x-app-id ──────────────────────────────
  const appIdHeader = request.headers['x-app-id'] as string | undefined;
  if (appIdHeader && !rawToken.startsWith('sk_')) {
    // Validate session token
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const session = await prisma.companySession.findUnique({
      where: { tokenHash },
      include: { company: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AuthenticationError('Invalid or expired session', 'INVALID_SESSION');
    }

    // Verify the requested app belongs to this company
    const app = await findAppById(appIdHeader);
    if (!app || app.companyId !== session.companyId) {
      throw new AuthenticationError('App not found or not owned by this company', 'APP_NOT_FOUND');
    }

    request.app = app;
    return;
  }

  // ── Mode 1: Raw API key (sk_live_...) ─────────────────────────────────────
  const prefix = rawToken.substring(0, 6);
  const candidates = await findAppsByPrefix(prefix);

  if (candidates.length === 0) {
    throw new AuthenticationError('Invalid API key', 'INVALID_API_KEY');
  }

  let matchedApp: App | null = null;
  for (const app of candidates) {
    try {
      const matches = await bcrypt.compare(rawToken, app.apiKeyHash);
      if (matches) { matchedApp = app; break; }
    } catch {
      logger.warn('bcrypt compare error during API key validation');
    }
  }

  if (!matchedApp) {
    throw new AuthenticationError('Invalid API key', 'INVALID_API_KEY');
  }

  request.app = matchedApp;
}
