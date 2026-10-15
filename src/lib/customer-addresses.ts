import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from './db';
import { MAX_CUSTOMER_ADDRESSES, validateAddressRevision, validateCustomerAddress } from './customer-address.mjs';
const select = { id: true, label: true, address: true, zoneId: true, isDefault: true, revision: true } as const;
export function listCustomerAddresses(userId: string, db: Prisma.TransactionClient = prisma) {
  return db.customerAddress.findMany({ where: { userId }, select, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }] });
}
export async function mutateCustomerAddress(userId: string, method: 'POST' | 'PATCH' | 'DELETE', input: unknown, id?: string) {
  const revision = method === 'DELETE' ? validateAddressRevision(input) : undefined;
  const fields = method === 'DELETE' ? null : validateCustomerAddress(input, method === 'PATCH');
  return prisma.$transaction(async tx => {
    // Serialize changes for this owner, including count limits and default switches.
    const owner = await tx.user.updateMany({ where: { id: userId, role: 'CUSTOMER', disabledAt: null }, data: { updatedAt: new Date() } });
    if (owner.count !== 1) throw new Error('UNAUTHORIZED');
    const current = method === 'POST' ? null : await tx.customerAddress.findFirst({ where: { id, userId } });
    if (method !== 'POST' && !current) throw new Error('ADDRESS_NOT_FOUND');
    if (current && current.revision !== (method === 'DELETE' ? revision : fields!.revision)) throw new Error('ADDRESS_CONFLICT');
    if (method === 'DELETE') {
      await tx.customerAddress.delete({ where: { id: current!.id } });
      if (current!.isDefault) {
        const next = await tx.customerAddress.findFirst({ where: { userId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
        if (next) await tx.customerAddress.update({ where: { id: next.id }, data: { isDefault: true, revision: { increment: 1 } } });
      }
    } else {
      const count = await tx.customerAddress.count({ where: { userId } });
      if (method === 'POST' && count >= MAX_CUSTOMER_ADDRESSES) throw new Error('ADDRESS_LIMIT');
      const isDefault = fields!.isDefault || current?.isDefault === true || count === 0;
      if (isDefault) await tx.customerAddress.updateMany({ where: { userId, isDefault: true, ...(current ? { id: { not: current.id } } : {}) }, data: { isDefault: false, revision: { increment: 1 } } });
      const data = { label: fields!.label, address: fields!.address, zoneId: fields!.zoneId, isDefault };
      if (current) await tx.customerAddress.update({ where: { id: current.id }, data: { ...data, revision: { increment: 1 } } });
      else await tx.customerAddress.create({ data: { ...data, userId } });
    }
    return listCustomerAddresses(userId, tx);
  });
}
