# 06 — Design jury and sign-off

Three independent critics reviewed the running site (real seeded data, Playwright screenshots at 320/390/768/1440 px, RO/DE/EN) against `CLAUDE.md`, `docs/03` and `docs/05`. Each wrote a scored verdict and a must-fix list; the fixes were implemented and the same critics re-reviewed.

| Critic | Lens | Round 1 | Round 2 (final) | Sign-off |
|---|---|---|---|---|
| 1 | Art director / book typographer (heritage institutions) | 7.5 | **9.2** | ✓ no must-fix remaining |
| 2 | UX lead and WCAG 2.2 auditor (public sector) | 7.5 | **9.0** | ✓ axe-core: 0 violations in 72 runs; no overflow at 320/390 on 255 URLs |
| 3 | Trilingual editor (RO/DE/EN, ZfA/PASCH publications) | 8.0 | **9.0** | ✓ no must-fix remaining |

**Result: approved (all three ≥ 9/10).**

## What changed between rounds (summary)
- **Layout & craft:** hero graticule and seal placement, 3:2 hero crop with focal points, history timeline line confined to entries with marginal source notes, admissions hub rebuilt as a numbered register (the banned equal-card grid removed), contact page stacking, documents grouped by school year with collapsible mobile filters, mega-menu double rule instead of shadow, red reserved for markers, centred ink end marks, lining figures for codes.
- **Accessibility:** named language links on mobile, menu fits at 320 px, scrollable labelled table regions, 44–48 px touch targets, counters with units and correct Romanian plurals, search dialog groups/Esc/focus, empty states, `lang="ro"` on untranslated fallback text, CLS 0 on the production build (measured fallback-font metrics).
- **Language & facts:** step numbering, en-GB dates, DSD II only (DSD I pending confirmation), 1388/1541 founding framing, unified German terminology (Realprofil / humanistisches Profil, Überprüfung der Deutschkenntnisse, Probeprüfung), Hontert etymology, localised credits, polite Romanian microcopy, school-year formats per language.

## Open items deliberately left (non-blocking)
- Latin plaque inscriptions as a set-piece on the Courtyard page; long ſ in Coetus headings.
- Atkinson's slashed zero in a few UI numerals (no alternate glyph in the font).
- Facts awaiting the school (listed in the handover): current leadership (published list dates from 2022), DSD I, office hours, fax, newest ROF, admissions e-mail, SmartLab / Willkommen in Europa / Young Guardians details.

---

# Appendix A — Critic 1 (art director): full verdict
# Critic 1 — Art director / book typographer

**Score: 7.5 / 10**

This site belongs to one school and could not be reused by another. The "Officina Coronensis" idea holds up across the site. Paper, ink, rubric and lapis are used with restraint. EB Garamond is set as a book face, with old-style figures in the Annales, small-caps "Colegiul Național", a rubric double rule under the title and ¶ before the standfirst. The courtyard/Black Church frieze is the best ornament on the site: hand-drawn, specific and calm, and a proper Peak-End closer. The news register (day in large old-style numerals in the gutter), the staff register and the Coetus/Courtyard marginal fact columns read like an annotated book, not a SaaS template. There are no gradients, glassmorphism, pills or hover-scale.

What keeps it from 9 is execution, not concept:
- The hero is spoiled by a cropped map neat-line that reads as a broken grey bar, and by a seal that covers its own caption.
- The timeline rule cuts through the text on mobile.
- The guide's table of contents numbers the steps differently from the steps themselves.
- Contact collapses into a 180 px column on phones.
- The Admitere hub falls back to exactly the "4 equal cards + icon + arrow" grid the constitution bans.
- Several heritage images are low-resolution or show cars, cables and blown skies.
- The marginal/rubric columns promised by the system are often left empty: the article gutter, the Courtyard gutter and the History right margin.

The fixes are mostly local CSS and markup, which is why I am confident ≥ 9 is reachable.

Screenshots: `(review workspace) jury/c1/` (`<page>-1440.png`, `<page>-390.png`, `search-*.png`, `mega-1440.png`, `menu-390.png`, crops `x-*.png`).

Note: during the session the dev data was reseeded. An earlier run showed two identical notice banners stacked and four identical "Simulare Evaluarea Națională" news items. The current data no longer shows either. Make sure the notice banner de-duplicates by id, because the first run proved it can render the same notice twice.

---

## A. Must fix for ≥ 9/10 (priority order)

1. **Home hero, all widths: the graticule frame is cropped and shows as a thick dashed grey bar.**
   - What's wrong: a vertical bar runs at about x = 620 and a horizontal one under the photo, at 1440 and 390. It collides with the DE lede ("…Tradition" touches it). It looks like a rendering error, not a map border.
   - Cause: `src/views/Home.astro:97` renders `<Graticule />` with the default `frame=true`, positioned `inset: -10% -20% auto auto` with `preserveAspectRatio="xMidYMid slice"`. So only the left and bottom bars of the neat-line survive, scaled up.
   - Fix: `<Graticule frame={false} />` in the hero, keeping only the arcs and limb. Or, if you want the border, give the hero its own box (`inset: 0`, `preserveAspectRatio="xMidYMid meet"`) so all four sides show at hairline weight. Keep opacity ≤ .08.

2. **Home hero, 1440 and 390: the seal covers the first words of the photo caption.**
   - What's wrong: "Curtea … Honterus" is hidden under the seal disc.
   - Cause: `.title-page__seal` (Home.astro ~l.397) is positioned against `.title-page__plate`, which includes the figcaption (`bottom: 2.5rem`). The caption is 2–3 lines tall, so the seal lands on it.
   - Fix: move the `<div class="title-page__seal">` inside `.plate--hero` (give `.plate--hero` `position: relative`) and anchor it to `bottom: -1.5rem; left: -1.5rem`. Add `figcaption { padding-left: calc(clamp(7rem,30%,10rem) - 1rem) }` at ≥ 64rem, or simply `margin-top: 2.25rem`, so the caption clears the overhang. On mobile, anchor it top-right of the photo instead (`top: -1.5rem; right: .5rem; left: auto; bottom: auto`), clear of the caption.

3. **/ro/scoala/istorie, 390 px: the red/grey timeline rule runs through the intro and the era headings.**
   - What's wrong: "Colegiul fo|losește", "Încep|uturi", "Epoca |lui Honterus".
   - Cause: in `src/views/History.astro`, `.tl::before/::after` sit at `left: 4.5rem` on mobile. `.tl__intro` and `.era__title` have `margin-left: 9.5rem` on desktop and evidently lose it on mobile.
   - Fix:
     - Draw the rule on `.events` (the `<ol>`), not on `.tl`, so it never passes the intro or the era headings.
     - Or keep the intro and era titles indented to the text column at every width: `margin-left: calc(4.5rem + var(--s-5))` under 40rem.
   - Also fix desktop: the intro and era titles start at 9.5rem (152 px) while event bodies start at 7.5rem + gap (144 px), an 8 px misalignment visible at 1440. Use one token, e.g. `--tl-text: calc(7.5rem + var(--s-5))`, for `.tl__intro`, `.era__title` and the event body.
   - The year "1542" also touches the rule. Add `padding-right: .5rem` to the year cell, or move the rule to `left: calc(7.5rem + var(--s-5)/2)`.

4. **Guides (/ro/admitere/clasa-pregatitoare and all siblings), all widths: the step numbers disagree.**
   - What's wrong: the "Pași" table of contents reads 0–5 while the rubric circles read 1–6.
   - Cause: `src/views/Guide.astro:83` prints `{s.sortOrder}`, but l.117 prints `i + 1`.
   - Fix: use the map index in the table of contents: `steps.map((s, i) => … <span class="num">{i + 1}</span>)`.
   - Also enlarge the rubric numerals. The ring is ~32 px with ~11 px digits, so it reads as a bullet, not a step. Use a 44–48 px ring and 20–22 px Garamond lining digits.
   - Close the 60 px gap between the numeral column and the step body: `grid-template-columns: 3.5rem 1fr` instead of the current wide column.

5. **Guides: the manicule note says "Datele de mai jos din 2026 sunt orientative" but it is placed *after* all the steps.**
   - What's wrong: the note refers to dates "below" while sitting below them, and a parent only learns that the dates are indicative after reading them.
   - Fix: in `Guide.astro` (~l.175), render the `guide__more` callout *before* `<ol class="steps">`, or at least the paragraph about 2026 dates. Keep the manicule.

6. **/ro/contact, 390 px: text is squeezed into a ~180 px column.**
   - What's wrong: the "Cum ajungeți" section keeps a 9rem compass-rose column beside the text.
   - Cause: `src/views/Contact.astro:172`, `.find { grid-template-columns: 9rem 1fr }`, has no breakpoint.
   - Fix: add `@media (max-width: 40rem) { .find { grid-template-columns: 1fr } .find__rose { width: 5rem } }`.
   - Two more problems on the same page:
     - The H2 "Cum ajungeți" is immediately followed by an H3 "Cum ajungeți la noi". Drop the H3.
     - On desktop the left column leaves a 300 px empty void under the contact card. Put the compass rose and the coordinates there, or the static map/plan of buildings A–D that the spec promises.
   - Set the rose in `--ink`, not rubric red. A 120 px red rose is a "large fill" of rubric and competes with the lapis CTA.

