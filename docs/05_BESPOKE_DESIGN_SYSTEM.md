# 05 — Bespoke design system: *Officina Coronensis*

> Design thesis, tokens, components and motion for the website of Colegiul Național „Johannes Honterus” Brașov.
> Inputs: `00` (the new seal), `02` (heritage dossier), `03` (UX laws & benchmark), `04` (edge architecture).
> Status: v1, submitted to the design jury (`06_DESIGN_JURY_SIGN_OFF.md`).

---

## 1. Thesis — the school as a printing house

Honterus did not only found a school. In the same courtyard, in the same years, he set up **Kronstadt’s printing press (1539)**, cut his own **woodblocks**, drew the **first printed map of Transylvania (1532)** and wrote a school constitution (**1543**) that made students govern themselves. A book, a map and a rulebook: that is the identity.

So the website is designed **like a well-made Renaissance book that happens to be a modern interface**:

| Source | Becomes on screen |
|---|---|
| **Rubrication** — early printers added red by hand for headings, initials and paragraph marks (¶) | The seal red is our *rubric*: used only for markers — step numbers, dates in the margin, the active nav underline, the ¶ before a lead, urgent notices. Never for large fills. |
| **The page canon** — wide outer margins, notes in the margin | A grid with a **marginal column** (*Randspalte*) for dates, sources, captions and “at a glance” facts. Long-form pages read like an annotated book. |
| **Woodcut line** — the crest in the seal is a woodcut with parallel hatching | Our illustrations are **line drawings with hatching**, one ink colour, no gradients: Honterushof and the Black Church in elevation, the press, the map grid. |
| **Cartography** — *Rudimenta Cosmographica*, *Chorographia Transylvaniae* | Graticule arcs, compass rose and coordinates as quiet structural ornaments (hero, section heads, contact map). |
| **The seal** — red ring, blue ring, ink, white | The whole palette: **paper, ink, rubric red, lapis blue**. Nothing else. |
| **Coetus 1543** — rules written by and for students | Plain, numbered, honest wording; every process is a numbered list a 9th grader could follow. |

**Test applied to every screen:** *Could another school use this unchanged?* The marginal dates, the rubric numerals, the woodcut linework of *this* courtyard and *this* church, the 1539 press and the 1543 constitution make the answer “no”.

---

## 2. Colour tokens

Derived from the seal (§00) and from paper and iron-gall ink. **No gradients, no tints beyond what is listed.**

| Token | Hex | Role | Contrast on `--paper` |
|---|---|---|---|
| `--paper` | `#F7F3EA` | Page background — warm rag paper | — |
| `--paper-sunk` | `#EFE8DA` | Sunken panels, table stripes, code of the page | — |
| `--paper-raised` | `#FFFFFF` | Cards that must read as “sheet on sheet”, form fields | — |
| `--ink` | `#15171E` | Body text, linework | 16.2 : 1 |
| `--ink-2` | `#4B4D57` | Secondary text, metadata | 7.6 : 1 |
| `--ink-3` | `#6B6A66` | Tertiary text (≥ 16 px only), disabled labels | 4.9 : 1 |
| `--rule` | `rgb(21 23 30 / .16)` | Hairlines, table rules | 3 : 1 when doubled for UI borders (`--rule-strong` = .42) |
| `--rubric` | `#B0121E` | Rubric red: markers, numerals, active states, urgent | 6.4 : 1 |
| `--seal-red` | `#C40817` | Seal only, banner stripe | 5.6 : 1 |
| `--lapis` | `#0E2C86` | Links, primary buttons, focus ring, the one CTA per view | 11.0 : 1 |
| `--lapis-deep` | `#0B1B4D` | Footer and the night-sky panels (cartographic) | paper on it: 14.8 : 1 |
| `--seal-blue` | `#001F77` | Seal only | 13.0 : 1 |

Rules: links are **lapis + underline** (offset 0.18em, thickness 1px → 2px on hover). One **lapis-filled** primary button per view (Von Restorff). Red never carries meaning alone (always paired with text/icon) — colour-blind safe. Focus ring: 3 px `--lapis` outline + 2 px paper gap (≥ 3:1 on every surface; on `--lapis-deep` the ring switches to `--paper`).

