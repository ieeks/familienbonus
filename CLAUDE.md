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
- Aufnahmefähigkeit je Elternteil = `tarifsteuer(einkommen)`. Funktion `tarifsteuer()`
  nutzt die Stufen 2025 (Array `BRACKETS`).
- Optimierung: `bestSplit()` enumeriert pro Kind die zulässigen Anteile
  (frei: `[0,0.5,1]`; ab 2027: `[0.25,0.5,0.75]`) und maximiert den genutzten Bonus,
  Tie-Break auf gleichmäßigere Aufteilung.
- Beträge: 2.000 € (bis 18), 700 € (über 18 mit Beihilfe).

**Tarifstufen 2025:** `[[13308,0],[21617,.20],[35836,.30],[69166,.40],[103072,.48],[1000000,.50],[Inf,.55]]`
(Quelle BMF). Für weitere Jahre eigene Arrays anlegen, nicht das 2025er überschreiben.

## Design-Tokens (in `:root`)

- paper `#F2F1EC`, card `#FBFAF6`, ink `#17191C`, muted `#6B6E73`, line `#DED9CE`
- primary/petrol `#0F5E5A`, primary-soft `#E3EDEB`, amber (Empfehlung) `#B5751A`, waste `#A8402F`
- Type: IBM Plex Serif (Headings), IBM Plex Sans (UI), IBM Plex Mono (**alle Zahlen**, `.num`, tabular-nums)
- Signatur: Ledger-Optik, Mono-Zahlen, „genutzt vs. verpufft"-Balken pro Szenario,
  Empfehlung mit amber Flag.

## Testen

`index.html` im Browser öffnen. Sanity-Checks:
- Einkommen A=55.000, B=32.000, 2 Kinder → beide Ceilings > 4.000 gesamt? dann verpufft 0.
- Einkommen B=8.000 (< Steuergrenze) → Ceiling B = 0, Bonus muss auf A wandern.
- Modus „ab 2027" → keine 100/0-Szenarien mehr, nur 25:75 / 50:50.

## Session-Konvention (wie RGR-Tool)

Nach **jeder** Dev-Session **alle** Docs zusammen mit `index.html` aktualisieren und ausliefern:
`CHANGELOG.md`, `TODO.md`, `CLAUDE.md`, `README.md`. („alle files updaten")

## Autor / Deployment

GitHub `ieeks`. Deploy als eigenes Repo-Root **oder** Unterordner in `ieeks.github.io`.
