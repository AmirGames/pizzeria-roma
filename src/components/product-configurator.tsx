'use client';

import { useId, useState } from 'react';
import { initializeCatalogSelection } from '../lib/catalog-selection.mjs';
import type { CatalogProduct } from '../lib/catalog-types';
import type { CatalogCartLine } from '../lib/catalog-cart.mjs';
function euros(cents: number) { return new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100); }

export default function ProductConfigurator({ product, initial, onSubmit, submitLabel = 'Ajouter au panier', busy = false }: {
  product: CatalogProduct;
  initial?: CatalogCartLine;
  onSubmit: (line: Omit<CatalogCartLine, 'quantity'>) => void;
  submitLabel?: string;
  busy?: boolean;
}) {
  const groupId = useId();
  const [defaults] = useState(() => initializeCatalogSelection(product, initial));
  const [sizeId, setSizeId] = useState(defaults.sizeId);
  const [extraIds, setExtraIds] = useState<string[]>(defaults.extraIds);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>(defaults.removedIngredients);
  const availableExtras = product.extras.filter(extra => !extra.sizePrices || Object.hasOwn(extra.sizePrices, sizeId));
  const includedIngredients = new Set((product.ingredients ?? []).map(name => name.toLocaleLowerCase('fr')));
  const extraPrice = (extra: CatalogProduct['extras'][number]) => extra.sizePrices ? extra.sizePrices[sizeId] : extra.priceCents;
  const unitCents = (product.sizes.find(size => size.id === sizeId)?.priceCents ?? product.baseCents) + availableExtras.filter(extra => extraIds.includes(extra.id)).reduce((sum, extra) => sum + extraPrice(extra), 0);
  function toggleExtra(id: string) {
    setExtraIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }
  return <fieldset className="product-configurator" disabled={busy}>
    <legend>{product.nameFr}</legend>
    {defaults.changed && <p role="status">La carte a changé. Les choix indisponibles ont été retirés de cet aperçu. Vérifiez votre recette avant de l’enregistrer.</p>}
    {product.sizes.length > 0 ? <>
      <label className="catalog-option">{product.choiceLabel ?? 'Format'}<select value={sizeId} onChange={event => { setSizeId(event.target.value); setExtraIds(current => current.filter(id => product.extras.some(extra => extra.id === id && (!extra.sizePrices || Object.hasOwn(extra.sizePrices, event.target.value))))); }}>
        {product.sizes.map(size => <option key={size.id} value={size.id}>{size.label} · {euros(size.priceCents)}</option>)}
      </select></label>
    </> : <p>{euros(product.baseCents)}</p>}
    {product.removableIngredients !== undefined && <>
      {product.removableIngredients.length > 0 ? <fieldset className="catalog-extra-options"><legend>Retirer des ingrédients</legend>
        <p>Le retrait ne réduit pas le prix de la pizza.</p>
        {product.removableIngredients.map(ingredient => <label key={ingredient}><input type="checkbox" checked={removedIngredients.includes(ingredient)} onChange={() => { setRemovedIngredients(current => current.includes(ingredient) ? current.filter(item => item !== ingredient) : [...current, ingredient]); }} /> Sans {ingredient}</label>)}
      </fieldset> : <p>La composition de cette pizza sera bientôt disponible pour choisir les ingrédients à retirer.</p>}
      {availableExtras.length === 0 && <p>Aucun supplément disponible pour ce format.</p>}
    </>}
    {availableExtras.length > 0 && <fieldset className="catalog-extra-options"><legend>{product.extraSelectionMode === 'SINGLE' ? 'Supplément (au choix)' : 'Suppléments'}</legend>
        {product.extraSelectionMode === 'SINGLE' ? <>
        <label><input type="radio" name={`extras-${groupId}`} checked={extraIds.length === 0} onChange={() => { setExtraIds([]); }} /> Aucun</label>
        {availableExtras.map(extra => <label key={extra.id}><input type="radio" name={`extras-${groupId}`} checked={extraIds[0] === extra.id} onChange={() => { setExtraIds([extra.id]); }} /> {extra.nameFr}{includedIngredients.has(extra.nameFr.toLocaleLowerCase('fr')) ? ' — déjà inclus, portion en plus' : ''} (+{euros(extraPrice(extra))})</label>)}
      </> : availableExtras.map(extra =>
        <label key={extra.id}><input type="checkbox" checked={extraIds.includes(extra.id)} onChange={() => toggleExtra(extra.id)} /> {extra.nameFr}{includedIngredients.has(extra.nameFr.toLocaleLowerCase('fr')) ? ' — déjà inclus, portion en plus' : ''} (+{euros(extraPrice(extra))})</label>
      )}
    </fieldset>}
    <p aria-live="polite"><strong>Prix : {euros(unitCents)}</strong></p>
    <button className="catalog-add" type="button" disabled={product.sizes.length > 0 && !product.sizes.some(size => size.id === sizeId)} onClick={() => { onSubmit({ productId: product.id, ...(sizeId ? { sizeId } : {}), extraIds, removedIngredients }); }}>
      {busy ? 'Vérification…' : submitLabel}
    </button>
  </fieldset>;
}
