import { PrismaClient, Referral } from '@prisma/client';

const prisma = new PrismaClient();

export async function createReferral(data: {
  referrerWallet: string;
  refereeWallet: string;
  referralCode: string;
}): Promise<Referral> {
  return prisma.referral.create({
    data: {
      referrerWallet: data.referrerWallet.toLowerCase(),
      refereeWallet: data.refereeWallet.toLowerCase(),
      referralCode: data.referralCode,
      status: 'pending',
    },
  });
}

export async function findReferralByReferee(refereeWallet: string): Promise<Referral | null> {
  return prisma.referral.findUnique({
    where: { refereeWallet: refereeWallet.toLowerCase() },
  });
}

export async function findReferralByCode(referralCode: string): Promise<Referral | null> {
  // Gap #5 fix: only return pending referrals that are not expired (30-day TTL)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - 30);

  return prisma.referral.findFirst({
    where: {
      referralCode,
      status: 'pending',
      createdAt: { gte: expiryDate },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findReferralsByReferrer(referrerWallet: string): Promise<Referral[]> {
  return prisma.referral.findMany({
    where: { referrerWallet: referrerWallet.toLowerCase() },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateReferralStatus(
  id: string,
  status: string,
  qualifyingEventId?: string,
  fraudReason?: string
): Promise<void> {
  await prisma.referral.update({
    where: { id },
    data: {
      status,
      qualifyingEventId,
      fraudReason,
      confirmedAt: status === 'confirmed' ? new Date() : undefined,
    },
  });
}

export async function countReferralsByReferrer(referrerWallet: string): Promise<number> {
  return prisma.referral.count({
    where: {
      referrerWallet: referrerWallet.toLowerCase(),
      status: 'confirmed',
    },
  });
}
