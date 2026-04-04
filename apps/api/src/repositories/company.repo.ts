import { PrismaClient, Company } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function createCompany(data: {
  name: string;
  email: string;
  password: string;
  contactName?: string;
  industry?: string;
  website?: string;
  country?: string;
  timezone?: string;
}): Promise<{ company: Company; rawToken: string }> {
  const passwordHash = await bcrypt.hash(data.password, 10);

  const company = await prisma.company.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      contactName: data.contactName,
      industry: data.industry,
      website: data.website,
      country: data.country,
      timezone: data.timezone ?? 'UTC',
    },
  });

  const rawToken = await createSession(company.id);
  return { company, rawToken };
}

export async function loginCompany(
  email: string,
  password: string
): Promise<{ company: Company; rawToken: string } | null> {
  const company = await prisma.company.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!company || !company.isActive) return null;

  const valid = await bcrypt.compare(password, company.passwordHash);
  if (!valid) return null;

  const rawToken = await createSession(company.id);
  return { company, rawToken };
}

export async function createSession(companyId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.companySession.create({
    data: {
      companyId,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return rawToken;
}

export async function validateSession(rawToken: string): Promise<Company | null> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const session = await prisma.companySession.findUnique({
    where: { tokenHash },
    include: { company: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.company;
}

export async function revokeSession(rawToken: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await prisma.companySession.deleteMany({ where: { tokenHash } }).catch(() => {});
}

export async function findCompanyById(id: string): Promise<Company | null> {
  return prisma.company.findUnique({ where: { id } });
}

export async function updateCompanyProfile(
  id: string,
  data: Partial<{
    name: string;
    logoUrl: string;
    website: string;
    industry: string;
    description: string;
    contactName: string;
    contactPhone: string;
    country: string;
    timezone: string;
  }>
): Promise<Company> {
  return prisma.company.update({ where: { id }, data });
}

export async function getCompanyApps(companyId: string) {
  return prisma.app.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      apiKeyPrefix: true,
      webhookUrl: true,
      isActive: true,
      createdAt: true,
      _count: { select: { users: true, events: true } },
    },
  });
}
