/**
 * Primary navigation (≤ 6 items, Admitere first, Contact last — docs/03 §3.1, D-01)
 * and audience router (D-05). Every link is a RouteId so it is valid in all languages.
 */
import type { Locale } from './locales';
import type { GuideKind, RouteId } from './routes';

type L = Record<Locale, string>;
const l = (ro: string, de: string, en: string): L => ({ ro, de, en });

export interface NavLink {
  label: L;
  route: RouteId;
  params?: Record<string, string>;
  note?: L;
}
export interface NavColumn {
  title: L;
  emblem?: 'primar' | 'gimnaziu' | 'liceu' | 'dsd' | 'coetus' | 'press';
  links: NavLink[];
}
export interface NavItem {
  id: string;
  label: L;
  route: RouteId;
  /** route ids that mark this item as current */
  match: RouteId[];
  columns?: NavColumn[];
  feature?: { kicker: L; text: L; route: RouteId; params?: Record<string, string> };
}

const guide = (kind: GuideKind, label: L, note?: L): NavLink => ({ label, route: 'guide', params: { kind }, ...(note ? { note } : {}) });

export const NAV: NavItem[] = [
  {
    id: 'admitere',
    label: l('Admitere', 'Aufnahme', 'Admissions'),
    route: 'admissions',
    match: ['admissions', 'guide'],
    columns: [
      {
        title: l('Înscriere', 'Anmeldung', 'Enrolment'),
        links: [
          guide('pregatitoare', l('Clasa pregătitoare', 'Vorbereitungsklasse', 'Preparatory class'), l('cu evaluarea limbii germane', 'mit Deutsch-Einstufung', 'with German assessment')),
          guide('clasa-v', l('Clasa a V-a', '5. Klasse', 'Year 5')),
          guide('clasa-ix', l('Clasa a IX-a (liceu)', '9. Klasse (Lyzeum)', 'Year 9 (upper secondary)'), l('proba de limba germană', 'Deutschprüfung', 'German language test')),
          guide('transfer', l('Transferuri', 'Schulwechsel', 'Transfers')),
        ],
      },
      {
        title: l('Examene', 'Prüfungen', 'Examinations'),
        links: [
          guide('evaluare-nationala', l('Evaluarea Națională', 'Nationale Evaluierung', 'National Assessment')),
          guide('bacalaureat', l('Bacalaureat', 'Bakkalaureat', 'Baccalaureate')),
          guide('dsd', l('Diploma de limba germană (DSD)', 'Deutsches Sprachdiplom (DSD)', 'German Language Diploma (DSD)')),
          guide('olimpiade', l('Olimpiade și concursuri', 'Olympiaden und Wettbewerbe', 'Olympiads and competitions')),
        ],
      },
    ],
    feature: {
      kicker: l('Primul pas', 'Der erste Schritt', 'The first step'),
      text: l(
        'Copilul începe școala? Totul despre înscrierea în clasa pregătitoare, pas cu pas.',
        'Ihr Kind kommt in die Schule? Die Anmeldung zur Vorbereitungsklasse, Schritt für Schritt.',
        'Is your child starting school? Enrolment in the preparatory class, step by step.',
      ),
      route: 'guide',
      params: { kind: 'pregatitoare' },
    },
  },
  {
    id: 'scoala',
    label: l('Școala', 'Schule', 'Our school'),
    route: 'school',
    match: ['school', 'history', 'honterus', 'campus', 'staff'],
    columns: [
      {
        title: l('Despre noi', 'Über uns', 'About us'),
        links: [
          { label: l('Colegiul pe scurt', 'Das Kolleg im Überblick', 'The college at a glance'), route: 'school' },
          { label: l('Istorie: 1541 – azi', 'Geschichte: 1541 bis heute', 'History: 1541 to today'), route: 'history' },
          { label: l('Johannes Honterus', 'Johannes Honterus', 'Johannes Honterus'), route: 'honterus' },
          { label: l('Curtea Honterus', 'Der Honterushof', 'The Honterus Courtyard'), route: 'campus' },
        ],
      },
      {
        title: l('Oameni', 'Menschen', 'People'),
        links: [
          { label: l('Conducere și personal', 'Schulleitung und Kollegium', 'Leadership and staff'), route: 'staff' },
          { label: l('Documente oficiale', 'Offizielle Dokumente', 'Official documents'), route: 'documents' },
        ],
      },
    ],
    feature: {
      kicker: l('Annales', 'Annales', 'Annales'),
      text: l(
        'De la școala parohială din 1388 la colegiul de azi: istoria în 20 de momente.',
        'Von der Pfarrschule von 1388 bis zum heutigen Kolleg: die Geschichte in 20 Stationen.',
        'From the parish school of 1388 to today’s college: our history in twenty moments.',
      ),
      route: 'history',
    },
  },
  {
    id: 'educatie',
    label: l('Educație', 'Bildung', 'Education'),
    route: 'education',
    match: ['education', 'primar', 'gimnaziu', 'liceu', 'german', 'projects', 'project'],
    columns: [
      {
        title: l('Cicluri', 'Schulstufen', 'Stages'),
        links: [
          { label: l('Primar · P – IV', 'Grundschule · V – 4', 'Primary · P – 4'), route: 'primar' },
          { label: l('Gimnaziu · V – VIII', 'Gymnasialstufe · 5 – 8', 'Lower secondary · 5 – 8'), route: 'gimnaziu' },
          { label: l('Liceu · IX – XII', 'Lyzealstufe · 9 – 12', 'Upper secondary · 9 – 12'), route: 'liceu' },
        ],
      },
      {
        title: l('Profil german', 'Deutsches Profil', 'German profile'),
        links: [
          { label: l('Limba germană și DSD', 'Deutsch und DSD', 'German and the DSD'), route: 'german' },
          { label: l('Proiecte și Erasmus+', 'Projekte und Erasmus+', 'Projects and Erasmus+'), route: 'projects' },
        ],
      },
    ],
  },
  {
    id: 'viata',
    label: l('Viața școlară', 'Schulleben', 'School life'),
    route: 'life',
    match: ['life', 'coetus', 'lifeEntry', 'gallery', 'galleryItem'],
    columns: [
      {
        title: l('Comunitate', 'Gemeinschaft', 'Community'),
        links: [
          { label: l('Coetus, din 1543', 'Coetus, seit 1543', 'Coetus, since 1543'), route: 'coetus' },
          { label: l('Toate activitățile', 'Alle Aktivitäten', 'All activities'), route: 'life' },
          { label: l('Galerie', 'Galerie', 'Gallery'), route: 'gallery' },
        ],
      },
    ],
  },
  { id: 'noutati', label: l('Noutăți', 'Aktuelles', 'News'), route: 'news', match: ['news', 'article'] },
  { id: 'contact', label: l('Contact', 'Kontakt', 'Contact'), route: 'contact', match: ['contact'] },
];

