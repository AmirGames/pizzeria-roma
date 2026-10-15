'use client';
import { useState } from 'react';
import { parseEuroCents } from '../../../lib/catalog-management.mjs';
import type { ManagerProduct } from '../../../lib/catalog-management.mjs';

export type PizzaCategory = { id: string; nameFr: string };
export default function PizzaCreator({ categories, onCreated }: { categories: PizzaCategory[]; onCreated: (product: ManagerProduct) => void }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [name, setName] = useState('');
  const [price33, setPrice33] = useState('');
  const [maxi, setMaxi] = useState(false);
  const [price50, setPrice50] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    let body;
    try {
      body = { categoryId, nameFr: name.trim(), price33Cents: parseEuroCents(price33), ...(maxi ? { price50Cents: parseEuroCents(price50) } : {}), removableIngredients: ingredients.split('\n').map(value => value.trim()).filter(Boolean) };
    } catch { setError('Vérifiez les prix : au maximum deux décimales, sans montant négatif.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/manager/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) { setError(response.status === 403 ? 'Une session gérant valide est nécessaire.' : 'Création refusée. Vérifiez les champs et les ingrédients en double.'); return; }
      const result = await response.json() as { product: ManagerProduct };
      setName(''); setPrice33(''); setPrice50(''); setMaxi(false); setIngredients('');
      onCreated(result.product);
    } catch { setError('Connexion interrompue. Rechargez la carte pour vérifier si le brouillon a été créé avant de réessayer.'); }
    finally { setBusy(false); }
  }
  return <details className="manager-creator"><summary>Créer une nouvelle pizza</summary>
    {categories.length === 0 ? <p>Une catégorie pizzas doit être configurée avant de créer un article.</p> : <form onSubmit={create}><fieldset disabled={busy}><legend>Nouvelle pizza</legend>
      <p>La pizza sera créée en brouillon. Vous pourrez ensuite ajouter ses suppléments et la rendre disponible.</p>
      <label>Catégorie<select value={categoryId} onChange={event => setCategoryId(event.target.value)}>{categories.map(category => <option key={category.id} value={category.id}>{category.nameFr}</option>)}</select></label>
      <label>Nom<input required maxLength={128} value={name} onChange={event => setName(event.target.value)} /></label>
      <label>Prix en 33 cm (€)<input required inputMode="decimal" value={price33} onChange={event => setPrice33(event.target.value)} /></label>
      <label className="manager-check"><input type="checkbox" checked={maxi} onChange={event => setMaxi(event.target.checked)} /> Proposer aussi le format 50 cm</label>
      {maxi && <label>Prix en 50 cm (€)<input required inputMode="decimal" value={price50} onChange={event => setPrice50(event.target.value)} /></label>}
      <label>Ingrédients retirables, un par ligne<textarea rows={4} value={ingredients} onChange={event => setIngredients(event.target.value)} /></label>
      <button type="submit">{busy ? 'Création…' : 'Créer le brouillon'}</button>
    </fieldset>{error && <p role="alert">{error}</p>}</form>}
  </details>;
}
