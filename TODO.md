# TODO

## Als Nächstes
- [x] **Jahres-Umschalter** für Tarifstufen (2024 / 2025 / 2026) statt fix 2025.
- [ ] **Kindermehrbetrag** modellieren (Negativsteuer bis 700 €/Kind) statt nur Hinweis.
      Valorisierung ist bis inkl. 2028 ausgesetzt, der Betrag bleibt also stabil.
- [ ] **Brutto → Tarif-Einkommen**-Helfer (SV-Abzug, 6-tel-Regelung Sonderzahlungen)
      als optionaler Aufklapp-Bereich. Deckt sich mit dem **L16-Helfer** aus dem Review:
      KZ 245 ist der Ausgangswert, abzuziehen sind Werbungskosten (mind. 132 €),
      Sonderausgaben und außergewöhnliche Belastungen. Im Text steht das jetzt, gerechnet
      wird es nicht.
- [x] **2027-Altersautomatik**: Geburtsdaten je Kind, Modus „Automatisch", Hinweis ab
      welchem Jahr die Pflicht greift.
- [ ] **Übergangsjahr klären**: greift die Pflicht ab dem Monat des 4. Geburtstags oder
      erst im Folgejahr? Aus den Materialien nicht eindeutig, im Tool offen gelassen.
      Das Gesetz ist inzwischen kundgemacht (BGBl. I Nr. 62/2026) – der Volltext von
      § 33 Abs. 3a EStG i. d. F. BBG 2027–2028 war aus den Sessions vom 20.08. und
      06.09.2026 nicht abrufbar (RIS/BMF vom Egress-Proxy geblockt), also im nächsten
      Durchgang direkt im RIS nachlesen und die Frage endlich abhaken.
- [x] **Erhöhte Familienbeihilfe**: erhält ebenfalls die freie Wahl ab 2027. Erledigt als
      haushaltsbezogenes Häkchen (`erhFB`, `ef=1` im Link) – dasselbe Alles-oder-nichts
      wie die Altersbedingung, weil die Ausnahme am Haushalt hängt.
- [ ] **Tarifstufen 2027** ergänzen, sobald kundgemacht. Stand 06.09.2026 offen; die
      Inflationsanpassungsverordnung fürs Folgejahr kommt üblicherweise Ende August
      (die für 2026 am 30.08.2025), ist also überfällig – nachsehen. Bis dahin weist der
      Modus „ab 2027" ausdrücklich als Simulation aus, dass mit dem gewählten Jahr
      gerechnet wird.
      **Wenn 2027 in `BRACKETS_BY_YEAR` und in die Leiste kommt:** `effSplit()` liefert
      dann erstmals „restricted" aus `auto` – vorher die Übergangsjahr-Frage klären,
      sonst entscheidet der Rechner still, was das Gesetz offenlässt.

## Aus dem zweiten Review (06.09.2026) – als Erweiterung ausgenommen
Die elf Findings sind behoben (siehe CHANGELOG 1.5.0). Ausdrücklich **nicht** Teil des
Auftrags waren die folgenden vier Punkte; der Rechner grenzt sie stattdessen sichtbar aus.
Wer sie angeht, muss den Geltungsbereich-Block im Ergebnis mitziehen.
- [ ] **Anspruchsmonate je Kind** (F02). Familienbeihilfe wird derzeit als durchgehend
      unterstellt; ein volljähriges Kind mit Bezug nur Jänner–Juni bekommt zwölf statt
      sechs Monate (≈ 700 statt 350,04 €). Braucht Bezugsmonate und Unterbrechungen je
      Kind – also eine echte Erfassung, keine Textänderung.
- [ ] **Getrennte Eltern, Unterhaltsabsetzbetrag, Alleinberechtigte** (F03). Der Rechner
      ist auf zwei ganzjährig berechtigte Elternteile ausgelegt. Bei nur einer
      berechtigten Person bleiben 100 % möglich; „Einkommen null" ist dafür kein Nachweis,
      deshalb wird der Fall nicht geraten, sondern ausgenommen.
- [ ] **L16-Helfer** (F05) – siehe oben beim Brutto-Helfer.
- [ ] **Vollständige 2027-Veranlagung** (F09): eigener Tarif, Kinderbeträge und geprüfte
      Monatsregeln für das Übergangsjahr. Erst nach den beiden offenen Punkten oben.

## Aus dem ersten Code-Review offen
- [~] **`bestSplit()` ist 3^n Brute Force** – gemessen: 12 Kinder ≈ 0,1 s, 14 ≈ 1,0 s,
      15 ≈ 3,3 s. Vorerst entschärft durch `MAX_CHILDREN` = 12 (Eingabe **und** Link);
      seit 1.5.0 kostet außerdem nicht mehr jeder Tastendruck eine neue Suche (ein Eintrag
      Gedächtnis, Namensänderungen laufen daran vorbei). Für mehr Kinder braucht es
      trotzdem die geschlossene Lösung: die Verschwendung ist
      `max(0, aSum−cA) + max(0, total−aSum−cB)` und wird für jedes `aSum` im Intervall
      `[total−cB, cA]` minimal → erreichbare Summe suchen, die dem Intervall am nächsten
      liegt (DP über erreichbare Summen statt Enumeration). Erst dann darf die Obergrenze
      wieder steigen.
