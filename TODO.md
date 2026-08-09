# TODO

## Als Nächstes
- [x] **Jahres-Umschalter** für Tarifstufen (2024 / 2025 / 2026) statt fix 2025.
- [ ] **Kindermehrbetrag** modellieren (Negativsteuer bis 700 €/Kind) statt nur Hinweis.
      Valorisierung ist bis inkl. 2028 ausgesetzt, der Betrag bleibt also stabil.
- [ ] **Brutto → Tarif-Einkommen**-Helfer (SV-Abzug, 6-tel-Regelung Sonderzahlungen)
      als optionaler Aufklapp-Bereich.
- [x] **2027-Altersautomatik**: Geburtsdaten je Kind, Modus „Automatisch", Hinweis ab
      welchem Jahr die Pflicht greift.
- [ ] **Übergangsjahr klären**: greift die Pflicht ab dem Monat des 4. Geburtstags oder
      erst im Folgejahr? Aus den Materialien nicht eindeutig, im Tool offen gelassen.
      Klärt sich mit dem Gesetzestext (§ 33 Abs. 3a EStG i. d. F. BBG 2027–2028).
- [ ] **Erhöhte Familienbeihilfe**: erhält ebenfalls die freie Wahl ab 2027, fehlt noch.
- [ ] **Tarifstufen 2027** ergänzen, sobald kundgemacht. Bis dahin weist der Modus
      „ab 2027" darauf hin, dass mit dem gewählten Jahr gerechnet wird.

## Aus dem Code-Review offen
- [ ] **`bestSplit()` ist 3^n Brute Force** – 14 Kinder ≈ 0,8 s, und das bei jedem
      Tastendruck. Geschlossene Lösung: die Verschwendung ist
      `max(0, aSum−cA) + max(0, total−aSum−cB)` und wird für jedes `aSum` im Intervall
      `[total−cB, cA]` minimal → erreichbare Summe suchen, die dem Intervall am nächsten
      liegt (DP über erreichbare Summen statt Enumeration).
- [x] **Zahlenformat**: „13.593 €" statt „13 593 €" (`Intl.NumberFormat("de-DE")`).
- [x] **`<label for>`** für alle Felder, inkl. indexbasierter IDs in den Kind-Zeilen.
- [x] **Accessibility, Rest**: Sektionstitel als `<h2>`, Sections über `aria-labelledby`
      benannt, Live-Region für das Ergebnis (entprellt).
- [ ] **Google Fonts selbst hosten** – DSGVO, IP-Übertragung an Google bei einem Tool
      für österreichische Eltern. Single-file bleibt möglich (Font-Dateien danebenlegen).
- [ ] **Alleinerzieher-/Alleinverdienerfall**: behalten ab 2027 100 %, wird derzeit nicht
      modelliert (nur als Hinweis erwähnt).
- [x] Number-Inputs ohne `min="0"`/`step`; Mausrad verstellt Werte unbemerkt.
      Erledigt mit den Eingabemasken: die Einkommensfelder sind jetzt Textfelder mit
      `inputmode="numeric"`, negative Werte und Mausrad-Änderungen gibt es damit nicht mehr.
- [ ] Doppeltes `<link rel="icon">` – die Data-URI gewinnt, `icon.svg` wird nie geladen.
- [ ] `meta description` / Open-Graph fehlen.

## Eingabe / Masken
- [x] **Tausenderpunkte im Einkommensfeld** und **automatische Punkte im Geburtsdatum**
      (beides live beim Tippen, Cursor bleibt stehen).
- [ ] **Nachkommastellen bei „Tarifsteuer direkt"**: Die Maske lässt nur Ziffern durch,
      Cent gehen also verloren. Für die Anzeige irrelevant (`eur()` rundet ohnehin auf
      volle Euro), für die Optimierung ebenfalls – falls es doch einmal stört, müsste
      `maskAmount()` ein einzelnes Dezimalkomma zulassen.
- [ ] **ISO-Datum tippen** geht nicht mehr (nur noch einfügen) – die Maske faltet jede
      Ziffernfolge nach TT.MM.JJJJ. Bewusst so; falls es jemand vermisst, bräuchte es
      eine Erkennung „vier Ziffern zuerst = Jahr".

## Später
- [ ] Zustand in URL kodieren (teilbarer Link, kein localStorage nötig).
      **Vorher** sicherstellen, dass alle Ausgaben durch `esc()` laufen – sonst wird aus
      dem behobenen Self-XSS eine per Link verschickbare.
- [ ] Ergebnis als PDF/Print-Ansicht (an L16/Veranlagung angelehnt).
- [ ] Dark-Mode (Tokens sind schon zentral in `:root`).
- [ ] Kurzcheck Alleinverdiener-/Alleinerzieherabsetzbetrag einblenden.

## Homepage / Konsistenz
- [ ] Tool auf `ieeks.github.io`-Startseite verlinken, mit neuem `icon.svg`
      (Teil des konsistenten SVG-Icon-Sets).
