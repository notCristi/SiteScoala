import { and, desc, eq } from 'drizzle-orm';
import { db, schema as s } from './db';
import { formatSchoolYear, pick, type Locale } from '~/i18n/locales';
import { url, type RouteId } from '~/i18n/routes';
import { NAV } from '~/i18n/nav';
import { ui } from '~/i18n/ui';
import { CATEGORY_LABELS, docUrl } from '~/lib/documents';
import type { SearchRecord } from '~/lib/search-core';

/** What people type when they mean a page, in every language (a German parent may type "secretariat"). */
const KEYWORDS: Partial<Record<RouteId, string>> = {
  contact: 'secretariat secretariatul sekretariat school office secretary telefon telephone phone fax adresa adresă anschrift address program sprechzeiten office hours e-mail email harta karte map',
  documents: 'regulament ordnung regulations rof roi formular formulare antrag forms',
  admissions: 'inscriere înscriere anmeldung enrolment enrollment',
  staff: 'profesori profesor personal lehrer lehrkraft lehrerinnen kollegium teachers teacher staff conducere director directoare schulleitung headteacher secretar',
  education: 'educatie educație bildung education oferta educationala profil real umanist',
  life: 'viata scolara viața școlară schulleben school life',
  news: 'noutati noutăți anunturi anunțuri aktuelles news',
  history: 'istoric istorie geschichte history',
};

/**
 * Official Romanian names of exams and entry points, indexed in every language: parents in Brașov say
 * „bacalaureat” or „evaluare națională” whatever the interface language (and vice versa).
 */
const GUIDE_KEYWORDS: Record<string, string> = {
  pregatitoare: 'clasa pregatitoare pregătitoare clasa 0 vorbereitungsklasse preparatory class reception înscriere inscriere anmeldung admitere',
  'clasa-v': 'clasa a v-a clasa 5 klasse 5 year 5 gimnaziu gymnasialstufe admitere aufnahme',
  'clasa-ix': 'clasa a ix-a clasa 9 klasse 9 year 9 liceu lyzeum admitere aufnahme admissions repartizare',
  transfer: 'transfer transferuri mutare schulwechsel transfers',
  'evaluare-nationala': 'evaluare nationala evaluarea națională en viii nationale evaluierung national assessment examen',
  bacalaureat: 'bacalaureat bac examenul de bacalaureat bakkalaureat abitur baccalaureate examen prüfung',
  dsd: 'dsd dsd i dsd ii deutsches sprachdiplom diploma de limba germana germană sprachdiplom kmk german language diploma',
  olimpiade: 'olimpiade olimpiada concursuri olympiaden wettbewerbe olympiads competitions',
};
const SECRETARIAT = /secretar|sekretari|office|administrat/i;

