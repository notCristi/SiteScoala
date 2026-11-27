import { eq, inArray, sql } from 'drizzle-orm';
import { db, schema as s } from './db';

/**
 * Normalise a legacy path the same way at seed time and at lookup time:
 * percent-decoded, lower-case, no trailing slash (except "/"), query kept only for WordPress ids (?p=, ?page_id=, ?cat=, ?attachment_id=).
 */
export function normalizePath(path: string, search = ''): string {
  let p = path;
  try {
    p = decodeURIComponent(p);
  } catch {
    /* keep raw */
  }
  p = p.toLowerCase().replace(/\/{2,}/g, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  const q = new URLSearchParams(search);
  const keep = ['p', 'page_id', 'cat', 'attachment_id'].filter((k) => q.has(k)).map((k) => `${k}=${q.get(k)}`);
  return keep.length ? `${p}?${keep.join('&')}` : p;
}

export async function lookupRedirect(path: string, search: string) {
  const withQuery = normalizePath(path, search);
  const bare = normalizePath(path);
  const keys = [...new Set([withQuery, bare])];
  const rows = await db().select().from(s.redirects).where(inArray(s.redirects.fromPath, keys)).limit(2);
  const row = rows.find((r) => r.fromPath === withQuery) ?? rows[0];
  if (!row) return undefined;
  return {
    to: row.toPath,
    code: [301, 302, 307, 308].includes(row.code) ? row.code : 301,
    touch: () =>
      db()
        .update(s.redirects)
        .set({ hits: sql`${s.redirects.hits} + 1`, lastHitAt: Date.now() })
        .where(eq(s.redirects.id, row.id))
        .run()
        .catch(() => undefined),
  };
}
