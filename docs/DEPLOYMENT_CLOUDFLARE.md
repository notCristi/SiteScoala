# Deploying to Cloudflare

The whole site — public pages, `/admin`, file serving and the 5-minute cron — is **one Cloudflare Worker** with static assets, a **D1** database (`honterus-db`) and an **R2** bucket (`honterus-media`). There is no separate Pages project and no other server.

| Piece | Cloudflare product | Binding |
|---|---|---|
| Code + static assets (`dist/client`) | Workers (with Static Assets) | `ASSETS` |
| Content, users, sessions, redirects | D1 | `DB` |
| Uploaded documents and images | R2 | `MEDIA` |
| Edge HTML cache, purged on publish | Workers Cache (via Astro route caching) | — |
| Spam protection on login and contact form | Turnstile | `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET` |
| Cache purge queue, session clean-up | Cron trigger `*/5 * * * *` | — |

---

## 1. One-time setup (about 20 minutes)

### 1.1 Accounts
1. A Cloudflare account (free is enough to start; see §6 on the paid plan).
2. This GitHub repository.
3. Node.js 22+ locally, only for the one-off seed in step 1.5.

### 1.2 Turnstile widget
1. Cloudflare dashboard → **Turnstile** → **Add widget**.
2. Name `Honterus`, hostnames `liceulhonterusbrasov.ro` and `www.liceulhonterusbrasov.ro` (plus the `*.workers.dev` preview host if you want to test there), mode **Managed**.
3. Copy the **site key** into `wrangler.jsonc` → `vars.TURNSTILE_SITE_KEY` (site keys are public, so committing it is fine) and keep the **secret key** for step 1.4.

### 1.3 Connect the repository (Workers Builds)
1. Dashboard → **Workers & Pages** → **Create** → **Import a repository** → choose this repository.
2. Settings:
   - **Project name:** `honterus-site` (must match `name` in `wrangler.jsonc`)
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Deploy command:** `npm run deploy` (runs `wrangler deploy`, then applies pending D1 migrations)
   - **Root directory:** `/`
   - Environment variable for the build: `NODE_VERSION = 22`
3. Save and deploy. On the first deploy Wrangler **provisions D1 `honterus-db` and R2 `honterus-media` automatically** (no `database_id` is pinned in `wrangler.jsonc`), then the deploy command creates all tables.

> Prefer to create resources by hand? `npx wrangler d1 create honterus-db` and `npx wrangler r2 bucket create honterus-media`, then paste the printed `database_id` into `wrangler.jsonc`.

### 1.4 Secrets
Worker → **Settings** → **Variables and Secrets** → add each as type **Secret**:

| Name | Value |
|---|---|
| `AUTH_PEPPER` | a long random string, e.g. `openssl rand -base64 48`. **Never change it later** — all passwords depend on it. |
| `ADMIN_BOOTSTRAP_EMAIL` | the first administrator's e-mail (the seed placeholder is `YOUR_EMAIL@EXAMPLE.COM`) |
| `ADMIN_BOOTSTRAP_PASSWORD` | a strong temporary password; change it at first login |
| `TURNSTILE_SECRET` | the Turnstile secret key from 1.2 |
| `PBKDF2_ITERATIONS` *(optional, plain variable)* | default `100000`; see §6 |

The bootstrap account only works while **no** administrator exists. After the first login, create the secretariat accounts under **/admin → Utilizatori** (invitation links) and you may delete the two `ADMIN_BOOTSTRAP_*` secrets.

### 1.5 Load the initial content (once)
```bash
npm ci
npx wrangler login
npm run db:migrate:prod      # safe to repeat
npm run media:legacy-docs        # download the legacy documents listed in documents.json (cached in .cache/)
npm run media:legacy-docs:prod   # upload them to R2 (honterus-media) — about 290 files, once
npm run db:seed:prod             # ONCE — replaces all content tables
```
The seed contains the migrated news, documents, staff directory, guides, history and the 301 map from the old site. **Run it only before launch**: afterwards `/admin` is the source of truth and re-seeding would overwrite edits.

