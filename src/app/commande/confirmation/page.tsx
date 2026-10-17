import Link from 'next/link';
import { prisma } from '../../../lib/db';
import { realOrdersEnabled, stripeReady } from '../../../lib/real-orders';
import { getCurrentUser } from '../../../lib/auth';
import RefreshPaymentStatus from './refresh-payment-status';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Confirmation de commande | Pizzeria Roma', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };

type Props = { searchParams: Promise<{ session_id?: string; order_id?: string }> };
export default async function OrderConfirmation({ searchParams }: Props) {
  const { session_id: sessionId, order_id: orderId } = await searchParams;
  let order: Awaited<ReturnType<typeof prisma.order.findUnique>> = null;
  let paid = false;
  if (realOrdersEnabled() && typeof orderId === 'string' && /^[a-z0-9_-]{8,64}$/i.test(orderId)) {
    const user = await getCurrentUser();
    if (user?.role === 'CUSTOMER') {
      order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id, paymentStatus: 'CREDITED' } });
      paid = !!order;
    }
  }
  if (realOrdersEnabled() && stripeReady() && typeof sessionId === 'string' && /^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    try {
      const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }, cache: 'no-store' });
      if (response.ok) {
        const session = await response.json() as { id?: string; payment_status?: string; metadata?: { orderId?: string } };
        if (session.id === sessionId && session.metadata?.orderId) {
          order = await prisma.order.findFirst({ where: { id: session.metadata.orderId, stripeSessionId: sessionId } });
          paid = session.payment_status === 'paid';
        }
      }
    } catch { /* Stripe webhook will reconcile payment status when available. */ }
  }
  if (!order) return <main className="customer-page"><h1>Confirmation indisponible</h1><p>Nous n’avons pas retrouvé cette commande. Si le paiement a été validé, contactez le restaurant avec votre confirmation Stripe.</p><Link href="/menu">Retour à la carte</Link></main>;
  const items = Array.isArray(order.itemsSnapshot) ? order.itemsSnapshot as Array<{ label?: string; quantity?: number; totalCents?: number; loyaltyFreeQuantity?: number }> : [];
  const synchronized = (paid && order.paymentStatus === 'PAID') || order.paymentStatus === 'CREDITED';
  return <main className="customer-page"><h1>{synchronized ? 'Commande confirmée' : paid ? 'Paiement accepté, transmission en cours' : 'Paiement en vérification'}</h1><p>Commande {order.publicReference}</p><p>{order.paymentStatus === 'CREDITED' ? 'Votre avoir a réglé cette commande. Elle est transmise au restaurant.' : synchronized ? 'Stripe a confirmé le paiement. La commande est transmise au restaurant.' : paid ? 'Stripe a confirmé le paiement. La mise à jour de la file du restaurant est en cours.' : 'Stripe n’a pas encore confirmé le paiement. Cette page se mettra à jour après confirmation.'}</p>{paid && !synchronized && <RefreshPaymentStatus />}<h2>Récapitulatif</h2><ul>{items.map((item,index)=><li key={index}>{item.quantity} × {item.label}{item.loyaltyFreeQuantity?` · ${item.loyaltyFreeQuantity} offert(s)`:''} — {((item.totalCents ?? 0)/100).toLocaleString('fr-BE',{style:'currency',currency:'EUR'})}</li>)}</ul><p>Sous-total : {(order.subtotalCents/100).toLocaleString('fr-BE',{style:'currency',currency:'EUR'})}</p>{order.loyaltyDiscountCents>0&&<p>Carte fidélité : −{(order.loyaltyDiscountCents/100).toLocaleString('fr-BE',{style:'currency',currency:'EUR'})}</p>}{order.discountCents>0&&<p>{order.promotionName??'Promotion'} : −{(order.discountCents/100).toLocaleString('fr-BE',{style:'currency',currency:'EUR'})}</p>}<p><strong>Total : {(order.totalCents/100).toLocaleString('fr-BE',{style:'currency',currency:'EUR'})}</strong></p>{order.creditAppliedCents>0&&<p>Avoir appliqué : {(order.creditAppliedCents/100).toLocaleString('fr-BE',{style:'currency',currency:'EUR'})}</p>}<p><strong>Payé en ligne : {((order.totalCents-order.creditAppliedCents)/100).toLocaleString('fr-BE',{style:'currency',currency:'EUR'})}</strong></p><p>{order.fulfillment === 'DELIVERY' ? 'Livraison · adresse communiquée au restaurant' : 'Retrait sur place'}{order.scheduledFor ? ` · ${order.scheduledFor.toLocaleString('fr-BE',{timeZone:'Europe/Brussels',dateStyle:'short',timeStyle:'short'})}` : ''}</p><Link href="/menu">Retour à la carte</Link></main>;
}
