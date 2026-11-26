/**
 * Declarative description of every editable content type. The generic list/edit pages
 * (src/pages/admin/[entity]/…) render forms from these definitions, and src/server/admin/form.ts
 * parses and validates them — so every section behaves the same way for the secretary.
 */
import { schema as s } from '../db';
import type { RouteId } from '~/i18n/routes';
import {
  ANNOUNCEMENT_TYPES,
  CYCLES,
  DOCUMENT_CATEGORIES,
  GUIDE_KINDS,
  LIFE_KINDS,
  PROJECT_KINDS,
  STAFF_CATEGORIES,
} from '~/db/schema';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'markdown'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'date'
  | 'datetime'
  | 'number'
  | 'url'
  | 'email'
  | 'media'
  | 'document'
  | 'gallery'
  | 'department'
  | 'slug'
  | 'faq'
  | 'checklist'
  | 'pagedata'
  | 'file';

/** Where a field is drawn on the edit screen. `content` fields that are localized go in the RO/DE/EN tabs. */
export type Place = 'content' | 'side' | 'banner' | 'event' | 'advanced';

export interface FieldDef {
  name: string;
  type: FieldType;
  label: string;
  help?: string;
  localized?: boolean;
  required?: boolean;
  max?: number;
  rows?: number;
  options?: readonly string[];
  /** i18n key prefix for option labels, e.g. 'ann_type_' → ann_type_news */
  optionPrefix?: string;
  /** option labels that are not translated (academic terms, kinds) */
  optionLabels?: Record<string, string>;
  place: Place;
  adminOnly?: boolean;
  /** for markdown: column base for rendered HTML (bodyMd → bodyHtml) */
  htmlName?: string;
  /** for checklist: the JSON column */
  column?: string;
  defaultValue?: unknown;
}

export interface EntityDef {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any;
  /** key in PURGE_TAGS, audit entity type */
  entityType: string;
  label: string;
  /** singular noun for "Adaugă …" buttons */
  newLabel: [string, string];
  titleField: string;
  titleLocalized: boolean;
  hasStatus: boolean;
  hasTranslationState: boolean;
  publicRoute?: RouteId;
  orderable?: boolean;
  sort: 'sortOrder' | 'updated' | 'published' | 'year' | 'sortName';
  fields: FieldDef[];
  filters?: { name: string; options: readonly string[]; optionPrefix?: string; optionLabels?: Record<string, string> }[];
  /** extra column shown in the list (non-localized select) */
  listColumn?: { name: string; optionPrefix?: string; optionLabels?: Record<string, string> };
  /** hidden from the sidebar (sub-entities like guide steps) */
  hidden?: boolean;
  /** parent relation for sub-entities */
  parent?: { entity: string; field: string };
  /** purge also these entity types */
  alsoPurge?: string[];
}

const T = (name: string, label: string, max = 160, required = false): FieldDef => ({ name, type: 'text', label, localized: true, required, max, place: 'content' });
const TA = (name: string, label: string, max = 600, rows = 3): FieldDef => ({ name, type: 'textarea', label, localized: true, max, rows, place: 'content' });
const MD = (label = 'f_body'): FieldDef => ({ name: 'bodyMd', htmlName: 'bodyHtml', type: 'markdown', label, localized: true, max: 200_000, place: 'content' });
const SLUG: FieldDef = { name: 'slug', type: 'slug', label: 'f_slug', help: 'f_slugHelp', place: 'advanced', max: 80 };
const PUB: FieldDef = { name: 'publishedAt', type: 'datetime', label: 'f_publishedAt', help: 'f_publishedAtHelp', place: 'side' };
const ORDER: FieldDef = { name: 'sortOrder', type: 'number', label: 'f_sortOrder', place: 'advanced' };
const COVER: FieldDef = { name: 'coverMediaId', type: 'media', label: 'f_cover', place: 'side' };

