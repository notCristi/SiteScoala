export const LOCALES = ['ro', 'de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ro';

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);

/** Languages are named in their own language, never with flags (docs/03 §1.12). */
export const LOCALE_META: Record<Locale, { endonym: string; short: string; htmlLang: string; ogLocale: string; intl: string }> = {
  ro: { endonym: 'Română', short: 'RO', htmlLang: 'ro', ogLocale: 'ro_RO', intl: 'ro-RO' },
  de: { endonym: 'Deutsch', short: 'DE', htmlLang: 'de', ogLocale: 'de_DE', intl: 'de-DE' },
  en: { endonym: 'English', short: 'EN', htmlLang: 'en-GB', ogLocale: 'en_GB', intl: 'en-GB' },
};

/** Field suffix used by per-language DB columns (title_ro → titleRo). */
export const SUFFIX: Record<Locale, 'Ro' | 'De' | 'En'> = { ro: 'Ro', de: 'De', en: 'En' };

/**
 * Pick the localized value of a field, falling back to Romanian.
 * Returns the language actually used so the markup can set lang="ro" on fallback text.
 */
export function pick<T extends Record<string, unknown>>(
  row: T,
  field: string,
  locale: Locale,
): { value: string; lang: Locale; fallback: boolean } {
  const own = row[`${field}${SUFFIX[locale]}`];
  if (typeof own === 'string' && own.trim() !== '') return { value: own, lang: locale, fallback: false };
  const ro = row[`${field}Ro`];
  return { value: typeof ro === 'string' ? ro : '', lang: 'ro', fallback: locale !== 'ro' };
}

/** Shorthand returning only the string. */
export const t = <T extends Record<string, unknown>>(row: T, field: string, locale: Locale) => pick(row, field, locale).value;

const TZ = 'Europe/Bucharest';
export function formatDate(ms: number | null | undefined, locale: Locale, style: 'long' | 'short' | 'day-month' | 'month-year' = 'long') {
  if (!ms) return '';
  const opts: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }
      : style === 'short'
        ? { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }
        : style === 'day-month'
          ? { day: 'numeric', month: 'long', timeZone: TZ }
          : { month: 'long', year: 'numeric', timeZone: TZ };
  return new Intl.DateTimeFormat(LOCALE_META[locale].intl, opts).format(new Date(ms));
}

export function dateParts(ms: number, locale: Locale) {
  const d = new Date(ms);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(LOCALE_META[locale].intl, { ...o, timeZone: TZ }).format(d);
  return { day: f({ day: 'numeric' }), month: f({ month: 'short' }).replace('.', ''), year: f({ year: 'numeric' }), iso: d.toISOString() };
}

export function formatBytes(n: number | null | undefined, locale: Locale) {
  if (!n) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${new Intl.NumberFormat(LOCALE_META[locale].intl, { maximumFractionDigits: v < 10 && i > 0 ? 1 : 0 }).format(v)} ${units[i]}`;
}
