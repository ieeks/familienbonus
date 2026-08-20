# CLAUDE.md — Familienbonus-Rechner

Kontext für Claude Code. Vor jeder Session lesen.

## Projekt

Single-file Web-Tool, das die optimale Aufteilung des österreichischen **Familienbonus Plus**
zwischen zwei Elternteilen berechnet. Zielnutzer: Eltern bei der Arbeitnehmerveranlagung.
UI-Sprache: **Deutsch**. Kein Build-Step, keine Frameworks – gesamter Code in `index.html`
(HTML + CSS + Vanilla-JS in einem `<script>`).

## Nicht verhandelbar

- **Single-file bleibt single-file.** Kein npm, kein Vite, kein Bundler. Nur `index.html`
  + `icon.svg`. Fonts über Google-Fonts-CDN.
- Muss auf **GitHub Pages** ohne Build laufen und auf **Mobile** sauber funktionieren
  (Layout ist mobile-first, `@media (max-width:480px)` beachten).
- Rechenlogik nur mit belegten Werten ändern (Tarifstufen jahresgenau).

## Rechenlogik (Wahrheit)

- Familienbonus = Absetzbetrag § 33 Abs. 2 EStG, senkt Tarifsteuer **höchstens auf null**,
  gedeckelt mit der Tarifsteuer (Abs. 1). Wirkt nicht gegen Sonderzahlungen (13./14.).
- Aufnahmefähigkeit je Elternteil = `tarifsteuer(einkommen)`. `tarifsteuer(einkommen, year)`
  nutzt `BRACKETS_BY_YEAR[year || taxYear]`; `taxYear` ist per Segmented-Control wählbar
  (2024 / 2025 / 2026), Default 2025.
- Optimierung: `bestSplit()` enumeriert pro Kind die zulässigen Anteile
  (frei: `[0,0.5,1]`; ab 2027: `[0.25,0.5,0.75]`) und maximiert den genutzten Bonus
  über **alle Kinder gemeinsam** (die Deckel gelten für alle zusammen),
  Tie-Break auf gleichmäßigere Aufteilung.
  Der Tie-Break vergleicht gegen `maxUsed`, das **bisher gesehene Maximum**, nicht gegen
  die gerade markierte Aufteilung. Wer das zurückdreht, bekommt Drift: jeder angenommene
  Gleichstand senkt die Latte um bis zu `EPS`, und über mehrere Schritte summiert sich
  das (nachgewiesen 1,00 € unter dem Optimum). So bleibt der Abstand auf `EPS` begrenzt.
- Der Anteil je Kind läuft **immer** durch `shareToA(amt, f) = Math.round(amt*f)`, der Rest
  geht an den anderen Elternteil. `evaluate()` und `perChildTable()` benutzen dieselbe
  Funktion – sonst zeigt ein 667-€-Kind bei 50/50 „334 / 334" (ein Euro zu viel) und die
  Zeilensumme passt nicht zu „zugeteilt" auf derselben Karte. Zweimal aufrunden ist
  genau der Fehler, den `amountFor()` schon für die Gesamtsumme verhindert.
- Beträge sind **Monatsbeträge**: 166,68 € bis einschließlich des Monats des 18. Geburtstags,
  danach 58,34 € (nur mit Familienbeihilfe). Die „2.000 €" / „700 €" sind gerundete Jahreswerte
  (12 × 166,68 = 2.000,16). `childMode` = `birth` (Geburtsdatum, Default) | `amount` (Pauschale).
  `amountFor()` rundet je Kind auf volle Euro, **bevor** verteilt wird – sonst summieren sich
  die Zeilen der Tabelle je Kind nicht auf den Gesamtbetrag.
- Geburtsdatum ist ein **Textfeld**, kein `input[type=date]`: iOS bietet dort nur den
  Kalender ohne Tastatureingabe. `parseBirth()` nimmt TT.MM.JJJJ, TTMMJJJJ und JJJJ-MM-TT,
  `fmtBirth()` normalisiert im `change`-Handler.
  Zweistellige Jahre bleiben abgelehnt – Jahrhundert raten geht bei Geburtsdaten schief.
