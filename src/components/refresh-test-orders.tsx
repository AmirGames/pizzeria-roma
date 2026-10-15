'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
export default function RefreshTestOrders({ label = 'Actualiser la liste' }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? 'Actualisation…' : label}</button>;
}
