import type { Locale } from '~/i18n/locales';
import type { DocumentCategory } from '~/db/schema';

type L = Record<Locale, string>;
const l = (ro: string, de: string, en: string): L => ({ ro, de, en });

/** Display order + labels of document categories (no timetable category exists). */
export const CATEGORY_LABELS: Record<DocumentCategory, L> = {
  regulamente: l('Regulamente', 'Ordnungen und Satzungen', 'Regulations'),
  strategie: l('Strategie și planificare (PDI, PAS)', 'Strategie und Planung (PDI, PAS)', 'Strategy and planning (PDI, PAS)'),
  rapoarte: l('Rapoarte', 'Berichte', 'Reports'),
  oferta: l('Oferta educațională', 'Bildungsangebot', 'Educational offer'),
  admitere: l('Admitere și înscrieri', 'Aufnahme und Anmeldung', 'Admissions and enrolment'),
  examene: l('Examene', 'Prüfungen', 'Examinations'),
  buget: l('Buget și salarizare', 'Haushalt und Besoldung', 'Budget and salaries'),
  declaratii: l('Declarații de avere și interese', 'Vermögens- und Interessenerklärungen', 'Declarations of assets and interests'),
  posturi: l('Posturi și concursuri', 'Stellen und Auswahlverfahren', 'Vacancies and competitions'),
  dezbateri: l('Dezbateri publice', 'Öffentliche Konsultationen', 'Public consultations'),
  achizitii: l('Achiziții publice', 'Öffentliche Beschaffung', 'Public procurement'),
  formulare: l('Formulare și cereri', 'Formulare und Anträge', 'Forms and applications'),
  burse: l('Burse', 'Stipendien', 'Grants and bursaries'),
  calendar: l('Structura anului școlar', 'Gliederung des Schuljahres', 'School-year calendar'),
  gdpr: l('Protecția datelor', 'Datenschutz', 'Data protection'),
  alte: l('Alte documente', 'Weitere Dokumente', 'Other documents'),
};

export interface DocLike {
  r2Key: string | null;
  externalUrl: string | null;
}
/** Public URL of a document: R2 object (/files/…) or the legacy file until it is re-uploaded. */
export const docUrl = (d: DocLike) => (d.r2Key ? `/${d.r2Key}` : (d.externalUrl ?? '#'));
