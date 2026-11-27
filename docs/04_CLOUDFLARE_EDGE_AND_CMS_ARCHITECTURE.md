# 04 — Cloudflare edge and CMS architecture

**Project:** Colegiul Național „Johannes Honterus” Brașov: public website (RO / DE / EN) and admin CMS
**Role:** Cloudflare edge and CMS architect
**Research date:** 2026-11-26. Versions come from `npm view` on that date. Docs were fetched the same day. Each section links its sources.
**Status:** Architecture decision record and build spec. No code has been written yet.

---

## 0. Summary (TL;DR)

| Decision | Choice |
|---|---|
| Runtime | **One Cloudflare Worker with Static Assets** (not Pages). `@astrojs/cloudflare` v13+ **dropped Pages support**. |
| Framework | **Astro 7.4** + `@astrojs/cloudflare` 14.4. `astro dev` runs in real `workerd` through `@cloudflare/vite-plugin`. |
| Rendering | **Hybrid, mostly SSR.** Every D1-backed public page renders on demand at the edge and is held in **Workers Cache** through Astro **route caching** (`cacheCloudflare()`, with `Cache-Tag`). Publishing purges by tag (`cache.invalidate({ tags })`), so an edit is live worldwide within seconds and no build is needed. Only truly static files are prerendered, plus hashed CSS/JS/fonts. |
| Data | **D1** (SQLite) in the **EU jurisdiction**, managed with Drizzle ORM. Localized fields use **per-language columns** (`title_ro/_de/_en`). |
| Files | **R2** (EU jurisdiction), uploaded *through the Worker*. Uploads are validated (magic bytes and size) and stored under content-addressed keys. They are served by a Worker route with `immutable` caching. No presigned URLs. |
| Images | Variants are made **in the admin's browser at upload time** (canvas → WebP 480/960/1600), so there is no transformation quota or cost. Build-time images use `imageService: 'compile'`. |
| Auth | Our own auth in about 300 lines and **zero dependencies**: email + password (PBKDF2-SHA-256 via WebCrypto plus a server pepper), **Turnstile** on login, a **rate-limit binding** and a D1 lockout, **D1 sessions** in a `__Host-` HttpOnly Secure SameSite=Strict cookie, Origin check + CSRF token, roles `admin` / `editor` / `translator`, optional TOTP (required for `admin`). |
| CSS / JS | **No Tailwind.** Hand-written CSS with custom properties and Astro scoped styles. **No `<ClientRouter />`**: it is incompatible with `security.csp`. Use native cross-document view transitions and Astro `prefetch`. Public pages ship ~0 KB of framework JS. |
| Plan | **Workers Paid ($5/month) is strongly recommended.** Free has a 10 ms CPU limit per request, which PBKDF2 alone exceeds, plus 50 subrequests and 100k requests/day. Everything else (D1, R2, Turnstile, Workers Cache) fits inside free or included quotas for a school site. |

---

## 1. Verified versions (2026-11-26)

| Package | Version | Source / note |
|---|---|---|
| `astro` | **7.4.13** | `npm view astro version`. Engines: `node >=22.23.4` (this machine: v22.23.5 ✓). Bundles Vite 8 and Zod 4. |
| `@astrojs/cloudflare` | **14.4.9** | `npm view`. Peers: `astro ^7.4.0`, `wrangler ^4.125.0`. Depends on `@cloudflare/vite-plugin ^1.69.1`. A 15.0.0-beta exists; **do not use it**. |
| `wrangler` | **4.168.0** | `npm view`. Workers Cache needs ≥ 4.69; the rate-limit binding needs ≥ 4.36. |
| `@cloudflare/vite-plugin` | 1.70.2 | Transitive dependency of the adapter. Do not install it directly. |
| `@cloudflare/workers-types` | 5.20261125.1 | Optional. Prefer `wrangler types`, which generates `worker-configuration.d.ts`. |
| `drizzle-orm` | **0.45.4** | `latest` tag. 1.0.0-rc.6 exists under `rc`; **stay on 0.45.x** until 1.0 is GA. |
| `drizzle-kit` | **0.31.11** | `latest` tag. It writes flat `NNNN_name.sql` files, which `wrangler d1 migrations` reads directly. |
| `@astrojs/check` | **0.9.12** | **Peer: `typescript ^5 \|\| ^6`.** |
| `typescript` | **6.0.3 (pin)** | `latest` is now **7.0.2** (the native Go compiler). `@astrojs/check` does not accept it yet. **Gotcha: `npm i typescript` installs 7 and breaks `astro check`.** Pin `typescript@~6.0.3`. |
| `marked` | 18.3.0 | Markdown → HTML at save time (admin only). |
| `tailwindcss` / `@tailwindcss/vite` | 4.3.5 / 4.3.5 | Checked, **not recommended** (§2.6). |
| `sanitize-html` | 2.18.2 | Checked, **not needed**: the restricted `marked` renderer in §6.4 escapes all raw HTML. |

**Compatibility date:** `2026-11-17`. Since `2026-08-04`, `nodejs_compat` is on by default. We still list the flag explicitly, which is harmless. The 2026-11-17 date also enables `cache_option_preserves_cache_control` and `enable_request_signal`. Do not use a date later than the installed `workerd` supports. Source: https://developers.cloudflare.com/workers/configuration/compatibility-flags/

---

## 2. Research findings that drive the design

### 2.1 Workers vs Pages
- Cloudflare's migration guide says: *"Unlike Pages, Workers has a distinctly broader set of features available to it"*. Cron Triggers, Workers Logs, rate-limit bindings and the new Workers Cache are Workers-only. `_headers` and `_redirects` are *"supported natively in Workers with static assets"*. Static-asset requests are free. https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
- **Decisive:** the Astro adapter changelog for v13 says **"Cloudflare Pages support is removed."** https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- → **Workers + Static Assets.**

### 2.2 `@astrojs/cloudflare` 14: API changes (major gotchas)
Source: https://docs.astro.build/en/guides/integrations-guide/cloudflare/, plus the published tarball 14.4.9, which I inspected.

| Old (≤ v12, Astro 5) | Now (v13/v14, Astro 6/7) |
|---|---|
| `Astro.locals.runtime.env.DB` | `import { env } from 'cloudflare:workers'; env.DB`. The old accessor now **throws**: *"Astro.locals.runtime.env has been removed in Astro v6"*. |
| `Astro.locals.runtime.ctx.waitUntil` | `Astro.locals.cfContext.waitUntil(...)` |
| `Astro.locals.runtime.caches` | global `caches` |
| `Astro.locals.runtime.cf` | `Astro.request.cf` |
| `platformProxy` / `getPlatformProxy()` for dev bindings | **Gone.** `astro dev` and `astro preview` run the real `workerd` through `@cloudflare/vite-plugin`. Adapter options are now `configPath`, `persistState`, `remoteBindings`, `inspectorPort`, `auxiliaryWorkers`, `imageService`, `sessionKVBindingName`, `imagesBindingName`, `prerenderEnvironment`, `experimental.headersAndRedirectsDevModeSupport`. |
| `workerEntryPoint` option | Custom entry: `export default { fetch: handle, scheduled }` with `handle` from `@astrojs/cloudflare/handler`. We need this for Cron. |
| wrangler `main` = `dist/_worker.js` | `"main": "@astrojs/cloudflare/entrypoints/server"`, or our own `src/worker.ts`. The adapter computes `assets.directory`. |
| Pages deploy | Removed. Use `wrangler deploy`. |
| `imageService` default `compile` | Default is now **`cloudflare-binding`**, which uses an `IMAGES` binding. We set `'compile'` explicitly (§7.4). |
| — | **Auto-provisioning:** unless `session: false` is set, the adapter **adds a `SESSION` KV binding** for Astro sessions and an `IMAGES` binding. We use D1 sessions, so we set `session: false`. That option exists since Astro 7.2. |
| — | Prerendering runs in `workerd` by default (`prerenderEnvironment: 'workerd'`). Use `'node'` only if a prerendered page needs `node:fs`. |

### 2.3 Workers Cache: the key enabler (new, July 2026)
- *"Your Worker can now have its own cache in front of it"*: Cloudflare checks the cache **before invoking the Worker**. It is **available on all plans, including Free**, has **regional tiered caching** by default, and cache hits cost **no CPU time**. https://blog.cloudflare.com/workers-cache/ , https://developers.cloudflare.com/workers/cache/
- Configuration: `"cache": { "enabled": true }` in wrangler. The adapter turns this on automatically when `cache.provider = cacheCloudflare()`.
- Purge from code: `cache.purge({ tags | pathPrefixes | purgeEverything })` and `cache.invalidate(...)`, imported from `cloudflare:workers`. Purges go through **Instant Purge** and *"propagate globally with the same guarantees as zone-level purges"*. Purge rate limits are always the **Free-tier** limits. https://developers.cloudflare.com/workers/cache/purge/
- Cache key: **path + query string**. **Cookies, `Accept-Language` and hostname are NOT part of the key.** https://developers.cloudflare.com/workers/cache/cache-keys/
  → **No public HTML may vary by cookie or session.** Admin pages must send `private, no-store`.
- Bypass rules: a response with `Set-Cookie` bypasses the cache. So does a request with `Authorization`, or a response with `private` / `no-store`. `s-maxage`, `must-revalidate` and `proxy-revalidate` **disable stale-while-revalidate**. https://developers.cloudflare.com/workers/cache/configuration/
- Each deployed version has its **own cache**: a deploy starts cold.
- Astro: route caching is **stable since Astro 7** (`cache`, `routeRules`). The Cloudflare provider is labelled experimental ("need to be manually enabled"). In the 14.4.9 source, the provider writes `Cloudflare-CDN-Cache-Control` (edge-only TTL) and a `Cache-Tag` header. It auto-adds a `path` tag and an `astro-version:<id>` tag, and `invalidate()` calls `cache.purge({ tags })`. In `astro dev`, caching is a no-op. https://docs.astro.build/en/guides/caching/ , https://docs.astro.build/en/reference/experimental-flags/route-caching/
- Classic **Cache API** (`caches.default`) is **per data center only**. It does **not** support `stale-while-revalidate`, and `delete()` is local. That makes it unsuitable for "purge on publish" across PoPs. We keep it only as a fallback (§4.6). https://developers.cloudflare.com/workers/runtime-apis/cache/

