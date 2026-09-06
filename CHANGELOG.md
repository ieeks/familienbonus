# Changelog

Alle nennenswerten Änderungen. Format lose nach Keep-a-Changelog.

## [1.5.0] — 2026-09-06

Zweites Code-Review (Dev-Team, Stand 89c793a). Auftrag ausdrücklich: **Fehler beheben und
den Geltungsbereich sichtbar begrenzen**, kein Funktionsausbau. Die Tarifstufen 2024–2026,
die Grenzprüfungen und der Optimierungsansatz wurden dabei bestätigt. Erledigt sind alle
elf Findings; die vier Erweiterungen (Anspruchsmonate, getrennte Eltern/Unterhalt,
L16-Helfer, vollständige 2027-Veranlagung) bleiben bewusst offen und stehen im TODO.

### Behoben

- **Dezimalbeträge wurden um Größenordnungen verfälscht (F01).** Die Maske zog alle
  Ziffern zusammen: aus „1.234,56" wurden 123.456 €, aus „55.000,00" 5.500.000 €, aus
  „-500" 500 €. Beträge werden jetzt in Vorzeichen, Euro und Cent zerlegt (`splitAmount()`).
  Das Komma bleibt beim Tippen stehen, ein eingefügter englischer Dezimalpunkt („12.34")
  wird als solcher erkannt, der Tausenderpunkt weiterhin als Gruppierung („12.345").
  Ein negativer Betrag wird nicht mehr stillschweigend positiv, sondern als Fehler
  ausgewiesen – die Karte zeigt „–" statt einer erfundenen Aufnahmefähigkeit.
- **Unvollständige Angaben erschienen als fertiges Ergebnis (F06).** Zwei Kinder, nur ein
  Geburtsdatum: das zweite zählte als null, darüber stand „Der volle Bonus von 2.000 €
  kommt an". Fehlendes ist kein bestätigter Nullwert. `dataIssues()` prüft Vollständigkeit
  jetzt getrennt von der Rechnung; solange etwas fehlt, steht der Mangel **über** dem
  Ergebnis, die Karte trägt „vorläufig" statt „Empfohlen", und keine Aussage behauptet
  mehr, dass etwas ankommt. Eine bewusst eingetragene 0 bleibt ein gültiger Fall.
- **Intern wird in Cent gerechnet (F10).** Die Beträge je Kind wurden vor der Optimierung
  auf ganze Euro gerundet und danach noch einmal beim Aufteilen – bei 666,72 € hälftig kam
  „334 / 333" heraus, also eine Rundungsbevorzugung von A, und 2.000,16 € wurden zu
  2.000 €. Alles läuft jetzt als ganze Cent durch Rechnung und Anzeige: 50/50 ergibt
  333,36 € für beide. `EPS` ist damit ein halber Cent statt eines halben Euro – die
  Suche liefert das exakte Optimum, nachgewiesen gegen eine unabhängige Enumeration.
- **Ein alter Teilen-Link verdrängte neuere Eingaben (F07).** Link mit 20.000 € öffnen, auf
  30.000 € ändern, neu laden – der Hash gewann gegen den gespeicherten Stand, und das
  folgende Autosave überschrieb ihn auch noch. Der Hash ist eine Momentaufnahme: er wird
  beim Import sofort in den Speicher übernommen und danach aus der Adresse entfernt
  (`dropStateHash()`). Ein fremder Hash wie `#sec-ergebnis` bleibt unangetastet.
- **Der Moduswechsel deutete dieselbe Zahl um (F08).** Aus 20.000 € Einkommen wurden beim
  Umschalten 20.000 € Tarifsteuer. Die Werte werden jetzt je Eingabeart geparkt und beim
  Zurückschalten unverändert wiedergeholt; umgerechnet wird nichts, das wäre nur eine
  andere Art zu raten.
- **Erhöhte Familienbeihilfe: Text und Rechnung widersprachen sich (F04).** Im manuell
  gesetzten Pflichtmodus erklärte der Hinweis die freie Wahl, gerechnet wurde 75/25. Der
  Text nennt jetzt die tatsächlich wirksame Regel und weist den manuellen Modus als
  bewusst abweichende Simulation aus – auch dann, wenn „frei" gesetzt ist, wo die
  Automatik „Pflicht" ergäbe.
- **Eingefügte Datumswerte wurden zerlegt.** „1.1.2020" ergab „11.20.20", obwohl
  `parseBirth()` das Format kennt. Am Stück eingefügte Datumswerte werden vor dem
  Maskieren geparst.

### Geltungsbereich statt stiller Annahmen

- **„Wofür dieser Rechner gilt"** steht als Block direkt beim Ergebnis: zwei ganzjährig
  anspruchsberechtigte Elternteile, durchgehende Familienbeihilfe, Einkommen nach allen
  Abzügen, „ab 2027" als Simulation. Was nicht abgebildet ist, steht dort ausdrücklich
  drin, statt sich in einem plausiblen Ergebnis zu verstecken (F02, F03, F05, F09).
- **KZ 245 ist der Ausgangswert, nicht das Einkommen (F05).** Der bisherige Hinweis
  „am L16 ≈ KZ 245" führte zu einer unbereinigten Bemessungsgrundlage: bei 20.000 € und
  nur dem Werbungskostenpauschale von 132 € war die Aufnahmefähigkeit um 26,40 € zu hoch.
  Der Text verlangt jetzt das steuerpflichtige Einkommen nach Werbungskosten,
  Sonderausgaben und außergewöhnlichen Belastungen.
- **Der Pflichtmodus sagt, was er rechnet (F09).** Er verwendet Tarif, Kinderbeträge und
  Alter des gewählten Jahres – 2027 ist als Steuerjahr weiterhin nicht wählbar. Dazu der
  Hinweis, dass die Pflicht zwei Anspruchsberechtigte voraussetzt und ein leeres oder
  niedriges zweites Einkommen kein Nachweis für alleinige Berechtigung ist (F03).
- **Familienbeihilfe wird nur unterstellt, wo es dasteht (F02).** Das Häkchen nach dem
  18. Geburtstag heißt jetzt „durchgehend bezogen"; Teiljahre kann der Rechner nicht und
  sagt das.

### Neu

- **Regressionstests (F11).** `node tests/run.mjs` – 145 Prüfungen ohne Framework und ohne
  Build: Tarifgrenzen (jede Stufe darunter/darauf/darüber), Beträge mit Cent, Geburtsmonate,
  Rundung je Kind, Optimalität gegen eine unabhängige Suche, Vollständigkeitssperre,
  Link-Fixpunkt und Fremdeingabe, Hash-/Speicher-Reihenfolge, Moduswechsel. `tests/dom.mjs`
  lädt dafür `index.html` in einer nachgebauten DOM-Umgebung; die Seg-Buttons und
  Startwerte liest es aus dem HTML, damit die Tests eine Umbenennung mitbekommen. Die
  ausgelieferte Seite bleibt eine einzige Datei – der Testhaken am Ende des Skripts ist
  im Browser nicht aktiv. Dazu ein GitHub-Actions-Workflow.

### Geändert

- **Beträge werden mit Cent angezeigt, wo welche anfallen** („2.000,16 €", „13.593,10 €"),
  runde Beträge weiterhin ohne. Die Anzeige rundet nicht mehr, was die Rechnung genau hat.
- **Namensänderungen lösen keine neue Suche mehr aus.** `bestSplit()` merkt sich ihr letztes
  Ergebnis; bei zwölf Kindern kostete jeder Tastendruck im Namensfeld vorher die komplette
  3^12-Enumeration (gemessen ~1,2 s, jetzt unter 60 ms).
- **Datenschutzhinweis präzisiert.** „Nichts wird übertragen" galt für die Rechnung, nicht
  für die Seite: die Schriften kommen von Google Fonts (IP-Adresse), und der gespeicherte
  Stand liegt unverschlüsselt im Browserprofil.

### Geprüft, unverändert

- Tarifstufen 2024–2026 und die Grenzsteuersätze an jeder Stufe (im Review gegen die
  offiziellen Tabellen, hier zusätzlich als Test).
- Der Standardfall-Link bleibt `#a=55000&b=32000&cb=27072018&cb=11052022` und ein Fixpunkt.
- Die haushaltsbezogene Alles-oder-nichts-Auslegung der 2027-Ausnahme, die monatsgenaue
  18.-Geburtstags-Grenze und `MAX_CHILDREN` = 12.

## [1.4.0] — 2026-08-20

Code-Review mit Rechtsrecherche. Die Aufteilungspflicht ab 2027 ist inzwischen
kundgemacht (**BGBl. I Nr. 62/2026** vom 29.07.2026, Budgetbegleitgesetz 2027–2028);
der Bundesrat hat am 16.07.2026 keinen Einspruch erhoben. Die **Tarifstufen 2027**
sind weiterhin offen – die Inflationsanpassungsverordnung für das Folgejahr kommt
üblicherweise erst Ende August (die für 2026 am 30.08.2025).

### Neu
- **Erhöhte Familienbeihilfe.** Ein Kind, für das erhöhte Familienbeihilfe bezogen
  wird, ist ab 2027 einem Kind unter 4 gleichgestellt – der Haushalt behält also die
  freie 100/0-Wahl. Das fehlte bisher ganz. Umgesetzt als **haushaltsbezogenes
  Häkchen** neben der Aufteilungsregel, aus demselben Grund wie die Altersbedingung:
  die Ausnahme hängt am Haushalt, nicht am einzelnen Kind. Steht als `ef=1` im Link.

### Behoben
- **Die Aufstellung je Kind rundete zweimal auf.** Ein Kind mit 667 € (z. B. Geburt
  im September) zeigte bei 50/50 „334 € / 334 €" – einen Euro mehr, als zu verteilen
  war –, und die Zeilensumme passte nicht zu „zugeteilt" auf derselben Karte. Der
  Anteil wird jetzt einmal auf ganze Euro gerundet (`shareToA()`), der Rest geht an
  den anderen Elternteil; Zeilen, Spaltensummen und „genutzt/verpufft" stammen damit
  aus derselben Rechnung.
- **Der Tie-Break in `bestSplit()` konnte vom Optimum wegdriften.** Verglichen wurde
  gegen die gerade markierte Aufteilung, und jeder angenommene Gleichstand senkte die
  Latte um bis zu `EPS`. Über mehrere Schritte summierte sich das: nachgewiesen 1,00 €
  unter dem Optimum. Verglichen wird jetzt gegen das bisher gesehene Maximum, der
  Abstand bleibt damit auf `EPS` (0,50 €) begrenzt. Über 200.000 Zufallsfälle mit
  erreichbaren Beträgen: keine Abweichung mehr.
- **Ein zweiter Link im selben Tab zeigte noch Werte des ersten.** `buildQuery()` lässt
  Defaults ja gerade weg – `applyQuery()` las das aber als „unverändert lassen" statt
  als „Default". Wer `#a=55000&na=Anna` öffnete und danach `#b=40000`, sah weiter
  „Anna". Fehlende Schlüssel setzen jetzt auf den Default zurück; der Link beschreibt
  den Stand damit vollständig, so wie der Empfänger ihn sieht.
- **Kein Deckel auf die Kinderzahl in der Eingabe.** `MAX_LINK_CHILDREN` schützte nur
  Empfänger eines fremden Links, nicht den eigenen Browser: `bestSplit()` ist 3^n,
  15 Kinder kosteten gemessen **3,3 s pro Tastendruck**. Und ein Stand mit mehr als 12
  Kindern ließ sich ohnehin nicht unverfälscht teilen – der Link wurde beim Öffnen
  gekappt. Jetzt eine Grenze für beides (`MAX_CHILDREN` = 12), mit deaktiviertem
  „+ Kind hinzufügen" und Hinweis statt stiller Kappung.
- **Backspace auf einem Tausenderpunkt war ein Leerlauf.** Die Maske setzte den Punkt
  sofort wieder, der Cursor rutschte nur eine Stelle nach links – man musste zweimal
  drücken. Jetzt nimmt der Tastendruck die Ziffer davor mit, genau wie im Datumsfeld.
- **`effSplit()` prüfte die Geburtsdaten auch im Pauschal-Modus.** Dort sind sie
  unsichtbarer Altbestand. Bisher folgenlos, weil 2027 als Steuerjahr nicht wählbar
  ist – ab dem ersten 2027-Eintrag in `BRACKETS_BY_YEAR` wäre es eine stille
  Fehlentscheidung geworden.

### Geprüft, unverändert
- Tarifstufen 2024/2025/2026 gegen BMF/WKO/USP abgeglichen – korrekt.
  Sanity: 55.000 € → 13.904 (2024) / 13.593 (2025) / 13.447 (2026).
- Die 25:75/50:50-Stufen, die haushaltsbezogene Alles-oder-nichts-Auslegung und die
  monatsgenaue 18.-Geburtstags-Grenze entsprechen dem kundgemachten Text.
- Der Standardfall-Link bleibt `#a=55000&b=32000&cb=27072018&cb=11052022` und ist
  weiterhin ein Fixpunkt; ein Link mit `y=9999`, 40 Kindern und `<img onerror=…>`
  fällt weiter sauber auf Defaults zurück.

## [1.3.0] — 2026-08-09

### Neu
- **Teilbarer Link.** „Link zum Teilen kopieren" packt den gesamten Stand (Namen,
  Einkommen, Steuerjahr, Modi, Kinder mit Geburtsdatum und Beihilfe-Häkchen) in den
  **Hash** der URL. Bewusst der Hash und nicht der Query-String: der Teil hinter `#`
  wird nie an einen Server geschickt und steht in keinem Referer – bei Einkommensdaten
  ist das der Unterschied zwischen „teilbar" und „in fremden Logs". Wo die Clipboard-API
  nicht darf (kein sicherer Kontext, `file://`), erscheint der Link in einem Feld zum
  Selberkopieren statt wortlos nichts zu tun.
- **Eingaben bleiben erhalten.** Der Stand wird entprellt in `localStorage` gesichert und
  beim nächsten Öffnen wiederhergestellt; ein Reload kostet die Eingabe nicht mehr.
  Reihenfolge beim Start: erst der Link (den hat jemand absichtlich geöffnet), sonst der
  gespeicherte Stand. **„Zurücksetzen"** löscht beides – mit Rückfrage, weil unwiderruflich.
- **Ein zweiter Link im selben Tab** wechselt nur den Hash und löst kein Neuladen aus;
  ein `hashchange`-Listener zieht Eingaben und Segmented-Controls nach.
- **Der Link enthält nur, was vom Default abweicht.** Steuerjahr, Modi, „Elternteil A/B",
  die 2.000 € je Kind und das Beihilfe-Häkchen fehlen, solange sie unverändert sind; das
  Geburtsdatum steht als reine Ziffernfolge (`27072018`), die `parseBirth()` ohnehin
  kennt. Der typische Fall – zwei Einkommen, zwei Geburtsdaten – schrumpft damit von
  **194 auf 78 Zeichen** inklusive Domain. Kein Shortener-Dienst nötig, und die Daten
  bleiben da, wo sie hingehören. Kind-Spalten sind alles-oder-nichts: weicht ein Kind ab,
  kommt die Spalte vollständig mit, sonst verrutscht die Zuordnung über die Position.
  Die Kinderzahl steht als `k` im Link, sobald sie von der Startzahl abweicht.
  Die Defaults werden beim Laden ausgelesen, nicht notiert – so laufen sie nicht
  auseinander, wenn im HTML ein anderer Startwert steht.
- `meta description`, Open-Graph- und Twitter-Card-Tags – der geteilte Link zeigt in
  Messengern jetzt Titel und Beschreibung statt einer nackten URL.

### Behoben
- **Doppeltes `<link rel="icon">`**: Bei zwei Icon-Links gewinnt der letzte, `icon.svg`
  wurde nie geladen. Jetzt nur noch der Verweis auf die Datei.

### Sicherheit
- Ein Link ist Fremdeingabe und wird auch so behandelt: Steuerjahr nur aus
  `BRACKETS_BY_YEAR`, Modi nur aus der erlaubten Liste, Beträge je Kind nur die beiden
  Stufen des Selects, Namen auf 40 Zeichen gekappt. Die Kinderzahl aus einem Link ist auf
  **12** begrenzt – `bestSplit()` ist 3^n, ein Link mit 30 Kindern wäre sonst ein
  Denial-of-Service auf den Browser des Empfängers.

## [1.2.2] — 2026-08-09

### Verbessert
- **Tausenderpunkte im Einkommensfeld, schon beim Tippen.** Aus `55000` wird `55.000`,
  während getippt wird. Dafür sind die beiden Felder jetzt `type="text"` mit
  `inputmode="numeric"` statt `type="number"` – in einem Zahlenfeld wäre „55.000" ein
  ungültiger Wert und `.value` käme leer zurück. Der Ziffernblock auf iOS bleibt.
  Gelesen wird über `amountVal()` (Ziffern raus, Rest weg), leere Eingabe erkennt
  `hasDigits()` – `+"55.000"` wäre `NaN` gewesen.
- **Punkte im Geburtsdatum setzt der Rechner selbst.** `27072018` wird beim Tippen zu
  `27.07.2018`; auf der iOS-Zifferntastatur gibt es keinen Punkt, das Feld war damit
  praktisch nur über die Ziffernfolge befüllbar. Der Punkt erscheint immer nur
  *zwischen* zwei Gruppen, nie am Ende – ein angehängter Punkt („27.") käme nach jedem
  Backspace sofort zurück und das Feld ließe sich nicht mehr leeren. Backspace direkt
  auf einem Punkt löscht die Ziffer davor mit. Eingefügte ISO-Daten (`2018-07-27`)
  laufen an der Maske vorbei und werden weiterhin erkannt.
- **Cursor bleibt stehen.** Beide Masken schreiben das Feld während des Tippens um und
  verankern den Cursor an der Anzahl der Ziffern links von ihm (`setCaretAfterDigits()`).
  Ohne das springt er bei jedem eingefügten Trennzeichen ans Feldende – genau der Grund,
  aus dem in 1.2.1 gar nicht umgeschrieben wurde.
- **„Datum nicht erkannt" erst, wenn es etwas zu erkennen gibt.** Die rote Warnung
  erschien schon nach der ersten getippten Ziffer. Jetzt steht bis zur achten Ziffer
  „Weiter tippen", danach erst die Warnung.

### Behoben
- Mausrad über einem fokussierten Einkommensfeld verstellte den Wert unbemerkt
  (`type="number"`); mit dem Textfeld entfällt das.

## [1.2.1] — 2026-07-27

### Behoben
- **Geburtsdatum lässt sich wieder tippen.** `input[type=date]` bietet auf iOS
  ausschließlich den Kalender ohne Tastatureingabe – für ein Geburtsdatum von 2018
  wären das rund hundert Tipps auf den Zurück-Pfeil. Jetzt ein Textfeld mit
  `inputmode="numeric"`, das **TT.MM.JJJJ** (auch mit `/` oder `-`), **TTMMJJJJ** und
  **JJJJ-MM-TT** erkennt und beim Verlassen des Feldes auf TT.MM.JJJJ normalisiert.
  Während des Tippens wird nicht umgeschrieben, sonst verspringt der Cursor.
  Zweistellige Jahre werden bewusst abgelehnt – das Jahrhundert zu raten geht bei
  Geburtsdaten schief. Unplausible Eingaben (31.02., 13.13.) sagen es explizit.
- **Mobile Reihenfolge in der Kind-Zeile.** Der Löschen-Button spannt unter 480 px über
  die ganze Breite und stand als Balken zwischen dem Datumsfeld und dessen Ergebnis.
  Jetzt Feld → Ergebnis → Löschen (`order` im Media-Query).

## [1.2.0] — 2026-07-27

### Neu
- **Geburtsdatum je Kind** als neuer Standard-Eingabemodus (Umschalter „Eingabe je Kind",
  die bisherige Betragsauswahl bleibt als zweite Option). Daraus wird der Bonus
  **monatsgenau** für das gewählte Steuerjahr gerechnet: 166,68 € pro Monat bis
  einschließlich des Monats, in dem das Kind 18 wird, danach 58,34 € – letzteres nur,
  solange Familienbeihilfe bezogen wird (Checkbox, erscheint nur wenn relevant).
  Damit stimmt auch das Jahr des 18. Geburtstags, in dem bisher *keiner* der beiden
  Pauschalwerte richtig war. Anspruch beginnt im Geburtsmonat.
- **Aufteilungsregel „Automatisch"** (neuer Default): löst sich aus Steuerjahr und
  Geburtsdaten auf. Freie Wahl und Pflicht ab 2027 bleiben als Übersteuerung.
- **Hinweis, ab wann die Pflicht greift.** Aus den Geburtsdaten wird das erste Jahr
  bestimmt, in dem alle Kinder ganzjährig das 4. Lebensjahr vollendet haben, samt dem
  Kind, an dem es hängt. Weil die Ausnahme haushaltsbezogen ist („kein weiteres Kind
  unter 4"), ist die Regel alles-oder-nichts – der globale Umschalter bildet das korrekt ab.

### Offen gelassen
- Ob die Pflicht im **Übergangsjahr** bereits ab dem Monat des 4. Geburtstags greift oder
  erst im Folgejahr, geht aus den zugänglichen Materialien nicht eindeutig hervor. Der
  Rechner sagt das explizit dazu, statt eine Auslegung zu unterstellen.
- Die Ausnahme bei **erhöhter Familienbeihilfe** (freie Wahl bleibt) ist noch nicht
  modelliert.

### Behoben
- Beträge je Kind werden vor der Verteilung auf volle Euro gerundet. Sonst zeigte die
  Tabelle je Kind 2.000 € + 1.458 € und die Summe 3.459 € (12 × 166,68 = 2.000,16).

## [1.1.1] — 2026-07-27

### Behoben
- **Tausendertrennzeichen.** `toLocaleString("de-AT")` gruppiert mit U+00A0
  („13 593 €"). Österreichische Konvention und die BMF-Formulare schreiben „13.593 €".
  Umgestellt auf einen einmal angelegten `Intl.NumberFormat("de-DE")` – bei ganzen
  Euro-Beträgen exakt die AT-Schreibweise, und der Formatter wird nicht mehr bei
  jedem der rund zwanzig `eur()`-Aufrufe pro Tastendruck neu gebaut.
- **`<label for>` fehlte durchgehend.** Kein Label war mit seinem Feld verknüpft:
  Klick aufs Label fokussierte nicht, Screenreader lasen beim Sprung ins Feld keinen
  Namen vor. Alle acht Labels sind jetzt verknüpft; die Kind-Zeilen bekommen
  indexbasierte IDs (`ch-label-N`, `ch-amount-N`), die auch nach Hinzufügen und
  Löschen eindeutig bleiben.
- **Dokument hatte genau eine Überschrift.** Die Sektionstitel waren `<span>`; damit
  gab es keine Gliederung zum Navigieren. Jetzt `<h2>`, und jede `<section>` ist über
  `aria-labelledby` benannt, wird also zum Landmark. Die Ziffernmarke (01–04) ist
  `aria-hidden`, sie ist reine Dekoration.
- **Neuberechnung war für Screenreader unsichtbar.** Das Ergebnis änderte sich still.
  Neu: eine visuell versteckte Live-Region (`role="status"`) mit einer Kurzfassung –
  empfohlenes Szenario, Aufteilung, genutzt/verpufft. Bewusst nicht die Ergebnis-Container
  selbst live geschaltet: die würden bei jedem Tastendruck komplett vorgelesen. Die
  Ansage ist bis zur Tipp-Pause entprellt (700 ms).

## [1.1.0] — 2026-07-27

### Behoben
- **Hinweistext widersprach dem Ergebnis.** Die Bedingung `cA+cB >= total` wurde als
  „es verpufft nichts" ausgegeben – das gilt aber nicht, weil die Aufteilung gestuft ist
  (0/50/100 bzw. 25/50/75). Beispiel: Ceilings 18 € / 15.593 €, 2 Kinder, Modus 2027 →
  Karte zeigte „verpufft 982 €", Text darunter „es verpufft nichts". Maßgeblich ist jetzt
  `best.wasted`. Zusätzlich wird unterschieden, ob wirklich *jede* zulässige Aufteilung
  gleichwertig ist (`min(cA,cB) >= maxShare*total`) oder nur die empfohlene.
- **Bis zu drei Karten trugen gleichzeitig „Empfohlen".** Bei ausreichenden Ceilings sind
  100/0, 0/100 und 50/50 geldgleich. Jetzt trägt genau eine Karte „Empfohlen", weitere
  gleich gute bekommen „gleichwertig".
- **Aufteilung je Kind wird angezeigt.** Die Kopfzeile aggregierte über alle Kinder und
  konnte damit ein Verhältnis ausweisen, das selbst gar nicht zulässig ist (z. B. „31 % / 69 %"
  bei Kind 1 = 25:75 und Kind 2 = 50:50). Neu: Aufstellung je Kind mit Prozent und Betrag –
  das, was tatsächlich ins Formular kommt. Bei gemischter Aufteilung steht in der Kopfzeile
  „gemischt – siehe je Kind".
- **XSS über die Namensfelder.** Namen und Kind-Bezeichnungen gingen ungeescaped per
  `innerHTML` in Ceilings und Szenarien. Neu: `esc()` an allen Ausgabestellen. Relevant
  spätestens für den geplanten teilbaren Link (Zustand in der URL).
- Neu vergebene Kind-Bezeichnungen kollidierten nach dem Löschen eines Kindes
  (`children.length+1`) – jetzt fortlaufender Zähler.
- Löschen-Button ist beim letzten Kind `disabled` statt stumm wirkungslos.

### Neu
- **Jahres-Umschalter für die Tarifstufen: 2024 / 2025 / 2026.** Je Jahr ein eigenes Array
  in `BRACKETS_BY_YEAR`, Werte belegt (BMF/WKO/AK). Eyebrow, Footer, Ceiling-Beschriftung
  und Modus-Hinweis ziehen mit.
- Im Modus „ab 2027" wird ausgewiesen, dass die Tarifstufen 2027 noch nicht kundgemacht
  sind und mit dem gewählten Jahr gerechnet wird.

### Geändert
- Die 2027-Aufteilungspflicht ist mit dem Budgetbegleitgesetz 2027–2028 (NR-Beschluss
  08.07.2026) beschlossen, nicht mehr geplant. Hinweis nennt jetzt auch die Ausnahmen
  (Kind unter 4 im Haushalt, Alleinerziehende).
- Button-Gruppen mit `role="group"`/`aria-label`, Buttons mit `type="button"`.

## [1.0.0] — 2026-07-27

### Neu
- Erste Version des Familienbonus-Aufteilungsrechners.
- Zwei Eltern, Eingabe wahlweise als steuerpflichtiges Jahreseinkommen (Tarif) oder
  direkt als Tarifsteuer.
- Tarifsteuer-Berechnung nach den Stufen **2025** (BMF).
- Beliebig viele Kinder, 2.000 € / 700 € je nach Alter/Beihilfe.
- Optimierung der Aufteilung (max. genutzter Bonus), Vergleich der Standard-Szenarien
  (100/0, 0/100, 50/50) plus empfohlener Aufteilung.
- Modus **freie Wahl (2025/2026)** und **Aufteilungspflicht ab 2027** (25:75 / 50:50).
- Hinweis auf Kindermehrbetrag bei zu geringer Steuer.
- Mobile-first UI, IBM Plex, Ledger-Optik. Vorbefüllt mit neutralen Platzhaltern.
