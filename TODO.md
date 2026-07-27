# TODO

## Als Nächstes
- [x] **Jahres-Umschalter** für Tarifstufen (2024 / 2025 / 2026) statt fix 2025.
- [ ] **Kindermehrbetrag** modellieren (Negativsteuer bis 700 €/Kind) statt nur Hinweis.
      Valorisierung ist bis inkl. 2028 ausgesetzt, der Betrag bleibt also stabil.
- [ ] **Brutto → Tarif-Einkommen**-Helfer (SV-Abzug, 6-tel-Regelung Sonderzahlungen)
      als optionaler Aufklapp-Bereich.
- [ ] **2027-Altersautomatik**: Geburtsdaten je Kind → prüfen, ob „alle Kinder ≥ 4"
      im gewählten Jahr erfüllt ist (Monatsbetrachtung), Modus automatisch setzen.
      Achtung: Die Ausnahme ist haushaltsbezogen – ein Kind unter 4 im Haushalt erhält
      allen Kindern die freie Wahl.
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
- [ ] Number-Inputs ohne `min="0"`/`step`; Mausrad verstellt Werte unbemerkt.
- [ ] Doppeltes `<link rel="icon">` – die Data-URI gewinnt, `icon.svg` wird nie geladen.
- [ ] `meta description` / Open-Graph fehlen.

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
