'use client';
import { useState } from 'react';
import { parseEuroCents } from '../../../lib/catalog-management.mjs';
import type { ManagerProduct } from '../../../lib/catalog-management.mjs';

export type PizzaCategory = { id: string; nameFr: string; nameEn: string; fulfillmentCategory: 'PIZZA' | 'PASTA' | 'OTHER'; position: number };
export default function PizzaCreator({ categories, ingredientChoices, onCreated }: { categories: PizzaCategory[]; ingredientChoices: string[]; onCreated: (product: ManagerProduct) => void }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [nameFr, setNameFr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [price, setPrice] = useState('');
  const [sizeLines, setSizeLines] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientsText, setIngredientsText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isPizza = categories.find(category => category.id === categoryId)?.fulfillmentCategory === 'PIZZA';
  const choices = [...new Set([...ingredientChoices, ...ingredients])].sort((a, b) => a.localeCompare(b, 'fr'));
  function toggleIngredient(name: string) { setIngredients(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name]); }
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (isPizza && ingredients.length === 0) { setError('Cochez au moins un ingrédient pour cette pizza.'); return; }
    let baseCents: number;
    let parsedSizes: Array<{ label: string; priceCents: number }> = [];
    try {
      baseCents = price.trim() ? parseEuroCents(price) : 0;
      const sizes = sizeLines.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
        const [label, amount, ...rest] = line.split('=');
        if (!label?.trim() || !amount || rest.length) throw new Error();
        return { label: label.trim(), priceCents: parseEuroCents(amount.trim()) };
      });
      if (!sizes.length && baseCents <= 0) throw new Error();
      if (sizes.length > 12 || new Set(sizes.map(size => size.label)).size !== sizes.length) throw new Error();
      parsedSizes = sizes;
    } catch { setError('Renseignez un prix de base ou des formats au format « 33 cm=12,00 ».'); return; }
    const body = { categoryId, nameFr: nameFr.trim(), nameEn: nameEn.trim() || nameFr.trim(), baseCents, ingredients: isPizza ? ingredients : ingredientsText.split('\n').map(value => value.trim()).filter(Boolean), removableIngredients: isPizza ? ingredients : [], sizes: parsedSizes };
    setBusy(true);
    try {
      const response = await fetch('/api/manager/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) { setError(response.status === 403 ? 'Une session gérant valide est nécessaire.' : 'Création refusée. Vérifiez le nom, la catégorie et les ingrédients.'); return; }
      const result = await response.json() as { product: ManagerProduct };
      setNameFr(''); setNameEn(''); setPrice(''); setSizeLines(''); setIngredients([]); setIngredientsText('');
      onCreated(result.product);
    } catch { setError('Connexion interrompue. Rechargez la carte pour vérifier si le brouillon a été créé.'); }
    finally { setBusy(false); }
  }
  return <details className="manager-creator"><summary>Ajouter un plat</summary>
    {!categories.length ? <p>Créez d’abord une catégorie.</p> : <form onSubmit={create}><fieldset disabled={busy}><legend>Nouveau plat</legend><p>Le plat est créé en brouillon. Vous pourrez ajouter ses formats et suppléments avant de le publier.</p>
      <label>Catégorie<select required value={categoryId} onChange={event => setCategoryId(event.target.value)}>{categories.map(category => <option key={category.id} value={category.id}>{category.nameFr}</option>)}</select></label>
      <label>Nom du plat<input required maxLength={128} value={nameFr} onChange={event => setNameFr(event.target.value)} /></label>
      <label>Nom anglais (facultatif)<input maxLength={128} value={nameEn} onChange={event => setNameEn(event.target.value)} /></label>
      <label>Prix (€), si le plat n’a pas de formats<input inputMode="decimal" value={price} onChange={event => setPrice(event.target.value)} /></label>
      <label>Formats et prix (un par ligne : 33 cm=12,00)<textarea rows={3} value={sizeLines} onChange={event => setSizeLines(event.target.value)} /></label>
      {isPizza ? <fieldset><legend>Ingrédients de la pizza</legend><p>Cochez sa composition : le client pourra retirer ces ingrédients ou en ajouter une portion supplémentaire depuis le catalogue.</p>{choices.length ? choices.map(ingredient => <label className="manager-check" key={ingredient}><input type="checkbox" checked={ingredients.includes(ingredient)} onChange={() => toggleIngredient(ingredient)} />{ingredient}</label>) : <p>Ajoutez d’abord les ingrédients dans le catalogue central ci-dessus.</p>}</fieldset> : <label>Composition / ingrédients, un par ligne<textarea rows={4} value={ingredientsText} onChange={event => setIngredientsText(event.target.value)} /></label>}
      <button type="submit">{busy ? 'Création…' : 'Créer le brouillon'}</button>
    </fieldset>{error && <p role="alert">{error}</p>}</form>}
  </details>;
}
