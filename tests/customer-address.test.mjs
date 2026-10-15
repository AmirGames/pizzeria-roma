import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCustomerAddress, validateAddressRevision } from '../src/lib/customer-address.mjs';
const input = { label: ' Domicile ', address: ' Rue fictive 1, 5000 Namur ', zoneId: 'namur-centre', isDefault: false };
test('normalizes saved addresses with explicit supported delivery zones', () => {
  assert.deepEqual(validateCustomerAddress(input), { ...input, label: 'Domicile', address: 'Rue fictive 1, 5000 Namur' });
  assert.equal(validateCustomerAddress({ ...input, revision: 3 }, true).revision, 3);
  for (const changes of [{ label: '' }, { label: 'x'.repeat(61) }, { address: 'x'.repeat(301) }, { address: 'Rue\n1' }, { zoneId: 'unknown' }, { isDefault: 'true' }, { userId: 'other' }, { id: 'forced' }, { revision: 0 }]) assert.throws(() => validateCustomerAddress({ ...input, ...changes }), /INVALID_ADDRESS/);
});
test('requires a valid revision for address changes and deletion', () => {
  for (const revision of [undefined, -1, 0.5, '0', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validateCustomerAddress({ ...input, revision }, true), /INVALID_ADDRESS/);
    assert.throws(() => validateAddressRevision({ revision }), /INVALID_ADDRESS/);
  }
  assert.throws(() => validateAddressRevision({ revision: 0, userId: 'other' }));
  assert.equal(validateAddressRevision({ revision: 0 }), 0);
});
