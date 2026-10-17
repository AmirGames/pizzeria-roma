import { realOrdersEnabled } from './real-orders';
import { testOrdersEnabled } from './test-mode';

export function customerAccountsEnabled() {
  return realOrdersEnabled() || testOrdersEnabled();
}
