import Lenis from 'lenis';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Nav background once the page scrolls.
const nav = document.querySelector<HTMLElement>('[data-nav]');
const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Reveal elements as they enter the viewport.
const revealIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealIO.unobserve(e.target);
      }
    }
  },
  { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
);
document.querySelectorAll('.reveal, .split').forEach((el) => revealIO.observe(el));

// Lazy videos: attach the source when near the viewport,
// autoplay while visible (or on hover for "hover" tiles on desktop).
const videos = document.querySelectorAll<HTMLVideoElement>('video.lazy-vid');

const load = (v: HTMLVideoElement) => {
  if (!v.src && v.dataset.src) {
    v.src = v.dataset.src;
    v.preload = 'auto';
  }
};
const play = (v: HTMLVideoElement) => {
  load(v);
  v.play().catch(() => {});
  v.closest('.tile')?.classList.add('playing');
};
const pause = (v: HTMLVideoElement) => {
  v.pause();
  v.closest('.tile')?.classList.remove('playing');
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
  { rootMargin: '400px 0px' },
);

const visibleIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const v = e.target as HTMLVideoElement;
      const hoverOnly = v.dataset.mode === 'hover' && canHover;
      if (e.isIntersecting && !hoverOnly && !reduceMotion) play(v);
      else if (!e.isIntersecting) pause(v);
    }
  },
  { threshold: 0.25 },
);

videos.forEach((v) => {
  nearIO.observe(v);
  visibleIO.observe(v);
  if (v.dataset.mode === 'hover' && canHover) {
    const tile = v.closest('.tile') ?? v;
    tile.addEventListener('mouseenter', () => play(v));
    tile.addEventListener('mouseleave', () => pause(v));
  }
});

// Show the first frame of hover tiles once loaded, so they aren't blank.
videos.forEach((v) => {
  v.addEventListener(
    'loadeddata',
    () => {
      if (v.paused && v.currentTime === 0) v.currentTime = 0.5;
    },
    { once: true },
  );
});

// Smooth scrolling.
if (!reduceMotion) {
  const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -72 } });
  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

// Hero particle globe.
const globe = document.querySelector<HTMLCanvasElement>('[data-globe]');
if (globe) import('./globe').then((m) => m.initGlobe(globe));

// Scroll story: highlight the pillar in view and fill its progress bar.
const story = document.querySelector<HTMLElement>('[data-story]');
if (story) {
  const steps = [...story.querySelectorAll<HTMLElement>('[data-story-step]')];
  const tabs = [...story.querySelectorAll<HTMLElement>('[data-story-tab]')];
  const update = () => {
    const mid = window.innerHeight * 0.5;
    let active = 0;
    steps.forEach((step, i) => {
      const r = step.getBoundingClientRect();
      const p = Math.min(Math.max((mid - r.top) / r.height, 0), 1);
      tabs[i]?.style.setProperty('--p', String(p));
      if (r.top < mid) active = i;
    });
    steps.forEach((s, i) => s.classList.toggle('active', i === active));
    tabs.forEach((t, i) => t.classList.toggle('active', i === active));
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

// Count numbers up when they come into view ("50–70%" counts both numbers).
const countIO = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      countIO.unobserve(e.target);
      const el = e.target as HTMLElement;
      const template = el.textContent ?? '';
      if (reduceMotion) continue;
      const t0 = performance.now();
      const dur = 1400;
      const tick = (now: number) => {
        const k = Math.min((now - t0) / dur, 1);
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

// Cursor spotlight on cards.
if (canHover) {
  document.querySelectorAll<HTMLElement>('.spot').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}
