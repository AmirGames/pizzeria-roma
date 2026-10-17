'use client';
import { useEffect,useState } from 'react';

export default function CancelCheckout({reference}:{reference:string|null}){
  const [message,setMessage]=useState('');
  useEffect(()=>{if(!reference)return;let active=true;fetch('/api/orders/cancel-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reference})}).then(r=>{if(active)setMessage(r.ok?'La tentative de paiement est annulée. Vous pouvez recommencer.':'La fermeture du paiement est en cours. Évitez de relancer le paiement pendant quelques instants.');}).catch(()=>{if(active)setMessage('La fermeture du paiement est en cours. Évitez de relancer le paiement pendant quelques instants.');});return()=>{active=false};},[reference]);
  return message?<p role="status">{message}</p>:<p role="status">Fermeture de la session de paiement…</p>;
}
