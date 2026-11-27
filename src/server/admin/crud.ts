/**
 * Generic create / update / publish / delete for the content types declared in entities.ts.
 * Absorbs complexity for the editor (Tesler): slugs, rendered HTML, translation state, revisions,
 * redirects on slug change, audit and cache purge all happen here.
 */
import type { APIContext } from 'astro';
import { and, asc, desc, eq, like, max, ne, or, sql, type SQL } from 'drizzle-orm';
import { db, schema as s } from '../db';
import { renderMarkdown } from '../markdown';
import { normalizePath } from '../redirects';
import { LOCALES, SUFFIX, type Locale } from '~/i18n/locales';
import { url as routeUrl } from '~/i18n/routes';
import { audit, can, revision } from './audit';
import { purge } from './purge';
import type { EntityDef, FieldDef } from './entities';
import { cleanFilename, DOC_MAX, disposition, pdfPages, putObject, readFile, safeBase, sniffDocument } from './upload';
import { fromInput, isSafeLink, isSafeRedirectTarget, slugify, str } from './util';
import { retireObjects } from './objects';
import { purgeObjects } from './purge';
import { ROUTES } from '~/i18n/routes';

export type Row = Record<string, unknown>;
export type Action = 'save' | 'publish' | 'unpublish' | 'archive' | 'delete';
export const ACTIONS: Action[] = ['save', 'publish', 'unpublish', 'archive', 'delete'];

const col = (name: string, l: Locale) => `${name}${SUFFIX[l]}`;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// ───────────────────────────── repeaters ─────────────────────────────
/** Collect `prefix[i][field]` inputs into ordered rows, dropping rows where every value is empty. */
export function repeaterRows(fd: FormData, prefix: string): Record<string, string>[] {
  const re = new RegExp(`^${prefix.replace(/[[\]]/g, '\\$&')}\\[(\\d+)\\]\\[([a-z_]+)\\]$`);
  const byIdx = new Map<number, Record<string, string>>();
  for (const [k, v] of fd.entries()) {
    const m = re.exec(k);
    if (!m || typeof v !== 'string') continue;
    const i = Number(m[1]);
    const r = byIdx.get(i) ?? {};
    r[m[2]!] = v.replace(/\r\n/g, '\n').trim().slice(0, 2000);
    byIdx.set(i, r);
  }
  return [...byIdx.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, r]) => r)
    .filter((r) => Object.values(r).some((v) => v !== ''));
}

type L = { ro: string; de?: string; en?: string };
const toL = (r: Record<string, string>, base: string): L => {
  const out: L = { ro: r[`${base}_ro`] ?? '' };
  if (r[`${base}_de`]) out.de = r[`${base}_de`];
  if (r[`${base}_en`]) out.en = r[`${base}_en`];
  return out;
};
const fromL = (v: unknown, base: string): Record<string, string> => {
  if (typeof v === 'string') return { [`${base}_ro`]: v };
  const o = (v ?? {}) as Record<string, string>;
  return { [`${base}_ro`]: o.ro ?? '', [`${base}_de`]: o.de ?? '', [`${base}_en`]: o.en ?? '' };
};

