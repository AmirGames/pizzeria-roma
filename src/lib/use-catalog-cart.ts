'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { CATALOG_CART_STORAGE_KEY as STORAGE_KEY, readCatalogCart } from './catalog-cart.mjs';
import type { CatalogCartLine } from './catalog-cart.mjs';

export function useCatalogCart(): {
  items: CatalogCartLine[];
  setItems: Dispatch<SetStateAction<CatalogCartLine[]>>;
  ready: boolean;
} {
  const [items, setItems] = useState<CatalogCartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCatalogCart(window.localStorage.getItem(STORAGE_KEY)));
    setReady(true);
    function sync(event?: Event) {
      if (event instanceof StorageEvent && event.key !== STORAGE_KEY) return;
      setItems(readCatalogCart(window.localStorage.getItem(STORAGE_KEY)));
    }
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const updateItems = useCallback<Dispatch<SetStateAction<CatalogCartLine[]>>>(action => {
    setItems(action);
  }, []);

  return { items, setItems: updateItems, ready };
}
