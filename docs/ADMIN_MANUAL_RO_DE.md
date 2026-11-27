# Manual de administrare · Handbuch für die Verwaltung

**Site:** `https://liceulhonterusbrasov.ro` · **Administrare / Verwaltung:** `https://liceulhonterusbrasov.ro/admin`

Partea în limba română este prima; die deutsche Fassung folgt ab [Teil 2](#teil-2--deutsch).

---

# Partea 1 — Română

## 1. Pe scurt
- Tot ce apare pe site se modifică din `/admin`. Nu este nevoie de cunoștințe tehnice.
- Fiecare text are trei limbi: **RO** (obligatoriu), **DE** și **EN**. Dacă DE sau EN lipsesc, site-ul afișează textul românesc cu o notă „pagina nu este încă tradusă”.
- O modificare publicată apare pe site în câteva secunde.
- Pe site **nu există orar** — nu se publică orare, nici ca document.

## 2. Autentificare și cont
1. Deschideți `/admin`, introduceți e-mailul și parola, bifați verificarea anti-spam, apăsați **Intră**.
2. După 5 încercări greșite contul se blochează 15 minute.
3. **Contul meu** (`/admin/cont`): schimbați parola (minimum 12 caractere). La prima autentificare a administratorului inițial, schimbarea parolei este obligatorie.
4. Ieșiți din cont cu **Ieșire** când lucrați pe un calculator comun. Sesiunea expiră singură după 12 ore de inactivitate.
5. Limba interfeței (RO / DE) se schimbă din colțul de sus.

### Roluri
| Rol | Ce poate face |
|---|---|
| **Administrator** | tot, inclusiv utilizatori, setări, redirecționări, jurnal |
| **Editor** | creează, modifică și publică orice conținut |
| **Traducător** | modifică doar câmpurile DE și EN și starea traducerii |

### Utilizatori noi (doar administratorii)
1. **Utilizatori** → **Invită un utilizator** → e-mail și rol.
2. Copiați linkul afișat și trimiteți-l persoanei (e-mail intern, mesaj). Linkul este valabil 7 zile și poate fi folosit o singură dată.
3. Persoana își alege numele și parola la `/admin/activare`.
4. Pentru o parolă uitată: **Utilizatori** → persoana → **Link parolă nouă** (valabil 7 zile). Pentru un angajat plecat: **Dezactivează**.

## 3. Cum se editează un text
- Fiecare formular are filele **RO · DE · EN**; un indicator arată dacă traducerea **lipsește**, este **în lucru** sau **gata**.
- Corpul textului are o bară de formatare: **B** (îngroșat), *I* (cursiv), **Titlu**, **Listă**, **Link**. Butonul **Previzualizare** arată exact cum va apărea pe site.
- **Stare:** *Ciornă* (nu apare pe site) · *Publicat* · *Arhivat* (dispare de pe site, rămâne în arhivă).
- **Avansat** ascunde adresa (slug). Se generează automat din titlul românesc; dacă o modificați la un articol deja publicat, adresa veche redirecționează automat spre cea nouă.
- La fiecare salvare se păstrează o versiune anterioară, iar jurnalul notează cine a modificat și când.

## 4. Anunțuri și banner urgent (`Anunțuri`)
1. **Anunț nou** → tip: *Știre*, *Eveniment*, *Rezultat* sau *Important*.
2. Titlu, rezumat (1–2 fraze, apare în liste), text, imagine de copertă (opțional), data publicării.
3. *Eveniment*: completați **începe** / **se termină** — apare pe prima pagină la „Urmează”.
4. **Fixat sus în lista de noutăți**: anunțul rămâne primul în listă.
5. **Afișează ca banner pe tot site-ul** (pentru urgențe: suspendarea cursurilor, schimbări de program la examene): bifați, alegeți nivelul (*informare* / *atenționare* / *urgent*), scrieți textul scurt al bannerului în cele trei limbi și **data până la care** este afișat. După această dată bannerul dispare singur.

## 5. Documente (`Documente`)
1. **Încarcă document** → alegeți fișierul (PDF, DOC/DOCX, XLS/XLSX, ODT, JPG, PNG; maxim 25 MB). Titlul se completează din numele fișierului — corectați-l.
2. Alegeți **categoria**, **ciclul** (primar / gimnazial / liceal, unul sau mai multe), **anul școlar**, limba documentului, data emiterii și numărul de înregistrare dacă există.
3. **Înlocuiește fișierul** păstrează documentul în aceleași liste și ghiduri, cu fișierul nou.
4. Același fișier nu poate fi încărcat de două ori (mesajul „Acest fișier există deja”).
5. **Nu încărcați documente cu date personale** ale elevilor sau candidaților (tabele nominale, CV-uri, adrese, CNP). Rezultatele se publică doar anonimizat (cod/număr de dosar), conform GDPR.

## 6. Ghiduri pas cu pas (`Ghiduri` și `Pași`)
Ghidurile (clasa pregătitoare, clasa a V-a, clasa a IX-a, transferuri, Evaluarea Națională, bacalaureat, DSD, olimpiade) se actualizează în fiecare an:
1. Deschideți ghidul, schimbați **anul școlar**.
2. La fiecare **pas**: titlu, explicație, „când” (text liber, ex. „martie–aprilie 2027”), **data de început / sfârșit** (site-ul afișează automat *Urmează / În desfășurare / Încheiat*), **termen-limită** (bifă), lista „Ce pregătiți” în fiecare limbă, link și document asociat.
3. Ordinea pașilor se schimbă cu săgețile ↑ ↓ sau prin tragere.
4. **Întrebări frecvente** se adaugă la sfârșitul ghidului.

## 7. Pagini (`Pagini`)
Paginile fixe (Despre școală, Istorie, Curtea Honterus, ciclurile, Germană și DSD, Contact, Confidențialitate, Accesibilitate etc.): titlu, introducere, text, descriere pentru motoarele de căutare, imagine principală. Caseta **Date pe margine** conține „repere” (ex. *Limbi de predare: germană, română*), „vezi și” (linkuri) și „note”.

## 8. Personal și catedre (`Personal`, `Catedre`)
- Categorie (Conducere, Personal didactic, Profesori ZfA, Personal didactic auxiliar, Personal nedidactic), catedră, nume, funcție, disciplină.
- **E-mail:** se afișează doar dacă bifați „Afișează e-mailul”.
- **Fotografie:** doar cu acordul scris al persoanei — bifați „Persoana și-a dat acordul scris pentru publicarea fotografiei”, altfel fotografia nu apare.
- Plecări: stare **Fost angajat** (nu se șterge istoricul).

## 9. Imagini și galerii (`Media`, `Galerii`)
1. **Încarcă imagine** (JPG, PNG, WebP, maxim 15 MB). Browserul pregătește automat variante pentru telefon și desktop.
2. **Textul alternativ** (descrierea imaginii pentru nevăzători) este obligatoriu în RO; completați și DE/EN.
3. **Autor / licență / sursă** pentru imagini care nu aparțin școlii.
4. **Punctul important al imaginii:** dați clic pe partea importantă a imaginii — decupajele o vor păstra.
5. **Înlocuiește imaginea:** aceeași imagine este schimbată peste tot unde e folosită (prima pagină, pagini, anunțuri).
6. **Nu publicați fotografii cu elevi fără acordul scris al părinților.**
7. **Galerii:** creați galeria, adăugați imagini, ordonați-le. Linkul „Galerie” din meniu se poate reactiva după publicarea primei galerii (cereți administratorului tehnic).
8. Videoclipuri YouTube: **Media → YouTube**, lipiți adresa. Pe site, videoclipul se încarcă doar la clic.

## 10. Istorie, proiecte, viața școlară
`Istorie` (anul, epoca, titlu, text, imagine, sursă; „Moment important” marchează anul cu coroana), `Proiecte` (tip, parteneri, finanțare, perioadă), `Viața școlară` (Coetus, Consiliul Elevilor, tradiții, cluburi).

## 11. Mesaje (`Mesaje`)
Mesajele trimise prin formularul de contact (cu verificare anti-spam). Marcați-le **Citit** sau **Arhivat**. Răspundeți din e-mailul școlii.

## 12. Setări și redirecționări (administratori)
- **Setări:** adresă, telefoane, e-mail, program secretariat, linkuri NoteInCatalog și Google Classroom, imaginea de pe prima pagină.
- **Redirecționări:** adresele vechi (`/lic/...`) trimit spre paginile noi. Coloana „accesări” arată ce se folosește încă. Adăugați o regulă: *de la* `/lic/pagina-veche/` → *către* `/ro/pagina-noua`.
- **Jurnal:** cine a modificat ce și când.

## 13. Probleme frecvente
| Problemă | Soluție |
|---|---|
| Modificarea nu apare | Verificați că starea este *Publicat*; reîncărcați pagina după 10–20 secunde. |
| „Fișier neacceptat” | Fișierul nu este cu adevărat PDF/DOC/imagine (ex. redenumit). Salvați-l din nou ca PDF. |
| Imaginea apare tăiată | Setați punctul de focalizare. |
| Traducere lipsă | Rolul *Traducător* completează DE/EN; tabloul de bord listează textele netraduse. |
| Cont blocat | Așteptați 15 minute sau cereți administratorului o resetare. |

---

# Teil 2 — Deutsch

## 1. Das Wichtigste
- Alle Inhalte der Website werden unter `/admin` gepflegt; technische Kenntnisse sind nicht nötig.
- Jeder Text hat drei Sprachfassungen: **RO** (Pflicht), **DE** und **EN**. Fehlt DE oder EN, zeigt die Website den rumänischen Text mit dem Hinweis, dass die Seite noch nicht übersetzt ist.
- Veröffentlichte Änderungen sind nach wenigen Sekunden online.
- Die Website enthält bewusst **keinen Stundenplan** — Stundenpläne werden auch nicht als Dokument veröffentlicht.

## 2. Anmeldung und Konto
1. `/admin` öffnen, E-Mail-Adresse und Passwort eingeben, Spam-Prüfung bestätigen, **Anmelden**.
2. Nach fünf Fehlversuchen ist das Konto 15 Minuten gesperrt.
3. **Mein Konto** (`/admin/cont`): Passwort ändern (mindestens 12 Zeichen). Beim ersten Anmelden des Erstadministrators ist die Änderung Pflicht.
4. An gemeinsam genutzten Rechnern immer **Abmelden**. Nach 12 Stunden Inaktivität endet die Sitzung von selbst.
5. Die Sprache der Oberfläche (RO / DE) lässt sich oben umschalten.

### Rollen
| Rolle | Rechte |
|---|---|
| **Administrator** | alles, auch Benutzer, Einstellungen, Weiterleitungen, Protokoll |
| **Redakteur** | alle Inhalte anlegen, bearbeiten und veröffentlichen |
| **Übersetzer** | nur die Felder DE und EN sowie den Übersetzungsstatus |

### Neue Benutzer (nur Administratoren)
1. **Benutzer** → **Benutzer einladen** → E-Mail und Rolle.
2. Den angezeigten Link kopieren und der Person schicken. Er gilt 7 Tage und nur einmal.
3. Die Person legt unter `/admin/activare` Namen und Passwort fest.
4. Passwort vergessen: **Benutzer** → Person → **Passwort-Link** (7 Tage gültig). Ausgeschiedene Mitarbeiter: **Deaktivieren**.

## 3. Texte bearbeiten
- Jedes Formular hat die Reiter **RO · DE · EN**; ein Kennzeichen zeigt, ob die Übersetzung **fehlt**, **in Arbeit** oder **fertig** ist.
- Werkzeugleiste: **F** (fett), *K* (kursiv), **Überschrift**, **Liste**, **Link**. **Vorschau** zeigt den Text so, wie er auf der Website erscheint.
- **Status:** *Entwurf* (nicht sichtbar) · *Veröffentlicht* · *Archiviert*.
- Unter **Erweitert** steht die Adresse (Slug). Sie entsteht automatisch aus dem rumänischen Titel; wird sie bei einem veröffentlichten Beitrag geändert, leitet die alte Adresse automatisch weiter.
- Jede Speicherung legt eine frühere Fassung ab; das Protokoll hält fest, wer wann was geändert hat.

## 4. Meldungen und Eilhinweis (`Anunțuri`)
1. **Neue Meldung** → Typ: *Meldung*, *Termin*, *Erfolg* oder *Wichtig*.
2. Titel, Kurzfassung (1–2 Sätze, erscheint in Listen), Text, Titelbild (optional), Veröffentlichungsdatum.
3. *Termin*: **Beginn** / **Ende** ausfüllen — der Termin erscheint auf der Startseite unter „Termine“.
4. **Oben in der Liste fixieren**: die Meldung bleibt an erster Stelle.
5. **Als Banner auf der ganzen Website zeigen** (für Eilmeldungen, etwa Unterrichtsausfall oder geänderte Prüfungszeiten): ankreuzen, Stufe wählen (*Information* / *Hinweis* / *dringend*), kurzen Text in drei Sprachen und **Anzeige bis** eintragen. Danach verschwindet das Band von selbst.

## 5. Dokumente (`Documente`)
1. **Dokument hochladen** → Datei wählen (PDF, DOC/DOCX, XLS/XLSX, ODT, JPG, PNG; höchstens 25 MB). Der Titel wird aus dem Dateinamen vorgeschlagen — bitte korrigieren.
2. **Kategorie**, **Schulstufe(n)**, **Schuljahr**, Sprache, Ausstellungsdatum und ggf. Registriernummer angeben.
3. **Datei ersetzen** behält das Dokument in allen Listen und Wegweisern.
4. Dieselbe Datei kann nicht zweimal hochgeladen werden.
5. **Keine Dokumente mit personenbezogenen Daten** von Schülerinnen und Schülern oder Bewerbern hochladen (Namenslisten, Lebensläufe, Adressen, CNP). Ergebnisse nur pseudonymisiert (Kennnummer) veröffentlichen — DSGVO.

## 6. Wegweiser Schritt für Schritt (`Ghiduri`, `Pași`)
Die Wegweiser (Vorbereitungsklasse, 5. Klasse, 9. Klasse, Schulwechsel, Nationale Evaluierung, Bakkalaureat, DSD, Olympiaden) werden jedes Jahr aktualisiert:
1. Wegweiser öffnen, **Schuljahr** ändern.
2. Für jeden **Schritt**: Titel, Erläuterung, „Wann“ (freier Text), **Beginn / Ende** (die Website zeigt automatisch *Demnächst / Läuft / Abgeschlossen*), **Frist** (Häkchen), Liste „Was Sie brauchen“ je Sprache, Link und zugehöriges Dokument.
3. Reihenfolge mit ↑ ↓ oder per Ziehen ändern.
4. **Häufige Fragen** am Ende des Wegweisers ergänzen.

## 7. Seiten (`Pagini`)
Feste Seiten (Über die Schule, Geschichte, Honterushof, Schulstufen, Deutsch und DSD, Kontakt, Datenschutz, Barrierefreiheit usw.): Titel, Einleitung, Text, Beschreibung für Suchmaschinen, Hauptbild. Im Feld **Randnotizen** stehen Eckdaten, „Siehe auch“-Links und Anmerkungen.

## 8. Kollegium und Fachbereiche (`Personal`, `Catedre`)
- Bereich (Schulleitung, Lehrkräfte, ZfA-Lehrkräfte, pädagogisches Hilfspersonal, Verwaltung und Technik), Fachbereich, Name, Funktion, Fach.
- **E-Mail** erscheint nur mit Häkchen „E-Mail anzeigen“.
- **Foto** nur mit schriftlicher Einwilligung der Person — Häkchen „Die Person hat der Veröffentlichung des Fotos schriftlich zugestimmt“, sonst wird kein Foto gezeigt.
- Ausscheiden: Status **Ehemalig** (nicht löschen).

## 9. Bilder und Galerien (`Media`, `Galerii`)
1. **Bild hochladen** (JPG, PNG, WebP, höchstens 15 MB). Der Browser erzeugt automatisch Fassungen für Handy und Bildschirm.
2. **Alternativtext** (Bildbeschreibung für blinde Nutzer) ist auf Rumänisch Pflicht; DE/EN bitte ergänzen.
3. **Urheber / Lizenz / Quelle** bei Bildern, die nicht der Schule gehören.
4. **Wichtigster Bildpunkt:** auf den wichtigen Bildteil klicken — Zuschnitte behalten ihn.
5. **Bild ersetzen:** das Bild wird überall ausgetauscht, wo es verwendet wird.
6. **Keine Fotos von Schülerinnen und Schülern ohne schriftliche Einwilligung der Eltern.**
7. **Galerien:** Galerie anlegen, Bilder hinzufügen und ordnen. Der Menüpunkt „Galerie“ wird nach der ersten veröffentlichten Galerie wieder eingeblendet (technische Betreuung).
8. YouTube-Videos: **Media → YouTube**, Adresse einfügen. Auf der Website wird das Video erst beim Klick geladen.

## 10. Geschichte, Projekte, Schulleben
`Istorie` (Jahr, Epoche, Titel, Text, Bild, Quelle; „Wichtiges Ereignis“ hebt das Jahr mit der Krone hervor), `Proiecte` (Art, Partner, Förderung, Zeitraum), `Viața școlară` (Coetus, Schülerrat, Traditionen, Arbeitsgemeinschaften).

## 11. Nachrichten (`Mesaje`)
Über das Kontaktformular eingegangene Nachrichten (mit Spam-Prüfung). Als **Gelesen** oder **Archiviert** markieren; Antwort über die E-Mail-Adresse der Schule.

## 12. Einstellungen und Weiterleitungen (Administratoren)
- **Einstellungen:** Anschrift, Telefon, E-Mail, Sprechzeiten des Sekretariats, Links zu NoteInCatalog und Google Classroom, Bild der Startseite.
- **Weiterleitungen:** alte Adressen (`/lic/...`) führen auf die neuen Seiten; die Spalte „Aufrufe“ zeigt, was noch benutzt wird. Neue Regel: *von* `/lic/alte-seite/` → *nach* `/de/neue-seite`.
- **Protokoll:** wer hat was wann geändert.

## 13. Häufige Probleme
| Problem | Lösung |
|---|---|
| Änderung nicht sichtbar | Status *Veröffentlicht* prüfen; Seite nach 10–20 Sekunden neu laden. |
| „Datei nicht zulässig“ | Die Datei ist kein echtes PDF/DOC/Bild (z. B. nur umbenannt). Erneut als PDF speichern. |
| Bild falsch beschnitten | Bildschwerpunkt setzen. |
| Übersetzung fehlt | Die Rolle *Übersetzer* ergänzt DE/EN; die Übersicht listet unübersetzte Texte. |
| Konto gesperrt | 15 Minuten warten oder den Administrator um Zurücksetzen bitten. |
