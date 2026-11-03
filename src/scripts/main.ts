import Lenis from 'lenis';

const html = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const wide = window.matchMedia('(min-width: 861px)').matches;
const clamp = (v: number, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const map = (v: number, a: number, b: number) => clamp((v - a) / (b - a));

/* ------------------------------------------------------------------ */
/* Smooth scroll + scroll velocity                                     */
/* ------------------------------------------------------------------ */
let lenis: Lenis | null = null;
let velocity = 0;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.09, anchors: { offset: -72 } });
  lenis.on('scroll', (l: Lenis) => (velocity = l.velocity));
}

/* ------------------------------------------------------------------ */
/* Text scramble (decodes text through random glyphs)                  */
/* ------------------------------------------------------------------ */
const GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEFKXYZ';
function scramble(el: HTMLElement, duration = 900) {
  if (reduceMotion) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: { node: Text; text: string }[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const text = (node as Text & { _orig?: string })._orig ?? node.data;
    (node as Text & { _orig?: string })._orig = text;
    if (text.trim()) nodes.push({ node, text });
  }
  const t0 = performance.now();
  const tick = (now: number) => {
    const k = clamp((now - t0) / duration);
    for (const { node, text } of nodes) {
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        out += ch === ' ' || k > i / text.length + 0.15 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      node.data = k >= 1 ? text : out;
    }
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
document.querySelectorAll<HTMLElement>('.scramble-hover').forEach((el) => {
  el.addEventListener('mouseenter', () => scramble(el, 500));
});

/* ------------------------------------------------------------------ */
/* Reveals: fade/blur words, wipe media, scramble kickers              */
/* ------------------------------------------------------------------ */
function startReveals() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        if (e.target.classList.contains('scramble')) scramble(e.target as HTMLElement);
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  document.querySelectorAll('.reveal, .split, .wipe, .scramble').forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------ */
/* Preloader: 000 → 100, then the curtain lifts                        */
/* ------------------------------------------------------------------ */
function runIntro(done: () => void) {
  const count = document.querySelector<HTMLElement>('[data-preloader-count]');
  const bar = document.querySelector<HTMLElement>('[data-preloader-bar]');
  const name = document.querySelector<HTMLElement>('[data-preloader-name]');
  if (!count || html.classList.contains('intro-done')) return done();
  lenis?.stop();
  if (name) scramble(name, 1200);
  const t0 = performance.now();
  const dur = 1700;
  const tick = (now: number) => {
    const k = clamp((now - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    count.textContent = String(Math.round(e * 100)).padStart(3, '0');
    if (bar) bar.style.transform = `scaleX(${e})`;
    if (k < 1) return requestAnimationFrame(tick);
    html.classList.add('intro-leaving');
    try {
      sessionStorage.setItem('intro', '1');
    } catch {}
    setTimeout(() => {
      html.classList.add('intro-done');
      lenis?.start();
    }, 1000);
    setTimeout(done, 350);
  };
  requestAnimationFrame(tick);
}
runIntro(startReveals);

/* ------------------------------------------------------------------ */
/* Lazy videos                                                         */
/* ------------------------------------------------------------------ */
const videos = document.querySelectorAll<HTMLVideoElement>('video.lazy-vid');
const load = (v: HTMLVideoElement) => {
  if (!v.src && v.dataset.src) {
    v.src = v.dataset.src;
    v.preload = 'auto';
  }
};
const nearIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        load(e.target as HTMLVideoElement);
        nearIO.unobserve(e.target);
      }
    }
  },
  { rootMargin: '400px 800px' },
);
const visibleIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const v = e.target as HTMLVideoElement;
      const hoverOnly = v.dataset.mode === 'hover' && canHover;
      if (e.isIntersecting && !hoverOnly && !reduceMotion) {
        load(v);
        v.play().catch(() => {});
      } else if (!e.isIntersecting) v.pause();
    }
  },
  { threshold: 0.2 },
);
videos.forEach((v) => {
  nearIO.observe(v);
  visibleIO.observe(v);
  if (v.dataset.mode === 'hover' && canHover) {
    const tile = v.closest('.tile') ?? v;
    tile.addEventListener('mouseenter', () => {
      load(v);
      v.play().catch(() => {});
    });
    tile.addEventListener('mouseleave', () => v.pause());
  }
});

