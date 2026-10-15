'use client';

import { useState } from 'react';
import { parseEuroCents } from '../../../lib/catalog-management.mjs';
import type { ManagerProduct } from '../../../lib/catalog-management.mjs';

type ExtraDraft = { id?: string; nameFr: string; price: string; active: boolean; bySize: boolean; sizePrices: Record<string, string> };
const euroInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

function ProductEditor({ product, onSaved }: { product: ManagerProduct; onSaved: (product: ManagerProduct) => void }) {
  const [nameFr, setNameFr] = useState(product.nameFr);
  const [active, setActive] = useState(product.active);
  const [basePrice, setBasePrice] = useState(euroInput(product.baseCents));
  const [ingredients, setIngredients] = useState(product.removableIngredients.join('\n'));
  const [sizes, setSizes] = useState(product.sizes.map(size => ({ ...size, price: euroInput(size.priceCents) })));
  const [extras, setExtras] = useState<ExtraDraft[]>(product.extras.map(extra => ({
    id: extra.id, nameFr: extra.nameFr, price: euroInput(extra.priceCents), active: extra.active,
    bySize: extra.sizePrices != null,
    sizePrices: Object.fromEntries(Object.entries((extra.sizePrices ?? {}) as Record<string, number>).map(([id, price]) => [id, euroInput(price)])),
  })));
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const isPizza = product.category.fulfillmentCategory === 'PIZZA';
  function updateExtra(index: number, update: Partial<ExtraDraft>) {
    setExtras(current => current.map((extra, i) => i === index ? { ...extra, ...update } : extra));
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setStatus('');
    let body;
    try {
      body = {
        revision: product.catalogRevision, nameFr: nameFr.trim(), active, baseCents: parseEuroCents(basePrice),
        removableIngredients: isPizza ? ingredients.split('\n').map(value => value.trim()).filter(Boolean) : [],
        sizes: sizes.map(size => ({ id: size.id, priceCents: parseEuroCents(size.price), active: size.active })),
        extras: extras.map(extra => ({ ...(extra.id ? { id: extra.id } : {}), nameFr: extra.nameFr.trim(), active: extra.active, priceCents: parseEuroCents(extra.price),
          sizePrices: extra.bySize ? Object.fromEntries(Object.entries(extra.sizePrices).filter(([, price]) => price.trim() !== '').map(([id, price]) => [id, parseEuroCents(price)])) : null })),
      };
    } catch { setStatus('Vérifiez les prix : utilisez un montant positif ou nul avec au maximum deux décimales.'); return; }
    setSaving(true);
    try {
      const response = await fetch(`/api/manager/products/${encodeURIComponent(product.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) {
        setStatus(response.status === 409 ? 'Cet article a été modifié ailleurs. Rechargez la page avant de recommencer.' : response.status === 403 ? 'Accès refusé. Une session gérant valide est nécessaire.' : 'Enregistrement refusé. Vérifiez les ingrédients, les prix et les formats disponibles.');
        return;
      }
      const result = await response.json() as { product: ManagerProduct };
      onSaved(result.product);
    } catch { setStatus('La connexion a été interrompue. Rechargez la page pour vérifier si les changements ont été enregistrés.'); }
    finally { setSaving(false); }
  }
  return <form className="manager-product" onSubmit={save}>
    <fieldset disabled={saving}><legend>{product.nameFr}</legend>
      <label>Nom de l’article<input required maxLength={128} value={nameFr} onChange={event => setNameFr(event.target.value)} /></label>
      <label className="manager-check"><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} /> Disponible sur la carte</label>
      {sizes.length === 0 && <label>Prix (€)<input required inputMode="decimal" value={basePrice} onChange={event => setBasePrice(event.target.value)} /></label>}
      {sizes.length > 0 && <fieldset><legend>Formats et prix</legend>{sizes.map((size, index) => <div className="manager-size" key={size.id}>
        <label>{size.label} (€)<input required inputMode="decimal" value={size.price} onChange={event => setSizes(current => current.map((item, i) => i === index ? { ...item, price: event.target.value } : item))} /></label>
        <label className="manager-check"><input type="checkbox" checked={size.active} onChange={event => setSizes(current => current.map((item, i) => i === index ? { ...item, active: event.target.checked } : item))} /> Disponible</label>
      </div>)}</fieldset>}
      {isPizza && <label>Ingrédients que le client peut retirer (un par ligne)<textarea rows={5} value={ingredients} onChange={event => setIngredients(event.target.value)} /><small>Un retrait ne réduit jamais le prix de la pizza.</small></label>}
      <fieldset><legend>Suppléments</legend>
        {extras.map((extra, index) => <fieldset key={extra.id ?? `new-${index}`}><legend>Supplément {index + 1}</legend>
          <label>Nom<input required maxLength={128} value={extra.nameFr} onChange={event => updateExtra(index, { nameFr: event.target.value })} /></label>
          <label className="manager-check"><input type="checkbox" checked={extra.active} onChange={event => updateExtra(index, { active: event.target.checked })} /> Disponible</label>
          {isPizza && <label className="manager-check"><input type="checkbox" checked={extra.bySize} onChange={event => updateExtra(index, { bySize: event.target.checked })} /> Prix selon le format</label>}
          {extra.bySize ? <><p>Laissez vide pour ne pas proposer ce supplément dans un format. Renseignez au moins un prix.</p>{sizes.map(size => <label key={size.id}>{size.label} (€)<input inputMode="decimal" value={extra.sizePrices[size.id] ?? ''} onChange={event => updateExtra(index, { sizePrices: { ...extra.sizePrices, [size.id]: event.target.value } })} /></label>)}</> : <label>Prix du supplément (€)<input required inputMode="decimal" value={extra.price} onChange={event => updateExtra(index, { price: event.target.value })} /></label>}
          <button type="button" onClick={() => setExtras(current => current.filter((_, i) => i !== index))}>Retirer ce supplément de la carte</button>
        </fieldset>)}
        <button type="button" disabled={extras.length >= 20} onClick={() => setExtras(current => [...current, { nameFr: '', price: '0,00', active: false, bySize: isPizza, sizePrices: {} }])}>Ajouter un supplément</button>
      </fieldset>
      <button className="catalog-add" type="submit">{saving ? 'Enregistrement…' : 'Enregistrer et publier cet article'}</button>
    </fieldset>
    {status && <p role="alert">{status}</p>}
  </form>;
}

export default function CatalogEditor({ initialProducts }: { initialProducts: ManagerProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id ?? '');
  const [logoutError, setLogoutError] = useState('');
  async function logout() {
    try {
      const response = await fetch('/api/manager/session', { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error();
      window.location.replace('/gerant/connexion');
    } catch { setLogoutError('Déconnexion impossible. Réessayez.'); }
  }
  const [saved, setSaved] = useState('');
  const selected = products.find(product => product.id === selectedId);
  return <section aria-label="Éditeur de carte">
    <button type="button" onClick={logout}>Se déconnecter</button>
    {logoutError && <p role="alert">{logoutError}</p>}
    <label>Article à modifier<select value={selectedId} onChange={event => { setSelectedId(event.target.value); setSaved(''); }}>
      {products.map(product => <option key={product.id} value={product.id}>{product.category.nameFr} — {product.nameFr}{product.active ? '' : ' (indisponible)'}</option>)}
    </select></label>
    <p role="status">{saved}</p>
    {selected ? <ProductEditor key={`${selected.id}-${selected.catalogRevision}`} product={selected} onSaved={updated => { setProducts(current => current.map(product => product.id === updated.id ? updated : product)); setSaved('Article enregistré. La carte a été mise à jour.'); }} /> : <p>Aucun article dans la carte.</p>}
  </section>;
}
