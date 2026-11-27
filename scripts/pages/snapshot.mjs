#!/usr/bin/env node
/**
 * Static preview snapshot for GitHub Pages.
 *
 * Crawls the public site from a running local Worker (`npm run preview`, seeded local D1), writes every
 * public page as static HTML and rewrites root-relative URLs for a sub-path base (e.g. /SiteScoala).
 * Server-only features (/admin, contact form, document downloads from R2, edge redirects) do not
 * exist on a static host; this is a test preview, not the production deployment (see docs/DEPLOYMENT_CLOUDFLARE.md).
 *
 * Usage: node scripts/pages/snapshot.mjs --origin http://127.0.0.1:4321 --base /SiteScoala --out .pages
 */
import { mkdir, writeFile, rm, cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const ORIGIN = arg('origin', 'http://127.0.0.1:4321');
const BASE = arg('base', '/SiteScoala').replace(/\/$/, '');
const OUT = arg('out', '.pages');

/** Same-origin paths we never snapshot: server-only routes. */
const SKIP = /^\/(admin|api\/admin|api\/contact|files\/)/;
/** Root-relative prefixes that belong to this site and get the base prepended. */
const LOCAL = '(?:ro|de|en|_astro|fonts|media|brand|img|files|api|favicon|apple-touch-icon|icon-|og-default|site\\.webmanifest)';

const rewrite = (text) =>
  text
    // attributes: href, src, action, poster, data-*, content (relative ones only)
    .replace(new RegExp(`((?:href|src|action|poster|data-[a-z-]+|content)=["'])/(?=${LOCAL})`, 'g'), `$1${BASE}/`)
    // srcset / imagesrcset lists
    .replace(/((?:srcset|imagesrcset)=")([^"]*)"/g, (_, a, list) => `${a}${list.replace(/(^|,\s*)\/(?!\/)/g, `$1${BASE}/`)}"`)
    // CSS url(/…) and JSON "…":"/…"
    .replace(new RegExp(`url\\((['"]?)/(?=${LOCAL})`, 'g'), `url($1${BASE}/`)
    .replace(new RegExp(`(":\\s*")/(?=${LOCAL})`, 'g'), `$1${BASE}/`)
    // JSON-escaped HTML inside data attributes (&quot;/ro/…)
    .replace(new RegExp(`(&quot;)/(?=${LOCAL})`, 'g'), `$1${BASE}/`);

const fileFor = (path, type) => {
  if (type.startsWith('text/html')) {
    if (path.endsWith('/')) return join(path, 'index.html');
    return `${path}.html`;
  }
  return path;
};

const seen = new Set();
const queue = ['/ro/', '/de/', '/en/', '/api/search/ro.json', '/api/search/de.json', '/api/search/en.json'];
let pages = 0;
const missing = [];

const enqueue = (raw, from) => {
  let u;
  try {
    u = new URL(raw, ORIGIN + from);
  } catch {
    return;
  }
  if (u.origin !== ORIGIN) return;
  const p = decodeURI(u.pathname);
  if (SKIP.test(p) || seen.has(p)) return;
  queue.push(p);
};

await rm(OUT, { recursive: true, force: true });
await cp('dist/client', OUT, { recursive: true, filter: (s) => !/_headers$|_routes\.json$/.test(s) });

while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  const res = await fetch(ORIGIN + encodeURI(path), { redirect: 'manual' });
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location');
    if (loc) enqueue(loc, path);
    continue;
  }
  if (!res.ok) {
    missing.push(`${res.status} ${path}`);
    continue;
  }
  const type = res.headers.get('content-type') ?? '';
  const textual = /text\/|json|xml|javascript|svg/.test(type);
  const file = join(OUT, fileFor(path, type));
  await mkdir(dirname(file), { recursive: true });
  if (textual) {
    const body = await res.text();
    if (type.startsWith('text/html')) {
      pages++;
      for (const m of body.matchAll(/(?:href|src|data-index)="([^"#]+)/g)) enqueue(m[1].replace(/&amp;/g, '&'), path);
      for (const m of body.matchAll(/srcset="([^"]+)"/g)) for (const part of m[1].split(',')) enqueue(part.trim().split(/\s+/)[0], path);
    } else if (type.includes('json')) {
      for (const m of body.matchAll(/"(\/(?:ro|de|en)\/[^"#?]*)/g)) enqueue(m[1], path);
    } else if (type.includes('css')) {
      for (const m of body.matchAll(/url\(['"]?(\/[^)'"]+)/g)) enqueue(m[1], path);
    }
    await writeFile(file, rewrite(body));
  } else {
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
  }
}

// house 404 (the page router renders it for any unknown locale path)
const nf = await fetch(`${ORIGIN}/ro/--404--`);
await writeFile(join(OUT, '404.html'), rewrite(await nf.text()));
// `/` → `/ro/` (the edge does this with a 301)
await writeFile(
  join(OUT, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>Honterus</title><meta http-equiv="refresh" content="0; url=${BASE}/ro/"><link rel="canonical" href="${BASE}/ro/"><a href="${BASE}/ro/">Română</a>\n`,
);
// _astro must not be dropped by Jekyll
await writeFile(join(OUT, '.nojekyll'), '');
// rewrite the copied static CSS/manifest too
for (const f of ['site.webmanifest']) {
  const fs = await import('node:fs/promises');
  const p = join(OUT, f);
  await fs.writeFile(p, rewrite(await fs.readFile(p, 'utf8')));
}
const { readdir, readFile } = await import('node:fs/promises');
for (const f of await readdir(join(OUT, '_astro'))) {
  if (f.endsWith('.css')) {
    const p = join(OUT, '_astro', f);
    await writeFile(p, rewrite(await readFile(p, 'utf8')));
  }
}

console.log(`snapshot: ${pages} pages, ${seen.size} URLs → ${OUT}`);
if (missing.length) console.log(`not snapshotted (${missing.length}):\n  ${missing.slice(0, 40).join('\n  ')}`);