7. **/ro/admitere, 1440: this is the banned "identical card grid with an icon on every card" pattern, and the icons are inconsistent.**
   - What's wrong: two rows of four bordered boxes, each with an arrow-only link. Only 3 of 4 cards in row I and 1 of 4 in row II carry an emblem, so the headings sit on ragged baselines.
   - Fix (`src/views/Admissions.astro`): turn each group into a **numbered register** like the news list.
     - The rubric Roman numeral stays as the section mark.
     - Each entry gets a Garamond title, the small-caps rubric sub-label and one line of text, with a full-width hairline between entries.
     - Use the cycle emblem only once, in the left gutter of the row.
     - Replace the bare "→" with a text link ("Pașii pentru clasa pregătitoare →"). Bare arrows are also a weak accessible name.
   - Same issue on the home "Trei cicluri" triptych: replace the lone "→" with labelled links ("Învățământ primar →").

8. **Image quality and choice, across the heritage pages.**
   - Hero (`curtea-honterus-1600.webp`, 1600×721): a landscape panorama is force-cropped to 4:5, leaving about 577 source px for a 473 css-px plate. It is visibly soft at DPR 2, and two-thirds of the frame is grey sky and gravel. Either crop to `ratio="3 / 2"` and move the plate below the title on desktop, or pick a portrait source (the statue against the Black Church tower).
   - The 1539 crest woodcut in /istorie is a 1-bit scan blown up with visible stair-stepping. Redraw it as SVG (you already have `CrestMark.astro`) or source a higher-resolution scan.
   - /en/school/honterus-courtyard shows Building B behind parked cars and overhead cables. Use `curtea-honterus-2` or `scoala-b` without cars, and put the `CourtyardElevation` drawing on this page, as §5 of the design system says.
   - On home, the woodcut portrait is set as a pure-white rectangle on lapis-deep, a harsh paper-on-navy hole. Give the plate a `--paper` mat and `mix-blend-mode: multiply` on a paper background, or invert it to paper linework (`filter: invert(1)` plus `mix-blend-mode: screen`) so it prints *on* the night panel.
   - The YouTube facade uses YouTube's automatic `hqdefault.jpg`: a mid-blink close-up of a person on the home page. Supply a chosen poster frame (`maxresdefault` or a still of the courtyard) and draw the play roundel as specified (woodcut ring). Also stop the video at 2/3 width with an empty right third: place the caption and credit in that margin column.

9. **Credits are not localised.** "Unknown artist · Public domain" appears on RO and DE pages (home Annales, /istorie). Translate via `credits.json` → `credit_ro/de/en`, or map the key: "Autor necunoscut · Domeniu public" / "Unbekannter Künstler · Gemeinfrei".

10. **Rubric discipline: red is used decoratively in ~40 places per page.**
    - On home, every arrow and external-link glyph in the audience index is rubric (20 red arrows), as are the file icons in Documente, the contact-field icons, the fleuron and the compass rose. The system says rubric is for *markers* only.
    - Fix: set `.aud a svg`, the `.doc` file glyph, the contact `dt` icons and the fleuron to `color: var(--ink-3)`, and lapis on hover/focus. Keep red for kickers, dates, step numerals and the active nav underline.

11. **Article end mark (/en/news/…, /ro/educatie/liceu, Courtyard): the fleuron is a 20 px red blob flush left.**
    - Fix: in `src/views/Article.astro:84`, change `.end` to `width: 100%; text-align: center; color: var(--ink); margin: var(--s-7) 0;` and render `<Fleuron size={36} />`. Use the same treatment in `Editorial.astro`.
    - Codes set in the prose currently get old-style figures: "2022-1-RO01-KA120-SCH-000105343" reads "ROo1". Wrap identifiers in `<span class="code">` with `font-variant-numeric: lining-nums tabular-nums; font-family: var(--font-sans)`, or let the CMS sanitiser auto-wrap `[A-Z0-9-]{8,}`.

12. **The marginal and rubric columns promised by the system are left empty.**
    - Article at 1440: the left 2-column rubric gutter is blank while the date sits under the lede. Move the date into the gutter (day in large old-style numerals, month in small caps, like the news list). The "book with marginal notes" then exists on the article page too.
    - /istorie: the right 3-column margin is empty while every entry carries an inline "Sursă" link. Move sources into the margin as numbered marginal notes (Garamond italic 14 px, `--t-marg`) aligned to each entry. This is the single change that would make the history page feel like an annotated *Annales*.
    - /en/school/honterus-courtyard: the left gutter is empty. Put the Courtyard elevation or a key plan of buildings A–D there.

13. **Documents (/ro/documente), 1440 and 390.**
    - The "An școlar" column is too narrow, so every "2026–2027" wraps onto two lines and the header wraps too. Add `white-space: nowrap; min-width: 10ch` to that `th`/`td` (`src/views/Documents.astro`, near l.267), or print "2026/27".
    - Titles are all Atkinson 700: 290 bold lines make a wall. Use weight 500 and keep 700 for the filter labels.
    - Category is filtered twice (a `<select>` plus ten chips). Drop the select.
    - On mobile the ten chips plus three selects fill the entire first screen before the first document. Collapse them into one "Filtre (2)" disclosure under 40rem.
    - 290 rows on one 24,000 px page: group by school year with a sticky year heading, or paginate at 50.

14. **The masthead at 390 px is four stacked lines** ("COLEGIUL / NAȚIONAL / Johannes / Honterus") in a 60 px band. Spec §7.3 says "crest + Honterus". Under 30rem, hide `.brand__label` and set "Honterus" alone at 22 px, or let the label run on one line at 10 px with 0.06em tracking.

15. **The mega panel has a drop shadow** (`src/components/Header.astro:464`, `box-shadow: 0 30px 40px -30px …`). The system allows a shadow only on the search dialog. Replace it with the double rule (1 px + 3 px + 1 px) on the panel's bottom edge.

---

## B. Nice to have (polish toward 10)

- **Inscriptions (/en/school/honterus-courtyard):** the two 2021 Latin plaques are set as running italic caps with old-style figures. Make them the typographic peak of the page: a centred block in Garamond roman capitals, `letter-spacing: .12em`, lining figures, with interpuncts (HIC · FVIT · PRIMA · SCHOLA …), framed by the double rule.
- **Coetus heading:** the spec promises the one historical long ſ ("Coetus Scholæ" / "Constitutio") in the H1 or a kicker. It is not there. It would be a small, memorable detail.
- **Atkinson slashed zero:** in phones, postcodes, dates and years ("0268", "500025", "2026", "Year 10") it reads like code. If the font offers an unslashed alternate, turn it on for `.footer`, `.step__when`, `.meta` and table cells. Otherwise set those strings in Garamond lining figures.
- **Staff (/de/schule/kollegium):**
  - The lone red "78" right of the filters has no label. Write "78 Personen" in `--ink-2` small text.
  - The Romanian honorifics "prof.", "prof. înv. primar" are untranslated on DE and EN. Either localise them (Prof. / Grundschullehrerin) or drop them, since the role line already says so.
  - Avoid line-breaking compound names: use `hyphens: manual` and wrap "Tünde-Enikö" with a U+2011 non-breaking hyphen.
  - "Lehrkraft ·" is repeated 70×. Omit the role inside the "Lehrkräfte" group and show only the subject.
  - The A–Z jump rail promised in §7.11 is missing.
- **Footer:** ~150 px of empty paper above the frieze on every page. Reduce `margin-top` before the frieze to `var(--s-7)` (72 px).
- **Home "Urmează" block:** it shows "Niciun eveniment anunțat deocamdată." on the homepage. Hide the block when it is empty and let "Acces rapid" move up. An empty-state on the front page reads as neglect.
- **Home audience index:** "Catalogul electronic" appears 3× and "Google Classroom" 3× across the four columns. Keep each in at most two audiences and use the slots for *Burse*, *Calendarul anului școlar* or *Coetus*. Spec §7.6 also asked for *index tabs* (a thumb index). The current four lists are fine but generic. Give the column headings a little tab: a rubric top border plus a paper-sunk label block.
- **Two lapis primaries on one view:** the hero CTA plus "NoteInCatalog" in Acces rapid; on Contact, "Sună" plus "Trimite". Keep one filled; make the other outline.
- **Cycle labels:** `text-transform: uppercase` turns Romanian ordinals into "CLASELE A V-A – A VIII-A". Use `font-variant-caps: all-small-caps` on the original mixed-case string, or keep lower-case "a" by marking it up.
- **News summaries:** home uses Garamond 14 px grey, /news uses Atkinson 15 px. Pick one (Garamond 17 px `--ink-2` reads far better).
- **History table of contents:** "1498–23.01.1549" mixes a year with a full date. Use "1498–1549".
- **Search dialog:** label the bare "14" ("14 rezultate"). Year ranges in results use a hyphen ("2019-2020"); use an en dash. Rank current-year documents above 2020. On 390 px make the dialog a full-height sheet: the page currently shows through below 640 px.
- **Lyceum page:** the table and the facts column repeat the same data. Drop "Profil real / Profil umanist" from the margin and show "Clase pe an: 4" and "Laboratoare: corpurile B, C" instead. The terminology "Conferinței Miniștrilor Culturii din Germania" should be "Conferința Miniștrilor Educației și Culturii (KMK)".
- **Home Annales:** "1541 – Anul întemeierii" next to "1388 – Prima mențiune" reads as a contradiction. Label 1541 "Reorganizarea umanistă / anul de fondare asumat".
- **"Actualizat 26 noiembrie 2026"** on every editorial page is the seed date, not an editorial date. Show it only when an editor saved the page.

## What must not be lost while fixing

The courtyard frieze, the old-style day numerals in the news register, the small-caps/italic title-page hero typography, the double rules, the Coetus and Courtyard fact columns, the restrained palette, and the absence of photos in the staff register. These are why the site already passes the "could another school use this?" test.

---

