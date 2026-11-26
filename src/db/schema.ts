/**
 * D1 schema (Drizzle ORM). Design: docs/04_CLOUDFLARE_EDGE_AND_CMS_ARCHITECTURE.md §6.
 *
 * Conventions
 *  - Every translatable field has three columns: *_ro (required), *_de, *_en (nullable → falls back to RO).
 *  - Times are Unix milliseconds (UTC); display in Europe/Bucharest.
 *  - Markdown source (*_md_*) is rendered to sanitised HTML (*_html_*) at save time, so public
 *    renders never parse Markdown.
 *  - Content rows carry status (draft | published | archived) and translation state per language.
 *  - There is deliberately NO timetable / "orar" anywhere in this schema (CLAUDE.md hard rule 1).
 */
import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const now = sql`(unixepoch('subsec') * 1000)`;
const ts = (n: string) => integer(n);
const flag = (n: string) => integer(n, { mode: 'boolean' }).notNull().default(false);

const STATUS = ['draft', 'published', 'archived'] as const;
const TR_STATE = ['missing', 'draft', 'done'] as const;

const status = () => text('status', { enum: STATUS }).notNull().default('draft');
const translation = () => ({
  rev: integer('rev').notNull().default(1),
  deRev: integer('de_rev'),
  enRev: integer('en_rev'),
  deState: text('de_state', { enum: TR_STATE }).notNull().default('missing'),
  enState: text('en_state', { enum: TR_STATE }).notNull().default('missing'),
});
const audit = () => ({
  createdBy: text('created_by'),
  updatedBy: text('updated_by'),
  createdAt: ts('created_at').notNull().default(now),
  updatedAt: ts('updated_at').notNull().default(now),
});

// ───────────────────────────── AUTH ─────────────────────────────
export const ROLES = ['admin', 'editor', 'translator'] as const;
export type Role = (typeof ROLES)[number];

export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  role: text('role', { enum: ROLES }).notNull(),
  status: text('status', { enum: ['invited', 'active', 'disabled'] }).notNull().default('invited'),
  passwordHash: text('password_hash'),
  passwordChangedAt: ts('password_changed_at'),
  uiLocale: text('ui_locale', { enum: ['ro', 'de'] }).notNull().default('ro'),
  failedLogins: integer('failed_logins').notNull().default(0),
  lockedUntil: ts('locked_until'),
  lastLoginAt: ts('last_login_at'),
  createdAt: ts('created_at').notNull().default(now),
  updatedAt: ts('updated_at').notNull().default(now),
});

export const sessions = sqliteTable(
  'sessions',
  {
    idHash: text('id_hash').primaryKey(),
    userId: text('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
    csrfSecret: text('csrf_secret').notNull(),
    createdAt: ts('created_at').notNull(),
    lastSeenAt: ts('last_seen_at').notNull(),
    expiresAt: ts('expires_at').notNull(),
    absoluteExpiresAt: ts('absolute_expires_at').notNull(),
    userAgent: text('user_agent'),
    ipPrefix: text('ip_prefix'),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_exp_idx').on(t.expiresAt)],
);

export const invites = sqliteTable('invites', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  purpose: text('purpose', { enum: ['invite', 'reset'] }).notNull(),
  createdBy: text('created_by'),
  createdAt: ts('created_at').notNull(),
  expiresAt: ts('expires_at').notNull(),
  usedAt: ts('used_at'),
});

export const auditLog = sqliteTable(
  'audit_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    at: ts('at').notNull().default(now),
    userId: text('user_id'),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    summary: text('summary'),
    ipPrefix: text('ip_prefix'),
  },
  (t) => [index('audit_at_idx').on(t.at), index('audit_entity_idx').on(t.entityType, t.entityId)],
);

