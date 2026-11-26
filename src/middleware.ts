/**
 * Edge middleware (docs/04 §7.1):
 *  1. canonicalise: strip tracking params → 301; `/` → 302 `/ro/`
 *  2. admin: session + role gate, no-store, noindex (see src/server/auth.ts)
 *  3. public: never emit Set-Cookie, add security headers
 *  4. 404 on a public path → legacy redirect lookup in D1 (`redirects`), incl. the old /lic/ WordPress tree
 */
import { defineMiddleware } from 'astro:middleware';
import { lookupRedirect } from '~/server/redirects';
import { adminGate } from '~/server/auth';

const TRACKING = /^(utm_[a-z]+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_ga|igshid|ref_src)$/i;
const LOCALE_PREFIX = /^\/(ro|de|en)(\/|$)/;

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com",
  "font-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com https://www.openstreetmap.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

function secure(res: Response, admin = false, https = true) {
  const h = res.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('X-Frame-Options', admin ? 'SAMEORIGIN' : 'DENY');
  h.set('Content-Security-Policy', admin ? CSP.replace("frame-ancestors 'none'", "frame-ancestors 'self'") : CSP);
  if (https) h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  return res;
}

/** Responses we create in middleware must be mutable (Response.redirect() has immutable headers). */
const redirect = (location: string, status: number, cache = 'public, max-age=3600') =>
  new Response(null, { status, headers: { Location: location, 'Cache-Control': cache } });

export const onRequest = defineMiddleware(async (ctx, next) => {
  const u = ctx.url;
  const path = u.pathname;
  const sec = (r: Response, admin = false) => secure(r, admin, u.protocol === 'https:');

  // 1 · canonicalise
  if (path === '/' || path === '') return sec(redirect('/ro/', 302, 'public, max-age=300'));
  const params = [...u.searchParams.keys()];
  if (params.some((k) => TRACKING.test(k)) && ctx.request.method === 'GET') {
    const clean = new URL(u);
    params.filter((k) => TRACKING.test(k)).forEach((k) => clean.searchParams.delete(k));
    return sec(redirect(clean.pathname + clean.search, 301));
  }

  // 2 · admin
  const isAdmin = path === '/admin' || path.startsWith('/admin/') || path.startsWith('/api/admin/');
  if (isAdmin) {
    const gated = await adminGate(ctx);
    const res = gated ?? (await next());
    const out = new Response(res.body, res);
    out.headers.set('Cache-Control', 'private, no-store');
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return sec(out, true);
  }

  // 3 · public
  let res = await next();

  // 4 · legacy redirects — only consulted for misses, so normal pages never touch D1 for this
  if (res.status === 404 && ctx.request.method === 'GET') {
    const hit = await lookupRedirect(path, u.search);
    if (hit) {
      ctx.locals.cfContext?.waitUntil?.(hit.touch());
      return sec(redirect(hit.to, hit.code, 'public, max-age=86400'));
    }
    if (!LOCALE_PREFIX.test(path) && (path.startsWith('/lic') || path.startsWith('/wp-'))) {
      return sec(redirect('/ro/', 301, 'public, max-age=86400'));
    }
  }

  if (res.headers.has('Set-Cookie') && !path.startsWith('/api/')) {
    console.error(`Set-Cookie stripped from public response: ${path}`);
    res = new Response(res.body, res);
    res.headers.delete('Set-Cookie');
  }
  try {
    return sec(res);
  } catch {
    // immutable headers (e.g. a static asset passthrough) — copy once
    return sec(new Response(res.body, res));
  }
});