## Round 2

**Score: 8.8 / 10. It reaches 9.2 once the two remaining must-fix items below are done; both are under an hour of work.**

Screenshots: `(review workspace) jury/c1-r2/`. Same 13 pages at 1440 and 390, reduced motion, lazy images forced to load, plus the search dialog, the mega-menu and the mobile menu.

This is now a disciplined, specific and calm piece of work.
- **Home hero:** reads as a title page. The ornament is gone, the 3:2 plate is sharp, and the seal no longer touches the caption.
- **History page:** behaves like an annotated *Annales*. Numbered source notes sit in the right margin, the text edge is one line, and the timeline rule stays inside the entries at 390 px.
- **Admitere hub:** a good register now, with the rubric Roman numeral and title in the left column and numbered entries with "Vedeți pașii →" on the right. The card grid is gone.
- **Red:** back to markers only.
- **Article:** the date sits in the gutter, the end mark is centred in ink, and codes use lining figures.
- **Woodcut on the night panel:** mounted on a paper mat.

I found no new slop and no layout regressions apart from the one below.

### Must-fix verification (round 1 → now)

| # | Item | Status |
|---|---|---|
| 1 | Graticule bar in the hero | **Fixed.** Only faint arcs remain, no frame. |
| 2 | Seal over the caption | **Fixed.** Desktop: bottom-left of the plate. Mobile: top-right. |
| 3 | History rule through text on mobile; 8 px offset | **Fixed** at both widths. "1542" is clear of the rule. |
| 4 | Guide numbers 0–5 vs 1–6; small numerals | **Fixed.** 1–6 everywhere. The ring is about 44 px with readable digits. |
| 5 | Manicule note after the steps | **Fixed.** It sits above the steps and the wording is corrected. |
| 6 | Contact at 390 px | **Fixed.** The section stacks. The rose is in ink, sits with the coordinates in the left column, and the duplicate H3 is gone. |
| 7 | Admitere card grid | **Fixed.** Register layout with text links. The triptych has labelled links. |
| 8 | Image quality and choice | **Mostly fixed.** Hero recropped 3:2; woodcut on a paper mat; custom video poster with the caption in the margin; crest shown small. **Remaining:** see R2-2. |
| 9 | Credits not localised | **Fixed** ("Autor necunoscut · domeniu public"). |
| 10 | Red overused | **Fixed.** Arrows, file glyphs, contact icons, rose and fleuron are all ink. |
| 11 | Fleuron; old-style figures in codes | **Fixed.** |
| 12 | Empty margin columns | **Fixed** on the article, history and courtyard pages. The courtyard gutter now holds the rose. |
| 13 | Documents | **Fixed:** grouped by year, `nowrap`, weight 500, one category filter, collapsible "Filtre" on mobile. The page is still about 25,000 px (nice-to-have below). |
| 14 | Masthead at 390 px | **Fixed** (crest + "Honterus"). |
| 15 | Mega-menu shadow | **Fixed.** A double rule replaces it. |

The nice-to-haves that were done also help: the Urmează block is hidden when empty, "78 Personen", honorifics dropped, "Lehrkraft" no longer repeated, Garamond small caps for the cycle labels, KMK named correctly, the 1541 label in the Annales, the search result count is labelled, and search is a full-height sheet on mobile.

### Remaining must-fix for ≥ 9

**R2-1. Mobile search sheet at 390 px: the close button is cut off by the viewport (regression).**
- What's wrong: the "Esc / Închideți" button's box spans 355.6 → 399.6 px on a 390 px viewport, so its right border and about 10 px of the target are off-screen. This is a Fitts problem on the one control a stressed parent needs.
- Fix in `src/components/SearchDialog.astro`: the input row must not push the button out.
  - `.search__bar { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; }` with `min-width: 0` on the input.
  - Or give the dialog `inline-size: 100%` with `box-sizing: border-box` and `padding-inline: 16px`.
- Verify: `button.getBoundingClientRect().right <= innerWidth - 8`.

**R2-2. The same photograph is used three times.**
- What's wrong: Rotaru Florin's pink building A appears as the home video poster, the only image on /de/schulleben/coetus, and the only image on /en/school/honterus-courtyard. On the Courtyard page it does not even show the courtyard: it shows a side street. For a site whose thesis is "real places of *this* school", repeating one plate reads as a shortage of material.
- Fix (data/view only):
  - **Courtyard page:** use `curtea-honterus-2` or `panorama` (the courtyard with the Black Church), or the `biserica-neagra-statuie` image. Its own subject is the courtyard, the statue and the church.
  - **Coetus page:** keep the pink building, or better, use the 1543 *Constitutio* or the woodcut press emblem (`EmblemCoetus` at plate scale).
  - **Home video poster:** a frame from the film itself, or `scoala-a`.
- Rule of thumb: no heritage photo appears on more than one page above the fold.

### Nice to have (round 2)

- **Courtyard, Latin plaques:** still set as running italic caps with old-style figures. This is the page's natural heritage moment. Set it as a centred inscription block: Garamond roman capitals, `letter-spacing: .12em`, lining figures, interpuncts, between two double rules.
- **Courtyard:** the `CourtyardElevation` drawing would serve this page better than the compass rose in the gutter. The rose belongs on Contact, where it now also appears.
- **Numerals are still inconsistent:**
  - Atkinson's slashed zero appears in the "Când" bars ("2026", "12:00–15:00"), the phone button "0268 470 802", search meta and the documents table, while the footer and contact text now use Garamond figures.
  - Search meta still writes "2026-2027" with a hyphen.
  - History entry bodies use lining figures while the intro uses old-style.
  - Fix: make all `.step__when`, phone buttons and table year cells Garamond `lnum tnum`. Year ranges should use an en dash everywhere.
- **Documents:**
  - Inside year groups, the "An școlar" column is redundant. Drop it on desktop.
  - On mobile, each item stacks two labelled metadata rows (Categorie / Format). Merge them into one line: "Admitere și înscrieri · PDF · 156 KB". That roughly halves the 58,000 px mobile page.
  - Consider "show 2 most recent years, older on demand".
- **Contact:**
  - About 90 px of empty space between the message field and the privacy note, probably a reserved anti-spam widget slot. Collapse it until the widget renders.
  - Two filled primaries (call + send). Make the call button outline.
- **Staff:** "Stellvertretende Schulleiterin · Grundschule" wraps with the "·" at the start of the next line. Put the separator in a `white-space: nowrap` span together with the second word.
- **Admitere hub:** "Vedeți pașii" ×8 gives identical link names. Add a visually hidden suffix ("— clasa pregătitoare") so screen-reader link lists are unambiguous.
- **History:** the 1541 entry still shows building B with parked cars. Acceptable as documentation, but `scoala-b` without cars would be cleaner.
- **Home:** "Catalogul electronic" and "Google Classroom" still appear in three of the four audience columns (minor).

## Round 2 — final

**Final score: 9.2 / 10.** Both remaining must-fix items are verified at 390 and 1440 px:
- **R2-1:** the search close button's right edge is at 374 px on a 390 px viewport, now fully visible.
- **R2-2:** the Courtyard page shows the Honterus statue at the Black Church (`biserica-neagra-statuie`, credited "August Dominus · CC0"); the home video poster is `scoala-a`; Coetus keeps the school photo. The same photograph no longer repeats.

No must-fix items remain. One small new note: at 390 px the statue crop cuts close to the head. Setting `object-position: 50% 20%` on that plate would help. The Round 2 nice-to-haves still stand: the Latin inscription block, consistent numerals, and denser document metadata on mobile.

---

# Appendix B — Critic 2 (UX & accessibility): full verdict

# Critic 2: UX and WCAG 2.2 accessibility audit

**Site:** Colegiul Național „Johannes Honterus” Brașov, http://localhost:4321 (Astro dev, real data). **Date:** 2026-11-26.
**Method:** Playwright (Chromium) at 320, 390 (touch, isMobile) and 1440 px, in ro/de/en.
- Crawled all 273 sitemap URLs at 390 px for overflow, `<html lang>`, hreflang, h1, heading order, image dimensions, alt text and timetable strings.
- Ran axe-core 4.10.2 on 36 key-page and viewport combinations. The CDN copy is blocked by the site's CSP, so I injected a local copy with `bypassCSP`.
- Scripted the keyboard tests, the task walkthroughs, target-size measurement, the focus-obscured test, and a CLS/LCP probe throttled to 4× CPU and slow 4G.

## Score: **7.5 / 10**

The foundations are well above typical public-sector work:
- **Landmarks and headings:** a real skip link that focuses `<main>`, exactly one h1 per page, no heading-level skips on any of the 273 pages, and one `<main>`.
- **Language:** hreflang ro/de/en-GB plus x-default on every page, and a correct `<html lang>`. The language switcher keeps the user on the equivalent page, including guide slugs (`/ro/admitere/clasa-a-ix-a` goes to `/de/aufnahme/klasse-9`).
- **Focus and contrast:** a 3 px focus ring on every element I tabbed through, and no axe colour-contrast failures.
- **Header and dialogs:**
  - The mega menus use click-toggled buttons with `aria-expanded`, and Esc closes them and returns focus.
  - The mobile menu is a native modal `<dialog>`, so focus is trapped and returns on Esc.
  - Ctrl+K search works as a combobox with `aria-activedescendant`.
- **Filters:** the documents filters write their state to the URL and announce "N documente" in a live region.
- **Guide and DE content:** the guide checklist is keyboard-operable and persists. The DE content is written for German readers, not translated word for word.
- **Hard rule:** no timetable anywhere.
- **Task walkthroughs:**
  - The pregătitoare guide is reached in **1 tap** from home through the router (AT-01 passes).
  - NoteInCatalog is in the utility bar on every page (1 tap).
  - DSD in German is 2 clicks away.