export interface PageDataFlat {
  facts: Record<string, string>[];
  notes: Record<string, string>[];
  related: Record<string, string>[];
  heritageMediaId: string;
  videoId: string;
  videoTitle: Record<string, string>;
  rest: Row;
}
export function flattenPageData(json: string | null | undefined): PageDataFlat {
  let d: Row = {};
  try {
    d = json ? (JSON.parse(json) as Row) : {};
  } catch {
    d = {};
  }
  const { facts, notes, related, heritageMediaId, video, ...rest } = d as {
    facts?: { label: unknown; value: unknown }[];
    notes?: { title: unknown; text: unknown }[];
    related?: { route: string; params?: Record<string, string>; label: unknown }[];
    heritageMediaId?: string;
    video?: { id?: string; title?: unknown };
  } & Row;
  return {
    facts: (Array.isArray(facts) ? facts : []).map((f) => ({ ...fromL(f.label, 'label'), ...fromL(f.value, 'value') })),
    notes: (Array.isArray(notes) ? notes : []).map((n) => ({ ...fromL(n.title, 'title'), ...fromL(n.text, 'text') })),
    related: (Array.isArray(related) ? related : []).map((r) => ({ route: r.route ?? '', slug: r.params?.slug ?? r.params?.kind ?? '', ...fromL(r.label, 'label') })),
    heritageMediaId: heritageMediaId ?? '',
    videoId: video?.id ?? '',
    videoTitle: fromL(video?.title, 'title'),
    rest,
  };
}
function nestPageData(f: PageDataFlat): Row {
  const out: Row = { ...f.rest };
  if (f.facts.length) out.facts = f.facts.map((r) => ({ label: toL(r, 'label'), value: toL(r, 'value') }));
  if (f.notes.length) out.notes = f.notes.map((r) => ({ title: toL(r, 'title'), text: toL(r, 'text') }));
  if (f.related.length)
    out.related = f.related
      .filter((r) => r.route)
      .map((r) => ({ route: r.route, ...(r.slug ? { params: r.route === 'guide' ? { kind: r.slug } : { slug: r.slug } } : {}), label: toL(r, 'label') }));
  if (f.heritageMediaId) out.heritageMediaId = f.heritageMediaId;
  if (f.videoId) out.video = { id: f.videoId, title: toL(f.videoTitle, 'title') };
  return out;
}
/** Translators may only change DE/EN: copy RO values (and the row count) from the stored rows. */
function keepRo(stored: Record<string, string>[], incoming: Record<string, string>[]) {
  return stored.map((r, i) => {
    const n = incoming[i] ?? {};
    const out = { ...r };
    for (const [k, v] of Object.entries(n)) if (/_(de|en)$/.test(k)) out[k] = v;
    return out;
  });
}

// ───────────────────────────── parse ─────────────────────────────
export interface Parsed {
  values: Row;
  errors: Record<string, string>;
  slugFromTitle: boolean;
}

function canEditField(f: FieldDef, role: string, l?: Locale) {
  if (role === 'translator') return !!f.localized && l !== undefined && l !== 'ro';
  if (f.adminOnly && role !== 'admin') return false;
  return true;
}