/* ------------------------------------------------------------------ */
/* Hero film: particles morph with scroll, captions + HUD follow       */
/* ------------------------------------------------------------------ */
type Globe = { setProgress(p: number): void; count: number } | null;
let globe: Globe = null;
const hero = document.querySelector<HTMLElement>('[data-hero]');
const heroIntro = hero?.querySelector<HTMLElement>('[data-hero-intro]');
const caps = hero ? [...hero.querySelectorAll<HTMLElement>('[data-cap]')] : [];
const heroFill = hero?.querySelector<HTMLElement>('[data-hero-fill]');
const hudPct = hero?.querySelector<HTMLElement>('[data-hud-pct]');
const hudCount = hero?.querySelector<HTMLElement>('[data-hud-count]');
const canvas = hero?.querySelector<HTMLCanvasElement>('[data-globe]');
if (canvas) {
  document.fonts.ready.then(() =>
    import('./globe').then((m) => {
      globe = m.initGlobe(canvas, JSON.parse(canvas.dataset.words || '[]'));
      if (globe && hudCount) {
        const n = globe.count;
        const t0 = performance.now();
        const tick = (now: number) => {
          const k = clamp((now - t0) / 2400);
          hudCount.textContent = `${Math.round(n * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US')} particles`;
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }),
  );
}
// Matches the morph timing in globe.ts: one slot per word.
const capRanges: [number, number][] = caps.map((_, i) => [0.08 + i * 0.133 + 0.05, 0.08 + (i + 1) * 0.133]);
function updateHero() {
  if (!hero) return;
  const r = hero.getBoundingClientRect();
  const span = r.height - window.innerHeight;
  const p = span > 0 ? clamp(-r.top / span) : 0;
  globe?.setProgress(p);
  if (heroIntro) {
    const fade = 1 - map(p, 0.03, 0.13);
    heroIntro.style.setProperty('--fade', String(fade));
    heroIntro.style.setProperty('--lift', `${-p * 260}px`);
    heroIntro.style.pointerEvents = fade < 0.2 ? 'none' : '';
  }
  caps.forEach((c, i) => c.classList.toggle('on', p >= capRanges[i][0] && p <= capRanges[i][1]));
  if (heroFill) heroFill.style.transform = `scaleX(${p})`;
  if (hudPct) hudPct.textContent = `${String(Math.round(p * 100)).padStart(3, '0')}%`;
}

/* ------------------------------------------------------------------ */
/* Capability index: filter chips + floating video preview             */
/* ------------------------------------------------------------------ */
const capsEl = document.querySelector<HTMLElement>('[data-caps]');
if (capsEl) {
  const chips = [...capsEl.querySelectorAll<HTMLButtonElement>('[data-filter]')];
  const items = [...capsEl.querySelectorAll<HTMLElement>('[data-group]')];
  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      const f = chip.dataset.filter!;
      chips.forEach((c) => {
        c.classList.toggle('on', c === chip);
        c.setAttribute('aria-pressed', String(c === chip));
      });
      // Fade out what doesn't match, then collapse it so matches move up.
      let k = 0;
      items.forEach((it) => {
        const show = f === 'all' || it.dataset.group === f;
        if (show) {
          it.hidden = false;
          it.style.transitionDelay = `${k++ * 30}ms`;
          requestAnimationFrame(() => requestAnimationFrame(() => it.classList.remove('out')));
        } else {
          it.style.transitionDelay = '0ms';
          it.classList.add('out');
          setTimeout(() => {
            if (it.classList.contains('out')) it.hidden = true;
          }, 260);
        }
      });
    }),
  );

  const preview = capsEl.querySelector<HTMLElement>('[data-preview]');
  const panes = preview ? [...preview.querySelectorAll<HTMLElement>('[data-preview-for]')] : [];
  if (preview && canHover && !reduceMotion) {
    let x = 0,
      y = 0,
      px = 0,
      py = 0,
      raf = 0;
    const tick = () => {
      const dx = x - px;
      px += dx * 0.14;
      py += (y - py) * 0.14;
      preview.style.setProperty('--px', `${px}px`);
      preview.style.setProperty('--py', `${py}px`);
      preview.style.setProperty('--pr', `${clamp(dx * 0.05, -8, 8)}deg`);
      raf = Math.abs(dx) + Math.abs(y - py) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    items.forEach((it) => {
      it.addEventListener('pointerenter', () => {
        if (it.classList.contains('out')) return;
        panes.forEach((p) => {
          const on = p.dataset.previewFor === it.dataset.group;
          p.classList.toggle('on', on);
          const v = p.querySelector('video');
          if (on && v) {
            load(v);
            v.play().catch(() => {});
          }
        });
        preview.classList.add('on');
      });
      it.addEventListener('pointerleave', () => preview.classList.remove('on'));
    });
    capsEl.addEventListener('pointermove', (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  }
}

/* ------------------------------------------------------------------ */
/* Horizontal reel with velocity skew                                  */
/* ------------------------------------------------------------------ */
const hs = document.querySelector<HTMLElement>('[data-hscroll]');
const hsTrack = hs?.querySelector<HTMLElement>('[data-hscroll-track]');
const hsFill = hs?.querySelector<HTMLElement>('[data-hscroll-fill]');
let hsDist = 0;
let skew = 0;
const hsOn = !!(hs && hsTrack && wide && !reduceMotion);
function sizeReel() {
  if (!hsOn) return;
  hsDist = hsTrack!.scrollWidth - window.innerWidth;
  hs!.style.height = `${hsDist + window.innerHeight}px`;
}
sizeReel();
window.addEventListener('resize', sizeReel);
function updateReel() {
  if (!hsOn) return;
  const r = hs!.getBoundingClientRect();
  const p = hsDist > 0 ? clamp(-r.top / hsDist) : 0;
  skew += (clamp(-velocity * 0.35, -10, 10) - skew) * 0.12;
  hsTrack!.style.transform = `translate3d(${-p * hsDist}px,0,0) skewX(${skew}deg)`;
  hsFill?.style.setProperty('--p', String(p));
}

/* ------------------------------------------------------------------ */
/* Giant marquee: speed and direction follow scrolling                 */
/* ------------------------------------------------------------------ */
const mq = document.querySelector<HTMLElement>('[data-marquee]');
let mqX = 0;
let mqDir = -1;
function updateMarquee() {
  if (!mq || reduceMotion) return;
  if (Math.abs(velocity) > 0.2) mqDir = velocity > 0 ? -1 : 1;
  mqX += mqDir * (0.7 + Math.min(Math.abs(velocity) * 0.5, 24));
  const third = mq.scrollWidth / 3;
  if (mqX <= -third) mqX += third;
  if (mqX > 0) mqX -= third;
  mq.style.transform = `translate3d(${mqX}px,0,0) skewX(${clamp(-velocity * 0.4, -12, 12)}deg)`;
}

/* ------------------------------------------------------------------ */
/* Nav hide/show + scroll progress                                     */
/* ------------------------------------------------------------------ */
const nav = document.querySelector<HTMLElement>('[data-nav]');
const progress = document.querySelector<HTMLElement>('[data-progress]');
let lastY = window.scrollY;
function updateChrome() {
  const y = window.scrollY;
  const dy = y - lastY;
  if (!lenis) velocity = dy;
  nav?.classList.toggle('scrolled', y > 24);
  if (Math.abs(dy) > 2) nav?.classList.toggle('hidden', dy > 0 && y > 400);
  lastY = y;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress?.style.setProperty('--p', String(max > 0 ? y / max : 0));
}

/* ------------------------------------------------------------------ */
/* Statement: words light up as the green sheet scrolls past           */
/* ------------------------------------------------------------------ */
const hl = document.querySelector<HTMLElement>('[data-highlight]');
const hlWords = hl ? [...hl.querySelectorAll<HTMLElement>('.hw')] : [];
function updateHighlight() {
  if (!hl || !hlWords.length) return;
  const r = hl.getBoundingClientRect();
  // 0 when the sheet's top reaches 85% of the viewport, 1 when it's near the top.
  const p = reduceMotion ? 1 : clamp((window.innerHeight * 0.85 - r.top) / (window.innerHeight * 0.75));
  const n = Math.round(p * hlWords.length);
  hlWords.forEach((w, i) => w.classList.toggle('lit', i < n));
}

/* ------------------------------------------------------------------ */
/* Rotating word + floating tiles parallax                             */
/* ------------------------------------------------------------------ */
const rot = document.querySelector<HTMLElement>('[data-rotator]');
if (rot && !reduceMotion) {
  const words = [...rot.querySelectorAll<HTMLElement>('.word')];
  let k = 0;
  setInterval(() => {
    const prev = words[k];
    k = (k + 1) % words.length;
    prev.classList.remove('on');
    prev.classList.add('off');
    setTimeout(() => prev.classList.remove('off'), 650);
    words[k].classList.add('on');
  }, 1800);
}
const tiles = rot ? [...rot.querySelectorAll<HTMLElement>('[data-depth]')] : [];
function updateTiles() {
  if (!rot || reduceMotion) return;
  const r = rot.getBoundingClientRect();
  const off = r.top + r.height / 2 - window.innerHeight / 2;
  tiles.forEach((t) => t.style.setProperty('--ty', `${off * -0.18 * Number(t.dataset.depth)}px`));
}

/* ------------------------------------------------------------------ */
/* One frame loop drives everything scroll-linked                      */
/* ------------------------------------------------------------------ */
const frame = (time: number) => {
  lenis?.raf(time);
  updateChrome();
  updateHero();
  updateReel();
  updateMarquee();
  updateHighlight();
  updateTiles();
  velocity *= lenis ? 1 : 0.9;
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

/* ------------------------------------------------------------------ */
/* Count-up numbers                                                    */
/* ------------------------------------------------------------------ */
const countIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      countIO.unobserve(e.target);
      const el = e.target as HTMLElement;
      const template = el.textContent ?? '';
      if (reduceMotion) continue;
      const t0 = performance.now();
      const tick = (now: number) => {
        const k = clamp((now - t0) / 1600);
        const ease = 1 - Math.pow(1 - k, 3);
        el.textContent = template.replace(/\d+/g, (n) => String(Math.round(Number(n) * ease)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  },
  { threshold: 0.6 },
);
document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

/* ------------------------------------------------------------------ */
/* Pointer effects (desktop only)                                      */
/* ------------------------------------------------------------------ */
if (canHover && !reduceMotion) {
  // Spotlight that follows the cursor on cards.
  document.querySelectorAll<HTMLElement>('.spot').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // Magnetic buttons.
  document.querySelectorAll<HTMLElement>('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.45}px)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });

  // 3D tilt + sheen on the closing headline.
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', `${(px - 0.5) * 18}deg`);
      el.style.setProperty('--rx', `${(0.5 - py) * 14}deg`);
      el.style.setProperty('--sx', `${px * 100}%`);
      el.style.setProperty('--sy', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
    });
  });

  // Custom cursor: a dot plus a lagging ring that reacts to what it's over.
  const cursor = document.querySelector<HTMLElement>('[data-cursor]');
  const label = document.querySelector<HTMLElement>('[data-cursor-label]');
  if (cursor) {
    html.classList.add('has-cursor');
    let x = -100,
      y = -100,
      rx = -100,
      ry = -100;
    window.addEventListener(
      'pointermove',
      (e) => {
        x = e.clientX;
        y = e.clientY;
        cursor.style.setProperty('--x', `${x}px`);
        cursor.style.setProperty('--y', `${y}px`);
      },
      { passive: true },
    );
    const follow = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      cursor.style.setProperty('--rx', `${rx}px`);
      cursor.style.setProperty('--ry', `${ry}px`);
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
    document.addEventListener('pointerover', (e) => {
      const el = e.target as HTMLElement;
      const labelled = el.closest<HTMLElement>('[data-cursor-label]');
      const interactive = el.closest('a, button, input, .spot');
      cursor.classList.toggle('labelled', !!labelled);
      cursor.classList.toggle('hover', !labelled && !!interactive);
      if (label) label.textContent = labelled?.dataset.cursorLabel ?? '';
    });
    document.addEventListener('pointerleave', () => cursor.style.setProperty('--x', '-100px'));
  }
}
