# 01 — Conținutul site-ului vechi și harta de migrare

**Sursa:** https://liceulhonterusbrasov.ro/ (301 → https://liceulhonterusbrasov.ro/lic/) · **Data auditului:** 26.11.2026 · **Date structurate:** [`docs/data/legacy-content.json`](data/legacy-content.json)

> Conținutul despre **orar** (pagina „ORAR” și fișierele `orar-*.pdf`) a fost doar inventariat și este **exclus din migrare**.

## Cuprins
(a) Metodă și acoperire · (b) Arborele URL · (c) Conținut instituțional curățat · (d) Contacte · (e) Structura personalului · (f) Inventar documente · (g) Inventar anunțuri · (h) Platforme externe verificate · (i) Tabel de redirecționări 301 · (j) Lacune și observații

## (a) Metoda de crawl și statistici de acoperire

- **Platformă:** WordPress (temă cu „huge-it slider/gallery”, plugin WP Table Builder), server LiteSpeed, instalat în subdirectorul `/lic/`. Domeniul rădăcină, `www.` și `http://` redirecționează 301 către `https://liceulhonterusbrasov.ro/lic/`. Site-ul are o protecție anti-bot („One moment, please…”) care apare intermitent; cererile blocate au fost reîncercate cu pauze.
- **Surse folosite:**
  - `GET /lic/wp-json/wp/v2/pages?per_page=100` → **34 de pagini** (toate publicate; răspunsul JSON era precedat de CSS injectat de un plugin – curățat la parsare).
  - `GET /lic/wp-json/wp/v2/posts` → **0 articole** (site-ul nu folosește articole WP; „anunțurile” sunt blocuri de text pe pagina ANUNȚURI și pe paginile de examene).
  - `GET /lic/wp-json/wp/v2/categories` → 2 categorii goale (ANUNTURI, Uncategorized); `tags` → 0; tipuri de conținut: post, page, attachment, wp_block, wptb-tables (0 tabele).
  - `GET /lic/wp-json/wp/v2/media` (9 pagini × 100) → **878 de fișiere media**: 442 PDF, 107 DOCX, 8 DOC, 1 XLSX, 5 PPTX, 1 PPSX, 5 MP4, 309 imagini.
  - `/lic/wp-sitemap.xml` → `wp-sitemap-posts-page-1.xml` (34 URL-uri, identic cu API-ul) + sitemap utilizatori (neprocesat – date personale).
  - HTML-ul randat al fiecăreia dintre cele 34 de pagini + pagina de start (meniu principal, meniu footer, bara de sus, footer) – conținutul extras din `div.internal_post_con`.
  - Text extras din PDF-uri-cheie (PDI 2021-2026, Ofertă educațională 2018-19 și 2024-25, Organigramă, Încadrare 2024-25, DSD) pentru a completa misiunea/viziunea și structura personalului.
- **Linkuri:** 417 URL-uri unice găsite în conținutul paginilor; toate verificate HTTP (HEAD, cu redirect-uri urmate, pauză 0,3 s): **000**: 7, **200**: 389, **400**: 1, **403**: 1, **404**: 11, **503**: 3, **skip**: 5 („000” = gazdă inaccesibilă/timeout din mediul de audit; „skip” = YouTube/Facebook, verificate separat).
- **Documente:** {len(B['docs'])} legături către fișiere (PDF/DOC/DOCX/XLSX/PPTX/MP4) pe pagini + {len(B['orph'])} fișiere non-imagine din biblioteca media **nelegate de nicio pagină** („orfane”) – total {nonimg} fișiere non-imagine în biblioteca media.
- **Anunțuri:** {len(B['news'])} anunțuri individuale reconstituite (datate) din blocurile paginii ANUNȚURI și secțiunile anuale ale paginilor de examene/admitere/proiecte.
- **Acoperire:** 100% din paginile publicate (34/34) + pagina de start; 100% din biblioteca media (inventariată); 100% din linkurile din conținut verificate. Nu există pagini ascunse în afara meniului (toate cele 34 sunt în meniu sau sub-meniu).
- **Fișiere brute (scratch, nu în repo):** `/tmp/claude-0/legacy-crawl/` (html/, txt/, pages_clean.json, media_all.json, segments.json, status.tsv).

## (b) Arborele complet de URL-uri al site-ului vechi

Titlurile sunt cele din meniu / titlul paginii (cu majuscule, ca pe site). „ID” = `page_id` WordPress. Ordinea urmează meniul principal.

- `https://liceulhonterusbrasov.ro/` → 301 → `/lic/`
- **ACASA** — `/lic/` (ID 30, modificat 2021-07-13)
- **DESPRE NOI** — `/lic/despre-noi/` (ID 10, modificat 2025-11-27)
  - **JOHANNES HONTERUS** — `/lic/despre-noi/johannes-honterus/` (ID 12, modificat 2021-10-13)
  - **BISERICA NEAGRA** — `/lic/despre-noi/biserica-neagra/` (ID 24, modificat 2017-04-07)
  - **BIBLIOTECA** — `/lic/despre-noi/biblioteca/` (ID 26, modificat 2017-04-07)
  - **LICEUL HONTERUS** — `/lic/despre-noi/anuar-2015-2016/` (ID 522, modificat 2019-11-22)
- **DOCUMENTE** — `/lic/informatii/` (ID 40, modificat 2017-10-09)
  - **DEZBATERE PUBLICA** — `/lic/informatii/dezbatere-publica/` (ID 182, modificat 2022-10-27)
  - **DOCUMENTE UTILE** — `/lic/informatii/documente-utile/` (ID 45, modificat 2026-07-31)
  - **OFERTA EDUCAȚIONALĂ** — `/lic/informatii/formulare-2/` (ID 3040, modificat 2026-04-20)
  - **FORMULARE (nu apare în meniu)** — `/lic/informatii/oferta-educationala/` (ID 3659, modificat 2024-04-09)
- **PERSONAL** — `/lic/personal/` (ID 52, modificat 2017-04-07)
  - **CONDUCERE** — `/lic/personal/conducere/` (ID 386, modificat 2022-10-24)
  - **PROFESORI** — `/lic/personal/profesori/` (ID 389, modificat 2024-11-29)
  - **DIDACTIC AUXILIAR** — `/lic/personal/didactic-auxiliar/` (ID 392, modificat 2019-06-13)
  - **NEDIDACTIC** — `/lic/personal/nedidactic/` (ID 395, modificat 2019-06-13)
- **ELEVI (în sub-meniu: „PROFESORI DIN GERMANIA”)** — `/lic/elevi/` (ID 423, modificat 2020-03-04)
- **EXAMENE ȘI CONCURSURI** — `/lic/examene/` (ID 293, modificat 2018-07-06)
  - **ADMITERE LICEU** — `/lic/examene/admitere-liceu/` (ID 296, modificat 2026-07-14)
  - **BACALAUREAT** — `/lic/examene/bacalaureat/` (ID 299, modificat 2026-07-31)
  - **EVALUARE NATIONALA** — `/lic/examene/evaluare-nationala/` (ID 302, modificat 2026-06-26)
  - **OLIMPIADE ȘI CONCURSURI** — `/lic/examene/olimpiade/` (ID 315, modificat 2026-03-18)
  - **SIMULARE EXAMENE NATIONALE** — `/lic/examene/simulare-examene-nationale/` (ID 307, modificat 2026-02-25)
  - **CORIGENȚE/TRANSFERURI** — `/lic/examene/corigentetransferuri/` (ID 656, modificat 2026-08-27)
- **PROIECTE SI ACTIVITATI** — `/lic/proiecte-programe-parteneriate/` (ID 383, modificat 2022-10-24)
  - **ACTIVITĂȚI** — `/lic/proiecte-programe-parteneriate/activitati/` (ID 366, modificat 2024-02-15)
  - **PROIECTE** — `/lic/proiecte-programe-parteneriate/proiecte/` (ID 852, modificat 2025-12-02)
- **ERASMUS** — `/lic/erasmus/` (ID 3361, modificat 2026-10-22)
- **INFORMATII** — `/lic/informatii-2/` (ID 3298, modificat 2022-10-27)
  - **ANUNȚURI** — `/lic/informatii-2/anunturi/` (ID 1320, modificat 2026-10-16)
  - **ORAR** — `/lic/informatii-2/orar/` (ID 3303, modificat 2023-11-16) — **EXCLUS (orar)**
- **GALERIE** — `/lic/galerie/` (ID 61, modificat 2024-04-02)
- **CLASA PREGĂTITOARE** — `/lic/clasa-pregatitoare-3/` (ID 3096, modificat 2026-05-08)
- **CONTACT** — `/lic/contact/` (ID 55, modificat 2025-12-12)

*Meniu footer:* DESPRE NOI · DOCUMENTE · PERSONAL · ELEVI · EXAMENE ȘI CONCURSURI · PROIECTE SI ACTIVITATI · GALERIE · CONTACT. *Bara de sus:* telefon 0268 470 802, e-mail liceulhonterus@yahoo.com. *Alte URL-uri tehnice:* `/lic/category/anunturi/`, `/lic/category/uncategorized/` (goale), `/lic/feed/`, `/lic/wp-sitemap.xml`, `/lic/wp-json/`, `/lic/wp-content/uploads/AAAA/LL/*` (fișiere).

Pagini care conțin **doar un slideshow de imagini** (fără text): DOCUMENTE (`/lic/informatii/`), DEZBATERE PUBLICA, PERSONAL, PROIECTE SI ACTIVITATI. Pagini **goale**: ACASA (doar „480 de ani de la înființarea Liceului Johannes Honterus”), LICEUL HONTERUS (anuar 2015-2016), FORMULARE, INFORMATII, DIDACTIC AUXILIAR, NEDIDACTIC (doar câte o propoziție-titlu). GALERIE = galerie huge-it (doar imagini).

## (c) Conținut instituțional extras și curățat (RO / DE)

Convenții: diacritice restaurate (ș ț ă â î), greșeli evidente corectate, conținut fidel. `[...]` și *Notă* = incertitudini de verificat cu școala. Textul brut original al fiecărei pagini este în JSON (`pages[].text`).

### c.1 Prezentare / identitate

- **Denumire oficială:** Colegiul Național „Johannes Honterus” Brașov (din 1 septembrie 2019; anterior Liceul Teoretic „Johannes Honterus” – denumire încă folosită pe paginile PERSONAL). Membru al Alianței Colegiilor Centenare (din 2020) – *sursa PDI*.
- **Fondat:** 1541 de Johannes Honterus (gimnaziul săsesc din curtea Bisericii Negre); școala orășenească anterioară datează din 1388. „Honterus 480” a fost aniversat în 2021.
- **Profil:** școală cu predare integrală în limba germană (limbă maternă), de la clasa pregătitoare la clasa a XII-a; 4 clase pe fiecare an de studiu (aprox. 1.400 de elevi în 53 de clase – PDI 2021; „cea mai mare unitate liceală din județul Brașov”).
- **Rezultate (PDI):** 100% promovare la Bacalaureat (2019-2021), premii la olimpiade, rezultate excelente la DSD II; „Școală partener” ZfA (Departamentul pentru Învățământ în Străinătate al Guvernului German); patru proiecte Erasmus+.
- **Viziune (PDI 2021-2026):** O școală de tradiție în slujba comunității, orientată spre calitatea actului educațional, în concordanță cu valorile și normele naționale și europene. (sursa: PDI 2021-2026)
- **Misiune (PDI 2021-2026):** Colegiul Național „Johannes Honterus” Brașov este o comunitate nediscriminatorie, în care elevii trebuie să se simtă protejați, respectați și motivați pentru învățarea permanentă și pentru dobândirea unui nivel optim de disciplină, competențe și comportament social. Vor fi pregătiți să devină viitori cetățeni ai unui spațiu european, învățând respectul, toleranța, corectitudinea și demnitatea. (sursa: PDI 2021-2026; în original «Liceul „Johannes Honterus” Brașov»)
- **Tradiții:** *Honterusfest* – serbarea câmpenească a școlii, în ultima sâmbătă din mai, în Poiana Mică (Poiana Brașov), pornind cu fanfara „Burzenland” din fața școlii (tradiție din 1845); *Der Fasching* – carnavalul claselor IX–XII, la începutul lui februarie; Balul bobocilor; Bazarul de Crăciun și de Paști; *Honterus Ski Pokal* (cu Asociația Prohonterus); slujba ecumenică de deschidere a anului școlar în Biserica Neagră; Martinsfest/Martinstag (clasele primare).
- **Baza materială (Ofertă 2024-2025):** Corp B – laboratoare de informatică, fizică, chimie, biologie, săli de clasă; Corp C – laborator de informatică, cabinet de limba germană, bibliotecă, săli de clasă; Corp D – săli de clasă, bază sportivă cu teren și 3 săli de sport. Cabinet medical (medic + asistentă), cabinet psihopedagogic, cabinet de logopedie. Dotări: calculatoare, table SMART, proiectoare, sonorizare, supraveghere video.
- **Activități extracurriculare (Ofertă 2024-2025):** ansamblu coral, dansuri populare, echipe sportive (handbal, baschet, volei, fotbal, șah, arte marțiale), *Jugend debattiert*, revista școlii, voluntariat (SNAC), activități ecologice, SKV (Asociația Carpatină Ardeleană a Turiștilor), Asociația „Milioane de Prieteni”. (2018-19 mai menționa: Dansuri populare „CORONA”, Grup vocal-instrumental „CANZONETTA”, cerc de filatelie.)
- **Parteneri:** Ambasada Germaniei, Ambasada Austriei, ZfA (DSD), Biserica Neagră, Forumul German, Centrul de Prevenire, Evaluare și Consiliere Antidrog Brașov; școli partenere în Germania (ex. Europaschule Troisdorf), Italia, Nepal.
- **Personalități (PDI, selecție):** Valentin Greissing, Stefan Bergler, Johann Hedwig, Christian Flechtenmacher, Valeriu Bologa, Hans Eckart Schlandt, Wolfgang Wittstock, Mariana-Virginia Stoenescu; „109 directori și 467 de promoții”.

### c.2 Istoric – „Date din istoria liceului” (pagina DESPRE NOI)

- **1235** – Prima mențiune documentară a orașului Brașov: *Claustrum sororum in Corona* (o mănăstire de surori la Brașov) se referă la locul unde azi se află corpul B al liceului.
- **1385** – Primul brașovean înmatriculat la Universitatea din Viena (Johannes Philippi de Corona).
- **1388** – Theodoricus, odinioară *scolarium succentor in Corona* (cantor ajutor al școlii din Brașov), este menționat ca primul om al școlii brașovene cunoscut nominal; este menționată și capela Sf. Ecaterina, care a existat până în anul 1559 pe locul unde azi se află corpul C al liceului.
- **1533** – Johannes Honterus, după ce a studiat la Viena, a predat și a editat manuale școlare la Cracovia, capitala Poloniei, și la Basel, un centru al culturii umaniste din Elveția, este chemat la Brașov pentru a se dedica reorganizării învățământului din Brașov. *[Notă: PDI 2021-2026 indică anul 1535 pentru revenirea la Brașov – de verificat.]*
- **1539** – Publicarea primelor manuale școlare, tipărite în tipografia lui Honterus, pentru ciclul inferior (*trivium*).
- **1541** – Transformarea mănăstirii Sf. Ecaterina într-o școală publică și într-o școală pentru cei mici. *(PDI: Honterus devine fondatorul Gimnaziului superior săsesc la 3 octombrie 1541.)*
- **1542** – Studenții școlii brașovene dau prima reprezentație publică de teatru, în Casa Sfatului.
- **1543** – *Constitutio Scholae Coronensis* (Constituția școlii brașovene), primul regulament școlar din țara noastră; înființarea cetei studenților (*Coetus*), prima organizație de elevi.
- **1544** – Valentin Wagner, colaboratorul lui Honterus și rectorul liceului, întocmește prima matricolă școlară din țara noastră (1544–1810).
- **1544** – Prima mențiune pe țară a unei școli pentru fete.
- **1546** – Înființarea primei mori de hârtie din țara noastră, la inițiativa lui Honterus, pentru aprovizionarea cu hârtie a școlii, a tipografiei și a cancelariilor.
- **1547** – Demolarea școlii vechi și construcția clădirii Bibliotecii (*Liberei*).
- **1657** – Retipărirea regulamentului școlar din 1543.
- **1689, 21 aprilie** – Marele incendiu al orașului distruge vestita bibliotecă școlară, din care rămân numai 26 de volume.
- **1743–1748** – Reconstrucția din temelii a clădirii gimnaziului Honterus (azi corpul B).
- **1772** – Clădirea fostei biblioteci este transformată în locuințe pentru învățători.
- **1793** – Construcția corpului C, cu un etaj, pentru biblioteca școlară.
- **1822–1823** – Construcția corpului A ca școală pentru băieți.
- **1834** – Cele două etaje ale corpului B sunt construite din nou.
- **1845** – Cu ocazia sărbătoririi a 300 de ani de la înființarea școlii se ține prima serbare Honterus (Honterusfest). Apare cartea lui Joseph Dück *Geschichte des Kronstädter Gymnasiums* (Istoria gimnaziului din Brașov). *[Pe site: „Joseph Dack” / „Kronstdter” – caractere pierdute; forma corectă probabilă: Joseph Dück, „Kronstädter” – de verificat.]*
- **1855** – Corpul C este supraetajat cu un al doilea etaj pentru a adăposti muzeul școlii.
- **1898** – Apare lucrarea *Geschichte des Kronstädter Gymnasiums 1845–1869* (Istoria gimnaziului din Brașov 1845–1869) de Julius Groß. *[Pe site: „Julius Gro” – caracter „ß” pierdut.]*
- **1903** – Gimnaziul evanghelic din Brașov primește denumirea oficială de Gimnaziul Honterus.
- **1911–1913** – Construcția clădirii noi a Gimnaziului Honterus la poalele dealului Romurilor *[toponim de verificat]* (azi Maternitatea).
- **1948** – Prin reforma învățământului, Liceul Honterus este naționalizat și își continuă activitatea cu denumirea de Liceul Mixt German, în clădirea Liceului „Andrei Șaguna”. În vechiul Gimnaziu Honterus (clădirile B și C) funcționează o școală feroviară, iar în vechea școală de băieți (clădirea A) – Școala elementară nr. 23, ulterior nr. 4. Ulterior, școala primește numele de Școala medie mixtă nr. 2 cu limba de predare germană.
- **1956** – Școala medie mixtă nr. 2 cu limba de predare germană primește clădirea B.
- **1959** – Unificarea școlilor. La Liceul nr. 1, în clădirea „Șaguna”, există o secție germană; clasele elementare sunt anexate la Școala elementară nr. 4, care primește și clădirile B și C.
- **1970** – Școala generală nr. 4 primește numele de „Johannes Honterus”.
- **1971** – Se înființează Liceul de cultură generală „Johannes Honterus”, căruia îi sunt atribuite clădirile A (școala de băieți), B (Gimnaziul vechi) și C (Muzeul vechi).
- **1977** – Liceul „Johannes Honterus” este un liceu de filologie și istorie, cu o secție de matematică și fizică.
- **1980** – Apariția primului ziar al școlii, *Honterusschule heute*.
- **1990** – Liceul „Johannes Honterus” devine liceu teoretic.
- **1991** – Clădirea C este renovată și înzestrată cu ajutor din Austria și Germania.
- **1994–1996** – Clădirea B este temeinic renovată și înzestrată cu ajutor din Germania.
- **2005** – Renovarea corpului C cu ajutor financiar de la Banca Mondială.
- **2019, 1 septembrie** – *(din PDI 2021-2026, nu din pagina web)* Liceul devine, prin ordin al ministrului, Colegiu Național; din 2020 face parte din Alianța Colegiilor Centenare.
- **2021** – Aniversarea „Honterus 480” (480 de ani de la înființare) – video: https://youtu.be/dbX-JN3K4t8.