It is not a 9 because of these problems:
- One WCAG A failure that axe reports on every mobile page: the language links have no accessible name.
- A WCAG 1.4.10 Reflow failure: the Menu button is clipped at 320 px, and data tables push the page wide at 390 px in DE.
- A visible step-numbering bug in every admission guide (the summary list starts at 0, the steps at 1).
- An empty Gallery page.
- Live-region counters that announce a bare number.
- Systematic sub-44 px targets in the utility bar, footer phone links and breadcrumbs.
- A search that finds no people or contact result for "secretariat" (AT-05 fails).

---

## Task walkthroughs (390 px touch / 1440 px)

| Task | Path | Taps/clicks | Friction |
|---|---|---|---|
| (a) Enrol in clasa pregătitoare and find the documents | Home, router "Viitori elevi › Clasa pregătitoare", guide | **1** (mobile and desktop) | The documents ("Ce pregătiți") are visible, not in accordions, which meets D-09. However, the step summary is numbered **0–5** while the steps are numbered **1–6**. The external link is labelled only "Deschide" and does not say what it opens. The callout says "Datele de mai jos din 2026" ("the 2026 dates below") although it sits *below* the steps. The admissions e-mail `admitere@liceulhonterusbrasov.ro` contradicts `liceulhonterus@yahoo.com` everywhere else and needs verifying. |
| (b) Electronic gradebook (NoteInCatalog) | Utility bar | **1** | The link is only 40 px tall on mobile, below the 48 px touch target. |
| (c) Find a teacher by subject | Mobile: Meniu › Școala › Personal, then type a subject (3 taps). Ctrl+K "matematică" shows a PERSOANE group (2). | 2–3 | The filter ignores diacritics, which is good. The result count announces just "8". |
| (d) Find the ROF | Meniu › Documente › category Regulamente, or type "funcționare" | 3 | The newest school ROF is **2017–2018**, so a current ROF is missing (content issue for the school to confirm). Global search for "regulament" ranks the privacy page first. |
| (e) A German visitor wants DSD information | /de/ › Bildung › Deutsch und DSD | 2 | The content is excellent: ZfA, PASCH and a source citation. The home router says "DSD I și II", but the DSD page mentions only DSD II, so the two disagree. |
| (f) Contact the office | Primary nav "Contact" (desktop 1); mobile footer `tel:` link (1) | 1 | The phone links in the footer and on the Contact card are 22–25 px tall, so they are hard to hit. The Fax number is identical to the first phone number; please verify it. At 390 px the "Cum ajungeți" section puts a 150 px compass rose beside a narrow text column. "Cum ajungeți" (h2) is immediately followed by "Cum ajungeți la noi" (h3), which is redundant. |

## Automated results (axe-core 4.10.2, 36 page×viewport combinations)

| Impact | Rule | Where |
|---|---|---|
| **serious** | `link-name` | Every page at 390 px, 3 nodes each: the utility-bar language links RO/DE/EN have no accessible name. |
| moderate | `landmark-unique` | Every page while 2 or more notice banners were active: both banners are `<aside>` landmarks with the identical label "Anunț important". |
| moderate | `landmark-complementary-is-top-level` | Home in ro, de and en: the `.bulletin__events` `<aside>` sits inside `<main>`. |
| — | `color-contrast`, `target-size` (24 px), `label`, `image-alt` | **0 violations** |

The Vite error-overlay findings on a few EN pages are excluded. The dev server was restarting during the run, and the clean rerun passed.

## Crawl results (273 URLs, 390 px)

- **Horizontal overflow at 390 px:** `/de/aufnahme/klasse-9` (505 px), `/de/aufnahme/bakkalaureat` (470 px) and `/de/bildung/lyzealstufe` (427 px). The cause is a prose `<table>`.
- **Overflow at 320 px (400 % zoom):** **every page** is 323–350 px wide because `.masthead__actions` and `.menu-trigger` are clipped. The contact card (360 px) and the RO/EN baccalaureate tables (340–362 px) also overflow.
- **Passes:** `<html lang>` correct on every page; hreflang 4/4 (with x-default) on every page; h1 = 1 on every page; 0 heading skips; 0 images without dimensions; 0 images without alt.
- **"orar" / "Stundenplan" / "timetable":** 0 occurrences in pages or nav. Search for "orar" returns substring matches on "tempor**ar**", which is harmless but noted.
- **CLS** (dev build, throttled): home 0.043 in both RO and DE. The sources are `.masthead__actions`, `.brand` and the hero SVGs, so this is a font-swap reflow of the header. Other pages are ≤ 0.002. LCP measured in dev is not representative and must be re-measured on the production build.

---

## Must fix to reach 9/10 or higher

1. **Language links have no accessible name on mobile.** All pages, 390 px, ro/de/en. WCAG 2.4.4 / 4.1.2 (A), axe *serious*.
   - **Cause:** `.lang__long` is hidden with `display:none` at narrow widths, and `.lang__short` is `aria-hidden`, so the link's name is empty.
   - **Fix:** in `src/components/Header.astro` (lines 37–55), hide the long label with the `.vh` class instead of `display:none`, *or* put `aria-label={LOCALE_META[l].endonym}` on the `<a>`.

2. **Reflow at 320 px: the Menu button is cut off on every page.** WCAG 1.4.10 (AA).
   - At 320 px wide (400 % zoom on a 1280 px screen), `.masthead__actions` reaches 328–350 px, and in DE the "Menü" button is half off-screen.
   - **Fix:** in `Header.astro` styles, below about 360 px either hide the text label of `.menu-trigger` (keep it as `.vh` text) or let `.brand__text` shrink (`min-width:0`, smaller `.brand__name`). Also put `min-width:0` on the flex children.

3. **Data tables push the page wide.** DE guides at 390 px; RO/EN baccalaureate pages and the contact card at 320 px. WCAG 1.4.10.
   - **Where:** `/de/aufnahme/klasse-9`, `/de/aufnahme/bakkalaureat`, `/de/bildung/lyzealstufe`, `/ro/admitere/bacalaureat`, `/en/admissions/baccalaureate`.
   - **Fix:** in `src/styles/global.css`, give `.prose table` a scroll wrapper (`display:block; overflow-x:auto; max-width:100%`, plus `tabindex="0"`, `role="region"` and an `aria-label` on the wrapper). Alternatively, stack the table rows below 480 px. Also allow long German compounds to break with `hyphens:auto` and `overflow-wrap:anywhere` in table cells.
   - For `/ro/contact` at 320 px, the `.card dl.lines` block is 360 px wide; add `min-width:0` and `overflow-wrap:anywhere`.

4. **Guide step numbering is off by one.** Every guide, all languages.
   - The table of contents and the "next step" link use `s.sortOrder`, which starts at 0, while the step cards use `i + 1`. A parent sees "0 Ziua porților deschise" next to a card numbered "1".
   - **Fix:** in `src/views/Guide.astro`, lines 67–68 and 83–84, use the index plus 1 for the visible number. Keep `sortOrder` only for the anchors, or change the anchors to `#step-${i+1}`.

5. **Live-region counters announce a bare number.** Staff filter and search dialog. WCAG 4.1.3 / 1.3.1.
   - The staff page shows a large red "8", and the search status reads "40". A screen reader hears just "eight".
   - **Fix:** in `src/views/Staff.astro` line 72, render something like `8 persoane` / `8 Personen` / `8 people` with plural-aware i18n, as `Documents.astro` already does with `docsCount`. In `src/components/SearchDialog.astro`, set the status to "40 rezultate". Also replace `role="presentation"` on the group headings (line 103) with `role="group"` and `aria-label`, so the "Persoane" and "Documente" group headings are announced.

6. **Gallery is an empty page.** `/ro/galerie` (and the DE/EN equivalents), all viewports.
   - The page shows an h1 "Galerie", a rule, and then the footer. It is a dead end that is linked from the navigation and the footer.
   - **Fix:** in `src/views/GalleryList.astro`, add an empty state that points to News and Viața școlară, *or* hide the route from `src/i18n/nav.ts` until albums exist.

7. **Touch targets are below 44/48 px.** 390 px, all languages. CLAUDE.md Fitts rule, D-06, AT-07. Not a WCAG 2.5.8 failure, because 24 px is met.
   - **Utility bar** (NoteInCatalog, Classroom, language links): 40 px tall, and the language links are 37 px wide. Fix: `.utility__row` `min-height: 3rem` and the links `min-height/min-width: 48px` in `Header.astro`.
   - **Footer and contact `tel:` and `mailto:` links:** 22–25 px tall. These are the AT-19 phone links. Fix: `display:inline-flex; min-height:48px; align-items:center` in `src/components/Footer.astro` and `src/views/Contact.astro`.
   - **Breadcrumb links:** 20 px tall. Fix: `PageHead.astro`, use padding-block so each is at least 44 px.
   - **Documents register title links:** 25 px tall, and they are the primary action on the page. Fix: make the whole row the target (stretched link) or pad the link, in `src/views/Documents.astro`.
   - **History "Sursă" links:** 22 px, 27 of them. Fix: pad them in `src/views/History.astro`.

8. **Search finds nothing useful for "secretariat"** (AT-05 fails).
   - The query returns a single news item: no PERSOANE result and no Contact page.
   - **Fix:** in the search-index builder (`src/pages/api/search/…`), index the secretariat staff roles ("Secretar", "Secretariat") and the Contact page with keywords such as secretariat, telefon, program and adresă. Also rank documents whose title starts with the query above pages that only mention it, so "regulament" does not put the privacy page first.

