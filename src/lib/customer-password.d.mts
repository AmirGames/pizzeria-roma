export function validateCustomerAuth(input: unknown): { action: 'register' | 'login'; email: string; password: string; name?: string };
export function hashCustomerPassword(password: string): Promise<string>;
export function verifyCustomerPassword(password: string, encoded: unknown): Promise<boolean>;
