'use client';
import { useEffect,useState } from 'react';
import type { SiteLocale } from '../../../lib/locale';

export default function CancelCheckout({reference,locale='fr'}:{reference:string|null;locale?:SiteLocale}){
  const en=locale==='en';
  const [message,setMessage]=useState('');
  useEffect(()=>{if(!reference)return;let active=true;fetch('/api/orders/cancel-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reference})}).then(r=>{if(active)setMessage(r.ok?(en?'The payment attempt was cancelled. You can try again.':'La tentative de paiement est annulée. Vous pouvez recommencer.'):(en?'The payment session is still closing. Please wait a moment before trying again.':'La fermeture du paiement est en cours. Évitez de relancer le paiement pendant quelques instants.'));}).catch(()=>{if(active)setMessage(en?'The payment session is still closing. Please wait a moment before trying again.':'La fermeture du paiement est en cours. Évitez de relancer le paiement pendant quelques instants.');});return()=>{active=false};},[reference,en]);
  return message?<p role="status">{message}</p>:<p role="status">{en?'Closing payment session…':'Fermeture de la session de paiement…'}</p>;
}
