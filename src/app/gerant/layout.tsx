import ManagerNavigation from './manager-navigation';
import { realOrdersEnabled } from '../../lib/real-orders';
import { testOrdersEnabled } from '../../lib/test-mode';

export default function ManagerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="manager-shell">
    <ManagerNavigation showRealOrders={realOrdersEnabled()} showTestOrders={testOrdersEnabled()} />
    {children}
  </div>;
}