const GUIDE_LABELS: Record<string, string> = {
  pregatitoare: 'Clasa pregătitoare',
  'clasa-v': 'Clasa a V-a',
  'clasa-ix': 'Clasa a IX-a',
  transfer: 'Transferuri',
  'evaluare-nationala': 'Evaluarea Națională',
  bacalaureat: 'Bacalaureat',
  dsd: 'DSD I & II',
  olimpiade: 'Olimpiade',
};
const PROJECT_LABELS: Record<string, string> = {
  erasmus: 'Erasmus+',
  etwinning: 'eTwinning',
  pasch: 'PASCH',
  dsd: 'DSD',
  schimb: 'Schimb de elevi / Schüleraustausch',
  concurs: 'Concurs / Wettbewerb',
  comunitate: 'Comunitate / Gemeinschaft',
  alte: 'Altele / Sonstiges',
};
const LIFE_LABELS: Record<string, string> = {
  coetus: 'Coetus',
  'consiliul-elevilor': 'Consiliul elevilor / Schülerrat',
  traditie: 'Tradiție / Tradition',
  olimpiade: 'Olimpiade / Olympiaden',
  arte: 'Arte / Kunst',
  publicatii: 'Publicații / Publikationen',
  club: 'Club / AG',
  sport: 'Sport',
  voluntariat: 'Voluntariat / Ehrenamt',
  alte: 'Altele / Sonstiges',
};
export const CATEGORY_LABELS_RO: Record<string, string> = {
  regulamente: 'Regulamente (ROFUIP, ROI, statut)',
  strategie: 'Strategie (PDI, PAS, plan managerial)',
  rapoarte: 'Rapoarte (raport anual, CEAC)',
  oferta: 'Oferta educațională (CDȘ)',
  admitere: 'Admitere și înscrieri',
  examene: 'Examene',
  buget: 'Buget și salarizare',
  declaratii: 'Declarații de avere și interese',
  posturi: 'Posturi și concursuri',
  dezbateri: 'Dezbateri publice',
  achizitii: 'Achiziții publice',
  formulare: 'Formulare și cereri',
  burse: 'Burse',
  calendar: 'Structura anului școlar',
  gdpr: 'Protecția datelor (GDPR)',
  alte: 'Alte documente',
};

