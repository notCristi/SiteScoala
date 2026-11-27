/**
 * What a redirect "from" address currently is. The middleware consults redirects only when a request 404s,
 * so a rule whose source is a live page would never fire (and editors would believe it works).
 */
import { and, eq } from 'drizzle-orm';
import { db, schema as s } from '../db';
import { match } from '~/i18n/routes';
import { LOCALES, type Locale } from '~/i18n/locales';
import { ENTITIES } from './entities';

export type SourceKind = 'free' | 'live' | 'reserved';

const RESERVED = /^\/(admin|api|_astro|_image|fonts|brand|media|cdn-cgi)(\/|$)|^\/(favicon|apple-touch-icon|icon-\d|og-default|site\.webmanifest|robots\.txt|sitemap)/;

export async function redirectSourceKind(from: string): Promise<SourceKind> {
  const path = from.split('?')[0]!.replace(/\/+$/, '') || '/';
  if (path === '/') return 'live';
  if (RESERVED.test(path)) return 'reserved';
  if (path.startsWith('/files/')) {
    const [d] = await db()
      .select({ id: s.documents.id })
      .from(s.documents)
      .where(and(eq(s.documents.r2Key, path.slice(1)), eq(s.documents.status, 'published')))
      .limit(1);
    return d ? 'live' : 'free';
  }
  if (path.startsWith('/img/')) return 'reserved';
  const lm = /^\/(ro|de|en)(\/.*)?$/.exec(path);
  if (!lm || !LOCALES.includes(lm[1] as Locale)) return 'free';
  const m = match(lm[1] as Locale, lm[2] ?? '/');
  if (!m) return 'free';
  if (!m.params.slug || m.id === 'guide') return 'live';
  const def = ENTITIES.find((e) => e.publicRoute === m.id);
  if (!def) return 'live';
  const t = def.table;
  const [row] = await db()
    .select({ id: t.id })
    .from(t)
    .where(def.hasStatus ? and(eq(t.slug, m.params.slug), eq(t.status, 'published')) : eq(t.slug, m.params.slug))
    .limit(1);
  return row ? 'live' : 'free';
}
