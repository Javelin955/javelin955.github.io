// exposants_gallery.js — carrousel 1/2/3 cartes, aléatoire, bouton "tout afficher", auto-fit des bios
const JSON_URL    = 'exposants.json';
const PATH_PREFIX = 'photo_exposant/';
const PAGE_SIZE   = 3;            // 3 cartes max par vue (1 en mobile, 2 en md, 3 en xl)

const COL = {
  blue:  '#0A5A83',
  beige: '#F2E8B3',
  green: '#163A30',
  accent:'#BBBF3B',
  brown: '#401E12',
};

// ---------- Helpers ----------
const basename = (p='') => String(p).split(/[/\\]+/).pop() || 'placeholder.jpg';
const toWebPhotoURL = (p) => PATH_PREFIX + basename(p);
const esc = (s='') => String(s)
  .replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;')
  .replaceAll("'",'&#39;');

function shuffle(arr) {
  const a = arr.slice();
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

// Renvoie une page de 'size' éléments en bouclant dans l'ordre donné
function pageFromBag(arr, start, size = PAGE_SIZE) {
  if (!arr.length) return [];
  const out = [];
  for (let i = 0; i < size; i++) {
    out.push(arr[(start + i) % arr.length]);
  }
  return out;
}


// ---------- Card renderer ----------
function renderCard(item){
  const { number, name='', role='', bio='', photo_path='' } = item;
  const photoURL = toWebPhotoURL(photo_path);

  return `
    <article class="relative card-box mx-auto bg-[#F2E8B3] text-[#163A30]
                   rounded-xl shadow-md p-4 sm:p-5 border-l-[10px]
                   border-[${COL.accent}] overflow-hidden">

      <!-- média -->
      <div class="relative mb-3 rounded-xl overflow-hidden bg-white/10 card-media">
        <img src="${esc(photoURL)}" alt="" aria-hidden="true"
             class="absolute inset-0 w-full h-full object-cover blur-md scale-110"
             onerror="this.style.display='none';"/>
        <div class="absolute inset-0 bg-black/10"></div>
        <img src="${esc(photoURL)}" alt="Photo de ${esc(name)}"
             class="absolute inset-0 w-full h-full object-contain p-2 sm:p-3"
             loading="lazy"
             onerror="this.onerror=null;this.src='${PATH_PREFIX}placeholder.jpg';"/>
      </div>

      <!-- textes (tailles basées sur --cw, ajustées ensuite par auto-fit) -->
      <h4 class="font-bold text-[#0A5A83] leading-tight"
          style="font-size:calc(var(--cw)*0.07); line-height:1.15;">${esc(name)}</h4>
      <p class="opacity-90" style="font-size:calc(var(--cw)*0.045); margin-top:.25rem;">
        ${esc(role)}
      </p>

      <div class="card-text" style="margin-top:.5rem;">
        <p class="bio-txt" style="font-size:calc(var(--cw)*0.043); line-height:1.45; margin:0;">
          ${esc(bio)}
        </p>
      </div>
    </article>
  `;
}

// ---------- Page layout (1 / 2 / 3 cartes en fonction du viewport) ----------
function pageHTML(page) {
  // une seule ligne ; gap proportionnel à --cw
  return `
    <div class="min-w-full flex justify-center items-stretch" style="gap:calc(var(--cw)*0.06);">
      ${page.map((it,i)=>{
        // visible: 1ère tjs ; 2e >= md ; 3e >= xl
        const vis = i===0 ? '' : (i===1 ? 'hidden md:block' : 'hidden xl:block');
        return `<div class="card-col ${vis}">${renderCard(it)}</div>`;
      }).join('')}
    </div>
  `;
}

// ---------- Auto-fit bio (agrandit/réduit la police pour remplir sans déborder) ----------
function fitBioInCard(cardEl) {
  const box = cardEl.querySelector('.card-text');
  const p   = cardEl.querySelector('.bio-txt');
  if (!box || !p) return;

  const root = getComputedStyle(document.documentElement);
  const cw   = parseFloat(root.getPropertyValue('--cw')) || 260;

  const MIN  = Math.max(11, cw * 0.036);  // borne basse lisible
  const MAX  = cw * 0.053;                // borne haute raisonnable
  const STEP = 0.5;

  let size = parseFloat(getComputedStyle(p).fontSize) || (cw * 0.043);
  size = Math.max(MIN, Math.min(MAX, size));
  p.style.fontSize = size + 'px';

  const maxH = box.clientHeight;

  // réduit si ça dépasse
  let guard = 120;
  while (p.scrollHeight > maxH && size > MIN && guard--){
    size -= STEP;
    p.style.fontSize = size + 'px';
  }
  // augmente si marge confortable
  guard = 120;
  while ((maxH - p.scrollHeight) > 10 && size < MAX && guard--){
    size += STEP;
    p.style.fontSize = size + 'px';
  }
}
function fitBiosIn(container){ container.querySelectorAll('.card-box').forEach(fitBioInCard); }
function debounce(fn,t=120){ let id; return (...a)=>{ clearTimeout(id); id=setTimeout(()=>fn(...a),t); }; }

// ---------- Data helpers ----------
function normalizeItems(raw){
  return raw.map((r, idx) => ({
    number: r.number ?? r.num ?? r.index ?? r['#'] ?? (idx+1),
    name:   r.name   ?? r.exposant ?? r.titre ?? r.Nom ?? r.nom ?? '',
    role:   r.role   ?? r.metier   ?? r.fonction ?? '',
    bio:    r.bio    ?? r.description ?? '',
    photo_path: r.photo_path ?? r.photo ?? r.image ?? r.visuel ?? '',
  }));
}

// évite les répétitions immédiates au sein de deux pages successives
function pickRandomPage(items, prevSet=new Set()){
  if (items.length <= PAGE_SIZE) return items.slice(0, PAGE_SIZE);

  const choice = [];
  const shuffled = shuffle(items);
  // d’abord ceux absents de la page précédente
  for (const it of shuffled){
    if (!prevSet.has(it.number) && choice.length < PAGE_SIZE) choice.push(it);
  }
  // si pas assez, on complète avec le reste
  if (choice.length < PAGE_SIZE){
    for (const it of shuffled){
      if (!choice.includes(it)) {
        choice.push(it);
        if (choice.length === PAGE_SIZE) break;
      }
    }
  }
  return choice.slice(0, PAGE_SIZE);
}

// ---------- Mount / Slide ----------
function mountInitial(page, trackEl){
  trackEl.innerHTML = pageHTML(page);
  fitBiosIn(trackEl);
}
// slide dir: 'next' | 'prev'
function onTransitionEndOnce(el){ return new Promise(res=>el.addEventListener('transitionend', res, {once:true})); }

async function slideTo(trackEl, nextPage, dir='next', duration=500){
  const current = trackEl.firstElementChild;

  const incoming = document.createElement('div');
  incoming.className = 'min-w-full flex justify-center items-stretch';
  incoming.setAttribute('style','gap:calc(var(--cw)*0.06);');
  incoming.innerHTML = nextPage.map((it,i)=>{
    const vis = i===0 ? '' : (i===1 ? 'hidden md:block' : 'hidden xl:block');
    return `<div class="card-col ${vis}">${renderCard(it)}</div>`;
  }).join('');

  if (dir==='next'){
    trackEl.appendChild(incoming);
    trackEl.style.transition='none'; trackEl.style.transform='translateX(0%)';
    void trackEl.offsetWidth;
    trackEl.style.transition=`transform ${duration}ms ease-out`;
    trackEl.style.transform='translateX(-100%)';
    await onTransitionEndOnce(trackEl);
    current.remove();
    trackEl.style.transition='none'; trackEl.style.transform='translateX(0%)';
    fitBiosIn(trackEl);
  } else {
    trackEl.insertBefore(incoming, current);
    trackEl.style.transition='none'; trackEl.style.transform='translateX(-100%)';
    void trackEl.offsetWidth;
    trackEl.style.transition=`transform ${duration}ms ease-out`;
    trackEl.style.transform='translateX(0%)';
    await onTransitionEndOnce(trackEl);
    current.nextElementSibling?.remove();
    trackEl.style.transition='none'; trackEl.style.transform='translateX(0%)';
    fitBiosIn(trackEl);
  }
}

// ---------- All view ----------
function mountAll(items, gridEl){
  gridEl.innerHTML = items.map(it => `
    <div class="card-box mx-auto">${renderCard(it)}</div>
  `).join('');
  fitBiosIn(gridEl);
}

function getStep(){
  if (window.matchMedia('(min-width:1280px)').matches) return 3; // xl et +
  if (window.matchMedia('(min-width:768px)').matches)  return 2; // md à < xl
  return 1;                                                     // mobile
}

// ---------- Init ----------
// --- remplace TOUTE ta fonction init() par ceci ---
async function init(){
  const res  = await fetch(JSON_URL, { cache: 'no-store' });
  const raw  = await res.json();
  const items= normalizeItems(raw);

  // DOM
  const track     = document.getElementById('carousel-track');
  const btnPrev   = document.getElementById('btn-prev');
  const btnNext   = document.getElementById('btn-next');
  const btnAll    = document.getElementById('btn-all');
  const allGrid   = document.getElementById('all-grid');
  const carousel  = document.getElementById('carousel');
  if (!track || !btnPrev || !btnNext || !btnAll || !allGrid || !carousel) return;

  // 1) Ordre tiré AU CHARGEMENT, une seule fois pour toute la session :
  const order = shuffle(items);   // tirage aléatoire unique
  let cursor  = 0;                // pointeur dans l'ordre (index de début de page)
  let current = pageFromBag(order, cursor); // 3 éléments logiques (1/2/3 visibles selon viewport)

  // 2) Montage initial
  mountInitial(current, track);

  // 3) Navigation infinie dans le MÊME ordre (wrap modulo)
  btnNext.addEventListener('click', async ()=>{
  const step = getStep();
  cursor = (cursor + step) % order.length;
  const nextPage = pageFromBag(order, cursor);
  await slideTo(track, nextPage, 'next', 500);
  current = nextPage;
});

  btnPrev.addEventListener('click', async ()=>{
  const step = getStep();
  cursor = (cursor - step + order.length) % order.length;
  const prevPage = pageFromBag(order, cursor);
  await slideTo(track, prevPage, 'prev', 500);
  current = prevPage;
});

  // 4) Afficher tous / Réduire (inchangé)
  btnAll.addEventListener('click', ()=>{
    const showingAll = !allGrid.classList.contains('hidden');
    if (!showingAll){
      mountAll(order, allGrid);      // on garde le MÊME ordre tiré au chargement
      allGrid.classList.remove('hidden');
      carousel.classList.add('hidden');
      btnAll.textContent = 'Réduire';
    } else {
      allGrid.classList.add('hidden');
      carousel.classList.remove('hidden');
      btnAll.textContent = 'Afficher tous les exposants';
      fitBiosIn(track);
    }
  });

  // 5) Re-fit sur resize (auto-fit bio)
  window.addEventListener('resize', debounce(()=>{
    if (!allGrid.classList.contains('hidden')) fitBiosIn(allGrid);
    else fitBiosIn(track);
  }, 150));
}

init();
