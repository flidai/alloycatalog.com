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

// Product tour: four task tabs that advance on their own until someone clicks a tab or presses
// Pause. The progress bar is a CSS animation; when it ends, the next tab shows. Autoplay also
// pauses while the pointer or keyboard focus is in the tour, and while it is off-screen.
const ANSWERS = [
  ['Which assemblies use AC-40120?', 'AC-40120 is used in three assemblies: <span class="nw">Gearbox 40 kW <span class="cite">1</span></span>, <span class="nw">Gearbox 55 kW <span class="cite">2</span></span> and the complete <span class="nw">drive unit <span class="cite">3</span></span>. The ERP shows <span class="nw">14 in stock <span class="cite">4</span></span>.'],
  ['Do we already have a housing like this?', 'Yes. AC-40122 has the same bore and bolt pattern and differs only in wall thickness <span class="cite">1</span>. AC-40130 is a close variant already used in <span class="nw">five assemblies <span class="cite">2</span></span>.'],
  ['Who knows the 55 kW gearbox best?', 'KL designed most of it: their initials are on 9 of its 14 drawings <span class="cite">1</span>. MH made the latest changes, in <span class="nw">March <span class="cite">2</span></span>.'],
  ['Does the drawing match the ERP?', 'Not quite. The drawing is at revision C <span class="cite">1</span>, but the ERP item still lists <span class="nw">revision B <span class="cite">2</span></span>. The mismatch is flagged on the item page.'],
];
const demo = document.querySelector('[data-demo]');
if (demo) {
  const tabs = [...demo.querySelectorAll('[role="tab"]')];
  const url = demo.querySelector('.mock-url');
  const thread = demo.querySelector('.thread');
  const chips = [...demo.querySelectorAll('.qchips button')];
  const query = demo.querySelector('.q');
  const hits = demo.querySelector('[data-hits]');
  // Without motion there is no autoplay, so there is nothing to pause.
  const toggle = reduced ? null : demo.querySelector('.demo-toggle');
  if (reduced) demo.querySelector('.demo-toggle')?.remove();
  const holds = new Set(reduced ? ['user'] : []);
  let current = 0, started = false, timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  const sync = () => {
    demo.classList.toggle('paused', holds.size > 0);
    demo.classList.toggle('auto', !holds.has('user'));
    if (toggle) toggle.textContent = holds.has('user') ? 'Play tour' : 'Pause tour';
  };
  const hold = (reason, on) => { if (on) holds.add(reason); else holds.delete(reason); sync(); };

  const ask = (i, fromUser) => {
    clearTimers();
    thread.setAttribute('aria-live', fromUser ? 'polite' : 'off');
    chips.forEach((c, n) => c.setAttribute('aria-pressed', String(n === i)));
    const [q, a] = ANSWERS[i];
    thread.innerHTML = '<p class="bubble you"></p>';
    thread.firstChild.textContent = q;
    if (reduced) { thread.insertAdjacentHTML('beforeend', `<p class="bubble ai">${a}</p>`); return; }
    later(() => thread.insertAdjacentHTML('beforeend', '<p class="typing show"><span></span><span></span><span></span></p>'), 350);
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

  const show = (i) => {
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
    else if (panel.id === 'p-ask') ask(0, false);
    else { panel.classList.remove('play'); requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('play'))); }
  };

  tabs.forEach((t, n) => t.addEventListener('click', () => { hold('user', true); show(n); }));
  demo.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    const keys = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = (keys[e.key] + tabs.length) % tabs.length;
    hold('user', true); show(next); tabs[next].focus();
  });
  chips.forEach((c, n) => c.addEventListener('click', () => { hold('user', true); ask(n, true); }));
  // Pressing Play means play now, even though the pointer and focus are on the button.
  toggle?.addEventListener('click', () => {
    if (holds.has('user')) { holds.delete('pointer'); holds.delete('focus'); }
    hold('user', !holds.has('user'));
  });
  for (const t of tabs) t.querySelector('.bar').addEventListener('animationend', () => {
    if (!holds.has('user')) show((current + 1) % tabs.length);
  });
  demo.addEventListener('pointerenter', () => hold('pointer', true));
  demo.addEventListener('pointerleave', () => hold('pointer', false));
  demo.addEventListener('focusin', (e) => { if (e.target !== toggle) hold('focus', true); });
  demo.addEventListener('focusout', (e) => { if (!demo.contains(e.relatedTarget)) hold('focus', false); });
  new IntersectionObserver(([entry]) => {
    hold('offscreen', !entry.isIntersecting);
    if (entry.isIntersecting && !started) { started = true; show(0); }
  }, { threshold: 0.35 }).observe(demo);
  sync();
}

// Brand tile: the same catalog in three customers' colours, only while it is on screen.
const brand = document.querySelector('.vb-app');
if (brand && !reduced) {
  const BRANDS = [['Acme Catalog', 'acme', '#3d8fdb'], ['Nordhavn Pumps', 'nordhavn', '#2a9d8f'], ['Brightline Machines', 'brightline', '#e07a3f']];
  let b = 0, timer = 0, visible = false;
  const step = () => {
    b = (b + 1) % BRANDS.length;
    const [name, slug, colour] = BRANDS[b];
    brand.closest('.viz-brand').style.setProperty('--brand', colour);
    brand.querySelector('.vb-name').textContent = name;
    brand.querySelector('.vb-url').textContent = `${slug}.alloycatalog.com`;
    brand.classList.remove('swap'); void brand.offsetWidth; brand.classList.add('swap');
  };
  const run = () => {
    const on = visible && !document.hidden;
    if (on && !timer) timer = setInterval(step, 2800);
    if (!on && timer) { clearInterval(timer); timer = 0; }
  };
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; run(); }).observe(brand);
  document.addEventListener('visibilitychange', run);
}

// Decorative animations pause while their section is off-screen or the tab is hidden.
const idle = new IntersectionObserver((entries) => {
  for (const entry of entries) entry.target.classList.toggle('idle', !entry.isIntersecting);
});
for (const section of document.querySelectorAll('main > section')) idle.observe(section);
document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('tab-hidden', document.hidden));

// Mobile menu closes after a link is chosen, on Escape and on a click outside it.
const menu = document.querySelector('.menu');
if (menu) {
  menu.addEventListener('click', (event) => { if (event.target.closest('a')) menu.open = false; });
  document.addEventListener('click', (event) => { if (menu.open && !menu.contains(event.target)) menu.open = false; });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
  });
}

// Tiles: a soft light follows the pointer.
for (const card of document.querySelectorAll('.tile')) {
  card.addEventListener('pointermove', (event) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - r.left}px`);
    card.style.setProperty('--my', `${event.clientY - r.top}px`);
  });
}
