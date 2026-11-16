// Progressive enhancement only: without this script every section is visible and static.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Navigation gets a glass background once the page scrolls.
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// The drafting grid draws itself in from different edges, as on the sign-in page.
const gridIntro = document.querySelector('.grid-intro');
if (gridIntro && !reduced) {
  const scene = gridIntro.closest('.scene').getBoundingClientRect();
  const spacing = 24;
  const tileWidth = Math.ceil(scene.width / 6 / spacing) * spacing;
  const tileHeight = Math.ceil(scene.height / 4 / spacing) * spacing;
  const directions = ['inset(0 100% 0 0)', 'inset(0 0 0 100%)', 'inset(100% 0 0 0)', 'inset(0 0 100% 0)'];
  const offset = Math.floor(Math.random() * directions.length);
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 6; column++) {
      const section = document.createElement('div');
      section.className = 'grid-section';
      Object.assign(section.style, {
        left: `${column * tileWidth}px`, top: `${row * tileHeight}px`,
        width: `${tileWidth}px`, height: `${tileHeight}px`, backgroundSize: `${spacing}px ${spacing}px`,
      });
      section.style.setProperty('--start', directions[(row * 3 + column + offset) % directions.length]);
      section.style.setProperty('--delay', `${Math.random() * 0.12}s`);
      gridIntro.append(section);
    }
  }
  gridIntro.addEventListener('animationend', (event) => { if (event.target === gridIntro) gridIntro.remove(); });
} else if (gridIntro) {
  gridIntro.remove();
}

// Stagger siblings that reveal together.
for (const el of document.querySelectorAll('[data-reveal]')) {
  const group = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
  if (group.length > 1) el.style.setProperty('--d', `${group.indexOf(el) * 0.08}s`);
}

const reveal = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const el = entry.target;
    el.classList.add('in');
    for (const m of el.querySelectorAll('.fuse-mark')) m.classList.add('assemble');
    reveal.unobserve(el);
  }
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
for (const el of document.querySelectorAll('[data-reveal]')) reveal.observe(el);

// The product window tilts upright as it scrolls in.
const mock = document.querySelector('.mock');
if (mock && !reduced) {
  const tilt = () => {
    const r = mock.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.75)));
    mock.style.setProperty('--tilt', `${(1 - t) * 20}deg`);
    mock.style.setProperty('--scale', `${0.93 + t * 0.07}`);
  };
  addEventListener('scroll', tilt, { passive: true });
  addEventListener('resize', tilt);
  tilt();
}

