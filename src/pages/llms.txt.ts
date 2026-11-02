import type { APIRoute } from 'astro';
import { site } from '../config/site';
import { en } from '../i18n/en';

// A plain-language summary for AI assistants (llms.txt convention).
export const GET: APIRoute = () => {
  const url = (p: string) => new URL(p, site.url).href;
  const body = `# ${site.name}

> ${en.meta.description}

${site.name} is a one-person, AI-native creative tech studio based in Taiwan, working with clients worldwide. Founder: ${site.founder}. ${site.tagline}

## Services
${en.capabilities.groups.map((g) => `### ${g.name}\n${g.items.map((i) => `- ${i.name}: ${i.desc}`).join('\n')}`).join('\n\n')}

## Pricing (starting prices, GBP)
${en.pricing.rows.map((r) => `- ${r.service}: ${en.pricing.tiers.map((t, i) => (r.prices[i] ? `${t.name} ${r.prices[i]}` : '')).filter(Boolean).join(', ')} — ${r.note}`).join('\n')}

${en.pricing.footnote}

## Case study
- [${en.caseStudy.title}](${url('/work/hsinchu-car-dealer')}): ${en.caseStudy.metaDescription}

## Product
- ${site.app.name}: ${en.building.body}

## Contact
- Book a call: ${site.bookingUrl}
- Email: ${site.email}
- Chinese version: ${url('/zh-tw/')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