The legacy documents are copied into R2 and served at `/files/legacy/…`; every old `/lic/wp-content/uploads/…` address of an imported file gets a 301 to its new address, so links in e-mails and search results keep working. Files with personal data (`scripts/seed/content/documents-excluded.json`) are never imported. The manifest `scripts/seed/content/documents-files.json` is committed, so the seed knows the R2 keys even on a machine that has not run the download.

### 1.6 Domain
1. The domain's DNS must be on Cloudflare (Websites → Add site → follow the nameserver instructions).
2. Worker → **Settings** → **Domains & Routes** → **Add custom domain**: `liceulhonterusbrasov.ro` and `www.liceulhonterusbrasov.ro`.
3. Every old URL (including the whole `/lic/` WordPress tree) is answered by the redirect table: open `/admin → Redirecționări` to see hits and add more.

---

## 2. Everyday deploys
Push or merge to `main` → Cloudflare builds and deploys in about two minutes. Pull requests get preview builds if you enable **Preview deployments** in the Worker's build settings. Migrations in `migrations/` are applied automatically by `npm run deploy`.

Rollback: Worker → **Deployments** → pick an earlier version → **Rollback**. Database migrations are additive, so an older version keeps working.

## 3. Local development
```bash
npm ci
cp .dev.vars.example .dev.vars   # test keys for Turnstile, a dev pepper and bootstrap login
npm run setup                    # local D1: migrations + seed (wrangler --local, stored in .wrangler/)
npm run dev                      # http://localhost:4321/ro/  ·  /admin
npm run preview                  # production build served by wrangler dev (closest to the edge)
npm run check                    # astro check + eslint (CI runs the same plus the build)
npm run db:reset:local           # wipe and re-seed the local database
```
Local R2 uploads are stored under `.wrangler/state`. The Turnstile test keys always pass.

## 4. Caching
- Public HTML is cached at the edge for a day (stale-while-revalidate a week) and tagged by section. Publishing in `/admin` purges exactly the affected tags, so changes are visible within seconds; if a purge cannot run immediately it is queued and the cron retries every 5 minutes.
- Browsers always revalidate HTML (`max-age=0`), so nobody sees an outdated page from their own cache.
- Fingerprinted assets (`/_astro/*`, `/fonts/*`) are immutable for a year (`public/_headers`).

## 5. Security notes
- Security headers and a Content-Security-Policy are set in `src/middleware.ts`; `/admin` is `no-store` and `noindex`.
- Public pages never read cookies and the middleware strips any `Set-Cookie` from them, so the shared cache cannot leak a session.
- Passwords: PBKDF2-SHA256 with per-user salt and the `AUTH_PEPPER`; sessions are stored hashed in D1; five failed logins lock the account for 15 minutes.
- No secrets live in git: `.dev.vars` and `.env*` are ignored.

## 6. Plan and limits
- The **Workers Free** plan is enough for traffic (100 000 requests/day, static assets free), but it limits CPU to 10 ms per request. Password hashing at 100 000 PBKDF2 iterations can exceed that on login. Either use **Workers Paid** (USD 5/month, recommended for a production school site, also raises D1 limits) or set `PBKDF2_ITERATIONS` to `20000` on Free; existing hashes keep their own iteration count, so you can raise it later without resetting passwords.
- D1 free tier: 5 GB storage, 5 million reads/day — far above this site's needs because pages are served from the edge cache.
- R2 free tier: 10 GB storage, no egress fees.

## 7. Checklist before switching DNS
- [ ] `TURNSTILE_SITE_KEY` in `wrangler.jsonc` is the real key, `TURNSTILE_SECRET` set
- [ ] `AUTH_PEPPER` set (and backed up in the school's password manager)
- [ ] First admin logged in, password changed, secretariat accounts invited
- [ ] Seed loaded once; leadership names, office hours and contact data confirmed in `/admin → Setări` and `/admin → Personal`
- [ ] Spot-check 10 old URLs from `/lic/…` redirect correctly
- [ ] `https://liceulhonterusbrasov.ro/sitemap.xml` submitted in Google Search Console
