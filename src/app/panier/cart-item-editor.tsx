'use client';
import { useEffect, useRef, useState } from 'react';
import ProductConfigurator from '../../components/product-configurator';
import type { CatalogProduct } from '../../lib/catalog-types';
import type { CatalogCartLine } from '../../lib/catalog-cart.mjs';
import type { SiteLocale } from '../../lib/locale';
import { getMessages } from '../../i18n/messages';

export default function CartItemEditor({ original, onApply, onCancel, locale = 'fr' }: {
  original: CatalogCartLine;
  onApply: (original: CatalogCartLine, replacement: Omit<CatalogCartLine, 'quantity'>) => void;
  onCancel: () => void;
  locale?: SiteLocale;
}) {
  const t = getMessages(locale).cartEditor;
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
      if (!current) { setError(t.unavailable); return; }
      setProduct(current);
    }).catch(error => { if (error.name !== 'AbortError') setError(t.loadError); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); pending.current?.abort(); };
  }, [original.productId, locale]);

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
      if (!response.ok) { setError(t.validateError); return; }
      if (!controller.signal.aborted) onApply(original, line);
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error && error.message === 'CART_CHANGED' ? t.changedError : t.saveError);
    } finally { if (!controller.signal.aborted) { setBusy(false); pending.current = null; } }
  }

  return <section className="cart-item-editor" aria-labelledby="cart-editor-title">
    <h2 id="cart-editor-title" tabIndex={-1} ref={heading}>{t.title}</h2>
    <p>{t.appliesTo(original.quantity)}</p>
    {loading && <p role="status">{t.loading}</p>}
    {product && <ProductConfigurator product={product} initial={original} onSubmit={apply} submitLabel={t.save} busy={busy} locale={locale} />}
    {error && <p role="alert" className="roma-error">{error}</p>}
    <button type="button" onClick={onCancel}>{t.cancel}</button>
  </section>;
}