// Product tour: four task tabs that advance on their own until someone clicks.
const ANSWERS = [
  ['Which assemblies use AC-40120?', 'AC-40120 is used in three assemblies: <span class="nw">Gearbox 40 kW <a class="cite">1</a></span>, <span class="nw">Gearbox 55 kW <a class="cite">2</a></span> and the complete <span class="nw">drive unit <a class="cite">3</a></span>. The ERP shows <span class="nw">14 in stock <a class="cite">4</a></span>.'],
  ['Do we already have a housing like this?', 'Yes. AC-40122 has the same bore and bolt pattern and differs only in wall thickness <a class="cite">1</a>. AC-40130 is a close variant already used in <span class="nw">five assemblies <a class="cite">2</a></span>.'],
  ['Who knows the 55 kW gearbox best?', 'KL designed most of it: their initials are on 9 of its 14 drawings <a class="cite">1</a>. MH made the latest changes, in <span class="nw">March <a class="cite">2</a></span>.'],
  ['Does the drawing match the ERP?', 'Not quite. The drawing is at revision C <a class="cite">1</a>, but the ERP item still lists <span class="nw">revision B <a class="cite">2</a></span>. The mismatch is flagged on the item page.'],
];
const demo = document.querySelector('[data-demo]');
if (demo) {
  const tabs = [...demo.querySelectorAll('[role="tab"]')];
  const url = demo.querySelector('.mock-url');
  const thread = demo.querySelector('.thread');
  const chips = [...demo.querySelectorAll('.qchips button')];
  const query = demo.querySelector('.q');
  const hits = demo.querySelector('[data-hits]');
  let current = 0, auto = !reduced, visible = false, started = 0, timers = [];
  const DWELL = 8000;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  const ask = (i) => {
    clearTimers();
    chips.forEach((c, n) => c.setAttribute('aria-pressed', String(n === i)));
    const [q, a] = ANSWERS[i];
    thread.innerHTML = `<p class="bubble you"></p>`;
    thread.firstChild.textContent = q;
    if (reduced) { thread.insertAdjacentHTML('beforeend', `<p class="bubble ai">${a}</p>`); return; }
    later(() => thread.insertAdjacentHTML('beforeend', '<p class="typing" style="display:flex"><span></span><span></span><span></span></p>'), 350);
    later(() => { thread.querySelector('.typing')?.remove(); thread.insertAdjacentHTML('beforeend', `<p class="bubble ai">${a}</p>`);
      thread.querySelectorAll('.cite').forEach((c, n) => (c.style.animationDelay = `${0.25 + n * 0.18}s`)); }, 1500);
  };

  const playSearch = (panel) => {
    if (reduced) return;
    const text = query.dataset.query;
    query.textContent = ''; query.classList.add('typing-q'); hits.textContent = '412,906';
    panel.classList.remove('play');
    [...text].forEach((ch, n) => later(() => { query.textContent += ch; }, 300 + n * 45));
    const done = 300 + text.length * 45;
    later(() => { hits.textContent = '1,284'; }, done * 0.45);
    later(() => { hits.textContent = '37'; query.classList.remove('typing-q'); panel.classList.add('play'); }, done + 150);
  };

  const show = (i, fromUser) => {
    clearTimers();
    current = i;
    tabs.forEach((t, n) => {
      const on = n === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    url.textContent = tabs[i].dataset.url;
    const panel = document.getElementById(tabs[i].getAttribute('aria-controls'));
    if (panel.id === 'p-find') playSearch(panel);
    else if (panel.id === 'p-ask') ask(0);
    else { panel.classList.remove('play'); requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('play'))); }
    if (fromUser) { auto = false; demo.style.setProperty('--progress', '100%'); }
    started = performance.now();
  };

  tabs.forEach((t, n) => t.addEventListener('click', () => show(n, true)));
  demo.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    const next = (current + d + tabs.length) % tabs.length;
    show(next, true); tabs[next].focus();
  });
  chips.forEach((c, n) => c.addEventListener('click', () => { auto = false; demo.style.setProperty('--progress', '100%'); ask(n); }));
  demo.addEventListener('pointerenter', () => { if (auto) started = performance.now() - DWELL * 0.5; });

  const loop = (now) => {
    if (auto && visible) {
      const p = Math.min(1, (now - started) / DWELL);
      demo.style.setProperty('--progress', `${p * 100}%`);
      if (p >= 1) show((current + 1) % tabs.length, false);
    }
    requestAnimationFrame(loop);
  };
  new IntersectionObserver(([entry]) => {
    const was = visible;
    visible = entry.isIntersecting;
    if (visible && !was && !started) show(0, false);
  }, { threshold: 0.35 }).observe(demo);
  if (!reduced) requestAnimationFrame(loop);
}

// Brand tile: the same catalog in three customers' colours.
const brand = document.querySelector('.vb-app');
if (brand && !reduced) {
  const BRANDS = [['Acme Catalog', 'acme', '#3d8fdb'], ['Nordhavn Pumps', 'nordhavn', '#2a9d8f'], ['Brightline Machines', 'brightline', '#e07a3f']];
  let b = 0;
  setInterval(() => {
    b = (b + 1) % BRANDS.length;
    const [name, slug, colour] = BRANDS[b];
    brand.closest('.viz-brand').style.setProperty('--brand', colour);
    brand.querySelector('.vb-name').textContent = name;
    brand.querySelector('.vb-url').textContent = `${slug}.alloycatalog.com`;
    brand.classList.remove('swap'); void brand.offsetWidth; brand.classList.add('swap');
  }, 2800);
}

// Tiles: a soft light follows the pointer.
for (const card of document.querySelectorAll('.tile')) {
  card.addEventListener('pointermove', (event) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - r.left}px`);
    card.style.setProperty('--my', `${event.clientY - r.top}px`);
  });
}
