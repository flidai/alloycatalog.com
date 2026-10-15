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

const countUp = (el) => {
  const target = Number(el.dataset.count);
  if (reduced) return;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / 1400);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  };
  el.textContent = '0';
  requestAnimationFrame(tick);
};

const reveal = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const el = entry.target;
    el.classList.add('in');
    for (const n of el.querySelectorAll('[data-count]')) countUp(n);
    for (const m of el.querySelectorAll('.fuse-mark')) m.classList.add('assemble');
    reveal.unobserve(el);
  }
}, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
for (const el of document.querySelectorAll('[data-reveal]')) reveal.observe(el);

// The product mock tilts upright as it scrolls in, then the agent answers.
const mock = document.querySelector('.mock');
if (mock) {
  if (!reduced) {
    const tilt = () => {
      const r = mock.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.75)));
      mock.style.setProperty('--tilt', `${(1 - t) * 24}deg`);
      mock.style.setProperty('--scale', `${0.92 + t * 0.08}`);
    };
    addEventListener('scroll', tilt, { passive: true });
    addEventListener('resize', tilt);
    tilt();
  }
  const play = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    play.disconnect();
    if (reduced) { mock.classList.add('play', 'answered'); return; }
    setTimeout(() => mock.classList.add('play'), 300);
    setTimeout(() => mock.classList.add('typing-now'), 900);
    setTimeout(() => { mock.classList.remove('typing-now'); mock.classList.add('answered'); }, 2400);
  }, { threshold: 0.45 });
  play.observe(mock);
}

// Feature cards: a soft light follows the pointer.
for (const card of document.querySelectorAll('.card.glow')) {
  card.addEventListener('pointermove', (event) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - r.left}px`);
    card.style.setProperty('--my', `${event.clientY - r.top}px`);
  });
}
