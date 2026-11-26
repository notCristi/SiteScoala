/**
 * Public delivery of R2 objects for /files/* and /img/* (docs/04 §6.4 "Serving").
 * Keys are content-addressed (sha prefix in the key), so responses are immutable for a year.
 * Supports conditional requests (ETag) and Range (PDF viewers). Never reads cookies.
 */
import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';
import { mimeForExt } from './upload';

const notFound = () => new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=60' } });

export async function serveR2(ctx: APIContext, prefix: 'files' | 'img', pattern: RegExp): Promise<Response> {
  const rest = ctx.params.path ?? '';
  if (!pattern.test(rest)) return notFound();
  const key = `${prefix}/${rest}`;
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
  if (!h.get('Content-Type')) h.set('Content-Type', mimeForExt(ext));
  h.set('ETag', obj.httpEtag);
  h.set('Cache-Control', 'public, max-age=31536000, immutable');
  h.set('Accept-Ranges', 'bytes');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Cross-Origin-Resource-Policy', 'same-site');
  if (prefix === 'files' && !h.get('Content-Disposition')) h.set('Content-Disposition', ext === 'pdf' || ext === 'jpg' || ext === 'png' ? 'inline' : 'attachment');
  try {
    ctx.cache.set({ maxAge: 31536000, tags: ['media'] });
  } catch {
    /* route cache unavailable (dev) */
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
