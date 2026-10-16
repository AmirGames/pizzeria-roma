'use client';

import { useId, useState } from 'react';
import { initializeCatalogSelection } from '../lib/catalog-selection.mjs';
import type { CatalogProduct } from '../lib/catalog-types';
import type { CatalogCartLine } from '../lib/catalog-cart.mjs';
function euros(cents: number) { return new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100); }
const MAX_SUPPLEMENT_SLOTS = 6;

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
  const [supplementSelections, setSupplementSelections] = useState<string[]>(() => [...defaults.extraIds.slice(0, MAX_SUPPLEMENT_SLOTS), ...Array(MAX_SUPPLEMENT_SLOTS).fill('')].slice(0, MAX_SUPPLEMENT_SLOTS));
  const extraIds = supplementSelections.filter(Boolean);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>(defaults.removedIngredients);
  const availableExtras = product.extras.filter(extra => !extra.sizePrices || Object.hasOwn(extra.sizePrices, sizeId));
  const includedIngredients = new Set((product.ingredients ?? []).map(name => name.toLocaleLowerCase('fr')));
  const extraPrice = (extra: CatalogProduct['extras'][number]) => extra.sizePrices ? extra.sizePrices[sizeId] : extra.priceCents;
  const unitCents = (product.sizes.find(size => size.id === sizeId)?.priceCents ?? product.baseCents) + availableExtras.filter(extra => extraIds.includes(extra.id)).reduce((sum, extra) => sum + extraPrice(extra), 0);
  const supplementsChanged = defaults.changed || defaults.extraIds.length > MAX_SUPPLEMENT_SLOTS;
  const supplementSlots = product.extraSelectionMode === 'SINGLE' ? 1 : MAX_SUPPLEMENT_SLOTS;
  function chooseExtra(slot: number, id: string) {
    setSupplementSelections(current => {
      const next = [...current];
      next[slot] = id;
      return next;
    });
  }
  return <fieldset className="product-configurator" disabled={busy}>
    <legend>{product.nameFr}</legend>
    {supplementsChanged && <p role="status">La carte a changé. Les choix indisponibles ou au-delà de six suppléments ont été retirés de cet aperçu. Vérifiez votre recette avant de l’enregistrer.</p>}
    {product.sizes.length > 0 ? <>
      <label className="catalog-option">{product.choiceLabel ?? 'Format'}<select value={sizeId} onChange={event => { setSizeId(event.target.value); setSupplementSelections(current => current.map(id => id && !product.extras.some(extra => extra.id === id && (!extra.sizePrices || Object.hasOwn(extra.sizePrices, event.target.value))) ? '' : id)); }}>
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
    {availableExtras.length > 0 && <fieldset className="catalog-extra-options"><legend>{product.extraSelectionMode === 'SINGLE' ? 'Supplément (au choix)' : 'Suppléments (jusqu’à 6)'}</legend>
      <div className="catalog-supplement-selects">
        {Array.from({ length: supplementSlots }, (_, slot) => {
          const selectedId = supplementSelections[slot] ?? '';
          const options = availableExtras.filter(extra => !extraIds.includes(extra.id) || extra.id === selectedId);
          return <label key={slot}>
            <span>{product.extraSelectionMode === 'SINGLE' ? 'Choisir un supplément' : `Supplément ${slot + 1}`}</span>
            <select value={selectedId} onChange={event => chooseExtra(slot, event.target.value)} aria-label={product.extraSelectionMode === 'SINGLE' ? 'Choisir un supplément' : `Supplément ${slot + 1}`}>
              <option value="">Aucun supplément</option>
              {options.map(extra => <option key={extra.id} value={extra.id}>{extra.nameFr}{includedIngredients.has(extra.nameFr.toLocaleLowerCase('fr')) ? ' — portion en plus' : ''} (+{euros(extraPrice(extra))})</option>)}
            </select>
          </label>;
        })}
      </div>
    </fieldset>}
    <p aria-live="polite"><strong>Prix : {euros(unitCents)}</strong></p>
    <button className="catalog-add" type="button" disabled={product.sizes.length > 0 && !product.sizes.some(size => size.id === sizeId)} onClick={() => { onSubmit({ productId: product.id, ...(sizeId ? { sizeId } : {}), extraIds, removedIngredients }); }}>
      {busy ? 'Vérification…' : submitLabel}
    </button>
  </fieldset>;
}