---

## 3. Typography

Two families, both OFL, self-hosted as subsetted variable `woff2` (Latin + Romanian ș ț Ș Ț + German + typographic punctuation).

| Family | Use | Why this one |
|---|---|---|
| **EB Garamond** (Georg Duffner, OFL) — variable 400–800 + italic | Display, headings, long-form reading (history, Coetus, news articles), pull quotes, numerals in the timeline | Revival of Claude Garamond’s romans of the **1530s–40s**, i.e. the type of Honterus’s own decade, from the Basel/Paris tradition he learned in. Has true **small caps**, **old-style figures**, **swashes** and even a *historical* feature (long ſ) we use once, in the Coetus page heading. |
| **Atkinson Hyperlegible Next** (Braille Institute, OFL) — variable 200–800 | UI: navigation, buttons, forms, tables, document lists, captions, admin | Designed for legibility at small sizes on cheap screens — distinct I/l/1, O/0 — exactly the stressed-parent-on-a-phone case. Has `tnum` for dates and file sizes. Not Inter, not a system stack. |

### Scale (fluid, `clamp`, ratio ≈ 1.25 mobile → 1.333 desktop)

| Token | Mobile → desktop | Family / settings |
|---|---|---|
| `--t-hero` | 44 → 88 px | Garamond 500, `-0.01em`, line-height 1.0, `lnum` |
| `--t-h1` | 34 → 60 px | Garamond 500, lh 1.05 |
| `--t-h2` | 27 → 40 px | Garamond 500, lh 1.12 |
| `--t-h3` | 21 → 26 px | Garamond 600, lh 1.2 |
| `--t-lead` | 20 → 24 px | Garamond 400 italic *or* roman, lh 1.45 |
| `--t-body` | 17 → 19 px | Garamond 400 for reading pages, lh 1.6, `onum`; Atkinson 400 17 px for UI pages |
| `--t-ui` | 16 px | Atkinson 500 |
| `--t-small` | 14 → 15 px | Atkinson 400, lh 1.45 |
| `--t-label` | 12.5 → 13 px | Atkinson 700, **small caps feel via uppercase + 0.08em tracking** |
| `--t-marg` | 14 px | Garamond italic, `onum` — marginal notes |

Details that make it a *book*: `hanging-punctuation: first` where supported; `text-wrap: balance` on headings, `pretty` on paragraphs; **small caps** for acronyms (DSD, ZfA, ROFUIP) via `font-variant-caps: all-small-caps`; Romanian/German quotation marks („…”, „…“) are set per locale; a **¶ rubric** precedes standfirst paragraphs; numerals in tables are `tnum lnum`.

---

## 4. Grid, space, rules

- **Measure:** reading column 62–68ch. Max content width 1240 px.
- **Desktop grid:** 12 columns, 24 px gutters; editorial pages use **2 + 7 + 3**: a left *rubric gutter* (section numeral, date), the text block, and a right **marginal column** (notes, facts, document links). Collapses to one column < 900 px, marginal notes become inline “note” blocks with a left red rule.
- **Space scale** (4-based): 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 112.
- **Rules:** 1 px `--rule` hairlines; section breaks use the **double rule** (1 px + 3 px gap + 1 px) — a quotation of the seal’s keylined ring. No drop shadows anywhere except the search dialog (one soft shadow `0 24px 60px rgb(11 27 77 / .25)`).
- **Corners:** 2 px radius on controls (a press block, not a pill). Pills are banned.
- **Images** sit in a 1 px ink frame with 6 px paper mat (like a tipped-in plate) and a Garamond italic caption with the credit in the margin.

---

## 5. Ornament & SVG vocabulary (all hand-authored, one ink colour, `currentColor`)

