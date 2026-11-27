/**
 * Localized route table — one source of truth for URLs in all three languages.
 * The language switcher, hreflang alternates, sitemap and nav are all derived from it,
 * so switching language always lands on the equivalent page (docs/03 AT-03).
 *
 * NB: there is intentionally no timetable ("orar") route.
 */
import { LOCALES, type Locale } from './locales';

type Paths = Record<Locale, string>;
const r = (ro: string, de: string, en: string): Paths => ({ ro, de, en });

export const ROUTES = {
  home: r('', '', ''),
  admissions: r('admitere', 'aufnahme', 'admissions'),
  guide: r('admitere/:slug', 'aufnahme/:slug', 'admissions/:slug'),
  school: r('scoala', 'schule', 'school'),
  history: r('scoala/istorie', 'schule/geschichte', 'school/history'),
  honterus: r('scoala/johannes-honterus', 'schule/johannes-honterus', 'school/johannes-honterus'),
  campus: r('scoala/curtea-honterus', 'schule/honterushof', 'school/honterus-courtyard'),
  staff: r('scoala/personal', 'schule/kollegium', 'school/staff'),
  education: r('educatie', 'bildung', 'education'),
  primar: r('educatie/primar', 'bildung/grundschule', 'education/primary'),
  gimnaziu: r('educatie/gimnaziu', 'bildung/gymnasialstufe', 'education/lower-secondary'),
  liceu: r('educatie/liceu', 'bildung/lyzealstufe', 'education/upper-secondary'),
  german: r('educatie/germana-dsd', 'bildung/deutsch-dsd', 'education/german-dsd'),
  projects: r('educatie/proiecte', 'bildung/projekte', 'education/projects'),
  project: r('educatie/proiecte/:slug', 'bildung/projekte/:slug', 'education/projects/:slug'),
  life: r('viata-scolara', 'schulleben', 'school-life'),
  coetus: r('viata-scolara/coetus', 'schulleben/coetus', 'school-life/coetus'),
  lifeEntry: r('viata-scolara/:slug', 'schulleben/:slug', 'school-life/:slug'),
  news: r('noutati', 'aktuelles', 'news'),
  article: r('noutati/:slug', 'aktuelles/:slug', 'news/:slug'),
  gallery: r('galerie', 'galerie', 'gallery'),
  galleryItem: r('galerie/:slug', 'galerie/:slug', 'gallery/:slug'),
  documents: r('documente', 'dokumente', 'documents'),
  contact: r('contact', 'kontakt', 'contact'),
  search: r('cautare', 'suche', 'search'),
  privacy: r('confidentialitate', 'datenschutz', 'privacy'),
  accessibility: r('accesibilitate', 'barrierefreiheit', 'accessibility'),
} as const satisfies Record<string, Paths>;

export type RouteId = keyof typeof ROUTES;
export type RouteParams = Record<string, string>;

/**
 * Admission/exam guides have fixed kinds, so their slugs are localized here.
 * DB rows store `kind`; the RO slug is the canonical one.
 */
export const GUIDE_SLUGS = {
  pregatitoare: r('clasa-pregatitoare', 'vorbereitungsklasse', 'preparatory-class'),
  'clasa-v': r('clasa-a-v-a', 'klasse-5', 'year-5'),
  'clasa-ix': r('clasa-a-ix-a', 'klasse-9', 'year-9'),
  transfer: r('transferuri', 'schulwechsel', 'transfers'),
  'evaluare-nationala': r('evaluare-nationala', 'nationale-evaluierung', 'national-assessment'),
  bacalaureat: r('bacalaureat', 'bakkalaureat', 'baccalaureate'),
  dsd: r('dsd', 'dsd', 'dsd'),
  olimpiade: r('olimpiade', 'olympiaden', 'olympiads'),
} as const satisfies Record<string, Paths>;
export type GuideKind = keyof typeof GUIDE_SLUGS;

export function guideKindFromSlug(slug: string, locale: Locale): GuideKind | undefined {
  return (Object.keys(GUIDE_SLUGS) as GuideKind[]).find((k) => GUIDE_SLUGS[k][locale] === slug);
}

/** Build a URL for a route in a locale. Params replace `:name` segments. Always ends with "/" for sections. */
export function url(id: RouteId, locale: Locale, params: RouteParams = {}, query?: Record<string, string>): string {
  let p: string = ROUTES[id][locale];
  if (id === 'guide' && params.kind) {
    p = p.replace(':slug', GUIDE_SLUGS[params.kind as GuideKind]?.[locale] ?? params.kind);
  }
  p = p.replace(/:(\w+)/g, (_, k: string) => encodeURIComponent(params[k] ?? ''));
  const path = `/${locale}/${p}`.replace(/\/+$/, '') || `/${locale}`;
  const out = path === `/${locale}` ? `/${locale}/` : path;
  if (query) {
    const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v != null));
    const s = qs.toString();
    return s ? `${out}?${s}` : out;
  }
  return out;
}

export interface Match {
  id: RouteId;
  params: RouteParams;
}

// Pre-compile patterns; static routes win over parameterised ones.
const compiled = (Object.keys(ROUTES) as RouteId[]).flatMap((id) =>
  LOCALES.map((locale) => {
    const pattern = ROUTES[id][locale];
    const keys: string[] = [];
    const re = new RegExp(
      '^' +
        pattern
          .split('/')
          .filter(Boolean)
          .map((seg) => (seg.startsWith(':') ? (keys.push(seg.slice(1)), '([a-z0-9-]+)') : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
          .join('/') +
        '$',
    );
    return { id, locale, re, keys, dynamic: keys.length > 0 };
  }),
);
compiled.sort((a, b) => Number(a.dynamic) - Number(b.dynamic));

/** Resolve "/ro/scoala/istorie" → { id: 'history', params: {} } for a locale. */
export function match(locale: Locale, path: string): Match | undefined {
  const clean = path.replace(/^\/+|\/+$/g, '');
  for (const c of compiled) {
    if (c.locale !== locale) continue;
    const m = c.re.exec(clean);
    if (!m) continue;
    const params: RouteParams = {};
    c.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1] ?? '')));
    if (c.id === 'guide') {
      const kind = guideKindFromSlug(params.slug ?? '', locale);
      if (!kind) continue;
      params.kind = kind;
    }
    return { id: c.id, params };
  }
  return undefined;
}

/** Equivalent URLs of a matched route in every locale (for hreflang + language switcher). */
export function alternates(m: Match): Record<Locale, string> {
  return Object.fromEntries(LOCALES.map((l) => [l, url(m.id, l, m.params)])) as Record<Locale, string>;
}