9. **CLS on home is about 0.04** against a budget of 0.
   - The shift comes from `.masthead__actions` and `.brand` moving when the web fonts swap in, and from the hero SVGs.
   - **Fix:** check the fallback `size-adjust` / `ascent-override` metrics in `src/styles/global.css` (lines 30–40) for the Atkinson face used in the header buttons. Give the hero SVG ornaments explicit `width`/`height`. Re-measure on `npm run build && wrangler dev`.

10. **Copy and fact errors in the most important task (pregătitoare).** These are rule-2 issues that the jury will catch.
    - "Datele de mai jos" points to content that sits *above* it (the guide body callout in the DB).
    - The `admitere@liceulhonterusbrasov.ro` address conflicts with the yahoo.com address used everywhere else.
    - The Fax number is the same as Telefon 1.
    - Verify all three against `docs/01`/`02`, or remove them.

## Nice to have

- **Notice banners** (`src/components/NoticeBanner.astro`):
  - Give each `<aside>` a unique name with `aria-labelledby` pointing to its own text.
  - When stacked, two banners take about 170 px of the first mobile screen. Collapse them into one "2 anunțuri" bar.
  - I saw a duplicated banner (same text twice, n33) during the run. Deduplicate it in the CMS or the query.
- **Home events `<aside>`** (`.bulletin__events` in `src/views/Home.astro`): change it to a `<section aria-labelledby>`, which resolves the axe `landmark-complementary-is-top-level` finding.
- **Guide step links** (`Guide.astro` lines 161–166): replace "Deschide" with a descriptive label, for example "Calendarul înscrierii (ministerul, extern)", and show the format and size as D-15 requires. Show a "doar în română" note on the checklist or FAQ when it falls back to RO, and add `lang="ro"` to the fallback items (lines 43, 145, 194–195; the `checklistOf` and FAQ fallbacks currently drop the `lang` attribute).
- **Documents page on mobile:** the filter panel (search, 3 selects and a button) fills the whole first screen, and the results start below the fold. Collapse the filters behind a "Filtre (n)" toggle on narrow screens. The category filter also appears twice, as a select *and* as chips; keep one. The year column shows "2026" while the filter says "2026–2027"; use one format.
- **Search dialog:** Esc first clears the input and needs a second press to close (AT-04 expects one press). Consider closing on the first Esc when the input is already empty, and showing the "Esc" hint. The input has `outline:none` and relies on the dialog border; add a visible focus style for 2.4.7.
- **Mobile menu:** initial focus lands on the "Română" link. Put it on the close button or the first navigation item instead. The NoteInCatalog/Classroom buttons in the menu lack the "(se deschide pe alt site)" hidden text that the utility bar has (`Header.astro` lines 195–196).
- **History "Sursă" links:** 27 links all named "Sursă" that open in new tabs. Use `aria-label="Sursă: <event>"` and add the new-tab hint (`src/views/History.astro`).
- **Admitere hub cards:** the visible affordance is only a small "→" on each card. Make the card title the link, or the whole card with a stretched link.
- **Contact page at 390 px:** stack the compass illustration above "Cum ajungeți" instead of placing it beside the text, and remove the duplicate h3.
- **Language switch on a filtered URL:** switching languages on `/ro/documente?cat=formulare` drops the query. Carry the filter params across.
- **DSD I/II:** align the home router label "DSD I și II" with the DSD page, or add DSD I (class 10) to the page if `docs/02` confirms it.
- **Production checks:** run Lighthouse on the production build. The dev build loads about 1.5 MB of unminified JS on home, so the dev numbers say nothing about the 25 KB budget.

---

## Round 2

**Re-test (2026-11-26, after reseed).** I re-ran the same scripts:

- **Crawl:** all **255** sitemap URLs at both 390 px and 320 px. Each page was checked for overflow, status, h1, heading skips, hreflang, alt text and timetable strings.
- **axe-core 4.10.2:** the same 36 pages at both 390 and 1440 px (72 runs).
- **Keyboard:** skip link, mega menus, mobile dialog, Ctrl+K search, language switch.
- **Target sizes:** the same 14 pages.
- **Focus-obscured test:** Shift+Tab through long pages.
- **CLS/LCP probe** and the six tasks.

### Must-fix verification

| # | Item | Result |
|---|---|---|
| 1 | Language link names on mobile | **Fixed.** The links have names and measure 48×48 px. axe `link-name`: 0. |
| 2 | Reflow at 320 px (menu cut off) | **Fixed.** 0 of 255 pages overflow at 320 px. The menu collapses to an icon button with a hidden text label. |
| 3 | Tables overflowing | **Fixed.** Tables sit in a `.table-scroll` wrapper with `role="region"`, `tabindex="0"` and an `aria-label`. 0 of 255 pages overflow at 390 px. The DE klasse-9 table now fits and hyphenates. |
| 4 | Guide step numbering | **Fixed.** The table of contents shows 1–6, matching the step cards 1–6. |
| 5 | Counters with units | **Fixed.** The staff filter announces "8 persoane" / "0 persoane", search announces "8 rezultate" / "2 Treffer", and result groups use `role="group"`. |
| 6 | Empty gallery | **Fixed.** The page has an empty-state sentence with links to Noutăți and Viața școlară. |
| 7 | Touch targets | **Fixed.** Utility bar, breadcrumbs, `tel:`/`mailto:` links and document rows are at least 44 px (48 on the utility bar). The only items left are the 22 px guide checkboxes, which sit inside full-row labels 68 px tall (acceptable), and inline prose links (exempt under WCAG 2.5.8). The Admitere hub cards are stretched links, so the whole 187 px card is the target. |
| 8 | Search for "secretariat" and "regulament" | **Fixed (partly).** "secretariat" now returns the Contact page first, and "secretar" also returns "Conducere și personal". There is still no PERSOANE group for that query (see below). "regulament" now ranks the Documente pages first. |
| 9 | CLS | **Improved; I cannot confirm 0 myself.** In dev the inner pages are 0.0000–0.0004. Home is 0.035 (RO) and 0.031 (DE), from `.masthead__actions` and the hero SVGs. That remaining shift is consistent with Astro dev injecting CSS through JS, and the team reports CLS = 0 on the production build. I did not build the site, because that would write into the repository. |
| 10 | Copy and fact errors | **Fixed or verified.** The callout now reads "Datele din 2026 indicate la fiecare pas". The guide now uses only liceulhonterus@yahoo.com. The fax number being identical to the phone is confirmed by docs/01 line 223 ("același cu telefonul"). The duplicate contact h3 is gone. |

### Nice-to-haves addressed

- Search: one Esc closes the dialog and returns focus to the trigger. When the input is focused, the form shows a 3 px inset lapis bar as its focus indicator.
- Mobile menu: initial focus goes to the close button.
- Documents: the filters collapse behind a "Filtre" summary on mobile, so results appear above the fold.
- Language switch keeps the query (`/ro/documente?cat=formulare` goes to `/de/dokumente?cat=formulare`).
- Guide links now name their destination and the new-tab behaviour.
- **axe: 0 violations of any impact in all 72 runs.**

### Regression scan

- **0 issues across 255 URLs × 2 widths:** h1 = 1, no heading skips, 4 hreflang tags each, correct `lang`, all images have alt text, no timetable strings.
- **Focus obscured:** 0 real cases. The only hits were the skip link itself, which intentionally overlays the header, and the dev toolbar.
- **Keyboard:** the full desktop tab order is logical and every stop shows a 3 px ring. Mega-menu Esc returns focus to its toggle.
- **Legacy links:** 81 links in RO news and guides still point to `liceulhonterusbrasov.ro/lic/wp-content/…`. All 60 unique paths return **301** through the D1 redirect table, so nothing breaks.

### Remaining items (none block 9/10)

1. **Mobile header shows only "Honterus".** At ≤ 390 px the brand drops to the single word "Honterus" on every inner page. The brand link's accessible name is still the full school name, and the footer shows it in full. However, D-18 asks for the full school name in the header on every page, and a parent landing from Google on a guide page sees only "Honterus". Suggestion in `src/components/Header.astro`: keep a one-line "Colegiul Național" kicker above "Honterus" at 360–390 px, and drop it only below 360 px.
2. **AT-05: no PERSOANE result for "secretariat".** The query returns Contact, not people. Indexing the secretariat staff by role would make it pass literally.
3. **Legacy PDF links in guides and news.** Rewrite them to the migrated `/files/…` URLs at import time. That saves a redirect hop and keeps the content independent of the redirect table.
4. **"orar" search.** It still returns substring matches ("temp**orar**"). This is harmless, but a word-boundary match would keep AT-15 clean even in suggestions.
5. **Home CLS.** Confirm 0 with Lighthouse on the deployed preview, as part of AT-10.

### Score, round 2: **9.0 / 10**

Every round-1 must-fix is resolved and verified in the browser. Automated checks are clean: axe 0 in 72 runs, overflow 0 of 510 page-widths. The six tasks now take 1–3 taps with no dead ends. I am not scoring higher because of the mobile header showing only "Honterus" (D-18), the search acceptance test AT-05 still not returning people for "secretariat", and the production CLS/LCP figures that I could not measure myself.

---

# Appendix C — Critic 3 (language & facts): full verdict

# Critic 3: Language, terminology and factual discipline

Reviewer: trilingual editor-in-chief (RO/DE native, EN near-native; ZfA/PASCH and ministry publications)
Build reviewed: http://localhost:4321 (Astro dev server, seeded D1), 26 Nov 2026. I read about 90 rendered pages in RO, DE and EN, covering every route in `src/i18n/routes.ts`, all 8 guides, 5 articles, 404, search and filtered states.

