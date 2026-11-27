/** Per-locale search index for the Ctrl/Cmd+K dialog (fetched once, searched in memory on the client). */
import type { APIRoute } from 'astro';
import { isLocale } from '~/i18n/locales';
import { buildSearchIndex } from '~/server/search';

export const GET: APIRoute = async ({ params, cache }) => {
  const locale = params.locale;
  if (!isLocale(locale)) return new Response('Not found', { status: 404 });
  const records = await buildSearchIndex(locale);
  cache.set({ maxAge: 86400, swr: 604800, tags: ['site', 'search', 'ann', 'docs', 'guides', 'staff', 'pages', 'life', 'proj'] });
  return new Response(JSON.stringify(records), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
};
