import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NonceRequestSchema, VerifyRequestSchema } from '../schemas/auth.schemas.js';
import * as authService from '../services/auth.service.js';
import { jwtMiddleware } from '../middleware/jwt.middleware.js';
import { setex } from '../infrastructure/redis.js';
import { ValidationError } from '../utils/errors.js';
import crypto from 'crypto';
import { env } from '../config/env.js';

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /v1/auth/nonce
   * Step 1 of SIWE: generate a one-time nonce for the wallet to sign.
   */
  fastify.post('/nonce', async (request, reply) => {
    const result = NonceRequestSchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0]?.message ?? 'Invalid request');
    }

    const { nonce, message } = await authService.generateNonce(result.data.wallet_address);
    return reply.status(200).send({ nonce, message });
  });

  /**
   * POST /v1/auth/verify
   * Step 2 of SIWE: verify the signature and issue a JWT in an httpOnly cookie.
   */
  fastify.post('/verify', async (request, reply) => {
    const result = VerifyRequestSchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0]?.message ?? 'Invalid request');
    }

    // Use a default app_id for direct browser auth — in production this would
    // come from the app context (e.g., subdomain or query param)
    const appId = (request.headers['x-app-id'] as string) ?? 'default';

    const userData = await authService.verifySignature(
      result.data.wallet_address,
      result.data.signature,
      appId
    );

    // Sign JWT with wallet_address, app_id, and a unique jti for blacklisting
    const jti = crypto.randomUUID();
    const token = fastify.jwt.sign(
      {
        wallet_address: userData.walletAddress,
        app_id: appId,
        jti,
      },
      { expiresIn: `${env.JWT_EXPIRY_HOURS}h` }
    );

    // Set as httpOnly cookie — prevents XSS theft (not accessible via JS)
    reply.setCookie('chainloyalty_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: env.JWT_EXPIRY_HOURS * 3600,
    });

    return reply.status(200).send(userData);
  });

  /**
   * POST /v1/auth/logout
   * Blacklists the JWT in Redis so it can't be reused even before expiry.
   */
  fastify.post('/logout', { preHandler: jwtMiddleware }, async (request, reply) => {
    const user = request.user!;
    // Store jti in Redis blacklist with TTL = remaining token lifetime
    await setex(`jwt:blacklist:${user.jti}`, env.JWT_EXPIRY_HOURS * 3600, '1');

    reply.clearCookie('chainloyalty_token', { path: '/' });
    return reply.status(200).send({ message: 'Logged out successfully' });
  });

  /**
   * GET /v1/auth/me
   * Returns the current authenticated user's profile.
   */
  fastify.get('/me', { preHandler: jwtMiddleware }, async (request, reply) => {
    const profile = await authService.getProfile(request.user!.walletAddress);
    return reply.status(200).send(profile);
  });
}
