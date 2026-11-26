/**
 * Counted nouns for live regions and labels ("8 persoane", "1 Treffer", "21 de documente").
 * Shared by server templates and the small client islands (pass `COUNT_FORMS[kind][locale]` as a data attribute).
 */
import { LOCALE_META, type Locale } from './locales';

/** CLDR plural categories used by ro/de/en: one · few (ro only) · other. */
export interface CountForms {
  one: string;
  few?: string;
  other: string;
}

const f = (one: string, other: string, few?: string): CountForms => ({ one, other, ...(few ? { few } : {}) });

export const COUNT_FORMS = {
  people: { ro: f('persoană', 'de persoane', 'persoane'), de: f('Person', 'Personen'), en: f('person', 'people') },
  results: { ro: f('rezultat', 'de rezultate', 'rezultate'), de: f('Treffer', 'Treffer'), en: f('result', 'results') },
  documents: { ro: f('document', 'de documente', 'documente'), de: f('Dokument', 'Dokumente'), en: f('document', 'documents') },
} satisfies Record<string, Record<Locale, CountForms>>;

export type CountKind = keyof typeof COUNT_FORMS;

/** Works in the browser too: `countLabel(n, 'ro-RO', forms)`. */
export function countWith(n: number, intl: string, forms: CountForms): string {
  const cat = new Intl.PluralRules(intl).select(n);
  const word = cat === 'one' ? forms.one : cat === 'few' ? (forms.few ?? forms.other) : forms.other;
  return `${new Intl.NumberFormat(intl).format(n)} ${word}`;
}

export const count = (n: number, locale: Locale, kind: CountKind) => countWith(n, LOCALE_META[locale].intl, COUNT_FORMS[kind][locale]);
