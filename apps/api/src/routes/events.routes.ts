import { FastifyInstance } from 'fastify';
import { EventSchema } from '../schemas/event.schemas.js';
import { apiKeyMiddleware } from '../middleware/apikey.middleware.js';
import { ingestEvent } from '../services/event.service.js';
import { findEventById } from '../repositories/event.repo.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export async function eventRoutes(fastify: FastifyInstance) {
  /**
   * POST /v1/events
   * Main entry point for SaaS apps to submit user events.
   * Returns 202 immediately — processing is async via BullMQ.
   */
  fastify.post('/', { preHandler: apiKeyMiddleware }, async (request, reply) => {
    const result = EventSchema.safeParse(request.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0]?.message ?? 'Invalid event payload');
    }

    const appId = request.app!.id;
    const ingestResult = await ingestEvent(result.data, appId);

    return reply.status(202).send(ingestResult);
  });

  /**
   * GET /v1/events/:event_id
   * Check the processing status of a previously submitted event.
   */
  fastify.get('/:event_id', { preHandler: apiKeyMiddleware }, async (request, reply) => {
    const { event_id } = request.params as { event_id: string };
    const event = await findEventById(event_id);

    if (!event) {
      throw new NotFoundError(`Event ${event_id} not found`, 'EVENT_NOT_FOUND');
    }

    // Scope check — app can only see its own events
    if (event.appId !== request.app!.id) {
      throw new NotFoundError(`Event ${event_id} not found`, 'EVENT_NOT_FOUND');
    }

    return reply.status(200).send({
      event_id: event.id,
      status: event.status,
      event_type: event.eventType,
      wallet_address: event.walletAddress,
      timestamp: event.timestamp,
      processed_at: event.processedAt,
    });
  });
}
