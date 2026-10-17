'use client';

import { useState } from 'react';
import PizzaCreator from './pizza-creator';
import type { PizzaCategory } from './pizza-creator';
import { parseEuroCents } from '../../../lib/catalog-management.mjs';
import type { ManagerProduct } from '../../../lib/catalog-management.mjs';

type ExtraDraft = { id?: string; nameFr: string; price: string; active: boolean; bySize: boolean; sizePrices: Record<string, string> };
type Category = { id: string; nameFr: string; nameEn: string; fulfillmentCategory: 'PIZZA' | 'PASTA' | 'OTHER'; position: number };
type Ingredient = { id: string; nameFr: string; nameEn: string; price33Cents: number; price50Cents: number; active: boolean };
const euroInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
const normalizeName = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');

function ProductEditor({ product, categories, ingredientChoices, onSaved, onDirty }: { product: ManagerProduct; categories: Category[]; ingredientChoices: string[]; onSaved: (product: ManagerProduct) => void; onDirty: () => void }) {
  const [nameFr, setNameFr] = useState(product.nameFr);
  const [nameEn, setNameEn] = useState(product.nameEn);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [active, setActive] = useState(product.active);
  const [basePrice, setBasePrice] = useState(euroInput(product.baseCents));
  const [composition, setComposition] = useState((product.ingredients ?? []).join('\n'));
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([...new Set([...(product.ingredients ?? []), ...product.removableIngredients])]);
  const [sizes, setSizes] = useState(product.sizes.map(size => ({ ...size, price: euroInput(size.priceCents) })));
  const [extras, setExtras] = useState<ExtraDraft[]>(product.extras.map(extra => ({
    id: extra.id, nameFr: extra.nameFr, price: euroInput(extra.priceCents), active: extra.active,
    bySize: extra.sizePrices != null,
    sizePrices: Object.fromEntries(Object.entries((extra.sizePrices ?? {}) as Record<string, number>).map(([id, price]) => [id, euroInput(price)])),
  })));
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const isPizza = categories.find(category => category.id === categoryId)?.fulfillmentCategory === 'PIZZA';
  const choices = [...new Set([...ingredientChoices, ...selectedIngredients])].sort((a, b) => a.localeCompare(b, 'fr'));
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
        revision: product.catalogRevision, categoryId, nameFr: nameFr.trim(), nameEn: nameEn.trim() || nameFr.trim(), active, baseCents: parseEuroCents(basePrice),
        ingredients: isPizza ? selectedIngredients : composition.split('\n').map(value => value.trim()).filter(Boolean),
        removableIngredients: isPizza ? selectedIngredients : [],
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
      event.currentTarget.dataset.dirty = 'false';
      onSaved(result.product);
    } catch { setStatus('La connexion a été interrompue. Rechargez la page pour vérifier si les changements ont été enregistrés.'); }
    finally { setSaving(false); }
  }
  return <form className="manager-product" onChange={event => { event.currentTarget.dataset.dirty = 'true'; onDirty(); }} onClick={event => { if (event.target instanceof Element && event.target.closest('button[type="button"]')) { event.currentTarget.dataset.dirty = 'true'; onDirty(); } }} onSubmit={save}>
    <header className="manager-product-heading"><div><p>Fiche du plat</p><h2>{product.nameFr}</h2><span>Modifiez les champs, puis enregistrez pour publier.</span></div><span className={`manager-product-state${active ? ' is-active' : ''}`}>{active ? 'Visible sur le site' : 'Masqué aux clients'}</span></header>
    <fieldset disabled={saving}><legend>Informations principales</legend>
      <label>Nom affiché sur le menu<input required maxLength={128} value={nameFr} onChange={event => setNameFr(event.target.value)} /></label>
      <label>Catégorie<select value={categoryId} onChange={event => setCategoryId(event.target.value)}>{categories.map(category => <option key={category.id} value={category.id}>{category.nameFr}</option>)}</select></label>
      <label className="manager-check"><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} /> Afficher ce plat sur le site</label>
      <p className="manager-help">Si vous décochez cette case, le plat sera simplement masqué. Il ne sera pas supprimé.</p>
      {sizes.length === 0 && <label>Prix de vente (€)<input required inputMode="decimal" value={basePrice} onChange={event => setBasePrice(event.target.value)} /><small>Exemple : 12,50</small></label>}
      {sizes.length > 0 && <fieldset><legend>Formats et prix</legend><p className="manager-help">Chaque format et son prix sont affichés séparément au client.</p>{sizes.map((size, index) => <div className="manager-size" key={size.id}>
        <label>{size.label} · prix (€)<input required inputMode="decimal" value={size.price} onChange={event => setSizes(current => current.map((item, i) => i === index ? { ...item, price: event.target.value } : item))} /></label>
        <label className="manager-check"><input type="checkbox" checked={size.active} onChange={event => setSizes(current => current.map((item, i) => i === index ? { ...item, active: event.target.checked } : item))} /> Proposer ce format</label>
      </div>)}</fieldset>}
      <details className="manager-advanced"><summary>Nom en anglais (facultatif)</summary><label>Nom anglais<input maxLength={128} value={nameEn} onChange={event => setNameEn(event.target.value)} /></label></details>
      {isPizza ? <fieldset><legend>Ingrédients de la pizza</legend><p className="manager-help">Cochez les ingrédients présents. Le client pourra demander à en retirer ou à en ajouter.</p><div className="manager-ingredient-checks">{choices.map(ingredient => <label className="manager-check" key={ingredient}><input type="checkbox" checked={selectedIngredients.includes(ingredient)} onChange={() => setSelectedIngredients(current => current.includes(ingredient) ? current.filter(item => item !== ingredient) : [...current, ingredient])} />{ingredient}</label>)}</div></fieldset> : <label>Ingrédients affichés au client (un par ligne)<textarea rows={5} value={composition} onChange={event => setComposition(event.target.value)} /><small>Écrivez un ingrédient par ligne.</small></label>}
      <fieldset><legend>Suppléments proposés</legend><p className="manager-help">Ajoutez, masquez ou modifiez le prix des suppléments que le client peut choisir.</p>
        {extras.map((extra, index) => <fieldset key={extra.id ?? `new-${index}`}><legend>Supplément {index + 1}</legend>
          <label>Nom<input required maxLength={128} value={extra.nameFr} onChange={event => updateExtra(index, { nameFr: event.target.value })} /></label>
          <label className="manager-check"><input type="checkbox" checked={extra.active} onChange={event => updateExtra(index, { active: event.target.checked })} /> Disponible</label>
          {isPizza && sizes.length > 0 && <label className="manager-check"><input type="checkbox" checked={extra.bySize} onChange={event => updateExtra(index, { bySize: event.target.checked })} /> Prix selon le format</label>}
          {extra.bySize ? <><p>Laissez vide pour ne pas proposer ce supplément dans un format. Renseignez au moins un prix.</p>{sizes.map(size => <label key={size.id}>{size.label} (€)<input inputMode="decimal" value={extra.sizePrices[size.id] ?? ''} onChange={event => updateExtra(index, { sizePrices: { ...extra.sizePrices, [size.id]: event.target.value } })} /></label>)}</> : <label>Prix du supplément (€)<input required inputMode="decimal" value={extra.price} onChange={event => updateExtra(index, { price: event.target.value })} /></label>}
          <button type="button" onClick={() => setExtras(current => current.filter((_, i) => i !== index))}>Retirer ce supplément de la carte</button>
        </fieldset>)}
        <button type="button" disabled={extras.length >= 20} onClick={() => setExtras(current => [...current, { nameFr: '', price: '0,00', active: false, bySize: isPizza && sizes.length > 0, sizePrices: {} }])}>Ajouter un supplément</button>
      </fieldset>
      <button className="catalog-add" type="submit">{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</button>
    </fieldset>
    {status && <p role="alert">{status}</p>}
  </form>;
}

