import type { Lang } from '../config/site';
import { en } from './en';
import { zh } from './zh';

export const dicts = { en, 'zh-tw': zh } as const;

export const t = (lang: Lang) => dicts[lang];

// Where the site is served from: "/" normally, "/Repo-Name" on GitHub Pages.
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

/** Prefix a site-root path with the deploy base path. */
export const withBase = (path = '/') => `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

/** Build a path for the given language. English lives at the root. */
export const localePath = (lang: Lang, path = '/') => {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return withBase(lang === 'en' ? clean : `/zh-tw${clean === '/' ? '/' : clean}`);
};

export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'zh-tw' : 'en');