### 2.4 D1, R2, limits
| Item | Value | Source |
|---|---|---|
| D1 DB size | 500 MB (Free) / 10 GB (Paid) | https://developers.cloudflare.com/d1/platform/limits/ |
| Queries per invocation | 50 / 1,000. `db.batch()` counts as **one**. | same |
| Bound params per query | 100. **Gotcha** for wide inserts: chunk them. | same |
| Columns per table | 100. Per-language columns fit: the largest table has about 45. | same |
| Max row / string / BLOB | 2 MB | same |
| Free reads / writes | 5M rows read/day, 100k rows written/day | https://developers.cloudflare.com/d1/platform/pricing/ |
| Location | `--location=weur\|eeur…`, or **`--jurisdiction=eu`** (fixed at creation, overrides the hint). Read replicas stay inside the jurisdiction. | https://developers.cloudflare.com/d1/configuration/data-location/ |
| Read replication | Sessions API `env.DB.withSession(...)`, no extra cost. **Not needed**: Workers Cache absorbs reads. | https://developers.cloudflare.com/d1/best-practices/read-replication/ |
| Migrations | `wrangler d1 migrations create/list/apply <DB> --local\|--remote`; `migrations_dir` per binding; `d1_migrations` table; `PRAGMA defer_foreign_keys = true` for table rewrites | https://developers.cloudflare.com/d1/reference/migrations/ , https://developers.cloudflare.com/workers/wrangler/commands/d1/ |
| R2 object | 5 GiB per single PUT; multipart up to 10,000 parts. Unfinished multipart uploads are aborted after 7 days. | https://developers.cloudflare.com/r2/platform/limits/ |
| R2 free | 10 GB-month, 1M Class A, 10M Class B, **free egress** | https://developers.cloudflare.com/r2/pricing/ |
| R2 presigned | Work **only** on the S3 endpoint, not custom domains. **The binding cannot create them**: you need `aws4fetch` plus S3 keys. Expiry 1 s – 7 days. Browser PUT needs bucket CORS. | https://developers.cloudflare.com/r2/api/s3/presigned-urls/ |
| Worker request body | 100 MB (Free/Pro) | https://developers.cloudflare.com/workers/platform/limits/ |
| Worker CPU | **10 ms Free** / 30 s default (5 min max) Paid | same |
| Static asset file | 25 MiB each. 20,000 files (Free) / 100,000 (Paid). | same |
| Cache API object | 512 MB | same |
| Images (free) | 5,000 unique transformations/month. Beyond that, new ones fail with 9422; there is no surprise bill. | https://developers.cloudflare.com/images/pricing/ |
| Rate-limit binding | `ratelimits: [{ name, namespace_id, simple: { limit, period: 10\|60 } }]`. Per location and eventually consistent. | https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ |
| Turnstile | `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret`, `response`, `remoteip`, `idempotency_key`. Tokens last **300 s**, are single-use, and are ≤ 2048 chars. | https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ |
| Turnstile test keys | Site `1x00000000000000000000AA` (pass) / `2x00000000000000000000AB` (fail) / `3x00000000000000000000FF` (interactive). Secret `1x0000000000000000000000000000000AA` (pass) / `2x…AA` (fail) / `3x…AA` (`timeout-or-duplicate`). Dummy token `XXXX.DUMMY.TOKEN.XXXX`. | https://developers.cloudflare.com/turnstile/troubleshooting/testing/ |
| WebCrypto | PBKDF2 is supported. `crypto.subtle.timingSafeEqual(a, b)` is a non-standard Workers extension. The production PBKDF2 cap is **100,000 iterations**: workerd issue #1346, still cited in 2024, and not listed in current docs. **Verify on staging**; design for 100k. | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ , https://github.com/cloudflare/workerd/issues/1346 |

### 2.5 Astro features
- **i18n:** `i18n: { locales: ['ro','de','en'], defaultLocale: 'ro', routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true }, fallback: { de: 'ro', en: 'ro' } }`. Per CLAUDE.md, **every** route is prefixed (`/ro/…`). `/` redirects to `/ro/` with a plain 302; it does no `Accept-Language` sniffing, because the cache key ignores that header. Helpers come from `astro:i18n` (`getRelativeLocaleUrl`). `Astro.currentLocale` works on prerendered and SSR pages. https://docs.astro.build/en/guides/internationalization/
- **Output:** `output: 'static'` prerenders by default, and a route opts out with `export const prerender = false`. `output: 'server'` renders on demand, and a route opts in with `prerender = true`. We choose **`'server'`** because almost every HTML page reads D1 (§4.2).
- **Server islands:** not needed. Whole pages are edge-cached, so there is no per-user fragment on public pages.
- **Sessions:** Astro sessions default to the KV driver (`SESSION` binding). KV is eventually consistent (about 60 s), so a revoked session could survive. → `session: false`, and our own D1 sessions. https://docs.astro.build/en/guides/sessions/
- **CSP:** `security.csp` (since 6.0) emits a hash-based `<meta http-equiv="content-security-policy">`. It is **not supported in `astro dev`**, and **`<ClientRouter />` is incompatible with it**. → no ClientRouter. https://docs.astro.build/en/reference/configuration-reference/
- **`security.checkOrigin`** (default `true`) rejects cross-origin POST/PUT/DELETE to on-demand pages with 403. This is our first CSRF layer.
- **Prefetch:** `prefetch: { prefetchAll: false, defaultStrategy: 'hover' }`, opted in per link with `data-astro-prefetch`. Hover prefetch plus edge cache hits make navigation feel instant without an SPA router.
- **Astro 7 breaking changes to watch:** Vite 8; the Rust compiler **rejects unclosed tags / invalid nesting**; `compressHTML: 'jsx'` can remove whitespace between inline elements (use `{" "}`); the default Markdown processor is Sätteri; `src/fetch.ts` is a reserved filename; `@astrojs/db` is removed. https://docs.astro.build/en/guides/upgrade-to/v7/

### 2.6 Tailwind: not needed
The site is content-heavy and has a small component set: header, nav, cards, document list, timeline, staff grid, banner. The design team wants hand-written CSS. Astro already gives us **scoped `<style>`**, critical CSS inlining and hashed bundles. Use **CSS custom properties** for tokens (`--c-brand`, `--space-3`, `--radius`, `--font-serif`), **cascade layers** (`@layer reset, tokens, base, components, utilities`), container queries and `:has()`. Tailwind 4 would add a build dependency and markup noise and give us nothing we need. Target ≤ 5 KB of public JS for the base page (mobile nav toggle, banner dismiss, Astro prefetch, YouTube facade). The hard cap in CLAUDE.md is 25 KB gzip, which leaves room for the search, filter and guide islands. No UI framework.

---

## 3. Stack

```
Browser ──► Cloudflare edge
             ├─ Static Assets (hashed /_astro/*, fonts, favicon, robots.txt)  ── free, immutable
             ├─ Workers Cache (tiered) ─ HIT ──► HTML (no Worker CPU)
             │                         └ MISS ─► Worker (Astro SSR, workerd)
             │                                     ├─ D1 (EU) via Drizzle (1 batch / page)
             │                                     └─ R2 (EU) for /media/* and /files/*
             └─ /admin/* ─► Worker (no-store, auth, Turnstile, rate-limit binding)
Cron (every 5 min) ─► Worker.scheduled: scheduled publish, banner expiry, purge retries, session GC
```

**Recommended `package.json` dependencies:**
```jsonc
{
  "type": "module",
  "engines": { "node": ">=22.23.4" },
  "scripts": {
    "dev": "astro dev",
    "check": "astro check",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "cf-types": "wrangler types",
    "db:generate": "drizzle-kit generate",
    "db:migrate:local": "wrangler d1 migrations apply DB --local",
    "db:migrate:remote": "wrangler d1 migrations apply DB --remote",
    "db:seed:local": "wrangler d1 execute DB --local --file=./db/seed.sql",
    "deploy": "npm run build && wrangler d1 migrations apply DB --remote && wrangler deploy"
  },
  "dependencies": {
    "astro": "7.4.13",
    "@astrojs/cloudflare": "14.4.9",
    "drizzle-orm": "0.45.4",
    "marked": "18.3.0"
  },
  "devDependencies": {
    "wrangler": "4.168.0",
    "drizzle-kit": "0.31.11",
    "@astrojs/check": "0.9.12",
    "typescript": "~6.0.3"
  }
}
```

### 3.1 `astro.config.mjs`
```js
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';

export default defineConfig({
  site: 'https://www.honterus.ro',          // final domain TBD
  output: 'server',                          // D1-backed pages render on demand, edge-cached
  adapter: cloudflare({
    imageService: 'compile',                 // build-time images via sharp; uploads are pre-sized in the admin
  }),
  session: false,                            // own D1 sessions; prevents the auto SESSION KV binding
  i18n: {
    locales: ['ro', 'de', 'en'],
    defaultLocale: 'ro',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true },   // CLAUDE.md rule 5: /ro/…, /de/…, /en/…; `/` → 302 /ro/
    fallback: { de: 'ro', en: 'ro' },
    fallbackType: 'rewrite',
  },
  cache: { provider: cacheCloudflare() },    // enables Workers Cache + Cache-Tag
  routeRules: {
    // edge TTL; Cloudflare-CDN-Cache-Control is edge-only, browsers get the Cache-Control set in middleware
    '/[...path]': { maxAge: 86400, swr: 604800, tags: ['site'] },
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  security: {
    checkOrigin: true,
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://i.ytimg.com",
        "media-src 'self'",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com https://www.google.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ],
      scriptDirective: { resources: ["'self'", 'https://challenges.cloudflare.com'] },
    },
  },
});
```
> Verify on the first preview deploy: (1) the exact `routeRules` pattern syntax for a catch-all (docs: "static, dynamic, rest params; no `*` globs"), (2) `Cf-Cache-Status: HIT` on second load, (3) whether `Cloudflare-CDN-Cache-Control` is honoured by Workers Cache. The adapter emits it, but the Workers Cache docs only mention `Cache-Control`. If it is not honoured, fall back to `Cache-Control: public, max-age=60, stale-while-revalidate=600` on public HTML. That is still safe because publish purges the edge, and browsers are at most ~60 s behind.

### 3.2 `wrangler.jsonc` (example)
```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "honterus-site",
  // own entry so we can add a scheduled() handler; it re-exports the adapter's fetch handler
  "main": "./src/worker.ts",
  "compatibility_date": "2026-11-17",
  "compatibility_flags": ["nodejs_compat"],

  "assets": {
    "binding": "ASSETS",
    "not_found_handling": "none"          // unmatched paths fall through to Astro (404 + redirects table)
  },

  "cache": { "enabled": true },           // Workers Cache (auto-set by adapter when cacheCloudflare() is used)
  "version_metadata": { "binding": "CF_VERSION_METADATA" },  // used by the Astro cache provider for version tags

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "honterus-db",
      "database_id": "<from wrangler d1 create>",
      "migrations_dir": "migrations"
    }
  ],

  "r2_buckets": [
    { "binding": "MEDIA", "bucket_name": "honterus-media", "jurisdiction": "eu" }
  ],

  "ratelimits": [
    { "name": "RL_LOGIN",  "namespace_id": "1001", "simple": { "limit": 10, "period": 60 } },
    { "name": "RL_UPLOAD", "namespace_id": "1002", "simple": { "limit": 30, "period": 60 } }
  ],

  // the adapter auto-adds IMAGES; declare it so dev and prod match (only used if imageService changes)
  "images": { "binding": "IMAGES" },

  "triggers": { "crons": ["*/5 * * * *"] },

  "vars": {
    "TURNSTILE_SITE_KEY": "1x00000000000000000000AA",   // overridden in env.production
    "PUBLIC_ORIGIN": "http://localhost:4321"
  },
  // secrets (wrangler secret put / .dev.vars): TURNSTILE_SECRET, AUTH_PEPPER, TOTP_ENC_KEY

  "observability": { "enabled": true },

  "env": {
    "production": {
      "vars": { "TURNSTILE_SITE_KEY": "<real site key>", "PUBLIC_ORIGIN": "https://www.honterus.ro" },
      "routes": [{ "pattern": "www.honterus.ro", "custom_domain": true }]
      // d1_databases / r2_buckets must be repeated per env (non-inheritable bindings)
    }
  }
}
```

`src/worker.ts`:
```ts
import { handle } from '@astrojs/cloudflare/handler';
import { runScheduled } from './server/cron';

export default {
  fetch: handle,
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runScheduled(env, controller.scheduledTime));
  },
} satisfies ExportedHandler<Env>;
```

