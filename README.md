# Kairo Studio — website

AI-native studio site. **Seen. Found. Used. Scaled.** — brand & film, web & AI SEO, apps & product, internal software & automation.
Minimal, Scale-style design (black, one sans-serif typeface, one accent). Built with [Astro](https://astro.build) as a static site, English by default with a full Traditional Chinese version at `/zh-tw/`.

## Run it

```bash
npm install
npm run dev      # local dev server at http://localhost:4321
npm run build    # static output in dist/
```

Deploy `dist/` to any static host (Cloudflare Pages, Vercel, Netlify). Build command `npm run build`, output folder `dist`.

## Where to change things

| What | File |
|---|---|
| Studio name, domain, email, booking link, socials, newsletter | `src/config/site.ts` |
| Videos (Higgsfield clips) and which one is the hero | `src/config/media.ts` |
| All English copy and prices | `src/i18n/en.ts` |
| All Chinese copy and prices | `src/i18n/zh.ts` |
| Colours, fonts, spacing | `src/styles/global.css` (`:root` tokens) |

## Before launch (TODO)

- [ ] Final studio name → `site.name` / `site.shortName` (currently the working name "Kairo Studio").
- [ ] Buy the domain → `site.url` (used for canonical URLs, sitemap, robots.txt, llms.txt).
- [ ] Real booking link (Cal.com) → `site.bookingUrl`.
- [ ] Real email → `site.email`.
- [ ] Newsletter provider form URL → `site.newsletterAction` (until then the form opens an email).
- [ ] Six clips are 1080p already. Six are still 480p drafts that expire ~7 days after 2026-11-02 (orbital, network, door, orrery, inkwash, butterflies): finalize or replace them in `media.ts`. Ideally self-host them in `public/media/` compressed to ~2–4 MB each.
- [ ] Social profiles → `site.social`.
- [ ] Confirm case-study numbers and whether the client can be named.

## AI SEO built in

- JSON-LD on every page: `ProfessionalService` with services and offers, plus `FAQPage` on the home page and `Article` on the case study.
- `robots.txt` explicitly allows AI crawlers (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended…).
- `llms.txt` gives AI assistants a plain-language summary of the studio, services and prices.
- `hreflang` links between English and Chinese pages, and a sitemap with both languages.
