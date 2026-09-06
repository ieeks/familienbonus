# Familienbonus-Rechner

<img src="icon.svg" width="40" align="right" alt="">

Aufteilungsrechner für den **Familienbonus Plus** (Österreich). Zeigt, wie zwei
Elternteile den Bonus so aufteilen, dass möglichst wenig davon verpufft – inklusive
der ab **2027** geltenden Aufteilungspflicht (25:75 / 50:50).

**Live:** `https://ieeks.github.io/familienbonus/`

---

## Was der Rechner macht

- **Steuerjahr** wählbar: 2024, 2025 oder 2026 (eigene Tarifstufen je Jahr).
- Eingabe je Elternteil: **steuerpflichtiges Jahreseinkommen (Tarif)** → Tarifsteuer
  wird berechnet; alternativ **Tarifsteuer direkt** eingeben (am genauesten, wenn vom L16 bekannt).
  Gemeint ist das Einkommen **nach** Werbungskosten (mindestens 132 € Pauschale),
  Sonderausgaben und außergewöhnlichen Belastungen – KZ 245 vom L16 ist der Ausgangswert
  dafür, nicht schon das Ergebnis. Die beiden Eingabearten werden getrennt gehalten:
  beim Umschalten wird keine Zahl umgedeutet.
- Eingabehilfen: das Einkommen bekommt beim Tippen **Tausenderpunkte** (55000 → 55.000),
  das Geburtsdatum die **Punkte automatisch** (27072018 → 27.07.2018) – auf der
  iOS-Zifferntastatur gibt es keinen Punkt.
- Bis zu **12 Kinder**, wahlweise per **Geburtsdatum** (tippbar als TT.MM.JJJJ, monatsgenau: 166,68 € bis
  einschließlich des Monats des 18. Geburtstags, danach 58,34 € mit Familienbeihilfe)
  oder pauschal mit 2.000 € / 700 € pro Jahr.
- **Centgenau**: gerechnet wird intern in ganzen Cent, angezeigt wird, was herauskommt
  (12 × 166,68 = 2.000,16 €). Bei 50/50 bekommen beide Elternteile denselben Betrag.
- **Unvollständige Angaben sperren die Empfehlung**: fehlt ein Geburtsdatum oder ein
  Elternbetrag, steht das über dem Ergebnis, und die Karte heißt „vorläufig" statt
  „Empfohlen". Eine bewusst eingetragene 0 bleibt ein gültiger Fall.
- Zwei Modi: **freie Wahl** (bis 2026) und **Aufteilungspflicht ab 2027**, plus ein
  Häkchen für **erhöhte Familienbeihilfe** – damit behält der Haushalt auch ab 2027
  die freie Wahl.
- Ergebnis: nutzbarer Bonus je Elternteil, verpuffter Rest, empfohlene Aufteilung – und
  die **Zuteilung je Kind**, also das, was tatsächlich ins Formular kommt.
- **Teilbarer Link**: „Link zum Teilen kopieren" nimmt den kompletten Stand mit, damit ihn
  der andere Elternteil öffnen kann. Die Werte stehen hinter dem `#` – dieser Teil einer
  URL wird an keinen Server geschickt. Nach dem Öffnen wandert der Stand in den lokalen
  Speicher und der Hash verschwindet aus der Adresse – sonst würde ein alter Link beim
  nächsten Reload gegen die inzwischen geänderten Eingaben gewinnen.
  Im Link steht nur, was vom Default abweicht, der übliche Fall bleibt bei rund 80 Zeichen:
  `…/familienbonus/#a=55000&b=32000&cb=27072018&cb=11052022`. Ein Shortener-Dienst ist
  bewusst nicht eingebaut – der müsste die Daten speichern.
- **Eingaben bleiben erhalten** (im Browser, `localStorage`); ein Reload kostet nichts.
  „Zurücksetzen" löscht den gespeicherten Stand wieder.

## Rechenlogik (Kern)

Der Familienbonus Plus ist ein Absetzbetrag nach **§ 33 Abs. 2 EStG**. Er senkt die
**Tarifsteuer auf die laufenden Bezüge höchstens auf null** und ist mit genau dieser
Tarifsteuer gedeckelt. Er wirkt **nicht** gegen die fix (6 %) besteuerten Sonderzahlungen
(13./14.). Verkehrsabsetzbetrag & Co. erzeugen eine eigene Negativsteuer und limitieren
den Bonus nicht – daher hier bewusst ausgeklammert.

Pro Elternteil gilt als „Aufnahmefähigkeit": **Tarifsteuer(Einkommen)**. Verteilt wird so,
dass `min(zugeteilt_A, Steuer_A) + min(zugeteilt_B, Steuer_B)` maximal wird – über alle
Kinder **gemeinsam** optimiert, weil beide Deckel für alle Kinder zusammen gelten.
Gerechnet wird in ganzen Cent; der Anteil je Kind wird genau einmal gerundet, der Rest
geht an den anderen Elternteil. Die Aufstellung je Kind, die Spaltensummen und
„genutzt/verpufft" stammen damit aus derselben Rechnung.

**Tarifstufen je Jahr** (Obergrenze der Stufe, BMF; Werte in `BRACKETS_BY_YEAR`):

