import type { Prisma } from '@prisma/client';
export function redeemManagerAccess(tx: Prisma.TransactionClient, token: unknown, now?: Date): Promise<string>;