**Denumiri purtate (PDI):** 1898 – Kronstädter Gymnasium; 1903–1948 – Gimnaziul „Johannes Honterus”; 1948–1956 – Liceul mixt german; 1971–1977 – Liceul de cultură generală „Johannes Honterus”; 1977–1990 – Liceul de filologie-istorie, cu secție de matematică-fizică; 1990–2019 – Liceul Teoretic „Johannes Honterus”; din 2019 – Colegiul Național „Johannes Honterus”.

**Din PDI (completări utile pentru pagina /ro/istorie):** 1530 – *Rudimenta cosmographica* (Cracovia), primul atlas „minor” din Europa centrală și de sud-est; 1559 – primul manual în limba română, „Catehismul românesc”, tipărit pentru școala românească din Șcheii Brașovului; 1612 – 39 de „studenți” ai gimnaziului mor alături de judele Michael Weiss în lupta de la Feldioara (monument la Feldioara/Marienburg); 1677 – elevii joacă „Titus Andronicus”, prima reprezentație a unei piese de Shakespeare pe teritoriul actual al României; 1875 – în corpul E funcționează primul orfelinat din Brașov.

### c.3 Johannes Honterus

Johannes Honterus, născut Austen (n. 1498, Brașov – d. 23 ianuarie 1549, Brașov), a fost un învățat umanist sas, reformator religios al sașilor din Transilvania, fondatorul gimnaziului săsesc din Brașov, din curtea Bisericii Negre – actualul Colegiu Național „Johannes Honterus”. Numele de Honterus, pe care îl folosește mai târziu, este forma latinizată derivată din „Honter”, denumirea săsească a cuvântului *Holler* sau *Holunder* (în traducere: soc). Prin activitatea sa vastă și multilaterală a dobândit încă din viață un meritat renume, ce a depășit granițele țării în care a trăit.

Tatăl său, Georg Austen (ori Aust), maistru tăbăcar, poseda și o fermă și aparținea burgheziei înstărite din Brașov. Fiul său, Johannes, a primit o educație solidă, probabil de la călugării dominicani. În anul 1520 se înscrie la Universitatea din Viena sub numele de Johannes Aust, unde primește deja în 1522 gradul de „Baccalaureus”, iar în 1525 titlul de „Magister artium”, de data aceasta pe numele de Johannes Holler Coronensis (Kronstadt = Orașul Coroanei). În timpul asediului Vienei de către armatele Imperiului Otoman, în 1529, Honterus se refugiază la Regensburg, la istoricul Johannes Turmair-Aventinus. În acest timp purta deja numele de Johannes Hynter-Hunterus. În 1530 predă la Universitatea Iagellonă din Cracovia (Polonia), sub numele de Johannes Georgii de Corona, Artium Magister Viennensis. În același an publică primele sale lucrări, o descriere a lumii și o gramatică latină. În următorii trei ani se află la Basel, centrul umanismului european din acel timp, în special prin persoana lui Erasmus din Rotterdam. La Basel învață gravura în lemn și se inițiază în arta tipografiei. Aici tipărește, în 1532, cunoscuta reprezentare cartografică a Transilvaniei.

În 1533 Honterus se întoarce la Brașov, se căsătorește în 1535, este ales în „Adunarea celor o sută”, iar în 1536 devine consilier comunal. La Brașov a înființat una dintre primele tipografii din Transilvania (începând cu 1529 a funcționat o tipografie la Sibiu, concomitent cu tipografia lui Gaspar Heltai de la Cluj). Printre altele, Honterus tipărește în 1543 cartea „Reformationsbüchlein für Kronstadt und das Burzenland” („Cărticica de reformă pentru Brașov și Țara Bârsei”) și „Apologia”, iar în 1547 „Kirchenordnung aller Deutschen in Siebenbürgen” („Regulamentul bisericilor tuturor germanilor din Transilvania”), care cuprindeau principalele teze ale reformei evanghelice a bisericii sașilor din Transilvania, de inspirație luterană. În 1546 a fost înființată la Brașov, la insistențele lui Honterus, prima fabrică de hârtie din regiune, care va livra hârtie și în Țara Românească și Moldova.

Johannes Honterus se interesează în mod deosebit de educația tineretului. El reorganizează vechea școală orășenească de limbă germană din Brașov, ce data din 1388. În 1541 se construiește o nouă clădire pentru școală, în locul unei mănăstiri, iar un an mai târziu, clădirea unei biblioteci proprii a școlii. În 1542 are loc, în cadrul școlii, prima reprezentație teatrală din regiune. Honterus elaborează un regulament de funcționare a școlii, „Constitutio Scholae Coronensis” (1543), și pune bazele unei organizații a elevilor, „Coetus”, în care elevii aveau multă libertate de decizie și acțiune, cu scopul dezvoltării și pregătirii lor pentru viața în societate. Gimnaziul umanist înființat de Honterus a jucat un rol deosebit în viața culturală a Transilvaniei și a rămas până în zilele noastre o instituție de prestigiu. Johannes Honterus moare la 23 ianuarie 1549 la Brașov și este înmormântat în Biserica Neagră.

*Material atașat pe site: „Johannes Honterus – Daten, Fakten” (DOCX, germană). [Notă: pagina menționează „1547 – clădirea bibliotecii”, iar PDI „1542 – prima bibliotecă școlară” – de armonizat.]*

### c.4 Biblioteca

Cele mai multe cărți tipărite de Honterus au fost destinate bibliotecii școlii sale, cât și celei orășenești. Școala primește o misiune de onoare prin posibilitatea de a deține cărți de valoare, pe care să le poată împrumuta elevilor săi.

Multe cărți din această bibliotecă școlară proveneau de la biblioteci din Grecia. Documentele epocii ne arată că, la 27 iunie 1543, municipalitatea hotărăște ca 312 guldeni să fie dați bibliotecii pentru a se achiziționa noi cărți. În scurt timp, încăperile destinate bibliotecii devin neîncăpătoare, astfel încât în 1547 se hotărăște construirea unei noi clădiri, destinate bibliotecii școlii. În luna septembrie a aceluiași an, clădirea este terminată.

Despre această bibliotecă, J. Honterus îi va scrie lui Sebastian Münster: „În acest oraș se găsește noua bibliotecă, așa cum în Pannonia, după distrugerea bibliotecii lui Matthias Corvinul, în 1541, nicăieri nu se mai găsește.” Aceasta a fost prima clădire din Transilvania destinată unei biblioteci. Regulamentul școlar redactat de Honterus menționează și primul catalog de bibliotecă din țara noastră. Marele incendiu care a mistuit o parte a centrului Brașovului la 21 aprilie 1689 a distrus atât clădirea, cât și bogatul fond al bibliotecii; au mai fost salvate doar 26 de lucrări!

*Date actuale (PDI 2021-2026): fond de 50.845 de volume; 1.339 de elevi înscriși la bibliotecă, dintre care 852 o frecventează.*

### c.5 Biserica Neagră

*Text de tip turistic (2017), diacritice restaurate automat + verificare sumară; conține date posibil depășite (tarife „4 lei / 2 lei”, program 10–17). Recomandare: rescriere scurtă sau link către site-ul Bisericii Negre.*

> Biserica Neagră
> Veche de peste 500 de ani, Biserica Neagră este cel mai reprezentativ monument istoric al Brașovului, cea mai mare Biserica gotică din Transilvania și, după cum afirmă unii istorici, cel mai mare edificiu religios între Viena și Istanbul. Mai mult decât atât, înăuntrul el se află una dintre Cele mai mari orgi din Europa și cea mai mare colecție de covoare vechi din Asia Mică.
> Construcția acestei biserici evanghelice în stil gotic a început în jurul anului 1380, în timpul parohului Thomas Sander, și inițial a fost numită Biserica Sfânta Maria. În 1421, mare parte din constructie a fost distrusa în urma invaziei turcești, motiv pentru care abia în 1477 s-au finalizat lucrările. În prezent este considerată cel mai mare lăcaș de cult din România, având dimensiuni impresionante: 90 de metri lungime, de la 25 la 37 de metri lățimea și înălțimea turnului cu cruce atinge 65 de metri, iar înăuntrul ei pot fi primiti circa 5000 de oameni. Mai mult, în turn se găsește cel mai mare clopot din țara, care cântărește 6,3 tone.
> După aproape 200 de ani, în 1689 un incendiu a distrus-o parțial iar fumul a înnegrit pereții și multa vreme exteriorul nu a putut fi restaurat. Renovarea a durat circa 100 de ani, dar din cauza pereților negri de fum a fost supranumită Biserica Neagră (în germană Die Schwarze Kirche, în maghiară Fekete Templom). Tot după acest incendiu i s-a ridicat și actualul acoperiș, înalt de 20 de metri. Meșterii care au lucrat la refacerea ei erau veniți din orașul Danzing, motiv pentru care noile bolți sunt în stil baroc nu gotic. Orga Bisericii Negre Orga Bisericii Negre, având 4000 de tuburi și fiind considerată printre Cele mai mari din Europa, a fost construita între anii 1836-1839 de către constructorul de orgi Buchholz din Berlin și este renumită pentru sonoritatea ei. În 1924, galeria din fața orgii a fost extinsă pentru a se putea organiza concerte mari de muzică sacră cu participarea corului. În decursul anilor au fost realizate nenumărate discuri de vinil, casete audio și cd-uri. De altfel, în prezent, săptămânal se organizează un concert de orga.
> Valori inestimabile Colectia de covoare vechi, din regiunile Brussa, Usak și Ghiordes din Asia Mică, din secolele XVII-XVIII reprezintă un tezaur inestimabil al Bisericii Negre. Acestea au fost donate, de-a lungul timpului de către breslele meșteșugarilor din oraș, de către negustori și cetățeni.Piesele de mobilier și obiectele de cult sunt alte valori remarcabile care fac din edificiul brașovean un loc pe care nici un turist nu-l poate evita. De exemplu cristelnița din bronz, lucrată de meșterii locali, a fost donată în anul 1472 de către parohul Johannes Reudel. După aproape 150 de ani, în 1716, fierarul Meensen Hannes a realizat un frumos grilaj din fier forjat care înconjoară cristelnița. Apoi, pe pridvorul sudic, există o pictură murală executată după anul 1476, reprezentând-o pe Fecioara Maria cu pruncul Isus, așezată între Sf. Ecaterina și Sf. Varvara. În partea de jos a picturii se află stemele regelui Matei Corvin și a soției sale Beatrice de Napoli-Aragon. De asemenea nu pot fi trecute cu vederea trei canate cu cinci tablouri de la altarul din Feldioara (sfârșitul secolului XV-lea). Stranele din navele laterale sunt datate de la sfârșitul secolului XVII și prima jumătate a secolului XVIII, fiind lucrate cu ornamente în stil baroc, sculptate în lemn. Apoi, stranele din cor sunt în stil neogotic, datând din 1866, iar în nava centrală băncile, realizate din lemn de stejar, au fost montate din 1937.Vechile pietre funerare ale unor personalități brașovene au fost zidite în spațiile laterale ale antreului de vest în momentul în care s-a lucrat la ridicarea altarului neogotic (1866) și la construirea instalației de încălzire (1937). O pânză pictată în ulei reprezentând “Nunta din Cana”, opera a pictorului Hans Eder, se află expusă pe peretele frontal al navei laterale dinspre nord. Stema orașului Brașov, coroana pe un trunchi de copac cu rădăcini, este reprezentată, în relief, pe stâlpul din fața amvonului. Tot în interiorul bisericii se găsesc o serie de statui, dintre care cea mai veche este a Sfântului Ioan Botezătorul. Altele îi reprezintă pe Toma Plebeanul, Sfantul Iacob Pelerinul, Isus Savaltor Mundi, Fecioara Maria, Pavel, Luca și Sebastian. O statuie atipică pentru un lăcaș de cult se află expusă pe contrafortul din partea nordică. Este vorba de reprezentarea unui copil care parcă ar sta sa cadă. Legenda spune ca în momentul în care se construia Biserica, un meșter a devenit invidios pe un ucenic foarte talentat. La un moment dat i-a cerut copilului sa ridice ceva de pe cornișă și când acesta s-a aplecat, meșterul l-a îmbrâncit. Tot Legenda spune ca statuia a fost ridicată de ceilalți ucenici, în memoria celui asasinat mișelește.
> De-alungul timpului Biserica Neagră a fost supusă la mai multe lucrări de întreținere și renovare. Statuile de pe contraforturile exterioare au fost înlocuite cu copii, în perioada anilor 1937 � 1944, iar originalele au fost adăpostite înăuntrul bisericii. Între 1967 – 1977 au fost alocați bani de la bugetul de stat pentru renovare, iar după cutremurul din 1977 restaurarea s-a realizat cu ajutoare din donații și colecte. Potențial turistic Potrivit estimărilor turistice, anual prin Biserica Neagră trec circa 100.000 de turiști, fiind considerată al doilea obiectiv de interes major din județ, după Castelul Bran. Orarul de vizitare este zilnic între orele 10,00 și 17,00, la un tarif de 4 lei pentru adulți și 2 lei pentru elevi, studenți și pensionari. La intrare există puncte de vânzare pentru cărți poștale cu imaginea generală și cu detalii. Fotografiatul și filmatul sunt interzise. Locuri de cazare se găsesc la împrejurimi, la hoteluri și pensiuni turistice.

### c.6 Oferta educațională (pagina „OFERTA EDUCAȚIONALĂ”, `/lic/informatii/formulare-2/`)

| An școlar | Primar (CP, I–IV) | Gimnaziu (V–VIII) | Liceu (IX–XII) |
|---|---|---|---|
| 2026-2027 | 4 clase pe fiecare an | 4 clase pe fiecare an | 4 clase pe fiecare an: 2 profil real + 2 profil umanist |
| 2025-2026 | 4 clase pe fiecare an | 4 clase pe fiecare an | idem |
| 2024-2025 | 4 clase pe fiecare an | 4 clase (V–VII), **5 clase a VIII-a** | idem |

- **Profiluri / specializări (confirmate pe site):** Real – **Științe ale naturii**; Uman – **Filologie**. *Matematică-informatică NU apare pe site (doar examene de diferență la informatică pentru profilul real) – de confirmat înainte de publicare.*
- Limba de predare: germană (maternă); limbi studiate: română, germană, engleză, franceză, latină; literatură universală; istoria minorităților (germane); religie (inclusiv evanghelică).
- **Primar – clasa pregătitoare:** admitere prin **evaluarea cunoștințelor de limbă germană („interviu prin joc”)**, conform procedurii proprii; înscrieri la secretariat (corp B), L–V 08:00–16:00 (2026); ziua porților deschise (2026: joi 2 aprilie, 12:00–15:00, corp D – Poarta Schei). Locuri: 2026-2027 – 76 (4 clase), toate ocupate; 2025-2026 – 88 alocate, suplimentat (94 + 2 cetățeni germani); 2024-2025 – 88, suplimentat la 93. Învățătoare CP 2025-2026: A – Sîrbu Cristina, B – Dina Alexandra, C – Bratu-Melzer Alexandra, D – Ștefan Alina.
- **Liceu – admitere în clasa a IX-a:** repartizare computerizată națională + **probă de verificare a cunoștințelor de limba germană maternă** (2026: înscriere 13–15 mai, proba scrisă 22 mai, 9:00–11:00). Înscrierea candidaților repartizați: 23, 24, 27 iulie 2026 (11:00–13:00), documente: cerere de înscriere, certificat de naștere, CI, foaia matricolă V–VIII, adeverință cu notele EN și media de admitere, fișa medicală. E-mail admitere: admitere@liceulhonterusbrasov.ro; tel. secretariat 0268 470 802. Nu se fac transferuri între profiluri la a IX-a; schimburi între clase doar în perechi (fete-fete / băieți-băieți), același profil.
- **Transferuri:** examene de diferență (ex. 24–28.08.2026: germană eliminatorie, matematică, franceză, informatică, latină); elevii din alte licee susțin probă eliminatorie la limba și literatura germană maternă; transferurile intersemestriale nu se pot efectua (ROFUIP art. 155). Ultima medie de admitere (2025): real 7,61, uman 6,78.

### c.7 Examene (rezumat pentru /ro/examene/*)

- **Evaluarea Națională (clasa a VIII-a):** probe: Limba și literatura română, Matematică, **Limba și literatura maternă germană**; părinții pot opta pentru calculul mediei fără proba de limbă maternă (declarație la secretariat / renuntaregermana@liceulhonterusbrasov.ro). Colegiul publică anual calendarul, cererile de vizualizare și contestații (ex. 2026: contestatii2026@liceulhonterusbrasov.ro, vizualizarelucrari2026@liceulhonterusbrasov.ro).
- **Bacalaureat:** colegiul publică arondarea la centrele de examen și centrul de evaluare a competențelor; link-uri edu.ro / ISJ Brașov.
- **Simulări EN/BAC:** ex. 2026 – EN 16–18 martie, BAC 23–26 martie; disciplinele includ limba și literatura maternă germană.
- **DSD (Deutsches Sprachdiplom):** pe site doar un anunț PDF (2018: simulare „MK”/Pilotprüfung 09.11.2018; examen DSD 28.11.2018, clasele a XII-a A–D) și mențiuni în oferta educațională/PDI (DSD II, ZfA, Goethe-Institut). **Nu există o pagină DSD** – conținut nou necesar pentru /ro/examene/dsd și /ro/germana-dsd.
- **Olimpiade:** colegiul este organizator al etapei județene la Limba și literatura germană maternă și la Limba și literatura română pentru minorități (2025, 2026) – subiecte, bareme, rezultate. Rezultate istorice la germană maternă (PDI): 2017 – Hellmann Verena (IX) premiul I, Plajer Eva (IX) premiul II, Badea-Calitoiu Ana Teodora (XI) mențiune; 2018 – Aldea Iulia Maria (VIII) premiul I, Plajer Eva (X) premiul I, Arvay Sigrid Senta (VII) premiul II, Hellmann Verena (X) mențiune, Paul Ioana Andreea (XI) mențiune. *(Nume de elevi minori – publicați doar cu acord.)*
- **Semnalarea corupției la examene:** TelVerde 0800 801 100 (gratuit); http://www.educatiepentruviitor.edu.ro (OMEN 5144/2013).

