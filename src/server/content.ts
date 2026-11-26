/**
 * Read-side queries for public pages. Every function returns only PUBLISHED content.
 * Pages batch their queries so a cache miss costs one D1 round trip where possible.
 */
import { and, asc, desc, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm';
import { db, schema as s } from './db';
import type { GuideKind } from '~/i18n/routes';

export type Announcement = typeof s.announcements.$inferSelect;
export type Media = typeof s.mediaAssets.$inferSelect;
export type Doc = typeof s.documents.$inferSelect;
export type Guide = typeof s.guides.$inferSelect;
export type GuideStep = typeof s.guideSteps.$inferSelect;
export type Staff = typeof s.staff.$inferSelect;
export type Department = typeof s.departments.$inferSelect;
export type Project = typeof s.projects.$inferSelect;
export type Life = typeof s.studentLife.$inferSelect;
export type Page = typeof s.pages.$inferSelect;
export type TimelineEvent = typeof s.timelineEvents.$inferSelect;
export type Gallery = typeof s.galleries.$inferSelect;

const PUB = 'published' as const;

// ───────────── settings ─────────────
export interface SiteSettings {
  contact: {
    street: string;
    postalCode: string;
    city: string;
    phones: string[];
    fax?: string;
    email: string;
    admissionsEmail?: string;
    hours?: { ro: string; de?: string; en?: string };
    mapUrl: string;
    lat: number;
    lng: number;
  };
  links: { noteInCatalog: string; classroom: string; youtube?: string; facebook?: string; instagram?: string };
  hero: { mediaId?: string };
  facts?: { label: { ro: string; de?: string; en?: string }; value: string }[];
}

const DEFAULT_SETTINGS: SiteSettings = {
  contact: {
    street: 'Curtea Honterus nr. 3',
    postalCode: '500025',
    city: 'Brașov',
    phones: ['0268 470 802', '0368 449 087'],
    fax: '0268 470 802',
    email: 'liceulhonterus@yahoo.com',
    mapUrl: 'https://www.openstreetmap.org/?mlat=45.6410&mlon=25.5880#map=18/45.6410/25.5880',
    lat: 45.641,
    lng: 25.588,
  },
  links: { noteInCatalog: 'https://app.noteincatalog.ro/login', classroom: 'https://classroom.google.com' },
  hero: {},
};

/** Objects merge over the defaults; arrays and scalars replace them. */
const mergeSetting = (base: unknown, v: unknown) =>
  v && typeof v === 'object' && !Array.isArray(v) && base && typeof base === 'object' && !Array.isArray(base) ? { ...base, ...v } : v;

export async function getSettings(): Promise<SiteSettings> {
  const rows = await db().select().from(s.settings);
  const out = structuredClone(DEFAULT_SETTINGS) as unknown as Record<string, unknown>;
  for (const r of rows) {
    try {
      out[r.key] = mergeSetting(out[r.key], JSON.parse(r.valueJson));
    } catch {
      /* ignore malformed setting — admin validates on save */
    }
  }
  return out as unknown as SiteSettings;
}

// ───────────── layout data (banner + settings) in one batch ─────────────
export async function getLayoutData(now = Date.now()) {
  const d = db();
  const [settingsRows, banners] = await d.batch([
    d.select().from(s.settings),
    d
      .select()
      .from(s.announcements)
      .where(and(eq(s.announcements.status, PUB), eq(s.announcements.pinnedBanner, true), or(isNull(s.announcements.bannerUntil), gt(s.announcements.bannerUntil, now))))
      .orderBy(desc(s.announcements.publishedAt))
      .limit(2),
  ]);
  const settings = structuredClone(DEFAULT_SETTINGS) as unknown as Record<string, unknown>;
  for (const r of settingsRows) {
    try {
      settings[r.key] = mergeSetting(settings[r.key], JSON.parse(r.valueJson));
    } catch {
      /* noop */
    }
  }
  return { settings: settings as unknown as SiteSettings, banners };
}

// ───────────── media ─────────────
export async function getMediaMap(ids: (string | null | undefined)[]): Promise<Map<string, Media>> {
  const clean = [...new Set(ids.filter((x): x is string => !!x))];
  if (!clean.length) return new Map();
  const rows = await db().select().from(s.mediaAssets).where(inArray(s.mediaAssets.id, clean));
  return new Map(rows.map((r) => [r.id, r]));
}

export async function getMedia(id: string | null | undefined) {
  if (!id) return undefined;
  return (await getMediaMap([id])).get(id);
}

// ───────────── pages ─────────────
export async function getPage(key: string) {
  const [row] = await db()
    .select()
    .from(s.pages)
    .where(and(eq(s.pages.key, key), eq(s.pages.status, PUB)))
    .limit(1);
  return row;
}

export async function getPages(keys: string[]) {
  const rows = await db()
    .select()
    .from(s.pages)
    .where(and(inArray(s.pages.key, keys), eq(s.pages.status, PUB)));
  return new Map(rows.map((r) => [r.key, r]));
}

// ───────────── announcements ─────────────
export async function listNews(opts: { limit?: number; offset?: number; type?: Announcement['type'] } = {}) {
  const where = and(eq(s.announcements.status, PUB), opts.type ? eq(s.announcements.type, opts.type) : undefined);
  const d = db();
  const [rows, [count]] = await d.batch([
    d
      .select()
      .from(s.announcements)
      .where(where)
      .orderBy(desc(s.announcements.pinnedTop), desc(s.announcements.publishedAt))
      .limit(opts.limit ?? 12)
      .offset(opts.offset ?? 0),
    d.select({ n: sql<number>`count(*)` }).from(s.announcements).where(where),
  ]);
  return { rows, total: count?.n ?? 0 };
}

export async function getArticle(slug: string) {
  const [row] = await db()
    .select()
    .from(s.announcements)
    .where(and(eq(s.announcements.slug, slug), eq(s.announcements.status, PUB)))
    .limit(1);
  return row;
}

// ───────────── documents ─────────────
export async function listDocuments() {
  return db()
    .select()
    .from(s.documents)
    .where(and(eq(s.documents.status, PUB), or(isNull(s.documents.validUntil), gt(s.documents.validUntil, Date.now()))))
    .orderBy(asc(s.documents.category), desc(s.documents.academicYear), asc(s.documents.sortOrder), desc(s.documents.issuedAt));
}

export async function getDocumentsByIds(ids: number[]) {
  if (!ids.length) return [];
  return db()
    .select()
    .from(s.documents)
    .where(and(inArray(s.documents.id, ids), eq(s.documents.status, PUB)));
}

export async function listDocumentsByCategory(categories: Doc['category'][], limit = 8) {
  return db()
    .select()
    .from(s.documents)
    .where(and(eq(s.documents.status, PUB), inArray(s.documents.category, categories)))
    .orderBy(desc(s.documents.academicYear), asc(s.documents.sortOrder), desc(s.documents.publishedAt))
    .limit(limit);
}

// ───────────── guides ─────────────
export async function listGuides() {
  return db().select().from(s.guides).where(eq(s.guides.status, PUB)).orderBy(asc(s.guides.sortOrder));
}

export async function getGuide(kind: GuideKind) {
  const d = db();
  const [g] = await d
    .select()
    .from(s.guides)
    .where(and(eq(s.guides.kind, kind), eq(s.guides.status, PUB)))
    .orderBy(desc(s.guides.academicYear))
    .limit(1);
  if (!g) return undefined;
  const steps = await d.select().from(s.guideSteps).where(eq(s.guideSteps.guideId, g.id)).orderBy(asc(s.guideSteps.sortOrder));
  const docIds = steps.map((x) => x.documentId).filter((x): x is number => x != null);
  const docs = await getDocumentsByIds(docIds);
  return { guide: g, steps, docs: new Map(docs.map((x) => [x.id, x])) };
}

// ───────────── people ─────────────
export async function listStaff() {
  const d = db();
  const [people, depts] = await d.batch([
    d.select().from(s.staff).where(eq(s.staff.status, 'active')).orderBy(asc(s.staff.sortOrder), asc(s.staff.sortName)),
    d.select().from(s.departments).orderBy(asc(s.departments.sortOrder)),
  ]);
  return { people, depts };
}

// ───────────── projects / student life ─────────────
export async function listProjects() {
  return db().select().from(s.projects).where(eq(s.projects.status, PUB)).orderBy(asc(s.projects.sortOrder), desc(s.projects.publishedAt));
}
export async function getProject(slug: string) {
  const [row] = await db()
    .select()
    .from(s.projects)
    .where(and(eq(s.projects.slug, slug), eq(s.projects.status, PUB)))
    .limit(1);
  return row;
}
export async function listLife() {
  return db().select().from(s.studentLife).where(eq(s.studentLife.status, PUB)).orderBy(asc(s.studentLife.sortOrder));
}
export async function getLife(slug: string) {
  const [row] = await db()
    .select()
    .from(s.studentLife)
    .where(and(eq(s.studentLife.slug, slug), eq(s.studentLife.status, PUB)))
    .limit(1);
  return row;
}

// ───────────── heritage timeline ─────────────
export async function listTimeline() {
  return db().select().from(s.timelineEvents).where(eq(s.timelineEvents.status, PUB)).orderBy(asc(s.timelineEvents.year), asc(s.timelineEvents.id));
}

// ───────────── galleries ─────────────
export async function listGalleries() {
  return db().select().from(s.galleries).where(eq(s.galleries.status, PUB)).orderBy(asc(s.galleries.sortOrder), desc(s.galleries.eventDate));
}
export async function getGallery(slug: string) {
  const d = db();
  const [g] = await d
    .select()
    .from(s.galleries)
    .where(and(eq(s.galleries.slug, slug), eq(s.galleries.status, PUB)))
    .limit(1);
  if (!g) return undefined;
  const items = await d
    .select({ media: s.mediaAssets, sortOrder: s.galleryItems.sortOrder })
    .from(s.galleryItems)
    .innerJoin(s.mediaAssets, eq(s.galleryItems.mediaId, s.mediaAssets.id))
    .where(eq(s.galleryItems.galleryId, g.id))
    .orderBy(asc(s.galleryItems.sortOrder));
  return { gallery: g, items: items.map((i) => i.media) };
}
