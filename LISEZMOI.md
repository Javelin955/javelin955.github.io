# Livraison — salondelimaginaire.fr

## Où déposer les fichiers

À la racine du dépôt, en écrasant les existants :

```
index.html
linktree.html
mention_legale.html
exposants_gallery.js
exposants.json
sitemap.xml
robots.txt          (inchangé, fourni pour la complétude)
assets/
  ├── affiche_2026.webp            992 px  — hero desktop
  ├── affiche_2026_mobile.webp     600 px  — hero mobile
  ├── og_affiche_2026.jpg       1200×630  — partage réseaux sociaux
  ├── fond_parallaxe.webp                 — fond flouté (ex-PNG 227 ko)
  └── affiche_sans_details.webp           — fond du linktree
```

## Ce qu'il te reste à ajouter

**`font/mvboli.woff2`** — le seul fichier manquant. Le CSS déclare le WOFF2 en priorité avec repli sur ton `font/mvboli.ttf` existant, donc le site fonctionne déjà. Le WOFF2 fait environ trois fois moins lourd : conversion en 30 s sur cloudconvert.com/ttf-to-woff2.

**La version de l'affiche avec texte** — elle n'est pas arrivée dans la conversation. Elle n'est pas nécessaire au site (le titre du hero est du texte HTML), mais garde-la pour l'impression et les publications Instagram.

## Récapitulatif des corrections

### Bugs

- **Lightbox galerie** — le script ciblait `#gallery-grid`, un id inexistant, et sortait immédiatement. Les clics ouvraient le `.webp` en pleine page sans retour possible. Reconstruite : bouton fermer, flèches, `Échap`, `←`/`→`, balayage tactile, compteur, verrouillage du scroll, restitution du focus. Délégation sur toute la section `#galerie` : elle marchera pour ta galerie 2026 sans toucher au JS.
- **5 favicons en 404** — les chemins ne correspondaient à aucun fichier du dépôt.
- **Balise `</section>` orpheline** dans la section galerie.
- **Lien mort `#carte`** dans le pied de page.
- **`/mentions-legales.html`** — le fichier s'appelle `mention_legale.html`.
- **Ancre `#donnees`** référencée dans le menu des mentions légales mais jamais écrite.
- **`<script type="module">`** placé entre `</head>` et `<body>`.
- **Classe Tailwind générée en JS** (`border-[${COL.accent}]`) que le JIT du CDN ne compile pas de façon fiable — passée en style inline.
- **`exposants.json`** — antislashs Windows dans un chemin d'image.

### Conformité

- **Consent Mode v2** injecté avant les tags Google, mesure d'audience refusée par défaut.
- **Bandeau cookies** Accepter / Refuser, choix mémorisé.
- **Section Cookies des mentions légales** réécrite : elle affirmait n'utiliser que des cookies strictement nécessaires alors que GA4 et GTM tournaient sans consentement.
- **Section RGPD** ajoutée : responsable de traitement, données, base légale, droits, CNIL.

### SEO

- `<h1>` unique — la page d'accueil n'en avait aucun.
- Millésime harmonisé sur 2026 / Tome VIII (le `<title>` disait 2025, la description mélangeait les deux).
- Open Graph et Twitter Card complets, avec `og:image` pointant sur la carte 1200×630.
- Données structurées `schema.org/Event` : dates, lieu géolocalisé, entrée gratuite, organisateur.
- `<link rel="canonical">`.
- 52 `alt` descriptifs générés (ils étaient tous identiques).
- `sitemap.xml` complété avec `linktree.html`, `lastmod` et `priority`.

### Typographie

MV Boli sur les titres, Roboto sur le texte courant, sur les trois pages. More Sugar retiré. `font-weight: 400 !important` forcé sur les titres, sinon les classes `font-bold` de Tailwind fabriquent un faux gras baveux sur une manuscrite. Les `<strong>` restent en Roboto 700.

### Hero

L'affiche sans texte sert de support, le titre est du texte HTML positionné en pourcentages sur le parchemin (`left 32.4% / top 24.7%`, `37.3% × 24.7%`, mesuré sur l'original) et « TOME VIII » sur le panneau de bois. Typo en unités de conteneur (`cqw`) avec repli `clamp()` pour Safari 15. Bornée à `min(76vh, 720px)` sur desktop.

### Accessibilité

Lien d'évitement, `role="dialog"` et gestion du focus sur la lightbox, `aria-pressed` sur les onglets de galerie, navigation clavier du carrousel, `prefers-reduced-motion`, `rel="noopener"`, `-webkit-line-clamp`.

### Performance

Parallaxe throttlée en `requestAnimationFrame` (elle recalculait `offsetHeight` à chaque event de scroll), PNG convertis en WebP, `cache: 'no-store'` retiré du fetch JSON, flèches du carrousel repositionnées sur mobile.

## Points en attente

| # | Action | Détail |
|---|---|---|
| 1 | **Vérifier GTM** | GTM-TCWLZGKG et G-9X68M54NJ9 sont chargés tous les deux. Si GA4 est aussi configuré dans le conteneur, chaque visite est comptée en double. Je n'ai pas pu trancher sans accès. |
| 2 | **Relire le programme** | Je l'ai rempli à partir de ta section « À propos », pas de ton planning réel. Un `TODO` marque l'emplacement. |
| 3 | **Corriger le SIRET** | `902 / 146 / 489` n'est ni un SIREN (9 chiffres) ni un SIRET (14). |
| 4 | **Choisir la palette** | Trois jeux de couleurs coexistent : `index.html` (`#305a83`), `mention_legale.html` et `exposants_gallery.js` (`#0A5A83`), et ta charte (`#b2c884` / `#b38bb3` / `#4f4138` / `#a2c3d6`). Aucune n'est appliquée partout. Décision de direction artistique, je n'ai rien repeint. |
| 5 | **Vérifier le rendu MV Boli** | J'ai baissé les tailles de 10 % par précaution, mais contrôle que « l'Imaginaire » ne touche pas les bords du parchemin. |
| 6 | **Licence MV Boli** | Police propriétaire Microsoft, l'auto-hébergement `@font-face` n'est pas couvert par son contrat de licence. Risque faible pour un salon associatif. *Delius* ou *Short Stack* sont des équivalents libres. |
| 7 | **Exposants invisibles pour Google** | Les 21 fiches sont injectées en JS. Un bloc `<noscript>` statique les rendrait indexables — dis-moi si je le fais. |
| 8 | **Tailwind par CDN** | ~400 ko de JS et compilation à chaque chargement. À basculer sur un build après le salon, pas avant. |

L'audit détaillé est dans `AUDIT.md`.