### c.8 Proiecte, Erasmus+, activități

- **Erasmus+ KA1 – Acreditare școlară 2021-2027**, cod **2022-1-RO01-KA120-SCH-000105343**. 2025-2026: job shadowing la Wiesbaden (DE) și Murcia (ES), cursuri „Managementul clasei”, „Integrarea AI și a gândirii critice în predare”; mobilități elevi „Valori europene în Spania / în România”. 2024-2025: curs „Chat GPT and Basic AI Tools” (Florența), „From Burnout to Balance” (Roma), job shadowing Walther von der Vogelweide (Bolzano), proiect „Treasures of the Past – Values of the Present”, mobilități Brașov – Tampere – Corfu („Elevii noștri descoperă Finlanda”). Anterior: mobilități Adra, Zoetermeer, Florența, Barcelona, Troisdorf.
- **Erasmus+ KA2 – „Less is More”** (Grecia, Polonia, Danemarca, Portugalia, Brașov); **„InWASTEgation”** (parteneriat interșcolar din 01.09.2018; Olanda, Finlanda, Spania; filme „utopic/distopic”); **„REMEDY/REMEDIE”**; **„Begegnen, Verstehen, Wertschätzen”** (Corfu); **„Willkommen in Europa”**; ErasmusDays 2018.
- **Alte proiecte:** SmartLab (2025, comunicate de presă), „Tinerii, gardienii pădurilor europene / Les Jeunes”, „Dunărea și prietenii săi. Râul Olt – apa de lângă noi” (proiectul european DANUBIUS), Martinstag 11.11.2021, FSE+ „Sprijin educațional pentru preșcolarii și elevii dezavantajați” (PIDS 2021-2027, cod SMIS 319029), schimb de elevi cu Europaschule Troisdorf (2023).
- **Activități:** Honterus Ski Pokal (2017–2024), Fulg de nea 2022, *Jugend debattiert* (articol ADZ/Karpatenrundschau), Ziua Lecturii (15.02.2022), comemorarea de la Feldioara (16.10.2021), „Prietenii pompierilor” (2018), Ziua Cărții (23.04.2018), programul „Colgate” cu Crucea Roșie (2017), 470 de ani de bibliotecă școlară (24.11.2017), ecologie montană – Moieciu de Sus, „Cutiuța cu bucurii”, Martinsfest (Biserica Neagră), concert educativ „Muzica de-a lungul timpului”, Honterusfest (1 iunie 2017).
- **Coetus / consiliul elevilor:** pe site apare doar istoric (Coetus Honteri, 1543) și în organigramă („Consiliul elevilor”). **Nu există pagină Coetus / consiliul elevilor actual** – conținut nou necesar pentru /ro/viata-scolara/coetus.
- **Publicații:** ziarul școlii *Honterusschule heute* (din 1980); „Revista școlii” (oferta 2024-25); anuar 2015-2016 (pagină goală). Fără arhivă online.

### c.9 Germană – „Lehrer aus Deutschland” (pagina ELEVI / PROFESORI DIN GERMANIA)

**Lehrer aus Deutschland – Die deutsche Minderheit in Kronstadt und ihre Schulen**

Dieser Kurzfilm will einen Eindruck von Kronstadt (Brașov/Rumänien), der Kultur und Geschichte der Stadt vermitteln. Er stellt uns, die deutsche Minderheit Kronstadts, unter besonderer Berücksichtigung des deutschen muttersprachlichen Schulwesens vor. Im östlichen Teil Europas konnte allein in Rumänien ein umfassendes deutsches muttersprachliches Schulwesen die Jahrzehnte des Kommunismus weitgehend unbeschadet überstehen. Gegenwärtig ist die Nachfrage nach diesem Schulwesen in der Stadt enorm. Das Interesse der Mehrheitsbevölkerung daran ist europäische Wirklichkeit. Besondere Aufmerksamkeit schenkt die deutsche Minderheit in Kronstadt der Sicherung der Qualität des Schulunterrichts. Austausch, Kooperationen und voneinander Lernen sind uns besonders wichtig. Der Film stellt Initiativen sowie laufende Programme dazu kurz vor und hofft, insbesondere Lehrkräfte aus dem deutschen Sprachraum anzusprechen, die sich für einen kürzeren oder längeren Aufenthalt in Kronstadt interessieren könnten.

Präsentations- und Werbefilm: https://www.youtube.com/watch?v=HO08QtTZC5I

Kontakt: office(at)forumkronstadt.ro · liceulhonterus(at)yahoo.com · liceulhonterusbrasov.ro

*Interesse als Lehrer in Kronstadt zu wirken?* Weiterführende Links: Zentralstelle für das Auslandsschulwesen (ZfA) – https://www.auslandsschulwesen.de; Programme der Länder (Baden-Württemberg, Bayern, Berlin, Brandenburg, Hamburg, Hessen, Niedersachsen, Nordrhein-Westfalen, Sachsen, Sachsen-Anhalt, Schleswig-Holstein, Thüringen); Verband deutscher Lehrer im Ausland (VDLiA) – https://vdlia.de; kulturweit – Freiwilligendienst – https://www.kulturweit.de. *(Mehrere Länder-Links sind veraltet – siehe Abschnitt h.)*

**Gedenkveranstaltung in Marienburg/Feldioara (16.10.2021)** – Organisiert vom Kreisforum in Zusammenarbeit mit der Honterusschule, dem Stadtpfarrer Kronstadt und der Gemeinde Marienburg/Feldioara, im Gedenken an den Stadtrichter Michael Weiss und die Kronstädter, darunter 39 Schüler der Honterusschule, die in der Schlacht bei Marienburg am 16.10.1612 ihr Leben opferten. *(Auszug, Seite „Activități“.)*

### c.10 Ajutoare sociale și burse (pentru /ro/documente sau /ro/elevi)

Cererile de bursă (merit, socială – venit mic/minim de incluziune, medicală, orfani, afecțiuni oncologice/cronice, revenire școlarizare, mame minore, excelență olimpică) se depun în 25 de zile calendaristice de la începerea anului școlar, la secretariat (corp B) până la 15:00 sau la honterus.burse@gmail.com (OMEC 732/2025 – criterii). Dosare CES: certificat de naștere, CI beneficiar/părinte, certificat CJRAE, declarații pe propria răspundere (HG 564/2017), extras de cont. Tichete sociale: OUG 83/2023. 2026-2027: 128 de dosare de bursă de merit aprobate.

## (d) Contacte

| Câmp | Valoare | Sursă |
|---|---|---|
| Denumire | Colegiul Național „Johannes Honterus” Brașov | titlu site / anunțuri 2022+ |
| Adresă | Curtea Honterus nr. 3, cod 500025, Brașov, România | Contact, footer |
| Telefon | 0268 470 802; 0368 449 087 | Contact, footer, bara de sus |
| Fax | 0268 470 802 (același cu telefonul) | Contact („Telefon / Fax”), Ofertă 2024-25 |
| E-mail general | liceulhonterus@yahoo.com | Contact, footer |
| E-mail admitere liceu | admitere@liceulhonterusbrasov.ro | Admitere liceu 2026 |
| E-mail înscriere IX (2026) | inscriereliceu2026@liceulhonterusbrasov.ro | Admitere 2026 |
| E-mail burse | honterus.burse@gmail.com | Anunțuri 2026 |
| E-mail contestații / vizualizare EN 2026 | contestatii2026@… / vizualizarelucrari2026@liceulhonterusbrasov.ro | EN 2026 |
| E-mail renunțare germană (EN) | renuntaregermana@liceulhonterusbrasov.ro | EN 2024 |
| Secretariat | Corp B (sala B15 – PDI); L–V 08:00–16:00 pentru înscrieri CP 2026; dosare burse până la 15:00. *Programul general cu publicul NU este publicat – de confirmat.* | Clasa pregătitoare, Anunțuri |
| Cabinet medical | program 08:00–13:45 (D32 – PDI) | Anunțuri 2026 |
| Coordonate hartă | 45.640704, 25.587872 | iframe Google Maps |
| Fost e-mail în PDI (EROARE) | contact@liceulhonterusbrasov.ro, tel. 0249 435470 – **nu folosiți** | PDI 2021-2026 p.5 |

## (e) Structura personalului (așa cum este publicată pe site)

### Conducere (pagina CONDUCERE, actualizată 24.10.2022; confirmată de PDI 2021-2026)

| Nume | Funcție | Specialitate |
|---|---|---|
| prof. Radu Chivărean | Director | Geografie |
| prof. Raluca Petrăreanu | Director adjunct | Matematică |
| prof. înv. primar Tünde-Enikö Jozsa | Director adjunct | Învățământ primar |

Pe site numele apar „prof. Radu CHIVĂREAN – director; prof. Raluca PETRĂREANU – director adjunct; prof. înv. primar Tünde-Enikö JOZSA – director adjunct”. *Datele sunt din 2022 – verificați componența actuală înainte de lansare.*

### Profesori pe arii curriculare / catedre (pagina PROFESORI, actualizată 29.11.2024; identică cu încadrarea 2024-2025)

| Arie curriculară | Catedră / disciplină | Cadre didactice |
|---|---|---|
| Limbă și comunicare | Limba și literatura română | Andronic Aurora Anicuța, Ardelean Ana, Feldiorean Sabinica, Ferezan Teodor Ioan, Giuglea Diana, Ionică Naomi Rut, Jebac Andreea, Preda Ioana, Soare Stănica Mărioara |
| Limbă și comunicare | Limba germană | Adam Gabriela, Albici Marianne, Gall Carmela, Micleru – Șoană Anina Cristina, Oancea Carolina Melinda, Rădulescu Loredana Mihaela, Tudose Anca, Turcu Daniela |
| Limbă și comunicare | Limba engleză | Butnar Alice, Ferezan Mirela Ioana, Iliescu Adina, Nicoară Andreea Sabina, Paul Anca Melania, Stanciu Liliana |
| Limbă și comunicare | Literatură universală | Nösner Andreea Ioana, Petroi Ramona Alexandra |
| Limbă și comunicare | Limba franceză | Petroi Ramona Alexandra, Preda Ioana, Vrabete Anda Roberta |
| Limbă și comunicare | Limba latină | Spînu Cristina Maria |
| Matematică și științe ale naturii | Matematică | Bodocan Dana, Drăgoiu Corina, Epure Cristina Ioana, Ilie Dana Viorela, Pop Gențiana Mariana, Petrăreanu Raluca, Socianu Narcisa Rodica |
| Matematică și științe ale naturii | Chimie | Căciuleanu Adriana, Cioconea Gisella |
| Matematică și științe ale naturii | Științe | Iacob Vanesa Anamaria, Nemțeanu Ionuț |
| Matematică și științe ale naturii | Fizică | Adams Helmut Dieter, Damian Daniela, Nascov Victor |
| Matematică și științe ale naturii | Biologie | Dogariu Doina, Iacob Vanesa Anamaria, Khapardey Adriana, Nemțeanu Ionuț |
| Om și societate | Geografie | Bătrînu Dragoteanu Camelia, Chivărean Radu, Pătraș Ciocîltei Ionuț Cătălin, Popavasile Gabriela Eugenia |
| Om și societate | Istorie | Fabritius Klaus, Oceanu Hrisantis, Schwedes Simona Karin, Turcuș Peter Jürgen |
| Om și societate | Istoria minorităților | Oceanu Hrisantis, Turcuș Peter Jürgen |
| Om și societate | Științe sociale | Ilie Iulia Roxana, Oswald Livia, Popescu Alina, Puițel Magdalena Maria, Vigheciu Mihaela |
| Om și societate | Religie | Bîzoi Marius Ionuț, Riemer Franziska, Untsch Klaus Dieter |
| Arte | Educație plastică | Gliga Ioana, Petrișor Maria, Timiș Anca Liliana |
| Arte | Educație muzicală | Mirițescu Claudia Cristina, Oswald Livia, Timiș Anca Liliana |
| Educație fizică și sport | Educație fizică | Georgescu Rodica, Petre Cătălin, Sabău Marius Alexandru, Tontsch Hans Jürgen, Țion Ioana Raluca |
| Tehnologii | TIC / Informatică | Butnar Ana Atena, Colțan Carina, Naghi Mihaela, Schneiduch Eva Olga |
| Tehnologii | Educație tehnologică | Dan Rodica Doina, Oswald Livia |
| Tehnologii | Educație antreprenorială | Oswald Livia, Vigheciu Mihaela |

**73 cadre didactice distincte** (unele predau mai multe discipline). Învățătoarele nu sunt listate pe pagina PROFESORI; singurele publicate sunt cele ale claselor pregătitoare 2025-2026: Sîrbu Cristina (A), Dina Alexandra (B), Bratu-Melzer Alexandra (C), Ștefan Alina (D). Statistici (Ofertă 2024-25): 20 de învățătoare (11 gr. I, 3 gr. II, 6 definitivat), 5 profesori cu doctorat, 37 gr. I, 16 gr. II, 22 definitivat, 12 cadre pensionate.

### Profesori din Germania (ZfA)
Pagina „ELEVI / Lehrer aus Deutschland” **nu listează nume**; conține doar textul de recrutare (secțiunea c.9). Numele profesorilor germani (ex. coordonatorul schimbului Troisdorf, Günter Reiner) nu sunt publicate ca listă – de obținut de la școală.

### Personal didactic auxiliar și nedidactic
Paginile DIDACTIC AUXILIAR și NEDIDACTIC conțin doar câte o propoziție-titlu, fără nume. Posturile din PDI 2021-2026: **didactic auxiliar** – administrator, secretar șef, secretar, bibliotecar, inginer de sistem, contabil șef, contabil, laborant (câte 1); **nedidactic** – 4 muncitori, 8 îngrijitori, 2 portari. Organigrama (2017) mai include: consilier educativ, administrator de patrimoniu, comisii metodice pe arii curriculare, Consiliul elevilor, Consiliul reprezentativ al părinților, Comisia de asigurare a calității. Consilieri școlari menționați în PDI (2020): prof. consilier Andreea Laurențiu, Anca Urduzan, Maria Puia; psiholog Carmen Clinci *(de verificat dacă sunt actuali)*.

## (f) Inventar documente

**Rezumat pe categorii (linkuri din pagini):** erasmus – 61; burse-ajutoare-sociale – 51; olimpiade-concursuri – 37; proiecte – 23; evaluare-nationala – 23; admitere-liceu – 18; admitere-clasa-pregatitoare – 15; posturi-vacante-titularizare – 13; corigente-transferuri – 12; bacalaureat – 12; regulamente-legislatie – 8; salarii-venituri – 8; buget-executie-bugetara – 6; liste-clase – 5; activitati – 5; anunturi – 3; pdi-plan-operational – 2; diverse – 2; orar (EXCLUS) – 1; legislatie – 1; proceduri – 1; raport-anual – 1; istorie – 1.

**Categorii de transparență cerute de brief – situația pe site:**
- ROFUIP / ROI / regulamente: DA (ROFUIP aug. 2024, OME 5707+5726/2024 Statutul elevului, Regulament intern 2025-2026 și 2022-2023, Regulament de conduită etică, ROF 2017-2018, Statutul elevului 2016, Legea 198/2023 – link extern).
- PDI / PAS: DA – PDI CNJH 2021-2026, PO (plan operațional) 2025-2026; orfan: PDI 2017-2021, PDI Honterus 21-25 (docx). **PAS (Plan de acțiune al școlii) – NU există.**
- Raport anual: doar „Raport JH final 2016-2017”. **Rapoartele anuale recente lipsesc.**
- Buget / salarii: DA – bilanț 31.12.2024 (BL/BS; *atenție: numele fișierelor spun „31.12.2025”*), buget 2025, execuție bugetară iunie 2025; „Venituri conform art. 33 / Legea 153/2017” (oct. 2021 – sept. 2025; iulie 2023 în XLSX).
- Declarații de avere / interese: **NU există pe site** (orfane: două PDF „CHIVAREAN RADU”/„Radu Chivarean” din 2020 – unul este un CV Europass cu date personale – **NU migrați**).
- Posturi vacante / concursuri / titularizare: DA (pagina Anunțuri, 2022–2026).
- Dezbateri publice: pagina există dar este **goală** (doar slideshow).
- Formulare: pagina FORMULARE este goală; formularele sunt răspândite pe paginile Anunțuri, Admitere, EN, BAC, Clasa pregătitoare, Corigențe (cereri de bursă, înscriere, transfer, contestații, vizualizare).
- Proceduri: Procedura de egalizare a șanselor (2021), proceduri de transfer, proceduri clasa pregătitoare / interviu prin joc, PO proba de limbă.

Coloana **An** = anul din titlu/nume de fișier; dacă lipsește, anul școlar dedus din data încărcării (sept.–dec. → AAAA-AAAA+1). Coloana **HTTP** = status la verificare. **Migrare**: Da = recomandat de preluat (în noua bibliotecă de documente, sub `/media/legacy/...` sau reîncărcat); arhivă = documente expirate (formulare/calendare din anii trecuți) – recomandare: arhivă sau neimportate.