export async function parseForm(ctx: APIContext, def: EntityDef, fd: FormData, existing: Row | undefined): Promise<Parsed> {
  const role = ctx.locals.admin!.role;
  const isTranslator = role === 'translator';
  const values: Row = {};
  const errors: Record<string, string> = {};
  let slugFromTitle = false;

  for (const f of def.fields) {
    if (f.localized) {
      if (f.type === 'checklist') {
        const colName = f.column ?? `${f.name}Json`;
        let stored: Record<string, string[]> = {};
        try {
          stored = existing?.[colName] ? (JSON.parse(String(existing[colName])) as Record<string, string[]>) : {};
        } catch {
          stored = {};
        }
        const out: Record<string, string[]> = { ...stored };
        for (const l of LOCALES) {
          if (!canEditField(f, role, l)) continue;
          const lines = str(fd.get(`${f.name}_${l}`), 8000)
            .split('\n')
            .map((x) => x.replace(/^[-*•]\s*/, '').trim())
            .filter(Boolean)
            .slice(0, 40);
          if (lines.length) out[l] = lines;
          else delete out[l];
        }
        values[colName] = Object.keys(out).length ? JSON.stringify(out) : null;
        continue;
      }
      for (const l of LOCALES) {
        if (!canEditField(f, role, l)) continue;
        const name = col(f.name, l);
        const v = str(fd.get(name), (f.max ?? 2000) + 1);
        if (f.max && v.length > f.max) errors[name] = 'errTooLong';
        if (f.required && l === 'ro' && !v) errors[name] = 'errRequired';
        values[name] = v || null;
        if (f.type === 'markdown' && f.htmlName) values[col(f.htmlName, l)] = renderMarkdown(v);
      }
      continue;
    }
    if (!canEditField(f, role)) continue;
    const raw = fd.get(f.name);
    const v = str(raw, (f.max ?? 2000) + 1);
    switch (f.type) {
      case 'text':
      case 'textarea':
        if (f.max && v.length > f.max) errors[f.name] = 'errTooLong';
        if (f.required && !v) errors[f.name] = 'errRequired';
        values[f.name] = v || null;
        break;
      case 'url':
        if (v && !isSafeLink(v)) errors[f.name] = 'errUrl';
        values[f.name] = v || null;
        break;
      case 'email':
        if (v && !EMAIL_RE.test(v)) errors[f.name] = 'errEmail';
        values[f.name] = v ? v.toLowerCase() : null;
        break;
      case 'select':
        values[f.name] = f.options?.includes(v) ? v : (f.defaultValue ?? f.options?.[0] ?? null);
        break;
      case 'multiselect':
        values[f.name] = fd
          .getAll(f.name)
          .filter((x): x is string => typeof x === 'string' && !!f.options?.includes(x))
          .join(',');
        break;
      case 'checkbox':
        values[f.name] = raw === 'on' || raw === '1' || raw === 'true';
        break;
      case 'date':
      case 'datetime':
        values[f.name] = fromInput(v);
        if (f.required && values[f.name] == null) errors[f.name] = 'errRequired';
        break;
      case 'number': {
        if (!v) {
          if (f.required) errors[f.name] = 'errRequired';
          else if (f.name !== 'sortOrder') values[f.name] = null;
          break;
        }
        const n = Number(v);
        if (!Number.isInteger(n) || Math.abs(n) > 1e9) errors[f.name] = 'errNumber';
        else values[f.name] = n;
        break;
      }
      case 'media':
        values[f.name] = /^[\w-]{1,64}$/.test(v) ? v : null;
        break;
      case 'document':
      case 'gallery':
      case 'department':
        values[f.name] = /^\d+$/.test(v) ? Number(v) : null;
        break;
      case 'slug': {
        const typed = slugify(v);
        if (v && !typed) errors.slug = 'errSlug';
        values.slug = typed || null;
        break;
      }
      case 'faq': {
        let stored: Record<string, string>[] = [];
        try {
          stored = existing?.faqJson ? (JSON.parse(String(existing.faqJson)) as Record<string, string>[]) : [];
        } catch {
          stored = [];
        }
        let rows = repeaterRows(fd, 'faq');
        if (isTranslator) rows = keepRo(stored, rows);
        rows = rows.filter((r) => r.q_ro || r.a_ro);
        values.faqJson = rows.length ? JSON.stringify(rows.map((r) => Object.fromEntries(Object.entries(r).filter(([, x]) => x)))) : null;
        break;
      }
      case 'pagedata':
        break; // handled below (translators too)
      case 'file':
        break; // handled in saveEntity
    }
  }

  // page structured data (facts / notes / related / home extras)
  if (def.fields.some((f) => f.type === 'pagedata')) {
    const stored = flattenPageData(existing?.dataJson as string | undefined);
    const rawNow = str(fd.get('dataJson_raw'), 100_000);
    const rawOrig = str(fd.get('dataJson_raw_orig'), 100_000);
    if (role === 'admin' && rawNow && rawNow !== rawOrig) {
      try {
        values.dataJson = JSON.stringify(JSON.parse(rawNow));
      } catch {
        errors.dataJson_raw = 'errJson';
      }
    } else if (fd.has('pd_present')) {
      const incoming: PageDataFlat = {
        facts: repeaterRows(fd, 'pd_facts'),
        notes: repeaterRows(fd, 'pd_notes'),
        related: repeaterRows(fd, 'pd_related'),
        heritageMediaId: str(fd.get('pd_heritageMediaId'), 64),
        videoId: youtubeId(str(fd.get('pd_videoId'), 200)) ?? '',
        videoTitle: { title_ro: str(fd.get('pd_videoTitle_ro'), 200), title_de: str(fd.get('pd_videoTitle_de'), 200), title_en: str(fd.get('pd_videoTitle_en'), 200) },
        rest: stored.rest,
      };
      if (isTranslator) {
        incoming.facts = keepRo(stored.facts, incoming.facts);
        incoming.notes = keepRo(stored.notes, incoming.notes);
        incoming.related = keepRo(stored.related, incoming.related);
        incoming.heritageMediaId = stored.heritageMediaId;
        incoming.videoId = stored.videoId;
        incoming.videoTitle = { ...incoming.videoTitle, title_ro: stored.videoTitle.title_ro ?? '' };
      }
      const nested = nestPageData(incoming);
      values.dataJson = Object.keys(nested).length ? JSON.stringify(nested) : null;
    }
  }

  // derived values
  if (!isTranslator) {
    if (def.fields.some((f) => f.type === 'slug')) {
      if (!values.slug) {
        const title = (values[def.titleLocalized ? col(def.titleField, 'ro') : def.titleField] as string | null) ?? '';
        values.slug = (existing?.slug as string | undefined) ?? (slugify(title) || null);
        slugFromTitle = !existing?.slug;
      }
    }
    if (def.key === 'personal' && !values.sortName) values.sortName = values.fullName;
    if (def.key === 'anunturi' && values.pinnedBanner) {
      if (!values.bannerTextRo || !values.bannerUntil) errors.bannerUntil = 'errBannerUntil';
    }
    if (def.key === 'documente' && values.academicYear && !/^\d{4}-\d{4}$/.test(String(values.academicYear))) errors.academicYear = 'errSlug';
  }
  return { values, errors, slugFromTitle };
}