| Mark | Description | Where |
|---|---|---|
| **Seal** | From `public/brand`, inline `<Seal>` with ink-draw reveal | Header (crest variant), hero, footer, favicon (simplified) |
| **Kronstadt crown & roots** (simplified) | 24-path line version of the crest’s charge — crown, stem, root fan | Small section marks, bullet for the founding year, favicon |
| **Compass rose** | 16-point rose with *fleur-de-lis* north, after the *Rudimenta Cosmographica* plates | Contact page, “find us”, 404 |
| **Graticule** | 5–7 thin meridian/parallel arcs, drawn on scroll-into-view | Hero background (5 % ink), section heads |
| **Honterushof elevation** | Line drawing of the school building front with the Honterus statue, and the Black Church’s tower and roof behind | Footer frieze (full width), heritage page |
| **Press & forme** | The wooden hand press of 1539 (platen, screw, tympan) in woodcut linework | “Publicații / Revista” and the 1539 timeline entry |
| **Cycle emblems** | *Primar*: hornbook (ABC tablet with handle). *Gimnaziu*: dividers over a quarter-circle (geometry). *Liceu*: open book on a reading desk. *DSD*: the letters DSD set in a roundel like the seal. *Coetus*: seven seats in a circle around a table (the student assembly) | Cycle cards, guide headers, nav mega-menu |
| **Fleuron** | Printer’s leaf (hedera) ❧ drawn as SVG | End-of-article mark, dividers |
| **Manicule** ☞ | The printer’s pointing hand | “Important” callouts in guides (with text label) |
| **Rubric numerals** | Roman for chapters (I, II, III), Arabic old-style for steps, set in rubric red | Guides, long-form sections |

**Banned:** generic icon fonts, Lucide/Heroicons as decoration, emoji, filled multicolour illustrations, blobs. Functional UI glyphs (search, menu, external ↗, arrow, close, download, file) are a small custom set drawn on a 24 px grid with 1.5 px strokes and square caps, matching the hairline rule language.

---

## 6. Motion — “ink, not jelly”

