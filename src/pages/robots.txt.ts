import type { APIRoute } from 'astro';
import { site } from '../config/site';
import { withBase } from '../i18n';

// Welcome search engines and AI assistants explicitly — being found by AI is the point.
const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Claude-User', 'Google-Extended', 'Applebot-Extended'];

export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      '',
      ...aiBots.flatMap((bot) => [`User-agent: ${bot}`, 'Allow: /', '']),
      `Sitemap: ${new URL(withBase('/sitemap-index.xml'), site.url).href}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
