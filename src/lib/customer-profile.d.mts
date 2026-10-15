export function validateCustomerProfile(input: unknown): { name: string; phone: string | null };
export function validatePasswordChange(input: unknown): { currentPassword: string; newPassword: string };
export function validatePasswordReset(input: unknown): { token: string; newPassword: string };