## Score: 8.0 / 10

**Strengths.** This is the best-edited school website I have reviewed in this network.

- **German.** The German reads as if a cultivated native speaker wrote it for the reader, not as a translation. Examples: *„Das Vorbild machte an den sächsischen Gymnasien … Schule“*, *„gesetzt aus der EB Garamond“*, *„dahinter die Zinne“*, *„gilt als zurückgetreten“*, *„am Schwarzen Brett … aus“*, „Widerspruch“ and „Einsicht“ for *contestație/vizualizare*.
- **Romanian.** The Romanian uses correct MEN terminology (*profilul real, specializarea științe ale naturii; profilul umanist, specializarea filologie; consiliul de administrație; ROFUIP; repartizare computerizată*). I found no cedilla ş or ţ in any rendered page, seed JSON file or UI string. Quotes are „…” throughout.
- **English.** The English is British and institutional: *enrol, programme, headteacher, put questions to, Year 9*. I found no marketing words and no banned copy. The only exclamation marks are in code.
- **Facts.** Factual discipline is exemplary. Contested items are attributed: *„potrivit cronicii școlii“*, *„Nach einem Bericht der ADZ“*, and the 1541/1388/1544 founding discussion. The Coetus is never called a "first student parliament". The Wittenberg legend and the Honterus birth date are left out. The DSD guide handles DSD I correctly. Nothing anywhere links to a timetable or *Orar*.

**Why not 9 yet.**

- Test content and untranslated Romanian leak into the DE/EN homepage, banner and news.
- Two systemic rendering bugs: the step-list numbers are 0-based, and the "Updated" date is in US format.
- One unverified claim, "DSD I and II", sits in the audience router.
- The footer says "Founded by Honterus", which contradicts the site's own "reorganised in 1541" framing.
- The German names for the lyceum profiles are inconsistent: four different variants.
- Some links are contextless ("Öffnen / Open / Deschide") and some states are empty (Forms filter: 0 documents; Gallery: blank page).

None of these needs a rewrite. All are mechanical fixes.

---

## MUST FIX for ≥ 9/10 (in priority order)

### M1. Test data in production D1: Romanian text on DE/EN pages, three duplicate items, an implausible event
- **Where:** `/de/`, `/en/` (homepage banner and news), `/de/aktuelles`, `/en/news`, and every article's "Weitere Meldungen" / "More news" box.
- **Current text:**
  - Banner on DE and EN: `Joi: simulare Evaluarea Națională — intrarea prin Curtea Honterus.`
  - News, three times on 26 Nov 2026: `Probe-Nationalprüfung — geänderter Ablauf` / `Simulare Evaluarea Națională — program modificat` (twice), plus an item titled only `Probe`. All three have the RO excerpt `Joi, intrarea elevilor se face prin Curtea Honterus, între 8:00 și 8:30.`
  - Slugs: `simulare-evaluarea-nationala-program-modificat-4` and `-5`.
- **Fix:** Delete these banner and news rows from D1. They are admin test entries, not school facts: the national simulation is in March, per the guide itself. Violates hard rule 2.
- **Systemic fix:** wherever fallback RO text is shown in DE/EN, wrap it in `lang="ro"` and show the "not yet translated" note. Today only the article page does this; banners, news cards and the "More news" lists do not.
- **Files:** D1 `banners` / `news` tables; `src/components/Banner*.astro`; the news card in `src/views/Home.astro` / `NewsList.astro` (use `pick().fallback`).

### M2. Step navigation numbered from 0 while step bodies are numbered from 1 (all 8 guides, all languages)
- **Where:** e.g. `/de/aufnahme/dsd`, `/ro/admitere/clasa-pregatitoare`, `/en/admissions/preparatory-class`.
- **Current text:** the TOC reads `0 Vorbereitung im Deutschunterricht · 1 Probeprüfung …`, and the body reads `1 Vorbereitung …`, `2 Probeprüfung`.
- **Corrected:** the TOC should read `1 … 5`, matching the body.
- **File:** `src/views/Guide.astro:84`. Change `{s.sortOrder}` to `{i + 1}` (index from `steps.map((s, i) => …)`).

### M3. English "Updated" date in US format
- **Where:** every editorial page in EN, e.g. `/en/school`, `/en/accessibility`, `/en/privacy`.
- **Current text:** `Updated November 26, 2026`
- **Corrected:** `Updated 26 November 2026`
- **File:** `src/views/Editorial.astro:152`. It uses `new Intl.DateTimeFormat(locale, …)` with the bare `'en'`. Replace it with `formatDate(page.updatedAt, locale)` from `~/i18n/locales`, which maps to `en-GB`.

### M4. "DSD I and II" is stated as fact in the audience router (docs/02 §11.15 marks it [!])
- **Where:** home page, "Elevi / Schülerinnen und Schüler / Students" column, in all three languages.
- **Current text:** `DSD I și II` · `DSD I und II` · `DSD I and II`
- **Corrected:** `Diploma de limba germană (DSD II)` · `Deutsches Sprachdiplom (DSD II)` · `German Language Diploma (DSD II)`. This matches the guide, which correctly says the college publishes only DSD II.
- **Files:** `src/i18n/nav.ts:182`. Also the admin label `src/server/admin/entities.ts:109` (`'DSD I & II'` → `'DSD'`).

### M5. "Founded in 1541 by Johannes Honterus" contradicts the site's own framing
The hero says *„Tradiția școlii începe în 1388; Johannes Honterus a reorganizat-o în 1541“*. The history page says the school is older than 1541. Docs/02 §11.1 recommends "since 1541, school tradition since 1388".
- **Where:** header utility row and footer, on every page, in all three languages.
- **Current text:** `Fondat în 1541 de Johannes Honterus` · `Gegründet 1541 von Johannes Honterus` · `Founded in 1541 by Johannes Honterus`
- **Corrected:** `Din 1541 · tradiție școlară din 1388` · `Seit 1541 · Schultradition seit 1388` · `Since 1541 · a school tradition dating from 1388`. Alternatively `Reorganizată de Johannes Honterus în 1541` · `1541 von Johannes Honterus neu begründet` · `Re-founded by Johannes Honterus in 1541`.
- **File:** `src/i18n/ui.ts` key `founded`.
- **Same contradiction in the DE campus text:** `„und Honterus war zugleich Gründer der Schule und Pfarrer der Kirche“` → `„und Honterus war zugleich Erneuerer der Schule und Pfarrer der Kirche“`. Fix the RO and EN equivalents too (`pages.json` → `campus.body_md`).

### M6. German: four different names for the two lyceum profiles
- **Where and current text:**
  - Home and `/de/bildung/lyzealstufe` lead: `naturwissenschaftlichen Profil … philologischen Profil`
  - Tables (Lyzealstufe, 9. Klasse, Schule): `Realprofil` / `Geisteswissenschaftliches Profil` / `Geisteswiss. Profil`
  - Bakkalaureat table: `Naturwissenschaftliches Profil` / `Philologisches Profil`
  - News (`/de/aktuelles`, Schulwechsel 2026/27): `humanistischer Zweig, Philologie` / `naturwissenschaftlicher Zweig`
  - Bildungsangebot item: `zwei naturwissenschaftliche und zwei humanistische`
- **Problem:** "Philologie" is the *Fachrichtung* (specializare), not the *Profil*. Romanian-German usage (ADZ, Schulbehörden) is *Realprofil* and *humanistisches Profil*.
- **Corrected, used everywhere:** `Realprofil (Fachrichtung Naturwissenschaften)` and `humanistisches Profil (Fachrichtung Philologie)`. Short form: `Realprofil` / `humanistisches Profil`.
- **Files:**
  - `pages.json`: `home`, `school`, `liceu` and `education` (`lead`, `body_md`, `data_json`)
  - `guides.json`: `clasa-ix` (lead, body table, FAQ "Gibt es das Profil Mathematik-Informatik?") and `bacalaureat` (table header)
  - `news.json`: transfer 2026/27 and oferta-educationala-2026-2027 entries (DE excerpt and body)
  - `Home.astro` cycles text, if it is hard-coded there
- **EN equivalent:** keep "science track (natural sciences)" and "humanities track (philology)". It is already consistent.

### M7. Contextless link label "Öffnen / Open / Deschide" in guides (WCAG 2.4.4, and poor microcopy)
- **Where:** all guides. The step link reads `Öffnen` with no object, sometimes leads off-site, and has no "(öffnet eine externe Seite)" note.
- **Corrected:** label the destination. Either add a `linkLabel` per step in `guides.json` (e.g. `Zeitplan und Verfahren (PDF)`, `Website der ZfA`, `edu.ro – Kalender`), or fall back to the host plus the external hint: `auslandsschulwesen.de öffnen (externe Seite)` / `Deschide edu.ro (alt site)` / `Open edu.ro (external site)`.
- **Files:** `src/views/Guide.astro:162`; `src/i18n/ui.ts` `open`; `scripts/seed/content/guides.json` steps.

### M8. Broken and empty states
- **"Formulare und Anträge" / "Formulare și cereri" / "Forms and applications"** in the Parents column links to `/…/documente?cat=formulare`. That category does not exist in `documents.json`, which has: alte, examene, burse, admitere, buget, regulamente, posturi, rapoarte, strategie, oferta. The result is **"0 documente"** with no message.
  - Fix: point the link to an existing filter, or add a `formulare` category and recategorise the forms. 91 of 291 documents sit in "Alte documente", which is too large a catch-all anyway.
  - Add an empty state: `Niciun document în această categorie. Ștergeți filtrele sau căutați după titlu.` · `Keine Dokumente in dieser Auswahl. Filter zurücksetzen oder nach Titel suchen.` · `No documents match these filters. Clear the filters or search by title.`
  - Files: `src/i18n/nav.ts:170`, `src/views/Documents.astro`, `src/i18n/ui.ts`.