/** Static sections (from the nav) + all published content, for one locale. */
export async function buildSearchIndex(locale: Locale): Promise<SearchRecord[]> {
  const d = db();
  const P = 'published' as const;
  const [pages, guides, docs, people, depts, news, projects, life] = await d.batch([
    d.select().from(s.pages).where(eq(s.pages.status, P)),
    d.select().from(s.guides).where(eq(s.guides.status, P)),
    d.select().from(s.documents).where(eq(s.documents.status, P)),
    d.select().from(s.staff).where(eq(s.staff.status, 'active')),
    d.select().from(s.departments),
    d.select().from(s.announcements).where(eq(s.announcements.status, P)).orderBy(desc(s.announcements.publishedAt)).limit(200),
    d.select().from(s.projects).where(eq(s.projects.status, P)),
    d.select().from(s.studentLife).where(and(eq(s.studentLife.status, P))),
  ]);
  const out: SearchRecord[] = [];
  const seen = new Set<string>();
  /** The record's title in the other languages too, so a Romanian term finds the German page (and vice versa). */
  const titles3 = (row: Parameters<typeof pick>[0]) =>
    [...new Set((['ro', 'de', 'en'] as const).map((l) => pick(row, 'title', l).value).filter(Boolean))].join(' ');
  const push = (r: SearchRecord) => {
    if (seen.has(r.u + r.t)) return;
    seen.add(r.u + r.t);
    out.push(r);
  };
  const SEARCH_URL = url('search', locale);

  // Sections from the navigation (always present even before content is edited)
  const all3 = (o: Record<Locale, string>) => [o.ro, o.de, o.en].join(' ');
  for (const item of NAV) {
    push({ k: 'page', t: item.label[locale], u: url(item.route, locale), w: all3(item.label) });
    for (const col of item.columns ?? []) {
      for (const ln of col.links) {
        const kind = ln.route === 'guide' ? ln.params?.kind : undefined;
        push({
          k: ln.route === 'guide' ? 'guide' : 'page',
          t: ln.label[locale],
          s: item.label[locale],
          u: url(ln.route, locale, ln.params),
          w: [all3(ln.label), kind ? GUIDE_KEYWORDS[kind] : ''].filter(Boolean).join(' '),
        });
      }
    }
  }
  push({ k: 'page', t: ui(locale, 'documents'), u: url('documents', locale) });

  // Editable pages, bound to routes by key
  for (const p of pages) {
    const route = p.key as RouteId;
    if (route === 'search') continue; // the search page is never a result of itself
    let u: string;
    try {
      u = url(route, locale);
    } catch {
      continue;
    }
    push({ k: 'page', t: pick(p, 'title', locale).value, s: pick(p, 'lead', locale).value.slice(0, 120), u, w: titles3(p) });
  }
  for (const g of guides) {
    push({
      k: 'guide',
      t: pick(g, 'title', locale).value,
      s: g.academicYear ?? undefined,
      u: url('guide', locale, { kind: g.kind }),
      w: [titles3(g), GUIDE_KEYWORDS[g.kind] ?? ''].join(' '),
    });
  }
  for (const doc of docs) {
    const href = docUrl(doc);
    if (!href) continue;
    push({
      k: 'document',
      t: pick(doc, 'title', locale).value,
      s: [CATEGORY_LABELS[doc.category]?.[locale], formatSchoolYear(doc.academicYear, locale), doc.fileExt?.toUpperCase()].filter(Boolean).join(' · '),
      u: href,
      x: 1,
    });
  }
  const deptName = new Map(depts.map((x) => [x.id, pick(x, 'name', locale).value]));
  for (const p of people) {
    const subject = pick(p, 'subject', locale).value;
    const role = pick(p, 'role', locale).value;
    push({
      k: 'person',
      t: p.fullName,
      s: [role, subject, p.departmentId ? deptName.get(p.departmentId) : ''].filter(Boolean).join(' · '),
      u: `${url('staff', locale)}#p${p.id}`,
      // roles in all three languages, so "secretariat" / "Sekretariat" / "office" find the office staff
      w: [pick(p, 'role', 'ro').value, pick(p, 'role', 'de').value, pick(p, 'role', 'en').value, SECRETARIAT.test(`${role} ${pick(p, 'role', 'ro').value}`) ? 'secretariat sekretariat school office' : '']
        .filter(Boolean)
        .join(' '),
    });
  }
  for (const n of news) {
    push({ k: 'news', t: pick(n, 'title', locale).value, s: pick(n, 'summary', locale).value.slice(0, 100), u: url('article', locale, { slug: n.slug }) });
  }
  for (const p of projects) push({ k: 'page', t: pick(p, 'title', locale).value, s: p.period ?? undefined, u: url('project', locale, { slug: p.slug }) });
  for (const l of life) {
    push({ k: 'page', t: pick(l, 'title', locale).value, u: l.kind === 'coetus' ? url('coetus', locale) : url('lifeEntry', locale, { slug: l.slug }) });
  }
  // the search page is never a result of itself
  for (let i = out.length - 1; i >= 0; i--) if (out[i]!.u === SEARCH_URL) out.splice(i, 1);
  // attach keywords to the canonical record of each keyed route
  for (const [route, words] of Object.entries(KEYWORDS) as [RouteId, string][]) {
    const u = url(route, locale);
    for (const r of out) if (r.u === u && r.k === 'page') r.w = [r.w, words].filter(Boolean).join(' ');
  }
  return out;
}
