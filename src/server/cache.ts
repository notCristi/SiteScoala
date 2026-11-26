/**
 * Edge cache tags (docs/04 §4.4). Every public page carries `site` + `layout` + section tags;
 * publishing in /admin purges only the tags it affects, so edits are live in seconds.
 */
import type { Match } from '~/i18n/routes';

const SECTION: Partial<Record<Match['id'], string[]>> = {
  home: ['home', 'ann', 'docs', 'guides', 'timeline', 'life', 'proj', 'pages'],
  news: ['ann'],
  article: ['ann'],
  documents: ['docs'],
  admissions: ['guides', 'pages'],
  guide: ['guides', 'docs'],
  staff: ['staff', 'pages'],
  history: ['timeline', 'pages'],
  life: ['life', 'pages'],
  lifeEntry: ['life'],
  coetus: ['life', 'pages'],
  projects: ['proj', 'pages'],
  project: ['proj'],
  gallery: ['gal'],
  galleryItem: ['gal'],
  search: ['ann', 'docs', 'guides', 'staff', 'pages', 'life', 'proj'],
};

export function cacheTagsFor(m: Match): string[] {
  return ['site', 'layout', ...(SECTION[m.id] ?? ['pages'])];
}

/** Tags to purge when an entity type changes. `layout` covers banners/settings shown on every page. */
export const PURGE_TAGS: Record<string, string[]> = {
  announcements: ['ann', 'home', 'sitemap', 'search'],
  banner: ['layout'],
  documents: ['docs', 'home', 'search'],
  guides: ['guides', 'home', 'search'],
  staff: ['staff', 'search'],
  pages: ['pages', 'search'],
  timeline: ['timeline', 'home'],
  student_life: ['life', 'home', 'search'],
  projects: ['proj', 'home', 'search'],
  galleries: ['gal'],
  media: ['site'],
  settings: ['layout'],
  redirects: ['site'],
};