| # | Titlu (ancoră) | Categorie | An | Tip | Încărcat | HTTP | Pagina sursă | URL |
|---|---|---|---|---|---|---|---|---|
| 1 | Parteneriate cu școli din străinătate | activitati | 2018-2019 | pdf | 2019-01-18 | 200 | `/lic/proiecte-programe-parteneriate/activitati/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Parteneriate-cu-școli-din-străinătate.pdf |
| 2 | Regulament Skipokal 2022 | activitati | 2022 | pdf | 2022-03-17 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/03/Regulament-Skipokal-2022.pdf |
| 3 | Jugend debattiert. | activitati | 2022-2023 | pdf | 2022-09-16 | 200 | `/lic/proiecte-programe-parteneriate/activitati/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/09/Jugend-debattiert..pdf |
| 4 | Calendar activitati extrașcolare | activitati | 2022-2023 | docx | 2022-12-05 | 200 | `/lic/proiecte-programe-parteneriate/activitati/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/12/Calendar-activitati-extrascolare.docx |
| 5 | Regulament Skipokal 2024 | activitati | 2024 | pdf | 2024-02-12 | 200 | `/lic/proiecte-programe-parteneriate/activitati/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/02/Regulament-Skipokal-2024.pdf |
| 6 | 2024-2025 aici | admitere-clasa-pregatitoare | 2024-2025 | pdf | 2023-12-13 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/12/2023-2024-aici.pdf |
| 7 | Metodologie înscriere învățământ primar | admitere-clasa-pregatitoare | 2023-2024 | pdf | 2024-03-25 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/03/metodologie-inscriere-invatamant-primar.pdf |
| 8 | Adeverinta-si-aviz-epidemiologic-inscriere-in-colectivitate | admitere-clasa-pregatitoare | 2023-2024 | pdf | 2024-04-03 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/04/adeverinta-si-aviz-epidemiologic-inscriere-in-colectivitate.pdf |
| 9 | INFORMATII INSCRIERE PREGATITOARE 2024-2025 | admitere-clasa-pregatitoare | 2024-2025 | pdf | 2024-04-03 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/04/INFORMATII-INSCRIERE-PREGATITOARE-2024-2025.pdf |
| 10 | Anexa 3 | admitere-clasa-pregatitoare | 2023-2024 | pdf | 2024-04-03 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/04/Anexa-3.pdf |
| 11 | Tabel rezultate finale_ Clasa pregătitoare 2024- 2025 | admitere-clasa-pregatitoare | 2024-2025 | pdf | 2024-05-17 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/05/Tabel-rezultate-finale_-Clasa-pregatitoare-2024-2025.pdf |
| 12 | Raport cu locurile ramase libere dupa prima etapa | admitere-clasa-pregatitoare | 2023-2024 | pdf | 2024-05-29 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/05/Raport-cu-locurile-ramase-libere-dupa-prima-etapa.pdf |
| 13 | OMEC 3435 OMEC 3436 INSCRIERE GRADINITA INV PRIMAR | admitere-clasa-pregatitoare | 2024-2025 | pdf | 2025-03-07 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/03/OMEC-3435-OMEC-3436-INSCRIERE-GRADINITA-INV-PRIMAR.pdf |
| 14 | Anexa 3 | admitere-clasa-pregatitoare | 2025-2026 | pdf | 2025-03-27 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/03/Anexa-3_2025-2026.pdf |
| 15 | Procedură Clasa Pregătitoare 2025-2026 | admitere-clasa-pregatitoare | 2025-2026 | pdf | 2025-03-31 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/03/S22BW-825033112210.pdf |
| 16 | *** ANUNȚ_PREGĂTITOARE_2025_2026 *** | admitere-clasa-pregatitoare | 2025-2026 | pdf | 2025-04-01 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/04/ANUNT_PREGATITOARE_2025_2026.pdf |
| 17 | PROCEDURA EVALUARE CLASA PREGATITOARE | admitere-clasa-pregatitoare | 2025-2026 | pdf | 2026-03-10 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/PROCEDURA-EVALUARE-CLASA-PREGATITOARE-2026-merged.pdf |
| 18 | CALENDAR ÎNSCRIERE CLASA PREGĂTITOARE | admitere-clasa-pregatitoare | 2026-2027 | pdf | 2026-03-10 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/CALENDAR-INSCRIERE-CLASA-PREGATITOARE-2026-2027.pdf |
| 19 | Anexa 3_Declarație_proprie_răspundere_2026-2027 | admitere-clasa-pregatitoare | 2026-2027 | pdf | 2026-03-25 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/Anexa-3_2026-2027.pdf |
| 20 | >> AFIȘ CLASA PREGĂTITOARE – CITIȚI CU ATENȚIE << | admitere-clasa-pregatitoare | 2025-2026 | pdf | 2026-03-30 | 200 | `/lic/clasa-pregatitoare-3/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/S22BW-826032714560.pdf |
| 21 | ORDIN_nr_5243_2022_admitere_liceu | admitere-liceu | 2022 | pdf | 2023-05-08 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/05/ORDIN_nr_5243_2022_admitere_liceu.pdf |
| 22 | calendar_admitere-liceu-2023-2024 | admitere-liceu | 2023-2024 | pdf | 2023-05-08 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/05/calendar_admitere-liceu-2023-2024.pdf |
| 23 | PROCEDURA_PROBA_DE_VERIFICARE_A_CUNOSTINTELOR_DE_LIMBA_MODERNA_MATERNA_ADMITERE_2023_2024 | admitere-liceu | 2023-2024 | pdf | 2023-05-08 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/05/PROCEDURA_PROBA_DE_VERIFICARE_A_CUNOSTINTELOR_DE_LIMBA_MODERNA_MATERNA_ADMITERE_2023_2024.pdf |
| 24 | Anexa_1__Cerere_de_echivalare_2023 | admitere-liceu | 2023 | doc | 2023-05-08 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/05/Anexa_1__Cerere_de_echivalare_2023.doc |
| 25 | Anexa_1A__Repartizarea_unitatilor_de_invatamant_la_centrele_de_examen_1 | admitere-liceu | 2022-2023 | doc | 2023-05-08 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/05/Anexa_1A__Repartizarea_unitatilor_de_invatamant_la_centrele_de_examen_1.doc |
| 26 | Anexa_1B__Graficul_susținerii_probelor | admitere-liceu | 2022-2023 | doc | 2023-05-08 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/05/Anexa_1B__Graficul_sustinerii_probelor.doc |
| 27 | Declarațiile de renunțare la germană se pot depune online (la adresa mai sus menționată)   | admitere-liceu | 2023 | docx | 2023-07-04 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/07/Anexa-nr-5.docx |
| 28 | Cerere inscriere cl a IX a_2023_2024 | admitere-liceu | 2023-2024 | docx | 2023-07-14 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/07/Cerere-inscriere-cl-a-IX-a_2023_2024.docx |
| 29 | Cerere inscriere cl a IX a_2024_2025 | admitere-liceu | 2024-2025 | pdf | 2024-07-19 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/07/Cerere-inscriere-cl-a-IX-a_2024_2025.pdf |
| 30 | CENTRU DE EXAMEN ADMITERE CLASA A IX-A | admitere-liceu | 2024-2025 | pdf | 2025-04-16 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/04/S22BW-825041612130.pdf |
| 31 | Invitatie TL 2025_ISJ BV | admitere-liceu | 2025 | pdf | 2025-05-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/05/Invitatie-TL-2025_ISJ-BV.pdf |
| 32 | Afis TL 2025 | admitere-liceu | 2025 | pdf | 2025-05-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/05/Afis-TL-2025.pdf |
| 33 | Targul liceelor 2025_var 1 | admitere-liceu | 2025 | pdf | 2025-05-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/05/Targul-liceelor-2025_var-1.pdf |
| 34 | REZULTATE ÎN URMA SUSȚINERII PROBELOR DE VERIFICARE A CUNOȘTINȚELOR LA LIMBA GERMANĂ MATER | admitere-liceu | 2025 | pdf | 2025-05-26 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/05/REZULTATE-TABEL-ELEVI-INSCRISI-PENTRU-SUSTINEREA-PROBELOR-DE-VERIFICARE-A-CUNISTINTELOR-LA-LIMBA-GERMANA-MATERNA-2025.pdf |
| 35 | REZULTATE ÎN URMA CONTESTAȚIILOR LA PROBA DE VERIFICARE A CUNOȘTINȚELOR LA LIMBA GERMANĂ M | admitere-liceu | 2025 | pdf | 2025-05-28 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/05/REZULTATE-IN-URMA-CONTESTATIILOR-LA-PROBA-DE-VERIFICARE-A-CUNOSTINTELOR-LA-LIMBA-GERMANA-MATERNA-2025.pdf |
| 36 | ( vă rugăm completați toate rubricile din cerere) | admitere-liceu | 2025-2026 | pdf | 2025-07-21 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/07/Cerere-de-inscriere-pentru-clasa-a-IX_a-2025_2026.pdf |
| 37 | Cerere_inscriere_test_limba_germana_materna | admitere-liceu | 2025-2026 | pdf | 2026-05-12 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/05/Cerere_inscriere_test_limba_germana_materna.pdf |
| 38 | Cerere inscriere cl a IX a_2026_2027 | admitere-liceu | 2026-2027 | pdf | 2026-07-14 | 200 | `/lic/examene/admitere-liceu/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/07/Cerere-inscriere-cl-a-IX-a_2026_2027.pdf |
| 39 | 05 – declaratie-privind-componenta-familiei | anunturi | 2023-2024 | docx | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/05-declaratie-privind-componenta-familiei.docx |
| 40 | Formular inscriere | anunturi | 2023-2024 | pdf | 2023-12-07 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/12/Formular-inscriere.pdf |
| 41 | Cerere venit minim incluziune | anunturi | 2025-2026 | pdf | 2025-09-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/09/Cerere-venit-minim-incluziune.pdf |
| 42 | OMEC_4115_10.04.2020 | bacalaureat | 2020 | pdf | 2020-05-22 | 200 | `/lic/examene/bacalaureat/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/OMEC_4115_10.04.2020.pdf |
| 43 | Anexa_2_OMEC4115 | bacalaureat | 2019-2020 | pdf | 2020-05-22 | 200 | `/lic/examene/bacalaureat/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Anexa_2_OMEC4115.pdf |
| 44 | Procedura egalizare sanse nr 26651_2019 | bacalaureat | 2019 | pdf | 2020-05-22 | 200 | `/lic/examene/bacalaureat/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Procedura-egalizare-sanse-nr-26651_2019.pdf |
| 45 | LISTA NOTELOR INITIALE – BACALAUREAT 2020 | bacalaureat | 2020 | pdf | 2020-06-30 | 200 | `/lic/examene/bacalaureat/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/LISTA-NOTELOR-INITIALE-BACALAUREAT-2020.pdf |
| 46 | Cerere contestatii BAC | bacalaureat | 2019-2020 | pdf | 2020-06-30 | 200 | `/lic/examene/bacalaureat/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Cerere-contestatii-BAC.pdf |
| 47 | Precizari_contestatii_BAC | bacalaureat | 2019-2020 | pdf | 2020-07-05 | 200 | `/lic/examene/bacalaureat/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Precizari_contestatii_BAC.pdf |
| 48 | Procedura_vizualizare_lucrari_Bac_2020 | bacalaureat | 2020 | pdf | 2020-07-07 | 200 | `/lic/examene/bacalaureat/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Procedura_vizualizare_lucrari_Bac_2020.pdf |
| 49 | Model-cerere-vizualizare-lucrari-scrise-bac | bacalaureat | 2019-2020 | docx | 2020-07-07 | 200 | `/lic/examene/bacalaureat/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Model-cerere-vizualizare-lucrari-scrise-bac.docx |
| 50 | Procedura BAC 2021 | bacalaureat | 2021 | pdf | 2021-05-25 | 200 | `/lic/examene/bacalaureat/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2021/05/Procedura-BAC-2021.pdf |
| 51 | calendar_BAC2022 | bacalaureat | 2022 | pdf | 2022-05-09 | 200 | `/lic/examene/bacalaureat/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/05/calendar_BAC2022.pdf |
| 52 | Cerere contestatie BAC Honterus 2022 | bacalaureat | 2022 | pdf | 2022-06-27 | 200 | `/lic/examene/bacalaureat/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/06/Cerere-contestatie-BAC-Honterus-2022.pdf |
| 53 | Afis contestatii Honterus | bacalaureat | 2021-2022 | pdf | 2022-06-27 | 200 | `/lic/examene/bacalaureat/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/06/Afis-contestatii-Honterus.pdf |
| 54 | 01 BILANT 31.12.2024 BUGET LOCAL | buget-executie-bugetara | 2024 | pdf | 2025-07-17 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/07/01-BILANT-31.12.2025-BUGET-LOCAL.pdf |
| 55 | 01 BILANT 31.12.2024 BUGET STAT | buget-executie-bugetara | 2024 | pdf | 2025-07-17 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/07/01-BILANT-31.12.2025-BUGET-STAT.pdf |
| 56 | 02 BUGET STAT 2025 | buget-executie-bugetara | 2025 | pdf | 2025-07-17 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/07/02-BUGET-STAT-2025.pdf |
| 57 | 02 BUGET LOCAL 2025 | buget-executie-bugetara | 2025 | pdf | 2025-07-17 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/07/02-BUGET-LOCAL-2025.pdf |
| 58 | 03 EXECUTIE BUGETARA BS IUNIE 2025 | buget-executie-bugetara | 2025 | pdf | 2025-07-17 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/07/03-EXECUTIE-BUGETARA-BS-IUNIE-2025.pdf |
| 59 | 03 EXECUTIE BUGETARA BL IUNIE 2025 | buget-executie-bugetara | 2025 | pdf | 2025-07-17 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/07/03-EXECUTIE-BUGETARA-BL-IUNIE-2025.pdf |
| 60 | OME-5379_07.09.2022_burse | burse-ajutoare-sociale | 2022 | pdf | 2022-09-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/09/OME-5379_07.09.2022_burse.pdf |
| 61 | burse an scolar 2022_2023 | burse-ajutoare-sociale | 2022-2023 | pdf | 2022-09-13 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/09/burse-an-scolar-2022_2023.pdf |
| 62 | Model-cerere-bursa | burse-ajutoare-sociale | 2022-2023 | docx | 2022-09-13 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/09/Model-cerere-bursa.docx |
| 63 | 01 – critrii acordare burse an 2023_2024 | burse-ajutoare-sociale | 2023-2024 | doc | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/01-critrii-acordare-burse-an-2023_2024.doc |
| 64 | 01 – Ordin 6238_2023 Criterii acordare burse | burse-ajutoare-sociale | 2023 | pdf | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/01-Ordin-6238_2023-Criterii-acordare-burse.pdf |
| 65 | 02 – cerere bursa excelenta I | burse-ajutoare-sociale | 2023-2024 | docx | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/02-cerere-bursa-excelenta-I-1.docx |
| 66 | 02 – cerere bursa excelenta II | burse-ajutoare-sociale | 2023-2024 | docx | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/02-cerere-bursa-excelenta-II.docx |
| 67 | 03 – cerere bursa merit art 7 d | burse-ajutoare-sociale | 2023-2024 | docx | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/03-cerere-bursa-merit-art-7-d.docx |
| 68 | 03 – cerere bursa merit art 7 e | burse-ajutoare-sociale | 2023-2024 | docx | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/03-cerere-bursa-merit-art-7-e.docx |
| 69 | 03 – cerere bursa merit art 7 f | burse-ajutoare-sociale | 2023-2024 | docx | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/03-cerere-bursa-merit-art-7-f.docx |
| 70 | 04 – cerere bursa venituri mici | burse-ajutoare-sociale | 2023-2024 | docx | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/04-cerere-bursa-venituri-mici.docx |
| 71 | 06 -cerere bursa orfan | burse-ajutoare-sociale | 2023-2024 | docx | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/06-cerere-bursa-orfan.docx |
| 72 | 07 -cerere bursa familii monoparentale | burse-ajutoare-sociale | 2023-2024 | docx | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/07-cerere-bursa-familii-monoparentale.docx |
| 73 | 08 – cerere bursa medicala | burse-ajutoare-sociale | 2023-2024 | docx | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/08-cerere-bursa-medicala.docx |
| 74 | 09 -cerere bursa venituri minime incluziune | burse-ajutoare-sociale | 2023-2024 | docx | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/09-cerere-bursa-venituri-minime-incluziune.docx |
| 75 | 10 – cerere bursa mame minore | burse-ajutoare-sociale | 2023-2024 | docx | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/10-cerere-bursa-mame-minore.docx |
| 76 | criterii acordare burse 2024_2025 | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/criterii-acordare-burse-2024_2025.pdf |
| 77 | 01 METODOLOGIE 11-07-2024 5518 burse 2024_2025 | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/01-METODOLOGIE-11-07-2024-5518-burse-2024_2025.pdf |
| 78 | Cerere bursa sociala _ pe motive medicale | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Cerere-bursa-sociala-_-pe-motive-medicale.pdf |
| 79 | Cerere bursa sociala _ pentru elevi cu afectiuni oncologice si_sau cronice | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Cerere-bursa-sociala-_-pentru-elevi-cu-afectiuni-oncologice-si_sau-cronice.pdf |
| 80 | Cerere bursă sociala _ pentru orfan sau plasament | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Cerere-bursa-sociala-_-pentru-orfan-sau-plasament.pdf |
| 81 | Cerere bursa sociala_pentru venit mediu net lunar_ si alte acorduri si declaratii | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Cerere-bursa-sociala_pentru-venit-mediu-net-lunar_-si-alte-acorduri-si-declaratii.pdf |
| 82 | Cerere bursa sociala _pentru venit minim de incluziune | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Cerere-bursa-sociala-_pentru-venit-minim-de-incluziune.pdf |
| 83 | Cerere bursă de merit pentru premii | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Cerere-bursa-de-merit-pentru-premii.pdf |
| 84 | Cerere bursa de rezilienta afectiuni medicale | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Cerere-bursa-de-rezilienta-afectiuni-medicale.pdf |
| 85 | Cerere bursa Excelenta Olimpica I | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Cerere-bursa-Excelenta-Olimpica-I.pdf |
| 86 | Cerere bursa Excelenta Olimpica II | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Cerere-bursa-Excelenta-Olimpica-II.pdf |
| 87 | Cerere bursa sociala_elevi care revin după scolarizarea din cadrul _ Scolii din Spital | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Cerere-bursa-sociala_elevi-care-revin-dupa-scolarizarea-din-cadrul-_-Scolii-din-Spital.pdf |
| 88 | Cerere bursa sociala _familie monoparentala_ si alte acorduri si declaratii | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Cerere-bursa-sociala-_familie-monoparentala_-si-alte-acorduri-si-declaratii.pdf |
| 89 | Cerere bursa sociala _mame minore | burse-ajutoare-sociale | 2024-2025 | pdf | 2024-09-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Cerere-bursa-sociala-_mame-minore.pdf |
| 90 | OMEC_732_BURSE[1] | burse-ajutoare-sociale | 2025-2026 | pdf | 2025-09-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/09/OMEC_732_BURSE1.pdf |
| 91 | Model-cerere-tichete-sociale | burse-ajutoare-sociale | 2025-2026 | pdf | 2025-09-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/09/Model-cerere-tichete-sociale.pdf |
| 92 | OUG 83-12.10.2023_Tichete sociale_Act. 12.09.2025 | burse-ajutoare-sociale | 2023 | pdf | 2025-09-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/09/OUG-83-12.10.2023_Tichete-sociale_Act.-12.09.2025.pdf |
| 93 | Criterii acordare burse an 2025_2026 | burse-ajutoare-sociale | 2025-2026 | pdf | 2025-09-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/09/criterii-acordare-burse-an-2025_2026.pdf |
| 94 | Cerere bursa revenire scolarizare | burse-ajutoare-sociale | 2025-2026 | pdf | 2025-09-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/09/Cerere-bursa-revenire-scolarizare.pdf |
| 95 | Cerere bursa medicala | burse-ajutoare-sociale | 2025-2026 | pdf | 2025-09-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/09/Cerere-bursa-medicala.pdf |
| 96 | Cerere bursa copii orfani | burse-ajutoare-sociale | 2025-2026 | pdf | 2025-09-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/09/Cerere-bursa-copii-orfani.pdf |
| 97 | Cerere bursa mame minore | burse-ajutoare-sociale | 2025-2026 | pdf | 2025-09-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/09/Cerere-bursa-mame-minore.pdf |
| 98 | Cerere bursa afectiuni oncologice si cronice | burse-ajutoare-sociale | 2025-2026 | pdf | 2025-09-12 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/09/Cerere-bursa-afectiuni-oncologice-si-cronice.pdf |
| 99 | Cerere si declaratii pentru bursa venit mic | burse-ajutoare-sociale | 2025-2026 | pdf | 2025-09-19 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/09/Cerere-si-declaratii-pentru-bursa-venit-mediu-1.pdf |
| 100 | Rezultate burse sociale 2025-2026 | burse-ajutoare-sociale | 2025-2026 | pdf | 2025-11-17 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/11/Rezultate-burse-sociale-de-afisat.pdf |
| 101 | HOTARARE (A) 564 04-08-2017 CES | burse-ajutoare-sociale | 2017 | pdf | 2025-12-17 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/12/HOTARARE-A-564-04-08-2017-CES.pdf |
| 102 | ANEXE – DECLARAȚII pe propria răspundere | burse-ajutoare-sociale | 2025-2026 | pdf | 2025-12-17 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/12/ANEXE-CEREREI-CES.pdf |
| 103 | Cerere si declaratii pentru bursa venit mic 2026-2027 | burse-ajutoare-sociale | 2026-2027 | pdf | 2026-09-22 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/09/Cerere-si-declaratii-pentru-bursa-venit-mic-2026_2027.pdf |
| 104 | Cerere bursa medicala 2026-2027 | burse-ajutoare-sociale | 2026-2027 | pdf | 2026-09-22 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/09/Cerere-bursa-medicala-2026_2027.pdf |
| 105 | Cerere bursa copii orfani 2026-2027 | burse-ajutoare-sociale | 2026-2027 | pdf | 2026-09-22 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/09/Cerere-bursa-copii-orfani-2026_2027.pdf |
| 106 | Cerere bursa afectiuni oncologice si cronice | burse-ajutoare-sociale | 2026-2027 | pdf | 2026-09-22 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/09/Cerere-bursa-afectiuni-oncologice-si-cronice.pdf |
| 107 | Cerere bursa revenire scolarizare 2026-2027 | burse-ajutoare-sociale | 2026-2027 | pdf | 2026-09-22 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/09/Cerere-bursa-revenire-scolarizare.pdf |
| 108 | Cerere bursă socială (pentru venit minim de incluziune) 2026-2027 | burse-ajutoare-sociale | 2026-2027 | pdf | 2026-09-22 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/09/Cerere-bursa-sociala-pentru-venit-minim-de-incluziune.pdf |
| 109 | Cerere bursa mame minore 2026-2027 | burse-ajutoare-sociale | 2026-2027 | pdf | 2026-09-22 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/09/Cerere-bursa-mame-minore.pdf |
| 110 | REZULTATE BURSE ELEVI AN ȘCOLAR 2026-2027 | burse-ajutoare-sociale | 2026-2027 | pdf | 2026-10-16 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/10/REZULTATE-BURSE-ELEVI-2026-2027-1.pdf |
| 111 | Extras ROFUIP | corigente-transferuri | 2019-2020 | pdf | 2019-12-20 | 200 | `/lic/examene/corigentetransferuri/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Extras-ROFUIP.pdf |
| 112 | Nota corigente 2021 | corigente-transferuri | 2021 | pdf | 2021-05-25 | 200 | `/lic/examene/corigentetransferuri/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2021/05/Nota-corigente-2021.pdf |
| 113 | Programare examene Transfer 2021 | corigente-transferuri | 2021 | docx | 2021-07-30 | 200 | `/lic/examene/corigentetransferuri/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2021/07/Transfer-2021.docx |
| 114 | Procedura de transfer Colegul Național„ J.Honterus„ | corigente-transferuri | 2021-2022 | doc | 2022-07-15 | 200 | `/lic/examene/corigentetransferuri/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/07/Procedura-de-transfer-Colegul-National„-J.Honterus„.doc |
| 115 | matematica | corigente-transferuri | 2021-2022 | docx | 2022-07-27 | 200 | `/lic/examene/corigentetransferuri/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/07/matematica.docx |
| 116 | informatica 9 | corigente-transferuri | 2021-2022 | pdf | 2022-07-27 | 200 | `/lic/examene/corigentetransferuri/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/07/informatica-9.pdf |
| 117 | informatica 10 | corigente-transferuri | 2021-2022 | pdf | 2022-07-27 | 200 | `/lic/examene/corigentetransferuri/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/07/informatica-10.pdf |
| 118 | istorie | corigente-transferuri | 2021-2022 | docx | 2022-07-27 | 200 | `/lic/examene/corigentetransferuri/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/07/istorie.docx |
| 119 | latina | corigente-transferuri | 2021-2022 | docx | 2022-07-27 | 200 | `/lic/examene/corigentetransferuri/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/07/latina.docx |
| 120 | Nota cu privire la perioadele de desfășurare a examenelor de corigenta in anul scolar 2022 | corigente-transferuri | 2022-2023 | pdf | 2023-06-21 | 200 | `/lic/examene/corigentetransferuri/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/06/Nota-cu-privire-la-perioadele-de-desfasurare-a-examenelor-de-corigenta-in-anul-scolar-2022-2023.pdf |
| 121 | Grafic corigențe | corigente-transferuri | 2022-2023 | docx | 2023-06-23 | 200 | `/lic/examene/corigentetransferuri/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/06/Grafic-corigente.docx |
| 122 | Procedura de transfer Colegul Național J Honterus | corigente-transferuri | 2023-2024 | pdf | 2024-07-12 | 200 | `/lic/examene/corigentetransferuri/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/07/Procedura-de-transfer-Colegul-National-J-Honterus.pdf |
| 123 | Fisa prezentare cabinet_1 | diverse | 2022-2023 | pdf | 2022-09-30 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/09/Fisa-prezentare-cabinet_1-1.pdf |
| 124 | fisa prezentare cabinet_2 | diverse | 2022-2023 | pdf | 2022-09-30 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/09/fisa-prezentare-cabinet_2-1.pdf |
| 125 | ERASMUS + | erasmus | 2018-2019 | pdf | 2018-09-11 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/ERASMUS.pdf |
| 126 | InWASTEgation | erasmus | 2018-2019 | pptx | 2018-09-11 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/InWASTEgation.pptx |
| 127 | REMEDIE | erasmus | 2018-2019 | pptx | 2018-09-11 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/REMEDY.pptx |
| 128 | Descrierea proiectului InWASTEgation | erasmus | 2018-2019 | pdf | 2018-09-12 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Descrierea-proiectului-InWASTEgation.pdf |
| 129 | Anunt selectie elevi | erasmus | 2018-2019 | pdf | 2018-09-12 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Anunt-selectie-elevi.pdf |
| 130 | REMEDIE Descriere proiect | erasmus | 2018-2019 | pdf | 2018-11-08 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/REMEDY-Descriere-proiect.pdf |
| 131 | REMEDY anunt selectie elevi | erasmus | 2018-2019 | pdf | 2018-11-09 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/REMEDY-anunt-selectie-elevi.pdf |
| 132 | Calendar concurs selectie + anexe utile | erasmus | 2018-2019 | pdf | 2018-11-09 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Calendar-concurs-selectie-anexe-utile.pdf |
| 133 | Transnationala Intalnire – Spania | erasmus | 2018-2019 | pdf | 2018-11-26 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Intalnire-transnationala-Spania.pdf |
| 134 | Mobilizează Spania | erasmus | 2018-2019 | pdf | 2019-01-17 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Mobilitate-Spania.pdf |
| 135 | Liceul Johannes Honterus | erasmus | 2018-2019 | pdf | 2019-03-21 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Johannes-Honterus-Highschool.pdf |
| 136 | nu lasă urme | erasmus | 2018-2019 | pdf | 2019-03-21 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/leave-no-trace.pdf |
| 137 | Conferința comună REMEDY | erasmus | 2018-2019 | pdf | 2019-03-21 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Joint-Conference-REMEDY.pdf |
| 138 | MOBILITA OLANDA. | erasmus | 2019-2020 | pdf | 2020-04-22 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/MOBILITATE-OLANDA..pdf |
| 139 | MOBILITATE FINLANDA | erasmus | 2019-2020 | pdf | 2020-04-22 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/MOBILITATE-FINLANDA.pdf |
| 140 | Finnish experience | erasmus | 2019-2020 | pptx | 2020-04-22 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Finnish-experience.pptx |
| 141 | http://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/FILM-DISTOPIC.mp4 | erasmus | 2017 | mp4 | 2020-08-04 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/FILM-DISTOPIC.mp4 |
| 142 | InWASTEgation | erasmus | 2019-2020 | pptx | 2020-08-04 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/InWASTEgation-1.pptx |
| 143 | http://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/FILM-UTOPIC.mp4 | erasmus | 2017 | mp4 | 2020-08-05 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/FILM-UTOPIC.mp4 |
| 144 | Raport evaluare finala profesori Inwastegation | erasmus | 2020-2021 | pdf | 2021-04-20 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2021/04/Raport-evaluare-finala-profesori-Inwastegation.pdf |
| 145 | Raport final de evaluare a rezultatelor elevi Inwastegation | erasmus | 2020-2021 | pdf | 2021-04-20 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2021/04/Raport-final-de-evaluare-a-rezultatelor-elevi-Inwastegation.pdf |
| 146 | Acreditare Afis A4 | erasmus | 2023-2024 | pdf | 2023-09-04 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/Acreditare-Afis-A4.pdf |
| 147 | Calendar selectie elevi | erasmus | 2023-2024 | docx | 2023-09-04 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/Calendar-selectie-elevi.docx |
| 148 | Continut dosar selecție | erasmus | 2023-2024 | docx | 2023-09-04 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/Continut-dosar-selectie.docx |
| 149 | Less is More Afis A4 | erasmus | 2023-2024 | pdf | 2023-09-04 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/Less-is-More-Afis-A4.pdf |
| 150 | Calendar selectie elevi KA2 | erasmus | 2023-2024 | docx | 2023-09-04 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/Calendar-selectie-elevi-KA2.docx |
| 151 | Continut dosar KA2 | erasmus | 2023-2024 | docx | 2023-09-04 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/Continut-dosar-KA2.docx |
| 152 | Anexe dosar KA1 | erasmus | 2023-2024 | pdf | 2023-09-18 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/Anexe-dosar-KA1.pdf |
| 153 | Proc. Selectie elevi KA1. | erasmus | 2023-2024 | pdf | 2023-09-18 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/Proc.-Selectie-elevi-KA1..pdf |
| 154 | Anexe inscriere KA2 | erasmus | 2023-2024 | pdf | 2023-09-18 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/Anexe-inscriere-KA2.pdf |
| 155 | Proc selectie elevi KA2 | erasmus | 2023-2024 | pdf | 2023-09-18 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/Proc-selectie-elevi-KA2.pdf |
| 156 | Anunt mobilitate profesori Troisdorf | erasmus | 2023-2024 | pdf | 2023-10-31 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/10/Anunt-mobilitate-profesori-Troisdorf.pdf |
| 157 | Calendar mobilitati | erasmus | 2023-2024 | pdf | 2023-10-31 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/10/Calendar-mobilitati.pdf |
| 158 | Mobilitate Barcelomna | erasmus | 2023-2024 | pdf | 2024-02-13 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/02/Mobilitate-Barcelomna.pdf |
| 159 | Apel selectie elevi 2024 | erasmus | 2024 | docx | 2024-10-15 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/10/Apel-selectie-elevi-2024.docx |
| 160 | Continut dosar selecție | erasmus | 2024-2025 | docx | 2024-10-15 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/10/Continut-dosar-selectie.docx |
| 161 | Acte inscriere elevi KA1_2024 | erasmus | 2024 | docx | 2024-10-15 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/10/Acte-inscriere-elevi-KA1_2024.docx |
| 162 | Organizarea și desfășurarea procesului de selecție | erasmus | 2024-2025 | docx | 2024-10-15 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/10/Organizarea-si-desfasurarea-procesului-de-selectie.docx |
| 163 | Mobilitate Danemarca | erasmus | 2024-2025 | pdf | 2024-10-31 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/10/Mobilitate-Danemarca.pdf |
| 164 | Mobilitate Portugalia | erasmus | 2024-2025 | pdf | 2024-10-31 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/10/Mobilitate-Portugalia.pdf |
| 165 | Mobilitate Bv_Romania | erasmus | 2024-2025 | pdf | 2024-10-31 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/10/Mobilitate-Bv_Romania.pdf |
| 166 | Curs digital elevi | erasmus | 2024-2025 | pdf | 2024-10-31 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/10/Curs-digital-elevi.pdf |
| 167 | Adra mobility | erasmus | 2024-2025 | pdf | 2024-11-01 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/11/Adra-mobility.pdf |
| 168 | Mobility to Zoetemeer | erasmus | 2024-2025 | pdf | 2024-11-01 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/11/Mobility-to-Zoetemeer.pdf |
| 169 | Mobilitate Florenta | erasmus | 2024-2025 | pdf | 2024-11-01 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/11/Mobilitate-Florenta.pdf |
| 170 | Erasmus Days | erasmus | 2024-2025 | pdf | 2024-11-01 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/11/Erasmus-Days.pdf |
| 171 | Mobilitate Brasov | erasmus | 2024-2025 | pdf | 2024-12-16 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/12/Mobilitate-Brasov.pdf |
| 172 | Job-Shadowing, Walther von der Vogelweide, Bolzano, Italia | erasmus | 2024-2025 | pdf | 2025-03-12 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/03/Job-Shadowing-Walther-von-der-Vogelweide-Bolzano-Italia.pdf |
| 173 | Elevii noștri descoperă Finlanda prin Erasmus | erasmus | 2024-2025 | pdf | 2025-03-27 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/03/Elevii-nostri-descopera-Finlanda-prin-Erasmus.pdf |
| 174 | Mobilități Erasmus+: Brașov – Tampere – Corfu | erasmus | 2024-2025 | pdf | 2025-05-30 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/05/Final-de-proiect-Erasmus-KA1.pdf |
| 175 | Less is More Grecia | erasmus | 2024-2025 | pdf | 2025-05-30 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/05/Less-is-More-Grecia.pdf |
| 176 | Less is More Polonia | erasmus | 2024-2025 | pdf | 2025-05-30 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/05/Less-is-More-Polonia.pdf |
| 177 | Curs Digital: Chat GPT and Basic AI Tools, Florenta, Italia | erasmus | 2025-2026 | pdf | 2025-10-23 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/10/Afis-ERASMUS-Curs-digital.pdf |
| 178 | Curs: From Burnout to Balance, Roma, Italia | erasmus | 2025-2026 | pdf | 2025-10-23 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/10/Curs-Roma.pdf |
| 179 | Valori europene în Spania | erasmus | 2025-2026 | pdf | 2026-04-06 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/04/Valori-europene-in-Spania.pdf |
| 180 | Valori europene în România | erasmus | 2025-2026 | pdf | 2026-04-06 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/04/Valori-europene-in-Romania.pdf |
| 181 | APEL DE SELECTIE ELEVI | erasmus | 2025-2026 | pdf | 2026-05-28 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/05/APEL-DE-SELECTIE-ELEVI.pdf |
| 182 | Job shadowing în Wiesbaden, Germania | erasmus | 2026-2027 | pdf | 2026-10-22 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/10/Job-shadowing-in-Wiesbaden-Germania.pdf |
| 183 | Job shadowing în Murcia, Spania | erasmus | 2026-2027 | pdf | 2026-10-22 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/10/Job-shadowing-in-Murcia-Spania.pdf |
| 184 | Managementul clasei | erasmus | 2026-2027 | pdf | 2026-10-22 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/10/Managementul-clasei.pdf |
| 185 | Integrarea AI și a gândirii critice în predare | erasmus | 2026-2027 | pdf | 2026-10-22 | 200 | `/lic/erasmus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/10/Integrarea-AI-si-a-gandirii-critice-in-predare.pdf |
| 186 | Rezultate finale N 2020 | evaluare-nationala | 2020 | pdf |  | 404 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Rezultate-finale-EN-2020.pdf |
| 187 | ordin 4916_2019 EN VIII 2019-2020 | evaluare-nationala | 2019-2020 | pdf | 2020-05-22 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/ordin-4916_2019-EN-VIII-2019-2020.pdf |
| 188 | OMEC_4115_10.04.2020 | evaluare-nationala | 2020 | pdf | 2020-05-22 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/OMEC_4115_10.04.2020.pdf |
| 189 | Anexa_1_OMEC4115 | evaluare-nationala | 2019-2020 | pdf | 2020-05-22 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Anexa_1_OMEC4115.pdf |
| 190 | ORDIN_nr._840_din_19_mai_2020 | evaluare-nationala | 2020 | pdf | 2020-05-22 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/ORDIN_nr._840_din_19_mai_2020.pdf |
| 191 | ORDIN_nr._841_din_19_mai_2020 | evaluare-nationala | 2020 | pdf | 2020-05-22 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/ORDIN_nr._841_din_19_mai_2020.pdf |
| 192 | Procedura egalizare sanse nr 26651_2019 | evaluare-nationala | 2019 | pdf | 2020-05-22 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Procedura-egalizare-sanse-nr-26651_2019.pdf |
| 193 | Procedura_vizualizare_EN | evaluare-nationala | 2019-2020 | pdf | 2020-06-29 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Procedura_vizualizare_EN.pdf |
| 194 | Model cerere vizualizare lucrari scrise | evaluare-nationala | 2019-2020 | docx | 2020-06-29 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Model-cerere-vizualizare-lucrari-scrise.docx |
| 195 | Cerere reevaluare lucrari model | evaluare-nationala | 2020-2021 | docx | 2021-06-24 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2021/06/Cerere-reevaluare-lucrari-model.docx |
| 196 | calendar_EN2022 | evaluare-nationala | 2022 | pdf | 2022-05-09 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/05/calendar_EN2022.pdf |
| 197 | ANEXA 1_CALENDAR | evaluare-nationala | 2022-2023 | docx | 2023-06-19 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/06/ANEXA-1_CALENDAR.docx |
| 198 | 15-Cerere-contestatii-EN08-in-CEX | evaluare-nationala | 2022-2023 | docx | 2023-06-19 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/06/15-Cerere-contestatii-EN08-in-CEX.docx |
| 199 | Vizualizarea lucrarilor | evaluare-nationala | 2022-2023 | docx | 2023-07-06 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/07/Vizualizarea-lucrarilor.docx |
| 200 | rezultate finale EN | evaluare-nationala | 2023-2024 | pdf | 2024-07-09 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/07/rezultate-finale-EN.pdf |
| 201 | Cerere vizualizare lucrări EN VIII 2024 | evaluare-nationala | 2024 | docx | 2024-07-11 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/07/Cerere-vizualizare-lucrari-EN-VIII-2024.docx |
| 202 | CentralizarevizualizareEN2024 | evaluare-nationala | 2024 | pdf | 2024-07-15 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/07/CentralizarevizualizareEN2024.pdf |
| 203 | Descarcă cerere vizualizare lucrari en | evaluare-nationala | 2024-2025 | pdf | 2025-06-23 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/06/cerere-vizualizare-lucrari-en.pdf |
| 204 | Descarcă cerere contestatie en | evaluare-nationala | 2024-2025 | pdf | 2025-06-23 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/06/cerere-contestatie-en.pdf |
| 205 | Declaratie | evaluare-nationala | 2024-2025 | pdf | 2025-07-08 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/07/Declaratie.pdf |
| 206 | Cerere_vizualizare_EN_2026 | evaluare-nationala | 2026 | pdf | 2026-06-26 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/06/Cerere_vizualizare_EN_2026.pdf |
| 207 | Declarație_confirmare_vizualiz._EN-2026 | evaluare-nationala | 2026 | pdf | 2026-06-26 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/06/Declaratie_confirmare_vizualiz._EN-2026.pdf |
| 208 | Cerere_contestație_EN_2026 | evaluare-nationala | 2026 | pdf | 2026-06-26 | 200 | `/lic/examene/evaluare-nationala/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/06/Cerere_contestatie_EN_2026.pdf |
| 209 | Johannes Honterus Daten Fakten | istorie | 2021-2022 | docx | 2021-10-13 | 200 | `/lic/despre-noi/johannes-honterus/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2021/10/Johannes-Honterus-Daten-Fakten.docx |
| 210 | Ordin 810_2023 privind acordarea facilitatilor de transport elevi | legislatie | 2023 | pdf | 2023-09-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/09/Ordin-810_2023-privind-acordarea-facilitatilor-de-transport-elevi.pdf |
| 211 | aici | liste-clase | 2021-2022 | pdf | 2022-08-29 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/08/aici.pdf |
| 212 | ELEVI PREGATITOARE 2022- 2023 | liste-clase | 2022-2023 | docx | 2022-09-01 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/09/ELEVI-PREGATITOARE-2022-2023.docx |
| 213 | DIRIGINTI-2022_2023 (1) | liste-clase | 2022-2023 | docx | 2022-09-02 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/09/DIRIGINTI-2022_2023-1.docx |
| 214 | PREGATITOARE | liste-clase | 2024-2025 | pdf | 2024-09-05 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/PREGATITOARE.pdf |
| 215 | Clasele a_IX_a | liste-clase | 2024-2025 | pdf | 2024-09-06 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/Clasele-a_IX_a-1.pdf |
| 216 | A_SUBIECT_V | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_SUBIECT_V.pdf |
| 217 | A_BAREM_V | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_BAREM_V.pdf |
| 218 | B_SUBIECT_V | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_SUBIECT_V.pdf |
| 219 | B_BAREM_V | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_BAREM_V.pdf |
| 220 | A_SUBIECT_VI | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_SUBIECT_VI.pdf |
| 221 | A_BAREM_VI | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_BAREM_VI.pdf |
| 222 | B_SUBIECT_VI | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_SUBIECT_VI.pdf |
| 223 | B_BAREM_VI | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_BAREM_VI.pdf |
| 224 | A_SUBIECT_VII | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_SUBIECT_VII.pdf |
| 225 | A_BAREM_VII | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_BAREM_VII.pdf |
| 226 | B_SUBIECT_VII | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_SUBIECT_VII.pdf |
| 227 | B_BAREM_VII | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_BAREM_VII.pdf |
| 228 | A_SUBIECT_VIII | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_SUBIECT_VIII.pdf |
| 229 | A_BAREM_VIII | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_BAREM_VIII.pdf |
| 230 | B_SUBIECT_VIII | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_SUBIECT_VIII.pdf |
| 231 | B_BAREM_VIII | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_BAREM_VIII.pdf |
| 232 | A_SUBIECT_IX | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_SUBIECT_IX.pdf |
| 233 | A_BAREM_IX | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_BAREM_IX.pdf |
| 234 | B_SUBIECT_IX | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_SUBIECT_IX.pdf |
| 235 | B_BAREM_IX | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_BAREM_IX.pdf |
| 236 | A_SUBIECT_X | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_SUBIECT_X.pdf |
| 237 | A_BAREM_X | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_BAREM_X.pdf |
| 238 | B_SUBIECT_X | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_SUBIECT_X.pdf |
| 239 | B_BAREM_X | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_BAREM_X.pdf |
| 240 | A_SUBIECT_XI | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_SUBIECT_XI.pdf |
| 241 | A_BAREM_XI | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_BAREM_XI.pdf |
| 242 | B_SUBIECT_XI | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_SUBIECT_XI.pdf |
| 243 | B_BAREM_ XI | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_BAREM_-XI.pdf |
| 244 | A_SUBIECT_XII | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_SUBIECT_XII.pdf |
| 245 | A_BAREM_XII | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/A_BAREM_XII.pdf |
| 246 | B_SUBIECT_XII | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_SUBIECT_XII.pdf |
| 247 | B_BAREM_XII | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-13 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/B_BAREM_XII.pdf |
| 248 | formular contestatii germana materna | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-14 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/formular-contestatii-germana-materna.pdf |
| 249 | Anunt contestatii | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-14 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/Anunt-contestatii.pdf |
| 250 | rezultate finale sectiunea A | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-17 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/rezultate-finale-sectiunea-A.pdf |
| 251 | rezultate finale sectiunea B | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-17 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/rezultate-finale-sectiunea-B.pdf |
| 252 | CERERE_DECLARATIE_VIZUALIZARE_LUCRARE | olimpiade-concursuri | 2025-2026 | pdf | 2026-03-18 | 200 | `/lic/examene/olimpiade/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/03/CERERE_DECLARATIE_VIZUALIZARE_LUCRARE.pdf |
| 253 | orar 2023-2024 | orar (EXCLUS) | 2023-2024 | pdf | 2023-11-16 | 200 | `/lic/informatii-2/orar/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/11/orar-2023-2024.pdf |
| 254 | PDI CNJH 2021_2026 | pdi-plan-operational | 2021-2026 | pdf | 2026-07-31 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/07/PDI-CNJH-21_26.pdf |
| 255 | PO_HONTERUS_2025-2026 | pdi-plan-operational | 2025-2026 | pdf | 2026-07-31 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/07/PO_HONTERUS_5.pdf |
| 256 | ORDIN nr 5578 2021 Metodologie mobilitate personal | posturi-vacante-titularizare | 2021 | pdf | 2022-10-18 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/10/ORDIN-nr-5578-2021-Metodologie-mobilitate-personal.pdf |
| 257 | Anunt concurs | posturi-vacante-titularizare | 2023-2024 | pdf | 2023-12-07 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/12/Anunt-concurs.pdf |
| 258 | REZULTATE SELECTIE DOSARE CONCURS | posturi-vacante-titularizare | 2023-2024 | pdf | 2023-12-30 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/12/REZULTATE-SELECTIE-DOSARE-CONCURS.pdf |
| 259 | CANDIDATI_PROBA_ORALA_GERMANA | posturi-vacante-titularizare | 2023-2024 | pdf | 2024-05-28 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/05/CANDIDATI_PROBA_ORALA_GERMANA.pdf |
| 260 | PLANIFICAREA INSPECTIILOR LA CLASA | posturi-vacante-titularizare | 2023-2024 | pdf | 2024-06-03 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/06/PLANIFICAREA-INSPECTIILOR-LA-CLASA.pdf |
| 261 | Anunt ocupare posturi an scolar 2024_25 | posturi-vacante-titularizare | 2024-2025 | pdf | 2024-10-01 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/10/Anunt-ocupare-posturi-an-scolar-2024_25.pdf |
| 262 | Anunt concurs ocupare posturi nedidactic | posturi-vacante-titularizare | 2024-2025 | pdf | 2024-10-08 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/10/Anunt-concurs-ocupare-posturi-nedidactic.pdf |
| 263 | conditii specifice de ocupare a posturilor vacante | posturi-vacante-titularizare | 2024-2025 | pdf | 2025-02-26 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/02/conditii-specifice-de-ocupare-a-posturilor-vacante.pdf |
| 264 | Condiții specifice pentru ocuparea posturilor cadrelor vacante pentru anul școlar 2025-202 | posturi-vacante-titularizare | 2025-2026 | pdf | 2025-03-05 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/03/S22BW-825030516580.pdf |
| 265 | Condiții specifice pentru ocuparea posturilor cadrelor vacante pentru anul școlar 2026-202 | posturi-vacante-titularizare | 2026-2027 | pdf | 2026-02-27 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/02/S22BW-826022612030.pdf |
| 266 | Invatatori limba germana materna | posturi-vacante-titularizare | 2025-2026 | pdf | 2026-06-02 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/06/S22BW-826060209500.pdf |
| 267 | Profesori limba germana materna | posturi-vacante-titularizare | 2025-2026 | pdf | 2026-06-02 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/06/S22BW-826060209510.pdf |
| 268 | Candidati proba limba | posturi-vacante-titularizare | 2025-2026 | pdf | 2026-06-03 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/06/Proba-limba-17.06.pdf |
| 269 | Procedura asigurarea conditiilor de egalizare a sanselor | proceduri | 2020-2021 | pdf | 2021-03-16 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2021/03/Procedura-asigurarea-conditiilor-de-egalizare-a-sanselor.pdf |
| 270 | Willkommen în Europa – Projektbeschreibung | proiecte | 2019-2020 | pdf | 2019-10-22 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Willkommen-in-Europa-Projektbeschreibung.pdf |
| 271 | Anunt concurs selectie echipa de implementare | proiecte | 2019-2020 | pdf | 2019-10-22 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Anunt-concurs-selectie-echipa-de-implementare.pdf |
| 272 | Procedura de selecție a echipei de implementare | proiecte | 2019-2020 | pdf | 2019-10-22 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Procedura-de-selectie-echipa-implementare.pdf |
| 273 | Fisa de evaluare | proiecte | 2019-2020 | pdf | 2019-10-22 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Fisa-de-evaluare.pdf |
| 274 | Angajament de participare | proiecte | 2019-2020 | pdf | 2019-10-22 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Angajament-de-participare-1.pdf |
| 275 | Descriere proiect | proiecte | 2019-2020 | pdf | 2019-10-25 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Descriere-proiect.pdf |
| 276 | Anunt concurs selectie echipa de implementare | proiecte | 2019-2020 | pdf | 2019-10-25 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Anunt-concurs-selectie-echipa-de-implementare-1.pdf |
| 277 | Procedura de selectie | proiecte | 2019-2020 | pdf | 2019-10-25 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Procedura-de-selectie.pdf |
| 278 | Fisa de evaluare 3 | proiecte | 2019-2020 | pdf | 2019-10-25 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Fisa-de-evaluare-3.pdf |
| 279 | Angajament | proiecte | 2019-2020 | pdf | 2019-10-25 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Angajament.pdf |
| 280 | Descriere proiect RO + DE | proiecte | 2019-2020 | pdf | 2019-11-01 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Descriere-proiect-RODE.pdf |
| 281 | Anunt selectie elevi | proiecte | 2019-2020 | pdf | 2019-11-01 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Anunt-selectie-elevi-1.pdf |
| 282 | Anunt selectie elevi | proiecte | 2019-2020 | pdf | 2019-11-05 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Anunt-selectie-elevi-2.pdf |
| 283 | Mobilizați Corfu_ziua 1-3 | proiecte | 2019-2020 | pdf | 2020-02-20 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Mobilitate-Corfu_ziua-1-3.pdf |
| 284 | Mobilizați Corfu_ziua 4-6 | proiecte | 2019-2020 | pdf | 2020-02-21 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Mobilitate-Corfu_ziua-4-6.pdf |
| 285 | Les Jeunes | proiecte | 2020-2021 | pptx | 2020-10-01 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2020/10/Les-Jeunes.pptx |
| 286 | http://liceulhonterusbrasov.ro/lic/wp-content/uploads/2021/11/VID-20211112-WA0001.mp4 | proiecte | 2021 | mp4 | 2021-11-12 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2021/11/VID-20211112-WA0001.mp4 |
| 287 | Proiecte Internaționale | proiecte | 2022-2023 | pdf | 2022-09-14 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/09/Proiecte-Internationale.pdf |
| 288 | Calendar Proiecte Europene | proiecte | 2022-2023 | docx | 2022-12-05 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/12/Calendar-Proiecte-Europene.docx |
| 289 | REGULAMENT Schüleraustausch | proiecte | 2022-2023 | pdf | 2023-07-22 | 200 | `/lic/informatii-2/anunturi/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/07/REGULAMENT-Schuleraustausch.pdf |
| 290 | Comunicat presa final | proiecte | 2025-2026 | pdf | 2025-12-02 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/12/Comunicat-presa-final.pdf |
| 291 | http://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/12/VID-20251125-WA0009.mp4 | proiecte | 2025 | mp4 | 2025-12-02 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/12/VID-20251125-WA0009.mp4 |
| 292 | Comunicat presa initial | proiecte | 2025-2026 | pdf | 2025-12-02 | 200 | `/lic/proiecte-programe-parteneriate/proiecte/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/12/Comunicat-presa-initial.pdf |
| 293 | Raport JH final 2016_2017 | raport-anual | 2016-2017 | pdf | 2017-10-11 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Raport-JH-final-2016_2017.pdf |
| 294 | STATUT ELEVI OM_4742_10.08.2016 | regulamente-legislatie | 2016 | pdf | 2017-10-09 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/STATUT-ELEVI-OM_4742_10.08.2016.pdf |
| 295 | Modificare ROF OMEN 3027_2018_2 | regulamente-legislatie | 2018 | pdf | 2018-01-30 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Modificare-ROF-OMEN-3027_2018_2.pdf |
| 296 | ROF cu anexe 2017-2018 modif 3027 | regulamente-legislatie | 2017-2018 | pdf | 2018-07-24 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/ROF-cu-anexe-2017-2018-modif-3027.pdf |
| 297 | Regulament intern 2022-2023 | regulamente-legislatie | 2022-2023 | docx | 2023-06-12 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/06/Regulament-intern-2022-2023.docx |
| 298 | ROFUIP august 2024 | regulamente-legislatie | 2024 | pdf | 2024-09-04 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/ROFUIP-august-2024.pdf |
| 299 | OME 5707 si 5726_2024_MO Partea I nr. 795_Statutul elevului + ROFUIP_incepand cu 01.09.202 | regulamente-legislatie | 2024 | pdf | 2024-09-04 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/09/OME-5707-si-5726_2024_MO-Partea-I-nr.-795_Statutul-elevului-ROFUIP_incepand-cu-01.09.2024.pdf |
| 300 | REGULAMENT INTERN 2025_2026 | regulamente-legislatie | 2025-2026 | pdf | 2026-02-18 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/02/REGULAMENT-INTERN-2025_2026.pdf |
| 301 | Regulament de conduita etica si deontologie profesionala | regulamente-legislatie | 2025-2026 | pdf | 2026-02-24 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2026/02/Regulament-de-conduita-etica-si-deontologie-profesionala.pdf |
| 302 | Incadrari 2021 oct | salarii-venituri | 2021 | pdf | 2021-10-18 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2021/10/Incadrari-2021-oct.pdf |
| 303 | Martie 2022 | salarii-venituri | 2022 | pdf | 2022-04-04 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/04/Martie-2022.pdf |
| 304 | octombrie 2022 | salarii-venituri | 2022 | pdf | 2022-09-30 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/09/octombrie-2022-1.pdf |
| 305 | martie 2023 | salarii-venituri | 2023 | pdf | 2023-03-31 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/03/martie-2023.pdf |
| 306 | iulie 2023 | salarii-venituri | 2023 | xlsx | 2023-08-02 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/08/iulie-2023.xlsx |
| 307 | februarie 2024 | salarii-venituri | 2024 | pdf | 2024-03-29 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/03/februarie-2024.pdf |
| 308 | martie 2025 | salarii-venituri | 2025 | pdf | 2025-03-27 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/03/S22BW-825032716210.pdf |
| 309 | Septembrie_2025 | salarii-venituri | 2025 | pdf | 2025-10-15 | 200 | `/lic/informatii/documente-utile/` | https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2025/10/Septembrie_2025.pdf |

### f.2 Fișiere media nelegate de nicio pagină (orfane) – 263
Prezente în biblioteca media WordPress, accesibile public prin URL direct, dar fără link din pagini (majoritatea versiuni vechi 2017–2023 sau înlocuite). Lista completă (titlu, dată, URL) este în JSON `orphanMedia`. Selecție relevantă:

- 2024-04-09 – Oferta 2024_2025 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2024/04/Oferta-2024_2025.pdf
- 2023-06-12 – PDI Honterus 21 -25 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2023/06/PDI-Honterus-21-25.docx
- 2022-10-27 – orar 2022-2023 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2022/10/orar-2022-2023.pdf **[orar – exclus]**
- 2020-11-06 – declaratie profesor – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2020/11/declaratie-profesor.docx
- 2020-05-04 – CHIVAREAN RADU – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/CHIVAREAN-RADU.pdf **[CONȚINE DATE PERSONALE – NU MIGRA]**
- 2020-05-04 – Radu Chivarean – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Radu-Chivarean.pdf **[CONȚINE DATE PERSONALE – NU MIGRA]**
- 2020-04-22 – Raport mobilitate FI. – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Raport-mobilitate-FI..pdf
- 2019-02-25 – Liceul Honterus – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Liceul-Honterus.ppsx
- 2019-02-22 – Regulament Skipokal 2019 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Regulament-Skipokal-2019.docx
- 2019-02-20 – Oferta educațională 2018_2019 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Oferta-educațională-2018_2019-.pdf
- 2018-09-26 – DSD – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/DSD.pdf
- 2018-06-07 – Regulament Honterusfest 2018 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Regulament-Honterusfest-2018.pdf
- 2018-02-21 – Regulament Skipokal 2018 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Regulament-Skipokal-2018.pdf
- 2018-01-30 – ROF CRP 18.10.2017 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/ROF-CRP-18.10.2017.pdf
- 2017-12-24 – CUVÂNTUL DIRECTORULUI – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/CUVÂNTUL-DIRECTORULUI.pdf
- 2017-12-11 – CV – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/CV.pdf **[CONȚINE DATE PERSONALE – NU MIGRA]**
- 2017-11-20 – OFERTA EDUCATIONALA 2017-2018 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/OFERTA-EDUCATIONALA-2017-2018.pdf
- 2017-10-18 – PDI Honterus 2017- 2021 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/PDI-Honterus-2017-2021.pdf
- 2017-10-09 – Lista functiilor si veniturilor brute – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Lista-functiilor-si-veniturilor-brute.pdf
- 2017-10-03 – REGULAMENT INTERN – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/REGULAMENT-INTERN-.pdf
- 2017-10-02 – ROF 2017-2018 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/ROF-2017-2018.pdf
- 2017-05-30 – Regulament Honterusfest 2017 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Regulament-Honterusfest-2017.pdf
- 2017-05-19 – ORGANIGRAMA – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/ORGANIGRAMA.pdf
- 2017-05-04 – Oferta educationala 2017-2018 – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Oferta-educationala-2017-2018.pdf
- 2017-02-14 – Regulament de organizare si functionare – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Regulament-de-organizare-si-functionare.pdf
- 2017-02-14 – Regulament de ordine interioara – https://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Regulament-de-ordine-interioara.pdf

## (g) Inventar anunțuri (cele mai recente 42, datate)

Site-ul nu are articole WordPress; anunțurile sunt secțiuni (separate prin linii „____”) pe pagina ANUNȚURI și pe paginile tematice. **Datele sunt reconstituite** (coloana „Sursa datei”): data cea mai recentă de încărcare a fișierelor atașate, data evenimentului sau data modificării paginii. Textul complet și atașamentele sunt în JSON `news[]`. Slug propus: `/ro/anunturi/<slug>`.

| Data | Titlu | Rezumat | Atașamente | Sursa datei | Pagina sursă | Slug propus |
|---|---|---|---|---|---|---|
| 2026-10-22 | Erasmus+ KA1 – apel de selecție elevi și mobilități 2025-2026 | Acreditare Erasmus+ 2022-1-RO01-KA120-SCH-000105343: job shadowing (Wiesbaden, Murcia), cursuri pentru profesori și mobilități de învățare cu elevi. | 7 | latest upload date of attached files | `/lic/erasmus/` | `/ro/anunturi/erasmus-ka1-apel-de-selectie-elevi-si-mobilitati-2025-2026` |
| 2026-10-16 | Rezultate burse elevi – an școlar 2026-2027 | Bursele de merit propuse de diriginți au fost aprobate: 128 de dosare. Lista rezultatelor este publicată în format PDF. | 1 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/rezultate-burse-elevi-an-scolar-2026-2027` |
| 2026-09-22 | Acordarea burselor 2026-2027 – depunerea cererilor | Cererile de bursă se depun în 25 de zile calendaristice de la începerea anului școlar (ultima zi: 1 octombrie 2026), la secretariat (corp B) până la ora 15:00 sau online la honterus.burse@gmail.com. Sunt publicate formularele pentru fiecare tip de bursă. | 8 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/acordarea-burselor-2026-2027-depunerea-cererilor` |
| 2026-09-15 | Dosare CES – an școlar 2026-2027 | Cererile pentru dosarele CES (cerințe educaționale speciale) se depun la secretariat la începutul anului școlar sau la data obținerii certificatului de orientare școlară; lista documentelor necesare. | 2 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/dosare-ces-an-scolar-2026-2027` |
| 2026-09-15 | Tichete sociale 2026-2027 | Cererile pentru tichetele sociale se depun în 25 de zile calendaristice de la începerea anului școlar (ultima zi: 1 octombrie 2026). | 2 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/tichete-sociale-2026-2027` |
| 2026-07-31 | Bacalaureat 2026 – centre de examen și evaluarea competențelor | Centrul de evaluare a competențelor și arondarea la centrele de examen pentru sesiunea iulie–august 2026. | 5 | explicit/event date or page modified (no dated attachment) | `/lic/examene/bacalaureat/` | `/ro/anunturi/bacalaureat-2026-centre-de-examen-si-evaluarea-competentelor` |
| 2026-07-14 | Admitere la liceu 2026 – înscrierea candidaților repartizați | Înscrierea candidaților repartizați la colegiu: 23, 24 și 27 iulie 2026; documente necesare; probele de limba germană maternă pentru clasa a IX-a (înscriere 13–15 mai, proba scrisă 22 mai 2026). | 13 | explicit/event date or page modified (no dated attachment) | `/lic/examene/admitere-liceu/` | `/ro/anunturi/admitere-la-liceu-2026-inscrierea-candidatilor-repartizati` |
| 2026-07-01 | Transferul elevilor pentru anul școlar 2026-2027 – examene de diferențe | Examene de diferențe 24–28.08.2026; locuri libere: 1 loc a X-a uman – filologie, 1 loc a X-a real – științe ale naturii; probă eliminatorie la limba germană maternă. | 2 | explicit/event date or page modified (no dated attachment) | `/lic/examene/corigentetransferuri/` | `/ro/anunturi/transferul-elevilor-pentru-anul-scolar-2026-2027-examene-de-diferente` |
| 2026-06-26 | Evaluarea Națională 2026 – vizualizarea lucrărilor și contestații | Cererile de vizualizare: 1 iulie 2026; contestații 1–3 iulie 2026, la secretariat sau online la contestatii2026@liceulhonterusbrasov.ro. | 8 | latest upload date of attached files | `/lic/examene/evaluare-nationala/` | `/ro/anunturi/evaluarea-nationala-2026-vizualizarea-lucrarilor-si-contestatii` |
| 2026-06-03 | Titularizare 2026 – inspecții speciale și testul de limba germană | Colegiul este centru de susținere a inspecției speciale la clasă (învățători și profesori de limba germană maternă). Testul de limba germană pentru titularizare/detașare: miercuri, 17.06.2026, ora 9:00. | 4 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/titularizare-2026-inspectii-speciale-si-testul-de-limba-germana` |
| 2026-04-20 | Oferta educațională 2026-2027 | 4 clase pe fiecare an de studiu, de la clasa pregătitoare la a XII-a; la liceu câte 2 clase profil real și 2 profil umanist. | 0 | explicit/event date or page modified (no dated attachment) | `/lic/informatii/formulare-2/` | `/ro/anunturi/oferta-educationala-2026-2027` |
| 2026-03-30 | Clasa pregătitoare 2026-2027 – înscriere și rezultatele interviului prin joc | 76 de locuri (4 clase), toate ocupate. Ziua porților deschise: joi, 2 aprilie 2026, 12:00–15:00 (corp D – Poarta Schei). | 5 | latest upload date of attached files | `/lic/clasa-pregatitoare-3/` | `/ro/anunturi/clasa-pregatitoare-2026-2027-inscriere-si-rezultatele-interviului-prin-joc` |
| 2026-03-18 | Olimpiada de limba și literatura germană maternă – etapa județeană (14.03.2026) | Rezultatele inițiale: 19 martie 2026; contestații 11–15; rezultatele finale: 20 martie 2026 (site-ul ISJ Brașov și avizierul colegiului). | 3 | latest upload date of attached files | `/lic/examene/olimpiade/` | `/ro/anunturi/olimpiada-de-limba-si-literatura-germana-materna-etapa-judeteana-14-03-2026` |
| 2026-03-17 | Olimpiada de limba și literatura română pentru minorități – etapa județeană (13.03.2026) | Subiecte, bareme și rezultatele finale pe secțiunile A și B, clasele V–XII. | 35 | latest upload date of attached files | `/lic/examene/olimpiade/` | `/ro/anunturi/olimpiada-de-limba-si-literatura-romana-pentru-minoritati-etapa-judeteana-13-03-` |
| 2026-02-25 | Simularea EN VIII și a Bacalaureatului 2025-2026 | Simulare EN VIII: 16–18 martie 2026; simulare BAC: 23–26 martie 2026; rezultate EN: 30 martie 2026. | 2 | explicit/event date or page modified (no dated attachment) | `/lic/examene/simulare-examene-nationale/` | `/ro/anunturi/simularea-en-viii-si-a-bacalaureatului-2025-2026` |
| 2025-12-02 | Proiectul SmartLab | Comunicatele de presă inițial și final ale proiectului SmartLab și un material video. | 4 | latest upload date of attached files | `/lic/proiecte-programe-parteneriate/proiecte/` | `/ro/anunturi/proiectul-smartlab` |
| 2025-11-17 | Acordarea burselor 2025-2026 | Rezultatele burselor sociale 2025-2026 și formularele de cerere; termen de depunere 2 octombrie 2025. | 10 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/acordarea-burselor-2025-2026` |
| 2025-09-12 | Tichete sociale 2025-2026 | Cererile pentru tichete sociale se depun până la 2 octombrie 2025. | 2 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/tichete-sociale-2025-2026` |
| 2025-09-12 | Dosare CES – an școlar 2025-2026 | Depunerea dosarelor CES pentru anul școlar 2025-2026 și documentele necesare. | 2 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/dosare-ces-an-scolar-2025-2026` |
| 2025-09-01 | Festivitatea de început de an școlar 2025-2026 | Festivitatea a avut loc luni, 08.09.2025, ora 9:00, pe terenul de sport al Corpului D (fostul Liceu Sportiv); slujba ecumenică la 10:00 și 10:45. Listele claselor pregătitoare sunt afișate la avizier. | 0 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/festivitatea-de-inceput-de-an-scolar-2025-2026` |
| 2025-09-01 | Clasa a IX-a 2025-2026 – repartizare și cereri de transfer între clase | Numărul de locuri la clasa a IX-a nu se poate suplimenta; nu se fac transferuri între profiluri. Se admit schimburi între clase în perechi (fete-fete, băieți-băieți), același profil; termen 05.09.2025, ora 12. | 0 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/clasa-a-ix-a-2025-2026-repartizare-si-cereri-de-transfer-intre-clase` |
| 2025-06-10 | Titularizare / detașare 2025 – testul de limba germană | Testul de limba germană pentru candidații la titularizare și detașare: marți, 17.06.2025, ora 8:00, în Sala Festivă. | 0 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/titularizare-detasare-2025-testul-de-limba-germana` |
| 2025-05-12 | Târgul liceelor 2025 | Invitația și afișul ISJ Brașov pentru Târgul liceelor 2025. | 5 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/targul-liceelor-2025` |
| 2025-04-01 | Clasa pregătitoare 2025-2026 – învățătoarele și rezultatele | Învățătoarele claselor pregătitoare A–D și rezultatele interviului prin joc; suplimentare aprobată: 94 de candidați admiși + 2 cetățeni germani. | 6 | latest upload date of attached files | `/lic/clasa-pregatitoare-3/` | `/ro/anunturi/clasa-pregatitoare-2025-2026-invatatoarele-si-rezultatele` |
| 2025-03-05 | Condiții specifice pentru ocuparea posturilor vacante 2025-2026 | Condițiile specifice ale colegiului pentru ocuparea posturilor didactice vacante în toate etapele de mobilitate 2025-2026. | 4 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/conditii-specifice-pentru-ocuparea-posturilor-vacante-2025-2026` |
| 2025-03-01 | Proiectul „Sprijin educațional pentru preșcolarii și elevii dezavantajați” | Proiect cofinanțat din Fondul Social European+ prin Programul Incluziune și Demnitate Socială 2021-2027, cod My SMIS 319029. | 3 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/proiectul-sprijin-educational-pentru-prescolarii-si-elevii-dezavantajati` |
| 2024-10-08 | Concurs pentru ocuparea posturilor (nedidactic / 2024-2025) | Anunțuri de concurs pentru ocuparea posturilor nedidactice și a posturilor pentru anul școlar 2024-2025. | 2 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/concurs-pentru-ocuparea-posturilor-nedidactic-2024-2025` |
| 2024-09-16 | Criterii de acordare a burselor 2024-2025 | Criteriile și metodologia de acordare a burselor (OM 5518/2024) și formularele de cerere. | 14 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/criterii-de-acordare-a-burselor-2024-2025` |
| 2024-09-06 | Deschiderea oficială a anului școlar 2024-2025 | 9:00 festivitate pe Arena sportivă (Corp D); 10:00 și 10:45 slujbă ecumenică în Biserica Neagră; repartizarea pe clase (pregătitoare, a IX-a). | 2 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/deschiderea-oficiala-a-anului-scolar-2024-2025` |
| 2024-06-03 | Titularizare 2024 – inspecții la clasă și proba orală de germană | Planificarea inspecțiilor la clasă și proba orală de limba germană (Sala Festivă, 03.06.2024, ora 13:00). | 2 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/titularizare-2024-inspectii-la-clasa-si-proba-orala-de-germana` |
| 2024-02-15 | Cupa Honterus la ski – 21 februarie 2024 | Concursul de schi Honterus Ski Pokal 2024; detalii pe pagina Activități. | 1 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/cupa-honterus-la-ski-21-februarie-2024` |
| 2023-12-30 | Concurs pentru ocuparea unui post temporar vacant | Anunț de concurs, formular de înscriere și rezultatele selecției dosarelor. | 4 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/concurs-pentru-ocuparea-unui-post-temporar-vacant` |
| 2023-09-18 | Criterii de acordare a burselor 2023-2024 | Criteriile (Ordin 6238/2023) și formularele de cerere pentru burse 2023-2024. | 14 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/criterii-de-acordare-a-burselor-2023-2024` |
| 2023-09-15 | Ordinul 810/2023 privind facilitățile de transport pentru elevi | Publicarea Ordinului 810/2023 privind acordarea facilităților de transport pentru elevi. | 1 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/ordinul-810-2023-privind-facilitatile-de-transport-pentru-elevi` |
| 2023-09-01 | Deschiderea oficială a anului școlar 2023-2024 | 9:30 festivitate în curtea școlii (Corp D); 10:30 și 11:15 slujbă ecumenică în Biserica Neagră. | 1 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/deschiderea-oficiala-a-anului-scolar-2023-2024` |
| 2023-09-01 | Listele claselor pregătitoare și a IX-a 2023-2024 | Listele (cu diriginții/învățătorii) sunt afișate la avizierul din holul colegiului (corp B); schimburi între clase de același profil, în pereche, până la 08.09.2023. | 0 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/listele-claselor-pregatitoare-si-a-ix-a-2023-2024` |
| 2023-07-22 | Schimb de elevi cu Europaschule Troisdorf (23–29 septembrie 2023) | Înscriere pentru elevii claselor a IX-a, 13 locuri disponibile; coordonatori Bianca Man și Günter Reiner. | 1 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/schimb-de-elevi-cu-europaschule-troisdorf-23-29-septembrie-2023` |
| 2022-10-20 | Concurs pentru posturile/catedrele vacante 2022-2023 (31.10.2022) | Concurs pentru catedre de matematică, educație fizică, geografie și un post de învățător limba germană; calendar 24.10–02.11.2022. | 2 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/concurs-pentru-posturile-catedrele-vacante-2022-2023-31-10-2022` |
| 2022-09-13 | Criterii de acordare a burselor 2022-2023 | Criteriile de acordare a burselor (OME 5379/2022) și modelul de cerere. | 3 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/criterii-de-acordare-a-burselor-2022-2023` |
| 2022-09-02 | Deschiderea festivă a anului școlar 2022-2023 | Luni, 05.09.2022, ora 9:00, pe Arena sportivă a colegiului; slujbă ecumenică în Biserica Neagră; liste diriginți, clase pregătitoare și a IX-a. | 3 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/deschiderea-festiva-a-anului-scolar-2022-2023` |
| 2022-04-01 | Pretransfer 2022 – inspecția specială la clasă | Candidații înscriși la pretransfer susțin, ca și condiție specifică, inspecția specială la clasă (OME 5578/2021). | 1 | explicit/event date or page modified (no dated attachment) | `/lic/informatii-2/anunturi/` | `/ro/anunturi/pretransfer-2022-inspectia-speciala-la-clasa` |
| 2022-03-17 | Honterus Ski Pokal 2022 | Concurs de schi organizat cu Asociația Prohonterus, vineri 25 martie 2022, Poiana Brașov, pârtia Drumul Roșu; clasele V–XII pe trei grupe. | 1 | latest upload date of attached files | `/lic/informatii-2/anunturi/` | `/ro/anunturi/honterus-ski-pokal-2022` |

## (h) Platforme și linkuri externe verificate

| Platformă | URL | Status HTTP (26.11.2026) | Prezent pe site-ul vechi? | Observații |
|---|---|---|---|---|
| NoteInCatalog – pagină produs | https://noteincatalog.ro | 200 (titlu „NoteInCatalog — Catalogul electronic școlar”) | Nu |  |
| NoteInCatalog – www | https://www.noteincatalog.ro | 200 (același conținut) | Nu | http:// → 301 → https://noteincatalog.ro/ |
| **NoteInCatalog – autentificare (recomandat)** | **https://app.noteincatalog.ro/login** | https://app.noteincatalog.ro → 302 → /login → 200 | Nu | Link-ul „Autentificare” de pe noteincatalog.ro; există și /register-parent (200), /forgot-password; arhive anuale 2425/2526.noteincatalog.ro (200); 2627.noteincatalog.ro nu răspunde |
| Google Classroom | https://classroom.google.com | 302 → accounts.google.com (login Google) | Nu | Funcțional; nu se poate verifica domeniul Workspace al școlii |
| Facebook (oficial) | — | — | Nu | Nu există link către o pagină oficială; singurul link FB este o postare de pe un **profil personal** (story_fbid=253747403726248) → redirect la login. Căutare web: nicio pagină oficială identificată. **De obținut de la școală.** |
| Instagram / TikTok / LinkedIn | — | — | Nu | Niciun link |
| YouTube (canal) | — | — | Nu | Nu există canal; doar videoclipuri individuale: dbX-JN3K4t8 (Honterus 480, youtu.be → 303), HO08QtTZC5I (Präsentationsfilm), FL3gFZWEgCY, embed 4D4EPkuRy8Q, 6UGFlmrTp_k – YouTube a cerut captcha la verificare |
| ISJ Brașov | https://www.isjbrasov.ro/ | 200 | Da |  |
| ISJ Brașov – carieră | https://cariera.isjbrasov.ro/ | 200 | Da |  |
| Ministerul Educației – BAC / EN / admitere | https://edu.ro/bacalaureat · https://www.edu.ro/evaluare_nationala_ENVIII · https://www.edu.ro/admitere-liceu-si-inv-profesional | 200 | Da | Vechiul link edu.ro/evaluarea-națională-elevilor-de-clasa-viii-en-viii → 404 |
| ZfA (Auslandsschulwesen) | https://www.auslandsschulwesen.de | 200 | Da | Mai multe linkuri de land de pe pagina „Lehrer aus Deutschland” → 404/400 (BW, Bayern, Hessen, NRW, Niedersachsen) |
| Legea educației 198/2023 | https://legislatie.just.ro/public/DetaliiDocument/271896 | inaccesibil din mediul de audit (timeout) | Da |  |
| Anticorupție examene | http://www.educatiepentruviitor.edu.ro · TelVerde 0800 801 100 | 503 | Da | Link mort |
| Articol „Honterus 480 de ani” | https://bizbrasov.ro/2021/10/05/honterus-480-de-ani/ | 301 → 200 | Da |  |

**Linkuri moarte / problematice găsite în conținut (23):**

- `503` http://admitere.edu.ro/
- `404` http://liceulhonterusbrasov.ro/lic/wp-content/uploads/2017/01/Rezultate-finale-EN-2020.pdf
- `000` http://subiecte2020.edu.ro/2020/
- `503` http://www.educatiepentruviitor.edu.ro/
- `403` http://www.fonduri-ue.ro/anunturi-diverse/2005-anunt-18-08-2016
- `404` http://www.isjbrasov.ro/index.php/examene-concursuri/admitere/6140-oferta-educationala-pentru-clasa-a-ix-a-2023-2024
- `404` http://www.isjbrasov.ro/index.php/examene-concursuri/bacalaureat/4943-arondare-centre-de-examen-si-calendar-sesiunea-august-septembrie-2020
- `404` http://www.mytex.ro/stiri/546-expres/578918-video-brasov-elevii-participanti-la-concursul-prietenii-pompierilor-au-defilat-prin-centrul-orasului-video.html
- `503` http://www4.edu.ro/index.php/articles/curriculum/c556/?startnum=201
- `000` https://colaborare.rocnee.eu/files/testeantrenament/2021/22022021/bac/
- `000` https://colaborare.rocnee.eu/files/testeantrenament/2021/22022021/en8/
- `404` https://isjbrasov.ro/index.php/examene-concursuri/admitere/6513-brosura-de-admitere-in-liceu-dual-profesional-2024-2025
- `404` https://km-bw.de/,Lde_DE/Startseite/Schule/Hinweise+Auslandsschuldienst
- `404` https://kultusministerium.hessen.de/lehrkraefte/auslandsschuldienst-und-programme
- `000` https://legislatie.just.ro/public/DetaliiDocument/271896
- `000` https://rocnee.eu/index.php/dcee-oriz/curriculum-oriz/programe-scolare-front/planuri-cadru-de-invatamant-si-programe-scolare-invatamant-liceal-2023-docx
- `000` https://subiecte.edu.ro/2026/simulare/legislatie/
- `404` https://www.edu.ro/evaluarea-na%C8%9Bional%C4%83-elevilor-de-clasa-viii-en-viii
- `404` https://www.isjbrasov.ro/index.php/examene-concursuri/admitere/6098-procedura-operationala-privind-organizarea-si-desfasurarea-probei-de-verificare-a-cunostintelor-de-limba-moderna-pentru-admiterea-in-clasele-a-ix-a-cu-predare-a-unei-limbi-moderne-in-regim-bilingv-din-cadrul-admiterii-in-invatamantul-liceal-pentru-anul-sc
- `404` https://www.km.bayern.de/lehrer/stellen/ausland.html
- `400` https://www.mk.niedersachsen.de/startseite/schule/lehrkrafte_und_nichtlehrendes_personal/auslandsschuldienst/auslandsschuldienst-6068.html
- `000` https://www.schleswig-holstein.de/DE/Fachinhalte/S/schulrecht/Downloads/Rechtsquellen/Auslandsschuldienst_Freigabe.html
- `404` https://www.schulministerium.nrw.de/docs/Internationales/Auslandsschuldienst/Landesprogramm-MOE-GUS/index.html

## (i) Tabel de redirecționări 301 (legacy → nou)

Rutele de bază sunt cele din specificație. Rutele marcate † sunt **sub-rute propuse** (dacă nu se construiesc, redirecționați către părinte: `/ro/istorie`, `/ro/personal`, `/ro/documente`, `/ro/examene`, `/ro/proiecte`, `/ro/viata-scolara`). Pentru `?page_id=` / `?p=` serverul trebuie să potrivească și query string-ul. Echivalentele `/de/` și `/en/` nu au sursă legacy (site-ul vechi era doar în română, cu fragmente în germană).

| De la (legacy) | Către (nou) | Cod | Notă |
|---|---|---|---|
| `/` | `/ro/` | 301 | Rădăcina domeniului făcea 301 → /lic/ |
| `/lic/` | `/ro/` | 301 |  |
| `/lic/clasa-pregatitoare-3/` | `/ro/admitere/clasa-pregatitoare` | 301 |  |
| `/lic/contact/` | `/ro/contact` | 301 |  |
| `/lic/despre-noi/` | `/ro/istorie` | 301 |  |
| `/lic/despre-noi/anuar-2015-2016/` | `/ro/despre` | 301 | Pagină goală („LICEUL HONTERUS”, fost anuar 2015-2016) |
| `/lic/despre-noi/biblioteca/` | `/ro/istorie/biblioteca †` | 301 |  |
| `/lic/despre-noi/biserica-neagra/` | `/ro/istorie/biserica-neagra †` | 301 |  |
| `/lic/despre-noi/johannes-honterus/` | `/ro/istorie/johannes-honterus †` | 301 |  |
| `/lic/elevi/` | `/ro/personal/profesori-germania †` | 301 | Titlu „ELEVI”, conținut = „Lehrer aus Deutschland”; meniul o numește „PROFESORI DIN GERMANIA” |
| `/lic/erasmus/` | `/ro/proiecte/erasmus †` | 301 |  |
| `/lic/examene/` | `/ro/examene` | 301 |  |
| `/lic/examene/admitere-liceu/` | `/ro/admitere/liceu` | 301 |  |
| `/lic/examene/bacalaureat/` | `/ro/examene/bacalaureat` | 301 |  |
| `/lic/examene/corigentetransferuri/` | `/ro/examene/corigente-transferuri †` | 301 |  |
| `/lic/examene/evaluare-nationala/` | `/ro/examene/evaluare-nationala` | 301 |  |
| `/lic/examene/olimpiade/` | `/ro/viata-scolara/olimpiade †` | 301 |  |
| `/lic/examene/simulare-examene-nationale/` | `/ro/examene/simulari †` | 301 |  |
| `/lic/galerie/` | `/ro/viata-scolara/galerie †` | 301 |  |
| `/lic/informatii-2/` | `/ro/anunturi` | 301 | Pagină-părinte goală |
| `/lic/informatii-2/anunturi/` | `/ro/anunturi` | 301 |  |
| `/lic/informatii-2/orar/` | `/ro/anunturi` | 301 | Orar – EXCLUS din migrare; redirect către anunțuri (sau 410 Gone) |
| `/lic/informatii/` | `/ro/documente` | 301 | Doar slideshow |
| `/lic/informatii/dezbatere-publica/` | `/ro/documente/dezbateri-publice †` | 301 | Pagină doar cu slideshow, fără conținut |
| `/lic/informatii/documente-utile/` | `/ro/documente` | 301 |  |
| `/lic/informatii/formulare-2/` | `/ro/oferta-educationala †` | 301 | Slug „formulare-2” dar titlu „OFERTA EDUCAȚIONALĂ” |
| `/lic/informatii/oferta-educationala/` | `/ro/documente/formulare †` | 301 | Slug „oferta-educationala” dar titlu „FORMULARE” (gol) |
| `/lic/personal/` | `/ro/personal` | 301 | Doar slideshow |
| `/lic/personal/conducere/` | `/ro/personal/conducere †` | 301 |  |
| `/lic/personal/didactic-auxiliar/` | `/ro/personal/didactic-auxiliar †` | 301 |  |
| `/lic/personal/nedidactic/` | `/ro/personal/nedidactic †` | 301 |  |
| `/lic/personal/profesori/` | `/ro/personal/profesori †` | 301 |  |
| `/lic/proiecte-programe-parteneriate/` | `/ro/proiecte` | 301 | Doar slideshow |
| `/lic/proiecte-programe-parteneriate/activitati/` | `/ro/viata-scolara` | 301 |  |
| `/lic/proiecte-programe-parteneriate/proiecte/` | `/ro/proiecte` | 301 |  |
| `/lic/?page_id=10` | `/ro/istorie` | 301 | Permalink WordPress cu ID |
| `/lic/?p=10` | `/ro/istorie` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=12` | `/ro/istorie/johannes-honterus †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=12` | `/ro/istorie/johannes-honterus †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=24` | `/ro/istorie/biserica-neagra †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=24` | `/ro/istorie/biserica-neagra †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=26` | `/ro/istorie/biblioteca †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=26` | `/ro/istorie/biblioteca †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=40` | `/ro/documente` | 301 | Permalink WordPress cu ID |
| `/lic/?p=40` | `/ro/documente` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=45` | `/ro/documente` | 301 | Permalink WordPress cu ID |
| `/lic/?p=45` | `/ro/documente` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=52` | `/ro/personal` | 301 | Permalink WordPress cu ID |
| `/lic/?p=52` | `/ro/personal` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=55` | `/ro/contact` | 301 | Permalink WordPress cu ID |
| `/lic/?p=55` | `/ro/contact` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=61` | `/ro/viata-scolara/galerie †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=61` | `/ro/viata-scolara/galerie †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=182` | `/ro/documente/dezbateri-publice †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=182` | `/ro/documente/dezbateri-publice †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=293` | `/ro/examene` | 301 | Permalink WordPress cu ID |
| `/lic/?p=293` | `/ro/examene` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=296` | `/ro/admitere/liceu` | 301 | Permalink WordPress cu ID |
| `/lic/?p=296` | `/ro/admitere/liceu` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=299` | `/ro/examene/bacalaureat` | 301 | Permalink WordPress cu ID |
| `/lic/?p=299` | `/ro/examene/bacalaureat` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=302` | `/ro/examene/evaluare-nationala` | 301 | Permalink WordPress cu ID |
| `/lic/?p=302` | `/ro/examene/evaluare-nationala` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=307` | `/ro/examene/simulari †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=307` | `/ro/examene/simulari †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=315` | `/ro/viata-scolara/olimpiade †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=315` | `/ro/viata-scolara/olimpiade †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=366` | `/ro/viata-scolara` | 301 | Permalink WordPress cu ID |
| `/lic/?p=366` | `/ro/viata-scolara` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=383` | `/ro/proiecte` | 301 | Permalink WordPress cu ID |
| `/lic/?p=383` | `/ro/proiecte` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=386` | `/ro/personal/conducere †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=386` | `/ro/personal/conducere †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=389` | `/ro/personal/profesori †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=389` | `/ro/personal/profesori †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=392` | `/ro/personal/didactic-auxiliar †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=392` | `/ro/personal/didactic-auxiliar †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=395` | `/ro/personal/nedidactic †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=395` | `/ro/personal/nedidactic †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=423` | `/ro/personal/profesori-germania †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=423` | `/ro/personal/profesori-germania †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=522` | `/ro/despre` | 301 | Permalink WordPress cu ID |
| `/lic/?p=522` | `/ro/despre` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=656` | `/ro/examene/corigente-transferuri †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=656` | `/ro/examene/corigente-transferuri †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=852` | `/ro/proiecte` | 301 | Permalink WordPress cu ID |
| `/lic/?p=852` | `/ro/proiecte` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=1320` | `/ro/anunturi` | 301 | Permalink WordPress cu ID |
| `/lic/?p=1320` | `/ro/anunturi` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=3040` | `/ro/oferta-educationala †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=3040` | `/ro/oferta-educationala †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=3096` | `/ro/admitere/clasa-pregatitoare` | 301 | Permalink WordPress cu ID |
| `/lic/?p=3096` | `/ro/admitere/clasa-pregatitoare` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=3298` | `/ro/anunturi` | 301 | Permalink WordPress cu ID |
| `/lic/?p=3298` | `/ro/anunturi` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=3303` | `/ro/anunturi` | 301 | Permalink WordPress cu ID |
| `/lic/?p=3303` | `/ro/anunturi` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=3361` | `/ro/proiecte/erasmus †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=3361` | `/ro/proiecte/erasmus †` | 301 | Permalink WordPress cu ID |
| `/lic/?page_id=3659` | `/ro/documente/formulare †` | 301 | Permalink WordPress cu ID |
| `/lic/?p=3659` | `/ro/documente/formulare †` | 301 | Permalink WordPress cu ID |
| `/lic/index.php` | `/ro/` | 301 |  |
| `/lic/category/anunturi/` | `/ro/anunturi` | 301 | Arhivă categorie goală (0 articole) |
| `/lic/category/uncategorized/` | `/ro/anunturi` | 301 | Arhivă goală |
| `/lic/feed/` | `/ro/anunturi` | 301 | Feed RSS WordPress (fără articole) |
| `/lic/sitemap.xml` | `/sitemap.xml` | 301 |  |
| `/lic/wp-sitemap.xml` | `/sitemap.xml` | 301 |  |
| `/sitemap.xml (vechi → /lic/wp-sitemap.xml)` | `/sitemap.xml` | 301 |  |
| `/lic/wp-content/uploads/:path*` | `/media/legacy/:path*` | 301 | Regulă wildcard: păstrați toate fișierele (PDF/DOC/XLS) sub o cale stabilă; vezi tabelul (f) |
| `/lic/wp-admin/*` | `/ro/` | 301 | sau 410 |
| `/lic/wp-login.php` | `/ro/` | 301 | sau 410 |
| `/lic/author/*` | `/ro/` | 301 | Arhivă autor WordPress |
| `www.liceulhonterusbrasov.ro/*` | `https://liceulhonterusbrasov.ro/:path*` | 301 | Host canonic (www → apex), dacă se păstrează domeniul |