### 3.3 Local development
```bash
# one-time
npm create astro@latest . -- --template minimal --no-install
npm i astro@7.4.13 @astrojs/cloudflare@14.4.9 drizzle-orm@0.45.4 marked@18.3.0
npm i -D wrangler@4.168.0 drizzle-kit@0.31.11 @astrojs/check@0.9.12 typescript@~6.0.3
npx wrangler login
npx wrangler d1 create honterus-db --jurisdiction=eu          # copy database_id into wrangler.jsonc
npx wrangler r2 bucket create honterus-media --jurisdiction=eu
npx wrangler types                                            # generates worker-configuration.d.ts (Env)

# local secrets: .dev.vars (gitignored)
cat > .dev.vars <<'EOF'
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
AUTH_PEPPER=dev-only-pepper-change-me-32bytes-min
TOTP_ENC_KEY=dev-only-base64-32-bytes
EOF

# schema → migrations → local D1 (Miniflare state in .wrangler/state, shared with astro dev)
npx drizzle-kit generate                                       # writes migrations/0000_*.sql
npx wrangler d1 migrations apply DB --local
npx wrangler d1 execute DB --local --file=./db/seed.sql        # seeds cycles, categories, first admin invite
npx wrangler d1 execute DB --local --command "SELECT count(*) FROM announcements"

# run
npm run dev            # astro dev: real workerd via @cloudflare/vite-plugin; D1/R2/ratelimit bindings are local
npm run build && npm run preview   # production build in workerd; required to test CSP (not supported in dev)

# deploy (CI or maintainer only; staff never build)
npx wrangler d1 migrations apply DB --remote --env production
npx wrangler deploy --env production
npx wrangler versions upload --env production   # preview URL to test Cf-Cache-Status before promoting
```
`drizzle.config.ts`:
```ts
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './migrations',                   // repo convention (CLAUDE.md); committed
  // driver: 'd1-http' + dbCredentials only if you want `drizzle-kit studio` against remote D1
});
```
Notes:
- Do not use `drizzle-kit push` against D1. Always run `generate`, then `wrangler d1 migrations apply`, so that `d1_migrations` stays the source of truth.
- FTS5 virtual tables and triggers go in hand-written migrations (`wrangler d1 migrations create DB fts`), because drizzle-kit does not model them.
- Table rewrites (SQLite `ALTER` limits) need `PRAGMA defer_foreign_keys = true;` at the top of the migration.
- Workers Cache cannot be tested locally. Test it on a `wrangler versions upload` preview, which has its own isolated cache.

---

## 4. Publishing and caching design

### 4.1 Requirements
1. Non-technical staff publish, and the change is visible **within seconds**, with **no build**.
2. The admin sees changes **immediately**: preview before publish, and the live page right after.
3. Public pages are fast in RO/DE: TTFB < 100 ms on a hit, < 300 ms on a miss.
4. Nearly zero cost, and survives traffic spikes (admission results day, Bac results).

### 4.2 Options compared
| | (a) SSR + edge cache + purge on publish | (b) Prerender + rebuild via deploy hook | (c) Hybrid |
|---|---|---|---|
| Edit → live | **~1–5 s** (Instant Purge) | 1–4 min (CI build + deploy), more if the queue is busy | depends |
| Admin preview | Same renderer, live | Needs SSR anyway | — |
| Failure mode | A D1 outage on a miss is covered by `stale-if-error` and SWR | A failed build means nothing publishes and needs a developer | — |
| Moving parts | 1 Worker | Worker + CI + deploy-hook secret + build minutes | most |
| Cold cache after deploy | Yes: per-version cache, refills on demand | No | — |
| Cost | Hits: request only, no CPU | Builds use CI minutes | — |

**Decision: (a), applied in a hybrid way.** All HTML that touches D1 is SSR (`output: 'server'`) behind Workers Cache. Build-time static output is limited to `/_astro/*` hashed assets, fonts, `robots.txt`, `favicon`, and pages with no D1 content (e.g. `/styleguide` behind auth is SSR; the public `/offline.html` is prerendered). A banner that appears in every layout makes "prerender most pages" impossible without rebuilding on every urgent notice. That is the reason we depart from the default assumption of prerendering public pages.

**Latency budget.** The figures below are estimates to confirm on staging with `Server-Timing`:
- **Edge HIT** (`Cf-Cache-Status: HIT`): served from the Bucharest/Sofia/Frankfurt PoP or the regional upper tier. Typical TTFB is **15–50 ms** for RO visitors. Zero Worker CPU.
- **MISS**: Worker cold or warm start (< 5 ms with isolates), then **one `db.batch()`** of 3–6 SELECTs (layout banner + settings + page data). In-region D1 (EU primary to a Worker in an EU PoP) costs **~5–20 ms per round trip**, and the batch makes it a single round trip. Astro render takes **2–8 ms CPU**. Expected TTFB is **60–150 ms** from RO/DE, and 200–400 ms from far regions, which is rare for this audience.
- With `maxAge: 86400` plus purge-on-publish, the hit ratio for HTML should be **> 95 %**. A purge re-renders only the pages that are requested next.
- Rough D1 reads/day: misses × ~50 rows ≈ well under the 5M/day free tier.

### 4.3 Cache headers
| Path | Browser `Cache-Control` | Edge (Workers Cache) | Tags |
|---|---|---|---|
| Public HTML (`/ro/…`, `/de/…`, `/en/…`) | `public, max-age=0, must-revalidate`, with ETag (weak, from the provider) → cheap 304s | `Cloudflare-CDN-Cache-Control: public, max-age=86400, stale-while-revalidate=604800` (from `routeRules`) plus `stale-if-error` | `site`, `layout`, `path:<p>`, entity tags |
| `/_astro/*`, `/fonts/*` | `public, max-age=31536000, immutable` (`public/_headers`) | static assets | — |
| `/media/<sha>/<variant>.webp`, `/files/<sha>/<name>.pdf` | `public, max-age=31536000, immutable` (content-addressed key) | cached via `routeRules` `maxAge: 31536000` | `media` |
| `/admin/**`, `/api/admin/**`, `/admin/preview/**` | `private, no-store` + `X-Robots-Tag: noindex, nofollow` | **bypass** (`no-store`). Login also sets `Set-Cookie`, which is an automatic bypass. | — |
| `/sitemap-*.xml`, `/feed.xml` | `public, max-age=300` | 1 day + purge | `site`, `sitemap` |
| 404 | `public, max-age=60` | 300 s | `site`, `notfound` |

Rules enforced in middleware, with unit tests:
1. A public route **must never read cookies or session state**, never emit `Set-Cookie`, and never vary by `Accept-Language`. Language comes only from the URL. The cache key ignores cookies, so breaking this rule would leak one user's content to everyone.
2. Middleware strips any `Set-Cookie` from public responses and logs an error if one is found.
3. Do not use `s-maxage`, `must-revalidate` or `proxy-revalidate` in the *edge* header. They disable SWR on Workers Cache.
4. Unknown query strings on public HTML (`?fbclid=…`, `?utm_*`) fragment the cache. Middleware 301-redirects to the canonical URL without them, and that redirect is cached too.

### 4.4 Tag scheme and purge on publish
Every public render calls `Astro.cache.set({ tags })`. The provider adds `path:<pathname>` and `astro-version:<id>` itself.

| Tag | Put on | Purged when |
|---|---|---|
| `layout` | every HTML page (header, footer, urgent banner, nav, settings links) | urgent/banner announcement published, changed or expired; settings changed; menu changed |
| `home` | `/ro/`, `/de/`, `/en/` | any announcement, event, project or gallery publish |
| `ann` / `ann:<id>` | news list / detail | that announcement |
| `docs` / `docs:<category>` | document lists / category pages | a document is published, replaced or unpublished |
| `guide:<id>`, `guides` | admission/exam guides | the guide or its steps |
| `staff` | staff directory, department pages | any staff or department change |
| `proj` / `proj:<id>`, `life` / `life:<id>`, `gal` / `gal:<id>` | … | … |
| `page:<key>` | static editable pages | page or section publish |
| `sitemap` | sitemaps, feed | any publish or unpublish |

Tags are ASCII, ≤ 1024 chars, at most 1000 per response, and case-insensitive. Invalid tags are silently dropped, so validate them with `/^[a-z0-9:._-]{1,128}$/`.

**Publish flow (server):**
```ts
// src/server/publish.ts (sketch)
import { env } from 'cloudflare:workers';
export async function publish(ctx: APIContext, entity: EntityRef, userId: string) {
  const db = drizzle(env.DB);
  const tags = tagsFor(entity);                 // e.g. ['ann', 'ann:42', 'home', 'sitemap'] (+ 'layout' if banner)
  await db.batch([
    applyDraftToLive(entity),                   // UPDATE … SET … FROM content_drafts
    insertRevisionSnapshot(entity, userId),
    deleteDraft(entity),
    insertAudit(userId, 'publish', entity),
    enqueuePurge(tags),                         // purge_queue row: durable record in case purge fails
  ]);
  try {
    await ctx.cache.invalidate({ tags });       // Astro → cache.purge({ tags }) → Instant Purge, global
    await markPurged(tags);
  } catch (e) {
    // Purge rate limits = Free-tier zone limits. Leave the row; cron retries every 5 min.
  }
}
```
- **Coalescing:** the cron retries and merges pending rows into one purge call (up to 100 tags). A bulk import uses `purgeEverything`.
- **Scheduled publishing and banner expiry:** the cron (`*/5 * * * *`) selects items with `status='scheduled' AND publish_at <= now`, or banners with `banner_until <= now AND banner_purged = 0`, publishes them, and purges `layout`. The worst-case delay is 5 minutes. The page also hides an expired banner by comparing `banner_until` at render time, which guards against stale entries.
- **Rollback:** "Restore revision" re-applies a snapshot and runs the same publish path.

### 4.5 What the admin sees
- Preview (`/admin/preview/<type>/<id>?lang=de`) renders the **draft** through the **same Astro components** as the public page, with `no-store`. It shows inside an iframe next to the form, with a device-width toggle.
- After publish, a toast shows "Published. Live in a few seconds" and a link to the public URL. The link carries no cache-busting parameter, because cache keys include the query and a parameter would fragment the cache. The purge has already happened, so the public page is current.

### 4.6 Fallback if Workers Cache is unavailable on the account
Use the classic Cache API with a **versioned key**:
- Store `content_version` (an integer) in D1 `settings` and bump it on every publish. Each request runs one tiny D1 query, `SELECT value FROM settings WHERE key='content_version'`, of about 5–20 ms. Alternatively, read it from KV with `cacheTtl: 30`, which gives ~0 ms but up to 60 s staleness.
- Key: `https://cache.internal/v${ver}/${locale}${path}`, read with `caches.default.match` and written with `put` + `waitUntil`.
- Downsides: the cache is per-PoP, has no SWR and no tiering, and costs a D1/KV read per request. That is acceptable for this scale, but it is the fallback only.

---

## 5. Auth design (admin only, no public accounts)

### 5.1 Principles
No auth library and no third-party IdP. Everything runs on WebCrypto, D1 and the Turnstile/rate-limit bindings. Email delivery is **not required**: invites and resets are one-time links that an admin copies and sends through the school's normal channel. Optionally, a later version can add Cloudflare Email Service or Google Workspace SMTP via an API.

### 5.2 Passwords
- **KDF:** PBKDF2-HMAC-SHA-256 with **100,000 iterations** (the workerd production cap; verify), a 16-byte random salt and a 32-byte output.
- **Pepper:** the password is first run through HMAC-SHA-256 with `AUTH_PEPPER` (a Worker secret, not stored in D1). This makes up for the iteration cap below OWASP's 600k recommendation: a dump of D1 alone is not crackable offline.
- **Stored format:** `pbkdf2-sha256$100000$<salt_b64>$<hash_b64>$p1`. The version suffix allows transparent rehashing on login if the parameters change.
- **Comparison:** `crypto.subtle.timingSafeEqual`.
- **Policy:** at least 12 characters, no composition rules. Reject the 1,000 most common passwords (bundled list of about 8 KB) and passwords that contain the email local part. A minimum length of 12 characters protects the account better than character-class rules.
- **CPU:** one 100k-iteration PBKDF2 uses roughly **30–80 ms CPU**, which is over the 10 ms Free limit. That is why we require **Workers Paid**.

```ts
const enc = new TextEncoder();
async function pepper(pw: string, pepperSecret: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(pepperSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(pw.normalize('NFKC'))));
}
export async function hashPassword(pw: string, pepperSecret: string, salt = crypto.getRandomValues(new Uint8Array(16)), iter = 100_000) {
  const base = await crypto.subtle.importKey('raw', await pepper(pw, pepperSecret), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base, 256);
  return `pbkdf2-sha256$${iter}$${b64(salt)}$${b64(new Uint8Array(bits))}$p1`;
}
export async function verifyPassword(pw: string, stored: string, pepperSecret: string) {
  const [alg, iter, s, h] = stored.split('$');
  if (alg !== 'pbkdf2-sha256') return false;
  const again = (await hashPassword(pw, pepperSecret, unb64(s), +iter)).split('$')[3];
  const a = unb64(again), b = unb64(h);
  return a.length === b.length && crypto.subtle.timingSafeEqual(a, b);
}
```

