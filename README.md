# Familienbonus-Rechner

<img src="icon.svg" width="40" align="right" alt="">

Aufteilungsrechner für den **Familienbonus Plus** (Österreich). Zeigt, wie zwei
Elternteile den Bonus so aufteilen, dass möglichst wenig davon verpufft – inklusive
der ab **2027** geltenden Aufteilungspflicht (25:75 / 50:50).

**Live:** `https://ieeks.github.io/familienbonus-rechner/`

---

## Was der Rechner macht

- Eingabe je Elternteil: **steuerpflichtiges Jahreseinkommen (Tarif)** → Tarifsteuer 2025
  wird berechnet; alternativ **Tarifsteuer direkt** eingeben (am genauesten, wenn vom L16 bekannt).
- Beliebig viele Kinder, je 2.000 € (bis 18) oder 700 € (über 18 mit Beihilfe).
- Zwei Modi: **freie Wahl** (2025/2026) und **Aufteilungspflicht ab 2027**.
- Ergebnis: nutzbarer Bonus je Elternteil, verpuffter Rest, empfohlene Aufteilung.

## Rechenlogik (Kern)

Der Familienbonus Plus ist ein Absetzbetrag nach **§ 33 Abs. 2 EStG**. Er senkt die
**Tarifsteuer auf die laufenden Bezüge höchstens auf null** und ist mit genau dieser
Tarifsteuer gedeckelt. Er wirkt **nicht** gegen die fix (6 %) besteuerten Sonderzahlungen
(13./14.). Verkehrsabsetzbetrag & Co. erzeugen eine eigene Negativsteuer und limitieren
den Bonus nicht – daher hier bewusst ausgeklammert.

Pro Elternteil gilt als „Aufnahmefähigkeit": **Tarifsteuer(Einkommen)**. Verteilt wird so,
dass `min(zugeteilt_A, Steuer_A) + min(zugeteilt_B, Steuer_B)` maximal wird.

**Tarifstufen 2025 (BMF):**

| Einkommen (€)          | Grenzsteuersatz |
|------------------------|-----------------|
| bis 13.308             | 0 %             |
| 13.308 – 21.617        | 20 %            |
| 21.617 – 35.836        | 30 %            |
| 35.836 – 69.166        | 40 %            |
| 69.166 – 103.072       | 48 %            |
| 103.072 – 1.000.000    | 50 %            |
| über 1.000.000         | 55 %            |

**Aufteilung:** freie Wahl → pro Kind 0 / 50 / 100 %. Ab 2027 (wenn alle Kinder im
Haushalt ≥ 4) → nur noch 25:75 oder 50:50.

> Vereinfachte Modellrechnung, **keine Steuerberatung**. Kindermehrbetrag (Negativsteuer,
> bis 700 €/Kind) für Geringverdiener separat prüfen.

## Tech

Single-file HTML, keine Dependencies, kein Build. IBM Plex (Sans/Serif/Mono) via
Google Fonts. Läuft direkt auf GitHub Pages.

## Deployment

**A – eigenes Repo:** `index.html` im Root, Pages auf Branch `main` → erreichbar unter
`ieeks.github.io/familienbonus-rechner/`.

**B – Unterordner in `ieeks.github.io`:** Ordner `familienbonus-rechner/` ins Pages-Repo
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
