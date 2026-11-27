/**
 * Edge-cache purge on publish (docs/04 §4.4).
 *
 * Every purge is first written to `purge_queue` (durable), then attempted immediately with the Workers
 * Cache purge API (`cache.purge({ tags })` from `cloudflare:workers` — this is exactly what Astro's
 * Cloudflare cache provider does in `Astro.cache.invalidate({ tags })`, but it also works outside a
 * request, i.e. from the cron). Failed or rate-limited purges stay pending; `processPurgeQueue()` is
 * called from the scheduled handler (src/worker.ts, every 5 min), coalesces pending rows and retries.
 * In `astro dev` route caching is a no-op, so rows simply stay pending there.
 */
import type { APIContext } from 'astro';
import { and, asc, eq, isNull, lt, sql } from 'drizzle-orm';
import { db, schema as s } from '../db';
import { PURGE_TAGS } from '../cache';
import { sha256Hex } from './util';

const VALID = /^[a-z0-9:._-]{1,128}$/;
const MAX_ATTEMPTS = 12;

export function tagsFor(entityTypes: string[], extra: string[] = []): string[] {
  return [...new Set([...entityTypes.flatMap((t) => PURGE_TAGS[t] ?? []), ...extra, 'sitemap'])].filter((t) => VALID.test(t));
}

async function purgeNow(opts: { tags?: string[]; purgeEverything?: boolean }): Promise<boolean> {
  try {
    const { cache } = (await import('cloudflare:workers')) as unknown as { cache?: CacheContext };
    if (!cache?.purge) return false;
    const r = await Promise.race([cache.purge(opts), new Promise<never>((_, rej) => setTimeout(() => rej(new Error('purge timeout')), 8000))]);
    return r.success === true;
  } catch (e) {
    console.warn('cache purge failed', e instanceof Error ? e.message : e);
    return false;
  }
}

async function attempt(id: number, opts: { tags?: string[]; purgeEverything?: boolean }) {
  const ok = await purgeNow(opts);
  await db()
    .update(s.purgeQueue)
    .set(ok ? { doneAt: Date.now(), attempts: sql`${s.purgeQueue.attempts} + 1` } : { attempts: sql`${s.purgeQueue.attempts} + 1` })
    .where(eq(s.purgeQueue.id, id));
  return ok;
}

/** Queue + purge (in waitUntil when available, so the editor never waits for the CDN). */
export async function purge(ctx: APIContext | undefined, entityTypes: string[], extra: string[] = []) {
  const tags = tagsFor(entityTypes, extra);
  if (!tags.length) return;
  const [row] = await db().insert(s.purgeQueue).values({ tagsJson: JSON.stringify(tags) }).returning({ id: s.purgeQueue.id });
  if (!row) return;
  const p = attempt(row.id, { tags }).catch(() => false);
  if (ctx?.locals.cfContext?.waitUntil) ctx.locals.cfContext.waitUntil(p);
  else await p;
}

export async function purgeEverything(_ctx: APIContext) {
  const [row] = await db().insert(s.purgeQueue).values({ tagsJson: JSON.stringify(['*']) }).returning({ id: s.purgeQueue.id });
  if (row) return attempt(row.id, { purgeEverything: true });
  return false;
}

/**
 * Cron entry point: coalesce pending purges (≤ 100 tags per call, Free-tier purge limits) and retry.
 * Returns the number of queue rows resolved.
 */
export async function processPurgeQueue(): Promise<number> {
  const rows = await db()
    .select()
    .from(s.purgeQueue)
    .where(and(isNull(s.purgeQueue.doneAt), lt(s.purgeQueue.attempts, MAX_ATTEMPTS)))
    .orderBy(asc(s.purgeQueue.id))
    .limit(200);
  if (!rows.length) return 0;
  let everything = false;
  const tags = new Set<string>();
  for (const r of rows) {
    try {
      const t = JSON.parse(r.tagsJson) as string[];
      if (t.includes('*')) everything = true;
      t.filter((x) => VALID.test(x)).forEach((x) => tags.add(x));
    } catch {
      /* malformed row: resolved below */
    }
  }
  const all = [...tags];
  let ok = true;
  if (everything) ok = await purgeNow({ purgeEverything: true });
  else for (let i = 0; i < all.length && ok; i += 100) ok = await purgeNow({ tags: all.slice(i, i + 100) });
  const ids = rows.map((r) => r.id);
  const now = Date.now();
  for (let i = 0; i < ids.length; i += 90) {
    const chunk = ids.slice(i, i + 90);
    await db()
      .update(s.purgeQueue)
      .set(ok ? { doneAt: now, attempts: sql`${s.purgeQueue.attempts} + 1` } : { attempts: sql`${s.purgeQueue.attempts} + 1` })
      .where(sql`${s.purgeQueue.id} in (${sql.join(chunk.map((x) => sql`${x}`), sql`, `)})`);
  }
  // housekeeping: forget resolved rows after 30 days, expired sessions immediately
  await db().delete(s.purgeQueue).where(lt(s.purgeQueue.createdAt, now - 30 * 86400_000));
  await db().delete(s.sessions).where(lt(s.sessions.expiresAt, now));
  return ok ? rows.length : 0;
}

/** Edge-cache tag of one R2 object (valid purge tag: `obj:` + 24 hex); set by src/server/admin/serve.ts. */
export const objectTag = async (key: string) => `obj:${(await sha256Hex(key.replace(/^\/+/, ''))).slice(0, 24)}`;

/**
 * Purge the edge copies of specific R2 objects (a /files or /img URL), e.g. after a document is unpublished,
 * replaced or deleted. Uses the per-object tag that src/server/admin/serve.ts puts on every public response.
 */
export async function purgeObjects(ctx: APIContext | undefined, keys: (string | null | undefined)[]) {
  const clean = [...new Set(keys.filter((k): k is string => !!k && !k.startsWith('/')))];
  if (!clean.length) return;
  const tags = await Promise.all(clean.map((k) => objectTag(k)));
  for (let i = 0; i < tags.length; i += 90) await purge(ctx, [], tags.slice(i, i + 90));
}