### 5.3 Login flow
1. `GET /admin/login` renders the form with the Turnstile widget (managed mode, `action: 'login'`). The page is `no-store`.
2. `POST /admin/login`:
   1. `env.RL_LOGIN.limit({ key: ip })` → 429 on fail. A second check keys on `sha256(email)`.
   2. Turnstile siteverify: `secret`, `response`, `remoteip` = `CF-Connecting-IP`, `idempotency_key` = a UUID. Require `success`, `hostname` ∈ allowed and `action === 'login'`.
   3. Load the user with `status='active'`. If `locked_until > now`, show the same generic error.
   4. Verify the password. Even when the user is not found, verify against a dummy hash, so timing does not reveal which emails exist.
   5. On failure: `failed_logins += 1`. At 5 failures, `locked_until = now + 15 min * 2^(n-5)`, capped at 24 h. Write an `audit_log` row. Show the generic message "Email sau parolă incorecte".
   6. On success: reset the counters. If `totp_enabled`, issue a **pre-MFA session** (`mfa_ok = 0`, 5 min TTL) and ask for the code.
   7. Create the session: 32 random bytes, sent to the client as base64url, stored in D1 as `sha256(token)`. Set `__Host-hs_sess=<token>; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`.
   8. Rehash the password if the stored parameters are outdated.
3. **TOTP (RFC 6238):** HMAC-SHA-1, 30 s step, ±1 window. The secret is encrypted with AES-GCM using `TOTP_ENC_KEY`. Store `totp_last_step` to block replay. About 40 lines of code. **Mandatory for `admin`**, optional for others. Provide 8 single-use recovery codes, stored hashed.

### 5.4 Sessions
- `sessions(id_hash PK, user_id, created_at, last_seen_at, expires_at, absolute_expires_at, mfa_ok, csrf_secret, ua, ip_prefix)`.
- **Idle timeout** 8 h, extended at most once per 5 min to save D1 writes. **Absolute lifetime** 7 days.
- **Rotation:** on login, MFA completion and role change. Logout deletes the row. "Sign out everywhere" deletes all of the user's rows. Disabling a user deletes their sessions.
- **Lookup:** the middleware runs for `/admin/*` and `/api/admin/*` only, with one indexed `SELECT … JOIN admin_users`.
- **GC:** the cron deletes expired rows.
- **`SameSite=Strict`:** clicking an emailed link to `/admin/...` arrives without the cookie. The login page then simply redirects back once the user is authenticated, which is acceptable.

### 5.5 CSRF (defence in depth)
1. `SameSite=Strict` cookie.
2. Astro `security.checkOrigin` (Origin vs host) on all unsafe methods.
3. Middleware also rejects `Sec-Fetch-Site` values other than `same-origin`/`none` on unsafe `/admin` requests.
4. **Synchronizer token:** each form includes `<input name="_csrf">` = `HMAC(session.csrf_secret, form-id)`, verified with `timingSafeEqual`. Admin `fetch()` calls send it in `X-CSRF-Token`.

### 5.6 Roles and permissions
| Capability | admin | editor | translator |
|---|:-:|:-:|:-:|
| Create/edit drafts (all content types), upload media/docs | ✓ | ✓ | – |
| Edit **DE/EN fields** of any item (draft or live) | ✓ | ✓ | ✓ |
| Mark a translation "done" | ✓ | ✓ | ✓ |
| Publish / unpublish / schedule / delete | ✓ | ✓ | – (requests review) |
| Urgent banner (pinned) | ✓ | ✓ | – |
| Staff directory, departments | ✓ | ✓ | translate only |
| Redirects, settings, menus | ✓ | – | – |
| Users, roles, invites, audit log, sessions | ✓ | – | – |

These are enforced server-side in a single `can(user, action, entity)` function, and every mutation writes to `audit_log`. A translator's save on a live item goes through the normal draft → publish path. Optionally, `settings.translator_autopublish = true` lets DE/EN-only changes publish directly, because they cannot touch the RO source.

### 5.7 Invites and password reset (no email provider)
- An admin creates a user, and the server generates a one-time token. The `invites` table stores `sha256(token)`, the role, `expires_at` (48 h) and `purpose` (`invite` or `reset`).
- The UI shows a link `https://…/admin/activare#<token>`. Because the token is in the fragment, it never reaches logs or the `Referer` header. A small script posts it.
- The admin sends the link through the school's own email or Teams. When the link is used, the user sets a password, all old sessions are deleted, and the event is audited.
- Initial bootstrap: `wrangler d1 execute DB --remote --file=bootstrap-admin.sql` inserts a single invite row generated by a local script (`npm run admin:invite -- email@…`).

---

## 6. Data model

### 6.1 Localization strategy: per-language columns
Chosen: **`title_ro`, `title_de`, `title_en`** (and the same for every translatable field), plus per-row translation-status columns.

Why:
- The set of languages is **fixed at 3**. The school is trilingual by statute, and a fourth language is unlikely.
- One row = one atomic edit, with no joins and no N+1 queries. A page batch stays at 3–6 queries, which matters given the 50-queries-per-invocation limit (Free) and the per-query latency.
- `RO` is NOT NULL and `DE`/`EN` are nullable. This makes fallback trivial: `coalesce(title_de, title_ro)`, with the UI marking fallback text with `lang="ro"`.
- The widest table (announcements) has about 40 columns, well under D1's 100-column limit. Rows stay far below 2 MB.
- Drizzle types become simple. A helper `l10n('title')` spreads the three columns.

Downsides we accept: adding a language means a migration that adds columns (a mechanical change). A translation-table design would be better only if there were many languages or the language set were dynamic.

**Translation status:** each localized table has `rev` (incremented when any **RO** source field changes), `de_rev` / `en_rev` (the `rev` the translation was last confirmed against), and `de_state` / `en_state` (`missing` | `draft` | `done`). Derived states:
- `missing`: the required DE field is null.
- `outdated`: `de_state = 'done'` and `de_rev < rev`.
- `ok`: otherwise.

The admin shows these as RO● DE◐ EN○ chips.

**Slugs:** one slug per entity, transliterated from RO (`/de/aktuelles/<slug>`, where the path segment is translated by the route but the slug is shared). That keeps `hreflang` mapping trivial. A `slug` change auto-creates a 301 redirect.

**URL map** (route segments localized by the router):
| RO | DE | EN |
|---|---|---|
| `/ro/anunturi/<slug>` | `/de/aktuelles/<slug>` | `/en/news/<slug>` |
| `/ro/documente/<categorie>` | `/de/dokumente/<kategorie>` | `/en/documents/<category>` |
| `/ro/admitere/<slug>` | `/de/aufnahme/<slug>` | `/en/admission/<slug>` |
| `/ro/personal` | `/de/kollegium` | `/en/staff` |
| `/ro/proiecte/<slug>` | `/de/projekte/<slug>` | `/en/projects/<slug>` |
| `/ro/viata-elevilor/<slug>` | `/de/schulleben/<slug>` | `/en/student-life/<slug>` |
| `/ro/galerie/<slug>` | `/de/galerie/<slug>` | `/en/gallery/<slug>` |

Every public page emits `<link rel="alternate" hreflang>` for ro/de/en plus `x-default` (→ `/ro/…`). The language switcher maps the current route to its equivalent through a shared route table. Languages are labelled Română · Deutsch · English, never with flags.

### 6.2 SQL schema (D1 / SQLite)
Conventions:
- Times are integer **Unix milliseconds** (UTC). Displays use `Europe/Bucharest`.
- Booleans are `INTEGER 0/1`.
- Enums use `CHECK`.
- `*_md_*` holds the source Markdown. `*_html_*` holds sanitized HTML rendered **at save time**, so public renders never parse Markdown and stay within CPU budget.
- `PRAGMA foreign_keys` is enforced by D1.

