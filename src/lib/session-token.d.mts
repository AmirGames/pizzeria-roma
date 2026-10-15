export function createSessionToken(): { token: string; tokenHash: string };
export function hashSessionToken(token: unknown): string;
