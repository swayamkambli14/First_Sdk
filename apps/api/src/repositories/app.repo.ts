import { PrismaClient, App } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Finds an app by the non-secret prefix first (fast index lookup),
 * then the caller must bcrypt.compare the full hash.
 * This avoids full-table scans on every API request.
 */
export async function findAppsByPrefix(prefix: string): Promise<App[]> {
  return prisma.app.findMany({
    where: { apiKeyPrefix: prefix, isActive: true },
  });
}

export async function findAppById(id: string): Promise<App | null> {
  return prisma.app.findUnique({ where: { id } });
}

export async function createApp(data: {
  name: string;
  apiKeyHash: string;
  apiKeyPrefix: string;
  webhookUrl?: string;
}): Promise<App> {
  return prisma.app.create({ data });
}

export async function updateWebhookUrl(id: string, webhookUrl: string): Promise<App> {
  return prisma.app.update({ where: { id }, data: { webhookUrl } });
}

export async function rotateApiKey(
  id: string,
  newHash: string,
  newPrefix: string
): Promise<App> {
  return prisma.app.update({
    where: { id },
    data: { apiKeyHash: newHash, apiKeyPrefix: newPrefix },
  });
}