```sql
-- ============ AUTH ============
CREATE TABLE admin_users (
  id              TEXT PRIMARY KEY,                       -- uuid v7
  email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name    TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin','editor','translator')),
  status          TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','disabled')),
  password_hash   TEXT,                                   -- null while invited
  password_changed_at INTEGER,
  totp_secret_enc TEXT,                                   -- AES-GCM(b64), null = no TOTP
  totp_enabled    INTEGER NOT NULL DEFAULT 0,
  totp_last_step  INTEGER,
  recovery_codes_json TEXT,                               -- array of sha256 hex
  ui_locale       TEXT NOT NULL DEFAULT 'ro' CHECK (ui_locale IN ('ro','de')),
  failed_logins   INTEGER NOT NULL DEFAULT 0,
  locked_until    INTEGER,
  last_login_at   INTEGER,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE TABLE sessions (
  id_hash         TEXT PRIMARY KEY,                       -- sha256(token) hex
  user_id         TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  mfa_ok          INTEGER NOT NULL DEFAULT 0,
  csrf_secret     TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  last_seen_at    INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL,                       -- idle
  absolute_expires_at INTEGER NOT NULL,
  user_agent      TEXT,
  ip_prefix       TEXT                                    -- /24 or /48 only (privacy)
);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_exp_idx  ON sessions(expires_at);

CREATE TABLE invites (
  token_hash      TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  purpose         TEXT NOT NULL CHECK (purpose IN ('invite','reset')),
  created_by      TEXT REFERENCES admin_users(id),
  created_at      INTEGER NOT NULL,
  expires_at      INTEGER NOT NULL,
  used_at         INTEGER
);

CREATE TABLE audit_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  at              INTEGER NOT NULL,
  user_id         TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,       -- login_ok, login_fail, create, update, publish, unpublish, delete, upload, role_change, purge…
  entity_type     TEXT,
  entity_id       TEXT,
  summary         TEXT,
  diff_json       TEXT,                -- changed field names (+ short before/after), never secrets
  ip_prefix       TEXT
);
CREATE INDEX audit_at_idx ON audit_log(at DESC);
CREATE INDEX audit_entity_idx ON audit_log(entity_type, entity_id);

-- ============ SETTINGS / ROUTING ============
CREATE TABLE settings (
  key             TEXT PRIMARY KEY,    -- 'links.noteincatalog', 'links.classroom', 'contact.address', 'contact.phone',
                                       -- 'contact.email', 'social.facebook', 'menu.main', 'content_version', 'translator_autopublish'
  value_json      TEXT NOT NULL,       -- JSON; localized values as {"ro":…,"de":…,"en":…}
  updated_at      INTEGER NOT NULL,
  updated_by      TEXT REFERENCES admin_users(id)
);

CREATE TABLE redirects (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  from_path       TEXT NOT NULL UNIQUE,                   -- normalized: lowercase path (+ sorted query for legacy ?id= URLs)
  to_path         TEXT NOT NULL,                          -- internal path or absolute https URL
  code            INTEGER NOT NULL DEFAULT 301 CHECK (code IN (301,302,307,308,410)),
  note            TEXT,
  hits            INTEGER NOT NULL DEFAULT 0,
  last_hit_at     INTEGER,
  created_by      TEXT REFERENCES admin_users(id),
  created_at      INTEGER NOT NULL,
  CHECK (from_path LIKE '/%' AND from_path <> to_path)
);

-- ============ MEDIA ============
CREATE TABLE media_assets (
  id              TEXT PRIMARY KEY,
  kind            TEXT NOT NULL CHECK (kind IN ('image','video','youtube')),
  r2_key          TEXT UNIQUE,                            -- base key: img/<sha12>/ ; null for youtube
  variants_json   TEXT,                                   -- [{"w":480,"key":"…/480.webp","bytes":…},…]
  mime            TEXT,
  size_bytes      INTEGER,
  sha256          TEXT UNIQUE,                            -- dedupe
  width           INTEGER CHECK (width  IS NULL OR width  BETWEEN 1 AND 10000),
  height          INTEGER CHECK (height IS NULL OR height BETWEEN 1 AND 10000),
  focal_x         REAL DEFAULT 0.5, focal_y REAL DEFAULT 0.5,
  lqip            TEXT,                                   -- tiny base64 webp placeholder (<1 KB) or dominant color
  youtube_id      TEXT CHECK (youtube_id IS NULL OR length(youtube_id) = 11),
  alt_ro TEXT, alt_de TEXT, alt_en TEXT,                  -- alt_ro required for images (enforced in app)
  caption_ro TEXT, caption_de TEXT, caption_en TEXT,
  credit          TEXT,
  original_filename TEXT,
  uploaded_by     TEXT REFERENCES admin_users(id),
  created_at      INTEGER NOT NULL,
  CHECK ((kind = 'youtube') = (youtube_id IS NOT NULL))
);

CREATE TABLE galleries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title_ro TEXT NOT NULL, title_de TEXT, title_en TEXT,
  description_ro TEXT, description_de TEXT, description_en TEXT,
  cover_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  event_date INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  publish_at INTEGER, published_at INTEGER,
  rev INTEGER NOT NULL DEFAULT 1, de_rev INTEGER, en_rev INTEGER,
  de_state TEXT NOT NULL DEFAULT 'missing' CHECK (de_state IN ('missing','draft','done')),
  en_state TEXT NOT NULL DEFAULT 'missing' CHECK (en_state IN ('missing','draft','done')),
  created_by TEXT REFERENCES admin_users(id), updated_by TEXT REFERENCES admin_users(id),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE gallery_items (
  gallery_id INTEGER NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  media_id   TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (gallery_id, media_id)
);

-- ============ ANNOUNCEMENTS ============
CREATE TABLE announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE CHECK (slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*[^a-z0-9-]*' AND length(slug) <= 96),
  type TEXT NOT NULL DEFAULT 'news' CHECK (type IN ('news','urgent','event')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  title_ro TEXT NOT NULL CHECK (length(title_ro) BETWEEN 3 AND 160), title_de TEXT, title_en TEXT,
  summary_ro TEXT CHECK (length(summary_ro) <= 300), summary_de TEXT, summary_en TEXT,
  body_md_ro TEXT, body_md_de TEXT, body_md_en TEXT,
  body_html_ro TEXT, body_html_de TEXT, body_html_en TEXT,
  cover_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  gallery_id INTEGER REFERENCES galleries(id) ON DELETE SET NULL,
  pinned_banner INTEGER NOT NULL DEFAULT 0,               -- show in site-wide banner
  banner_level TEXT NOT NULL DEFAULT 'info' CHECK (banner_level IN ('info','warning','critical')),
  banner_text_ro TEXT CHECK (length(banner_text_ro) <= 140), banner_text_de TEXT, banner_text_en TEXT,
  banner_until INTEGER,                                    -- required if pinned_banner = 1
  banner_purged INTEGER NOT NULL DEFAULT 0,                -- cron flag after expiry purge
  event_start INTEGER, event_end INTEGER,
  event_location_ro TEXT, event_location_de TEXT, event_location_en TEXT,
  pinned_top INTEGER NOT NULL DEFAULT 0,                   -- sticky on news list
  publish_at INTEGER, published_at INTEGER,
  rev INTEGER NOT NULL DEFAULT 1, de_rev INTEGER, en_rev INTEGER,
  de_state TEXT NOT NULL DEFAULT 'missing' CHECK (de_state IN ('missing','draft','done')),
  en_state TEXT NOT NULL DEFAULT 'missing' CHECK (en_state IN ('missing','draft','done')),
  created_by TEXT REFERENCES admin_users(id), updated_by TEXT REFERENCES admin_users(id),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  CHECK (pinned_banner = 0 OR (banner_until IS NOT NULL AND banner_text_ro IS NOT NULL)),
  CHECK (type <> 'event' OR event_start IS NOT NULL),
  CHECK (event_end IS NULL OR event_end >= event_start)
);
CREATE INDEX ann_pub_idx    ON announcements(status, published_at DESC);
CREATE INDEX ann_banner_idx ON announcements(pinned_banner, banner_until) WHERE pinned_banner = 1;
CREATE INDEX ann_event_idx  ON announcements(type, event_start) WHERE type = 'event';

-- ============ STATIC PAGES / SECTIONS ============
CREATE TABLE pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,              -- 'despre', 'istoric', 'contact', 'gdpr', 'admitere-index'… (route binds by key)
  title_ro TEXT NOT NULL, title_de TEXT, title_en TEXT,
  meta_description_ro TEXT, meta_description_de TEXT, meta_description_en TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at INTEGER,
  rev INTEGER NOT NULL DEFAULT 1, de_rev INTEGER, en_rev INTEGER,
  de_state TEXT NOT NULL DEFAULT 'missing' CHECK (de_state IN ('missing','draft','done')),
  en_state TEXT NOT NULL DEFAULT 'missing' CHECK (en_state IN ('missing','draft','done')),
  updated_by TEXT REFERENCES admin_users(id), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE page_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL CHECK (kind IN ('richtext','image_text','cta','link_list','contact_card','stats','faq','documents','staff_ref','gallery_ref')),
  anchor TEXT CHECK (anchor IS NULL OR anchor NOT GLOB '*[^a-z0-9-]*'),
  title_ro TEXT, title_de TEXT, title_en TEXT,
  body_md_ro TEXT, body_md_de TEXT, body_md_en TEXT,
  body_html_ro TEXT, body_html_de TEXT, body_html_en TEXT,
  media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  data_json TEXT,                        -- kind-specific, validated by a per-kind schema (e.g. links [{label_ro,…,href}])
  hidden INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX sections_page_idx ON page_sections(page_id, sort_order);

-- ============ DOCUMENTS ============
CREATE TABLE cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE CHECK (code IN ('prescolar','primar','gimnazial','liceal')),
  name_ro TEXT NOT NULL, name_de TEXT NOT NULL, name_en TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_ro TEXT NOT NULL CHECK (length(title_ro) BETWEEN 3 AND 200), title_de TEXT, title_en TEXT,
  description_ro TEXT, description_de TEXT, description_en TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'rofuip','pdi-pas','oferta','dezbateri','posturi','formulare','raport','buget',
    'admitere','examene','burse','calendar','achizitii','gdpr','legislatie','alte')),   -- no 'orar': CLAUDE.md hard rule 1
  academic_year TEXT CHECK (academic_year IS NULL OR academic_year GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'),
  doc_language TEXT NOT NULL DEFAULT 'ro' CHECK (doc_language IN ('ro','de','en','multi')),
  r2_key TEXT NOT NULL UNIQUE,           -- files/<sha12>/<safe-name>.pdf
  original_filename TEXT NOT NULL,
  mime TEXT NOT NULL CHECK (mime IN ('application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.oasis.opendocument.text')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 26214400),   -- 25 MiB
  sha256 TEXT NOT NULL,
  pages INTEGER,                         -- PDF page count if parsable (best effort)
  issued_at INTEGER,                     -- date on the document (registration date)
  registration_no TEXT,                  -- nr. înregistrare
  valid_until INTEGER,                   -- e.g. job posting / debate deadline
  supersedes_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  publish_at INTEGER, published_at INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  rev INTEGER NOT NULL DEFAULT 1, de_rev INTEGER, en_rev INTEGER,
  de_state TEXT NOT NULL DEFAULT 'missing' CHECK (de_state IN ('missing','draft','done')),
  en_state TEXT NOT NULL DEFAULT 'missing' CHECK (en_state IN ('missing','draft','done')),
  created_by TEXT REFERENCES admin_users(id), updated_by TEXT REFERENCES admin_users(id),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX docs_cat_idx ON documents(status, category, academic_year DESC, sort_order);
CREATE TABLE document_cycles (
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  cycle_id    INTEGER NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, cycle_id)
);

-- ============ ADMISSION & EXAM GUIDES ============
CREATE TABLE admission_guides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('pregatitoare','clasa-v','clasa-ix','transfer','evaluare-nationala','bacalaureat','dsd','alte')),
  cycle_id INTEGER REFERENCES cycles(id),
  academic_year TEXT NOT NULL CHECK (academic_year GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'),
  title_ro TEXT NOT NULL, title_de TEXT, title_en TEXT,
  intro_md_ro TEXT, intro_md_de TEXT, intro_md_en TEXT,
  intro_html_ro TEXT, intro_html_de TEXT, intro_html_en TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  publish_at INTEGER, published_at INTEGER,
  rev INTEGER NOT NULL DEFAULT 1, de_rev INTEGER, en_rev INTEGER,
  de_state TEXT NOT NULL DEFAULT 'missing' CHECK (de_state IN ('missing','draft','done')),
  en_state TEXT NOT NULL DEFAULT 'missing' CHECK (en_state IN ('missing','draft','done')),
  updated_by TEXT REFERENCES admin_users(id), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE guide_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guide_id INTEGER NOT NULL REFERENCES admission_guides(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  title_ro TEXT NOT NULL, title_de TEXT, title_en TEXT,
  body_md_ro TEXT, body_md_de TEXT, body_md_en TEXT,
  body_html_ro TEXT, body_html_de TEXT, body_html_en TEXT,
  starts_at INTEGER, ends_at INTEGER,    -- ends_at = deadline
  all_day INTEGER NOT NULL DEFAULT 1,
  is_deadline INTEGER NOT NULL DEFAULT 0,
  location_ro TEXT, location_de TEXT, location_en TEXT,
  link_url TEXT CHECK (link_url IS NULL OR link_url LIKE 'https://%' OR link_url LIKE '/%'),
  document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at),
  UNIQUE (guide_id, sort_order)
);

-- ============ PEOPLE ============
CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name_ro TEXT NOT NULL, name_de TEXT, name_en TEXT,   -- catedre / arii curriculare
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 3 AND 120),
  sort_name TEXT NOT NULL,               -- "Popescu Ana" for ordering; Romanian collation done in app (Intl.Collator('ro'))
  title_prefix TEXT,                     -- Prof. dr., Dipl.-Lehrerin…
  role_ro TEXT, role_de TEXT, role_en TEXT, -- Director, Diriginte…, free text
  category TEXT NOT NULL CHECK (category IN ('conducere','profesori','zfa','auxiliar','nedidactic')),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  subject_ro TEXT, subject_de TEXT, subject_en TEXT,
  email TEXT CHECK (email IS NULL OR email LIKE '%_@_%._%'),
  show_email INTEGER NOT NULL DEFAULT 0,  -- GDPR: explicit opt-in
  photo_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  photo_consent INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 1000,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden','former')),
  updated_by TEXT REFERENCES admin_users(id), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  CHECK (photo_media_id IS NULL OR photo_consent = 1)
);
CREATE INDEX staff_cat_idx ON staff(status, category, sort_order, sort_name);

-- ============ PROJECTS / STUDENT LIFE ============
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('erasmus','etwinning','pasch','dsd','schimb','cercetare','comunitate','alte')),
  title_ro TEXT NOT NULL, title_de TEXT, title_en TEXT,
  summary_ro TEXT, summary_de TEXT, summary_en TEXT,
  body_md_ro TEXT, body_md_de TEXT, body_md_en TEXT,
  body_html_ro TEXT, body_html_de TEXT, body_html_en TEXT,
  partners TEXT, funding TEXT,           -- free text (e.g. "Erasmus+ KA122")
  start_date INTEGER, end_date INTEGER,
  cover_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  gallery_id INTEGER REFERENCES galleries(id) ON DELETE SET NULL,
  external_url TEXT CHECK (external_url IS NULL OR external_url LIKE 'https://%'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  publish_at INTEGER, published_at INTEGER, sort_order INTEGER NOT NULL DEFAULT 0,
  rev INTEGER NOT NULL DEFAULT 1, de_rev INTEGER, en_rev INTEGER,
  de_state TEXT NOT NULL DEFAULT 'missing' CHECK (de_state IN ('missing','draft','done')),
  en_state TEXT NOT NULL DEFAULT 'missing' CHECK (en_state IN ('missing','draft','done')),
  created_by TEXT REFERENCES admin_users(id), updated_by TEXT REFERENCES admin_users(id),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE TABLE student_life (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('club','consiliul-elevilor','traditie','sport','revista','cor-teatru','voluntariat','alte')),
  title_ro TEXT NOT NULL, title_de TEXT, title_en TEXT,
  summary_ro TEXT, summary_de TEXT, summary_en TEXT,
  body_md_ro TEXT, body_md_de TEXT, body_md_en TEXT,
  body_html_ro TEXT, body_html_de TEXT, body_html_en TEXT,
  schedule_ro TEXT, schedule_de TEXT, schedule_en TEXT,   -- "Joi, 14:00, sala 12"
  contact_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  cover_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  gallery_id INTEGER REFERENCES galleries(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','archived')),
  publish_at INTEGER, published_at INTEGER, sort_order INTEGER NOT NULL DEFAULT 0,
  rev INTEGER NOT NULL DEFAULT 1, de_rev INTEGER, en_rev INTEGER,
  de_state TEXT NOT NULL DEFAULT 'missing' CHECK (de_state IN ('missing','draft','done')),
  en_state TEXT NOT NULL DEFAULT 'missing' CHECK (en_state IN ('missing','draft','done')),
  created_by TEXT REFERENCES admin_users(id), updated_by TEXT REFERENCES admin_users(id),
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);

-- ============ WORKFLOW ============
CREATE TABLE content_drafts (            -- pending edits to *published* items (live row stays untouched)
  entity_type TEXT NOT NULL,             -- 'announcement','page','page_section','document','guide','guide_step','staff',…
  entity_id   TEXT NOT NULL,
  data_json   TEXT NOT NULL,             -- full field set of the edited item (validated on save)
  base_rev    INTEGER NOT NULL,          -- optimistic concurrency: reject publish if live rev moved
  updated_by  TEXT REFERENCES admin_users(id),
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);
CREATE TABLE revisions (                 -- snapshots of each publish, for history/rollback (keep last 20 per item)
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
  data_json TEXT NOT NULL,
  published_by TEXT REFERENCES admin_users(id),
  published_at INTEGER NOT NULL
);
CREATE INDEX rev_entity_idx ON revisions(entity_type, entity_id, published_at DESC);
CREATE TABLE purge_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tags_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  done_at INTEGER
);
CREATE INDEX purge_pending_idx ON purge_queue(done_at) WHERE done_at IS NULL;

-- ============ SEARCH (hand-written migration; not managed by drizzle-kit) ============
CREATE VIRTUAL TABLE search_fts USING fts5(
  entity_type UNINDEXED, entity_id UNINDEXED, locale UNINDEXED, url UNINDEXED,
  title, body, tokenize = 'unicode61 remove_diacritics 2'
);
-- rows maintained by the publish function (not triggers), one row per (entity, locale)
```
How drafts work. **New** items are rows with `status='draft'`, edited in place. **Published** items are edited through `content_drafts`, so the live row stays unchanged until Publish. Preview merges the draft over the live row. Publish copies the draft into the live row, bumps `rev` if an RO field changed, snapshots to `revisions`, deletes the draft and queues the purge, all in one `db.batch()`, which is transactional in D1. A `base_rev` mismatch means "Someone else published in the meantime", and the UI shows a diff.

