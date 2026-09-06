# CLAUDE.md — Familienbonus-Rechner

Kontext für Claude Code. Vor jeder Session lesen.

## Projekt

Single-file Web-Tool, das die optimale Aufteilung des österreichischen **Familienbonus Plus**
zwischen zwei Elternteilen berechnet. Zielnutzer: Eltern bei der Arbeitnehmerveranlagung.
UI-Sprache: **Deutsch**. Kein Build-Step, keine Frameworks – gesamter Code in `index.html`
(HTML + CSS + Vanilla-JS in einem `<script>`).

## Nicht verhandelbar

- **Single-file bleibt single-file.** Kein npm, kein Vite, kein Bundler. Ausgeliefert werden
  `index.html` + `icon.svg`. Fonts über Google-Fonts-CDN. (`tests/` läuft in Node und wird
  nicht ausgeliefert – das ändert daran nichts.)
- Muss auf **GitHub Pages** ohne Build laufen und auf **Mobile** sauber funktionieren
  (Layout ist mobile-first, `@media (max-width:480px)` beachten).
- Rechenlogik nur mit belegten Werten ändern (Tarifstufen jahresgenau).
- **Was der Rechner nicht kann, sagt er.** Der Block „Wofür dieser Rechner gilt" im
  Ergebnis ist keine Deko: er hält vier bekannte Modellgrenzen offen, statt sie in einem
  plausibel aussehenden Ergebnis zu verstecken. Wer eine davon implementiert, zieht den
  Block mit; wer eine neue Annahme einführt, schreibt sie dazu.

## Rechenlogik (Wahrheit)

- Familienbonus = Absetzbetrag § 33 Abs. 2 EStG, senkt Tarifsteuer **höchstens auf null**,
  gedeckelt mit der Tarifsteuer (Abs. 1). Wirkt nicht gegen Sonderzahlungen (13./14.).
- **Gerechnet wird in ganzen Cent.** `amountFor()`, `ceilingCents()`, `evaluate()`,
  `bestSplit()` und `shareToA()` arbeiten mit Integer-Cent, `eurC()` formatiert erst für
  die Anzeige (`eur()` nimmt Euro-Werte). Nicht auf Euro zurückdrehen: Runden vor dem
  Teilen erzeugt genau die Bevorzugung von A, wegen der ein 666,72-€-Kind bei 50/50
  „334 / 333" zeigte. In Cent geht das glatt auf (333,36 / 333,36), und `EPS` ist ein
  halber Cent statt eines halben Euro – die Suche liefert damit das exakte Optimum.
- Aufnahmefähigkeit je Elternteil = `ceilingCents()`; im Einkommensmodus
  `tarifsteuer(einkommen, year)` mit `BRACKETS_BY_YEAR[year || taxYear]`. `taxYear` ist per
  Segmented-Control wählbar (2024 / 2025 / 2026), Default 2025. Ein **negativer** Betrag
  ergibt keinen Deckel von 0, sondern einen sichtbaren Fehler (`amountBad()`).
- Optimierung: `bestSplit()` enumeriert pro Kind die zulässigen Anteile
  (frei: `[0,0.5,1]`; ab 2027: `[0.25,0.5,0.75]`) und maximiert den genutzten Bonus
  über **alle Kinder gemeinsam** (die Deckel gelten für alle zusammen),
  Tie-Break auf gleichmäßigere Aufteilung.
  Der Tie-Break vergleicht gegen `maxUsed`, das **bisher gesehene Maximum**, nicht gegen
  die gerade markierte Aufteilung. Wer das zurückdreht, bekommt Drift: jeder angenommene
  Gleichstand senkt die Latte um bis zu `EPS`, und über mehrere Schritte summiert sich das.
  `bestSplit()` merkt sich ihr letztes Ergebnis (Schlüssel aus Stufen, Deckeln, Beträgen) –
  sonst kostet jeder Tastendruck im **Namensfeld** die volle 3^n-Suche (bei 12 Kindern
  gemessen 1,2 s).
- Der Anteil je Kind läuft **immer** durch `shareToA(amt, f) = Math.round(amt*f)` (Cent),
  der Rest geht an den anderen Elternteil. `evaluate()` und `perChildTable()` benutzen
  dieselbe Funktion – sonst passt die Zeilensumme nicht zu „zugeteilt" auf derselben Karte.