- **Eingabemasken** (`maskAmount()`, `maskBirth()`, gemeinsam `setCaretAfterDigits()`):
  Einkommen bekommt Tausenderpunkte, das Geburtsdatum die Punkte nach Tag und Monat –
  beides live beim Tippen. Die iOS-Zifferntastatur hat keinen Punkt, ohne die Maske ist
  das Datumsfeld auf Mobile praktisch nur als Ziffernfolge befüllbar.
  - Die Einkommensfelder sind deshalb `type="text"` + `inputmode="numeric"`. **Nicht auf
    `type="number"` zurückdrehen**: dort wäre „55.000" ein ungültiger Wert und `.value`
    käme leer zurück. Gelesen wird über `amountVal()`, auf „leer" prüft `hasDigits()` –
    `+el.value` ist bei „55.000" `NaN`.
  - Beide Masken verankern den Cursor an der Anzahl Ziffern links von ihm. Wer das
    wegoptimiert, bekommt den Sprung ans Feldende zurück, wegen dem in 1.2.1 während
    des Tippens gar nicht umgeschrieben wurde.
  - **Backspace auf einem Trennzeichen nimmt in beiden Masken die Ziffer davor mit.**
    Ohne das ist der Tastendruck wirkungslos – die Maske setzt das Trennzeichen sofort
    wieder, der Cursor rutscht nur eine Stelle nach links. Erkannt wird der Fall daran,
    dass die Ziffernzahl gleich geblieben ist. Den Stand davor liefert beim Datum
    `children[i].birth`, beim Betrag eine pro Feld mitgeführte Variable, die ein
    `beforeinput`-Listener aktuell hält – sonst wäre sie nach `applyQuery()` veraltet.
  - Der Datumspunkt steht **nur zwischen Gruppen, nie am Ende**. Ein angehängter Punkt
    („27.") kommt nach jedem Backspace sofort zurück – das Feld wäre nicht mehr leerbar.
    Backspace auf einem Punkt nimmt die Ziffer davor mit; erkannt wird das daran, dass
    `children[i].birth` im `input`-Handler noch den Stand vor dem Tastendruck hält.
  - Eingefügte ISO-Daten (`2018-07-27`) lässt `maskBirth()` unangetastet durch, sonst
    würde `parseBirth()` sie nie zu sehen bekommen. Getippt wird ISO nicht mehr erkannt.
- Aufteilungsregel: `splitMode` = `auto` (Default) | `free` | `restricted`; `effSplit()` löst
  `auto` aus `taxYear` + `ruleForYear()` auf. Datumsvergleiche laufen über Schlüssel `JJJJMMTT`
  (`key4`), **nicht** über `Date`-Objekte – sonst verschiebt die Zeitzone die Tagesgrenze.
  `effSplit()` steigt bei `childMode !== "birth"` auf `free` aus: `c.birth` bleibt im
  Pauschal-Modus stehen und wäre sonst unsichtbarer Altbestand, aus dem der Rechner still
  eine Altersentscheidung ableitet.
- **Erhöhte Familienbeihilfe** (`erhFB`, `ef=1` im Link): ein solches Kind ist einem Kind
  unter 4 gleichgestellt, `ruleForYear()` gibt dann sofort `free` zurück. Haushaltsbezogen
  wie die Altersbedingung, deshalb ein globales Häkchen und keine Spalte je Kind.
- `MAX_CHILDREN` (12) gilt für die **Eingabe und den Link**. Nicht nur für den Link:
  `bestSplit()` ist 3^n, 15 Kinder kosten gemessen 3,3 s **pro Tastendruck**, und ein Stand
  über der Grenze wäre ohnehin nicht teilbar – der Link würde beim Öffnen gekappt.
- Die 2027-Ausnahme ist **haushaltsbezogen** („kein weiteres Kind unter 4"), also
  alles-oder-nichts. Ein globaler Umschalter bildet das korrekt ab; je Kind wäre falsch.
  Rechtsgrundlage inzwischen kundgemacht: **BGBl. I Nr. 62/2026** vom 29.07.2026
  (Budgetbegleitgesetz 2027–2028, Beschluss NR 08.07.2026, kein Einspruch des BR am
  16.07.2026).
  **Offen:** ob im Übergangsjahr monatsweise ab dem 4. Geburtstag oder erst ab Folgejahr –
  nicht belegt, im UI ausdrücklich als offen gekennzeichnet. Nicht stillschweigend festlegen.
  Der Volltext von § 33 Abs. 3a EStG i. d. F. BBG 2027–2028 konnte aus der Session vom
  20.08.2026 nicht gelesen werden (RIS und BMF vom Egress-Proxy geblockt); die Ableitungen
  stammen aus Kanzlei-Zusammenfassungen. Vor dem Schließen dieser Frage im RIS gegenlesen.

**Tarifstufen** (Quelle BMF/WKO/AK) – je Jahr ein eigenes Array in `BRACKETS_BY_YEAR`,
**nie ein bestehendes überschreiben**:
- 2024: `[[12816,0],[20818,.20],[34513,.30],[66612,.40],[99266,.48],[1000000,.50],[Inf,.55]]`
- 2025: `[[13308,0],[21617,.20],[35836,.30],[69166,.40],[103072,.48],[1000000,.50],[Inf,.55]]`
- 2026: `[[13539,0],[21992,.20],[36458,.30],[70365,.40],[104859,.48],[1000000,.50],[Inf,.55]]`
- 2027: noch nicht kundgemacht (Stand 20.08.2026) – erst mit Beleg ergänzen. Die
  Inflationsanpassungsverordnung fürs Folgejahr kommt üblicherweise Ende August
  (die für 2026 am 30.08.2025). **Sobald 2027 dazukommt**, liefert `effSplit()` erstmals
  „restricted" aus `auto` – vorher die Übergangsjahr-Frage klären.

## Fallen, die schon einmal zugeschlagen haben

- **`cA+cB >= total` ist nicht „nichts verpufft".** Die Anteile sind gestuft, die passende
  Stufe muss es erst geben. Für Aussagen über Verlust immer `best.wasted` heranziehen.
  „Jede Aufteilung ist gleichwertig" gilt nur, wenn auch die ungünstigste zulässige
  Zuteilung noch unter beiden Ceilings bleibt: `min(cA,cB) >= maxShare*total`
  (`maxShare` = 1 frei, 0.75 ab 2027).
- **Genau eine Karte trägt „Empfohlen".** Gleich gute Szenarien bekommen „gleichwertig"
  (`.flag.alt`), sonst stehen drei Empfehlungen nebeneinander.
- **Aggregierte Prozentanzeige lügt bei gemischter Aufteilung.** Sind die Anteile je Kind
  nicht identisch, ist der Mittelwert selbst kein zulässiges Verhältnis → Kopfzeile zeigt
  „gemischt", die Wahrheit steht in `perChildTable()`.
- **Alles, was aus einem Eingabefeld kommt, läuft durch `esc()`**, bevor es in `innerHTML`
  landet (Namen, Kind-Bezeichnungen). Spätestens mit dem geplanten teilbaren Link
  (Zustand in der URL) wäre das sonst eine echte XSS.
- **Die Live-Region beschreibt die markierte Karte, nicht `bestSplit()`.** Bei Gleichstand
  sind das verschiedene Aufteilungen: gezeigt wird das erste passende kanonische Szenario,
  während `bestSplit()` über den Tie-Break z. B. bei 0:100/100:0 landet. Dafür gibt es
  `bestR`/`bestName`; wer stattdessen `best` nimmt, produziert eine Ansage, die nicht zur
  Karte passt.
- **`bestSplit()` ist 3^n Brute Force** (14 Kinder ≈ 0,8 s pro Tastendruck). Vor „viele
  Kinder"-Features durch eine geschlossene Lösung ersetzen: gesucht ist die erreichbare
  Summe für A möglichst nahe am Intervall `[total-cB, cA]`.

## Zustand: teilen und behalten

- Eine Kodierung für beides: `buildQuery()` erzeugt einen `URLSearchParams`-String,
  `applyQuery()` liest ihn. Derselbe String steht im URL-Hash **und** in `localStorage`
  (`STORE_KEY`, endet auf `.v1` – Format ändern heißt neuen Schlüssel vergeben).
- **Hash, nicht Query-String.** Der Teil hinter `#` wird nie an einen Server geschickt und
  steht in keinem Referer. Bei Einkommensdaten ist das der ganze Punkt – nicht auf
  `?`-Parameter umstellen.
- **Was im Link fehlt, ist der Default – nicht „unverändert lassen".** `applyQuery()` setzt
  jeden nicht gelieferten Schlüssel auf `DEF` zurück. Andernfalls zeigt der zweite Link im
  selben Tab (`hashchange`) noch Werte des ersten, weil `buildQuery()` Defaults ja gerade
  weglässt: `#a=55000&na=Anna`, dann `#b=40000` → „Anna" bliebe stehen, obwohl der zweite
  Link den Default kodiert. Ein Link muss den Stand zeigen, den auch der Empfänger sieht.
- Ein Kind = vier gleichnamige Parameter (`cn`/`cb`/`ca`/`ch`) an derselben Position,
  gelesen über `getAll()`. Deshalb gibt es kein Trennzeichen innerhalb eines Wertes und
  nichts zusätzlich zu escapen. Leere Werte bleiben als leerer Parameter stehen, sonst
  verrutscht die Zuordnung.
- **Im Link steht nur, was vom Default abweicht** (Standardfall 78 Zeichen inkl. Domain).
  `DEF` wird beim Laden aus dem DOM und den Startwerten **ausgelesen**, nicht notiert –
  wer im HTML einen anderen Startwert setzt, ändert damit automatisch mit, was im Link
  weggelassen wird. Geburtsdaten stehen als reine Ziffernfolge (`birthToLink()` /
  `birthFromLink()`).
- Kind-Spalten sind **alles-oder-nichts**: weicht ein Kind ab, wird die Spalte für *alle*
  Kinder geschrieben. Eine lückenhafte Spalte gibt es nicht, weil die Zuordnung an der
  Position hängt. Fehlt eine Spalte, gilt für alle der Default.
- Die Kinderzahl steht in `k` (nur wenn sie von `DEF.kids` abweicht). Beim Lesen gilt:
  `k` gewinnt, aber nie unter der Zahl gelieferter Spalteneinträge – sonst schluckt ein
  falsches `k` vorhandene Kinder. Ohne `k` sagen die Spalten die Anzahl.
- `applyQuery()` verlangt mindestens einen Schlüssel aus `LINK_KEYS`, sonst fasst es den
  Stand nicht an: ein Hash kann auch ein Sprungziel sein.
- **Kein externer Shortener.** Ein Dienst müsste Einkommen, Namen und Geburtsdaten
  speichern und sähe jeden Aufruf – das hebelt genau die Eigenschaft aus, für die der
  Zustand im Hash steht. Wenn kürzer nötig ist: QR-Code, offline erzeugt.
- **Ein Link ist Fremdeingabe.** `applyQuery()` prüft jeden Wert gegen die erlaubten
  (Jahr nur aus `BRACKETS_BY_YEAR`, Modi nur aus ihrer Liste, Betrag je Kind nur die
  beiden Stufen des Selects), kappt Texte auf `MAX_TEXT` und die Kinderzahl auf
  `MAX_CHILDREN` (12). Die Obergrenze ist kein Schönheitsfehler: `bestSplit()` ist
  3^n, ohne sie hängt ein fremder Link den Browser des Empfängers auf.
- `syncSegs()` zieht `aria-pressed` der vier Segmented-Controls nach. Wer Zustand
  einliest und das vergisst, bekommt eine Leiste, die etwas anderes anzeigt als der
  Rechner rechnet.
- Gespeichert wird entprellt am Ende von `compute()` – jede Änderung läuft dort durch,
  ein Haken reicht. `localStorage` kann werfen (Privatmodus): alle Zugriffe in `try`.
- Der Start liest **erst den Link, dann den Speicher** (wer einen Link öffnet, will den
  Link sehen). `hashchange` fängt den Fall ab, dass im selben Tab ein zweiter Link
  aufgerufen wird – das lädt die Seite nicht neu.

## Design-Tokens (in `:root`)

- paper `#F2F1EC`, card `#FBFAF6`, ink `#17191C`, muted `#6B6E73`, line `#DED9CE`
- primary/petrol `#0F5E5A`, primary-soft `#E3EDEB`, amber (Empfehlung) `#B5751A`, waste `#A8402F`
- Type: IBM Plex Serif (Headings), IBM Plex Sans (UI), IBM Plex Mono (**alle Zahlen**, `.num`, tabular-nums)
- Beträge immer über `eur()`. Das nutzt bewusst `Intl.NumberFormat("de-DE")` – `de-AT`
  gruppiert mit U+00A0 („13 593"), AT-Konvention ist der Punkt („13.593").
- Signatur: Ledger-Optik, Mono-Zahlen, „genutzt vs. verpufft"-Balken pro Szenario,
  Empfehlung mit amber Flag.

## Testen

`index.html` im Browser öffnen. Sanity-Checks:
- Einkommen A=55.000, B=32.000, 2 Kinder → Ceilings 13.593 / 4.777, verpufft 0.
- Einkommen B=8.000 (< Steuergrenze) → Ceiling B = 0, Bonus muss auf A wandern.
- Modus „ab 2027" → keine 100/0-Szenarien mehr, nur 25:75 / 50:50.
- Jahr umschalten bei A=55.000 → 13.904 (2024) / 13.593 (2025) / 13.447 (2026).
- `55000` ins Einkommensfeld tippen → im Feld steht `55.000`, Ceiling 13.593.
  Ziffer vorne einfügen → Cursor bleibt hinter der eingefügten Ziffer.
- `27072018` ins Datumsfeld tippen → `27.07.2018`, ohne dass ein Punkt getippt wurde.
  Backspace bis zum Ende: das Feld wird wirklich leer, hängt nicht bei „27." fest.
  Nach der ersten Ziffer steht „Weiter tippen", nicht die rote Warnung.
- Tarifsteuer-Modus, cA=850, cB=9.000, Kinder 2.000 + 700, ab 2027 → Empfehlung ist
  gemischt (Kind 1 = 25:75, Kind 2 = 50:50); Kopfzeile darf keinen Mittelwert zeigen.
- Kind mit Geburtsdatum **01.09.2025**, Jahr 2025 (→ 667 €), 50/50: die Zeile je Kind muss
  „334 € / 333 €" zeigen, nicht „334 € / 334 €", und die Zeilen müssen sich auf die
  „zugeteilt"-Werte derselben Karte aufsummieren.
- „Pflicht ab 2027" mit Kindern über 4 → Häkchen **erhöhte Familienbeihilfe** setzen:
  Modus „Automatisch" fällt auf freie Wahl zurück, im Link steht `ef=1`.
- 12 Kinder anlegen → „+ Kind hinzufügen" ist deaktiviert und der Hinweis erscheint.
- `#a=55000&na=Anna` öffnen, im selben Tab `#b=40000` aufrufen → Name steht wieder auf
  „Elternteil A", Einkommen A ist leer. Ein Link zeigt immer den vollen Stand.
- `55.000` im Einkommensfeld, Cursor hinter den Tausenderpunkt, Backspace → `5.000`
  (ein Tastendruck, nicht zwei).
- `<img src=x onerror=alert(1)>` als Name → erscheint als Text, kein Element im DOM.
- Werte eintragen → „Link zum Teilen kopieren" → Link in einem frischen Profil öffnen:
  identischer Stand, Segmented-Controls stimmen mit der Rechnung überein.
- Seite neu laden → Eingaben stehen noch da. „Zurücksetzen" (mit Rückfrage) → Defaults,
  `localStorage` leer, Hash weg.
- Link mit `#y=9999&ca=999999` und 40 Kindern → Jahr fällt auf den Default zurück,
  Betrag auf 2.000 €, höchstens 12 Kinder, kein Hänger.
- Standardfall (nur Einkommen + zwei Geburtsdaten) ergibt exakt
  `#a=55000&b=32000&cb=27072018&cb=11052022`. Link öffnen, erneut teilen → identischer
  Link (Fixpunkt). Wer die Kodierung anfasst, prüft das zuerst.
- `#sec-ergebnis` als Hash → der gespeicherte Stand bleibt stehen, keine Meldung.

## Session-Konvention (wie RGR-Tool)

Nach **jeder** Dev-Session **alle** Docs zusammen mit `index.html` aktualisieren und ausliefern:
`CHANGELOG.md`, `TODO.md`, `CLAUDE.md`, `README.md`. („alle files updaten")

## Autor / Deployment

GitHub `ieeks`, Repo `familienbonus`. Deploy als eigenes Repo-Root
(`ieeks.github.io/familienbonus/`) **oder** als Unterordner in `ieeks.github.io`.