- **Gallery** (`/ro/galerie`, `/de/galerie`, `/en/gallery`) shows a heading and nothing else, and it is linked from the main menu.
  - Either hide the nav item while `listGalleries()` is empty, or render: `Galeria se completează în curând; între timp, vedeți Noutăți.` · `Die Galerie wird derzeit aufgebaut; bis dahin finden Sie Bilder unter Aktuelles.` · `The gallery is being prepared; in the meantime, see News.`
  - Files: `src/views/GalleryList.astro`, `src/i18n/nav.ts:138`.

### M9. Image credits are not localised
- **Where:** home, history and Honterus pages in RO and DE.
- **Current text:** `Unknown artist · Public domain`
- **Corrected:** RO `Autor necunoscut · domeniu public`; DE `Unbekannter Künstler · gemeinfrei`; EN `Unknown artist · public domain`.
- **Files:** `scripts/seed/content/media.json` (`credit` and `license` fields). Better: map license codes to localised labels in the Picture/figure caption component rather than storing English strings.

### M10. One term for the play-based German assessment (Vorbereitungsklasse)
- **Current text (DE):**
  - nav: `mit Deutsch-Einstufung`
  - documents: `Verfahren der Eingangsbewertung`
  - guide: `Überprüfung der Deutschkenntnisse (spielerisches Aufnahmegespräch)`
- **Corrected:** use `Überprüfung der Deutschkenntnisse („spielerisches Aufnahmegespräch“)` throughout. Nav subline: `mit Überprüfung der Deutschkenntnisse`. Document title: `Verfahren zur Überprüfung der Deutschkenntnisse – Vorbereitungsklasse 2026/27`.
- **Same for "Probeprüfung":** the DSD guide step 2 has `eine Pilotprüfung unter Prüfungsbedingungen` → `eine Probeprüfung unter Prüfungsbedingungen`. The news item `Probe-Nationalprüfung` should be `Probedurchgang der Nationalen Evaluierung` if it is ever reused.
- **Files:** `src/i18n/nav.ts:44`; `documents.json` (DE title of the procedure document); `guides.json` `dsd` step 2 `de` (line ~1474).

### M11. Wrong etymology of Honterus's name, in all three languages
- **Current text:** `„Honter“, adică soc` · `„Honter“ (Holunder)` · `“Honter”, meaning elder`
- **Corrected** (docs/02 §3: Transylvanian-Saxon *Hontert*): `„Hontert”, adică soc` · `„Hontert“ (Holunder)` · `“Hontert”, meaning elder`
- **Files:** `timeline.json` (1498 entry, ro/de/en, lines 44–46); `pages.json` → `honterus.body_md` (ro/de/en, lines 210–212).

### M12. Romanian academic titles on DE/EN staff page, and a leadership list that may be out of date
- **Where:** `/de/schule/kollegium`, `/en/school/staff`
- **Current text:** `prof. Radu Chivărean – Schulleiter`, `prof. înv. primar Tünde-Enikö Jozsa`
- **Problem:** in German, "Prof." means a university professor, which is misleading. Only the leadership rows carry a prefix, so the page is also inconsistent.
- **Corrected (DE/EN):** omit `title_prefix`: `Radu Chivărean – Schulleiter · Geographie`; keep the prefix only in RO.
- **Data age:** docs/01 says the leadership data is from 2022 ("verificați componența actuală"). Add a dated note under the lead: `Componența publicată de școală (2022); în curs de actualizare.` · `Stand: Angaben der Schule (2022), Aktualisierung folgt.` · `As published by the school (2022); update pending.`
- **Spelling to confirm with the school:** *Enikö* (German ö) or *Enikő* (Hungarian ő).
- **Files:** `scripts/seed/content/staff.json` (`title_prefix`); `src/views/Staff.astro` (render the prefix only when `locale === 'ro'`); `pages.json` → `staff.lead`.

### M13. Ambiguous abbreviation in the German menu
- **Current text:** `Grundschule · V – 4`. "V" reads as Roman 5, so "5 to 4".
- **Corrected:** `Grundschule · VK – 4`, matching the home page.
- **File:** `src/i18n/nav.ts:113`.

### M14. German audience-router heading is unidiomatic
- **Current text:** `Wofür suchen Sie?`
- **Corrected:** `Für wen suchen Sie Informationen?`. This mirrors RO *„Pentru cine căutați?“*, and the options that follow are people.
- **File:** `src/i18n/ui.ts` `audiencesTitle`.
- **Also:** `Künftige Schüler` → `Künftige Schülerinnen und Schüler`, consistent with `Schülerinnen und Schüler` in the next column (`ui.ts` `audiences.viitori`).

### M15. Exam guides carry the "Admissions" eyebrow, and the school-year format is not localised
- **Where:** `/…/evaluare-nationala`, `/bacalaureat`, `/dsd`, `/olimpiade` (and DE/EN equivalents).
- **Current text:** `Aufnahme · 2026–2027`, `Admissions · 2026–2027`, `Admitere · 2026–2027`
- **Corrected:** `Prüfungen · 2026/27` · `Examinations · 2026–27` · `Examene · 2026–2027`. Use the column title for exam kinds. German convention is `2026/27`, which is already used in the body text, news and document titles. Only the filters and eyebrows say `2026–2027`. The EN body uses `2026–27`.
- **Files:** `src/views/Guide.astro:56` (use `siblings.title` and a locale-aware `formatSchoolYear()`); `src/views/Documents.astro` year filter labels.

### M16. "Below" where the text means "above"
- **Current text:**
  - `Datele de mai jos din 2026 sunt orientative.`
  - `Die unten genannten Termine von 2026 dienen zur Orientierung.`
  - `The 2026 dates below are for guidance.`
- **Problem:** the note appears after the steps it refers to.
- **Corrected:**
  - `Datele din 2026 menționate mai sus sunt orientative.`
  - `Die oben genannten Termine von 2026 dienen zur Orientierung.`
  - `The 2026 dates given above are for guidance.`
- **File:** `guides.json` → `pregatitoare` note/body (lines ~17–19). Check the other guides for the same sentence.

---

## NICE TO HAVE

**German**

1. **Partner list as a sentence.** `/de/schule`: `Partner` is followed by a verbless noun list ending in a full stop. Prefer `Zu den Partnern des Kollegs gehören die Botschaft …` (`pages.json` → `school.body_md`). Same in RO and EN.
2. **"Etappe" is a calque.** Guide pregătitoare: `nach der ersten Etappe` / `für die nächste Etappe` → `nach der ersten Runde` / `für die nächste Runde`.
3. **"Unterrichtsbesuche".** News `Lehrereinstellung 2026: Unterrichtsbesuche und Deutschtest` → `Lehrproben und Deutschtest`; *inspecție specială la clasă* is a Lehrprobe.
4. **Inspectorate named two ways.** `Kreisschulinspektorat Kronstadt` (Bakk news) vs `Kreisschulinspektorat Brașov` (guides, 7×). Pick `Kreisschulinspektorat Brașov (IȘJ)`.
5. **Gradebook named two ways.** `das elektronische Klassenbuch` (Datenschutz) vs `Elektronisches Notenbuch` (nav). Unify on `elektronisches Notenbuch`.
6. **Quote marks in the privacy notice.** `Colegiul Național „Johannes Honterus” Brașov` uses the Romanian closing quote inside German text → `„Johannes Honterus“`. Same in EN: `the Colegiul Național „Johannes Honterus” Brașov` → `the “Johannes Honterus” National College, Brașov (Colegiul Național „Johannes Honterus” Brașov)`. Also `Curtea Honterus Nr. 3` → `nr. 3`, the official postal form used everywhere else. File: `pages.json` → `privacy.body_md`.
7. **Calqued school name.** `Gemischtes deutsches Lyzeum` (history intro) → `„Liceul mixt german“ (deutschsprachiges koedukatives Lyzeum)`, as the 1948 timeline entry already does.
8. **Margin note without attribution.** `/de/bildung/deutsch-dsd`: `DSD am Honterus · seit 1995` is unattributed (docs/02 §11.10: safe form "seit den 1990er-Jahren"). Write `seit 1995 (ADZ)` or `seit den 1990er-Jahren`. Same in RO and EN.
9. **Status label.** `stateOpen: 'Läuft'` is colloquial → `Läuft derzeit` or `Jetzt möglich`.
10. **Proper name.** `Honterus-Skipokal` → `Honterus Ski Pokal`; it is a proper name and the school writes it this way.
11. **Doubled heading.** `/de/kontakt`: the heading `Anschrift` appears twice in a row (block title and dt).

**Romanian**