// ───────────────────────── SETTINGS / ROUTING ─────────────────────────
/** key/value JSON — contacts, external platform links, social links, hero media, etc. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(),
  updatedAt: ts('updated_at').notNull().default(now),
  updatedBy: text('updated_by'),
});

export const redirects = sqliteTable('redirects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fromPath: text('from_path').notNull().unique(),
  toPath: text('to_path').notNull(),
  code: integer('code').notNull().default(301),
  note: text('note'),
  hits: integer('hits').notNull().default(0),
  lastHitAt: ts('last_hit_at'),
  createdAt: ts('created_at').notNull().default(now),
});

// ───────────────────────────── MEDIA ─────────────────────────────
export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(),
  kind: text('kind', { enum: ['image', 'youtube'] }).notNull(),
  /** R2 key of the largest variant, or a /media/... static path for bundled heritage images. */
  src: text('src'),
  /** [{ w, key }] responsive variants (R2 keys or static paths) */
  variantsJson: text('variants_json'),
  mime: text('mime'),
  sizeBytes: integer('size_bytes'),
  sha256: text('sha256'),
  width: integer('width'),
  height: integer('height'),
  focalX: real('focal_x').notNull().default(0.5),
  focalY: real('focal_y').notNull().default(0.5),
  /** dominant colour placeholder, e.g. #8a7f6e */
  placeholder: text('placeholder'),
  youtubeId: text('youtube_id'),
  altRo: text('alt_ro'),
  altDe: text('alt_de'),
  altEn: text('alt_en'),
  captionRo: text('caption_ro'),
  captionDe: text('caption_de'),
  captionEn: text('caption_en'),
  credit: text('credit'),
  license: text('license'),
  sourceUrl: text('source_url'),
  originalFilename: text('original_filename'),
  uploadedBy: text('uploaded_by'),
  createdAt: ts('created_at').notNull().default(now),
});

export const galleries = sqliteTable('galleries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  titleRo: text('title_ro').notNull(),
  titleDe: text('title_de'),
  titleEn: text('title_en'),
  descriptionRo: text('description_ro'),
  descriptionDe: text('description_de'),
  descriptionEn: text('description_en'),
  coverMediaId: text('cover_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
  eventDate: ts('event_date'),
  status: status(),
  publishedAt: ts('published_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...translation(),
  ...audit(),
});

export const galleryItems = sqliteTable(
  'gallery_items',
  {
    galleryId: integer('gallery_id').notNull().references(() => galleries.id, { onDelete: 'cascade' }),
    mediaId: text('media_id').notNull().references(() => mediaAssets.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.galleryId, t.mediaId] })],
);

// ─────────────────────────── ANNOUNCEMENTS ───────────────────────────
export const ANNOUNCEMENT_TYPES = ['news', 'urgent', 'event', 'achievement'] as const;
export const announcements = sqliteTable(
  'announcements',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull().unique(),
    type: text('type', { enum: ANNOUNCEMENT_TYPES }).notNull().default('news'),
    status: status(),
    titleRo: text('title_ro').notNull(),
    titleDe: text('title_de'),
    titleEn: text('title_en'),
    summaryRo: text('summary_ro'),
    summaryDe: text('summary_de'),
    summaryEn: text('summary_en'),
    bodyMdRo: text('body_md_ro'),
    bodyMdDe: text('body_md_de'),
    bodyMdEn: text('body_md_en'),
    bodyHtmlRo: text('body_html_ro'),
    bodyHtmlDe: text('body_html_de'),
    bodyHtmlEn: text('body_html_en'),
    coverMediaId: text('cover_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
    /** site-wide banner (exam days, closures). Requires bannerUntil. */
    pinnedBanner: flag('pinned_banner'),
    bannerLevel: text('banner_level', { enum: ['info', 'warning', 'critical'] }).notNull().default('info'),
    bannerTextRo: text('banner_text_ro'),
    bannerTextDe: text('banner_text_de'),
    bannerTextEn: text('banner_text_en'),
    bannerUntil: ts('banner_until'),
    eventStart: ts('event_start'),
    eventEnd: ts('event_end'),
    pinnedTop: flag('pinned_top'),
    sourceUrl: text('source_url'),
    publishedAt: ts('published_at'),
    ...translation(),
    ...audit(),
  },
  (t) => [index('ann_pub_idx').on(t.status, t.publishedAt), index('ann_banner_idx').on(t.pinnedBanner, t.bannerUntil)],
);

