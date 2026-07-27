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
- Beliebig viele Kinder, je 2.000 € (bis 18) oder 700 € (über 18 mit Beihilfe).
- Zwei Modi: **freie Wahl** (bis 2026) und **Aufteilungspflicht ab 2027**.
- Ergebnis: nutzbarer Bonus je Elternteil, verpuffter Rest, empfohlene Aufteilung – und
  die **Zuteilung je Kind**, also das, was tatsächlich ins Formular kommt.

## Rechenlogik (Kern)

Der Familienbonus Plus ist ein Absetzbetrag nach **§ 33 Abs. 2 EStG**. Er senkt die
**Tarifsteuer auf die laufenden Bezüge höchstens auf null** und ist mit genau dieser
Tarifsteuer gedeckelt. Er wirkt **nicht** gegen die fix (6 %) besteuerten Sonderzahlungen
(13./14.). Verkehrsabsetzbetrag & Co. erzeugen eine eigene Negativsteuer und limitieren
den Bonus nicht – daher hier bewusst ausgeklammert.

Pro Elternteil gilt als „Aufnahmefähigkeit": **Tarifsteuer(Einkommen)**. Verteilt wird so,
dass `min(zugeteilt_A, Steuer_A) + min(zugeteilt_B, Steuer_B)` maximal wird.

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

Die Stufen für **2027** sind noch nicht kundgemacht; im Modus „ab 2027" wird mit den
Stufen des gewählten Jahres gerechnet und darauf hingewiesen.

**Aufteilung:** freie Wahl → pro Kind 0 / 50 / 100 %. Ab 2027 → nur noch 25:75 oder 50:50,
sobald das Kind das 4. Lebensjahr vollendet hat und **kein** weiteres Kind unter 4 im
Haushalt lebt. Alleinerziehende behalten 100 %. Rechtsgrundlage: Budgetbegleitgesetz
2027–2028 (Beschluss Nationalrat 08.07.2026).

Weil die Aufteilung gestuft ist, heißt „beide Ceilings zusammen ≥ Gesamtbonus" **nicht**,
dass nichts verpufft – maßgeblich ist immer die beste erreichbare Aufteilung.

> Vereinfachte Modellrechnung, **keine Steuerberatung**. Kindermehrbetrag (Negativsteuer,
> bis 700 €/Kind) für Geringverdiener separat prüfen.

## Tech

Single-file HTML, keine Dependencies, kein Build. IBM Plex (Sans/Serif/Mono) via
Google Fonts. Läuft direkt auf GitHub Pages.

## Deployment

**A – eigenes Repo (aktuell):** `index.html` im Root von `ieeks/familienbonus`, Pages auf
Branch `main` → erreichbar unter `ieeks.github.io/familienbonus/`.

**B – Unterordner in `ieeks.github.io`:** Ordner `familienbonus/` ins Pages-Repo
legen → gleiche URL, ein Repo weniger.

## Dateien

```
index.html        Rechner (alles inkl.)
icon.svg          Line-Icon (currentColor)
README.md         dieses File
CHANGELOG.md      Versionshistorie
TODO.md           offene Ideen
CLAUDE.md         Kontext für Claude Code
prompt.md         Kickoff-Prompt:  claude < prompt.md
```

## Lizenz

MIT
