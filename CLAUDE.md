# CLAUDE.md — Honterus website constitution

Every agent working in this repository inherits these rules. Read them before touching code or copy.

## Mission

Build the production website and admin CMS of **Colegiul Național „Johannes Honterus” Brașov** (*Honterus-Nationalkolleg Kronstadt*, *“Johannes Honterus” National College Brașov*), replacing `liceulhonterusbrasov.ro` and its `/lic/` WordPress site. The school was reformed as a humanist gymnasium by Johannes Honterus in the 1540s; it teaches in German and Romanian across primary (Clasa pregătitoare–IV), gymnasium (V–VIII) and lyceum (IX–XII), and awards the Deutsches Sprachdiplom (DSD I & II).

Two audiences come first: **a stressed parent on a mid-range phone** and **a school secretary who is not technical**. Everything else follows.

## Hard rules

1. **No timetable.** Do not build an *Orar* / class-schedule page, module, table or link. Ever.
2. **No fake content.** No lorem ipsum, invented people, invented quotes, stock faces, AI-generated portraits or made-up statistics. Every fact traces to `docs/01_…` (legacy site) or `docs/02_…` (verified research). Unverified → leave it out or mark it for the school to confirm.
3. **Staff:** real names as published on the old site; no photos by default (typographic directory). Photos only if uploaded later via `/admin`.
4. **Logo:** always use the vector files in `public/brand/` or `<Seal>` / `<Crest>` components. Never a PNG of the logo in the UI. Regenerate with `node scripts/brand/build-logo.mjs`. See `docs/00_LOGO_SPEC.md`.
5. **Three languages, equal quality:** `ro` (default), `de`, `en`. Routes are always prefixed: `/ro/…`, `/de/…`, `/en/…`. Every public page has `hreflang` alternates + `x-default`. Language switcher keeps the user on the equivalent page, labels languages in their own language (Română · Deutsch · English), never flags.
6. **Secrets** never enter git. Config via `wrangler.jsonc` vars + `wrangler secret`. `.dev.vars` is git-ignored.

## Language standards

- **RO:** official Romanian educational terminology (MEN/ME): *clasa pregătitoare, învățământ primar/gimnazial/liceal, profil real/umanist, specializarea matematică-informatică, științe ale naturii, filologie, Evaluarea Națională, examenul de bacalaureat, ROFUIP, ROI, PDI, PAS, CEAC, consiliul de administrație, catedră*. Correct diacritics with comma-below **ș ț** (never cedilla ş ţ). Romanian quotes „…”.
- **DE:** cultivated native academic German written *for* the reader, not translated word-for-word: *Grundschule, Gymnasialstufe / Sekundarstufe I, Lyzealstufe / Sekundarstufe II, Deutsches Sprachdiplom der Kultusministerkonferenz (DSD I/II), Zentralstelle für das Auslandsschulwesen (ZfA), muttersprachlicher Deutschunterricht, Honterushof, Schwarze Kirche*. German quotes „…“.
- **EN:** British English, the register of a European institution: concise, factual, no marketing superlatives. Curly quotes “…”.
- **Banned copy:** “empowering tomorrow’s leaders”, “seamless”, “unlock”, “cutting-edge”, “world-class”, “journey”, “ecosystem” (except literally), exclamation marks in institutional copy, emoji in UI.

## Performance budget (Cloudflare edge)

- Lighthouse Performance ≥ 98 on mobile for public pages; CLS = 0; LCP < 1.5 s on 4G; INP < 100 ms.
- Public JS ≤ 25 KB gzip per page (islands only where interaction is essential: search, language switcher, guides, filters). Admin may be heavier.
- CSS ≤ 30 KB gzip. Fonts: max 2 families, `woff2`, subset (Latin + Latin Ext for ș ț ă â î ä ö ü ß), `font-display: swap`, metric-matched fallbacks, preload only the display face used above the fold.
- Images: explicit `width`/`height` or `aspect-ratio` always; AVIF/WebP; `loading="lazy"` below the fold; hero `fetchpriority="high"`. YouTube only via click-to-load facade (no iframe until click, `youtube-nocookie.com`).
- Navigation: prefetch on hover/viewport, View Transitions for same-origin navigation; feedback < 100 ms.
- Animations: `transform`/`opacity`/`stroke-dashoffset` only, ≤ 600 ms, no scroll-jacking, everything disabled under `prefers-reduced-motion: reduce`.

## UX laws (applied, not decorative)

- **Jakob:** conventional header (seal/name left → home; ≤ 6 primary items; utility row with search, language, NoteInCatalog), conventional footer with contacts. Innovate in craft, never in navigation mechanics.
- **Hick:** audience router (*Elevi · Părinți · Viitori elevi · Profesori*) on home; mega-menus ≤ 7 links per column.
- **Fitts:** targets ≥ 44 × 44 px (48 on touch), primary actions full-width on mobile.
- **Miller / Common Region:** admissions & exams as numbered steps in bounded regions, ≤ 7 items per group.
- **Doherty:** every interaction responds < 100 ms (optimistic UI in admin, instant search index in memory).
- **Peak-End:** a memorable heritage moment on home; a calm, useful footer.
- **Tesler (admin):** the CMS absorbs complexity — staff never see Markdown syntax errors, file-type issues, or slugs unless they want to.
- Keyboard: everything reachable, visible `:focus-visible` ring, skip link, `Ctrl/Cmd + K` opens search. WCAG 2.2 AA minimum.

## Anti-AI-slop quality gate

Reject any change that introduces:
- purple/indigo/cyan gradients, glowing blobs, glassmorphism, neon, generic dark-mode SaaS look;
- identical 3-column card grids with a stock icon on every card; Lucide/Heroicons sprinkled as decoration;
- Inter/system-only typography; centered-everything hero with a vague headline and two pill buttons;
- stock-photo clichés, AI faces, placeholder imagery, “Lorem”;
- hover effects that scale cards, random parallax, scroll-jacking, confetti;
- copy that could describe any school on earth.

Each section must answer: *could another school use this unchanged?* If yes, it fails.
Design source material: Honterus’s woodcuts and printed books (1530s–40s), the *Rudimenta Cosmographica* maps, the Honterushof and the Black Church, the seal’s red/blue/ink palette. See `docs/05_BESPOKE_DESIGN_SYSTEM.md`.

## Repository map

- `docs/` — numbered deliverables (00 logo, 01 legacy content, 02 heritage, 03 UX, 04 architecture, 05 design system, 06 jury, deployment, admin manual). Treat 01–02 as the factual ground truth.
- `scripts/brand/` — logo vector pipeline. `scripts/seed/` — D1 seed generation from docs data.
- `migrations/` — D1 SQL migrations (Drizzle-generated, committed).
- `src/` — application. `public/` — static assets (`brand/`, `media/` with `credits.json`).

## Working rules

- TypeScript strict. `npm run check` (types + lint) and `npm run build` must pass before any commit.
- Small, atomic commits with clear messages; push the working branch at the end of each wave.
- Verify UI in a real browser (Playwright) at 390 / 768 / 1440 px in all three languages before declaring done.
