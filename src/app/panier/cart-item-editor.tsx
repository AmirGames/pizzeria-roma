'use client';
import { useEffect, useRef, useState } from 'react';
import ProductConfigurator from '../../components/product-configurator';
import type { CatalogProduct } from '../../lib/catalog-types';
import type { CatalogCartLine } from '../../lib/catalog-cart.mjs';

export default function CartItemEditor({ original, onApply, onCancel }: {
  original: CatalogCartLine;
  onApply: (original: CatalogCartLine, replacement: Omit<CatalogCartLine, 'quantity'>) => void;
  onCancel: () => void;
}) {
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    const controller = new AbortController();
    fetch('/api/catalog', { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      return response.json() as Promise<{ categories: Array<{ products: CatalogProduct[] }> }>;
    }).then(catalog => {
      const current = catalog.categories.flatMap(category => category.products).find(item => item.id === original.productId);
      if (!current) { setError('Cet article n’est plus disponible sur la carte. Vous pouvez le supprimer du panier.'); return; }
      setProduct(current);
    }).catch(error => { if (error.name !== 'AbortError') setError('Impossible de charger les options. Fermez puis réessayez.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); pending.current?.abort(); };
  }, [original.productId]);

  async function apply(line: Omit<CatalogCartLine, 'quantity'>) {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/cart/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ ...line, quantity: original.quantity }], mode: 'pickup' }), signal: controller.signal,
      });
      if (!response.ok) { setError('La sélection ne peut pas être validée. La carte a peut-être changé : fermez puis réouvrez la modification.'); return; }
      if (!controller.signal.aborted) onApply(original, line);
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error && error.message === 'CART_CHANGED' ? 'Le panier a changé pendant la modification. Fermez puis réessayez.' : 'Impossible d’enregistrer cette recette. Vérifiez la connexion ou la quantité totale (99 maximum).');
    } finally { if (!controller.signal.aborted) { setBusy(false); pending.current = null; } }
  }

  return <section className="cart-item-editor" aria-labelledby="cart-editor-title">
    <h2 id="cart-editor-title" tabIndex={-1} ref={heading}>Modifier la recette</h2>
    <p>La modification s’applique aux {original.quantity} exemplaire(s) de cette ligne.</p>
    {loading && <p role="status">Chargement des options…</p>}
    {product && <ProductConfigurator product={product} initial={original} onSubmit={apply} submitLabel="Enregistrer la recette" busy={busy} />}
    {error && <p role="alert" className="roma-error">{error}</p>}
    <button type="button" onClick={onCancel}>Annuler</button>
  </section>;
}