function IngredientEditor({ initialIngredients, onSaved }: { initialIngredients: Ingredient[]; onSaved: (ingredients: Ingredient[]) => void }) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, { price33: string; price50: string }>>({});
  const [draft, setDraft] = useState({ nameFr: '', nameEn: '', price33: '1,50', price50: '3,00' });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  function update(id: string, change: Partial<Ingredient>) { setIngredients(current => current.map(item => item.id === id ? { ...item, ...change } : item)); }
  async function save(item: Ingredient) {
    setBusy(true); setStatus('');
    try {
      const draftPrices = priceDrafts[item.id];
      const body = { nameFr: item.nameFr, nameEn: item.nameEn, active: item.active, price33Cents: draftPrices ? parseEuroCents(draftPrices.price33) : item.price33Cents, price50Cents: draftPrices ? parseEuroCents(draftPrices.price50) : item.price50Cents };
      const response = await fetch(`/api/manager/ingredients/${encodeURIComponent(item.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error();
      const result = await response.json() as { ingredient: Ingredient };
      const next = ingredients.map(current => current.id === item.id ? result.ingredient : current).sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr'));
      setIngredients(next); onSaved(next); setPriceDrafts(current => { const copy = { ...current }; delete copy[item.id]; return copy; }); setStatus('Ingrédient enregistré.');
    } catch { setStatus('Enregistrement impossible. Vérifiez les prix et votre session gérant.'); }
    finally { setBusy(false); }
  }
  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    let price33Cents: number; let price50Cents: number;
    try { price33Cents = parseEuroCents(draft.price33); price50Cents = parseEuroCents(draft.price50); } catch { setStatus('Vérifiez les prix des suppléments.'); return; }
    setBusy(true); setStatus('');
    try {
      const body = { nameFr: draft.nameFr.trim(), nameEn: draft.nameEn.trim() || draft.nameFr.trim(), price33Cents, price50Cents, active: true };
      const response = await fetch('/api/manager/ingredients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error();
      const result = await response.json() as { ingredient: Ingredient };
      const next = [...ingredients, result.ingredient].sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr'));
      setIngredients(next); onSaved(next); setDraft({ nameFr: '', nameEn: '', price33: '1,50', price50: '3,00' }); setStatus('Ingrédient ajouté au catalogue central.');
    } catch { setStatus('Création impossible. Vérifiez le nom et votre session gérant.'); }
    finally { setBusy(false); }
  }
  return <details className="manager-creator"><summary id="ingredients">Gérer les ingrédients et suppléments ({ingredients.length})</summary><p>Les ingrédients cochés ici peuvent être proposés en supplément sur les pizzas. Les prix peuvent varier selon le format.</p>
    {ingredients.map(item => <fieldset className="manager-ingredient-row" key={item.id}><legend>{item.nameFr}</legend><label>Nom<input value={item.nameFr} maxLength={128} disabled={busy} onChange={event => update(item.id, { nameFr: event.target.value })} /></label><label>Nom anglais<input value={item.nameEn} maxLength={128} disabled={busy} onChange={event => update(item.id, { nameEn: event.target.value })} /></label><label>Supplément 33 cm (€)<input inputMode="decimal" value={priceDrafts[item.id]?.price33 ?? euroInput(item.price33Cents)} disabled={busy} onChange={event => setPriceDrafts(current => ({ ...current, [item.id]: { price33: event.target.value, price50: current[item.id]?.price50 ?? euroInput(item.price50Cents) } }))} /></label><label>Supplément 50 cm (€)<input inputMode="decimal" value={priceDrafts[item.id]?.price50 ?? euroInput(item.price50Cents)} disabled={busy} onChange={event => setPriceDrafts(current => ({ ...current, [item.id]: { price33: current[item.id]?.price33 ?? euroInput(item.price33Cents), price50: event.target.value } }))} /></label><label className="manager-check"><input type="checkbox" checked={item.active} disabled={busy} onChange={event => update(item.id, { active: event.target.checked })} /> Proposé en supplément</label><button type="button" disabled={busy} onClick={() => void save(item)}>Enregistrer</button></fieldset>)}
    <form onSubmit={add}><fieldset disabled={busy}><legend>Ajouter un ingrédient</legend><label>Nom<input required maxLength={128} value={draft.nameFr} onChange={event => setDraft(current => ({ ...current, nameFr: event.target.value }))} /></label><label>Nom anglais (facultatif)<input maxLength={128} value={draft.nameEn} onChange={event => setDraft(current => ({ ...current, nameEn: event.target.value }))} /></label><label>Prix en supplément 33 cm (€)<input required inputMode="decimal" value={draft.price33} onChange={event => setDraft(current => ({ ...current, price33: event.target.value }))} /></label><label>Prix en supplément 50 cm (€)<input required inputMode="decimal" value={draft.price50} onChange={event => setDraft(current => ({ ...current, price50: event.target.value }))} /></label><button type="submit">Ajouter au catalogue central</button></fieldset></form>{status && <p role="status">{status}</p>}
  </details>;
}

function CategoryEditor({ initialCategories, onSaved }: { initialCategories: Category[]; onSaved: (categories: Category[]) => void }) {
  const [categories, setCategories] = useState(initialCategories);
  const [nameFr, setNameFr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [kind, setKind] = useState<Category['fulfillmentCategory']>('OTHER');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function saveCategory(category: Category) {
    setBusy(true); setStatus('');
    try {
      const response = await fetch(`/api/manager/categories/${encodeURIComponent(category.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(category) });
      if (!response.ok) throw new Error();
      const result = await response.json() as { category: Category };
      const next = categories.map(item => item.id === result.category.id ? result.category : item);
      setCategories(next); onSaved(next); setStatus('Catégorie enregistrée.');
    } catch { setStatus('Enregistrement impossible. Vérifiez votre session gérant puis réessayez.'); }
    finally { setBusy(false); }
  }
  async function addCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setStatus('');
    try {
      const body = { nameFr: nameFr.trim(), nameEn: nameEn.trim() || nameFr.trim(), fulfillmentCategory: kind, position: categories.length };
      const response = await fetch('/api/manager/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error();
      const result = await response.json() as { category: Category };
      const next = [...categories, result.category]; setCategories(next); onSaved(next); setNameFr(''); setNameEn(''); setStatus('Catégorie ajoutée.');
    } catch { setStatus('Création impossible. Vérifiez les champs et votre session gérant.'); }
    finally { setBusy(false); }
  }
  return <details className="manager-creator"><summary id="categories">Gérer les catégories ({categories.length})</summary>
    {categories.map((category, index) => <fieldset key={category.id}><legend>{category.nameFr}</legend><label>Nom<input value={category.nameFr} maxLength={128} onChange={event => setCategories(current => current.map((item, i) => i === index ? { ...item, nameFr: event.target.value } : item))} /></label><label>Nom anglais<input value={category.nameEn} maxLength={128} onChange={event => setCategories(current => current.map((item, i) => i === index ? { ...item, nameEn: event.target.value } : item))} /></label><label>Type<select value={category.fulfillmentCategory} onChange={event => setCategories(current => current.map((item, i) => i === index ? { ...item, fulfillmentCategory: event.target.value as Category['fulfillmentCategory'] } : item))}><option value="PIZZA">Pizzas</option><option value="PASTA">Pâtes</option><option value="OTHER">Autres plats</option></select></label><label>Ordre d’affichage<input type="number" min={0} max={10000} value={category.position} onChange={event => setCategories(current => current.map((item, i) => i === index ? { ...item, position: Number(event.target.value) } : item))} /></label><button type="button" disabled={busy} onClick={() => void saveCategory(category)}>Enregistrer cette catégorie</button></fieldset>)}
    <form onSubmit={addCategory}><fieldset disabled={busy}><legend>Ajouter une catégorie</legend><label>Nom<input required maxLength={128} value={nameFr} onChange={event => setNameFr(event.target.value)} /></label><label>Nom anglais (facultatif)<input maxLength={128} value={nameEn} onChange={event => setNameEn(event.target.value)} /></label><label>Type<select value={kind} onChange={event => setKind(event.target.value as Category['fulfillmentCategory'])}><option value="PIZZA">Pizzas</option><option value="PASTA">Pâtes</option><option value="OTHER">Autres plats</option></select></label><button type="submit">Ajouter la catégorie</button></fieldset></form>
    {status && <p role="status">{status}</p>}
  </details>;
}

