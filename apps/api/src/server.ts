// Load and validate env vars first — server refuses to start if any are missing
import './config/env.js';
import { env } from './config/env.js';
import logger from './utils/logger.js';
import { AppError } from './utils/errors.js';
import { initRulesLoader } from './config/rules.loader.js';
import Fastify, { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { createServer } from 'http';
import { initWebSocket } from './infrastructure/websocket.js';
import { startEventWorker } from './workers/event.worker.js';

// Route handlers
import { authRoutes } from './routes/auth.routes.js';
import { eventRoutes } from './routes/events.routes.js';
import { rewardRoutes } from './routes/rewards.routes.js';
import { referralRoutes } from './routes/referrals.routes.js';
import { leaderboardRoutes } from './routes/leaderboard.routes.js';
import { appRoutes } from './routes/apps.routes.js';
import { adminRoutes } from './routes/admin.routes.js';

async function buildServer() {
  const server = Fastify({
    logger: false, // We use Winston instead of Fastify's built-in logger
    trustProxy: true,
  });

  // ── Security plugins ──────────────────────────────────────────────────────
  await server.register(helmet, {
    contentSecurityPolicy: false, // API — no HTML served
  });

  await server.register(cors, {
    origin: env.NODE_ENV === 'production' ? false : true,
    credentials: true,
  });

  await server.register(cookie);

  await server.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: 'chainloyalty_token',
      signed: false,
    },
  });

  // Global rate limit — tighter per-route limits applied separately
  await server.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: 'RateLimitError',
      message: 'Too many requests — please slow down',
      statusCode: 429,
      errorCode: 'RATE_LIMIT_EXCEEDED',
    }),
  });

  // ── Global error handler ──────────────────────────────────────────────────
  server.setErrorHandler(
    (error: FastifyError | AppError | Error, _req: FastifyRequest, reply: FastifyReply) => {
      if (error instanceof AppError) {
        logger.warn('Application error', {
          errorCode: error.errorCode,
          statusCode: error.statusCode,
          message: error.message,
        });
        return reply.status(error.statusCode).send({
          error: error.name,
          message: error.message,
          statusCode: error.statusCode,
          errorCode: error.errorCode,
        });
      }

      // Fastify validation errors
      if ('statusCode' in error && error.statusCode === 400) {
        return reply.status(400).send({
          error: 'ValidationError',
          message: error.message,
          statusCode: 400,
          errorCode: 'VALIDATION_ERROR',
        });
      }

      // Unexpected errors — no stack traces in production
      logger.error('Unhandled error', { error: error.message, stack: error.stack });
      return reply.status(500).send({
        error: 'InternalError',
        message: 'An unexpected error occurred',
        statusCode: 500,
        errorCode: 'INTERNAL_ERROR',
      });
    }
  );

  // ── Health check ──────────────────────────────────────────────────────────
  server.get('/health', async (_req, reply) => {
    return reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '1.0.0',
    });
  });

  // ── Register all route groups ─────────────────────────────────────────────
  await server.register(authRoutes, { prefix: '/v1/auth' });
  await server.register(eventRoutes, { prefix: '/v1/events' });
  await server.register(rewardRoutes, { prefix: '/v1/users' });
  await server.register(referralRoutes, { prefix: '/v1/referrals' });
  await server.register(leaderboardRoutes, { prefix: '/v1/leaderboard' });
  await server.register(appRoutes, { prefix: '/v1/apps' });
  await server.register(adminRoutes, { prefix: '/v1/admin' });

  return server;
}

async function start() {
  try {
    // Initialize rules engine (loads config + sets up hot-reload watcher)
    initRulesLoader();

    const app = await buildServer();

    // Create raw HTTP server so Socket.IO can share it with Fastify
    const httpServer = createServer(app.server);
    initWebSocket(httpServer);

    // Start BullMQ event worker
    startEventWorker();

    await app.listen({ port: env.PORT, host: '0.0.0.0' });

    logger.info(`🚀 ChainLoyalty API running on port ${env.PORT}`, {
      env: env.NODE_ENV,
      version: env.API_VERSION,
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
}

start();

export { buildServer };