export function youtubeId(input: string): string | null {
  const v = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  const m = /(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/.exec(v);
  return m ? m[1]! : null;
}

// ───────────────────────────── read ─────────────────────────────
export async function getRow(def: EntityDef, id: number): Promise<Row | undefined> {
  const [row] = await db().select().from(def.table).where(eq(def.table.id, id)).limit(1);
  return row as Row | undefined;
}

export interface ListOpts {
  q?: string;
  status?: string;
  filters?: Record<string, string>;
  page?: number;
  parentId?: number;
  perPage?: number;
}
export async function listRows(def: EntityDef, o: ListOpts) {
  const t = def.table;
  const conds: (SQL | undefined)[] = [];
  if (o.q) {
    const pat = `%${o.q.replace(/[%_]/g, '')}%`;
    conds.push(
      def.titleLocalized
        ? or(like(t[col(def.titleField, 'ro')], pat), like(t[col(def.titleField, 'de')], pat), like(t[col(def.titleField, 'en')], pat))
        : like(t[def.titleField], pat),
    );
  }
  if (o.status && def.hasStatus) conds.push(eq(t.status, o.status));
  for (const [k, v] of Object.entries(o.filters ?? {})) if (v && t[k]) conds.push(eq(t[k], v));
  if (def.parent && o.parentId) conds.push(eq(t[def.parent.field], o.parentId));
  const where = conds.length ? and(...conds) : undefined;
  const order =
    def.sort === 'sortOrder'
      ? [asc(t.sortOrder), asc(t.id)]
      : def.sort === 'year'
        ? [asc(t.year), asc(t.id)]
        : def.sort === 'published' && t.publishedAt
          ? [sql`coalesce(${t.publishedAt}, ${t.updatedAt}) desc`, desc(t.id)]
          : t.updatedAt
            ? [desc(t.updatedAt)]
            : [desc(t.id)];
  const per = o.perPage ?? 50;
  const page = Math.max(1, o.page ?? 1);
  const [rows, [cnt]] = await db().batch([
    db()
      .select()
      .from(t)
      .where(where)
      .orderBy(...order)
      .limit(per)
      .offset((page - 1) * per),
    db().select({ n: sql<number>`count(*)` }).from(t).where(where),
  ]);
  return { rows: rows as Row[], total: Number(cnt?.n ?? 0), page, per };
}

// ───────────────────────────── write ─────────────────────────────
export type SaveResult =
  | { ok: true; id: number; flash: string; redirected?: boolean }
  | { ok: false; errors: Record<string, string>; values: Row; flashError?: string; conflict?: boolean };

/** Fixed pages that public routes render (pages.key = a route id): never deletable. */
export const isCorePage = (def: EntityDef, row: Row | undefined) => def.key === 'pagini' && !!row && typeof row.key === 'string' && row.key in ROUTES;

/** Optimistic concurrency: the version (updated_at) a form was loaded with. */
export const versionOf = (row: Row | undefined) => (row && row.updatedAt != null ? String(row.updatedAt) : '');

const titleOf = (def: EntityDef, r: Row) => String(r[def.titleLocalized ? col(def.titleField, 'ro') : def.titleField] ?? '');

async function slugTaken(def: EntityDef, slug: string, id: number | null) {
  const [r] = await db()
    .select({ id: def.table.id })
    .from(def.table)
    .where(id ? and(eq(def.table.slug, slug), ne(def.table.id, id)) : eq(def.table.slug, slug))
    .limit(1);
  return !!r;
}

/** On slug change of a published item: 301 old → new in every language and re-point older redirects (no chains). */
async function redirectSlug(def: EntityDef, oldSlug: string, newSlug: string) {
  if (!def.publicRoute) return false;
  for (const l of LOCALES) {
    const from = normalizePath(routeUrl(def.publicRoute, l, { slug: oldSlug }));
    const to = routeUrl(def.publicRoute, l, { slug: newSlug });
    await db()
      .insert(s.redirects)
      .values({ fromPath: from, toPath: to, code: 301, note: `slug: ${def.key}` })
      .onConflictDoUpdate({ target: s.redirects.fromPath, set: { toPath: to, code: 301 } });
    await db().update(s.redirects).set({ toPath: to }).where(eq(s.redirects.toPath, routeUrl(def.publicRoute, l, { slug: oldSlug })));
    // the new URL must never itself redirect
    await db().delete(s.redirects).where(eq(s.redirects.fromPath, normalizePath(to)));
  }
  return true;
}

async function handleDocumentFile(ctx: APIContext, fd: FormData, values: Row, existing: Row | undefined, errors: Record<string, string>) {
  const file = fd.get('file');
  const ext = str(fd.get('externalUrl'), 2000);
  if (ext && !isSafeRedirectTarget(ext)) errors.externalUrl = 'errUrl';
  values.externalUrl = ext || null;
  if (file instanceof File && file.size > 0) {
    if (file.size > DOC_MAX) {
      errors.file = 'errFileSize';
      return;
    }
    const { bytes, sha } = await readFile(file);
    const sniff = await sniffDocument(bytes, file.name);
    if ('error' in sniff) {
      errors.file = sniff.error === 'pdfActive' ? 'errPdfActive' : sniff.error === 'macro' ? 'errMacro' : 'errFile';
      return;
    }
    const [dupe] = await db()
      .select({ id: s.documents.id, title: s.documents.titleRo })
      .from(s.documents)
      .where(existing ? and(eq(s.documents.sha256, sha), ne(s.documents.id, Number(existing.id))) : eq(s.documents.sha256, sha))
      .limit(1);
    if (dupe) {
      errors.file = `doc_dupe|${dupe.title}|${dupe.id}`;
      return;
    }
    const original = cleanFilename(file.name);
    const base = safeBase(original);
    const year = new Date().getUTCFullYear();
    const key = `files/${year}/${sha.slice(0, 12)}-${base}.${sniff.ext}`;
    await putObject(key, bytes, sniff.mime, { uploadedBy: ctx.locals.admin!.id, originalName: encodeURIComponent(original).slice(0, 500) }, disposition(sniff.kind === 'office' ? 'attachment' : 'inline', `${base}.${sniff.ext}`, original));
    Object.assign(values, {
      r2Key: key,
      originalFilename: original,
      mime: sniff.mime,
      fileExt: sniff.ext,
      sizeBytes: bytes.length,
      sha256: sha,
      pages: sniff.kind === 'pdf' ? pdfPages(bytes) : null,
    });
    if (!values.titleRo) {
      values.titleRo = original.replace(/\.[a-z0-9]{1,5}$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
      delete errors.titleRo;
    }
  }
  if (!values.r2Key && !existing?.r2Key && !values.externalUrl) errors.file = 'doc_needFile';
}

export async function saveEntity(ctx: APIContext, def: EntityDef, id: number | null, fd: FormData, action: Action, parentId?: number): Promise<SaveResult> {
  const user = ctx.locals.admin!;
  const existing = id ? await getRow(def, id) : undefined;
  const forbidden = (): SaveResult => ({ ok: false, errors: {}, values: existing ?? {}, flashError: 'errForbidden' });
  if (id && !existing) return { ok: false, errors: {}, values: {}, flashError: 'errNotFound' };
  if (!id && !can(user, 'content')) return forbidden();
  if (action !== 'save' && !can(user, 'publish')) return forbidden();
  if (def.key === 'pagini' && !id && user.role !== 'admin') return forbidden();

  // ── delete
  if (action === 'delete') {
    if (!existing) return forbidden();
    // the fixed pages rendered by public routes (Contact, Accesibilitate, …) cannot be recreated by editors
    if (isCorePage(def, existing)) return { ok: false, errors: {}, values: existing, flashError: 'errCorePage' };
    await db().delete(def.table).where(eq(def.table.id, id!));
    await audit(ctx, 'delete', def.entityType, id, titleOf(def, existing));
    if (!def.hasStatus || existing.status === 'published') await purge(ctx, [def.entityType, ...(def.alsoPurge ?? []), ...(existing.pinnedBanner ? ['banner'] : [])]);
    if (def.key === 'documente') await retireObjects(ctx, [existing.r2Key as string | null]);
    return { ok: true, id: id!, flash: 'okDeleted' };
  }

  // ── optimistic concurrency: refuse to overwrite changes saved by someone else since this form was loaded
  if (existing && fd.has('_v') && 'updatedAt' in def.table) {
    const loaded = str(fd.get('_v'), 40);
    if (loaded !== versionOf(existing)) {
      const { values } = await parseForm(ctx, def, fd, existing);
      return { ok: false, errors: {}, values: { ...existing, ...values, updatedAt: existing.updatedAt }, flashError: 'errConflict', conflict: true };
    }
  }

  const { values, errors, slugFromTitle } = await parseForm(ctx, def, fd, existing);
  if (def.key === 'documente' && user.role !== 'translator') await handleDocumentFile(ctx, fd, values, existing, errors);
  const hasSlug = def.fields.some((f) => f.type === 'slug') && user.role !== 'translator';

  if (Object.keys(errors).length) {
    // a file stored for this attempt is not kept: the row does not point at it
    if (typeof values.r2Key === 'string' && values.r2Key !== existing?.r2Key) await retireObjects(ctx, [values.r2Key]);
    const shown: Row = { ...(existing ?? {}), ...values };
    // never echo a slug the editor did not type: it would stick even after the title is corrected
    if (hasSlug && slugFromTitle) shown.slug = existing?.slug ?? null;
    if (def.key === 'documente' && values.r2Key !== existing?.r2Key) for (const k of ['r2Key', 'originalFilename', 'mime', 'fileExt', 'sizeBytes', 'sha256', 'pages']) shown[k] = existing?.[k] ?? null;
    return { ok: false, errors, values: shown };
  }

  // slug: typed by the editor, else from the RO title (only now that the title is valid), numbered if taken
  if (hasSlug) {
    if (!values.slug && !existing?.slug) {
      values.slug = slugify(titleOf(def, { ...(existing ?? {}), ...values })) || slugify(def.newLabel[0]) || def.key;
    }
    if (typeof values.slug === 'string' && values.slug && (await slugTaken(def, values.slug, id))) {
      if (slugFromTitle || !existing?.slug) {
        const base = values.slug;
        let n = 2;
        while (n < 500 && (await slugTaken(def, `${base}-${n}`, id))) n++;
        values.slug = `${base}-${n}`;
      } else {
        const shown: Row = { ...(existing ?? {}), ...values };
        return { ok: false, errors: { slug: 'errSlugTaken' }, values: shown };
      }
    }
  }

  const now = Date.now();
  const prevStatus = (existing?.status as string | undefined) ?? null;
  let status = prevStatus ?? (def.hasStatus ? 'draft' : undefined);
  if (def.hasStatus) {
    if (action === 'publish') status = 'published';
    if (action === 'unpublish') status = 'draft';
    if (action === 'archive') status = 'archived';
    values.status = status;
    if (status === 'published' && !values.publishedAt && !existing?.publishedAt) values.publishedAt = now;
    if (status === 'published' && values.publishedAt === null && existing?.publishedAt) values.publishedAt = existing.publishedAt;
  }

  // translation bookkeeping: RO changes bump rev; DE/EN "done" records the RO revision it matches
  if (def.hasTranslationState) {
    const roKeys = Object.keys(values).filter((k) => k.endsWith('Ro') && !k.startsWith('bodyHtml'));
    const roChanged = !!existing && roKeys.some((k) => (existing[k] ?? null) !== (values[k] ?? null));
    const rev = Number(existing?.rev ?? 1) + (roChanged ? 1 : 0);
    values.rev = rev;
    for (const l of ['de', 'en'] as const) {
      const stateKey = `${l}State`;
      const revKey = `${l}Rev`;
      const posted = str(fd.get(stateKey), 10);
      let state = ['missing', 'draft', 'done'].includes(posted) ? posted : ((existing?.[stateKey] as string | undefined) ?? 'missing');
      const filled = Object.keys(values).some((k) => k.endsWith(SUFFIX[l]) && !k.startsWith('bodyHtml') && typeof values[k] === 'string' && (values[k] as string).trim());
      if (state === 'missing' && filled) state = 'draft';
      if (!filled && !Object.keys(values).some((k) => k.endsWith(SUFFIX[l])) && existing) state = (existing[stateKey] as string) ?? state;
      values[stateKey] = state;
      if (state === 'done' && (existing?.[stateKey] !== 'done' || posted === 'done')) values[revKey] = rev;
    }
  }

  if ('updatedAt' in def.table) values.updatedAt = now;
  if ('updatedBy' in def.table) values.updatedBy = user.id;

  let newId = id;
  if (!existing) {
    if ('createdBy' in def.table) values.createdBy = user.id;
    if (def.parent) {
      if (!parentId) return { ok: false, errors: {}, values, flashError: 'errNotFound' };
      values[def.parent.field] = parentId;
      const [m] = await db()
        .select({ m: max(def.table.sortOrder) })
        .from(def.table)
        .where(eq(def.table[def.parent.field], parentId));
      values.sortOrder = Number(m?.m ?? 0) + 1;
    } else if ('sortOrder' in def.table && values.sortOrder == null) {
      const [m] = await db().select({ m: max(def.table.sortOrder) }).from(def.table);
      values.sortOrder = Number(m?.m ?? 0) + 10;
    }
    const [ins] = await db().insert(def.table).values(values).returning({ id: def.table.id });
    newId = Number((ins as { id: number }).id);
  } else {
    await db().update(def.table).set(values).where(eq(def.table.id, id!));
  }

  const after: Row = { ...(existing ?? {}), ...values, id: newId };
  let flash = existing ? 'okSaved' : 'okCreated';
  if (action === 'publish') flash = 'okPublished';
  if (action === 'unpublish') flash = 'okUnpublished';
  if (action === 'archive') flash = 'okArchived';

  if (existing && prevStatus === 'published' && existing.slug && after.slug && existing.slug !== after.slug) {
    if (await redirectSlug(def, String(existing.slug), String(after.slug))) flash = 'okRedirect';
  }

  // files: a replaced file is deleted from R2; an unpublished/archived one is purged from the edge (kept in R2)
  if (def.key === 'documente' && existing?.r2Key) {
    if (after.r2Key !== existing.r2Key) await retireObjects(ctx, [existing.r2Key as string]);
    else if (prevStatus === 'published' && status !== 'published') await purgeObjects(ctx, [existing.r2Key as string]);
  }

  const live = !def.hasStatus || prevStatus === 'published' || status === 'published';
  if (live && (status === 'published' || !def.hasStatus)) await revision(ctx, def.entityType, newId!, after);
  await audit(ctx, existing ? (action === 'save' ? 'update' : action) : action === 'publish' ? 'create+publish' : 'create', def.entityType, newId, titleOf(def, after));
  if (live) {
    const types = [def.entityType, ...(def.alsoPurge ?? [])];
    if (existing?.pinnedBanner || after.pinnedBanner) types.push('banner');
    await purge(ctx, types);
  }
  return { ok: true, id: newId!, flash };
}

/** Bulk reorder: assign increasing sortOrder in the given order (two-phase for unique indexes). */
export async function reorder(ctx: APIContext, def: EntityDef, ids: number[]) {
  if (!def.orderable && !def.parent) return false;
  const rows = await db()
    .select({ id: def.table.id, o: def.table.sortOrder })
    .from(def.table)
    .where(sql`${def.table.id} in (${sql.join(ids.map((x) => sql`${x}`), sql`, `)})`);
  if (rows.length !== ids.length) return false;
  const base = def.parent ? 1 : Math.max(10, Math.min(...rows.map((r) => Number(r.o))));
  const step = def.parent ? 1 : 10;
  const stmts = [
    ...ids.map((id, i) => db().update(def.table).set({ sortOrder: -(i + 1) }).where(eq(def.table.id, id))),
    ...ids.map((id, i) => db().update(def.table).set({ sortOrder: base + i * step }).where(eq(def.table.id, id))),
  ];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db().batch(stmts as any);
  await audit(ctx, 'reorder', def.entityType, null, `${ids.length} items`);
  await purge(ctx, [def.entityType, ...(def.alsoPurge ?? [])]);
  return true;
}
