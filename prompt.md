# Aufgabe: Familienbonus-Rechner weiterentwickeln

Du arbeitest im Repo `familienbonus`. Lies zuerst `CLAUDE.md`, `README.md`,
`TODO.md` und `CHANGELOG.md`, dann `index.html`. Halte dich strikt an die Regeln in
`CLAUDE.md` (Single-file, kein Build, mobile-first, Rechenlogik nur mit belegten Werten).

## Was du bauen sollst (nächster Block aus TODO)

Der **Jahres-Umschalter** (2024/2025/2026) ist seit 1.1.0 erledigt – `BRACKETS_BY_YEAR`
in `index.html`, Werte belegt. Nicht noch einmal bauen.

1. **Kindermehrbetrag** als optionale Anzeige, wenn ein Elternteil-Ceiling nahe 0 ist:
   berechne den möglichen KMB (bis 700 €/Kind 2025, mit Einschleifung) und zeige ihn als
   separaten Betrag „zusätzlich über Negativsteuer" — nicht mit dem Familienbonus vermischen.

## Danach

- Kurzer Selbsttest mit den Sanity-Checks aus `CLAUDE.md`.
- **Alle Files updaten** (Konvention): `CHANGELOG.md` (neue Version), `TODO.md` (Erledigtes
  abhaken), `CLAUDE.md` (falls Logik/Tokens sich ändern), `README.md` (Tarif-Tabelle je Jahr).
- Der Abschnitt „Fallen, die schon einmal zugeschlagen haben" in `CLAUDE.md` ist Pflichtlektüre,
  bevor du an `compute()`, `bestSplit()` oder den Ausgabe-Templates etwas änderst.
- Am Ende Diff der geänderten Dateien zusammenfassen.

## Stil

Design-Tokens und IBM-Plex-Setup unverändert lassen. Neue Controls im bestehenden
`.seg`/`.field`-Muster, damit es konsistent bleibt. Deutsch in der UI.