*Notă `/ro/oferta-educationala`*: specificația are doar `/ro/oferta-educationala/{primar,gimnaziu,liceu}`; pagina părinte (sau redirect către `/ro/oferta-educationala/primar`) trebuie să existe. *Fișiere:* recomandare – copiați tot `wp-content/uploads` (≈570 fișiere non-imagine + imagini) și serviți-l static sub `/media/legacy/`, cu regula wildcard de mai sus, ca să nu se rupă linkurile externe (ISJ, Google) către PDF-uri.

## (j) Lacune, riscuri și observații

1. **NoteInCatalog nu este legat nicăieri pe site-ul vechi.** URL-ul funcțional de autentificare este `https://app.noteincatalog.ro/login` (produsul: https://noteincatalog.ro). Confirmați cu școala că folosesc această platformă (și nu alt catalog) înainte de a pune butonul.
2. **Nicio rețea socială oficială** (Facebook/Instagram/YouTube) nu este legată; singurul link Facebook e o postare de pe un profil personal. De obținut de la școală.
3. **Date personale expuse**: în biblioteca media publică există un CV Europass al directorului (data nașterii, telefon mobil, adresă) – `2017/01/CHIVAREAN-RADU.pdf` / `Radu-Chivarean.pdf`; liste nominale cu elevi (clase pregătitoare, a IX-a, diriginți, rezultate interviu/olimpiade) în PDF/DOCX. **Nu migrați automat**; aplicați o politică GDPR (de ex. liste de admitere doar temporar).
4. **Conținut lipsă pentru noua structură:** pagina DSD/germană, Coetus/consiliul elevilor, Viața școlară (cluburi actuale), Publicații, Raport anual recent, PAS, declarații de avere, dezbateri publice (pagina e goală), program secretariat, listă personal auxiliar/nedidactic, profesori ZfA – toate trebuie create cu școala.
5. **Date învechite:** pagina CONDUCERE din 2022; DIDACTIC AUXILIAR/NEDIDACTIC din 2019; Biserica Neagră din 2017 (tarife/orar vizitare); multe linkuri ale landurilor germane sunt moarte.
6. **Inconsecvențe:** denumirea „Liceul Teoretic” pe paginile PERSONAL (corect: Colegiul Național din 2019); slug-uri inversate (`formulare-2` = Ofertă, `oferta-educationala` = Formulare); meniul „ELEVI” deschide „Lehrer aus Deutschland”; PDI conține un telefon/e-mail greșit (0249 435470, contact@…); bilanțul „31.12.2024” are fișiere numite „31.12.2025”; anul revenirii lui Honterus la Brașov: 1533 (site) vs. 1535 (PDI); prima bibliotecă: 1542 (PDI) vs. 1547 (clădirea, site).
7. **Specializări:** pe site apar numai *Real – Științe ale naturii* și *Uman – Filologie*. Nu există *Matematică-informatică* – nu o introduceți fără confirmare.
8. **Orar:** pagina `/lic/informatii-2/orar/` (doar „orar 2023-2024” PDF; orfan: orar 2022-2023) – inventariat, **exclus** din migrare; redirect propus spre `/ro/anunturi` (sau 410).
9. **Anunțuri fără date native:** datele din (g) sunt reconstituite – verificați-le la import; anunțurile mai vechi de 2022 (2017–2021) existau doar ca fișiere orfane (nu ca text).
10. **Texte în germană:** doar „Lehrer aus Deutschland”, comemorarea Feldioara și titluri de proiecte; versiunea /de/ trebuie tradusă aproape integral. Nu există conținut în engleză.
11. **Protecție anti-bot** pe server: crawl-ul a necesitat reîncercări; dacă migrarea automată a fișierelor se face prin HTTP, folosiți pauze și reîncercări.