// ───────────────────────── EDITABLE PAGES ─────────────────────────
/**
 * Editable long-form pages bound to routes by key (despre, istorie, coetus, germana-dsd, contact, …).
 * Each page has a lead + Markdown body per language; structured blocks (facts, links) live in data_json.
 */
export const pages = sqliteTable('pages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  titleRo: text('title_ro').notNull(),
  titleDe: text('title_de'),
  titleEn: text('title_en'),
  leadRo: text('lead_ro'),
  leadDe: text('lead_de'),
  leadEn: text('lead_en'),
  bodyMdRo: text('body_md_ro'),
  bodyMdDe: text('body_md_de'),
  bodyMdEn: text('body_md_en'),
  bodyHtmlRo: text('body_html_ro'),
  bodyHtmlDe: text('body_html_de'),
  bodyHtmlEn: text('body_html_en'),
  metaDescriptionRo: text('meta_description_ro'),
  metaDescriptionDe: text('meta_description_de'),
  metaDescriptionEn: text('meta_description_en'),
  heroMediaId: text('hero_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
  dataJson: text('data_json'),
  status: status(),
  publishedAt: ts('published_at'),
  ...translation(),
  ...audit(),
});

// ───────────────────────────── DOCUMENTS ─────────────────────────────
export const CYCLES = ['primar', 'gimnazial', 'liceal'] as const;
export type Cycle = (typeof CYCLES)[number];

