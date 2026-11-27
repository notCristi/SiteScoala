# 03 — UX Laws & Global Academic Benchmark

**Project:** rebuild of the website of Colegiul Național „Johannes Honterus" Brașov (founded 1541)
**Languages:** RO (default) · DE · EN
**Audiences:** students (elevi), parents (părinți), prospective students and their families (viitori elevi), teachers and staff (profesori)
**Cycles:** primary (clasa pregătitoare–IV) · gymnasium (V–VIII) · lyceum (IX–XII)
**Status:** research input for IA, design system and QA. Researched 2026-11-26. Aligned with `CLAUDE.md` (where budgets differ, CLAUDE.md wins).
**Replaces:** `liceulhonterusbrasov.ro` and its `/lic/` WordPress site.
**Replaces:** `liceulhonterusbrasov.ro` and its `/lic/` WordPress site.

> **Hard scope rule:** the site has **no class timetable (Orar)**. No page, menu item, search suggestion, widget or CMS content type may be called "Orar" or show lesson timetables per class. The things it does cover are the school-year structure (*Structura anului școlar*), holidays, exam calendars, events and the bell schedule. Even the bell schedule is optional and must stay a static document, not a timetable. See rule D-20 and test AT-15.

---

## Contents

1. [PART 1 — UX laws turned into testable rules](#part-1--ux-laws-turned-into-testable-rules)
2. [PART 2 — Benchmark of 14 sites](#part-2--benchmark-of-14-sites)
3. [PART 3 — Synthesis: IA, rules, acceptance tests](#part-3--synthesis-ia-rules-acceptance-tests)
4. [Sources](#sources)

Every rule has an ID (`J-1`, `F-2`…) so design reviews, tickets and QA scripts can refer to it.

---

# PART 1 — UX laws turned into testable rules

Each law is written up the same way: **principle** (one line), then **rules for Honterus**, then **how to test**.

## 1.1 Jakob's Law — users spend most of their time on *other* sites

**Principle:** users expect our site to work like the sites they already know. School and university sites have a strong convention: logo top-left, horizontal primary nav, a small utility bar, search top-right and a dense footer. [lawsofux.com/jakobs-law](https://lawsofux.com/jakobs-law/), [NN/g: breaking web conventions](https://www.nngroup.com/articles/breaking-web-conventions/)

| ID | Rule |
|---|---|
| J-1 | The **logo and wordmark sit top-left** and always link to the home page of the *current language* (`/ro/`, `/de/`, `/en/`). The full name "Colegiul Național „Johannes Honterus" Brașov" (or the localized form) appears in the header or the first viewport on **every** page. NN/g guideline #1 is "identify your university on every page", because many visitors land on deep pages from Google. [NN/g University sites](https://www.nngroup.com/articles/university-sites/) |
| J-2 | **Primary nav has at most 6 items** on desktop at ≥1024 px. Nothing hides behind "More". |
| J-3 | The **utility bar sits top-right, above or inline with the primary nav**, in this order: Search · NoteInCatalog (gradebook, external link icon) · Contact · Language switch (`RO · DE · EN`). |
| J-4 | Search has a **visible button with a text label** ("Caută" / "Suche" / "Search"), not just a magnifier icon. **Ctrl+K / ⌘K** also opens search, and a `<kbd>` hint shows inside the button on desktop. A bare "/" shortcut is not allowed unless it can be turned off (WCAG 2.1.4 Character Key Shortcuts). Ctrl+K is caught only while focus is in the page, so the browser's own shortcut still works from the address bar. |
| J-5 | The footer contains: postal address (Curtea Honterus nr. 3, Brașov), secretariat phone and e-mail, office hours, a map link, the quick links from §3.4, legal pages (Politica de confidențialitate / GDPR, Accesibilitate, Cookie-uri, Informații de interes public), social links and founding line "Gegründet 1541". |
| J-6 | Links look like links: underlined in body text, and colour is not the only cue (WCAG 1.4.1). External links (gradebook, ISJ, Ministry, edu.ro) show an external icon and the visually-hidden text "(se deschide în altă fereastră)" when they open a new tab. |
| J-7 | Breadcrumbs appear on every page at level 2 and deeper, and breadcrumbs are **not** replaced by a "back" button. |

**Test:** a 5-second test with 5 parents asking "Where would you click to change language / to find the gradebook / to call the school?". At least 4 of 5 must point to the right element on first try.

## 1.2 Hick's Law — decision time grows with the number and complexity of choices

[lawsofux.com/hicks-law](https://lawsofux.com/hicks-law/)

| ID | Rule |
|---|---|
| H-1 | **Audience router** (*Pentru…*): four cards on the home page directly below the hero: **Elevi · Părinți · Viitori elevi · Profesori**. Each is a curated *task hub* of 6–10 links, not a separate sub-site. NN/g warns that audience-based navigation is usually problematic as **primary** navigation: users don't know which bucket fits them, and content gets duplicated. It is acceptable as **secondary** navigation when the content warrants it. [NN/g Audience-based navigation](https://www.nngroup.com/articles/audience-based-navigation/). So the router is **never** the top nav. Hub pages link to canonical topic pages and do not copy their content. |
| H-2 | Mega-menu panels hold at most **3 columns × 7 links**, plus one optional featured card. Each column has a heading. Cascading flyouts with 3+ levels are not allowed. [NN/g: Mega menus work well](https://www.nngroup.com/articles/mega-menus-work-well/) |
| H-3 | Each page has **one primary call to action**. Admissions pages allow at most 1 primary and 1 secondary button. |
| H-4 | The **cycle selector** (Primar · Gimnaziu · Liceu) is a 3-option segmented control wherever content differs by cycle, such as admissions, documents and the calendar. A list of 13 grades is not allowed. |
| H-5 | Document filters show at most 4 filter categories at once, for example Category, Cycle, School year and Language. Anything more goes under "Mai multe filtre". |

**Test:** a tree test (Treejack or similar) with the IA in §3.1, run in RO and DE with at least 15 participants. Target ≥80 % direct success on the 8 key tasks in §3.6.

## 1.3 Fitts's Law — time to hit a target depends on its size and distance

[NN/g: Fitts's Law](https://www.nngroup.com/articles/fitts-law/)

| ID | Rule |
|---|---|
| F-1 | Every interactive target is at least **44 × 44 CSS px** on desktop and at least **48 × 48 px** on touch viewports (< 768 px). The Material 48dp and Apple 44pt guidance agrees. This is well above the WCAG 2.2 **2.5.8 Target Size (Minimum)** floor of 24 × 24 px. [W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) |
| F-2 | Inline text links in paragraphs are exempt (2.5.8 "inline" exception), but **link lists** such as footer links, document lists and the sidebar must meet F-1 through padding. |
| F-3 | Language switch items are each at least 44 × 44 even though their labels are 2-letter codes. |
| F-4 | **Sticky mobile action bar** (< 768 px) on admissions and contact pages only, with at most 2 actions: "Sună secretariatul" (`tel:`) and "Pașii de înscriere" / "Descarcă dosarul". It must not cover focused elements (WCAG **2.4.11 Focus Not Obscured**). Add `scroll-padding-bottom` equal to the bar height. [W3C new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) |
| F-5 | The mobile menu button sits **top-right** in the thumb-reachable header, is at least 48 × 48 and is labelled "Meniu" with visible text next to the icon. |
| F-6 | Primary CTAs on mobile are full-width buttons at least 48 px tall, with 8 px or more between adjacent targets. |

**Test:** an automated axe-core `target-size` rule in CI, plus a manual check at 390 × 844 px.

## 1.4 Miller's Law & Law of Common Region — chunking

[lawsofux.com/millers-law](https://lawsofux.com/millers-law/), [NN/g: Common Region](https://www.nngroup.com/articles/common-region/)

| ID | Rule |
|---|---|
| M-1 | **Admission procedures are chunked into numbered steps**, 5 ± 2 per cycle, each in its own bordered card (common region). Each step card shows: what to do · documents needed · deadline (with `<time>`) · where (online / at secretariat). This follows the GOV.UK [step-by-step navigation](https://design-system.service.gov.uk/patterns/step-by-step-navigation/) pattern. |
| M-2 | Example: **Clasa pregătitoare** — 1 Check eligibility (age, by 31 Aug) → 2 Read the calendar (MEC/ISJ dates) → 3 Fill in the request (online or at the school) → 4 Submit documents / validation → 5 Results & allocation. Each step links to its official source. |
| M-3 | Contact data, phone numbers, IBAN and the like are chunked in groups of 3–4 digits for readability, while the markup stays a single `tel:` link. |
| M-4 | Long content pages (≥ 3 screens) get an **"On this page" (Pe această pagină)** anchor list, sticky on desktop. |
| M-5 | Home-page news shows at most 3 cards, and events show the next 3–5. Everything else lives on index pages. |

## 1.5 Doherty Threshold — keep interactions under 400 ms

[lawsofux.com/doherty-threshold](https://lawsofux.com/doherty-threshold/)

| ID | Rule |
|---|---|
| D-1 | **Performance budget** (per `CLAUDE.md`): Lighthouse mobile ≥ 98, LCP < 1.5 s on 4G, INP < 100 ms, CLS = 0. Public JS ≤ 25 KB gzipped per page (islands only), CSS ≤ 30 KB gzipped. Fonts ≤ 2 families, subset to Latin + Latin Extended-A (ă â î ș ț, ä ö ü ß), `font-display: swap`, and the body font preloaded. |
| D-2 | Every interaction gives **visual feedback within 100 ms** (optimistic UI in the admin), and any result that takes longer than **400 ms** shows a skeleton or progress state. Search suggestions must appear within 300 ms (a static, pre-built index, e.g. Pagefind, is preferred to a server round-trip). |
| D-3 | **Speculation Rules** prefetch same-origin links on hover and pointerdown (`"eagerness": "moderate"`). Prerender is limited to the top 4 hub pages. Never speculate external, logout or PDF URLs. [MDN Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API), [Chrome: prerender pages](https://developer.chrome.com/docs/web-platform/prerender-pages) |
| D-4 | **Cross-document View Transitions** (`@view-transition { navigation: auto; }`) are allowed only for a ≤ 250 ms cross-fade and a shared-element morph of the page title or hero image. The absolute ceiling for any animation is 600 ms, using `transform`, `opacity` or `stroke-dashoffset` only. They are disabled under `prefers-reduced-motion: reduce`. Browsers without support simply navigate, which is progressive enhancement. |
| D-5 | Filters on the document library apply **instantly** (client-side, under 100 ms, so NN/g's batch "Apply" advice is unnecessary). The result count is announced through an `aria-live="polite"` region. [NN/g: Applying filters](https://www.nngroup.com/articles/applying-filters/) |

## 1.6 Aesthetic-Usability Effect

People see attractive design as more usable and forgive minor problems. That is a reason to polish, not a licence to hide problems in testing. [NN/g: Aesthetic-usability effect](https://www.nngroup.com/articles/aesthetic-usability-effect/)

| ID | Rule |
|---|---|
| A-1 | Heritage gives the site its credibility. Use one strong, restrained serif for headings, a highly legible sans for UI and body, a limited palette (school colour plus neutrals), real photography of the Schwarze Kirche precinct and the Honterushof, and **no stock photos** (NN/g guideline #2: "use images that reflect your values"). |
| A-2 | Usability tests rate tasks on success and time, **not** on "do you like it?". Aesthetic ratings are collected separately so a pretty design cannot hide a failing flow. |
| A-3 | NN/g guideline #9 says "avoid trying too hard to be cool". No parallax, no scroll-jacking, no cursor effects. |

## 1.7 Peak-End Rule

People judge an experience by its most intense moment and by how it ends. [NN/g: Peak-end rule](https://www.nngroup.com/articles/peak-end-rule/)

| ID | Rule |
|---|---|
| P-1 | **Design the end of the key journeys.** After the admission steps, the last card is "You're done — what happens next" with dates, a calendar (.ics) download and the contact person. After a form submission, show a confirmation page with a reference and the response time, never a bare "Thank you". |
| P-2 | **Design one positive peak.** The "1541 → today" heritage timeline (§1.15) is the emotional peak of the About section. Keep it one memorable moment, not motion everywhere. |
| P-3 | **Remove negative peaks first.** These are dead PDFs, 404s from old URLs (keep a **301 redirect map** from the old site), and pages missing in the chosen language. |
| P-4 | 404 page: the search box, the 4 audience hubs and an apology in all three languages. |

## 1.8 Von Restorff Effect (isolation effect)

The item that differs from its neighbours is the one people remember. [lawsofux.com/von-restorff-effect](https://lawsofux.com/von-restorff-effect/)

| ID | Rule |
|---|---|
| V-1 | **One accent element per viewport.** The accent colour is reserved for the primary CTA and the "Înscrieri deschise" (admissions open) badge. It is never used for decoration. |
| V-2 | Urgent notices (school closure, exam-day changes) appear in **one** dismissible site-wide banner with an icon, text and date, not as colour alone. Only one banner can be active at a time, and the CMS enforces this. |
| V-3 | Only the "NoteInCatalog" item in the utility bar may carry a distinct icon. |

## 1.9 Serial Position Effect

People remember the first and last items in a list best. [LogRocket: serial position effect](https://blog.logrocket.com/ux-design/serial-position-effect-ux-design/)

| ID | Rule |
|---|---|
| S-1 | In the primary nav, **"Admitere" comes first**, as the main conversion task, and **"Contact" comes last**. |
| S-2 | In the mobile menu the language switch and search sit at the **top**, and contact data sits at the **bottom**. |
| S-3 | In each mega-menu column, the most-used link is first and "Toate …" (see all) is last. |

## 1.10 Tesler's Law (conservation of complexity) — applied to the admin CMS

Some complexity can't be removed, so the system should absorb it, not the editor or the visitor. [lawsofux.com/teslers-law](https://lawsofux.com/teslers-law/)

| ID | Rule |
|---|---|
| T-1 | **Translations are linked at the model level.** Each content item has RO/DE/EN variants with a "translation status" field (complete / needs update / missing). The language switcher reads this field automatically (see L-3), so editors never hand-maintain cross-language links. |
| T-2 | **Structured content types**, not free WYSIWYG: News, Event, Document, Person, Admission Step, Timeline Entry, Notice. Each has required fields such as date, cycle, category, language and alt text. Save is blocked if alt text is missing. |
| T-3 | **Documents carry metadata.** On upload the CMS takes title, date, school year, category, cycle, language and "replaces document X". It extracts file size and type and computes the "Updated" date. Old versions are archived, not deleted, and keep their URL. |
| T-4 | **Admission deadlines are dates, not text.** The CMS turns them into "in 5 days" labels, .ics files and automatic "closed" states after the date passes. |
| T-5 | **Roles:** Editor (drafts), Translator (own language only), Publisher (secretariat or director), Admin. Every edit is logged with who, when and what. |
| T-6 | **Previews** cover mobile, desktop and each language before publishing. A built-in accessibility check flags heading-level skips, empty links and missing language attributes. |
| T-7 | **No layout freedom where it breaks the system.** Editors pick from 8–12 vetted blocks and cannot set colours or font sizes. |

## 1.11 University and school website guidance (NN/g)

NN/g's *University Websites* report (2nd ed.) has 152 guidelines from 57 sites tested with 33 users in 4 countries. Its top 10 ([summary article](https://www.nngroup.com/articles/university-sites/), [report](https://www.nngroup.com/reports/university/)) map to Honterus like this:

| NN/g guideline | Honterus translation |
|---|---|
| 1 Identify the institution on every page | J-1 |
| 2 Images that reflect your values | A-1: real students, the Honterus courtyard, the library, no stock |
| 3 Make "About" count | "Despre noi" opens with a 3-sentence plain summary and a fact list (founding, German-language instruction, DSD I/II, cycles; figures only if verified in docs 01/02), then the timeline |
| 4 Emphasise strengths | Results (Bacalaureat, DSD II, Abitur, olympiads) as a scannable stats row, not prose |
| 5 Make programmes easy to list | "Profiluri & secții" page lists every lyceum profile and section in one table |
| 6 Outcomes from Alumni | "Absolvenți" page: universities alumni attend, notable alumni, alumni association |
| 7 Clear deadlines and process | M-1 / M-2 / T-4, plus a single "Calendar admitere" per cycle |
| 8 Follow the user journey | The acceptance tests in §3.6 start from 3 entry points: home, Google deep link, audience hub |
| 9 Don't try too hard to be cool | A-3 |
| 10 Users will search elsewhere | Strong internal search (J-4) that indexes PDFs and people |

The report also found that **48 % of users did not realise a programme they wanted was offered** even when it was. On this site, make it obvious that German-language and Romanian sections exist in each cycle.

## 1.12 Language switching (RO / DE / EN)

Sources: [W3C i18n: content negotiation + visible links](https://www.w3.org/International/questions/qa-site-conneg), [W3C i18n: indicating the language of a link destination](https://www.w3.org/International/questions/qa-link-lang.en.html), [USWDS "Select a language" pattern](https://designsystem.digital.gov/patterns/select-a-language/three-or-more-languages/), [Smashing: language selector UX](https://www.smashingmagazine.com/2022/05/designing-better-language-selector/).

| ID | Rule |
|---|---|
| L-1 | Label languages **in their own language (endonyms)**: `Română · Deutsch · English`. Short codes `RO · DE · EN` are allowed in the desktop bar if the `title` or `aria-label` uses the endonym. Each link carries `lang` and `hreflang`, e.g. `<a href="/de/…" lang="de" hreflang="de">Deutsch</a>`. |
| L-2 | **No flags.** Flags stand for countries, not languages. German is not "Germany" here: it is the language of the Transylvanian Saxons and of the school itself. The Pforta site is a counter-example (it uses flags). |
| L-3 | **Keep the user on the equivalent page.** Switching on `/ro/admitere/clasa-pregatitoare` goes to `/de/aufnahme/vorbereitungsklasse`. If no translation exists, go to the closest translated ancestor and show a notice ("Această pagină nu este disponibilă în limba germană — afișăm secțiunea părinte"). Never send the user silently to the home page. |
| L-4 | The **switcher is in the same place on every page**: top-right utility bar on desktop, the first row of the mobile menu, and repeated in the footer. |
| L-5 | Do **not** auto-redirect on IP. On the first visit to `/` only, use `Accept-Language` to suggest (not force) DE or EN, and remember the choice in a cookie. Every page is reachable at a stable language-prefixed URL (`/ro/`, `/de/`, `/en/`) with `<link rel="alternate" hreflang>` plus `x-default`. |
| L-6 | Set `<html lang>` correctly per page. Mixed-language fragments, such as a German poem on a Romanian page, get their own `lang` attribute (WCAG 3.1.2). |
| L-7 | Slugs are translated, and diacritics are stripped in slugs only (ș→s, ț→t, ä→ae). |

## 1.13 Mobile navigation patterns

Sources: [NN/g: Hamburger menus](https://www.nngroup.com/articles/hamburger-menus/), [Smashing: navigation design for mobile](https://www.smashingmagazine.com/2022/11/navigation-design-mobile-ux/), [NN/g: Menu design](https://www.nngroup.com/articles/menu-design/).

| ID | Rule |
|---|---|
| N-1 | On desktop (≥ 1024 px) the **primary nav is always visible**. Do not hide it in a hamburger when there is room. |
| N-2 | On mobile, a "Meniu" button with a text label opens a full-height panel: search field → language → 6 primary items as **accordion sections** (one level of sub-links each) → audience hubs → contact. Do not use slide-in multi-level drill-downs. |
| N-3 | Above the fold on the mobile home page, the hero is followed directly by the **audience router as 4 large tiles (2 × 2)**. These tiles are the visible alternative to the hidden menu. |
| N-4 | The menu panel traps focus, closes on Esc, returns focus to the trigger, sets `aria-expanded`, and blocks body scroll. |
| N-5 | The sticky header is ≤ 56 px tall on mobile and hides on scroll-down and shows on scroll-up, **except** under `prefers-reduced-motion`, where it stays static. |

## 1.14 Document library (Documente / Dokumente) with filter table

Sources: [NN/g: Filter categories & values](https://www.nngroup.com/articles/filter-categories-values/), [NN/g: Mobile faceted search](https://www.nngroup.com/articles/mobile-faceted-search/), [NN/g: Filters vs facets](https://www.nngroup.com/articles/filters-vs-facets/).

| ID | Rule |
|---|---|
| DL-1 | **One canonical library** at `/documente`, with a search box above the filters. Facets: **Category** (Admitere, Regulamente, Informații publice, Formulare, Rapoarte, Burse, Examene), **Cycle**, **School year**, **Language**. Values use plain words, no internal codes. |
| DL-2 | On desktop, results are a **table or list** with columns for Title · Category · Date updated · Format & size ("PDF, 340 KB") · Language. The table is sortable by date, newest first by default. |
| DL-3 | Active filters appear as removable **chips** above the results, with a "Șterge filtrele" (clear filters) control. The filter state lives in the URL so filtered views can be shared, for example a link from the parents' hub to `/documente?cat=formulare&ciclu=primar`. |
| DL-4 | On mobile, each row becomes a card. Filters open in a bottom sheet or tray that overlays the results and shows the live result count ("Arată 12 documente"), not a separate page. |
| DL-5 | Every PDF link states its format and size. The title says what the document is ("Cerere de înscriere — clasa pregătitoare 2027–2028"), not the filename. HTML versions are preferred for key procedural content, and PDFs are for printing. |
| DL-6 | Mandatory public-information documents (Legea 544/2001: budget, salaries, declarations) get a stable section and URL, *Informații de interes public*, linked from the footer. |

## 1.15 Accordions vs tabs

Sources: [NN/g: Tabs used right](https://www.nngroup.com/articles/tabs-used-right/), [NN/g: Accordions on desktop](https://www.nngroup.com/articles/accordions-on-desktop/), [NN/g video: Tabs vs accordions](https://www.nngroup.com/videos/tabs-vs-accordions/).

| Use | Pattern |
|---|---|
| FAQ (admissions, gradebook login, transfers) | **Accordion**: many short independent sections. Use `<details>/<summary>` or a button with `aria-expanded`. Each item is deep-linkable through `#id`, and the item opens when the URL targets it. |
| Cycle-specific content on one page (Primar / Gimnaziu / Liceu) | **Tabs** when there are 2–4 parallel views the user won't compare, following the ARIA tabs pattern with arrow keys. On < 768 px they turn into an accordion. |
| Critical info (deadlines, required documents) | **Never hidden** in an accordion or tab. It always shows in the step card. |
| Long narrative (history, project reports) | No accordion. Use headings plus "On this page" (M-4). |

Rule AT-x: "Expand all / Collapse all" is required on any accordion with more than 6 items.

## 1.16 Timeline UX (Istoric 1541 → today)

| ID | Rule |
|---|---|
| TL-1 | A vertical timeline (single column on mobile), with **semantic markup** as an ordered list `<ol>` in which each entry has a `<time datetime="1541">`, a heading, 1–3 sentences and an optional image with a caption and credit. |
| TL-2 | 12–20 key entries, covering: 1541 school reform by Honterus · 1543 *Reformatio ecclesiae Coronensis* · Honterus' printing press and library · the *Rudimenta Cosmographica* · later building phases on the Honterushof · 19th-century gymnasium · 20th-century ruptures (1940s nationalisation, communist era) · post-1989 renewal · present (DSD, Abitur, partner schools). Era headings group the entries (Miller chunking). |
| TL-3 | **No horizontal scroll timelines and no scroll-driven animation.** Entries may fade in once, and only if `prefers-reduced-motion: no-preference`. |
| TL-4 | Era jump links appear at the top, like an "On this page" list. |
| TL-5 | Each entry has a stable anchor so it can be cited, e.g. `/ro/despre/istoric#1543`. |

## 1.17 Staff directory (Profesori & personal)

Sources: [NN/g: Employee directory search](https://www.nngroup.com/articles/employee-directory-search/), [NN/g: Employee search](https://www.nngroup.com/articles/suggested-employee-search/), [NN/g video: faculty pages persuade prospective students](https://www.nngroup.com/videos/university-faculty-pages/).

| ID | Rule |
|---|---|
| SD-1 | The directory is grouped by **role**: Conducere (leadership) · Secretariat & administrativ · Catedre (by subject department) · Învățători (primary teachers, by grade) · Consilier școlar. Group by structure, not one flat alphabetical list. |
| SD-2 | A name filter box works as you type (people search is search for a *name*, NN/g). There is also an A–Z index. |
| SD-3 | The directory is typographic by default (`CLAUDE.md` rule 3: real names from the old site, no photos unless uploaded later via `/admin`). A person card shows name, role or subjects and teaching language (RO/DE). A **school e-mail is shown only if the person has opted in**, as a GDPR requirement. There are no personal phone numbers. The office phone is shown for secretariat roles. |
| SD-4 | Global search includes people, labelled "Persoane" in the suggestions. |
| SD-5 | The CMS handles yearly rollover: set leavers to "inactive", which hides them and keeps their URL with a 410 status or a redirect to the department. |

## 1.18 WCAG 2.2 AA — the criteria this site most often fails

Source of truth: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [What's new in 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/), [WebAIM 2.2 checklist](https://webaim.org/standards/wcag/wcag22). The EU Accessibility Act and EN 301 549 make this a legal baseline as well as good practice.

| SC | Concrete requirement |
|---|---|
| 1.4.3 Contrast (Minimum) | Body text ≥ 4.5:1, large text (≥ 24 px, or ≥ 18.66 px bold) ≥ 3:1. Text on hero photos uses a solid scrim, measured at its worst point. |
| 1.4.11 Non-text contrast | Input borders, focus rings, icons and chart lines ≥ 3:1 against adjacent colours. |
| 2.4.7 Focus Visible + 2.4.11 Focus Not Obscured | A `:focus-visible` ring at least 2 px thick, ≥ 3:1, with a 2 px offset, on **every** interactive element. Sticky header, cookie banner and mobile action bar must never fully cover the focused element. Use `scroll-padding-top` equal to the header height. |
| 2.4.13 Focus Appearance (AAA, adopt anyway) | Ring area ≥ a 2 px perimeter, with a 3:1 change of contrast. |
| 2.5.8 Target Size (Minimum) | ≥ 24 × 24 is the legal floor. The project standard is 44/48 (F-1). |
| 2.5.7 Dragging Movements | Any carousel or slider (avoid them) needs button alternatives. |
| 3.2.6 Consistent Help | Contact and help links sit in the same relative place on every page (utility bar and footer). |
| 3.3.7 Redundant Entry / 3.3.8 Accessible Authentication | Forms don't ask for the same data twice. No CAPTCHA puzzles without an alternative (use a honeypot or Turnstile). |
| 2.2.2 Pause, Stop, Hide | No autoplay carousel. Hero video, if used, is muted, ≤ 10 s loop, has a visible pause button, and stays paused under reduced motion. |
| 2.3.3 / C39 Reduced motion | `@media (prefers-reduced-motion: reduce)` turns off View Transitions, reveal animations, smooth scroll and the auto-hiding header. [W3C C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) |
| 3.1.1 / 3.1.2 Language | See L-6. |
| 1.1.1 Text alternatives | Alt text is required in the CMS (T-2). Decorative images use `alt=""`. |
| 2.4.1 Bypass blocks | A "Sari la conținut" (skip to content) link is the first focusable element. |
| 4.1.2 Name, Role, Value | Menus, accordions and tabs follow the APG patterns, verified with NVDA + Firefox and VoiceOver + Safari iOS. |

---

# PART 2 — Benchmark of 14 sites

**Method:** each homepage was fetched on 2026-11-26 with `curl` and WebFetch. Fonts were identified from the linked CSS (`font-family` and `@font-face` / woff file names). Nav items were counted from the top level of the `<nav>` or `<ul class="menu">` markup. `prefers-reduced-motion` was checked in the HTML and linked CSS. www.ox.ac.uk returned a 403 bot challenge, so the Oxford analysis relies on the agency case study and published project notes.

## 2.1 Comparison table

| # | Site | Top-level nav (count) | Utility / audience links | Language switch | Search | Hero | Typography (detected) | Reduced-motion in CSS | Heritage handling |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **University of Oxford** ox.ac.uk | Simplified IA after the Numiko redesign. External audiences on the public site, staff and students on OxIntranet | Intranet split | EN only | Header | Heritage photography | Not verifiable (403) | n/a | "Accessibility, clarity, heritage" as brand pillars. Design system serves 800+ sites |
| 2 | **University of Cambridge** cam.ac.uk | 12 items behind "Menu" (Undergraduate, Postgraduate, Lifelong learning, Alumni, Business, Cambridge students, News, Jobs, Research, Colleges & Depts, Staff pages, About) | Mixed audience and topic | EN only | "Search" link + Menu, top-right | Big photo + campaign line "At Cambridge I can" | Lato (Google), Open Sans | Yes | Barely: museums and libraries tiles |
| 3 | **ETH Zürich** ethz.ch | Primary nav rendered by JS. The fetched header shows a Departments selector (16) + services | Student portal · Alumni · Staffnet · Contact · Login | `EN DE FR(TA) IT(TA)`, endonyms in full names. "TA" honestly marks machine-translated versions | Header + footer "Keyword or person" | No hero: headline, quote + 3 news items | **ETH Next** (custom), Helvetica/Arial fallback | Not detected | "Our history" section linked from portrait |
| 4 | **EPFL** epfl.ch | **6**: About · Education · Research · Innovation · Schools · Campus | Topic-based, no audience labels | `FR · EN · DE · IT` codes, current one not a link. IT marked machine-translated | Search field in header with show/hide toggle | No single hero: 2 promo tiles + news | **Suisse Int'l** + Arial fallback | Not detected | Minimal |
| 5 | **Eton College** etoncollege.com | 10 behind "Menu" (Home, About, Inside/Outside the Classroom, College Life, Eton Outwards, Admissions, Support Us, News & Diary, Contact) | Parent Portal, Employment, CIRL, EtonX, College Collections, OEA, Hire | EN only | Full-screen overlay ("Enter / ESC") | "Honouring Tradition. Inspiring Change." + category tiles + video + stats row | **Vesterbro** (serif display) + Nunito Sans | Not detected | Tradition as headline. "Museums & Collections" as its own destination. 1440 founding not on home |
| 6 | **St Paul's School** stpaulsschool.org.uk | **9** (About, News, Admissions, Academic Life, Beyond the Classroom, Wellbeing, Community, Support Us, Partnerships) | **Parents · Pupils · Staff** · Work with us · OPC · Uniform shop · Getting here | EN only | None found | Welcome headline + award + 3 CTAs (Apply, Prospectus, Support) + **"Discover by entry age" 7+/11+/13+/16+** | **Copernicus** (serif) + **Gotham** | Not detected | "History & Archives" section. 1509 / Colet not on home |
| 7 | **Schule Schloss Salem** | **6**: Internat & Schule · Aufnahme & Stipendien · Summer Camps · Termine & News · Über Salem · Salem fördern | Arbeiten in Salem · Kontakt · socials | Globe icon + "English" (endonym) | Magnifier icon | Rotating photo header (castle, lake, workshops) | **Oranienbaum** (high-contrast serif) + **Gudea** | Yes | "seit 1920" icon, Kurt Hahn quote graphic, "Historie" under Über Salem |
| 8 | **Landesschule Pforta** | **6**: Neues · Schule · Internat · Geschichte · Förderer · Galerien | Sitemap · Kontakt · Login | **Flags** for EN/ES/FR/EL/LA/PL/RU (abridged translations) ✗ | None ✗ | Headline + open-day banner + photos + video | Adobe Fonts (Typekit kit) | Not detected | **"Geschichte" is a top-level item.** Long history narrative from 1543 |
| 9 | **Deutsche Schule Rom** dsrom.de | **5**: Das sind wir · Bei uns anmelden · Mit uns arbeiten · Organisation · Intern | Phone · Webmail/Intranet · socials · **"Open day" button** | "Deutsch / Italienisch" **with flags** ✗ | None ✗ | Trilingual welcome + **4 cycle cards: Krippe → Kindergarten → Grundschule → Gymnasium** | Poppins + Open Sans | Yes (HTML) | "175 Jahre" anniversary banner, "Unsere Geschichte" |
| 10 | **Deutsche Schule London** dslondon.org.uk | 9 (Home, Unsere Schule, Lernen, Leben, Brücken bauen, Gestalten, Anmeldungen, Stellenangebote, Impressum) | Skip link · Search · **Login (parent portal)** | One link "English" | "Suche öffnen" toggle | Welcome + **3 numbers** (890 pupils · 1.98 Abitur average · 52 nationalities) | **Inter** + **Neutraface Text** | Not detected | Low |
| 11 | **Rijksmuseum** rijksmuseum.nl | **3**: Visit & tickets · Collection · Stories, + Menu | Login · Giftshop | **"Nederlands (Dutch) / English (English)"**. Visitor info in 8 further languages | Icon → search page | Full-bleed masterpiece image + one CTA ("Book your ticket") | **Rijksmuseum** custom (Text + Cyrillic sets) | Not detected | The collection *is* the brand. Heritage through artefacts, not text |
| 12 | **Bauhaus-Archiv** bauhaus.de | **4**: Visit · Join In · Discover · Research, + secondary 9 | Shop · Press · Image service | "Deutsch" (endonym) | Not visible on home | Exhibition feature + "Current & upcoming" cards | **Graebenbach** + Graebenbach Mono | Yes | Typographic heritage: a modernist grotesk and mono carry the identity |
| 13 | **Herzog August Bibliothek** hab.de | **4**: Forschung · Bibliothek · Kultur · Info (+ Home) | Katalog · Öffnungszeiten | `de / en` | Search covers site **or** OPAC (scope choice) | Feed of podcast and blog items, then intro + 3 tiles | **GT Sectra** (serif) + **GT America** | Yes | Collections taxonomy (Handschriften, Alte Drucke…) |
| 14 | **Bodleian Libraries** bodleian.ox.ac.uk | **7**: Libraries · Collections & resources · Services · Open research · Ask & support · Join · About | Exhibitions & tours · Shop · **"Pause animated content"** · Live chat | EN only | Site search + separate "Search SOLO" (catalogue) | Duke Humfrey's Library photo + task headline "Browse and search over 14 million items" | Cabin + Lora + Abril Fatface + Open Sans (4 families ✗) | Not detected | Historic room as hero, but the headline is a **task** |

### Patterns across the set

- **Top-level count:** the strongest sites (EPFL, Salem, Pforta, HAB, Bauhaus, Rijksmuseum) use **3–6** items. The sites with 9–12 items (Cambridge, St Paul's, DSL, Eton) all fall back to a "Menu" overlay or a dense second bar.
- **Language switch:** 5 of 7 multilingual sites use endonyms or codes. Only Pforta and DS Rom use flags, and both read as dated. ETH and EPFL's "(TA)" or machine-translation marking is an honest pattern worth copying for any partial translation.
- **Search:** 4 of 14 have no visible search on the home page (St Paul's, Pforta, DS Rom, Bauhaus). None advertises a keyboard shortcut. HAB's scoped search ("website / catalogue") is a model for "Site / Documente / Persoane".
- **Reduced motion:** only 5 of 14 reference `prefers-reduced-motion` anywhere we could detect. The Bodleian's explicit "Pause animated content" control is a best practice.
- **Heritage:** the best heritage presentations (Rijksmuseum, HAB, Bauhaus, Eton) **show artefacts and places** and put typography to work. They do not open with a founding-year paragraph. Several old schools (Eton 1440, St Paul's 1509) don't even put their founding date on the home page. They link to a strong "History" section instead.

## 2.2 Site-by-site: steal / avoid

1. **Oxford.** *Steal:* the public site vs intranet split (our public site is for families and prospects; student and teacher tools are links to the gradebook and Google Workspace), and a design system with locked components (T-7). *Avoid:* aggressive bot protection that blocks previews, link unfurls and accessibility checkers.
2. **Cambridge.** *Steal:* the two big prospective-student panels (Undergraduate / Postgraduate), which map to our "Viitori elevi" cycle selector. *Avoid:* 12 top-level items hidden behind "Menu", and a mix of audience and topic labels at the same level.
3. **ETH Zürich.** *Steal:* the endonym language list with machine-translation flags. Search labelled "Keyword or person", where people search is part of the main search. *Avoid:* no visible hero orientation for first-time visitors.
4. **EPFL.** *Steal:* exactly **6** short topic-based top-level items; the current language shown as non-link text; a header search field. *Avoid:* no audience entry points at all. Parents would struggle.
5. **Eton.** *Steal:* "Honouring Tradition. Inspiring Change." framing (heritage + future in one line); the stats row; Collections as their own destination; the utility link to the Parent Portal. *Avoid:* the primary nav entirely behind a hamburger on desktop; uppercase utility labels; the full-screen search overlay without visible suggestions.
6. **St Paul's.** *Steal:* **"Discover by entry age" (7+/11+/13+/16+)**. This is the direct model for **Pregătitoare · clasa a V-a · clasa a IX-a · transfer**. Also the Parents/Pupils/Staff utility links and a serif + geometric sans pairing. *Avoid:* 9 top-level items and no site search.
7. **Salem.** *Steal:* a 6-item nav in which **"Aufnahme & Stipendien" is a top-level item**; the endonym + globe switch; the footer "Schnelleinstieg" (quick-entry) column; a compact "seit 1920" heritage mark. *Avoid:* a rotating hero with no message, and a search that is icon-only.
8. **Landesschule Pforta** (closest peer: a historic German *Gymnasium* from 1543). *Steal:* **"Geschichte" as a first-class section** and a thorough history narrative; the open-day banner directly in the hero. *Avoid:* **flags** for languages, no search, "Galerien" as a top-level item, and abridged translations that aren't marked as such.
9. **Deutsche Schule Rom** (closest structural peer: a German school abroad covering K–12, and multilingual). *Steal:* the **cycle cards in order** (Krippe → Gymnasium), the trilingual welcome line, "Bei uns anmelden" as a verb-first nav label, and the anniversary banner. *Avoid:* flags; unpopulated "0 Lehrkräfte / 0 Schüler" counters (always render the numbers server-side); "Intern" as a top-level item.
10. **Deutsche Schule London.** *Steal:* the **three-number proof row** (pupils · Abitur average · nationalities); the parent-portal login in the utility bar; the skip link and labelled search toggle. *Avoid:* "Impressum" and "Stellenangebote" in the primary nav (they belong in the footer or utility bar), and a "Mitarbeitende" page without an actual directory.
11. **Rijksmuseum.** *Steal:* radical restraint (3 nav items, one image, one CTA); a custom typeface as the identity; the language list as "Nederlands (Dutch)". *Avoid:* very little. It is a museum use case, so copy its restraint, not its IA.
12. **Bauhaus-Archiv.** *Steal:* typography as heritage (Graebenbach + Mono); verb-first nav ("Visit · Join In · Discover · Research"). *Avoid:* an unlabelled second language link (an accessibility bug) and an audio player at the top of the header.
13. **Herzog August Bibliothek** (historic library, 1572). *Steal:* the **GT Sectra serif + GT America sans** pairing as a model for a humanist-heritage feel; scoped search (site vs catalogue); a collections taxonomy (Handschriften / Alte Drucke). This maps to our *Biblioteca Honterus* and Honterus' printing press. *Avoid:* leading the home page with a blog and podcast feed instead of orientation.
14. **Bodleian.** *Steal:* a historic interior as the hero image with a **task headline** on top; the **"Pause animated content"** control; a separate catalogue button. *Avoid:* 4 font families and a 46-link mega menu.

---

# PART 3 — Synthesis: IA, rules, acceptance tests

## 3.1 Recommended sitemap (RO labels, with DE / EN)

```
/ro/  (Acasă / Startseite / Home)
│
├── 1. Admitere  (Aufnahme / Admissions)               ← first: serial position
│   ├── Clasa pregătitoare  (Vorbereitungsklasse / Preparatory class)
│   │     └── Pașii de înscriere · Calendar · Documente · Întrebări frecvente
│   ├── Clasa a V-a  (5. Klasse / Year 5)
│   ├── Clasa a IX-a  (9. Klasse / Year 9 – lyceum)
│   │     └── Proba de limba germană · Profiluri & locuri · Calendar · Rezultate
│   ├── Transferuri  (Schulwechsel / Transfers)
│   ├── Zile porților deschise  (Tag der offenen Tür / Open days)
│   └── Taxe? → n/a (state school) → "Burse & sprijin"  (Stipendien / Grants)
│
├── 2. Școala  (Schule / Our school)
│   ├── Despre noi — Pe scurt  (fact list)
│   ├── Istoric 1541 → azi  (timeline)
│   ├── Johannes Honterus  (the founder)
│   ├── Conducere & organigramă
│   ├── Profesori & personal  (directory)
│   ├── Clădiri & Curtea Honterus  (campus)
│   ├── Biblioteca  (historic library & printing heritage)
│   └── Parteneri  (ZfA/DSD, partner schools, Kirche)
│
├── 3. Educație  (Unterricht / Learning)
│   ├── Ciclul primar  (P–IV)
│   ├── Gimnaziu  (V–VIII)
│   ├── Liceu  (IX–XII) — profiluri, secții RO/DE
│   ├── Diplome: DSD I/II, Abitur, Bacalaureat
│   ├── Rezultate & olimpiade
│   └── Proiecte & Erasmus+
│
├── 4. Viața școlară  (Schulleben / School life)
│   ├── Activități extrașcolare & cercuri
│   ├── Muzică, teatru, sport
│   ├── Consiliul elevilor
│   ├── Consiliere & sprijin  (counsellor, wellbeing, anti-bullying)
│   └── Absolvenți  (Alumni)
│
├── 5. Noutăți & Calendar  (Aktuelles & Termine / News & Calendar)
│   ├── Știri
│   ├── Evenimente
│   └── Structura anului școlar & vacanțe     ← NOT a class timetable (no "Orar")
│
└── 6. Contact  (Kontakt / Contact)                    ← last: serial position
    ├── Secretariat, program, adresă, hartă
    ├── Formular de contact
    └── Cariere  (Stellen / Jobs)

UTILITY BAR (top-right, every page):
  [Caută ⌘K]  ·  NoteInCatalog ↗  ·  Documente  ·  RO | DE | EN

AUDIENCE ROUTER  (home, directly below hero; also /pentru/…)
  ┌ Elevi ──────────┐ ┌ Părinți ─────────┐ ┌ Viitori elevi ───┐ ┌ Profesori ───────┐
  │ NoteInCatalog  │ │ NoteInCatalog   │ │ Alege ciclul:    │ │ Platforme interne│
  │ Calendar școlar │ │ Înscrieri/transf.│ │ Pregătitoare     │ │ Documente/formul.│
  │ Examene, DSD    │ │ Formulare        │ │ Clasa a V-a      │ │ Regulamente      │
  │ Cercuri, CȘE    │ │ Burse & sprijin  │ │ Clasa a IX-a     │ │ Cariere          │
  │ Consiliere      │ │ Contact profesori│ │ Zile deschise    │ │ Proiecte         │
  └─────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
  (hubs link to canonical pages; they never duplicate content)

FOOTER (4 columns + legal row):
  Contact (address, phone, e-mail, hours, map) │ Acces rapid (Admitere, Documente,
  Calendar, NoteInCatalog, Profesori) │ Pentru… (4 hubs) │ Instituție (Informații de
  interes public, Regulamente, Cariere, Presă)
  Legal row: Confidențialitate/GDPR · Accesibilitate · Cookie-uri · Hartă site ·
  RO|DE|EN · socials · "Fondat în 1541 de Johannes Honterus"
```

Notes:
- "Documente" sits in the utility bar, not the top 6. It is a cross-cutting library, reachable from every section by deep-linked filters (DL-3).
- "NoteInCatalog" is an external link. Use the generic label so the vendor can change without changing the label.
- There is no "Orar". The calendar section covers only the school-year structure, holidays and events.

## 3.2 Header layout specification

- **Desktop ≥ 1024 px:** row 1 is the utility bar (32–40 px). Row 2 has the logo and full name on the left and the 6 nav items on the right, with mega-menu panels on click (not hover-only) for Admitere, Școala, Educație and Viața școlară. Noutăți and Contact are direct links.
- **Tablet 768–1023 px:** logo, search button, "Meniu" button. The language switch stays visible.
- **Mobile < 768 px:** logo (short wordmark "Honterus" + crest) on the left, search icon button (48 px, labelled) and "Meniu" (48 px) on the right. The language switch is the first row in the menu panel.

## 3.3 Home-page order

1. Hero: real photo of the Honterus courtyard or school, an H1 with the school name, a one-line promise in the current language, and **1 CTA**, which is "Admitere 2027" during the admission season and "Descoperă școala" otherwise. There is no carousel.
2. Audience router (4 tiles).
3. Notice banner, only if one is active (V-2).
4. Proof row: 3–4 numbers (e.g. founding year · students · DSD results) — **only verified figures from docs 01/02; omit any number the school has not confirmed** (CLAUDE.md rule 2).
5. News (3) + upcoming events (3–5).
6. Heritage teaser: "1541 → azi" with 3 timeline highlights and a link to the full timeline.
7. Cycles: Primar · Gimnaziu · Liceu cards.
8. Footer.

## 3.4 Typography & motion direction (from the benchmark)

- **Pairing:** a humanist or transitional **serif for display** plus a neutral **grotesk for UI and body**, as at HAB (GT Sectra + GT America), St Paul's (Copernicus + Gotham) and Eton (Vesterbro + Nunito Sans). Both families need full Romanian (ș ț with comma below, not cedilla) and German support. Open-licence candidates: *Source Serif 4* / *Literata* / an EB Garamond-class humanist serif + *Source Sans 3* / *IBM Plex Sans*. **Not Inter and not system-only stacks** (anti-slop gate in `CLAUDE.md`). The final choice belongs in `docs/05_BESPOKE_DESIGN_SYSTEM.md`, drawing on Honterus's printed books and woodcuts of the 1530s–40s.
- **Maximum 2 families**, with at most 4 weights in total. The Bodleian's 4-family stack is the counter-example.
- **Motion:** fades and morphs ≤ 250 ms, no parallax, no autoplay, and everything turned off under reduced motion. Add a visible "Pause animated content" control if any hero video exists.

## 3.5 Twenty do / don't rules for the design team

| # | Do / Don't |
|---|---|
| D-01 | **Do** keep primary nav at **≤ 6** items, with Admitere first and Contact last. |
| D-02 | **Do** put Search · NoteInCatalog · Documente · RO/DE/EN in a top-right utility bar on every page. |
| D-03 | **Don't** use flags for languages. Use endonyms or `RO · DE · EN` with `lang`/`hreflang`. |
| D-04 | **Do** keep the user on the equivalent page when switching language, and say so when a translation is missing. |
| D-05 | **Do** use the audience router (Elevi · Părinți · Viitori elevi · Profesori) as a secondary entry, **don't** make it the top nav, and **don't** duplicate content in the hubs. |
| D-06 | **Do** make every target ≥ 44 × 44 px (≥ 48 on mobile) with ≥ 8 px spacing. |
| D-07 | **Do** show a visible, labelled search button with a ⌘K / Ctrl+K hint. **Don't** use single-key shortcuts. |
| D-08 | **Do** present admissions as 5 ± 2 numbered step cards per cycle, each with documents, deadline and place. |
| D-09 | **Don't** hide deadlines or required documents inside accordions or tabs. |
| D-10 | **Do** use accordions for FAQs (deep-linkable, with "expand all" beyond 6 items), and tabs only for 2–4 parallel views that collapse to an accordion on mobile. |
| D-11 | **Do** give each page one accent-coloured primary CTA. **Don't** use the accent colour decoratively. |
| D-12 | **Don't** use carousels, autoplay video, parallax, scroll-jacking or stock photography. |
| D-13 | **Do** honour `prefers-reduced-motion`, keeping View Transitions to a ≤ 250 ms cross-fade, and keep a visible `:focus-visible` ring (≥ 2 px, ≥ 3:1) that is never covered by sticky elements. |
| D-14 | **Do** meet a contrast of ≥ 4.5:1 for text and ≥ 3:1 for UI components, measured on photos with the scrim. |
| D-15 | **Do** keep one document library with URL-encoded filters and removable chips, and label each file with format and size. |
| D-16 | **Do** group the staff directory by role and department, with name filtering. Show e-mails only with consent and never personal phone numbers. |
| D-17 | **Do** tell the heritage story through artefacts, places and a semantic, accessible vertical timeline. **Don't** open the home page with a history essay. |
| D-18 | **Do** show the full school name and founding mark on every page (header plus footer), and use real photography of the school. |
| D-19 | **Do** stay within the `CLAUDE.md` budget: LCP < 1.5 s on 4G, INP < 100 ms, CLS = 0, ≤ 2 font families and ≤ 25 KB JS per page, with same-origin prefetch on hover. |
| D-20 | **Don't** create a class timetable ("Orar") page, menu item, widget or CMS type. The calendar covers only the school-year structure, holidays, exams and events. |

## 3.6 Acceptance tests

Unless stated, tests run on **390 × 844 px (iPhone 12–15 class), touch** and **1440 × 900 px, mouse**, in RO, DE and EN. "Tap" means one activation, and opening the menu counts as one tap.

| ID | Scenario | Pass criteria |
|---|---|---|
| AT-01 | A parent on a 390 px phone, starting at home, reaches the **Clasa pregătitoare enrollment steps** | ≤ **2 taps** (router tile "Viitori elevi" → "Clasa pregătitoare", *or* hero CTA in admission season). Step 1 is visible without horizontal scroll. |
| AT-02 | A prospective lyceum student finds the **German-language test date for class IX** | ≤ 3 taps from home. The date is visible as text (not only in a PDF) with `<time>`. |
| AT-03 | Language switch on `/ro/admitere/clasa-a-ix-a` → DE | Lands on `/de/aufnahme/9-klasse` (the equivalent page), with the scroll position reset and `<html lang="de">`. If the page is missing, a notice appears and the user goes to the closest ancestor, never to home. |
| AT-04 | Keyboard only: open search with Ctrl+K / ⌘K, type "cerere", choose a document with the arrow keys | Works without a mouse, the focus ring is visible at every step, and Esc closes and returns focus. |
| AT-05 | Search "secretariat" or a teacher's surname | A people result appears in the "Persoane" group within 300 ms of the last keystroke. |
| AT-06 | Document library: filter Category = Formulare, Cycle = Primar, then copy the URL into a new tab | The same filtered result appears, chips are visible, and the result count is announced by a screen reader. |
| AT-07 | Target size audit (axe `target-size` + manual) | 0 violations. All nav, utility, footer and filter controls are ≥ 44 px (≥ 48 px on touch). |
| AT-08 | Contrast & focus audit (axe + manual on hero, buttons, chips) | 0 failures of 1.4.3 / 1.4.11 / 2.4.7 / 2.4.11. A focused element under the sticky header or cookie banner is never fully hidden. |
| AT-09 | OS "Reduce motion" on | No view-transition animation, no reveal animations, no auto-hiding header, and smooth scroll off. |
| AT-10 | Lighthouse mobile + CrUX (after launch) on home, admissions and documents | Lab: Performance ≥ 98, Accessibility = 100. LCP < 1.5 s, INP < 100 ms, CLS = 0. |
| AT-11 | 5-second test, home on desktop, with 5 parents | ≥ 4/5 identify the school name, how to change language and where the gradebook is. |
| AT-12 | Tree test (≥ 15 participants per language) on 8 tasks: Pregătitoare steps, IX test date, transfer form, school holidays, gradebook, contact a teacher, history, open day | ≥ 80 % direct success per task. No task below 65 %. |
| AT-13 | Screen reader (NVDA + Firefox, VoiceOver + iOS Safari): open the mobile menu, expand "Admitere", activate "Clasa a V-a" | Correct names, roles and states (`aria-expanded`), focus is trapped in the open menu and returns on close. |
| AT-14 | Gradebook link | Present in the utility bar on every page and in the Elevi and Părinți hubs. It is marked external and is reached in 1 tap or click from any page on desktop, and 2 on mobile (menu → link). |
| AT-15 | Crawl the site and CMS schema for "orar", "Stundenplan" or "timetable" | **0** pages, nav items, search suggestions or content types. The only exception is a FAQ answer explaining that timetables are distributed by form teachers. |
| AT-16 | Timeline `/ro/despre/istoric` | It is an `<ol>` of entries with `<time>`, anchors work (`#1543`), there is no horizontal scroll at 320 px, and it reads coherently with CSS off. |
| AT-17 | Old-URL redirect test (list from the current site's sitemap or crawl) | 100 % of the top 200 legacy URLs return a 301 to a relevant page, not to home. |
| AT-18 | CMS: an editor publishes a News item without alt text, or a document without a category | Publishing is blocked with an inline error. A missing-translation badge shows in the item list. |
| AT-19 | Contact | The secretariat phone is a `tel:` link reachable in ≤ 1 tap from the mobile footer and the Contact page. The address links to a map. |
| AT-20 | Admission deadline passes (date in the CMS) | The step card switches to "Închis" automatically, the CTA swaps to "Vezi rezultatele / Calendarul viitor", and no editor action is needed. |

---

## Sources

**UX laws & research**
- Laws of UX (Jon Yablonski): https://lawsofux.com/ (Jakob, Hick, Miller, Doherty, Tesler, Von Restorff pages)
- NN/g — University Websites: Top 10 Design Guidelines: https://www.nngroup.com/articles/university-sites/
- NN/g — University Websites report (152 guidelines): https://www.nngroup.com/reports/university/
- NN/g — Faculty pages persuade prospective students (video): https://www.nngroup.com/videos/university-faculty-pages/
- NN/g — Audience-based navigation: https://www.nngroup.com/articles/audience-based-navigation/
- NN/g — Breaking web conventions: https://www.nngroup.com/articles/breaking-web-conventions/
- NN/g — Mega menus work well: https://www.nngroup.com/articles/mega-menus-work-well/
- NN/g — Menu design: https://www.nngroup.com/articles/menu-design/
- NN/g — Hamburger menus: https://www.nngroup.com/articles/hamburger-menus/
- NN/g — Fitts's Law: https://www.nngroup.com/articles/fitts-law/
- NN/g — Common region: https://www.nngroup.com/articles/common-region/
- NN/g — Aesthetic-usability effect: https://www.nngroup.com/articles/aesthetic-usability-effect/
- NN/g — Peak-end rule: https://www.nngroup.com/articles/peak-end-rule/
- NN/g — Tabs used right: https://www.nngroup.com/articles/tabs-used-right/
- NN/g — Accordions on desktop: https://www.nngroup.com/articles/accordions-on-desktop/
- NN/g — Tabs vs accordions (video): https://www.nngroup.com/videos/tabs-vs-accordions/
- NN/g — Applying filters: https://www.nngroup.com/articles/applying-filters/
- NN/g — Filter categories & values: https://www.nngroup.com/articles/filter-categories-values/
- NN/g — Filters vs facets: https://www.nngroup.com/articles/filters-vs-facets/
- NN/g — Mobile faceted search: https://www.nngroup.com/articles/mobile-faceted-search/
- NN/g — Employee directory search: https://www.nngroup.com/articles/employee-directory-search/
- NN/g — Employee search is the most important intranet feature: https://www.nngroup.com/articles/suggested-employee-search/
- LogRocket — Serial position effect: https://blog.logrocket.com/ux-design/serial-position-effect-ux-design/
- Smashing — Navigation design for mobile: https://www.smashingmagazine.com/2022/11/navigation-design-mobile-ux/
- GOV.UK Design System — Step-by-step navigation: https://design-system.service.gov.uk/patterns/step-by-step-navigation/
- St Andrews digital comms — why audience-based navigation does not necessarily work: https://digitalcommunications.wp.st-andrews.ac.uk/2014/08/20/why-audience-based-navigation-does-not-necessarily-work/

**Language switching / i18n**
- W3C i18n — Content negotiation and visible language links: https://www.w3.org/International/questions/qa-site-conneg
- W3C i18n — Indicating the language of a link destination: https://www.w3.org/International/questions/qa-link-lang.en.html
- W3C i18n wiki — Translation links: https://www.w3.org/International/wiki/Translation_links
- USWDS — Select a language (3+ languages): https://designsystem.digital.gov/patterns/select-a-language/three-or-more-languages/
- Smashing — Designing a better language selector: https://www.smashingmagazine.com/2022/05/designing-better-language-selector/
- Peter Hilton — Language selection: https://hilton.org.uk/blog/language-selection

**Accessibility & performance**
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- What's new in WCAG 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- Understanding 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- WebAIM WCAG 2.2 overview: https://webaim.org/standards/wcag/wcag22
- W3C Technique C39 (prefers-reduced-motion): https://www.w3.org/WAI/WCAG22/Techniques/css/C39
- Understanding 2.3.3 Animation from Interactions: https://w3.org/WAI/WCAG21/Understanding/animation-from-interactions
- Deque axe rule target-size: https://dequeuniversity.com/rules/axe/4.8/target-size
- MDN — Speculation Rules API: https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API
- Chrome — Prerender pages: https://developer.chrome.com/docs/web-platform/prerender-pages
- Chrome — Implementing speculation rules on complex sites: https://developer.chrome.com/docs/web-platform/implementing-speculation-rules

**Benchmarked sites (fetched 2026-11-26)**
- https://www.ox.ac.uk/ (403 to automated fetch). Context: https://numiko.com/projects/the-university-of-oxford, https://www.prolificnorth.co.uk/news/leeds-agency-redesigns-oxford-universitys-800-website-digital-estate/
- https://www.cam.ac.uk/
- https://ethz.ch/en.html
- https://www.epfl.ch/en/
- https://www.etoncollege.com/
- https://www.stpaulsschool.org.uk/
- https://www.schule-schloss-salem.de/de/
- https://www.landesschule-pforta.de/
- https://dsrom.de/
- https://www.dslondon.org.uk/de
- https://www.rijksmuseum.nl/en
- https://www.bauhaus.de/en/
- https://www.hab.de/
- https://www.bodleian.ox.ac.uk/

**Context on Honterus admissions:** the 2026 procedure for the German / Hungarian native-language verification test for class IX admission in Brașov county is referenced in https://www.georgemoroianu.ro/wp-content/uploads/Procedura-verificare_-cunostinte_-LB.Germana_LB.Magiara_-Materna_admitere-clasa-a-IX-a-liceu_2026-2027.pdf (other schools' published ISJ annex). The official calendar must always be linked from the ISJ Brașov and Ministry sources in the step cards.

> Note: `honterus.ro` resolves to a printing company (Tipografia Honterus), **not** the school. The legacy school site is `liceulhonterusbrasov.ro` (plus its `/lic/` WordPress), and the AT-17 redirect map is built from it.
