# Aufgabe: Familienbonus-Rechner weiterentwickeln

Du arbeitest im Repo `familienbonus-rechner`. Lies zuerst `CLAUDE.md`, `README.md`,
`TODO.md` und `CHANGELOG.md`, dann `index.html`. Halte dich strikt an die Regeln in
`CLAUDE.md` (Single-file, kein Build, mobile-first, Rechenlogik nur mit belegten Werten).

## Was du bauen sollst (erster Block aus TODO)

1. **Jahres-Umschalter für die Tarifstufen.**
   - Dropdown/Segmented „Steuerjahr" mit 2024, 2025, 2026.
   - Tarifstufen je Jahr als separate Arrays, das 2025er NICHT überschreiben. Werte:
     - 2024: `[[12816,0],[20818,.20],[34513,.30],[66612,.40],[99266,.48],[1000000,.50],[Inf,.55]]`
     - 2025: `[[13308,0],[21617,.20],[35836,.30],[69166,.40],[103072,.48],[1000000,.50],[Inf,.55]]`
     - 2026: `[[13539,0],[21992,.20],[36458,.30],[70365,.40],[104859,.48],[1000000,.50],[Inf,.55]]`
   - `tarifsteuer()` bekommt das aktive Jahr; UI-Labels („Tarif 2025") mitziehen.
   - Bevor du 2026 als fix einbaust: kurz recherchieren/bestätigen, ob die Werte final sind
     (Budget-Effekte 2026). Wenn unsicher, 2026 als „Prognose" kennzeichnen.

2. **Kindermehrbetrag** als optionale Anzeige, wenn ein Elternteil-Ceiling nahe 0 ist:
   berechne den möglichen KMB (bis 700 €/Kind 2025, mit Einschleifung) und zeige ihn als
   separaten Betrag „zusätzlich über Negativsteuer" — nicht mit dem Familienbonus vermischen.

## Danach

- Kurzer Selbsttest mit den Sanity-Checks aus `CLAUDE.md`.
- **Alle Files updaten** (Konvention): `CHANGELOG.md` (neue Version), `TODO.md` (Erledigtes
  abhaken), `CLAUDE.md` (falls Logik/Tokens sich ändern), `README.md` (Tarif-Tabelle je Jahr).
- Am Ende Diff der geänderten Dateien zusammenfassen.

## Stil

Design-Tokens und IBM-Plex-Setup unverändert lassen. Neue Controls im bestehenden
`.seg`/`.field`-Muster, damit es konsistent bleibt. Deutsch in der UI.
