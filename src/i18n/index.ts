import type { Lang } from '../config/site';
import { en } from './en';
import { zh } from './zh';

export const dicts = { en, 'zh-tw': zh } as const;

export const t = (lang: Lang) => dicts[lang];

/** Build a path for the given language. English lives at the root. */
export const localePath = (lang: Lang, path = '/') => {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return lang === 'en' ? clean : `/zh-tw${clean === '/' ? '/' : clean}`;
};

export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'zh-tw' : 'en');
