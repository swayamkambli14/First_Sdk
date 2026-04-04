/**
 * User Auth Routes — Email/Password (Custodial) + SIWE (Web3)
 *
 * Two completely separate sign-in paths:
 *   POST /v1/user-auth/signup   — email + password → creates account + managed wallet
 *   POST /v1/user-auth/login    — email + password → returns JWT
 *   POST /v1/user-auth/logout   — clears session
 *   GET  /v1/user-auth/me       — current user profile
 *   POST /v1/user-auth/export-wallet — export private key (self-custody graduation)
 *
 * The SIWE (Web3) path continues to use /v1/auth/* unchanged.
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  createManagedWallet,
  hasCustodialWallet,
  getWalletAddress,
  exportWalletForUser,
} from '../services/custodial-wallet.service.js';
import { upsertUser } from '../repositories/user.repo.js';
import { ValidationError, AuthenticationError, NotFoundError } from '../utils/errors.js';
import { setex, get, del } from '../infrastructure/redis.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

const SignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().max(255).optional(),
  app_id: z.string().uuid('Invalid app ID'),
  referral_code: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  app_id: z.string().uuid(),
});

const ExportSchema = z.object({
  confirmation: z.literal('I understand I am responsible for this key'),
});

export async function userAuthRoutes(fastify: FastifyInstance) {

  // ── POST /v1/user-auth/signup ─────────────────────────────────────────────
  fastify.post('/signup', async (request, reply) => {
    const parsed = SignupSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0]?.message ?? 'Invalid input');
    }
    const { email, password, display_name, app_id, referral_code } = parsed.data;

    // Check email uniqueness
    const existing = await prisma.userAccount.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) throw new ValidationError('An account with this email already exists');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create UserAccount first (we need the ID for the wallet)
    const userAccount = await prisma.userAccount.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName: display_name,
        walletMode: 'custodial',
        walletAddress: '0x0000000000000000000000000000000000000000', // temp placeholder
      },
    });

    // Generate managed wallet silently in background
    const { address } = await createManagedWallet(userAccount.id);

    // Update UserAccount with real wallet address
    await prisma.userAccount.update({
      where: { id: userAccount.id },
      data: { walletAddress: address },
    });

    // Create User record in the loyalty system (links wallet to app)
    await upsertUser(address, app_id);

    // Handle referral code if provided
    if (referral_code) {
      try {
        const { processNewUserReferral } = await import('../services/referral.service.js');
        await processNewUserReferral(address, referral_code);
      } catch {
        // Non-fatal — referral processing failure shouldn't block signup
      }
    }

    // Issue JWT
    const jti = crypto.randomUUID();
    const token = fastify.jwt.sign(
      { wallet_address: address, app_id, user_id: userAccount.id, wallet_mode: 'custodial', jti },
      { expiresIn: `${env.JWT_EXPIRY_HOURS}h` }
    );

    reply.setCookie('chainloyalty_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: env.JWT_EXPIRY_HOURS * 3600,
    });

    logger.info('Custodial user signed up', { userId: userAccount.id, address });

    return reply.status(201).send({
      user_id: userAccount.id,
      display_name: userAccount.displayName,
      email: userAccount.email,
      wallet_mode: 'custodial',
      // Never return wallet address in signup — user doesn't need to know
    });
  });

  // ── POST /v1/user-auth/login ──────────────────────────────────────────────
  fastify.post('/login', async (request, reply) => {
    const parsed = LoginSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError('Email and password required');

    const { email, password, app_id } = parsed.data;

    const userAccount = await prisma.userAccount.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!userAccount || !userAccount.passwordHash) {
      throw new AuthenticationError('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, userAccount.passwordHash);
    if (!valid) throw new AuthenticationError('Invalid email or password');

    const jti = crypto.randomUUID();
    const token = fastify.jwt.sign(
      {
        wallet_address: userAccount.walletAddress,
        app_id,
        user_id: userAccount.id,
        wallet_mode: userAccount.walletMode,
        jti,
      },
      { expiresIn: `${env.JWT_EXPIRY_HOURS}h` }
    );

    reply.setCookie('chainloyalty_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: env.JWT_EXPIRY_HOURS * 3600,
    });

    logger.info('Custodial user logged in', { userId: userAccount.id });

    return reply.send({
      user_id: userAccount.id,
      display_name: userAccount.displayName,
      email: userAccount.email,
      wallet_mode: userAccount.walletMode,
      onboarding_complete: userAccount.onboardingComplete,
    });
  });

  // ── POST /v1/user-auth/logout ─────────────────────────────────────────────
  fastify.post('/logout', async (request, reply) => {
    try {
      await request.jwtVerify();
      const payload = request.user as { jti?: string };
      if (payload?.jti) {
        await setex(`jwt:blacklist:${payload.jti}`, env.JWT_EXPIRY_HOURS * 3600, '1');
      }
    } catch { /* ignore — clear cookie regardless */ }

    reply.clearCookie('chainloyalty_token', { path: '/' });
    return reply.send({ message: 'Signed out successfully' });
  });

  // ── GET /v1/user-auth/me ──────────────────────────────────────────────────
  fastify.get('/me', async (request, reply) => {
    try { await request.jwtVerify(); } catch {
      throw new AuthenticationError('Please sign in to continue');
    }

    const payload = request.user as { user_id?: string; wallet_address?: string };
    if (!payload.user_id) throw new AuthenticationError('Invalid session');

    const userAccount = await prisma.userAccount.findUnique({
      where: { id: payload.user_id },
    });
    if (!userAccount) throw new NotFoundError('Account not found');

    return reply.send({
      user_id: userAccount.id,
      display_name: userAccount.displayName,
      email: userAccount.email,
      avatar_url: userAccount.avatarUrl,
      wallet_mode: userAccount.walletMode,
      onboarding_complete: userAccount.onboardingComplete,
    });
  });

  // ── POST /v1/user-auth/complete-onboarding ────────────────────────────────
  fastify.post('/complete-onboarding', async (request, reply) => {
    try { await request.jwtVerify(); } catch {
      throw new AuthenticationError('Please sign in to continue');
    }
    const payload = request.user as { user_id?: string };
    if (!payload.user_id) throw new AuthenticationError('Invalid session');

    await prisma.userAccount.update({
      where: { id: payload.user_id },
      data: { onboardingComplete: true },
    });

    return reply.send({ message: 'Onboarding complete' });
  });

  // ── POST /v1/user-auth/export-wallet ─────────────────────────────────────
  // Allows custodial users to "graduate" to self-custody
  fastify.post('/export-wallet', async (request, reply) => {
    try { await request.jwtVerify(); } catch {
      throw new AuthenticationError('Please sign in to continue');
    }

    const payload = request.user as { user_id?: string; wallet_mode?: string };
    if (!payload.user_id) throw new AuthenticationError('Invalid session');
    if (payload.wallet_mode !== 'custodial') {
      throw new ValidationError('Only custodial accounts can export their recovery key');
    }

    const parsed = ExportSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ValidationError(
        'You must confirm: "I understand I am responsible for this key"'
      );
    }

    const exported = await exportWalletForUser(payload.user_id);

    // Update wallet mode in UserAccount
    await prisma.userAccount.update({
      where: { id: payload.user_id },
      data: { walletMode: 'self_custody' },
    });

    logger.info('User exported wallet to self-custody', { userId: payload.user_id });

    return reply.send({
      address: exported.address,
      private_key: exported.privateKey,
      recovery_phrase: exported.mnemonic,
      warning: 'Save this in a safe place. We will never show it again.',
    });
  });
}
