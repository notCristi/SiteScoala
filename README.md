# Colegiul Național „Johannes Honterus” Brașov — website

The public website and the `/admin` content management system of the Honterus National College (*Honterus-Nationalkolleg Kronstadt*), replacing `liceulhonterusbrasov.ro` and its `/lic/` WordPress site.

- **Three languages, equal quality:** Romanian (default), German, English — `/ro/…`, `/de/…`, `/en/…`, with `hreflang` alternates and a language switcher that keeps you on the same page.
- **For a parent on a phone:** admissions and exam guides as numbered steps with dates and personal checklists, a filterable document library, a typographic staff directory, instant search (`Ctrl/Cmd + K`).
- **For the secretariat:** `/admin` in Romanian and German — news and urgent banners, documents uploaded straight to storage, guides, staff, pages, history, projects, media with image replacement, contact messages, users and roles, redirects, audit log.
- **On Cloudflare's edge:** one Worker with static assets, D1 (SQLite) and R2; HTML cached at the edge and purged by tag on publish.
- **Design:** “Officina Coronensis” — the school as a Renaissance printing house: Honterus’s woodcuts, the *Rudimenta Cosmographica*, the seal’s red, blue and ink. Vector seal reconstructed from the official logo.

There is deliberately **no timetable** on this site.

## Quick start

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run setup        # local D1: migrations + seed content
npm run dev          # http://localhost:4321/ro/   and   /admin
```

Log in to `/admin` with `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` from `.dev.vars` (first login only creates the administrator).

| Script | What it does |
|---|---|
| `npm run dev` | Astro dev server on the real Workers runtime (local D1 + R2) |
| `npm run build` / `npm run preview` | production build / build served by `wrangler dev` |
| `npm run check` | `astro check` (TypeScript) + ESLint |
| `npm run db:generate` | generate a migration after changing `src/db/schema.ts` |
| `npm run db:migrate:local` / `:prod` | apply migrations |
| `npm run db:seed:local` / `:prod` | build `seed/seed.sql` from `scripts/seed/content/*.json` and load it |
| `npm run db:reset:local` | wipe and re-seed the local database |
| `npm run media:heritage` | re-download the freely licensed heritage images from Wikimedia Commons |
| `npm run media:legacy-docs` (`:local`, `:prod`) | copy the old site's documents into R2 |
| `npm run brand:logo` | regenerate the vector seal from `scripts/brand/logo-params.json` |
| `npm run deploy` | `wrangler deploy` + remote migrations (used by Cloudflare Workers Builds) |

## Documentation

| | |
|---|---|
| [CLAUDE.md](CLAUDE.md) | the project constitution: hard rules, language standards, performance budget, quality gate |
| [docs/00_LOGO_SPEC.md](docs/00_LOGO_SPEC.md) | logo reconstruction and variants |
| [docs/01_LEGACY_CONTENT_AND_MIGRATION_MAP.md](docs/01_LEGACY_CONTENT_AND_MIGRATION_MAP.md) | crawl of the old site, what moved where, what was excluded and why |
| [docs/02_HONTERUS_HERITAGE_AND_MEDIA_DOSSIER.md](docs/02_HONTERUS_HERITAGE_AND_MEDIA_DOSSIER.md) | verified history and the image and video catalogue with licences |
| [docs/03_UX_LAWS_AND_ACADEMIC_BENCHMARK.md](docs/03_UX_LAWS_AND_ACADEMIC_BENCHMARK.md) | information architecture, UX rules and acceptance tests |
| [docs/04_CLOUDFLARE_EDGE_AND_CMS_ARCHITECTURE.md](docs/04_CLOUDFLARE_EDGE_AND_CMS_ARCHITECTURE.md) | architecture, data model, caching, security |
| [docs/05_BESPOKE_DESIGN_SYSTEM.md](docs/05_BESPOKE_DESIGN_SYSTEM.md) | the design system |
| [docs/06_DESIGN_JURY_SIGN_OFF.md](docs/06_DESIGN_JURY_SIGN_OFF.md) | design review and sign-off |
| [docs/DEPLOYMENT_CLOUDFLARE.md](docs/DEPLOYMENT_CLOUDFLARE.md) | step-by-step deployment |
| [docs/ADMIN_MANUAL_RO_DE.md](docs/ADMIN_MANUAL_RO_DE.md) | manual for school staff (Romanian and German) |

## Repository map

```
src/
  pages/[lang]/[...path].astro   public router (route table in src/i18n/routes.ts)
  pages/admin/, pages/api/admin/ CMS
  pages/files/, pages/img/       R2 file serving
  views/                         one view per public page type
  components/svg/                bespoke SVGs (seal, crest, emblems, courtyard frieze, icons)
  db/schema.ts                   Drizzle schema → migrations/
  server/                        data access, auth, search index, cache tags, redirects
  middleware.ts                  canonical URLs, security headers, legacy redirects, admin gate
scripts/brand/   logo pipeline       scripts/seed/   content JSON + seed builder
scripts/media/   image and document import
public/          brand files, fonts, heritage media (with credits.json)
```

## Content and credits

All facts trace to the old official website or to the sources in `docs/02`. Staff appear by name as published on the old site, without photos unless uploaded later with consent. Heritage images come from Wikimedia Commons under public domain, CC0 or CC BY(-SA) licences; authors and licences are in `public/media/heritage/credits.json` and shown beside each image. Fonts: EB Garamond and Atkinson Hyperlegible Next (SIL Open Font License).
