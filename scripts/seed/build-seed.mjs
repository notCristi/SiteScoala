#!/usr/bin/env node
/**
 * Builds seed/seed.sql from the trilingual content in scripts/seed/content/*.json.
 *
 *   npm run db:seed:local   → build + apply to local D1 (wrangler --local)
 *   npm run db:seed:prod    → build + apply to the production D1 (remote)
 *
 * Conventions of the content files (see scripts/seed/content/README.md):
 *  - keys are snake_case column names; localized fields are { ro, de, en } and expand to *_ro/_de/_en
 *  - `body_md` is rendered to sanitised `body_html` with the same renderer the CMS uses
 *  - dates "YYYY-MM-DD" / ISO become epoch milliseconds
 *  - objects/arrays for *_json columns are stringified
 * Columns are read from migrations/*.sql, so the script stays in sync with the schema.
 *
 * The seed replaces all CONTENT tables. It never touches admin_users, sessions, invites, audit_log,
 * revisions or contact_messages. Run it on production ONCE before launch: afterwards the CMS is the source of truth
 * and re-seeding would overwrite edits made in /admin.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { renderMarkdown } from '../../src/server/markdown.ts';

const ROOT = new URL('../../', import.meta.url).pathname;
const C = join(ROOT, 'scripts/seed/content');
const L = ['ro', 'de', 'en'];

// ───────── schema from migrations ─────────
const sqlText = readdirSync(join(ROOT, 'migrations'))
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(ROOT, 'migrations', f), 'utf8'))
  .join('\n');
const COLS = {};
for (const m of sqlText.matchAll(/CREATE TABLE `(\w+)` \(([\s\S]*?)\n\);/g)) {
  COLS[m[1]] = [...m[2].matchAll(/^\s*`(\w+)`/gm)].map((x) => x[1]);
}
for (const m of sqlText.matchAll(/ALTER TABLE `(\w+)` ADD `(\w+)`/g)) COLS[m[1]]?.push(m[2]);

// ───────── helpers ─────────
const load = (name, fallback = []) => {
  const p = join(C, `${name}.json`);
  if (!existsSync(p)) {
    console.warn(`  (skip) ${name}.json not found`);
    return fallback;
  }
  return JSON.parse(readFileSync(p, 'utf8'));
};
const isLoc = (v) => v && typeof v === 'object' && !Array.isArray(v) && ('ro' in v || 'de' in v || 'en' in v) && Object.keys(v).every((k) => L.includes(k));
const toMs = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v < 1e11 ? v * 1000 : v;
  const s = String(v);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T09:00:00+02:00`) : new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`bad date: ${s}`);
  return d.getTime();
};
const DATE_COLS = /(_at|_until|^event_start|^event_end|^starts_at|^ends_at|^issued_at|^valid_until|^banner_until)$/;
const sq = (v) => {
  if (v == null) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

// Links in Markdown to old WordPress uploads → the migrated R2 copies (no redirect hop).
const FILES = existsSync(join(C, 'documents-files.json')) ? JSON.parse(readFileSync(join(C, 'documents-files.json'), 'utf8')) : {};
const FILE_BY_PATH = new Map(Object.entries(FILES).map(([u, f]) => [decodeURI(new URL(u).pathname).toLowerCase(), `/${f.r2_key}`]));
const rewriteLegacyLinks = (md) =>
  md.replace(/(?:https?:\/\/(?:www\.)?liceulhonterusbrasov\.ro)?(\/lic\/wp-content\/uploads\/[^\s)"'<>]+)/gi, (m, path) => {
    let key;
    try {
      key = decodeURI(path).toLowerCase();
    } catch {
      key = path.toLowerCase();
    }
    return FILE_BY_PATH.get(key) ?? m;
  });

/** Flatten one content object into a { column: value } row for `table`. */
function flatten(table, obj) {
  const cols = COLS[table];
  if (!cols) throw new Error(`unknown table ${table}`);
  const row = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (k === 'body_md' && isLoc(v)) {
      for (const l of L) {
        if (v[l] == null || v[l] === '') continue;
        const md = rewriteLegacyLinks(v[l]);
        row[`body_md_${l}`] = md;
        row[`body_html_${l}`] = renderMarkdown(md);
      }
    } else if (k.endsWith('_json') && v !== null && typeof v === 'object') {
      row[k] = JSON.stringify(v);
    } else if (isLoc(v)) {
      for (const l of L) if (v[l] != null && v[l] !== '') row[`${k}_${l}`] = v[l];
    } else if (DATE_COLS.test(k)) {
      row[k] = toMs(v);
    } else {
      row[k] = v;
    }
  }
  // translation state: content seeded with DE/EN counts as done
  if (cols.includes('de_state')) {
    const has = (l) => Object.keys(row).some((c) => c.endsWith(`_${l}`) && row[c]);
    row.de_state ??= has('de') ? 'done' : 'missing';
    row.en_state ??= has('en') ? 'done' : 'missing';
    if (row.de_state === 'done') row.de_rev ??= 1;
    if (row.en_state === 'done') row.en_rev ??= 1;
  }
  if (cols.includes('status') && row.status == null && table !== 'staff') row.status = 'published';
  if (cols.includes('published_at') && row.published_at == null && row.status === 'published') row.published_at = Date.now();
  if (cols.includes('created_by')) row.created_by ??= 'seed';
  if (cols.includes('updated_by')) row.updated_by ??= 'seed';
  for (const c of Object.keys(row)) if (!cols.includes(c)) delete row[c];
  return row;
}

