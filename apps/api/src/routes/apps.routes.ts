import { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  createApp,
  findAppById,
  updateWebhookUrl,
  rotateApiKey,
} from '../repositories/app.repo.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const RegisterAppSchema = z.object({
  name: z.string().min(1).max(255),
  webhook_url: z.string().url().optional(),
});

export async function appRoutes(fastify: FastifyInstance) {
  /**
   * POST /v1/apps/register
   * Creates a new app and returns the raw API key — shown ONCE, never again.
   */
  fastify.post('/register', async (request, reply) => {
    const result = RegisterAppSchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0]?.message ?? 'Invalid request');
    }

    // Generate a 256-bit random API key
    const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
    const apiKeyHash = await bcrypt.hash(rawKey, 10);
    const apiKeyPrefix = rawKey.substring(0, 6);

    const app = await createApp({
      name: result.data.name,
      apiKeyHash,
      apiKeyPrefix,
      webhookUrl: result.data.webhook_url,
    });

    // Raw key is returned ONCE here — never stored, never returned again
    return reply.status(201).send({
      app_id: app.id,
      name: app.name,
      api_key: rawKey, // ← shown only once
      created_at: app.createdAt,
    });
  });

  /**
   * GET /v1/apps/:id
   * Get app details — API key hash is never returned.
   */
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const app = await findAppById(id);
    if (!app) throw new NotFoundError('App not found', 'APP_NOT_FOUND');

    return reply.send({
      app_id: app.id,
      name: app.name,
      webhook_url: app.webhookUrl,
      is_active: app.isActive,
      created_at: app.createdAt,
    });
  });

  /**
   * PUT /v1/apps/:id/webhook
   * Update the webhook URL for an app.
   */
  fastify.put('/:id/webhook', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { webhook_url } = request.body as { webhook_url: string };

    if (!webhook_url) throw new ValidationError('webhook_url is required');

    const app = await updateWebhookUrl(id, webhook_url);
    return reply.send({ app_id: app.id, webhook_url: app.webhookUrl });
  });

  /**
   * POST /v1/apps/:id/keys/rotate
   * Revokes the old API key and issues a new one.
   * New raw key is shown once in the response.
   */
  fastify.post('/:id/keys/rotate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const app = await findAppById(id);
    if (!app) throw new NotFoundError('App not found', 'APP_NOT_FOUND');

    const newRawKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
    const newHash = await bcrypt.hash(newRawKey, 10);
    const newPrefix = newRawKey.substring(0, 6);

    await rotateApiKey(id, newHash, newPrefix);

    return reply.send({
      app_id: id,
      new_api_key: newRawKey, // ← shown only once
      message: 'Previous API key has been revoked',
    });
  });
}