- Beträge sind **Monatsbeträge**: `FB_M_U18_C` = 16668 Cent bis einschließlich des Monats
  des 18. Geburtstags, danach `FB_M_O18_C` = 5834 (nur mit Familienbeihilfe). Die
  „2.000 €" / „700 €" im Pauschal-Modus sind gerundete Jahreswerte (12 × 166,68 =
  2.000,16 – wird auch so angezeigt). `childMode` = `birth` (Geburtsdatum, Default) |
  `amount` (Pauschale). `children[i].amount` bleibt in **Euro** (Select-Wert und
  Link-Format `ca=2000`), `amountFor()` rechnet daraus Cent.
- Geburtsdatum ist ein **Textfeld**, kein `input[type=date]`: iOS bietet dort nur den
  Kalender ohne Tastatureingabe. `parseBirth()` nimmt TT.MM.JJJJ, TTMMJJJJ und JJJJ-MM-TT,
  `fmtBirth()` normalisiert im `change`-Handler.
  Zweistellige Jahre bleiben abgelehnt – Jahrhundert raten geht bei Geburtsdaten schief.
- **Eingabemasken** (`maskAmount()`, `maskBirth()`, gemeinsam `setCaretAfterDigits()` und
  `deletedChar()`): Einkommen bekommt Tausenderpunkte, das Geburtsdatum die Punkte nach
  Tag und Monat – beides live beim Tippen. Die iOS-Zifferntastatur hat keinen Punkt, ohne
  die Maske ist das Datumsfeld auf Mobile praktisch nur als Ziffernfolge befüllbar.
  - **Ein Betrag ist nicht „alle Ziffern hintereinander".** `splitAmount()` zerlegt in
    Vorzeichen, Euro und Cent; `amountVal()` liefert daraus den Wert **mit Cent und
    Vorzeichen**. Wer das durch `+digitsOf(s)` ersetzt, macht aus „1.234,56" wieder
    123.456 und aus „-500" 500 – beides stillschweigend und um Größenordnungen daneben.
    Dezimaltrennzeichen ist das Komma; ein Punkt gilt als Tausenderpunkt, außer er steht
    ohne Komma vor ein bis zwei Schlussziffern („12.34" = eingefügter englischer
    Dezimalpunkt, „12.345" = Gruppierung).
  - Die Einkommensfelder sind deshalb `type="text"` + `inputmode="numeric"`. **Nicht auf
    `type="number"` zurückdrehen**: dort wäre „55.000" ein ungültiger Wert und `.value`
    käme leer zurück. Auf „leer" prüft `hasDigits()` – `+el.value` ist bei „55.000" `NaN`.
  - Beide Masken verankern den Cursor an der Anzahl Ziffern links von ihm. Wer das
    wegoptimiert, bekommt den Sprung ans Feldende zurück.
  - **Backspace auf einem Trennzeichen nimmt die Ziffer davor mit.** Ohne das ist der
    Tastendruck wirkungslos – die Maske setzt das Trennzeichen sofort wieder. Welches
    Zeichen gelöscht wurde, liefert `deletedChar()` aus dem Stand vor dem Tastendruck
    (beim Datum `children[i].birth`, beim Betrag eine pro Feld über `beforeinput`
    mitgeführte Variable). Nur der **Punkt** löst das aus: beim Komma ist das Löschen
    schon für sich wirksam, die Nachkommastellen rücken in den Euro-Teil.
  - Der Datumspunkt steht **nur zwischen Gruppen, nie am Ende**. Ein angehängter Punkt
    („27.") käme nach jedem Backspace sofort zurück – das Feld wäre nicht mehr leerbar.
  - **Am Stück eingefügte Datumswerte werden vor dem Falten geparst** („1.1.2020" hat nur
    sechs Ziffern, positionell gefaltet ergäbe das „11.20.20"). Erkannt an
    `insertFromPaste` oder daran, dass mehr als eine Ziffer auf einmal dazukam.
    Eingefügte ISO-Daten (`2018-07-27`) laufen unangetastet durch; getippt wird ISO nicht
    erkannt.
- **Vollständigkeit ist getrennt von der Rechnung** (`dataIssues()`): ein leeres Feld und
  eine bewusst eingetragene 0 rechnen gleich, dürfen aber nicht gleich aussehen. Fehlende
  Geburtsdaten, leere oder negative Elternbeträge machen das Ergebnis **vorläufig**: der
  Mangel steht über dem Ergebnis (`#issues`), die Karte trägt „vorläufig" statt
  „Empfohlen", und keine Aussage behauptet mehr, dass etwas ankommt. Valide Nullfälle
  (eingetragene 0) rechnen normal weiter – das ist der Unterschied, um den es geht.
- Aufteilungsregel: `splitMode` = `auto` (Default) | `free` | `restricted`; `effSplit()` löst
  `auto` aus `taxYear` + `ruleForYear()` auf. Datumsvergleiche laufen über Schlüssel `JJJJMMTT`
  (`key4`), **nicht** über `Date`-Objekte – sonst verschiebt die Zeitzone die Tagesgrenze.
  `effSplit()` steigt bei `childMode !== "birth"` auf `free` aus: `c.birth` bleibt im
  Pauschal-Modus stehen und wäre sonst unsichtbarer Altbestand.
  **`splitHintText()` beschreibt die wirksame Regel, nicht die schönere.** Weicht ein
  manuell gesetzter Modus von dem ab, was `auto` ergäbe, wird das als Simulation
  ausgewiesen. Der Fall, an dem es aufgefallen ist: erhöhte Familienbeihilfe + manueller
  Pflichtmodus – der Text erklärte die freie Wahl, gerechnet wurde 75/25.
- **Erhöhte Familienbeihilfe** (`erhFB`, `ef=1` im Link): ein solches Kind ist einem Kind
  unter 4 gleichgestellt, `ruleForYear()` gibt dann sofort `free` zurück. Haushaltsbezogen
  wie die Altersbedingung, deshalb ein globales Häkchen und keine Spalte je Kind.
- `MAX_CHILDREN` (12) gilt für die **Eingabe und den Link**. `bestSplit()` ist 3^n, 15 Kinder
  kosten gemessen 3,3 s, und ein Stand über der Grenze wäre ohnehin nicht teilbar.
- Die 2027-Ausnahme ist **haushaltsbezogen** („kein weiteres Kind unter 4"), also
  alles-oder-nichts. Ein globaler Umschalter bildet das korrekt ab; je Kind wäre falsch.
  Rechtsgrundlage kundgemacht: **BGBl. I Nr. 62/2026** vom 29.07.2026
  (Budgetbegleitgesetz 2027–2028, Beschluss NR 08.07.2026, kein Einspruch des BR am
  16.07.2026).
  **Offen:** ob im Übergangsjahr monatsweise ab dem 4. Geburtstag oder erst ab Folgejahr –
  nicht belegt, im UI ausdrücklich als offen gekennzeichnet. Nicht stillschweigend festlegen.
  Der Volltext von § 33 Abs. 3a EStG i. d. F. BBG 2027–2028 war aus den Sessions vom
  20.08. und 06.09.2026 nicht lesbar (RIS und BMF vom Egress-Proxy geblockt); die
  Ableitungen stammen aus Kanzlei-Zusammenfassungen. Vor dem Schließen im RIS gegenlesen.
- **Der Modus „Pflicht ab 2027" ist eine Simulation, keine Veranlagung.** Er rechnet die
  Aufteilungsstufen von 2027 mit Tarif, Kinderbeträgen und Alter des **gewählten** Jahres;
  2027 selbst ist als Steuerjahr nicht wählbar. Das steht im Ergebnis so dabei – nicht
  entfernen, solange die Tarifstufen 2027 fehlen.

**Tarifstufen** (Quelle BMF/WKO/AK) – je Jahr ein eigenes Array in `BRACKETS_BY_YEAR`,
**nie ein bestehendes überschreiben**:
- 2024: `[[12816,0],[20818,.20],[34513,.30],[66612,.40],[99266,.48],[1000000,.50],[Inf,.55]]`
- 2025: `[[13308,0],[21617,.20],[35836,.30],[69166,.40],[103072,.48],[1000000,.50],[Inf,.55]]`
- 2026: `[[13539,0],[21992,.20],[36458,.30],[70365,.40],[104859,.48],[1000000,.50],[Inf,.55]]`
- 2027: noch nicht kundgemacht (Stand 06.09.2026) – erst mit Beleg ergänzen. Die
  Inflationsanpassungsverordnung fürs Folgejahr kommt üblicherweise Ende August
  (die für 2026 am 30.08.2025). **Sobald 2027 dazukommt**, liefert `effSplit()` erstmals
  „restricted" aus `auto` – vorher die Übergangsjahr-Frage klären.

## Modellgrenzen, die im UI stehen (und nicht heimlich fallen dürfen)

Alle vier sind bewusst **nicht** implementiert; der Rechner grenzt sie im Block
„Wofür dieser Rechner gilt" aus. Wer eine davon anfasst, macht daraus eine Erweiterung
mit eigener Recherche – nicht einen Nebeneffekt.
- **Anspruchsmonate**: Familienbeihilfe wird als durchgehend unterstellt. Ein Teiljahr
  (Ende der Ausbildung) rechnet zu hoch – bei einem volljährigen Kind 700 statt 350,04 €.
- **Familienkonstellation**: zwei ganzjährig berechtigte Elternteile. Getrennt lebende
  Eltern mit Unterhaltsabsetzbetrag und Alleinberechtigte fehlen. **Null Einkommen beweist
  keine alleinige Berechtigung** – deshalb wird der Fall nicht geraten.
- **Einkommensbegriff**: verlangt ist das steuerpflichtige Einkommen **nach** Abzügen.
  KZ 245 vom L16 ist der Ausgangswert; wer sie ungekürzt einträgt, liegt zu hoch (bei
  20.000 € und nur dem 132-€-Pauschale um 26,40 €).
- **2027**: siehe Simulation oben.

## Fallen, die schon einmal zugeschlagen haben

- **`cA+cB >= total` ist nicht „nichts verpufft".** Die Anteile sind gestuft, die passende
  Stufe muss es erst geben. Für Aussagen über Verlust immer `best.wasted` heranziehen.
  „Jede Aufteilung ist gleichwertig" gilt nur, wenn auch die ungünstigste zulässige
  Zuteilung noch unter beiden Ceilings bleibt: `min(cA,cB) >= maxShare*total`
  (`maxShare` = 1 frei, 0.75 ab 2027).
- **Genau eine Karte trägt „Empfohlen".** Gleich gute Szenarien bekommen „gleichwertig"
  (`.flag.alt`), sonst stehen drei Empfehlungen nebeneinander. Bei unvollständigen Daten
  trägt sie stattdessen „vorläufig" (`.flag.prov`) und wird nicht hervorgehoben.
- **Aggregierte Prozentanzeige lügt bei gemischter Aufteilung.** Sind die Anteile je Kind
  nicht identisch, ist der Mittelwert selbst kein zulässiges Verhältnis → Kopfzeile zeigt
  „gemischt", die Wahrheit steht in `perChildTable()`.
- **Alles, was aus einem Eingabefeld kommt, läuft durch `esc()`**, bevor es in `innerHTML`
  landet (Namen, Kind-Bezeichnungen, auch die Texte aus `dataIssues()`).
- **Die Live-Region beschreibt die markierte Karte, nicht `bestSplit()`.** Bei Gleichstand
  sind das verschiedene Aufteilungen. Dafür gibt es `bestR`/`bestName`; wer stattdessen
  `best` nimmt, produziert eine Ansage, die nicht zur Karte passt.
- **`bestSplit()` ist 3^n Brute Force.** Vor „viele Kinder"-Features durch eine geschlossene
  Lösung ersetzen: gesucht ist die erreichbare Summe für A möglichst nahe am Intervall
  `[total-cB, cA]`.

## Zustand: teilen und behalten

- Eine Kodierung für beides: `buildQuery()` erzeugt einen `URLSearchParams`-String,
  `applyQuery()` liest ihn. Derselbe String steht im URL-Hash **und** in `localStorage`
  (`STORE_KEY`, endet auf `.v1` – Format ändern heißt neuen Schlüssel vergeben).
- **Hash, nicht Query-String.** Der Teil hinter `#` wird nie an einen Server geschickt und
  steht in keinem Referer. Bei Einkommensdaten ist das der ganze Punkt.
- **Der Hash ist eine Momentaufnahme, kein Zustand.** Nach dem Import (Start oder
  `hashchange`) wandert der Stand sofort in den Speicher und der Hash verschwindet aus der
  Adresse (`dropStateHash()`, aufgerufen am Ende von `compute()`). Ohne das gewinnt ein
  alter Link beim nächsten Reload gegen die inzwischen geänderten Eingaben – nachgewiesen:
  Link mit 20.000 € öffnen, auf 30.000 ändern, neu laden → wieder 20.000. Fremde Hashes
  (`#sec-ergebnis`) bleiben unangetastet, erkannt an `hasStateKeys()`.
- **Was im Link fehlt, ist der Default – nicht „unverändert lassen".** `applyQuery()` setzt
  jeden nicht gelieferten Schlüssel auf `DEF` zurück. Ein Link muss den Stand zeigen, den
  auch der Empfänger sieht.
- Ein Kind = vier gleichnamige Parameter (`cn`/`cb`/`ca`/`ch`) an derselben Position,
  gelesen über `getAll()`. Leere Werte bleiben als leerer Parameter stehen, sonst
  verrutscht die Zuordnung.
- **Im Link steht nur, was vom Default abweicht** (Standardfall 78 Zeichen inkl. Domain).
  `DEF` wird beim Laden aus dem DOM und den Startwerten **ausgelesen**, nicht notiert.
  Geburtsdaten stehen als reine Ziffernfolge (`birthToLink()` / `birthFromLink()`),
  Beträge als Zahl mit Punkt als Dezimaltrennzeichen (`amountToLink()`: `a=55000`,
  mit Cent `a=1234.56`).
- **Der Link kennt nur die aktive Eingabeart.** Einkommen und Tarifsteuer werden je Modus
  getrennt gehalten (`parked`, `switchInputMode()`): dieselbe Zahl heißt je Art etwas
  anderes, aus 20.000 € Einkommen dürfen beim Umschalten nicht 20.000 € Tarifsteuer
  werden. Nach `applyQuery()` wird der geparkte Stand der anderen Art geleert – er stammt
  aus einer anderen Sitzung und wäre genau diese stille Umdeutung.
- Kind-Spalten sind **alles-oder-nichts**: weicht ein Kind ab, wird die Spalte für *alle*
  Kinder geschrieben. Fehlt eine Spalte, gilt für alle der Default.
- Die Kinderzahl steht in `k` (nur wenn sie von `DEF.kids` abweicht). Beim Lesen gilt:
  `k` gewinnt, aber nie unter der Zahl gelieferter Spalteneinträge.
- `applyQuery()` verlangt mindestens einen Schlüssel aus `LINK_KEYS`, sonst fasst es den
  Stand nicht an: ein Hash kann auch ein Sprungziel sein.
- **Kein externer Shortener.** Ein Dienst müsste Einkommen, Namen und Geburtsdaten
  speichern und sähe jeden Aufruf. Wenn kürzer nötig ist: QR-Code, offline erzeugt.
- **Ein Link ist Fremdeingabe.** `applyQuery()` prüft jeden Wert gegen die erlaubten
  (Jahr nur aus `BRACKETS_BY_YEAR`, Modi nur aus ihrer Liste, Betrag je Kind nur die
  beiden Stufen des Selects), kappt Texte auf `MAX_TEXT` und die Kinderzahl auf
  `MAX_CHILDREN` (12).
- `syncSegs()` zieht `aria-pressed` der vier Segmented-Controls nach.
- Gespeichert wird entprellt am Ende von `compute()`; `saveNow()` schreibt sofort (beim
  Import, bevor der Hash verschwindet). `localStorage` kann werfen (Privatmodus): alle
  Zugriffe in `try`.
- Der Start liest **erst den Link, dann den Speicher** (wer einen Link öffnet, will den
  Link sehen). `hashchange` fängt den zweiten Link im selben Tab ab.

## Design-Tokens (in `:root`)

- paper `#F2F1EC`, card `#FBFAF6`, ink `#17191C`, muted `#6B6E73`, line `#DED9CE`
- primary/petrol `#0F5E5A`, primary-soft `#E3EDEB`, amber (Empfehlung) `#B5751A`, waste `#A8402F`
- Type: IBM Plex Serif (Headings), IBM Plex Sans (UI), IBM Plex Mono (**alle Zahlen**, `.num`, tabular-nums)
- Beträge immer über `eur()` / `eurC()`. Das nutzt bewusst `Intl.NumberFormat("de-DE")` –
  `de-AT` gruppiert mit U+00A0 („13 593"), AT-Konvention ist der Punkt („13.593").
  Cent werden gezeigt, wenn welche anfallen („13.593,10 €"), runde Beträge ohne.
- Signatur: Ledger-Optik, Mono-Zahlen, „genutzt vs. verpufft"-Balken pro Szenario,
  Empfehlung mit amber Flag.

## Testen

**Erst `node tests/run.mjs`** (145 Prüfungen, keine Abhängigkeiten, läuft auch in CI).
Wer Rechen- oder Zustandslogik anfasst, ergänzt den Fall dort – die Tests sind der Grund,
warum ein zweites Review nicht dieselben Fehler wiederfindet.
`tests/dom.mjs` schneidet das `<script>` aus `index.html` und führt es in einer
nachgebauten DOM-Umgebung aus; die Seg-Buttons und Feld-Startwerte liest es aus dem HTML.
Der Testhaken am Ende des Skripts hängt nur an, wenn `window.__FB_TEST` **vorher** gesetzt
ist – im Browser ist er nicht aktiv.

Danach `index.html` im Browser öffnen (das können die Tests nicht):
- Einkommen A=55.000, B=32.000, 2 Kinder → Ceilings 13.593,10 / 4.776,70, verpufft 0.
- Einkommen B=8.000 (< Steuergrenze) → Ceiling B = 0, Bonus muss auf A wandern.
- `1.234,56` eintippen → im Feld steht `1.234,56`, nicht `123.456`. `-500` einfügen →
  Ceiling zeigt „–" und „Betrag nicht verwertbar", das Ergebnis ist vorläufig.
- Modus „ab 2027" → keine 100/0-Szenarien mehr, nur 25:75 / 50:50; im Ergebnis steht
  „Simulation, keine Veranlagung 2027".
- Jahr umschalten bei A=55.000 → 13.903,70 (2024) / 13.593,10 (2025) / 13.447,20 (2026).
- `55000` ins Einkommensfeld tippen → im Feld steht `55.000`. Ziffer vorne einfügen →
  Cursor bleibt hinter der eingefügten Ziffer.
- `27072018` ins Datumsfeld tippen → `27.07.2018`, ohne dass ein Punkt getippt wurde.
  Backspace bis zum Ende: das Feld wird wirklich leer. `1.1.2020` einfügen → `01.01.2020`.
- Kind mit Geburtsdatum **01.09.2025**, Jahr 2025, 50/50: die Zeile je Kind zeigt
  „333,36 € / 333,36 €" und summiert sich auf die „zugeteilt"-Werte derselben Karte.
- Zwei Kinder, nur ein Geburtsdatum → roter Kasten über dem Ergebnis, Karte „vorläufig",
  kein „kommt an". Zweites Datum nachtragen → „Empfohlen" kommt zurück.
- „Pflicht ab 2027" + Häkchen **erhöhte Familienbeihilfe** → der Hinweis sagt, dass
  rechtlich die freie Wahl bliebe und hier bewusst abweichend gerechnet wird.
- Eingabeart auf „Tarifsteuer direkt" umschalten → die Felder sind leer, nicht umgedeutet;
  zurückschalten holt das Einkommen wieder.
- 12 Kinder anlegen → „+ Kind hinzufügen" ist deaktiviert; Name ändern bleibt flüssig.
- Link öffnen (`#a=55000&…`) → Werte stehen, Hash verschwindet aus der Adresse. Wert
  ändern, neu laden → die **Änderung** steht da, nicht der Link.
- `#sec-ergebnis` als Hash → der gespeicherte Stand bleibt stehen, Hash bleibt erhalten.
- `<img src=x onerror=alert(1)>` als Name → erscheint als Text, kein Element im DOM.
- Werte eintragen → „Link zum Teilen kopieren" → Link in einem frischen Profil öffnen:
  identischer Stand, Segmented-Controls stimmen mit der Rechnung überein.
- Seite neu laden → Eingaben stehen noch da. „Zurücksetzen" (mit Rückfrage) → Defaults,
  `localStorage` leer, Hash weg.
- Standardfall (nur Einkommen + zwei Geburtsdaten) ergibt exakt
  `#a=55000&b=32000&cb=27072018&cb=11052022` (Fixpunkt, auch als Test).

## Session-Konvention (wie RGR-Tool)

Nach **jeder** Dev-Session **alle** Docs zusammen mit `index.html` aktualisieren und ausliefern:
`CHANGELOG.md`, `TODO.md`, `CLAUDE.md`, `README.md`. („alle files updaten")

## Autor / Deployment

GitHub `ieeks`, Repo `familienbonus`. Deploy als eigenes Repo-Root
(`ieeks.github.io/familienbonus/`) **oder** als Unterordner in `ieeks.github.io`.
`tests/` und `.github/` gehören nicht zum Deploy und stören ihn auch nicht.
