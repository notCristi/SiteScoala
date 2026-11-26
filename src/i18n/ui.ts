/**
 * Interface strings in RO / DE / EN. Long-form content lives in D1 (editable in /admin);
 * only chrome, labels and fixed microcopy live here.
 */
import type { Locale } from './locales';

type Dict = Record<Locale, string>;
const d = (ro: string, de: string, en: string): Dict => ({ ro, de, en });

export const UI = {
  schoolShort: d('Colegiul Național „Johannes Honterus”', 'Honterus-Nationalkolleg', '“Johannes Honterus” National College'),
  schoolKicker: d('Colegiul Național', 'Nationalkolleg', 'National College'),
  schoolFull: d(
    'Colegiul Național „Johannes Honterus” Brașov',
    'Johannes-Honterus-Nationalkolleg Kronstadt',
    '“Johannes Honterus” National College, Brașov',
  ),
  city: d('Brașov', 'Kronstadt', 'Brașov'),
  skip: d('Sari la conținut', 'Zum Inhalt springen', 'Skip to content'),
  home: d('Acasă', 'Startseite', 'Home'),
  menu: d('Meniu', 'Menü', 'Menu'),
  close: d('Închide', 'Schließen', 'Close'),
  search: d('Caută', 'Suche', 'Search'),
  searchPlaceholder: d(
    'Caută pagini, documente, profesori…',
    'Seiten, Dokumente, Lehrkräfte suchen …',
    'Search pages, documents, staff…',
  ),
  searchHint: d('Tastează cel puțin 2 litere', 'Mindestens 2 Buchstaben eingeben', 'Type at least 2 letters'),
  searchNoResults: d('Niciun rezultat pentru', 'Keine Treffer für', 'No results for'),
  searchResults: d('rezultate', 'Treffer', 'results'),
  searchGroups: {
    page: d('Pagini', 'Seiten', 'Pages'),
    guide: d('Admitere & examene', 'Aufnahme & Prüfungen', 'Admissions & exams'),
    document: d('Documente', 'Dokumente', 'Documents'),
    person: d('Persoane', 'Personen', 'People'),
    news: d('Noutăți', 'Aktuelles', 'News'),
  },
  language: d('Limba', 'Sprache', 'Language'),
  languageMissing: d(
    'Această pagină nu este încă tradusă; afișăm textul original în limba română.',
    'Diese Seite ist noch nicht übersetzt; Sie sehen den rumänischen Originaltext.',
    'This page has not been translated yet; the original Romanian text is shown.',
  ),
  external: d('(se deschide pe alt site)', '(öffnet eine externe Seite)', '(opens an external site)'),
  readMore: d('Citește', 'Weiterlesen', 'Read'),
  allNews: d('Toate noutățile', 'Alle Meldungen', 'All news'),
  download: d('Descarcă', 'Herunterladen', 'Download'),
  open: d('Deschide', 'Öffnen', 'Open'),
  back: d('Înapoi', 'Zurück', 'Back'),
  updated: d('Actualizat', 'Aktualisiert', 'Updated'),
  published: d('Publicat', 'Veröffentlicht', 'Published'),
  source: d('Sursa', 'Quelle', 'Source'),
  photo: d('Foto', 'Foto', 'Photo'),
  playVideo: d('Redă videoclipul', 'Video abspielen', 'Play video'),
  videoConsent: d(
    'Videoclipul se încarcă de pe YouTube la clic.',
    'Das Video wird erst beim Klick von YouTube geladen.',
    'The video loads from YouTube only when you click.',
  ),
  notFoundTitle: d('Pagina nu a fost găsită', 'Seite nicht gefunden', 'Page not found'),
  notFoundBody: d(
    'Adresa nu există sau a fost mutată după reorganizarea site-ului. Încercați căutarea sau porniți de la pagina principală.',
    'Diese Adresse gibt es nicht oder sie wurde bei der Neugestaltung der Website verschoben. Nutzen Sie die Suche oder beginnen Sie auf der Startseite.',
    'This address does not exist or moved when the website was rebuilt. Try the search or start from the home page.',
  ),
  platforms: d('Platforme', 'Plattformen', 'Platforms'),
  gradebook: d('Catalog electronic', 'Elektronisches Notenbuch', 'Electronic gradebook'),
  classroom: d('Google Classroom', 'Google Classroom', 'Google Classroom'),
  documents: d('Documente', 'Dokumente', 'Documents'),
  contact: d('Contact', 'Kontakt', 'Contact'),
  address: d('Adresa', 'Anschrift', 'Address'),
  phone: d('Telefon', 'Telefon', 'Phone'),
  fax: d('Fax', 'Fax', 'Fax'),
  email: d('E-mail', 'E-Mail', 'Email'),
  hours: d('Program secretariat', 'Sprechzeiten des Sekretariats', 'Office hours'),
  map: d('Vezi pe hartă', 'Auf der Karte ansehen', 'View on map'),
  founded: d('Fondat în 1541 de Johannes Honterus', 'Gegründet 1541 von Johannes Honterus', 'Founded in 1541 by Johannes Honterus'),
  colophon: d(
    'Typis Coronensibus — cules în EB Garamond și Atkinson Hyperlegible.',
    'Typis Coronensibus — gesetzt aus der EB Garamond und der Atkinson Hyperlegible.',
    'Typis Coronensibus — set in EB Garamond and Atkinson Hyperlegible.',
  ),
  quickLinks: d('Acces rapid', 'Schnellzugriff', 'Quick links'),
  institution: d('Instituție', 'Institution', 'Institution'),
  publicInfo: d('Informații de interes public', 'Öffentliche Informationen', 'Public information'),
  privacy: d('Confidențialitate', 'Datenschutz', 'Privacy'),
  accessibility: d('Accesibilitate', 'Barrierefreiheit', 'Accessibility'),
  audiencesTitle: d('Pentru cine căutați?', 'Wofür suchen Sie?', 'What brings you here?'),
  steps: d('Pașii', 'Schritte', 'Steps'),
  step: d('Pasul', 'Schritt', 'Step'),
  when: d('Când', 'Wann', 'When'),
  bring: d('Ce pregătiți', 'Was Sie brauchen', 'What you need'),
  faq: d('Întrebări frecvente', 'Häufige Fragen', 'Frequently asked questions'),
  stateUpcoming: d('Urmează', 'Demnächst', 'Upcoming'),
  stateOpen: d('În desfășurare', 'Läuft', 'Open now'),
  stateClosed: d('Încheiat', 'Abgeschlossen', 'Closed'),
  markDone: d('Bifat', 'Erledigt', 'Done'),
  relatedDocs: d('Documente utile', 'Zugehörige Dokumente', 'Related documents'),
  filterAll: d('Toate', 'Alle', 'All'),
  filterCategory: d('Categorie', 'Kategorie', 'Category'),
  filterYear: d('An școlar', 'Schuljahr', 'School year'),
  filterCycle: d('Ciclu', 'Schulstufe', 'Stage'),
  filterText: d('Filtrează după titlu', 'Nach Titel filtern', 'Filter by title'),
  clearFilters: d('Șterge filtrele', 'Filter zurücksetzen', 'Clear filters'),
  docTitle: d('Document', 'Dokument', 'Document'),
  docDate: d('Data', 'Datum', 'Date'),
  docFormat: d('Format', 'Format', 'Format'),
  docsCount: d('documente', 'Dokumente', 'documents'),
  staffFilter: d('Caută după nume sau disciplină', 'Nach Name oder Fach suchen', 'Search by name or subject'),
  staffNoPhotos: d(
    'Fotografiile apar doar cu acordul fiecărei persoane.',
    'Fotos erscheinen nur mit Einverständnis der jeweiligen Person.',
    'Photos appear only with each person’s consent.',
  ),
  cycles: {
    primar: d('Învățământ primar', 'Grundschule', 'Primary school'),
    gimnazial: d('Învățământ gimnazial', 'Gymnasialstufe', 'Lower secondary'),
    liceal: d('Învățământ liceal', 'Lyzealstufe', 'Upper secondary'),
  },
  grades: {
    primar: d('Clasa pregătitoare – a IV-a', 'Vorbereitungsklasse – 4. Klasse', 'Preparatory year – Year 4'),
    gimnazial: d('Clasele a V-a – a VIII-a', '5. – 8. Klasse', 'Years 5 – 8'),
    liceal: d('Clasele a IX-a – a XII-a', '9. – 12. Klasse', 'Years 9 – 12'),
  },
  audiences: {
    elevi: d('Elevi', 'Schülerinnen und Schüler', 'Students'),
    parinti: d('Părinți', 'Eltern', 'Parents'),
    viitori: d('Viitori elevi', 'Künftige Schüler', 'Prospective students'),
    profesori: d('Profesori', 'Lehrkräfte', 'Teachers'),
  },
} as const;

export type UIKey = keyof typeof UI;

/** Resolve a UI string (supports nested keys like 'cycles.primar'). */
export function ui(locale: Locale, key: string): string {
  const v = key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], UI);
  return (v as Dict | undefined)?.[locale] ?? key;
}
