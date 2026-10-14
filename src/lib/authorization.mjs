// Pure authorization rules. Never trust a role provided by the browser.
export const ROLES = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  MANAGER: 'MANAGER',
  KITCHEN: 'KITCHEN',
});

const permissions = Object.freeze({
  'orders:read': [ROLES.MANAGER, ROLES.KITCHEN],
  'orders:update-status': [ROLES.MANAGER, ROLES.KITCHEN],
  'orders:refund': [ROLES.MANAGER],
  'catalog:write': [ROLES.MANAGER],
  'staff:manage': [ROLES.MANAGER],
  'reports:read': [ROLES.MANAGER],
});

export function can(role, permission) {
  return Object.hasOwn(permissions, permission) && permissions[permission].includes(role);
}