### 6.3 Drizzle schema (TypeScript, excerpt with the patterns used everywhere)
```ts
// src/db/schema.ts
import { sqliteTable, text, integer, real, primaryKey, index, uniqueIndex, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const LOCALES = ['ro', 'de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** title_ro NOT NULL + title_de/title_en nullable */
const l10n = <N extends string>(name: N, opts: { required?: boolean } = { required: true }) => ({
  [`${name}Ro`]: opts.required ? text(`${name}_ro`).notNull() : text(`${name}_ro`),
  [`${name}De`]: text(`${name}_de`),
  [`${name}En`]: text(`${name}_en`),
}) as Record<`${N}Ro` | `${N}De` | `${N}En`, ReturnType<typeof text>>;

const ms = (n: string) => integer(n, { mode: 'timestamp_ms' });
const bool = (n: string) => integer(n, { mode: 'boolean' });
const status = () => text('status', { enum: ['draft', 'scheduled', 'published', 'archived'] }).notNull().default('draft');
const tr = () => ({
  rev: integer('rev').notNull().default(1),
  deRev: integer('de_rev'), enRev: integer('en_rev'),
  deState: text('de_state', { enum: ['missing', 'draft', 'done'] }).notNull().default('missing'),
  enState: text('en_state', { enum: ['missing', 'draft', 'done'] }).notNull().default('missing'),
});
const stamps = () => ({
  createdBy: text('created_by').references(() => adminUsers.id),
  updatedBy: text('updated_by').references(() => adminUsers.id),
  createdAt: ms('created_at').notNull(),
  updatedAt: ms('updated_at').notNull(),
});

export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  role: text('role', { enum: ['admin', 'editor', 'translator'] }).notNull(),
  status: text('status', { enum: ['invited', 'active', 'disabled'] }).notNull().default('invited'),
  passwordHash: text('password_hash'),
  passwordChangedAt: ms('password_changed_at'),
  totpSecretEnc: text('totp_secret_enc'),
  totpEnabled: bool('totp_enabled').notNull().default(false),
  totpLastStep: integer('totp_last_step'),
  recoveryCodesJson: text('recovery_codes_json'),
  uiLocale: text('ui_locale', { enum: ['ro', 'de'] }).notNull().default('ro'),
  failedLogins: integer('failed_logins').notNull().default(0),
  lockedUntil: ms('locked_until'),
  lastLoginAt: ms('last_login_at'),
  createdAt: ms('created_at').notNull(),
  updatedAt: ms('updated_at').notNull(),
}, (t) => [check('role_chk', sql`${t.role} IN ('admin','editor','translator')`)]);

export const sessions = sqliteTable('sessions', {
  idHash: text('id_hash').primaryKey(),
  userId: text('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  mfaOk: bool('mfa_ok').notNull().default(false),
  csrfSecret: text('csrf_secret').notNull(),
  createdAt: ms('created_at').notNull(),
  lastSeenAt: ms('last_seen_at').notNull(),
  expiresAt: ms('expires_at').notNull(),
  absoluteExpiresAt: ms('absolute_expires_at').notNull(),
  userAgent: text('user_agent'),
  ipPrefix: text('ip_prefix'),
}, (t) => [index('sessions_user_idx').on(t.userId), index('sessions_exp_idx').on(t.expiresAt)]);

export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(),
  kind: text('kind', { enum: ['image', 'video', 'youtube'] }).notNull(),
  r2Key: text('r2_key').unique(),
  variantsJson: text('variants_json', { mode: 'json' }).$type<{ w: number; key: string; bytes: number }[]>(),
  mime: text('mime'), sizeBytes: integer('size_bytes'), sha256: text('sha256').unique(),
  width: integer('width'), height: integer('height'),
  focalX: real('focal_x').default(0.5), focalY: real('focal_y').default(0.5),
  lqip: text('lqip'), youtubeId: text('youtube_id'),
  ...l10n('alt', { required: false }),
  ...l10n('caption', { required: false }),
  credit: text('credit'), originalFilename: text('original_filename'),
  uploadedBy: text('uploaded_by').references(() => adminUsers.id),
  createdAt: ms('created_at').notNull(),
});

export const announcements = sqliteTable('announcements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  type: text('type', { enum: ['news', 'urgent', 'event'] }).notNull().default('news'),
  status: status(),
  ...l10n('title'),
  ...l10n('summary', { required: false }),
  ...l10n('bodyMd', { required: false }),     // columns body_md_ro … (rename helper arg to snake in real code)
  ...l10n('bodyHtml', { required: false }),
  coverMediaId: text('cover_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
  galleryId: integer('gallery_id'),
  pinnedBanner: bool('pinned_banner').notNull().default(false),
  bannerLevel: text('banner_level', { enum: ['info', 'warning', 'critical'] }).notNull().default('info'),
  ...l10n('bannerText', { required: false }),
  bannerUntil: ms('banner_until'),
  bannerPurged: bool('banner_purged').notNull().default(false),
  eventStart: ms('event_start'), eventEnd: ms('event_end'),
  ...l10n('eventLocation', { required: false }),
  pinnedTop: bool('pinned_top').notNull().default(false),
  publishAt: ms('publish_at'), publishedAt: ms('published_at'),
  ...tr(), ...stamps(),
}, (t) => [
  index('ann_pub_idx').on(t.status, t.publishedAt),
  check('ann_banner_chk', sql`${t.pinnedBanner} = 0 OR (${t.bannerUntil} IS NOT NULL AND ${t.bannerTextRo} IS NOT NULL)`),
  check('ann_event_chk', sql`${t.type} <> 'event' OR ${t.eventStart} IS NOT NULL`),
]);

export const DOC_CATEGORIES = ['rofuip', 'pdi-pas', 'oferta', 'dezbateri', 'posturi', 'formulare', 'raport', 'buget',
  'admitere', 'examene', 'burse', 'calendar', 'achizitii', 'gdpr', 'legislatie', 'alte'] as const; // never 'orar' (no timetable)

export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ...l10n('title'), ...l10n('description', { required: false }),
  category: text('category', { enum: DOC_CATEGORIES }).notNull(),
  academicYear: text('academic_year'),
  docLanguage: text('doc_language', { enum: ['ro', 'de', 'en', 'multi'] }).notNull().default('ro'),
  r2Key: text('r2_key').notNull().unique(),
  originalFilename: text('original_filename').notNull(),
  mime: text('mime').notNull(), sizeBytes: integer('size_bytes').notNull(), sha256: text('sha256').notNull(),
  pages: integer('pages'), issuedAt: ms('issued_at'), registrationNo: text('registration_no'),
  validUntil: ms('valid_until'),
  supersedesId: integer('supersedes_id'),
  status: status(), publishAt: ms('publish_at'), publishedAt: ms('published_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...tr(), ...stamps(),
}, (t) => [
  index('docs_cat_idx').on(t.status, t.category, t.academicYear, t.sortOrder),
  check('docs_year_chk', sql`${t.academicYear} IS NULL OR ${t.academicYear} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'`),
]);

export const cycles = sqliteTable('cycles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code', { enum: ['prescolar', 'primar', 'gimnazial', 'liceal'] }).notNull().unique(),
  nameRo: text('name_ro').notNull(), nameDe: text('name_de').notNull(), nameEn: text('name_en').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});
