import Link from 'next/link';
import { prisma } from '../../../lib/db';
import { realOrdersEnabled, stripeReady } from '../../../lib/real-orders';
import { getCurrentUser } from '../../../lib/auth';
import RefreshPaymentStatus from './refresh-payment-status';
import { getSiteLocale } from '../../../lib/locale';
// @ts-ignore JavaScript module
import { englishMenuTerm } from '../../../lib/menu-translation.mjs';
export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  const en = (await getSiteLocale()) === 'en';
  return { title: `${en ? 'Order confirmation' : 'Confirmation de commande'} | Pizzeria Roma`, robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
}

type Props = { searchParams: Promise<{ session_id?: string; order_id?: string }> };
export default async function OrderConfirmation({ searchParams }: Props) {
  const en = (await getSiteLocale()) === 'en';
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
  if (!order) return <main className="customer-page"><h1>{en ? 'Confirmation unavailable' : 'Confirmation indisponible'}</h1><p>{en ? 'We could not find this order. If your payment was accepted, contact the restaurant with your Stripe confirmation.' : 'Nous n’avons pas retrouvé cette commande. Si le paiement a été validé, contactez le restaurant avec votre confirmation Stripe.'}</p><Link href="/menu">{en ? 'Back to menu' : 'Retour à la carte'}</Link></main>;
  const items = Array.isArray(order.itemsSnapshot) ? order.itemsSnapshot as Array<{ label?: string; quantity?: number; totalCents?: number; loyaltyFreeQuantity?: number }> : [];
  const synchronized = (paid && order.paymentStatus === 'PAID') || order.paymentStatus === 'CREDITED';
  const currencyLocale = en ? 'en-BE' : 'fr-BE';
  const formatMoney = (cents: number) => (cents / 100).toLocaleString(currencyLocale, { style: 'currency', currency: 'EUR' });
  return <main className="customer-page"><h1>{synchronized ? (en ? 'Order confirmed' : 'Commande confirmée') : paid ? (en ? 'Payment accepted, sending order' : 'Paiement accepté, transmission en cours') : (en ? 'Payment being verified' : 'Paiement en vérification')}</h1><p>{en ? 'Order' : 'Commande'} {order.publicReference}</p><p>{order.paymentStatus === 'CREDITED' ? (en ? 'Your store credit paid for this order. It has been sent to the restaurant.' : 'Votre avoir a réglé cette commande. Elle est transmise au restaurant.') : synchronized ? (en ? 'Stripe confirmed your payment. Your order has been sent to the restaurant.' : 'Stripe a confirmé le paiement. La commande est transmise au restaurant.') : paid ? (en ? 'Stripe confirmed your payment. The restaurant queue is being updated.' : 'Stripe a confirmé le paiement. La mise à jour de la file du restaurant est en cours.') : (en ? 'Stripe has not confirmed your payment yet. This page will update after confirmation.' : 'Stripe n’a pas encore confirmé le paiement. Cette page se mettra à jour après confirmation.')}</p>{paid && !synchronized && <RefreshPaymentStatus locale={en ? 'en' : 'fr'} />}<h2>{en ? 'Order summary' : 'Récapitulatif'}</h2><ul>{items.map((item,index)=><li key={index}>{item.quantity} × {en ? englishMenuTerm(item.label ?? '') : item.label}{item.loyaltyFreeQuantity?` · ${item.loyaltyFreeQuantity} ${en ? 'free' : 'offert(s)'}`:''} — {formatMoney(item.totalCents ?? 0)}</li>)}</ul><p>{en ? 'Subtotal' : 'Sous-total'} : {formatMoney(order.subtotalCents)}</p>{order.loyaltyDiscountCents>0&&<p>{en ? 'Loyalty card' : 'Carte fidélité'} : −{formatMoney(order.loyaltyDiscountCents)}</p>}{order.discountCents>0&&<p>{order.promotionName??(en?'Promotion':'Promotion')} : −{formatMoney(order.discountCents)}</p>}<p><strong>{en ? 'Total' : 'Total'} : {formatMoney(order.totalCents)}</strong></p>{order.creditAppliedCents>0&&<p>{en ? 'Store credit applied' : 'Avoir appliqué'} : {formatMoney(order.creditAppliedCents)}</p>}<p><strong>{en ? 'Paid online' : 'Payé en ligne'} : {formatMoney(order.totalCents-order.creditAppliedCents)}</strong></p><p>{order.fulfillment === 'DELIVERY' ? (en ? 'Delivery · address provided to the restaurant' : 'Livraison · adresse communiquée au restaurant') : (en ? 'Collection in person' : 'Retrait sur place')}{order.scheduledFor ? ` · ${order.scheduledFor.toLocaleString(en?'en-BE':'fr-BE',{timeZone:'Europe/Brussels',dateStyle:'short',timeStyle:'short'})}` : ''}</p><Link href="/menu">{en ? 'Back to menu' : 'Retour à la carte'}</Link></main>;
}
