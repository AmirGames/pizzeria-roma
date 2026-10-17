import type { Prisma } from '@prisma/client';
export type CustomerEmailPurpose = 'VERIFY_EMAIL' | 'RESET_PASSWORD' | 'CHANGE_EMAIL';
export function normalizeRecoveryEmail(value: unknown): string;
export function localMailOrigin(value: unknown): string;
export function emailLinkOrigin(value: unknown): string;
export function prepareCustomerEmailToken(tx: Prisma.TransactionClient, userId: string, purpose: CustomerEmailPurpose, now?: Date, emailOverride?: string): Promise<{ token: string; tokenHash: string; email: string; expiresAt: Date } | null>;
export function redeemCustomerEmailToken(tx: Prisma.TransactionClient, token: unknown, purpose: CustomerEmailPurpose, passwordHash?: string): Promise<void>;
