/** XML sitemap with hreflang alternates for every public URL (static sections + all published entities). */
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { LOCALES, LOCALE_META } from '~/i18n/locales';
import { ROUTES, url, GUIDE_SLUGS, type RouteId } from '~/i18n/routes';
import { db, schema as s } from '~/server/db';

// the search page is noindex: not listed
const STATIC: RouteId[] = (Object.keys(ROUTES) as RouteId[]).filter((id) => id !== 'search' && !Object.values(ROUTES[id]).some((p) => p.includes(':')));
const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const GET: APIRoute = async ({ site, cache }) => {
  const origin = (site?.origin ?? 'https://liceulhonterusbrasov.ro').replace(/\/$/, '');
  const d = db();
  const P = 'published' as const;
  const [news, projects, life, galleries] = await d.batch([
    d.select({ slug: s.announcements.slug, at: s.announcements.updatedAt }).from(s.announcements).where(eq(s.announcements.status, P)),
    d.select({ slug: s.projects.slug, at: s.projects.updatedAt }).from(s.projects).where(eq(s.projects.status, P)),
    d.select({ slug: s.studentLife.slug, at: s.studentLife.updatedAt }).from(s.studentLife).where(eq(s.studentLife.status, P)),
    d.select({ slug: s.galleries.slug }).from(s.galleries),
  ]);
  type Entry = { id: RouteId; params?: Record<string, string>; at?: number | null };
  const entries: Entry[] = [
    ...STATIC.map((id) => ({ id })),
    ...(Object.keys(GUIDE_SLUGS) as string[]).map((kind) => ({ id: 'guide' as RouteId, params: { kind } })),
    ...news.map((n) => ({ id: 'article' as RouteId, params: { slug: n.slug }, at: n.at })),
    ...projects.map((n) => ({ id: 'project' as RouteId, params: { slug: n.slug }, at: n.at })),
    ...life.map((n) => ({ id: 'lifeEntry' as RouteId, params: { slug: n.slug }, at: n.at })),
    ...galleries.map((n) => ({ id: 'galleryItem' as RouteId, params: { slug: n.slug } })),
  ];
  // one <url> per location (a student-life entry with the slug "coetus" is the static Coetus page)
  const seenLoc = new Set<string>();
  const unique = entries.filter((e) => {
    const k = url(e.id, 'ro', e.params);
    if (seenLoc.has(k)) return false;
    seenLoc.add(k);
    return true;
  });
  const body = unique
    .flatMap((e) =>
      LOCALES.map((l) => {
        const alts = LOCALES.map((a) => `<xhtml:link rel="alternate" hreflang="${LOCALE_META[a].htmlLang}" href="${esc(origin + url(e.id, a, e.params))}"/>`).join('');
        const xdef = `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(origin + url(e.id, 'ro', e.params))}"/>`;
        const lastmod = e.at ? `<lastmod>${new Date(e.at).toISOString().slice(0, 10)}</lastmod>` : '';
        return `<url><loc>${esc(origin + url(e.id, l, e.params))}</loc>${lastmod}${alts}${xdef}</url>`;
      }),
    )
    .join('\n');
  cache.set({ maxAge: 86400, tags: ['site', 'sitemap'] });
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
};
