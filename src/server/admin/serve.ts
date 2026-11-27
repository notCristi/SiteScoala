/**
 * Delivery of R2 objects for /files/* and /img/* (docs/04 §6.4 "Serving") and the admin preview.
 *
 * Public delivery is gated by the database, not just by the key pattern:
 *  - /files/<key> only for a document that is currently PUBLISHED (documents.r2_key, status 'published');
 *  - /img/<key>   only for a variant referenced by a media_assets row.
 * A replaced, deleted, unpublished or draft file therefore 404s at once in the Worker. The edge copy is
 * tagged per object (`objectTag`) and purged on every change (purge.ts `purgeObjects`); browsers keep a copy
 * for at most one day (no `immutable`), so unpublishing takes effect everywhere within 24 h at the latest.
 * Supports conditional requests (ETag) and Range (PDF viewers). Never reads cookies.
 */
import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';
import { and, eq, or, sql } from 'drizzle-orm';
import { db, schema as s } from '../db';
import { mimeForExt } from './upload';
import { objectTag } from './purge';

export { objectTag };

export const PUBLIC_MAX_AGE = 86400;

const notFound = () => new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });

/** Is this key publicly servable right now? */
async function isPublic(prefix: 'files' | 'img', key: string): Promise<boolean> {
  if (prefix === 'files') {
    const [d] = await db()
      .select({ id: s.documents.id })
      .from(s.documents)
      .where(and(eq(s.documents.r2Key, key), eq(s.documents.status, 'published')))
      .limit(1);
    return !!d;
  }
  const [m] = await db()
    .select({ id: s.mediaAssets.id })
    .from(s.mediaAssets)
    .where(or(eq(s.mediaAssets.src, key), sql`instr(${s.mediaAssets.variantsJson}, ${`"${key}"`}) > 0`))
    .limit(1);
  return !!m;
}

const INLINE = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp']);

/** Stream an R2 object. `mode: 'public'` caches at the edge with a per-object tag; 'private' never caches. */
export async function serveObject(ctx: APIContext, key: string, mode: 'public' | 'private'): Promise<Response> {
  const req = ctx.request;
  const head = req.method === 'HEAD';
  let obj: R2Object | R2ObjectBody | null;
  try {
    obj = head ? await env.MEDIA.head(key) : await env.MEDIA.get(key, { range: req.headers, onlyIf: req.headers });
  } catch {
    // invalid Range header → serve the whole object
    obj = await env.MEDIA.get(key);
  }
  if (!obj) return notFound();

  const h = new Headers();
  obj.writeHttpMetadata(h);
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  // The type comes from the extension the server chose when sniffing (legacy imports may carry octet-stream).
  const known = mimeForExt(ext);
  if (known !== 'application/octet-stream' || !h.get('Content-Type')) h.set('Content-Type', known);
  h.set('ETag', obj.httpEtag);
  h.set('Cache-Control', mode === 'public' ? `public, max-age=${PUBLIC_MAX_AGE}` : 'private, no-store');
  h.set('Accept-Ranges', 'bytes');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Cross-Origin-Resource-Policy', 'same-site');
  if (key.startsWith('files/')) {
    const kind = INLINE.has(ext) ? 'inline' : 'attachment';
    if (!h.get('Content-Disposition')) h.set('Content-Disposition', kind);
    else if (!INLINE.has(ext)) h.set('Content-Disposition', h.get('Content-Disposition')!.replace(/^inline/, 'attachment'));
  }
  if (mode === 'public') {
    try {
      ctx.cache.set({ maxAge: PUBLIC_MAX_AGE, tags: ['media', await objectTag(key)] });
    } catch {
      /* route cache unavailable (dev) */
    }
  }

  if (head) {
    h.set('Content-Length', String(obj.size));
    return new Response(null, { status: 200, headers: h });
  }
  if (!('body' in obj) || !obj.body) {
    // a precondition (If-None-Match / If-Modified-Since) matched
    return new Response(null, { status: 304, headers: h });
  }
  const r = obj.range as { offset?: number; length?: number; suffix?: number } | undefined;
  if (r && req.headers.has('range')) {
    const size = obj.size;
    const offset = r.suffix != null ? size - r.suffix : (r.offset ?? 0);
    const length = r.suffix != null ? r.suffix : (r.length ?? size - offset);
    h.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${size}`);
    h.set('Content-Length', String(length));
    return new Response(obj.body, { status: 206, headers: h });
  }
  h.set('Content-Length', String(obj.size));
  return new Response(obj.body, { status: 200, headers: h });
}

/** Public route handler: pattern check, then the database gate, then the object. */
export async function serveR2(ctx: APIContext, prefix: 'files' | 'img', pattern: RegExp): Promise<Response> {
  const rest = ctx.params.path ?? '';
  if (!pattern.test(rest)) return notFound();
  const key = `${prefix}/${rest}`;
  if (!(await isPublic(prefix, key))) return notFound();
  return serveObject(ctx, key, 'public');
}
