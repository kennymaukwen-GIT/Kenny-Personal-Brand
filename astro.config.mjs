import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { site } from './src/config/site.ts';

// For GitHub Pages the build sets SITE_URL (e.g. https://user.github.io) and
// BASE_PATH (e.g. /Kenny-Personal-Brand). Locally both fall back to the defaults.
export default defineConfig({
  site: process.env.SITE_URL || site.url,
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', 'zh-tw': 'zh-TW' },
      },
    }),
  ],
});
