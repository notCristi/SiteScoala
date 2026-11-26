import type { Locale } from '~/i18n/locales';
import type { Match } from '~/i18n/routes';
import type { Announcement, SiteSettings } from '~/server/content';

export interface ViewProps {
  locale: Locale;
  match: Match;
  alternates: Record<Locale, string>;
  settings: SiteSettings;
  banners: Announcement[];
  entity?: unknown;
}
