import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  createCompany,
  loginCompany,
  revokeSession,
  validateSession,
  findCompanyById,
  updateCompanyProfile,
  getCompanyApps,
} from '../repositories/company.repo.js';
import { ValidationError, NotFoundError, UnauthorizedError } from '../utils/errors.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

const RegisterSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  contact_name: z.string().max(255).optional(),
  industry: z.string().max(100).optional(),
  website: z.string().url().optional(),
  country: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logo_url: z.string().url().optional(),
  website: z.string().url().optional(),
  industry: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  contact_name: z.string().max(255).optional(),
  contact_phone: z.string().max(30).optional(),
  country: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
});

// Middleware: extract company from session token
async function companyAuth(request: any, reply: any) {
  const auth = request.headers['authorization'] as string | undefined;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) throw new UnauthorizedError('Company session token required');

  const company = await validateSession(token);
  if (!company) throw new UnauthorizedError('Invalid or expired session');

  request.company = company;
}

export async function companyRoutes(fastify: FastifyInstance) {

  // ── POST /v1/company/register ─────────────────────────────────────────────
  fastify.post('/register', async (request, reply) => {
    const parsed = RegisterSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message ?? 'Invalid input');
    }
    const d = parsed.data;

    // Check email uniqueness
    const existing = await prisma.company.findUnique({ where: { email: d.email.toLowerCase() } });
    if (existing) throw new ValidationError('Email already registered', 'EMAIL_TAKEN');

    const { company, rawToken } = await createCompany({
      name: d.name,
      email: d.email,
      password: d.password,
      contactName: d.contact_name,
      industry: d.industry,
      website: d.website,
      country: d.country,
      timezone: d.timezone,
    });

    logger.info('Company registered', { companyId: company.id, email: company.email });

    return reply.status(201).send({
      company_id: company.id,
      name: company.name,
      email: company.email,
      plan: company.plan,
      session_token: rawToken,
      created_at: company.createdAt,
    });
  });

  // ── POST /v1/company/login ────────────────────────────────────────────────
  fastify.post('/login', async (request, reply) => {
    const parsed = LoginSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Email and password required');

    const result = await loginCompany(parsed.data.email, parsed.data.password);
    if (!result) throw new UnauthorizedError('Invalid email or password');

    const { company, rawToken } = result;
    logger.info('Company login', { companyId: company.id });

    return reply.send({
      company_id: company.id,
      name: company.name,
      email: company.email,
      plan: company.plan,
      logo_url: company.logoUrl,
      session_token: rawToken,
    });
  });

  // ── POST /v1/company/logout ───────────────────────────────────────────────
  fastify.post('/logout', { preHandler: companyAuth }, async (request: any, reply) => {
    const auth = request.headers['authorization'] as string;
    const token = auth.slice(7);
    await revokeSession(token);
    return reply.send({ message: 'Logged out' });
  });

  // ── GET /v1/company/me ────────────────────────────────────────────────────
  fastify.get('/me', { preHandler: companyAuth }, async (request: any, reply) => {
    const c = request.company;
    return reply.send({
      company_id: c.id,
      name: c.name,
      email: c.email,
      logo_url: c.logoUrl,
      website: c.website,
      industry: c.industry,
      description: c.description,
      contact_name: c.contactName,
      contact_phone: c.contactPhone,
      country: c.country,
      timezone: c.timezone,
      plan: c.plan,
      plan_expires_at: c.planExpiresAt,
      email_verified: c.emailVerified,
      created_at: c.createdAt,
    });
  });

  // ── PUT /v1/company/me ────────────────────────────────────────────────────
  fastify.put('/me', { preHandler: companyAuth }, async (request: any, reply) => {
    const parsed = UpdateProfileSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0]?.message ?? 'Invalid input');

    const d = parsed.data;
    const updated = await updateCompanyProfile(request.company.id, {
      name: d.name,
      logoUrl: d.logo_url,
      website: d.website,
      industry: d.industry,
      description: d.description,
      contactName: d.contact_name,
      contactPhone: d.contact_phone,
      country: d.country,
      timezone: d.timezone,
    });

    return reply.send({ message: 'Profile updated', company_id: updated.id });
  });

  // ── GET /v1/company/apps ──────────────────────────────────────────────────
  fastify.get('/apps', { preHandler: companyAuth }, async (request: any, reply) => {
    const apps = await getCompanyApps(request.company.id);
    return reply.send({ apps });
  });

  // ── POST /v1/company/apps — register a new app under this company ─────────
  fastify.post('/apps', { preHandler: companyAuth }, async (request: any, reply) => {
    const { name, webhook_url } = request.body as { name: string; webhook_url?: string };
    if (!name?.trim()) throw new ValidationError('App name is required');

    const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
    const apiKeyHash = await bcrypt.hash(rawKey, 10);
    const apiKeyPrefix = rawKey.substring(0, 6);

    const app = await prisma.app.create({
      data: {
        companyId: request.company.id,
        name: name.trim(),
        apiKeyHash,
        apiKeyPrefix,
        webhookUrl: webhook_url,
      },
    });

    logger.info('App created under company', { companyId: request.company.id, appId: app.id });

    return reply.status(201).send({
      app_id: app.id,
      name: app.name,
      api_key: rawKey,  // shown once only
      created_at: app.createdAt,
    });
  });

  // ── POST /v1/company/api-key — generate or rotate the company's API key ──
  fastify.post<{ Body: Record<string, never> }>('/api-key', { preHandler: companyAuth }, async (request: any, reply) => {
    const companyId = request.company.id;

    const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.substring(0, 6);

    await prisma.company.update({
      where: { id: companyId },
      data: {
        apiKeyHash: keyHash,
        apiKeyPrefix: keyPrefix,
        apiKeyCreatedAt: new Date(),
      },
    });

    logger.info('Company API key generated', { companyId });

    return reply.send({
      api_key: rawKey,       // shown ONCE — never returned again
      api_key_prefix: keyPrefix,
      created_at: new Date().toISOString(),
      message: 'Save this key — it will not be shown again.',
    });
  });

  // ── GET /v1/company/api-key — get key metadata (prefix + created date) ────
  fastify.get('/api-key', { preHandler: companyAuth }, async (request: any, reply) => {
    const c = request.company;
    return reply.send({
      has_key: !!c.apiKeyHash,
      api_key_prefix: c.apiKeyPrefix ? `${c.apiKeyPrefix}...` : null,
      created_at: c.apiKeyCreatedAt ?? null,
    });
  });

  // ── GET /v1/company/analytics — aggregate analytics across all company apps
  fastify.get('/analytics', { preHandler: companyAuth }, async (request: any, reply) => {
    const companyId = request.company.id;

    const apps = await prisma.app.findMany({
      where: { companyId },
      select: { id: true },
    });
    const appIds = apps.map((a) => a.id);

    if (appIds.length === 0) {
      return reply.send({
        total_users: 0, total_events: 0, total_rewards: 0,
        total_points_issued: '0', apps_count: 0,
      });
    }

    const [totalUsers, totalEvents, totalRewards, pointsAgg] = await Promise.all([
      prisma.user.count({ where: { appId: { in: appIds } } }),
      prisma.event.count({ where: { appId: { in: appIds } } }),
      prisma.reward.count({ where: { user: { appId: { in: appIds } } } }),
      prisma.user.aggregate({
        where: { appId: { in: appIds } },
        _sum: { totalPointsEarned: true },
      }),
    ]);

    return reply.send({
      total_users: totalUsers,
      total_events: totalEvents,
      total_rewards: totalRewards,
      total_points_issued: (pointsAgg._sum.totalPointsEarned ?? 0n).toString(),
      apps_count: appIds.length,
    });
  });
}
