import type { Prisma } from '@prisma/client';
export function normalizeRecoveryEmail(value: unknown): string;
export function localMailOrigin(value: unknown): string;
export function emailLinkOrigin(value: unknown): string;
export function prepareCustomerEmailToken(tx: Prisma.TransactionClient, userId: string, purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD', now?: Date): Promise<{ token: string; tokenHash: string; email: string; expiresAt: Date } | null>;
export function redeemCustomerEmailToken(tx: Prisma.TransactionClient, token: unknown, purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD', passwordHash?: string): Promise<void>;
