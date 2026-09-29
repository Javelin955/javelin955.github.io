(() => {
  if (document.getElementById('prog-layout-css')) return;
  const st = document.createElement('style');
  st.id = 'prog-layout-css';
  st.textContent = `
    #programme-contenu [role="tabpanel"][hidden] { display: none !important; }
    .prog-jour { display: grid; gap: 1.5rem; align-items: start; }
    .prog-col { display: grid; gap: 1.5rem; align-content: start; }
    @media (min-width: 1024px) {
      .prog-jour { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    }
    @media (min-width: 1280px) {
      .prog-jour { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; }
      .prog-col { display: contents; }
    }
    #programme-contenu .prog-bloc { padding: 1rem 1.25rem; }
    #programme-contenu .prog-bloc h4 { font-size: 1.25rem; line-height: 1.2; }
    #programme-contenu .prog-bloc ul { margin-top: .5rem; }
    #programme-contenu .prog-item { padding: .35rem 0; gap: .15rem .5rem; font-size: .95rem; }
    #programme-contenu .prog-heure { font-size: .75rem; padding: .05rem .45rem; }
    #programme-contenu .prog-meta { font-size: .8rem; }
  `;
  document.head.appendChild(st);
})();

const esc = (s = '') => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function heure(it, bloc) {
  if (it.debut && it.fin) return `${it.debut} – ${it.fin}`;
  return '';
}

function renderItem(it, bloc) {
  const h = heure(it, bloc);
  const titre = it.exposant
    ? `<a href="#expo-${esc(it.exposant)}" class="prog-lien" data-exposant="${esc(it.exposant)}">${esc(it.titre)}</a>`
    : esc(it.titre);
  const meta = [
    it.lieu || '',
    it.places && !it.note ? `${it.places} places` : '',
    it.note || ''
  ].filter(Boolean).map(esc).join(' · ');
  return `
    <li class="prog-item">
      ${h ? `<span class="prog-heure">${esc(h)}</span>` : ''}
      <strong>${titre}</strong>
      ${meta ? `<span class="prog-meta">${meta}</span>` : ''}
    </li>`;
}

function renderBloc(bloc) {
  const sous = [bloc.horaire ? bloc.horaire.replace('-', ' – ') : '', bloc.lieu || ''].filter(Boolean).map(esc).join(' · ');
  return `
    <article class="prog-bloc">
      <h4 class="text-xl sm:text-2xl text-[var(--color-blue)]">${esc(bloc.titre)}</h4>
      ${sous ? `<p class="prog-meta mt-1">${sous}</p>` : ''}
      <ul class="mt-3">${bloc.items.map(it => renderItem(it, bloc)).join('')}</ul>
    </article>`;
}

function renderJour(jour, visible) {
  const [premier, ...autres] = jour.blocs;
  return `
    <div id="prog-${esc(jour.id)}" role="tabpanel" aria-labelledby="tab-${esc(jour.id)}"
         class="prog-jour" ${visible ? '' : 'hidden'}>
      <div class="prog-col">${premier ? renderBloc(premier) : ''}</div>
      <div class="prog-col">${autres.map(renderBloc).join('')}</div>
    </div>`;
}

function jourParDefaut(jours) {
  const d = new Date();
  if (d.getFullYear() === 2026 && d.getMonth() === 9 && d.getDate() === 4) {
    return jours.find(j => j.id === 'dimanche')?.id || jours[0].id;
  }
  return jours[0].id;
}

async function init() {
  const box = document.getElementById('programme-contenu');
  const tabs = [...document.querySelectorAll('.prog-tab')];
  if (!box) return;

  let data;
  try {
    const res = await fetch('programme.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
    if (!Array.isArray(data?.jours) || !data.jours.length) throw new Error('programme vide');
  } catch (err) {
    console.error('[programme] chargement impossible :', err);
    box.innerHTML = `<p class="prog-bloc">Le programme n’a pas pu être chargé. Retrouvez-le sur notre
      <a class="prog-lien" href="https://www.facebook.com/salondelimaginaire" target="_blank" rel="noopener">page Facebook</a>.</p>`;
    return;
  }

  const actif = jourParDefaut(data.jours);
  box.innerHTML = data.jours.map(j => renderJour(j, j.id === actif)).join('');

  const select = (id) => {
    tabs.forEach(t => t.setAttribute('aria-selected', String(t.id === `tab-${id}`)));
    box.querySelectorAll('[role="tabpanel"]').forEach(p => { p.hidden = p.id !== `prog-${id}`; });
  };
  select(actif);
  tabs.forEach(t => t.addEventListener('click', () => select(t.id.replace('tab-', ''))));

  box.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-exposant]');
    if (!a) return;
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('exposant:show', { detail: a.dataset.exposant }));
  });
}

init();