| Grenzsteuersatz | 2024      | 2025      | 2026      |
|-----------------|-----------|-----------|-----------|
| 0 %             | 12.816    | 13.308    | 13.539    |
| 20 %            | 20.818    | 21.617    | 21.992    |
| 30 %            | 34.513    | 35.836    | 36.458    |
| 40 %            | 66.612    | 69.166    | 70.365    |
| 48 %            | 99.266    | 103.072   | 104.859   |
| 50 %            | 1.000.000 | 1.000.000 | 1.000.000 |
| 55 %            | darüber   | darüber   | darüber   |

Die Stufen für **2027** sind noch nicht kundgemacht (Stand 20.08.2026); im Modus
„ab 2027" wird mit den Stufen des gewählten Jahres gerechnet und darauf hingewiesen.
Die Inflationsanpassungsverordnung für das Folgejahr kommt üblicherweise erst Ende
August – die für 2026 am 30.08.2025.

**Aufteilung:** freie Wahl → pro Kind 0 / 50 / 100 %. Ab 2027 → nur noch 25:75 oder 50:50,
sobald das Kind das 4. Lebensjahr vollendet hat und **kein** weiteres Kind unter 4 im
Haushalt lebt. Einem Kind unter 4 **gleichgestellt** ist ein Kind, für das erhöhte
Familienbeihilfe bezogen wird. Alleinerziehende behalten 100 %. Rechtsgrundlage:
Budgetbegleitgesetz 2027–2028, **BGBl. I Nr. 62/2026** (kundgemacht 29.07.2026;
Beschluss Nationalrat 08.07.2026, kein Einspruch des Bundesrates am 16.07.2026).

Weil die Ausnahme am Haushalt hängt („kein weiteres Kind unter 4"), ist sie
alles-oder-nichts: ein Kind unter 4 erhält allen Kindern des Haushalts die freie Wahl.
Das Tool bildet das als globalen Zustand ab, nicht je Kind.

Ob im **Übergangsjahr** die Pflicht schon ab dem Monat des 4. Geburtstags gilt oder erst
im Folgejahr, ist aus den Materialien nicht eindeutig; das Tool legt sich nicht fest und
weist im UI darauf hin.

Weil die Aufteilung gestuft ist, heißt „beide Ceilings zusammen ≥ Gesamtbonus" **nicht**,
dass nichts verpufft – maßgeblich ist immer die beste erreichbare Aufteilung.

## Wofür der Rechner gilt

Bewusst begrenzt – was er nicht kann, steht auch im Tool selbst neben dem Ergebnis:

- **Zwei ganzjährig anspruchsberechtigte Elternteile** für dieselben Kinder. Getrennt
  lebende Eltern mit Unterhaltsabsetzbetrag, Alleinerziehende und ein Wechsel der
  Berechtigung im Jahr sind nicht abgebildet; steht der Bonus nur einer Person zu, bleiben
  100 % möglich – auch ab 2027.
- **Durchgehende Familienbeihilfe** für alle Monate mit Anspruch. Einzelne Bezugsmonate
  (Ende der Ausbildung) erfasst der Rechner nicht und rechnet solche Fälle zu hoch.
- **Einkommen nach allen Abzügen**, siehe oben.
- **„Pflicht ab 2027" ist eine Simulation**: 2027 ist als Steuerjahr nicht wählbar, die
  Tarifstufen dafür sind nicht kundgemacht. Gerechnet wird mit Tarif, Kinderbeträgen und
  Alter des gewählten Jahres.

> Vereinfachte Modellrechnung, **keine Steuerberatung**. Kindermehrbetrag (Negativsteuer,
> 700 €/Kind seit 2024, Valorisierung bis inkl. 2028 ausgesetzt) für Geringverdiener
> separat prüfen – er ist hier bewusst nicht modelliert, weil er kein Absetzbetrag gegen
> die Tarifsteuer ist, sondern genau dann greift, wenn keine da ist.

## Tech

Single-file HTML, keine Dependencies, kein Build. IBM Plex (Sans/Serif/Mono) via
Google Fonts (dabei sieht Google die IP-Adresse – Eingaben verlassen den Browser nicht).
Läuft direkt auf GitHub Pages.

## Tests

```
node tests/run.mjs
```

145 Regressionstests, ohne Framework und ohne Build: Tarifgrenzen, Beträge mit Cent,
Geburtsmonate, Rundung je Kind, Optimalität gegen eine unabhängige Suche,
Vollständigkeitssperre, Link-Fixpunkt und Fremdeingabe, Hash-/Speicher-Reihenfolge,
Moduswechsel. `tests/dom.mjs` lädt `index.html` dafür in eine nachgebaute DOM-Umgebung;
ausgeliefert wird weiterhin nur die eine Datei. Läuft auch in GitHub Actions.

## Deployment

**A – eigenes Repo (aktuell):** `index.html` im Root von `ieeks/familienbonus`, Pages auf
Branch `main` → erreichbar unter `ieeks.github.io/familienbonus/`.

**B – Unterordner in `ieeks.github.io`:** Ordner `familienbonus/` ins Pages-Repo
legen → gleiche URL, ein Repo weniger.

## Dateien

```
index.html        Rechner (alles inkl.)
icon.svg          Line-Icon (currentColor)
tests/run.mjs     Regressionstests (node tests/run.mjs)
tests/dom.mjs     minimale DOM-Nachbildung für die Tests
.github/          Workflow, der die Tests bei jedem Push ausführt
README.md         dieses File
CHANGELOG.md      Versionshistorie
TODO.md           offene Ideen
CLAUDE.md         Kontext für Claude Code
prompt.md         Kickoff-Prompt:  claude < prompt.md
```

## Lizenz

MIT
