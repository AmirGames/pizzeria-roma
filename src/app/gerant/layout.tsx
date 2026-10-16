import ManagerNavigation from './manager-navigation';

export default function ManagerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="manager-shell">
    <ManagerNavigation />
    {children}
  </div>;
}
