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
  (frei: `[0,0.5,1]`; ab 2027: `[0.25,0.5,0.75]`) und maximiert den genutzten Bonus,
  Tie-Break auf gleichmäßigere Aufteilung.
- Beträge: 2.000 € (bis 18), 700 € (über 18 mit Beihilfe).

**Tarifstufen** (Quelle BMF/WKO/AK) – je Jahr ein eigenes Array in `BRACKETS_BY_YEAR`,
**nie ein bestehendes überschreiben**:
- 2024: `[[12816,0],[20818,.20],[34513,.30],[66612,.40],[99266,.48],[1000000,.50],[Inf,.55]]`
- 2025: `[[13308,0],[21617,.20],[35836,.30],[69166,.40],[103072,.48],[1000000,.50],[Inf,.55]]`
- 2026: `[[13539,0],[21992,.20],[36458,.30],[70365,.40],[104859,.48],[1000000,.50],[Inf,.55]]`
- 2027: noch nicht kundgemacht – erst mit Beleg ergänzen.

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
- Tarifsteuer-Modus, cA=850, cB=9.000, Kinder 2.000 + 700, ab 2027 → Empfehlung ist
  gemischt (Kind 1 = 25:75, Kind 2 = 50:50); Kopfzeile darf keinen Mittelwert zeigen.
- `<img src=x onerror=alert(1)>` als Name → erscheint als Text, kein Element im DOM.

## Session-Konvention (wie RGR-Tool)

Nach **jeder** Dev-Session **alle** Docs zusammen mit `index.html` aktualisieren und ausliefern:
`CHANGELOG.md`, `TODO.md`, `CLAUDE.md`, `README.md`. („alle files updaten")

## Autor / Deployment

GitHub `ieeks`, Repo `familienbonus`. Deploy als eigenes Repo-Root
(`ieeks.github.io/familienbonus/`) **oder** als Unterordner in `ieeks.github.io`.
