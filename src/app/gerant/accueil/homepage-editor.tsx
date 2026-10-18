'use client';

import { useState } from 'react';

export type HomeContent = {
  eyebrow: string; title: string; intro: string; primaryLabel: string; secondaryLabel: string;
  heroImage: string; aboutTitle: string; aboutTextOne: string; aboutTextTwo: string;
  metaTitle: string; metaDescription: string; revision: number;
};

const fields: Array<{ key: keyof Omit<HomeContent, 'revision' | 'heroImage'>; label: string; multiline?: boolean }> = [
  { key: 'eyebrow', label: 'Petit texte au-dessus du titre' },
  { key: 'title', label: 'Grand titre', multiline: true },
  { key: 'intro', label: 'Texte de présentation', multiline: true },
  { key: 'primaryLabel', label: 'Texte du bouton principal' },
  { key: 'secondaryLabel', label: 'Texte du second bouton' },
  { key: 'aboutTitle', label: 'Titre de la section histoire' },
  { key: 'aboutTextOne', label: 'Premier paragraphe de la section histoire', multiline: true },
  { key: 'aboutTextTwo', label: 'Second paragraphe de la section histoire', multiline: true },
];

const heroImages = [
  { path: '/roma-hero.png', label: 'Photo principale (Roma)' },
  { path: '/pizza-hero.svg', label: 'Illustration pizza' },
  { path: '/roma-menu-banner.png', label: 'Bannière de la carte' },
  { path: '/roma-pizzas.webp', label: 'Pizzas' },
];

export default function HomepageEditor({ initialContent }: { initialContent: HomeContent }) {
  const [content, setContent] = useState(initialContent);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  function change(key: keyof HomeContent, value: string) {
    setContent(current => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/manager/homepage', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (response.status === 409) throw new Error('La page a été modifiée ailleurs. Actualisez-la avant de réessayer.');
      if (!response.ok) throw new Error('Impossible d’enregistrer. Vérifiez les champs et réessayez.');
      const result = await response.json() as { content: HomeContent };
      setContent(result.content); setMessage('Modifications publiées sur la page d’accueil.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erreur de connexion.'); }
    finally { setBusy(false); }
  }

  return <form className="homepage-editor" onSubmit={save}>
    <section aria-labelledby="homepage-hero-fields"><h2 id="homepage-hero-fields">Bandeau d’accueil</h2>
      <p>Modifiez les textes qui s’affichent en haut de la page d’accueil.</p>
      <div className="homepage-editor-fields">{fields.slice(0, 5).map(field => <label key={field.key}>{field.label}
        {field.multiline ? <textarea rows={field.key === 'title' ? 2 : 3} maxLength={field.key === 'title' ? 180 : field.key === 'intro' ? 500 : 80} value={content[field.key]} onChange={event => change(field.key, event.target.value)} required /> : <input maxLength={field.key === 'eyebrow' ? 80 : 60} value={content[field.key]} onChange={event => change(field.key, event.target.value)} required />}
      </label>)}</div>
      <label>Image de fond<select value={content.heroImage} onChange={event => change('heroImage', event.target.value)}>{heroImages.map(image => <option value={image.path} key={image.path}>{image.label}</option>)}</select></label>
      <div className="homepage-editor-preview" style={{ backgroundImage: `linear-gradient(90deg,#07110de8,#07110d30),url("${content.heroImage}")` }} aria-label="Aperçu de l’image sélectionnée"><span>Aperçu de l’image de fond</span></div>
    </section>
    <section aria-labelledby="homepage-about-fields"><h2 id="homepage-about-fields">Section « Notre histoire »</h2><p>Cette section apparaît plus bas sur la page d’accueil.</p>
      {fields.slice(5).map(field => <label key={field.key}>{field.label}<textarea rows={3} maxLength={field.key === 'aboutTitle' ? 180 : 500} value={content[field.key]} onChange={event => change(field.key, event.target.value)} required /></label>)}
    </section>
    <section aria-labelledby="homepage-seo-fields"><h2 id="homepage-seo-fields">Référencement Google</h2>
      <p>Ces textes peuvent apparaître dans les résultats de recherche. Le nom « Pizzeria Roma » est ajouté automatiquement au titre.</p>
      <label>Titre SEO<input maxLength={70} value={content.metaTitle} onChange={event => change('metaTitle', event.target.value)} required /></label>
      <label>Description SEO<textarea rows={3} maxLength={170} value={content.metaDescription} onChange={event => change('metaDescription', event.target.value)} required /></label>
    </section>
    <div className="customer-actions"><button type="submit" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer et publier'}</button><a href="/" target="_blank" rel="noreferrer">Voir le site</a></div>
    {message && <p role="status" aria-live="polite">{message}</p>}
  </form>;
}
