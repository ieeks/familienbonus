# Changelog

Alle nennenswerten Änderungen. Format lose nach Keep-a-Changelog.

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