12. **Official term for the preparatory class.** `Admiterea în clasa pregătitoare` / `Admitere în clasa pregătitoare` → `Înscrierea în clasa pregătitoare`. MEN calls it *înscriere în învățământul primar*; the school only adds an evaluation. Files: `guides.json` pregatitoare title, `pages.json` primar "Vezi și".
13. **Inconsistent form of address.** UI microcopy uses `Tastează cel puțin 2 litere`, `Citește`, `Caută` (2nd person singular), while body copy uses formal *dumneavoastră* (`Încercați căutarea`, `Citiți calendarul`). Use `Introduceți cel puțin 2 litere` and `Citiți mai departe`, or keep infinitive-style button labels consistently.
14. **History label differs in three places.** Nav `Istorie: 1541 – azi`; see-also `Istoric: 1388 → azi`; page H1 `Istoric`. Pick `Istoric: 1388 – azi`. Same in DE (`Geschichte: 1541 bis heute` vs `1388 bis heute`) and EN.
15. **Staff link label differs in four places.** `Conducere și personal` (nav), `Profesori și personal` (see-also), `Personal și catedre` (router), `Personal` (footer). Pick one: `Conducere și personal`.
16. **Olympiad stages.** `pe etape – pe școală, județeană, națională` omits the local stage and mixes constructions → `pe etape: etapa pe școală, locală, județeană și națională`. EN `school, county and national` → `school, local, county and national`.
17. **KMK named imprecisely.** `Conferinței Miniștrilor Culturii din Germania` → `Conferinței permanente a miniștrilor educației și culturii din landurile germane (KMK)` (timeline 1995, RO).
18. **Era label mixes formats.** History chip `Epoca lui Honterus 1498–23.01.1549` → `1498–1549`. Same in DE and EN (`timeline.json` era labels).
19. **Unsourced admission rule.** FAQ `Admiterea se face în ordinea rezultatelor evaluării` is not in docs/01. Mark it for the school to confirm, or soften to `după criteriile din procedura colegiului`.

**English**

20. **Preparatory class named two ways.** `Preparatory class` (nav, router, documents) vs `preparatory year` (guide title, body, cycles). Pick `preparatory class` everywhere; the slug is already `preparatory-class`.
21. **Grants named three ways.** `Grants` (router), `Grants and bursaries` (filter), `Student grants` (news). Use `Scholarships and grants`; *burse* covers both merit and social awards.
22. **Calques.** `board of administration` → `the college board (consiliul de administrație)`; `differential exams` → `bridging (differential) exams`.
23. **`per the national calendar` / `per the ministry’s calendar`** → `in line with the national calendar`.
24. **Typography.** `200 %` → `200%`; `4.5 : 1` → `4.5:1` (accessibility statement). `Years 5 – 8` vs `Years 5–8`: unify on a closed en dash.
25. **Repetition.** `Johannes Honterus, born Austen, is born in Brașov` → `Johannes Honterus (originally Austen) is born in Brașov` (`timeline.json` 1498 `en`).
26. **Button text.** `readMore: 'Read'` → `Read more`.
27. **Pupils and students.** Projects copy says "pupils" while the rest of the site says "students". Choose one register; for an upper-secondary-led school, "students" is fine.

**All languages: specificity**

28. **Thin project blurbs.** Some descriptions say nothing:
    - `SmartLab – A 2025 project, announced in press releases.`
    - `Willkommen in Europa – An international project, described in Romanian and German, with an open selection of pupils.`
    - `REMEDY – … concluded with a joint conference.`

    Either add one concrete fact from the source PDFs (partners, theme, year groups) or drop the card until the school supplies it (`projects.json`).
29. **Slugs.** News slugs in DE/EN are Romanian (`/de/aktuelles/burse-2026-2027-…`). This is acceptable, but localised slugs would match the otherwise fully localised URL scheme.
30. **Search empty state.** Search with no hits shows only `0 Treffer`. Use the existing `searchNoResults` string with a hint: `Keine Treffer für „xyz“. Versuchen Sie einen kürzeren Begriff oder sehen Sie unter Dokumente nach.`

---

## Round 2 (re-read after reseed, same page set in RO/DE/EN plus filtered and empty states)

### Score: 9.0 / 10

All 16 Round 1 must-fix items are fixed in the rendered site. Automated sweeps over about 100 pages found:
- no cedilla ş or ţ;
- no wrong quotation marks in any language;
- no exclamation marks, no banned copy, and no timetable/Orar reference;
- no Romanian text showing on DE or EN pages.

None of the remaining defects is a factual error, a rule breach or a blocker. A 9 is deserved, but the copy is not yet flawless.

### Verification of Round 1 must-fix items

| # | Item | Status | Evidence |
|---|---|---|---|
| M1 | Test rows and RO leaking into DE/EN | Fixed | The banner and "Simulare … program modificat" / "Probe" items are gone. The news list now opens with the Erasmus+ item of 22 Oct 2026. The only "Simulare" items left are the legitimate March 2026 announcement and the guide steps. |
| M2 | Guide steps numbered from 0 | Fixed | The step list reads `1 Vorbereitung …`, `2 Probeprüfung` and `1 Ziua porților deschise`, matching the step bodies. |
| M3 | EN date in US format | Fixed | `Editorial.astro` now uses `formatDate()`. The "Updated" note is hidden for seeded pages and shown only after an admin edit. |
| M4 | DSD I claim | Fixed | The router now says `Deutsches Sprachdiplom (DSD)` / `German Language Diploma (DSD)` / `Diploma DSD`. DSD I appears only in the FAQ, which correctly says to ask the school. |
| M5 | "Founded by Honterus" | Fixed | Footer: `Școală atestată din 1388 · reorganizată de Johannes Honterus în 1541` / `Schule seit 1388 · 1541 von Johannes Honterus neu geordnet` / `A school since 1388 · reorganised by Johannes Honterus in 1541`. The 1541 timeline label now reads "Die neue Schule des Honterus". |
| M6 | DE profile names | Fixed | Only `Realprofil (Fachrichtung Naturwissenschaften)` and `humanistisches Profil (Fachrichtung Philologie)` remain, correctly declined. |
| M7 | Bare "Öffnen" | Fixed | Links now read `Öffnen: edu.ro` / `Open: edu.ro` / `Deschide: …`, with a visually hidden external-site note. |
| M8 | Dead links and empty states | Fixed | The Parents link goes to `Regulamente școlare` (10 documents). The Gallery is out of the menu, and `/de/galerie` shows an empty-state sentence with links. |
| M9 | Credits | Fixed | `Autor necunoscut · domeniu public` / `Unbekannter Künstler · gemeinfrei` / `Unknown artist · public domain`. |
| M10 | One DE term | Fixed | 47× `Überprüfung der Deutschkenntnisse` and 6× `spielerisches Aufnahmegespräch`. "Einstufung", "Eingangsbewertung" and "Pilotprüfung" no longer appear. |
| M11 | Hontert | Fixed | Correct in all three languages, with the right quotation marks for each. |
| M12 | Staff prefixes and data age | Fixed | DE/EN show no "prof."; RO keeps the prefix. A dated note appears in all three languages ("Stand der Schulleitung: Angaben der Schule von 2022, Aktualisierung folgt."). |
| M13 | VK – 4 | Fixed | |
| M14 | Router heading (DE) | Fixed | `Für wen suchen Sie Informationen?`, `Künftige Schülerinnen und Schüler`. |
| M15 | Eyebrow and year format | Fixed | `Prüfungen · 2026/27`, `Aufnahme · 2027/28`, `Examinations · 2026–27`, `Examene · 2026–2027`. The DE document filter shows `2026/27` and the EN filter shows `2026–27`. |
| M16 | below → above | Fixed | `Datele din 2026 indicate la fiecare pas …` / `Die bei den einzelnen Schritten genannten Termine …` / `The 2026 dates given in the steps …`. |

Round 1 nice-to-haves also fixed:
- Romanian microcopy is formal throughout (`Introduceți`, `Căutați`, `Închideți`, `Redați`).
- The history label is unified (`Istoric: 1388 – azi` / `Geschichte: 1388 bis heute` / `History: 1388 to today`).
- The staff label is unified (`Conducere și personal`).
- The quotation marks in the privacy notice are fixed in DE and EN.
- EN uses "Scholarships and grants".

### Remaining must-fix

None.

### Remaining nice to have (new or residual)

1. **EN router heading.** `Who are you looking for information for?` has a doubled preposition and is clumsy. Use `Information for…` or `Who is this for?` (`src/i18n/ui.ts` `audiencesTitle.en`).
2. **EN cycle label.** `Preparatory year – Year 4` (home and education cards) is the last place still saying "preparatory year"; the rest of the site now says "preparatory class". Change it to `Preparatory class – Year 4` (`ui.ts` `grades.primar.en`).
3. **EN document filter.** The filter chip `Grants and bursaries` should be `Scholarships and grants`, like the router and news (`src/views/Documents.astro` / category labels).
4. **EN short month.** en-GB ICU renders `22Sept 2026` and `15Sept 2026` next to `16Oct 2026`. Use a fixed three-letter month map (Sep), or keep it as it is; it is technically correct.
5. **EN card links.** `About the lower secondary` / `About the upper secondary` → `About lower secondary` / `About upper secondary`, or `Lower secondary in detail` (`Home.astro`).
6. **Link label names the host, not the document.** A step whose link is a PDF form reads `Öffnen: liceulhonterusbrasov.ro`. Where the target is a document, a per-step `link_label` (e.g. `Antrag (PDF)`) would be clearer. This is also optional for `edu.ro` links (`guides.json` steps, `Guide.astro:181`).
7. **EN Erasmus+ excerpt.** `The call for student applications, staff mobilities … and student learning mobilities are published.` is a list with a weak verb. Prefer `Published: the call for student applications, staff mobilities (job shadowing and courses) and student learning mobilities.` (`news.json` erasmus excerpt `en`).
8. **Still open from Round 1** (cosmetic): DE `bekanntgegeben` → `bekannt gegeben`; DE `Lehrproben` for *inspecții la clasă*; the thin project blurbs (SmartLab, Willkommen in Europa); the "Alte documente" category is still large.
