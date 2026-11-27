/** Helpers shared by admin views (chips, labels, picker data). */
import { eq, inArray, like as sqlLike, or } from 'drizzle-orm';
import { db, schema as s } from '../db';
import { SUFFIX, type Locale } from '~/i18n/locales';
import { ROUTES, url, type RouteId } from '~/i18n/routes';
import type { EntityDef, FieldDef } from './entities';
import type { T } from './i18n';
import type { Row } from './crud';

export type TrState = 'missing' | 'draft' | 'done' | 'outdated' | 'filled';

/** Translation state of a row in a language (DB state where it exists, otherwise "filled"/"missing"). */
export function trState(def: EntityDef, row: Row | undefined, l: Locale): TrState {
  const titleKey = def.titleLocalized ? `${def.titleField}${SUFFIX[l]}` : def.titleField;
  const has = !!(row && typeof row[titleKey] === 'string' && (row[titleKey] as string).trim());
  if (l === 'ro') return has ? 'filled' : 'missing';
  if (def.hasTranslationState && row) {
    const st = (row[`${l}State`] as string) ?? 'missing';
    if (st === 'done' && row[`${l}Rev`] != null && Number(row[`${l}Rev`]) < Number(row.rev ?? 1)) return 'outdated';
    if (st === 'missing' && has) return 'draft';
    return st as TrState;
  }
  return has ? 'filled' : 'missing';
}
export const trGlyph = (st: TrState) => (st === 'done' || st === 'filled' ? '●' : st === 'missing' ? '○' : '◐');

export function optionLabel(f: Pick<FieldDef, 'optionPrefix' | 'optionLabels'>, v: string, t: T) {
  if (f.optionLabels?.[v]) return f.optionLabels[v];
  if (f.optionPrefix) return t(`${f.optionPrefix}${v}`);
  return v;
}

export interface MediaLite {
  id: string;
  kind: string;
  thumb: string;
  alt: string;
  w: number | null;
  h: number | null;
}
export function mediaThumb(m: typeof s.mediaAssets.$inferSelect): string {
  if (m.kind === 'youtube' && m.youtubeId) return `https://i.ytimg.com/vi/${m.youtubeId}/mqdefault.jpg`;
  let vs: { w: number; key: string }[] = [];
  try {
    vs = m.variantsJson ? (JSON.parse(m.variantsJson) as { w: number; key: string }[]) : [];
  } catch {
    vs = [];
  }
  vs.sort((a, b) => a.w - b.w);
  const k = vs[0]?.key ?? m.src ?? '';
  return k.startsWith('/') || k.startsWith('http') ? k : `/${k}`;
}
export async function mediaLite(ids: unknown[]): Promise<Map<string, MediaLite>> {
  const clean = [...new Set(ids.filter((x): x is string => typeof x === 'string' && !!x))];
  if (!clean.length) return new Map();
  const rows = await db().select().from(s.mediaAssets).where(inArray(s.mediaAssets.id, clean));
  return new Map(rows.map((m) => [m.id, { id: m.id, kind: m.kind, thumb: mediaThumb(m), alt: m.altRo ?? '', w: m.width, h: m.height }]));
}

/** Data the edit form needs for its pickers (only what the entity uses). */
export async function pickerData(def: EntityDef, row: Row) {
  const types = new Set(def.fields.map((f) => f.type));
  const mediaIds = def.fields.filter((f) => f.type === 'media').map((f) => row[f.name]);
  if (types.has('pagedata') && typeof row.dataJson === 'string') {
    try {
      mediaIds.push((JSON.parse(row.dataJson) as { heritageMediaId?: string }).heritageMediaId);
    } catch {
      /* ignore */
    }
  }
  const [media, departments, galleries, docs] = await Promise.all([
    mediaLite(mediaIds),
    types.has('department') ? db().select({ id: s.departments.id, name: s.departments.nameRo }).from(s.departments).orderBy(s.departments.sortOrder) : Promise.resolve([]),
    types.has('gallery') ? db().select({ id: s.galleries.id, title: s.galleries.titleRo }).from(s.galleries).orderBy(s.galleries.sortOrder) : Promise.resolve([]),
    types.has('document') && row.documentId
      ? db().select({ id: s.documents.id, title: s.documents.titleRo }).from(s.documents).where(inArray(s.documents.id, [Number(row.documentId)]))
      : Promise.resolve([]),
  ]);
  return { media, departments, galleries, docs: new Map(docs.map((d) => [d.id, d.title])) };
}

/** Public URL of an item in Romanian (for "Deschide pe site"). */
export function publicUrlFor(def: EntityDef, row: Row): string | undefined {
  if (def.key === 'documente') return row.r2Key ? `/${String(row.r2Key)}` : ((row.externalUrl as string | null) ?? undefined);
  if (def.key === 'ghiduri' && row.kind) return url('guide', 'ro', { kind: String(row.kind) });
  if (def.key === 'pagini' && typeof row.key === 'string' && row.key in ROUTES) return url(row.key as RouteId, 'ro');
  if (def.key === 'istorie') return url('history', 'ro');
  if (def.key === 'personal' || def.key === 'catedre') return url('staff', 'ro');
  if (def.publicRoute && row.slug) return url(def.publicRoute, 'ro', { slug: String(row.slug) });
  return undefined;
}

/** Read `?ok=` / `?err=` flash keys (only known i18n keys are rendered). */
export const flashFrom = (u: URL) => ({ ok: u.searchParams.get('ok') ?? undefined, err: u.searchParams.get('err') ?? undefined });

/** Where an image is used (blocks deletion; shown as „Folosită în”). */
export async function mediaUsage(id: string) {
  const d = db();
  const q = <T extends { id: number; title: string }>(rows: Promise<T[]>, key: string) => rows.then((r) => r.map((x) => ({ key, id: x.id, title: x.title })));
  const like = `%${id}%`;
  const parts = await Promise.all([
    q(d.select({ id: s.announcements.id, title: s.announcements.titleRo }).from(s.announcements).where(eq(s.announcements.coverMediaId, id)), 'anunturi'),
    q(d.select({ id: s.pages.id, title: s.pages.titleRo }).from(s.pages).where(or(eq(s.pages.heroMediaId, id), sqlLike(s.pages.dataJson, like))), 'pagini'),
    q(d.select({ id: s.staff.id, title: s.staff.fullName }).from(s.staff).where(eq(s.staff.photoMediaId, id)), 'personal'),
    q(d.select({ id: s.projects.id, title: s.projects.titleRo }).from(s.projects).where(eq(s.projects.coverMediaId, id)), 'proiecte'),
    q(d.select({ id: s.studentLife.id, title: s.studentLife.titleRo }).from(s.studentLife).where(eq(s.studentLife.coverMediaId, id)), 'viata-scolara'),
    q(d.select({ id: s.timelineEvents.id, title: s.timelineEvents.titleRo }).from(s.timelineEvents).where(eq(s.timelineEvents.mediaId, id)), 'istorie'),
    q(
      d
        .selectDistinct({ id: s.galleries.id, title: s.galleries.titleRo })
        .from(s.galleries)
        .leftJoin(s.galleryItems, eq(s.galleryItems.galleryId, s.galleries.id))
        .where(or(eq(s.galleries.coverMediaId, id), eq(s.galleryItems.mediaId, id))),
      'galerii',
    ),
    d
      .select({ key: s.settings.key })
      .from(s.settings)
      .where(sqlLike(s.settings.valueJson, like))
      .then((r) => r.map((x) => ({ key: 'setari', id: 0, title: x.key }))),
  ]);
  return parts.flat();
}