export const DOCUMENT_CATEGORIES = [
  'regulamente', // ROFUIP, ROI, statut
  'strategie', // PDI, PAS, plan managerial
  'rapoarte', // raport anual, RAEI, CEAC
  'oferta', // oferta educațională, CDS/CDȘ
  'admitere',
  'examene',
  'buget', // buget, execuție bugetară, salarii
  'declaratii', // declarații de avere și interese
  'posturi', // posturi / catedre vacante, concursuri
  'dezbateri', // dezbateri publice / consultări
  'achizitii',
  'formulare',
  'burse',
  'calendar', // structura anului școlar (NOT a timetable)
  'gdpr',
  'alte',
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const documents = sqliteTable(
  'documents',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    titleRo: text('title_ro').notNull(),
    titleDe: text('title_de'),
    titleEn: text('title_en'),
    descriptionRo: text('description_ro'),
    descriptionDe: text('description_de'),
    descriptionEn: text('description_en'),
    category: text('category', { enum: DOCUMENT_CATEGORIES }).notNull(),
    /** comma-separated subset of CYCLES; empty = whole school */
    cycles: text('cycles').notNull().default(''),
    academicYear: text('academic_year'),
    docLanguage: text('doc_language', { enum: ['ro', 'de', 'en', 'multi'] }).notNull().default('ro'),
    /** R2 key (files/<sha12>/<safe-name>.pdf) — null when the file lives at externalUrl */
    r2Key: text('r2_key').unique(),
    /** legacy file still hosted on the old server, until the school re-uploads it */
    externalUrl: text('external_url'),
    originalFilename: text('original_filename'),
    mime: text('mime'),
    fileExt: text('file_ext'),
    sizeBytes: integer('size_bytes'),
    sha256: text('sha256'),
    pages: integer('pages'),
    issuedAt: ts('issued_at'),
    registrationNo: text('registration_no'),
    validUntil: ts('valid_until'),
    status: status(),
    publishedAt: ts('published_at'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...translation(),
    ...audit(),
  },
  (t) => [index('docs_cat_idx').on(t.status, t.category, t.academicYear)],
);

// ───────────────────── ADMISSION & EXAM GUIDES ─────────────────────
export const GUIDE_KINDS = ['pregatitoare', 'clasa-v', 'clasa-ix', 'transfer', 'evaluare-nationala', 'bacalaureat', 'dsd', 'olimpiade'] as const;
export const guides = sqliteTable('guides', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  kind: text('kind', { enum: GUIDE_KINDS }).notNull(),
  academicYear: text('academic_year'),
  titleRo: text('title_ro').notNull(),
  titleDe: text('title_de'),
  titleEn: text('title_en'),
  leadRo: text('lead_ro'),
  leadDe: text('lead_de'),
  leadEn: text('lead_en'),
  bodyMdRo: text('body_md_ro'),
  bodyMdDe: text('body_md_de'),
  bodyMdEn: text('body_md_en'),
  bodyHtmlRo: text('body_html_ro'),
  bodyHtmlDe: text('body_html_de'),
  bodyHtmlEn: text('body_html_en'),
  /** JSON [{ q_ro, q_de, q_en, a_ro, a_de, a_en }] — frequently asked questions */
  faqJson: text('faq_json'),
  status: status(),
  publishedAt: ts('published_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...translation(),
  ...audit(),
});

export const guideSteps = sqliteTable(
  'guide_steps',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    guideId: integer('guide_id').notNull().references(() => guides.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
    titleRo: text('title_ro').notNull(),
    titleDe: text('title_de'),
    titleEn: text('title_en'),
    bodyMdRo: text('body_md_ro'),
    bodyMdDe: text('body_md_de'),
    bodyMdEn: text('body_md_en'),
    bodyHtmlRo: text('body_html_ro'),
    bodyHtmlDe: text('body_html_de'),
    bodyHtmlEn: text('body_html_en'),
    /** human-readable timing ("martie–aprilie", "iunie") — exact dates when known */
    whenRo: text('when_ro'),
    whenDe: text('when_de'),
    whenEn: text('when_en'),
    startsAt: ts('starts_at'),
    endsAt: ts('ends_at'),
    isDeadline: flag('is_deadline'),
    /** JSON string[] — checklist items per language: { ro: [], de: [], en: [] } */
    checklistJson: text('checklist_json'),
    linkUrl: text('link_url'),
    documentId: integer('document_id').references(() => documents.id, { onDelete: 'set null' }),
  },
  (t) => [uniqueIndex('guide_steps_order').on(t.guideId, t.sortOrder)],
);

// ───────────────────────────── PEOPLE ─────────────────────────────
export const departments = sqliteTable('departments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  nameRo: text('name_ro').notNull(),
  nameDe: text('name_de'),
  nameEn: text('name_en'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const STAFF_CATEGORIES = ['conducere', 'profesori', 'zfa', 'auxiliar', 'nedidactic'] as const;
export const staff = sqliteTable(
  'staff',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fullName: text('full_name').notNull(),
    sortName: text('sort_name').notNull(),
    titlePrefix: text('title_prefix'),
    roleRo: text('role_ro'),
    roleDe: text('role_de'),
    roleEn: text('role_en'),
    category: text('category', { enum: STAFF_CATEGORIES }).notNull(),
    departmentId: integer('department_id').references(() => departments.id, { onDelete: 'set null' }),
    subjectRo: text('subject_ro'),
    subjectDe: text('subject_de'),
    subjectEn: text('subject_en'),
    email: text('email'),
    showEmail: flag('show_email'),
    photoMediaId: text('photo_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
    photoConsent: flag('photo_consent'),
    sortOrder: integer('sort_order').notNull().default(1000),
    status: text('status', { enum: ['active', 'hidden', 'former'] }).notNull().default('active'),
    ...audit(),
  },
  (t) => [index('staff_cat_idx').on(t.status, t.category, t.sortOrder)],
);

// ─────────────────────── PROJECTS / STUDENT LIFE ───────────────────────
export const PROJECT_KINDS = ['erasmus', 'etwinning', 'pasch', 'dsd', 'schimb', 'concurs', 'comunitate', 'alte'] as const;
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  kind: text('kind', { enum: PROJECT_KINDS }).notNull(),
  titleRo: text('title_ro').notNull(),
  titleDe: text('title_de'),
  titleEn: text('title_en'),
  summaryRo: text('summary_ro'),
  summaryDe: text('summary_de'),
  summaryEn: text('summary_en'),
  bodyMdRo: text('body_md_ro'),
  bodyMdDe: text('body_md_de'),
  bodyMdEn: text('body_md_en'),
  bodyHtmlRo: text('body_html_ro'),
  bodyHtmlDe: text('body_html_de'),
  bodyHtmlEn: text('body_html_en'),
  partners: text('partners'),
  funding: text('funding'),
  period: text('period'),
  coverMediaId: text('cover_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
  galleryId: integer('gallery_id').references(() => galleries.id, { onDelete: 'set null' }),
  externalUrl: text('external_url'),
  status: status(),
  publishedAt: ts('published_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...translation(),
  ...audit(),
});

export const LIFE_KINDS = ['coetus', 'consiliul-elevilor', 'traditie', 'olimpiade', 'arte', 'publicatii', 'club', 'sport', 'voluntariat', 'alte'] as const;
export const studentLife = sqliteTable('student_life', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  kind: text('kind', { enum: LIFE_KINDS }).notNull(),
  titleRo: text('title_ro').notNull(),
  titleDe: text('title_de'),
  titleEn: text('title_en'),
  summaryRo: text('summary_ro'),
  summaryDe: text('summary_de'),
  summaryEn: text('summary_en'),
  bodyMdRo: text('body_md_ro'),
  bodyMdDe: text('body_md_de'),
  bodyMdEn: text('body_md_en'),
  bodyHtmlRo: text('body_html_ro'),
  bodyHtmlDe: text('body_html_de'),
  bodyHtmlEn: text('body_html_en'),
  coverMediaId: text('cover_media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
  galleryId: integer('gallery_id').references(() => galleries.id, { onDelete: 'set null' }),
  status: status(),
  publishedAt: ts('published_at'),
  sortOrder: integer('sort_order').notNull().default(0),
  ...translation(),
  ...audit(),
});

/** Heritage timeline (1388 → today), editable. */
export const timelineEvents = sqliteTable('timeline_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  year: integer('year').notNull(),
  yearLabel: text('year_label'),
  titleRo: text('title_ro').notNull(),
  titleDe: text('title_de'),
  titleEn: text('title_en'),
  bodyRo: text('body_ro'),
  bodyDe: text('body_de'),
  bodyEn: text('body_en'),
  mediaId: text('media_id').references(() => mediaAssets.id, { onDelete: 'set null' }),
  sourceUrl: text('source_url'),
  era: text('era', { enum: ['origins', 'honterus', 'saxon', 'modern', 'today'] }).notNull().default('modern'),
  highlight: flag('highlight'),
  status: status(),
  ...translation(),
  ...audit(),
});

// ───────────────────────────── WORKFLOW ─────────────────────────────
export const revisions = sqliteTable(
  'revisions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    dataJson: text('data_json').notNull(),
    savedBy: text('saved_by'),
    savedAt: ts('saved_at').notNull().default(now),
  },
  (t) => [index('rev_entity_idx').on(t.entityType, t.entityId, t.savedAt)],
);

export const purgeQueue = sqliteTable('purge_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tagsJson: text('tags_json').notNull(),
  createdAt: ts('created_at').notNull().default(now),
  attempts: integer('attempts').notNull().default(0),
  doneAt: ts('done_at'),
});

/** Messages sent through the public contact form (Turnstile-protected). Read in /admin → Mesaje. */
export const contactMessages = sqliteTable(
  'contact_messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    topic: text('topic', { enum: ['secretariat', 'admitere', 'documente', 'altele'] }).notNull().default('secretariat'),
    message: text('message').notNull(),
    locale: text('locale').notNull().default('ro'),
    status: text('status', { enum: ['new', 'read', 'archived'] }).notNull().default('new'),
    ipPrefix: text('ip_prefix'),
    createdAt: ts('created_at').notNull().default(now),
  },
  (t) => [index('msg_status_idx').on(t.status, t.createdAt)],
);
