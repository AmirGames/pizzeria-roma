'use client';

import { useId, useState } from 'react';
import { initializeCatalogSelection } from '../lib/catalog-selection.mjs';
import type { CatalogProduct } from '../lib/catalog-types';
import type { CatalogCartLine } from '../lib/catalog-cart.mjs';
import type { SiteLocale } from '../lib/locale';
// @ts-ignore JavaScript module
import { englishMenuTerm } from '../lib/menu-translation.mjs';
function euros(cents: number, locale: SiteLocale) { return new Intl.NumberFormat(locale === 'en' ? 'en-BE' : 'fr-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100); }
const MAX_SUPPLEMENT_SLOTS = 6;

export default function ProductConfigurator({ product, initial, onSubmit, submitLabel, busy = false, locale = 'fr' }: {
  product: CatalogProduct;
  initial?: CatalogCartLine;
  onSubmit: (line: Omit<CatalogCartLine, 'quantity'>) => void;
  submitLabel?: string;
  busy?: boolean;
  locale?: SiteLocale;
}) {
  const en = locale === 'en';
  const actionLabel = submitLabel ?? (en ? 'Add to cart' : 'Ajouter au panier');
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
    <legend>{en ? product.nameEn : product.nameFr}</legend>
    {supplementsChanged && <p role="status">{en ? 'The menu has changed. Unavailable choices or choices beyond six supplements were removed. Check your recipe before saving it.' : 'La carte a changé. Les choix indisponibles ou au-delà de six suppléments ont été retirés de cet aperçu. Vérifiez votre recette avant de l’enregistrer.'}</p>}
    {product.sizes.length > 0 ? <>
      <label className="catalog-option">{en ? product.choiceLabel ? 'Pasta type' : 'Size' : product.choiceLabel ?? 'Format'}<select value={sizeId} onChange={event => { setSizeId(event.target.value); setSupplementSelections(current => current.map(id => id && !product.extras.some(extra => extra.id === id && (!extra.sizePrices || Object.hasOwn(extra.sizePrices, event.target.value))) ? '' : id)); }}>
        {product.sizes.map(size => <option key={size.id} value={size.id}>{size.label} · {euros(size.priceCents, locale)}</option>)}
      </select></label>
    </> : <p>{euros(product.baseCents, locale)}</p>}
    {product.removableIngredients !== undefined && <>
      {product.removableIngredients.length > 0 ? <fieldset className="catalog-extra-options"><legend>{en ? 'Remove ingredients' : 'Retirer des ingrédients'}</legend>
        <p>{en ? 'Removing an ingredient does not reduce the price.' : 'Le retrait ne réduit pas le prix de la pizza.'}</p>
        {product.removableIngredients.map(ingredient => <label key={ingredient}><input type="checkbox" checked={removedIngredients.includes(ingredient)} onChange={() => { setRemovedIngredients(current => current.includes(ingredient) ? current.filter(item => item !== ingredient) : [...current, ingredient]); }} /> {en ? 'Without' : 'Sans'} {en ? englishMenuTerm(ingredient) : ingredient}</label>)}
      </fieldset> : <p>{en ? 'Ingredient choices for this pizza are not available yet.' : 'La composition de cette pizza sera bientôt disponible pour choisir les ingrédients à retirer.'}</p>}
      {availableExtras.length === 0 && <p>{en ? 'No extras are available for this size.' : 'Aucun supplément disponible pour ce format.'}</p>}
    </>}
    {availableExtras.length > 0 && <fieldset className="catalog-extra-options"><legend>{product.extraSelectionMode === 'SINGLE' ? (en ? 'Extra (choose one)' : 'Supplément (au choix)') : (en ? 'Extras (up to 6)' : 'Suppléments (jusqu’à 6)')}</legend>
      <div className="catalog-supplement-selects">
        {Array.from({ length: supplementSlots }, (_, slot) => {
          const selectedId = supplementSelections[slot] ?? '';
          const options = availableExtras.filter(extra => !extraIds.includes(extra.id) || extra.id === selectedId);
          return <label key={slot}>
            <span>{product.extraSelectionMode === 'SINGLE' ? (en ? 'Choose an extra' : 'Choisir un supplément') : `${en ? 'Extra' : 'Supplément'} ${slot + 1}`}</span>
            <select value={selectedId} onChange={event => chooseExtra(slot, event.target.value)} aria-label={product.extraSelectionMode === 'SINGLE' ? (en ? 'Choose an extra' : 'Choisir un supplément') : `${en ? 'Extra' : 'Supplément'} ${slot + 1}`}>
              <option value="">{en ? 'No extra' : 'Aucun supplément'}</option>
              {options.map(extra => <option key={extra.id} value={extra.id}>{en ? englishMenuTerm(extra.nameEn) : extra.nameFr}{includedIngredients.has(extra.nameFr.toLocaleLowerCase('fr')) ? (en ? ' — extra portion' : ' — portion en plus') : ''} (+{euros(extraPrice(extra), locale)})</option>)}
            </select>
          </label>;
        })}
      </div>
    </fieldset>}
    <p aria-live="polite"><strong>{en ? 'Price' : 'Prix'} : {euros(unitCents, locale)}</strong></p>
    <button className="catalog-add" type="button" disabled={product.sizes.length > 0 && !product.sizes.some(size => size.id === sizeId)} onClick={() => { onSubmit({ productId: product.id, ...(sizeId ? { sizeId } : {}), extraIds, removedIngredients }); }}>
      {busy ? (en ? 'Checking…' : 'Vérification…') : actionLabel}
    </button>
  </fieldset>;
}
