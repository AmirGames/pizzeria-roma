import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/app/menu/page.tsx', import.meta.url), 'utf8');
test('menu uses live categories and reports whether online ordering is ready', () => {
  assert.match(page, /CatalogProducts/);
  assert.doesNotMatch(page, /menu-category-index/);
  assert.match(page, /categories\.length === 0/);
  assert.match(page, /realOrdersEnabled\(\) && stripeReady\(\)/);
  assert.match(page, /t\.noticeOpen/);
  assert.match(page, /t\.noticeSetup/);
});