export const ENTITIES: EntityDef[] = [
  {
    key: 'anunturi',
    table: s.announcements,
    entityType: 'announcements',
    label: 'announcements',
    newLabel: ['Anunț nou', 'Neue Mitteilung'],
    titleField: 'title',
    titleLocalized: true,
    hasStatus: true,
    hasTranslationState: true,
    publicRoute: 'article',
    sort: 'published',
    listColumn: { name: 'type', optionPrefix: 'ann_type_' },
    filters: [{ name: 'type', options: ANNOUNCEMENT_TYPES, optionPrefix: 'ann_type_' }],
    fields: [
      T('title', 'f_title', 160, true),
      TA('summary', 'f_summary', 300),
      MD(),
      { name: 'type', type: 'select', label: 'f_type', options: ANNOUNCEMENT_TYPES, optionPrefix: 'ann_type_', place: 'side', required: true, defaultValue: 'news' },
      PUB,
      COVER,
      { name: 'pinnedTop', type: 'checkbox', label: 'pinnedTop', place: 'side' },
      { name: 'pinnedBanner', type: 'checkbox', label: 'pinnedBanner', help: 'bannerHelp', place: 'banner' },
      { name: 'bannerLevel', type: 'select', label: 'bannerLevel', options: ['info', 'warning', 'critical'], optionPrefix: 'lvl_', place: 'banner', defaultValue: 'info' },
      { name: 'bannerText', type: 'text', label: 'bannerText', localized: true, max: 140, place: 'banner' },
      { name: 'bannerUntil', type: 'datetime', label: 'bannerUntil', place: 'banner' },
      { name: 'eventStart', type: 'datetime', label: 'eventStart', place: 'event' },
      { name: 'eventEnd', type: 'datetime', label: 'eventEnd', place: 'event' },
      SLUG,
      { name: 'sourceUrl', type: 'url', label: 'f_sourceUrl', place: 'advanced' },
    ],
  },
  {
    key: 'documente',
    table: s.documents,
    entityType: 'documents',
    label: 'documents',
    newLabel: ['Document nou', 'Neues Dokument'],
    titleField: 'title',
    titleLocalized: true,
    hasStatus: true,
    hasTranslationState: true,
    sort: 'published',
    listColumn: { name: 'category', optionLabels: CATEGORY_LABELS_RO },
    filters: [{ name: 'category', options: DOCUMENT_CATEGORIES, optionLabels: CATEGORY_LABELS_RO }],
    fields: [
      { name: 'file', type: 'file', label: 'doc_file', help: 'doc_fileHelp', place: 'content' },
      T('title', 'f_title', 200, true),
      TA('description', 'doc_description', 600),
      { name: 'category', type: 'select', label: 'doc_category', options: DOCUMENT_CATEGORIES, optionLabels: CATEGORY_LABELS_RO, place: 'side', required: true, defaultValue: 'alte' },
      { name: 'cycles', type: 'multiselect', label: 'doc_cycles', help: 'doc_cyclesHelp', options: CYCLES, optionPrefix: 'cyc_', place: 'side' },
      { name: 'academicYear', type: 'text', label: 'doc_year', max: 9, place: 'side' },
      { name: 'docLanguage', type: 'select', label: 'doc_language', options: ['ro', 'de', 'en', 'multi'], optionPrefix: 'lang_', place: 'side', defaultValue: 'ro' },
      PUB,
      { name: 'issuedAt', type: 'date', label: 'doc_issued', place: 'side' },
      { name: 'registrationNo', type: 'text', label: 'doc_regNo', max: 60, place: 'side' },
      { name: 'validUntil', type: 'date', label: 'doc_validUntil', place: 'side' },
      ORDER,
    ],
  },
  {
    key: 'ghiduri',
    table: s.guides,
    entityType: 'guides',
    label: 'guides',
    newLabel: ['Ghid nou', 'Neuer Leitfaden'],
    titleField: 'title',
    titleLocalized: true,
    hasStatus: true,
    hasTranslationState: true,
    orderable: true,
    sort: 'sortOrder',
    listColumn: { name: 'kind', optionLabels: GUIDE_LABELS },
    fields: [
      T('title', 'f_title', 160, true),
      TA('lead', 'f_lead', 600),
      MD(),
      { name: 'faqJson', type: 'faq', label: 'faq', place: 'content' },
      { name: 'kind', type: 'select', label: 'guide_kind', options: GUIDE_KINDS, optionLabels: GUIDE_LABELS, place: 'side', required: true, defaultValue: 'clasa-ix' },
      { name: 'academicYear', type: 'text', label: 'doc_year', max: 9, place: 'side' },
      PUB,
      SLUG,
      ORDER,
    ],
  },
  {
    key: 'pasi',
    table: s.guideSteps,
    entityType: 'guide_steps',
    label: 'steps',
    newLabel: ['Pas nou', 'Neuer Schritt'],
    titleField: 'title',
    titleLocalized: true,
    hasStatus: false,
    hasTranslationState: false,
    sort: 'sortOrder',
    hidden: true,
    parent: { entity: 'ghiduri', field: 'guideId' },
    alsoPurge: ['guides'],
    fields: [
      T('title', 'f_title', 160, true),
      T('when', 'step_when', 80),
      MD(),
      { name: 'checklist', column: 'checklistJson', type: 'checklist', label: 'step_checklist', localized: true, place: 'content' },
      { name: 'startsAt', type: 'datetime', label: 'step_starts', place: 'side' },
      { name: 'endsAt', type: 'datetime', label: 'step_ends', place: 'side' },
      { name: 'isDeadline', type: 'checkbox', label: 'step_deadline', place: 'side' },
      { name: 'documentId', type: 'document', label: 'step_document', place: 'side' },
      { name: 'linkUrl', type: 'url', label: 'step_link', place: 'side' },
    ],
  },
  {
    key: 'pagini',
    table: s.pages,
    entityType: 'pages',
    label: 'pages',
    newLabel: ['Pagină nouă', 'Neue Seite'],
    titleField: 'title',
    titleLocalized: true,
    hasStatus: true,
    hasTranslationState: true,
    sort: 'updated',
    listColumn: { name: 'key' },
    fields: [
      T('title', 'f_title', 160, true),
      TA('lead', 'f_lead', 600),
      MD(),
      TA('metaDescription', 'page_meta', 160, 2),
      { name: 'dataJson', type: 'pagedata', label: 'page_facts', place: 'content' },
      { name: 'heroMediaId', type: 'media', label: 'page_hero', place: 'side' },
      PUB,
      { name: 'key', type: 'text', label: 'page_key', max: 40, place: 'advanced', required: true, adminOnly: true },
    ],
  },
  {
    key: 'personal',
    table: s.staff,
    entityType: 'staff',
    label: 'staff',
    newLabel: ['Persoană nouă', 'Neue Person'],
    titleField: 'fullName',
    titleLocalized: false,
    hasStatus: false,
    hasTranslationState: false,
    orderable: true,
    sort: 'sortOrder',
    listColumn: { name: 'category', optionPrefix: 'sc_' },
    filters: [
      { name: 'category', options: STAFF_CATEGORIES, optionPrefix: 'sc_' },
      { name: 'status', options: ['active', 'hidden', 'former'], optionPrefix: 'st_' },
    ],
    fields: [
      { name: 'fullName', type: 'text', label: 's_fullName', max: 120, required: true, place: 'content' },
      { name: 'titlePrefix', type: 'text', label: 's_titlePrefix', max: 40, place: 'content' },
      T('role', 's_role', 160),
      T('subject', 's_subject', 160),
      { name: 'category', type: 'select', label: 's_category', options: STAFF_CATEGORIES, optionPrefix: 'sc_', required: true, place: 'side', defaultValue: 'profesori' },
      { name: 'departmentId', type: 'department', label: 's_department', place: 'side' },
      { name: 'status', type: 'select', label: 'status', options: ['active', 'hidden', 'former'], optionPrefix: 'st_', place: 'side', defaultValue: 'active' },
      { name: 'email', type: 'email', label: 's_email', max: 200, place: 'side' },
      { name: 'showEmail', type: 'checkbox', label: 's_showEmail', place: 'side' },
      { name: 'photoMediaId', type: 'media', label: 's_photo', help: 's_photoHelp', place: 'side' },
      { name: 'photoConsent', type: 'checkbox', label: 's_photoConsent', place: 'side' },
      { name: 'sortName', type: 'text', label: 's_sortName', max: 120, place: 'advanced' },
      ORDER,
    ],
  },
  {
    key: 'catedre',
    table: s.departments,
    entityType: 'staff',
    label: 'departments',
    newLabel: ['Catedră nouă', 'Neuer Fachbereich'],
    titleField: 'name',
    titleLocalized: true,
    hasStatus: false,
    hasTranslationState: false,
    orderable: true,
    sort: 'sortOrder',
    fields: [T('name', 'd_name', 120, true), SLUG, ORDER],
  },
  {
    key: 'proiecte',
    table: s.projects,
    entityType: 'projects',
    label: 'projects',
    newLabel: ['Proiect nou', 'Neues Projekt'],
    titleField: 'title',
    titleLocalized: true,
    hasStatus: true,
    hasTranslationState: true,
    publicRoute: 'project',
    orderable: true,
    sort: 'sortOrder',
    listColumn: { name: 'kind', optionLabels: PROJECT_LABELS },
    filters: [{ name: 'kind', options: PROJECT_KINDS, optionLabels: PROJECT_LABELS }],
    fields: [
      T('title', 'f_title', 160, true),
      TA('summary', 'f_summary', 300),
      MD(),
      { name: 'kind', type: 'select', label: 'f_kind', options: PROJECT_KINDS, optionLabels: PROJECT_LABELS, place: 'side', required: true, defaultValue: 'alte' },
      { name: 'period', type: 'text', label: 'p_period', max: 60, place: 'side' },
      { name: 'partners', type: 'textarea', label: 'p_partners', max: 600, rows: 2, place: 'side' },
      { name: 'funding', type: 'text', label: 'p_funding', max: 160, place: 'side' },
      COVER,
      { name: 'galleryId', type: 'gallery', label: 'p_gallery', place: 'side' },
      { name: 'externalUrl', type: 'url', label: 'p_external', place: 'side' },
      PUB,
      SLUG,
      ORDER,
    ],
  },
  {
    key: 'viata-scolara',
    table: s.studentLife,
    entityType: 'student_life',
    label: 'life',
    newLabel: ['Intrare nouă', 'Neuer Eintrag'],
    titleField: 'title',
    titleLocalized: true,
    hasStatus: true,
    hasTranslationState: true,
    publicRoute: 'lifeEntry',
    orderable: true,
    sort: 'sortOrder',
    listColumn: { name: 'kind', optionLabels: LIFE_LABELS },
    filters: [{ name: 'kind', options: LIFE_KINDS, optionLabels: LIFE_LABELS }],
    fields: [
      T('title', 'f_title', 160, true),
      TA('summary', 'f_summary', 300),
      MD(),
      { name: 'kind', type: 'select', label: 'f_kind', options: LIFE_KINDS, optionLabels: LIFE_LABELS, place: 'side', required: true, defaultValue: 'alte' },
      COVER,
      { name: 'galleryId', type: 'gallery', label: 'p_gallery', place: 'side' },
      PUB,
      SLUG,
      ORDER,
    ],
  },
  {
    key: 'istorie',
    table: s.timelineEvents,
    entityType: 'timeline',
    label: 'timeline',
    newLabel: ['Moment nou', 'Neues Ereignis'],
    titleField: 'title',
    titleLocalized: true,
    hasStatus: true,
    hasTranslationState: true,
    sort: 'year',
    listColumn: { name: 'year' },
    fields: [
      T('title', 'f_title', 160, true),
      TA('body', 'f_body', 1200, 5),
      { name: 'year', type: 'number', label: 't_year', required: true, place: 'side' },
      { name: 'yearLabel', type: 'text', label: 't_yearLabel', max: 30, place: 'side' },
      { name: 'era', type: 'select', label: 't_era', options: ['origins', 'honterus', 'saxon', 'modern', 'today'], optionPrefix: 'era_', place: 'side', defaultValue: 'modern' },
      { name: 'highlight', type: 'checkbox', label: 't_highlight', place: 'side' },
      { name: 'mediaId', type: 'media', label: 't_image', place: 'side' },
      { name: 'sourceUrl', type: 'url', label: 'f_sourceUrl', place: 'side' },
    ],
  },
  {
    key: 'galerii',
    table: s.galleries,
    entityType: 'galleries',
    label: 'galleries',
    newLabel: ['Galerie nouă', 'Neue Galerie'],
    titleField: 'title',
    titleLocalized: true,
    hasStatus: true,
    hasTranslationState: true,
    publicRoute: 'galleryItem',
    orderable: true,
    sort: 'sortOrder',
    fields: [
      T('title', 'f_title', 160, true),
      TA('description', 'g_description', 600),
      COVER,
      { name: 'eventDate', type: 'date', label: 'g_eventDate', place: 'side' },
      PUB,
      SLUG,
      ORDER,
    ],
  },
];

export const entityByKey = (k: string | undefined) => ENTITIES.find((e) => e.key === k);
export const hasField = (e: EntityDef, name: string) => e.fields.some((f) => f.name === name);