export const documentCycles = sqliteTable('document_cycles', {
  documentId: integer('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  cycleId: integer('cycle_id').notNull().references(() => cycles.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.documentId, t.cycleId] })]);

export const staff = sqliteTable('staff', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fullName: text('full_name').notNull(), sortName: text('sort_name').notNull(), titlePrefix: text('title_prefix'),
  ...l10n('role', { required: false }),
  category: text('category', { enum: ['conducere', 'profesori', 'zfa', 'auxiliar', 'nedidactic'] }).notNull(),
  departmentId: integer('department_id'),
  ...l10n('subject', { required: false }),
  email: text('email'), showEmail: bool('show_email').notNull().default(false),
  photoMediaId: text('photo_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
  photoConsent: bool('photo_consent').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(1000),
  status: text('status', { enum: ['active', 'hidden', 'former'] }).notNull().default('active'),
  updatedBy: text('updated_by'), createdAt: ms('created_at').notNull(), updatedAt: ms('updated_at').notNull(),
});
// … departments, pages, pageSections, admissionGuides, guideSteps, projects, studentLife, galleries,
// galleryItems, redirects, settings, contentDrafts, revisions, purgeQueue, auditLog, invites:
// same patterns, 1:1 with the SQL in §6.2. The SQL above is normative; drizzle-kit generate must reproduce it
// (diff the generated 0000_*.sql against §6.2 in review).
```
> Note: the `l10n()` helper uses its argument as both the TS key prefix and the SQL column prefix. In real code, pass `('body_md', 'bodyMd')` so that the SQL names match §6.2. Drizzle needs the column objects at module level, which spread syntax supports.

Usage in a page (one round trip):
```ts
import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
const db = drizzle(env.DB, { schema });
const [banner, settingsRows, item] = await db.batch([
  db.select().from(announcements).where(and(eq(announcements.pinnedBanner, true), gt(announcements.bannerUntil, now),
    eq(announcements.status, 'published'))).orderBy(desc(announcements.bannerLevel)).limit(1),
  db.select().from(settings),
  db.select().from(announcements).where(and(eq(announcements.slug, slug), eq(announcements.status, 'published'))).limit(1),
]);
Astro.cache.set({ tags: ['layout', 'ann', `ann:${item[0]?.id}`] });
```

### 6.4 Upload and content validation ("staff can never break the UI")
All of these rules are enforced **server-side** in `/api/admin/upload`. The client repeats them only for UX.

**General**
- Requires an auth session, role ≠ translator, CSRF and `RL_UPLOAD`. Requests use `multipart/form-data`, one file each.
- **Ignore the client's `Content-Type` and file extension.** Detect the type from **magic bytes** and derive the extension from the detected type.
- Compute SHA-256 over the bytes and **deduplicate**: an existing hash returns the existing asset.
- **R2 keys are content-addressed:** `files/<sha12>/<safe-name>.<ext>` and `img/<sha12>/<width>.webp`. They are never overwritten, which makes `immutable` caching safe. "Replace file" creates a new key and updates the row, and a cron job deletes R2 keys that no row references, after 30 days.
- Use `R2.put(key, body, { sha256, httpMetadata: { contentType, contentDisposition, cacheControl: 'public, max-age=31536000, immutable' }, customMetadata: { uploadedBy, originalName } })`.

| Type | Allowed MIME (sniffed) | Magic bytes | Max size | Extra checks |
|---|---|---|---|---|
| PDF | `application/pdf` | `%PDF-1.` or `%PDF-2.` within the first 1024 bytes, **and** `%%EOF` within the last 2048 bytes | **25 MiB** | **Reject** files that contain `/JavaScript`, `/JS `, `/Launch`, `/EmbeddedFile`, `/RichMedia` or `/XFA` (a byte scan). **Warn** on `/Encrypt`, because the file cannot be indexed. Count `/Type /Page` (not `/Pages`) for the page count, best effort. |
| DOCX / XLSX | OOXML types | `PK\x03\x04`, plus the ZIP central directory contains `[Content_Types].xml` and `word/` or `xl/` | 10 MiB | Reject `vbaProject.bin` (macros). Served as an attachment. |
| ODT | `application/vnd.oasis.opendocument.text` | `PK\x03\x04` with the first entry `mimetype` = that string | 10 MiB | Served as an attachment |
| Image (source) | JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, WebP `RIFF....WEBP`, AVIF `....ftypavif` | — | 20 MiB source (client side) | **SVG, GIF, TIFF and HEIC are rejected.** SVG is an XSS vector. For HEIC the UI says "Exportați ca JPG". |
| Image (stored) | `image/webp` only | `RIFF....WEBP` | 1.5 MiB per variant | The browser (OffscreenCanvas) resizes to widths **480 / 960 / 1600** (and 2400 for galleries), WebP q≈0.8. Re-encoding **strips EXIF/GPS**. The server parses the VP8/VP8L/VP8X header to verify width and height, requires width ≤ 2400 and an aspect ratio between 1:4 and 4:1, and requires `alt_ro` before an image can be used publicly. |
| Video | not stored (R2 egress is free, but there is no transcoding) | — | — | Use YouTube links. Store `youtube_id` (11 characters `[A-Za-z0-9_-]`). Render a click-to-load facade with a `youtube-nocookie.com` iframe. |

**Filename sanitization**
1. Remove the path (`/`, `\`) and normalize with NFKD.
2. Transliterate: `ă→a, â→a, î→i, ș/ş→s, ț/ţ→t, ä→ae, ö→oe, ü→ue, ß→ss`, then strip combining marks.
3. Lowercase, replace `[^a-z0-9]+` with `-`, and trim dashes.
4. Truncate to 80 chars, falling back to `document` if empty. Append the extension **from the sniffed type**.
5. Keep the original name only in the DB (`original_filename`, ≤ 255 chars, control characters stripped) for display.
6. Serve with `Content-Disposition: inline; filename="<safe>"; filename*=UTF-8''<rfc5987(original)>` for PDFs, and `attachment` for office files.

**Serving `/files/*` and `/media/*`**
- The Worker route reads `R2.get(key, { range, onlyIf: request.headers })` and calls `writeHttpMetadata`.
- It sets `ETag: obj.httpEtag`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox; default-src 'none'` (on PDFs/files), and `Cross-Origin-Resource-Policy: same-site`.
- It caches through Workers Cache with `maxAge` of 1 year. **Range note:** Workers Cache strips `Range` before invoking the Worker and stores the full 200, so PDF viewers still get ranges from cache.

**Text and Markdown safety**
- Markdown is rendered **at save time** with `marked` using a restricted renderer:
  - raw `html` tokens are **escaped**, not passed through;
  - headings are shifted to h2–h4, since h1 belongs to the page title;
  - links are limited to `https:`, `mailto:`, `tel:` and same-site relative URLs. External links get `rel="noopener"`, `class="ext"` and an external-link icon;
  - images are allowed only as `/media/...` references chosen in the media picker;
  - tables are wrapped in `<div class="table-scroll">`.
- The resulting HTML is checked once more against a tag/attribute allowlist (a simple DOM walk via `HTMLRewriter`). A failure rejects the save.
- Length limits are enforced both as DB `CHECK`s and in the form: title ≤ 160, summary ≤ 300, banner ≤ 140, body ≤ 200 KB.
- CSS: content containers use `overflow-wrap: anywhere; hyphens: auto` (with `lang` set per block). Media is `max-inline-size: 100%`. Tables scroll horizontally. Long URLs wrap. Images always have width/height, so there is no layout shift.
- Dates go through `Intl.DateTimeFormat(locale, { timeZone: 'Europe/Bucharest' })`. Name sorting uses `Intl.Collator('ro')`.

---

## 7. Edge behaviour details

### 7.1 Middleware order (`src/middleware.ts`)
1. **Canonicalize:** force HTTPS, the `www` host, no trailing slash (or always a slash, pick one), lowercase path, strip tracking params → 301.
2. **Routing class:** decide `public | admin | api-admin | media` by path prefix.
3. **Admin:** session lookup, the `mfa_ok` gate, role check, CSRF check on unsafe methods. Set `Cache-Control: private, no-store`, `X-Robots-Tag: noindex`, and the admin CSP header.
4. **Public:** run `next()`, then remove any `Set-Cookie`, set the browser `Cache-Control` and the security headers. The route sets the cache tags.
5. **404 handling:** on a 404 for a public path, look up `redirects` (`from_path` normalized). A match returns a 301/302/308/410 (a cached response), increments `hits` via `waitUntil`, and is debounced. No D1 hit happens for normal pages, and redirect responses are edge-cached too. Changing a redirect purges `path:<from>`.

### 7.2 Security headers
For SSR responses the headers are set in middleware. For static assets they come from `public/_headers`. `_headers` applies only to static assets, and in `astro dev` only with `experimental.headersAndRedirectsDevModeSupport`.

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload   (enable preload only after verifying all subdomains)
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-site
X-Frame-Options: DENY                         (legacy; CSP frame-ancestors is authoritative)
Content-Security-Policy: frame-ancestors 'none'   (HTTP header; meta CSP cannot set frame-ancestors)
```
The main CSP is generated by Astro `security.csp` as a `<meta>` tag with script and style **hashes** (config in §3.1). Its effective policy is:
```
default-src 'self'; script-src 'self' 'sha256-…' https://challenges.cloudflare.com; style-src 'self' 'sha256-…';
img-src 'self' data: https://i.ytimg.com; font-src 'self'; connect-src 'self'; media-src 'self';
frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com https://www.google.com;
object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests
```
- **Admin** pages use the same CSP, with `frame-src 'self' https://challenges.cloudflare.com` (preview iframe + Turnstile) and the header `frame-ancestors 'self'` on `/admin/preview/*` only.
- **Fonts are self-hosted.** No Google Fonts request, which avoids a GDPR problem.
- Optional Cloudflare Web Analytics adds `https://static.cloudflareinsights.com` to `script-src` and `https://cloudflareinsights.com` to `connect-src`.
- Add a `report-to` endpoint (`/api/csp-report`, rate-limited, sampled to `audit_log`) if wanted.
- Test CSP **only** with `astro build && astro preview`, because CSP does nothing in dev.

### 7.3 Turnstile
Turnstile is used on `/admin/login`, `/admin/activare` and the recovery-code form. There are no public forms in v1. If a contact form is added later, it gets Turnstile too.
- The widget renders in **managed** mode with the `ro`/`de` language matching the admin UI locale.
- Server-side validation is in §5.3. The `hostname` must match the production or preview host.
- Local and dev use the test site key `1x00000000000000000000AA` and the secret `1x0000000000000000000000000000000AA`. Automated tests use `2x…` to cover the fail path.

### 7.4 Images on the free plan
| Option | Cost / limit | Verdict |
|---|---|---|
| **Client-side variants at upload** (admin browser, canvas → WebP) | 0, unlimited, EXIF stripped | **Chosen for user uploads** |
| Astro `imageService: 'compile'` (sharp at build) | 0, build-time only | **Chosen for repo assets** (logo, hero art) |
| Images binding / `cloudflare-binding` (adapter default) | 5,000 unique transformations/month free; then error 9422 | Fallback only. Remember that the adapter auto-adds `IMAGES`. |
| `/cdn-cgi/image` URL transforms | Same quota, plus it needs zone-level enabling | No |

`<picture>`/`srcset` is built from `variants_json`, with explicit `width`/`height`, `loading="lazy"` (except the LCP hero, which uses `fetchpriority="high"`), and a blurred LQIP background colour.

### 7.5 Navigation, JS budget
- **No `<ClientRouter />`.** It conflicts with CSP, adds about 10 KB, and would need to manage focus and announcements for accessibility. Use **native cross-document view transitions** in CSS:
  `@view-transition { navigation: auto; }`, with `view-transition-name` on the header and logo, wrapped in `@media (prefers-reduced-motion: no-preference)`. Supporting browsers animate. Others simply navigate.
- `prefetch` uses hover on primary nav and card links (`data-astro-prefetch`). On a cache hit the next page is already local.
- **Search (`Ctrl/Cmd + K`):** a per-locale JSON index at `/{locale}/search-index.json`. It is generated on demand from D1 (title, summary, url, type), edge-cached, and carries the tag `sitemap`, so any publish purges it. It is lazy-loaded on first open and searched in memory (Doherty < 100 ms). Server-side FTS5 (`search_fts`) is the fallback for full-text document search.
- Public interactive pieces are vanilla `<script>` modules bundled by Astro (hashed, so CSP-safe): the nav toggle, a banner dismiss that stores the banner id in `localStorage` (it never affects HTML, so caching stays safe), the YouTube facade and document filters (progressive: filter forms work without JS through query params, which are a stable cache key).

---

## 8. `/admin` UX specification

### 8.1 Principles
- **Romanian first**, with German as a full alternative (`ui_locale` per user, toggled in the header). Admin strings live in `src/admin/i18n/{ro,de}.json`. The admin UI is separate from the site's content languages.
- Made for **non-technical teachers and secretaries**: big targets, plain words ("Publică", "Salvează ciornă", "Previzualizare"), no Markdown jargon (a toolbar inserts it), autosave, and undo through revisions.
- Server-rendered Astro pages with forms that work without JS. Small vanilla-JS enhancements: autosave, live preview, drag-sort, upload progress. The admin JS budget is ≤ 30 KB. No SPA.
- Accessible (WCAG 2.2 AA): labels, error summaries linked to fields, focus management after save, works with keyboard only.

### 8.2 Information architecture (sidebar)
```
Panou (Dashboard)
Anunțuri            → Toate · Urgente/banner · Evenimente
Documente           → pe categorii · Încărcare multiplă
Admitere & examene  → Ghiduri · Pași & termene
Pagini              → Despre · Istoric · Contact · GDPR … (secțiuni)
Personal            → Persoane · Catedre
Proiecte
Viața elevilor
Media               → Bibliotecă · Galerii
Traduceri           → coadă DE / EN
— (admin only) —
Redirecționări · Setări (linkuri NoteInCatalog/Classroom, contacte, meniu) · Utilizatori · Jurnal (audit) · Cache (purge manual)
```

### 8.3 Screens
1. **Dashboard:**
   - an "Active banner" card showing the current urgent banner with its expiry, plus "Prelungește" (extend) and "Oprește acum" (stop now) buttons;
   - "Drafts I'm working on";
   - "Scheduled";
   - "Translation queue" counts (DE missing or outdated, EN missing or outdated);
   - "Expiring": job postings or debates past `valid_until`, and banners ending within 24 h;
   - recent activity from the audit log.
2. **List views:**
   - a table with title (RO), status pill (Ciornă / Programat / Publicat / Arhivat), translation chips **RO● DE◐ EN○**, the date, and the author;
   - filters by status, type, category, year and translation state, plus search;
   - bulk actions: archive, and change category or year (for documents).
3. **Editor (two-pane):** form on the left, **live preview** on the right (iframe, device-width toggle 360 / 768 / 1280, language tabs RO/DE/EN).
   - **Language tabs above the fields.** RO is the source. The DE/EN tabs show the RO text greyed out above each field as a reference, and a "Marchează traducerea ca finalizată" (mark translation done) checkbox.
   - **Markdown toolbar:** B, I, H2, H3, list, numbered list, link, "insert document" picker, "insert image" picker. An optional "Vizual" toggle shows the rendered preview inline.
   - **Autosave** to `content_drafts` every 5 s while typing (debounced), shown as "Salvat 12:04". On conflict, an inline banner says "Modificat de X la 12:03 – vezi diferențe".
   - The **preview** updates on autosave through `postMessage` → iframe reload of `/admin/preview/...`, which uses the same components as the public site, so there are no WYSIWYG surprises.
   - **Validation** happens inline, plus an error summary at the top. Publish is disabled until RO-required fields are valid. DE/EN gaps only warn, because RO fallback is shown publicly.
   - **Right rail:** status, publish/schedule date-time (Europe/Bucharest), slug (auto from title and editable, with "slug changed → redirect created" shown), cover image picker with an alt-text requirement, SEO description, and revisions list with "Restaurează" (restore).
4. **Urgent banner flow:** on an announcement, a "Afișează ca banner pe tot site-ul" (show as site-wide banner) toggle reveals level (info / avertizare / critic), a short text ≤ 140 chars in RO (DE/EN optional) and **end date-time (required, default +3 days)**. Preview shows the banner on a homepage mock. Publishing purges `layout`. At most **one** critical banner can be active; if a second is published, the UI asks which one replaces the other.
5. **Documents:**
   - The upload uses drag-drop and supports **multiple files at once**.
   - For each file it shows a progress bar, the detected type, the size and the page count.
   - It flags a **duplicate** with "Acest fișier există deja: …".
   - Required fields: category (from the enum, with Romanian labels and a short help text each, e.g. ROFUIP = "Regulamentul de organizare și funcționare…"), academic year (defaults to the current one: Sept → next year), cycles (multi), title RO (prefilled from the cleaned filename), and optional registration number and date.
   - "Înlocuiește fișierul" (replace file) keeps the URL slug and history.
   - "Expiră la" (expires on) archives the document automatically.
6. **Admission guides:** the guide header plus **ordered steps** (drag-sort, keyboard ▲▼). Each step has title, text, start/deadline (date or date-time), location, a link or an attached document. A timeline preview highlights past, current and next steps. Use "Duplică ghidul pentru anul următor" (duplicate guide for next year) to copy it with dates shifted +1 year as drafts.
7. **Staff:**
   - The table can be grouped by category or department, with drag-sort inside a group.
   - Each person has a photo with a **consent checkbox** (required to show the photo) and an email with a "Afișează public" (show publicly) checkbox, which defaults to off.
   - CSV import (admin) covers the yearly roster.
   - A translator sees only role/subject DE/EN.
8. **Media library:**
   - A grid shows filters (type, used / unused) and search by alt or caption.
   - Upload shows a client-side resize progress indicator.
   - **Alt text is required (RO)**, with a hint: "Descrieți ce se vede, nu «poză»".
   - Other fields: focal-point picker (click on the image) and credit.
   - The "Folosit în" (used in) panel lists where an image is used and blocks deletion while it is in use.
   - Galleries: create, multi-select images, drag-order, pick the cover.
9. **Translation queue:** one list across all types, filtered by language and state (missing / outdated). A side-by-side **RO | DE** editor shows the RO diff since the last translation when the state is *outdated*. "Salvează și următorul" (save and next) moves on. This is the translator's home screen.
10. **Redirects (admin):** a table of from → to with code, hits and last hit. "Testează" (test) resolves a URL. CSV import is used for the legacy-site migration map. Validation blocks loops and chains longer than 1.
11. **Settings (admin):** external links (NoteInCatalog, Google Classroom, Moodle…) as localized label + URL, contact block, social links, main menu editor (tree, max 2 levels), and the translator auto-publish toggle.
12. **Users (admin):**
    - invite (returns the link to copy) and change role;
    - disable user, or reset password (generates a reset link);
    - force TOTP, view active sessions, revoke a session.
13. **Audit log (admin):** filterable and read-only, with CSV export.
14. **Cache (admin):** "Golește cache-ul site-ului" (clear site cache, `purgeEverything`) with a confirmation, plus the last 20 purge results. Staff should rarely need it.

### 8.4 Publishing workflow
```
           ┌────────── Salvează ciornă (autosave) ─────────┐
 [Nou] ─► Ciornă ──► (Trimite spre revizie)* ──► Publică acum ─► Publicat ──► Arhivează ─► Arhivat
                     │                          └► Programează ─► Programat ──(cron)──► Publicat
 Publicat ──edit──► content_drafts (live unchanged) ──► Publică modificările ─► Publicat (rev+1, purge)
                                                     └► Renunță la modificări
 * translators and optional "review" mode: editor/admin must approve
```
- Every transition writes to `audit_log`, and every publish creates a `revisions` snapshot and a purge.
- Unpublish and archive also purge, and they remove the item from the sitemap and FTS.
- Deletes are soft (archived) for editors. Only an admin can hard-delete, and only after 30 days in the archive.

---

## 9. Operations
- **Backups:** D1 Time Travel gives 7 days (Free) or 30 days (Paid) of point-in-time restore. In addition, a weekly `wrangler d1 export DB --remote --output=backup.sql` runs from CI (GitHub Action with a scoped API token) and is uploaded to a separate R2 bucket. R2 media is append-only through content-addressed keys, so it serves as its own history.
- **Observability:** Workers Logs (`observability.enabled`). A `Server-Timing` header (`d1;dur=…, render;dur=…`) appears on misses. The admin "Cache" screen shows purge results.
- **Deploy:** GitHub → CI runs `astro check`, `astro build`, `wrangler d1 migrations apply --remote`, then `wrangler versions upload`. A smoke test runs on the preview URL before `wrangler versions deploy`. Staff are never involved. A deploy starts with a cold cache, which fills automatically.
- **GDPR:** D1 and R2 use `--jurisdiction=eu`. There is no tracking and no third-party fonts. The YouTube facade loads nothing from Google until the user clicks. Staff photos and emails are shown only with a consent flag. `ip_prefix` is truncated. The audit log is kept for 24 months.

---

## 10. Gotchas checklist
1. `Astro.locals.runtime.env` **throws** in adapter 13+. Use `import { env } from 'cloudflare:workers'`. `ctx` is `Astro.locals.cfContext`.
2. `platformProxy` / `getPlatformProxy` are gone. `astro dev` already runs `workerd` with your wrangler bindings. Use `remoteBindings` only when you want dev to hit real D1/R2.
3. The adapter **auto-adds `SESSION` (KV) and `IMAGES` bindings**. Set `session: false` (Astro ≥ 7.2) and choose `imageService` explicitly.
4. **TypeScript 7 is `latest`, but `@astrojs/check` supports only 5–6.** Pin `typescript@~6.0.3`.
5. Workers Cache **ignores cookies in the cache key**. Never personalize public HTML, and always use `no-store` on admin.
6. `s-maxage` / `must-revalidate` **disable SWR** in Workers Cache. Purge limits are always at the Free tier, so coalesce purges.
7. The Astro Cloudflare cache provider is still labelled **experimental**, and route caching is a **no-op in dev**. Verify on a preview deploy (`Cf-Cache-Status`).
8. **`security.csp` breaks `<ClientRouter />`** and does nothing in `astro dev`.
9. PBKDF2 is capped at **100k iterations** in production workerd, so add a pepper. Its CPU cost exceeds the **Free plan's 10 ms**, so use Workers Paid.
10. D1 allows **100 bound parameters** per query. Chunk bulk inserts such as CSV staff import. Use `db.batch()` to stay under the per-invocation query cap and to get atomicity.
11. `wrangler d1 migrations apply` targets `--local` or `--remote`: always pass one explicitly. Do not mix in `drizzle-kit push`.
12. `compatibility_date` must not be later than the installed workerd supports. `nodejs_compat` is default-on for dates ≥ 2026-08-04.
13. Astro 7 uses a Rust compiler that **rejects invalid HTML nesting**, and `compressHTML: 'jsx'` eats whitespace between inline elements.
14. The R2 binding cannot mint presigned URLs, and presigned URLs do not work on custom domains. Our design does not need them, because uploads are ≤ 25 MiB through the Worker (100 MB body limit).
15. A deploy starts with an empty cache, because the Worker version is part of the key. Expect a short miss spike after each deploy.

---

## 11. Sources
- Astro Cloudflare adapter: https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- Astro route caching: https://docs.astro.build/en/guides/caching/ · https://docs.astro.build/en/reference/experimental-flags/route-caching/
- Astro i18n: https://docs.astro.build/en/guides/internationalization/
- Astro sessions: https://docs.astro.build/en/guides/sessions/
- Astro config (CSP, checkOrigin, prefetch, session): https://docs.astro.build/en/reference/configuration-reference/
- Astro v7 upgrade: https://docs.astro.build/en/guides/upgrade-to/v7/
- Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/
- Pages → Workers: https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Compatibility flags: https://developers.cloudflare.com/workers/configuration/compatibility-flags/
- Workers Cache: https://developers.cloudflare.com/workers/cache/ · /configuration/ · /purge/ · /cache-keys/ · /limitations/ · blog https://blog.cloudflare.com/workers-cache/
- Cache API: https://developers.cloudflare.com/workers/runtime-apis/cache/
- Web Crypto: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ · PBKDF2 cap: https://github.com/cloudflare/workerd/issues/1346
- Rate limiting binding: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- D1 limits / pricing / migrations / location / replication / wrangler d1: https://developers.cloudflare.com/d1/platform/limits/ · https://developers.cloudflare.com/d1/platform/pricing/ · https://developers.cloudflare.com/d1/reference/migrations/ · https://developers.cloudflare.com/d1/configuration/data-location/ · https://developers.cloudflare.com/d1/best-practices/read-replication/ · https://developers.cloudflare.com/workers/wrangler/commands/d1/
- R2 limits / pricing / Workers API / presigned: https://developers.cloudflare.com/r2/platform/limits/ · https://developers.cloudflare.com/r2/pricing/ · https://developers.cloudflare.com/r2/api/workers/workers-api-reference/ · https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- Turnstile: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ · https://developers.cloudflare.com/turnstile/troubleshooting/testing/
- Images pricing: https://developers.cloudflare.com/images/pricing/
- Drizzle + D1: https://orm.drizzle.team/docs/connect-cloudflare-d1