export default function CatalogEditor({ initialProducts, initialCategories, initialIngredients }: { initialProducts: ManagerProduct[]; initialCategories: PizzaCategory[]; initialIngredients: Ingredient[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(initialProducts.find(product => normalizeName(product.nameFr) === 'margherita')?.id ?? initialProducts.find(product => product.category.fulfillmentCategory === 'PIZZA')?.id ?? initialProducts[0]?.id ?? '');
  const [logoutError, setLogoutError] = useState('');
  async function logout() {
    if (document.querySelector('.manager-product[data-dirty="true"]') && !window.confirm('Vos dernières modifications ne sont pas enregistrées. Quitter quand même ?')) return;
    try {
      const response = await fetch('/api/manager/session', { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error();
      window.location.replace('/gerant/connexion');
    } catch { setLogoutError('Déconnexion impossible. Réessayez.'); }
  }
  const [saved, setSaved] = useState('');
  const filteredProducts = products.filter(product => normalizeName(`${product.nameFr} ${product.category.nameFr}`).includes(normalizeName(search))).sort((a, b) => {
    const categoryOrder = (categories.find(category => category.id === a.categoryId)?.position ?? 0) - (categories.find(category => category.id === b.categoryId)?.position ?? 0);
    return categoryOrder || a.nameFr.localeCompare(b.nameFr, 'fr');
  });
  const selected = products.find(product => product.id === selectedId);
  const ingredientChoices = [...new Set([...ingredients.map(item => item.nameFr), ...products.filter(product => product.category.fulfillmentCategory === 'PIZZA').flatMap(product => product.ingredients ?? [])])].sort((a, b) => a.localeCompare(b, 'fr'));
  function chooseProduct(id: string) {
    if (id === selectedId) return;
    const dirty = document.querySelector<HTMLFormElement>('.manager-product[data-dirty="true"]');
    if (dirty && !window.confirm('Vous avez des modifications non enregistrées. Les abandonner et changer de plat ?')) return;
    setSelectedId(id);
    setSaved('');
  }
  return <section aria-label="Éditeur de carte">
    <div className="manager-catalog-topline"><p>Choisissez une action pour commencer. Les changements sur un plat ne sont visibles sur le site qu’après enregistrement.</p><button type="button" className="manager-logout-button" onClick={logout}>Se déconnecter</button></div>
    {logoutError && <p role="alert">{logoutError}</p>}
    <nav className="manager-catalog-shortcuts" aria-label="Actions de la carte">
      <a href="#products">Modifier un plat</a><a href="#add-product">Ajouter un plat</a><a href="#ingredients">Ingrédients et suppléments</a><a href="#categories">Catégories</a><a className="manager-catalog-preview" href="/menu" target="_blank" rel="noreferrer">Voir la carte du site ↗</a>
    </nav>
    <div className="manager-catalog-tools" id="products">
      <div><h2>Modifier un plat</h2><p>Recherchez un nom, sélectionnez-le, puis modifiez sa fiche.</p></div>
      <label className="manager-catalog-search">Rechercher dans la carte<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Ex. Margherita, pâtes…" /></label>
    </div>
    <p className="manager-catalog-count" role="status">{filteredProducts.length} plat(s) trouvé(s){search ? ` pour « ${search} »` : ''}.</p>
    <div className="manager-catalog-layout">
      <nav className="manager-product-picker" aria-label="Choisir un plat à modifier">
        {!filteredProducts.length ? <p>Aucun plat ne correspond. Essayez un autre nom.</p> : filteredProducts.map(product => <button type="button" className={product.id === selectedId ? 'is-selected' : ''} aria-pressed={product.id === selectedId} key={product.id} onClick={() => chooseProduct(product.id)}>
          <span><strong>{product.nameFr}</strong><small>{product.category.nameFr}</small></span><em className={product.active ? 'is-active' : ''}>{product.active ? 'En ligne' : 'Masqué'}</em>
        </button>)}
      </nav>
      <div className="manager-product-edit-area">
        {saved && <p className="manager-catalog-saved" role="status">✓ {saved}</p>}
        {selected ? <ProductEditor key={`${selected.id}-${selected.catalogRevision}`} product={selected} categories={categories} ingredientChoices={ingredientChoices} onDirty={() => setSaved('')} onSaved={updated => { setProducts(current => current.map(product => product.id === updated.id ? updated : product)); setSaved(updated.active ? 'Modifications enregistrées et visibles sur le site.' : 'Modifications enregistrées. Ce plat reste masqué aux clients.'); }} /> : <p>Aucun plat dans la carte.</p>}
      </div>
    </div>
    <div className="manager-catalog-secondary">
      <PizzaCreator categories={categories} ingredientChoices={ingredientChoices} onCreated={product => { setProducts(current => [...current, product]); setSelectedId(product.id); setSearch(''); setSaved('Brouillon créé. Complétez les formats et ingrédients, puis cochez « Afficher ce plat sur le site » pour le publier.'); }} />
      <IngredientEditor initialIngredients={ingredients} onSaved={nextIngredients => {
        const renamed = new Map(ingredients.filter(item => nextIngredients.some(next => next.id === item.id && next.nameFr !== item.nameFr)).map(item => [item.nameFr, nextIngredients.find(next => next.id === item.id)!.nameFr]));
        setIngredients(nextIngredients);
        if (renamed.size) setProducts(current => current.map(product => {
          const affected = (product.ingredients ?? []).some(name => renamed.has(name)) || product.removableIngredients.some(name => renamed.has(name));
          return { ...product, ingredients: (product.ingredients ?? []).map(name => renamed.get(name) ?? name), removableIngredients: product.removableIngredients.map(name => renamed.get(name) ?? name), catalogRevision: product.catalogRevision + (affected ? 1 : 0) };
        }));
      }} />
      <CategoryEditor initialCategories={categories} onSaved={nextCategories => { setCategories(nextCategories); setProducts(current => current.map(product => { const category = nextCategories.find(item => item.id === product.categoryId); return category ? { ...product, category: { nameFr: category.nameFr, fulfillmentCategory: category.fulfillmentCategory } } : product; })); }} />
    </div>
  </section>;
}
