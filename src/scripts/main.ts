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
document.querySelectorAll('.reveal').forEach((el) => revealIO.observe(el));

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

// Pause the hero video when it scrolls away (saves battery on laptops).
const heroVideo = document.querySelector<HTMLVideoElement>('.hero video');
if (heroVideo) {
  if (reduceMotion) heroVideo.pause();
  new IntersectionObserver(([e]) => {
    if (reduceMotion) return;
    e.isIntersecting ? heroVideo.play().catch(() => {}) : heroVideo.pause();
  }).observe(heroVideo);
}