/** Audience router (home page). External links use `href`. */
export interface AudienceLink {
  label: L;
  route?: RouteId;
  params?: Record<string, string>;
  query?: Record<string, string>;
  href?: 'noteInCatalog' | 'classroom';
}
export const AUDIENCES: { id: 'elevi' | 'parinti' | 'viitori' | 'profesori'; links: AudienceLink[] }[] = [
  {
    id: 'viitori',
    links: [
      { label: l('Clasa pregătitoare', 'Vorbereitungsklasse', 'Preparatory class'), route: 'guide', params: { kind: 'pregatitoare' } },
      { label: l('Clasa a V-a', '5. Klasse', 'Year 5'), route: 'guide', params: { kind: 'clasa-v' } },
      { label: l('Clasa a IX-a', '9. Klasse', 'Year 9'), route: 'guide', params: { kind: 'clasa-ix' } },
      { label: l('Transferuri', 'Schulwechsel', 'Transfers'), route: 'guide', params: { kind: 'transfer' } },
      { label: l('Oferta educațională', 'Bildungsangebot', 'What we offer'), route: 'education' },
    ],
  },
  {
    id: 'parinti',
    links: [
      { label: l('Catalogul electronic', 'Elektronisches Notenbuch', 'Electronic gradebook'), href: 'noteInCatalog' },
      { label: l('Formulare și cereri', 'Formulare und Anträge', 'Forms and applications'), route: 'documents', query: { cat: 'formulare' } },
      { label: l('Burse', 'Stipendien', 'Grants'), route: 'documents', query: { cat: 'burse' } },
      { label: l('Evaluarea Națională', 'Nationale Evaluierung', 'National Assessment'), route: 'guide', params: { kind: 'evaluare-nationala' } },
      { label: l('Contact secretariat', 'Sekretariat kontaktieren', 'Contact the office'), route: 'contact' },
    ],
  },
  {
    id: 'elevi',
    links: [
      { label: l('Catalogul electronic', 'Elektronisches Notenbuch', 'Electronic gradebook'), href: 'noteInCatalog' },
      { label: l('Google Classroom', 'Google Classroom', 'Google Classroom'), href: 'classroom' },
      { label: l('Bacalaureat', 'Bakkalaureat', 'Baccalaureate'), route: 'guide', params: { kind: 'bacalaureat' } },
      { label: l('DSD I și II', 'DSD I und II', 'DSD I and II'), route: 'guide', params: { kind: 'dsd' } },
      { label: l('Coetus și Consiliul Elevilor', 'Coetus und Schülerrat', 'Coetus and the Student Council'), route: 'coetus' },
    ],
  },
  {
    id: 'profesori',
    links: [
      { label: l('Google Classroom', 'Google Classroom', 'Google Classroom'), href: 'classroom' },
      { label: l('Catalogul electronic', 'Elektronisches Notenbuch', 'Electronic gradebook'), href: 'noteInCatalog' },
      { label: l('Documente și regulamente', 'Dokumente und Ordnungen', 'Documents and regulations'), route: 'documents' },
      { label: l('Proiecte Erasmus+', 'Erasmus+-Projekte', 'Erasmus+ projects'), route: 'projects' },
      { label: l('Personal și catedre', 'Kollegium und Fachbereiche', 'Staff and departments'), route: 'staff' },
    ],
  },
];
