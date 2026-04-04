import { FastifyRequest, FastifyReply } from 'fastify';
import { get } from '../infrastructure/redis.js';
import { AuthenticationError } from '../utils/errors.js';

interface JwtPayload {
  wallet_address: string;
  app_id: string;
  jti: string;
  iat: number;
  exp: number;
}

// Extend Fastify request type to carry the authenticated user
declare module 'fastify' {
  interface FastifyRequest {
    user?: { walletAddress: string; appId: string; jti: string };
  }
}

/**
 * JWT middleware for end-user browser requests.
 * Reads JWT from httpOnly cookie, verifies it, and checks the Redis blacklist
 * (populated on logout) to support token revocation.
 */
export async function jwtMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    // @fastify/jwt verifies the token and throws if invalid
    await request.jwtVerify();
  } catch {
    throw new AuthenticationError('Invalid or expired token', 'INVALID_TOKEN');
  }

  const payload = request.user as unknown as JwtPayload;

  // Check Redis blacklist — token may have been revoked on logout
  const blacklisted = await get(`jwt:blacklist:${payload.jti}`);
  if (blacklisted) {
    throw new AuthenticationError('Token has been revoked', 'TOKEN_REVOKED');
  }

  // Attach typed user to request for downstream use
  request.user = {
    walletAddress: payload.wallet_address,
    appId: payload.app_id,
    jti: payload.jti,
  };
}

/**
 * Admin middleware — checks for ADMIN_SECRET header.
 * Used to protect /v1/admin/* routes.
 */
export async function adminMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const adminSecret = request.headers['x-admin-secret'];
  if (!adminSecret || adminSecret !== process.env['ADMIN_SECRET']) {
    throw new AuthenticationError('Invalid admin secret', 'INVALID_ADMIN_SECRET');
  }
}