- [x] **Zahlenformat**: „13.593 €" statt „13 593 €" (`Intl.NumberFormat("de-DE")`).
- [x] **`<label for>`** für alle Felder, inkl. indexbasierter IDs in den Kind-Zeilen.
- [x] **Accessibility, Rest**: Sektionstitel als `<h2>`, Sections über `aria-labelledby`
      benannt, Live-Region für das Ergebnis (entprellt).
- [ ] **Google Fonts selbst hosten** – DSGVO, IP-Übertragung an Google bei einem Tool
      für österreichische Eltern. Single-file bleibt möglich (Font-Dateien danebenlegen).
      Bis dahin steht der Umstand wenigstens im Datenschutzhinweis.
- [x] **Alleinerzieher-/Alleinverdienerfall** wird erkannt statt geraten: der Rechner
      nennt ihn im Geltungsbereich und weist im Pflichtmodus darauf hin, dass 100 %
      möglich bleiben. Modelliert wird er weiterhin nicht (siehe F03 oben).
- [x] Number-Inputs ohne `min="0"`/`step`; Mausrad verstellt Werte unbemerkt.
- [x] Doppeltes `<link rel="icon">`; `meta description` / Open-Graph fehlten.

## Eingabe / Masken
- [x] **Tausenderpunkte im Einkommensfeld** und **automatische Punkte im Geburtsdatum**
      (beides live beim Tippen, Cursor bleibt stehen).
- [x] **Backspace auf einem Trennzeichen** nimmt in beiden Masken die Ziffer davor mit.
- [x] **Nachkommastellen** – erledigt mit 1.5.0: die Maske lässt genau ein Komma und zwei
      Stellen zu, gerechnet wird ohnehin in Cent.
- [x] **Eingefügte Datumswerte** („1.1.2020") werden vor dem Maskieren geparst.
- [ ] **Einfügen mitten im Datum verliert die letzte Ziffer.** Die Maske faltet die
      Ziffernfolge positionell: wer in „27.07.2018" vorne eine Ziffer einfügt, bekommt
      „23.70.7201" – die 8 fällt hinten raus. Bei einer Positionsmaske systembedingt;
      falls es stört, bräuchte es Einfügen als Überschreiben statt als Verschieben.
- [ ] **ISO-Datum tippen** geht nicht mehr (nur noch einfügen) – die Maske faltet jede
      Ziffernfolge nach TT.MM.JJJJ. Bewusst so; falls es jemand vermisst, bräuchte es
      eine Erkennung „vier Ziffern zuerst = Jahr".

## Teilen / Zustand
- [x] **Zustand in der URL kodieren** (teilbarer Link) – im **Hash**, nicht im
      Query-String: der Hash geht an keinen Server und steht in keinem Referer.
- [x] **`localStorage`-Autosave** plus „Zurücksetzen" mit Rückfrage.
- [x] **Link kürzen** ohne Fremddienst: es steht nur im Link, was vom Default abweicht.
- [x] **Der Hash gewinnt nicht mehr gegen neuere Eingaben** (1.5.0): beim Import wird der
      Stand sofort gesichert, danach verschwindet der Hash aus der Adresse.
- [ ] **QR-Code neben dem Teilen-Button** – für „von Handy zu Handy" der bessere
      Shortener als jeder Dienst, offline erzeugbar. Kostet einen QR-Encoder
      (Reed-Solomon, ~200 Zeilen) im File; erst machen, wenn es jemand vermisst.
- [ ] **Externer Shortener bleibt draußen.** Ausdrücklich nicht gewollt: ein Dienst
      müsste Einkommen, Namen und Geburtsdaten speichern und sähe jeden Aufruf – genau
      das, was die Hash-Kodierung vermeidet.
- [ ] **Versionsschlüssel beachten.** `STORE_KEY` endet auf `.v1`. Das Betragsformat im
      Link ist mit 1.5.0 gewachsen (Cent als `a=1234.56`), bleibt aber abwärtskompatibel:
      alte Stände ohne Cent lesen sich unverändert. Wird das Format inkompatibel, neuen
      Schlüssel vergeben statt still fehlzuinterpretieren.

## Qualitätssicherung
- [x] **Regressionstests** (`node tests/run.mjs`), ohne Framework und ohne Build, plus
      GitHub-Actions-Workflow. Neue Rechen- oder Zustandsfehler gehören dort als Fall
      hinein, bevor sie behoben werden.
- [x] **Nachreview zu PR #8 (N01–N03)** abgearbeitet: Backspace-Regression im Betragsfeld,
      stille Annahme ungültiger Formate, Mehrkind-Abdeckung der Optimierungstests.
      Die Zufallsfälle würfeln die Kinderzahl nicht mehr aus, sie laufen sie durch –
      vorher hatten 796 von 800 Fällen genau ein Kind.
- [ ] **Browser-Test automatisieren.** Die Tests laufen gegen eine nachgebaute
      DOM-Umgebung; Layout, iOS-Tastatur und Clipboard bleiben Handarbeit (Checkliste in
      CLAUDE.md).

## Später
- [ ] Ergebnis als PDF/Print-Ansicht (an L16/Veranlagung angelehnt).
- [ ] Dark-Mode (Tokens sind schon zentral in `:root`).

## Homepage / Konsistenz
- [ ] Tool auf `ieeks.github.io`-Startseite verlinken, mit neuem `icon.svg`
      (Teil des konsistenten SVG-Icon-Sets).