| Pattern | Spec |
|---|---|
| **Ink draw** | SVG strokes animate `stroke-dashoffset` 900 ms `cubic-bezier(.65,0,.35,1)` once, when ≥ 30 % visible (IntersectionObserver, one shared instance). Seal: rings first (600 ms), then legend fades in (300 ms), crest revealed by a circular mask (500 ms). |
| **Set-in** | Headings and blocks fade from `opacity 0, translateY(6px)` in 320 ms `cubic-bezier(.2,.7,.2,1)`, staggered 40 ms, max 6 per group. Applied only below the fold; nothing above the fold waits for JS (LCP). |
| **Page transitions** | Native cross-document View Transitions: 180 ms cross-fade; header and seal keep `view-transition-name` so they stay still. |
| **Hover** | Links: underline thickens. Cards: the *rule* under the title extends from 24 px to full width (transform: scaleX), 240 ms. No scaling cards, no shadows. |
| **Steps** | Opening a step: height via `grid-template-rows: 0fr → 1fr`, 220 ms. Current step’s rubric numeral fills. |
| **Search** | Dialog: 140 ms fade + 8 px rise. Results update with no animation (speed is the animation). |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)`: all of the above off; view transitions off; ink-draw shows final state. |

Only `transform`, `opacity`, `stroke-dashoffset`, `clip-path` animate. No scroll-linked effects, no parallax, no autoplay.

---

## 7. Components (public)

1. **Utility bar** (40 px, `--lapis-deep`, paper text): `Caută ⌘K` · `NoteInCatalog ↗` · `Classroom ↗` · `Documente` · `Română | Deutsch | English`.
2. **Masthead:** crest (40 px) + two-line name — *Colegiul Național* (Atkinson label) / **Johannes Honterus** (Garamond 600) — left; 6 nav items right; mega-panels on click with 2–3 columns, cycle emblems, ≤ 7 links per column, one “featured” rubric note. Sticky, condenses to 56 px on scroll down (no auto-hide; reduced-motion: static).
3. **Mobile:** crest + “Honterus”, `Caută` and `Meniu` buttons (48 px, labelled). Menu sheet: language first, then 6 sections as accordions, then NoteInCatalog/Classroom/Contact buttons full width.
4. **Notice banner:** full-width strip under utility bar; *critical* = rubric red background with paper text; *warning* = paper-sunk with 6 px rubric left rule; dismissible per notice (local storage, no cookie — cache-safe).
5. **Title page hero (home):** left “title page” typeset block — rubric kicker *Brașov · Kronstadt · seit 1541*, H1 school name, one sentence, one CTA; right, a framed photograph of the Honterushof; behind, the graticule ink-draw; the seal draws itself in the corner.
6. **Audience router:** four *index tabs* (like a register’s thumb index) — *Elevi · Părinți · Viitori elevi · Profesori* — each opens a list of 5 links. Not cards.
7. **Cycle triptych:** three tall panels separated by double rules; emblem, grade range in large Garamond numerals (*P–IV*, *V–VIII*, *IX–XII*), 3 facts, link.
8. **Timeline (“Annales”):** semantic `<ol>`; year in large Garamond old-style numerals in the rubric gutter; era headings (*Origines · Honterus · Saxon gymnasium · Modern · Today*); a vertical ink line draws as you read; highlights get the crown mark.
9. **Step guide:** numbered steps (rubric numerals in a circle like the seal’s ring), each with *Când / Wann / When*, *Ce aduci*, *Unde*, document links; status chip computed from dates (*Urmează · În desfășurare · Încheiat*); “Am înțeles / checklist” ticks saved locally.
10. **Document register:** a real `<table>` (cards < 640 px) — title, category, year, language, format+size, date; filters as chips mirrored in the URL; instant text filter; file-type glyph drawn in-house.
11. **Staff register:** typographic, no photos by default: grouped by category and department, names in Garamond, roles in Atkinson small caps, A–Z jump rail, filter field. Optional photo appears as a small oval *portrait medallion* only when uploaded with consent.
12. **News list:** date in the rubric gutter (day in large old-style numerals, month small caps), title, summary; no thumbnail grid. Article page: book layout with marginal notes, fleuron at the end.
13. **Footer:** `--lapis-deep`, paper text; full-width **Honterushof + Black Church elevation** linework on top edge; four columns (Contact · Acces rapid · Pentru… · Instituție); seal (mono-light); colophon line set in Garamond italic: *“Typis Coronensibus — set in EB Garamond & Atkinson Hyperlegible.”*

### Admin (`/admin`)
Same tokens, utilitarian: Atkinson only, paper background, left sidebar, dense tables, rubric for errors/required, lapis primary. Status chips: *Ciornă / Publicat / Arhivat*; translation chips **RO ● DE ◐ EN ○**.

---

## 8. Photography & media direction

- Real places only: Honterushof, the school buildings, the statue, the Black Church, Honterus’s maps and woodcut portrait (public domain). Sourced and credited per `public/media/heritage/credits.json`.
- Treatment: no filters, no duotone gimmicks; a 1 px ink frame and paper mat; captions in Garamond italic with credit and licence in the margin.
- Every image has explicit dimensions and a dominant-colour placeholder; heroes ≤ 160 KB AVIF at 1600 w.
- People photos only when the school uploads them with consent.
- YouTube: facade (poster + play button drawn as a woodcut roundel), loads `youtube-nocookie.com` on click.

---

## 9. Voice

Short sentences, concrete nouns, dates and places. RO uses the Ministry’s terms; DE is written by a German teacher for German readers (*Sie*, academic, warm, precise); EN is British and understated. No slogans. The strongest line on the site is a fact: *“În 1543, elevii acestei școli își scriau propriile reguli.”*

---

## 10. Implementation notes

- CSS: one global stylesheet with `@layer reset, tokens, base, layout, components, utilities` (~18 KB gzip budget) + Astro scoped styles; tokens as custom properties; no Tailwind.
- Fonts: `public/fonts/*.woff2`, subset with `pyftsubset` (`U+0000-00FF, U+0102-0103, U+0218-021B, U+00C4-00FC, U+2010-2027, U+2030-2044, U+20AC, U+2116, U+2190-2193, U+2197`), `font-display: swap`; fallback faces with `size-adjust`/`ascent-override` tuned to Georgia and Arial to keep CLS = 0; only Garamond 500 roman is preloaded.
- SVGs: components under `src/components/svg/`, `currentColor`, `aria-hidden="true"` when decorative, `role="img"` + `<title>` when meaningful; strokes use `vector-effect: non-scaling-stroke` so hairlines stay 1 px at any size.