const out = [];
const counts = {};
function insert(table, row) {
  const keys = Object.keys(row);
  out.push(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map((k) => sq(row[k])).join(', ')});`);
  counts[table] = (counts[table] ?? 0) + 1;
}

// ───────── order: children first for deletes ─────────
const CONTENT_TABLES = [
  'gallery_items',
  'guide_steps',
  'guides',
  'staff',
  'departments',
  'timeline_events',
  'student_life',
  'projects',
  'galleries',
  'pages',
  'announcements',
  'documents',
  'redirects',
  'settings',
  'purge_queue',
  'media_assets',
];
for (const t of CONTENT_TABLES) out.push(`DELETE FROM ${t};`);
out.push(`DELETE FROM sqlite_sequence WHERE name IN (${CONTENT_TABLES.map(sq).join(', ')});`);

// ───────── media ─────────
const media = load('media');
const mediaIds = new Set();
for (const m of media) {
  const { variants, ...rest } = m;
  insert('media_assets', flatten('media_assets', { kind: 'image', ...rest, variants_json: variants ?? rest.variants_json }));
  mediaIds.add(m.id);
}
const mediaRef = (id, where) => {
  if (!id) return null;
  if (!mediaIds.has(id)) {
    console.warn(`  ! unknown media id ${id} in ${where} — dropped`);
    return null;
  }
  return id;
};

// ───────── settings ─────────
const settings = load('settings', {});
const settingsRows = Array.isArray(settings) ? settings : Object.entries(settings).map(([key, value]) => ({ key, value }));
for (const s of settingsRows) insert('settings', { key: s.key, value_json: JSON.stringify(s.value ?? s.value_json) });

// ───────── documents ─────────
const docs = load('documents');
const files = load('documents-files', {}); // legacy URL → R2 object (scripts/media/import-legacy-documents.mjs)
const legacyFileRedirects = [];
const docIdBySlug = new Map();
docs.forEach((d, i) => {
  const id = d.id ?? i + 1;
  const { slug, cycles, ...rest } = d;
  const f = d.external_url ? files[d.external_url] : undefined;
  if (f) {
    Object.assign(rest, { r2_key: f.r2_key, size_bytes: f.size_bytes, sha256: f.sha256, mime: f.mime, external_url: null });
    legacyFileRedirects.push({ from: new URL(d.external_url).pathname, to: `/${f.r2_key}` });
  }
  if (slug) docIdBySlug.set(slug, id);
  insert('documents', flatten('documents', { ...rest, id, cycles: Array.isArray(cycles) ? cycles.join(',') : (cycles ?? '') }));
});

// ───────── announcements ─────────
const news = load('news');
const seenSlugs = new Set();
news.forEach((n, i) => {
  let slug = n.slug || slugify(n.title?.ro ?? `anunt-${i + 1}`);
  while (seenSlugs.has(slug)) slug += '-2';
  seenSlugs.add(slug);
  insert('announcements', flatten('announcements', { ...n, id: i + 1, slug, cover_media_id: mediaRef(n.cover_media_id, `news ${slug}`) }));
});

// ───────── pages ─────────
for (const p of load('pages')) {
  insert('pages', flatten('pages', { ...p, hero_media_id: mediaRef(p.hero_media_id, `page ${p.key}`), data_json: p.data_json ?? null }));
}

// ───────── guides + steps ─────────
let stepId = 0;
load('guides').forEach((g, i) => {
  const gid = i + 1;
  const { steps = [], faq = [], ...rest } = g;
  const faqJson = faq.map((f) => (f.q ? { q_ro: f.q.ro, q_de: f.q.de, q_en: f.q.en, a_ro: f.a.ro, a_de: f.a.de, a_en: f.a.en } : f));
  insert('guides', flatten('guides', { slug: g.kind, ...rest, id: gid, faq_json: faqJson, sort_order: g.sort_order ?? i }));
  steps.forEach((s, j) => {
    const { checklist, document_slug, ...sr } = s;
    let documentId = s.document_id ?? null;
    if (document_slug) {
      documentId = docIdBySlug.get(document_slug) ?? null;
      if (!documentId) console.warn(`  ! guide ${g.kind}: unknown document_slug ${document_slug}`);
    }
    insert('guide_steps', flatten('guide_steps', { ...sr, id: ++stepId, guide_id: gid, sort_order: j, checklist_json: checklist ?? s.checklist_json ?? null, document_id: documentId }));
  });
});

// ───────── departments + staff ─────────
const staffFile = load('staff', { departments: [], people: [] });
const depts = staffFile.departments ?? [];
const deptIdByKey = new Map();
depts.forEach((d, i) => {
  const id = d.id ?? i + 1;
  const slug = d.slug ?? d.key ?? slugify(d.name?.ro ?? `catedra-${id}`);
  deptIdByKey.set(slug, id);
  const { key: _k, ...rest } = d;
  insert('departments', flatten('departments', { ...rest, id, slug, sort_order: d.sort_order ?? i }));
});
(staffFile.people ?? staffFile.staff ?? []).forEach((p, i) => {
  const { department, department_key, department_slug, ...rest } = p;
  const dk = department_slug ?? department_key ?? department;
  const department_id = p.department_id ?? (dk != null ? (deptIdByKey.get(dk) ?? null) : null);
  if (dk != null && department_id == null) console.warn(`  ! staff ${p.full_name}: unknown department ${dk}`);
  insert('staff', flatten('staff', { status: 'active', ...rest, id: i + 1, department_id, photo_consent: false, photo_media_id: null }));
});

// ───────── history, life, projects ─────────
load('timeline').forEach((e, i) => insert('timeline_events', flatten('timeline_events', { ...e, id: i + 1, media_id: mediaRef(e.media_id, `timeline ${e.year}`) })));
load('life').forEach((e, i) => insert('student_life', flatten('student_life', { ...e, id: i + 1, sort_order: e.sort_order ?? i, cover_media_id: mediaRef(e.cover_media_id, `life ${e.slug}`) })));
load('projects').forEach((e, i) => insert('projects', flatten('projects', { ...e, id: i + 1, sort_order: e.sort_order ?? i, cover_media_id: mediaRef(e.cover_media_id, `project ${e.slug}`) })));

// ───────── redirects ─────────
const normalizePath = (path) => {
  const [p0, search = ''] = path.split('?');
  let p = p0;
  try {
    p = decodeURIComponent(p);
  } catch {
    /* keep */
  }
  p = p.toLowerCase().replace(/\/{2,}/g, '/');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  const q = new URLSearchParams(search);
  const keep = ['p', 'page_id', 'cat', 'attachment_id'].filter((k) => q.has(k)).map((k) => `${k}=${q.get(k)}`);
  return keep.length ? `${p}?${keep.join('&')}` : p;
};
const seenFrom = new Set();
for (const r of [...load('redirects'), ...legacyFileRedirects]) {
  const from = normalizePath(r.from ?? r.from_path);
  if (from === '/' || seenFrom.has(from)) continue; // "/" is handled by middleware
  seenFrom.add(from);
  insert('redirects', { from_path: from, to_path: r.to ?? r.to_path, code: r.status ?? r.code ?? 301, note: r.note ?? null });
}

// ───────── write ─────────
mkdirSync(join(ROOT, 'seed'), { recursive: true });
writeFileSync(join(ROOT, 'seed/seed.sql'), out.join('\n') + '\n');
console.log('seed/seed.sql written:', Object.entries(counts).map(([t, n]) => `${t} ${n}`).join(' · '));
