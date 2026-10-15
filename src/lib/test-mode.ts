import 'server-only';
export function testOrdersEnabled() { return process.env.ENABLE_TEST_ORDERS === 'true'; }
