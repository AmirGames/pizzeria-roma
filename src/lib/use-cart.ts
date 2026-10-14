'use client';

import { useEffect, useState } from 'react';
import type { CartLine } from './cart.mjs';
import { readCart } from './cart-storage.mjs';

export const CART_STORAGE_KEY = 'pizzeria-roma-demo-cart-v1';

export function useCart() {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setItems(readCart(window.localStorage.getItem(CART_STORAGE_KEY)));
    } catch {
      setItems([]);
    }
    setReady(true);

    function syncCart(event: StorageEvent) {
      if (event.key !== CART_STORAGE_KEY && event.key !== null) return;
      setItems(readCart(event.newValue));
    }
    window.addEventListener('storage', syncCart);
    return () => window.removeEventListener('storage', syncCart);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage is only a convenience for this local demonstration.
    }
  }, [items, ready]);

  return { items, setItems, ready };
}
