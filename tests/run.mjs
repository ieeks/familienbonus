// Regressionstests für den Familienbonus-Rechner.  node tests/run.mjs
//
// Kein Framework, kein Build – der Rechner bleibt eine einzige Datei, die Tests laden
// sie über tests/dom.mjs in einer nachgebauten DOM-Umgebung. Abgedeckt ist, was schon
// einmal danebengegangen ist: Beträge mit Cent, Rundung je Kind, Vollständigkeit,
// Link-Roundtrip, Modus- und Hash-Verhalten, Tarifgrenzen, Geburtsmonate.

import {loadApp} from "./dom.mjs";

let failed = 0, passed = 0;
const ok = (name, cond, detail) => {
  if(cond){ passed++; return; }
  failed++;
  console.log("  FAIL  " + name + (detail == null ? "" : "\n        " + detail));
};
const eq = (name, got, want) => ok(name, Object.is(got, want), `erwartet ${JSON.stringify(want)}, bekommen ${JSON.stringify(got)}`);
const near = (name, got, want, tol=0.005) => ok(name, Math.abs(got-want) <= tol, `erwartet ${want}, bekommen ${got}`);
const group = n => console.log("\n" + n);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------- Tarif
group("Tarifstufen und Grenzen");
{
  const app = loadApp();
  const {tarifsteuer, BRACKETS_BY_YEAR} = app.api;

  eq("Tarifsteuer 0 € = 0", tarifsteuer(0, 2025), 0);
  eq("Negatives Einkommen = 0", tarifsteuer(-5000, 2025), 0);
  near("55.000 € / 2024", tarifsteuer(55000, 2024), 13903.70);
  near("55.000 € / 2025", tarifsteuer(55000, 2025), 13593.10);
  near("55.000 € / 2026", tarifsteuer(55000, 2026), 13447.20);

  // Je Grenze unmittelbar darunter, darauf und darüber: der Grenzsteuersatz muss vor
  // der Grenze der alte und dahinter der neue sein. Das prüft die Tabelle, ohne die
  // Tabelle noch einmal abzuschreiben.
  for(const [year, brackets] of Object.entries(BRACKETS_BY_YEAR)){
    brackets.forEach(([limit, rate], i) => {
      if(!isFinite(limit)) return;
      const next = brackets[i+1][1];
      near(`${year}: Satz unter ${limit}`, tarifsteuer(limit, +year) - tarifsteuer(limit-1, +year), rate);
      near(`${year}: Satz über ${limit}`,  tarifsteuer(limit+1, +year) - tarifsteuer(limit, +year), next);
      ok(`${year}: monoton bei ${limit}`, tarifsteuer(limit+1, +year) > tarifsteuer(limit-1, +year));
    });
  }
}

// ---------------------------------------------------------------- F01 Beträge
group("F01 – Beträge mit Cent, Punkt und Vorzeichen");
{
  const {api, newEl} = loadApp();
  const {amountVal, amountBad, amountUnreadable, parseAmountText, maskAmount,
         amountToLink, amountFromLink} = api;

  // splitAmount()/amountVal() lesen den eigenen Feldinhalt: der Punkt ist dort immer
  // Tausenderpunkt. Der Dezimalpunkt gehört ausschließlich in parseAmountText().
  eq("1.234,56 → 1234.56", amountVal("1.234,56"), 1234.56);
  eq("55.000,00 → 55000", amountVal("55.000,00"), 55000);
  eq("55.000 → 55000", amountVal("55.000"), 55000);
  eq("-500 bleibt negativ", amountVal("-500"), -500);
  eq("-500 ist ungültig", amountBad("-500"), true);
  eq("leeres Feld ist nicht ungültig", amountBad(""), false);
  eq("dritte Nachkommastelle fällt weg", amountVal("1,239"), 1.23);

  // Eingefügter Text: vollständiges Format oder gar nichts.
  eq("eingefügt: 1234.56", parseAmountText("1234.56"), "1.234,56");
  eq("eingefügt: 1234.56 €", parseAmountText("1234.56 €"), "1.234,56");
  eq("eingefügt: 12.34", parseAmountText("12.34"), "12,34");
  eq("eingefügt: 1.234,56", parseAmountText("1.234,56"), "1.234,56");
  eq("eingefügt: 12.345 bleibt Gruppierung", parseAmountText("12.345"), "12.345");
  eq("eingefügt: Leerzeichen als Gruppierung", parseAmountText("1 234,50"), "1.234,50");
  eq("eingefügt: EUR-Präfix", parseAmountText("EUR 900"), "900");
  eq("eingefügt: 12abc34 wird abgelehnt", parseAmountText("12abc34"), null);
  eq("eingefügt: 1,234 ist mehrdeutig", parseAmountText("1,234"), null);
  eq("eingefügt: 1.2.3 wird abgelehnt", parseAmountText("1.2.3"), null);

  const type = (text, opts={}) => {
    const e = newEl();
    let prev = "";
    for(const ch of text){
      e.value += ch;
      e.selectionStart = e.value.length;
      maskAmount(e, prev, "insertText");
      prev = e.value;
    }
    return e.value;
  };
  eq("tippen: 55000 → 55.000", type("55000"), "55.000");
  eq("tippen: 1234,56 → 1.234,56", type("1234,56"), "1.234,56");
  eq("Link: 1.234,56 → 1234.56", amountToLink("1.234,56"), "1234.56");
  eq("Link zurück: 1234.56 → 1.234,56", amountFromLink("1234.56"), "1.234,56");
  eq("Link: 55.000 → 55000", amountToLink("55.000"), "55000");
  eq("Link mit Buchstaben ergibt kein Betrag", amountFromLink("abc12"), "");

  // Backspace auf dem Tausenderpunkt nimmt die Ziffer davor mit (ein Tastendruck).
  const e = newEl("55.000");
  e.value = "55000";            // der Browser hat den Punkt entfernt
  e.selectionStart = 2;
  maskAmount(e, "55.000", "deleteContentBackward");
  eq("Backspace auf Trennzeichen", e.value, "5.000");
}

// ------------------------------------------------------- N01/N02 (Nachreview PR #8)
group("N01 – Löschen verändert den Betrag nur um die gelöschte Ziffer");
{
  const {api, newEl} = loadApp();
  const {maskAmount, amountVal} = api;

  // Der Regressionsfall: "55.000" minus letzte Ziffer steht kurz als "55.00" im Feld.
  // Wer den Punkt dort als Dezimalpunkt liest, macht aus 55.000 € plötzlich 55 €.
  const backspaceAtEnd = before => {
    const e = newEl();
    e.value = before.slice(0, -1);
    e.selectionStart = e.value.length;
    maskAmount(e, before, "deleteContentBackward");
    return e.value;
  };
  eq("55.000 → 5.500", backspaceAtEnd("55.000"), "5.500");
  eq("1.234 → 123",    backspaceAtEnd("1.234"),  "123");
  eq("12.345 → 1.234", backspaceAtEnd("12.345"), "1.234");
  eq("Wert nach Backspace", amountVal(backspaceAtEnd("55.000")), 5500);

  // Entf auf dem Trennzeichen nimmt die Ziffer dahinter mit – spiegelbildlich.
  const del = (before, caret, after) => {
    const e = newEl();
    e.value = after; e.selectionStart = caret;
    maskAmount(e, before, "deleteContentForward");
    return e.value;
  };
  eq("Entf auf dem Tausenderpunkt", del("55.000", 2, "55000"), "5.500");

  // Markierte Ziffern löschen (kein einzelnes Zeichen, kein Trennzeichen-Sonderfall).
  const e = newEl();
  e.value = "5000"; e.selectionStart = 1;      // aus "55.000" wurde "5.0" entfernt
  maskAmount(e, "55.000", "deleteContentBackward");
  eq("markierte Ziffern löschen", e.value, "5.000");

  // Mit vorhandenem Dezimalkomma: Backspace am Ende nimmt nur die Cent-Stelle.
  const c = newEl();
  c.value = "1.234,5"; c.selectionStart = 7;
  maskAmount(c, "1.234,56", "deleteContentBackward");
  eq("1.234,56 → 1.234,5", c.value, "1.234,5");
  eq("Komma überlebt das Löschen", amountVal(c.value), 1234.5);

  // Backspace auf dem Komma: die Nachkommastellen rücken in den Euro-Teil.
  const k = newEl();
  k.value = "1.23456"; k.selectionStart = 5;
  maskAmount(k, "1.234,56", "deleteContentBackward");
  eq("Backspace auf dem Komma", k.value, "123.456");
}

group("N02 – ungültige Formate werden nicht zu gültigen Beträgen");
{
  const {api, newEl} = loadApp();
  const {maskAmount, amountVal, amountBad, amountUnreadable} = api;
  const paste = text => {
    const e = newEl();
    e.value = text; e.selectionStart = text.length;
    maskAmount(e, "", "insertFromPaste");
    return e.value;
  };

  eq("typografisches Minus wird normalisiert", paste("\u2212500"), "-500");
  eq("und dann als negativ abgelehnt", amountBad(paste("\u2212500")), true);
  eq("negativer Wert bleibt negativ", amountVal(paste("\u2212500")), -500);

  eq("Mischtext bleibt stehen", paste("12abc34"), "12abc34");
  eq("Mischtext ist unverwertbar", amountUnreadable("12abc34"), true);

  eq("Dezimalpunkt mit Währung", paste("1234.56 €"), "1.234,56");
  eq("Wert dazu", amountVal(paste("1234.56 €")), 1234.56);

  // Weitertippen glättet Unlesbares nicht nachträglich zu einer Zahl.
  const e = newEl();
  e.value = "12abc345"; e.selectionStart = 8;
  maskAmount(e, "12abc34", "insertText");
  eq("Weitertippen laundert nicht", e.value, "12abc345");
  eq("und bleibt unverwertbar", amountUnreadable(e.value), true);

  // Kein fehlerhafter Wert darf einen Deckel oder eine Empfehlung ergeben.
  const t = loadApp();
  t.el("valA").value = "12abc34";
  t.el("valB").value = "32.000";
  t.api.set({childMode:"amount", children:[{label:"Kind 1", birth:"", beihilfe:true, amount:2000}]});
  t.api.compute();
  eq("unverwertbar ergibt keinen Deckel", t.api.ceilingCents("12abc34"), 0);
  ok("und wird gemeldet", /nicht lesbar/.test(t.el("issues").innerHTML), t.el("issues").innerHTML);
  ok("keine Empfehlung", !/Empfohlen/.test(t.el("scenarios").innerHTML));
  ok("kein unverwertbarer Betrag im Link", !/a=/.test(t.api.buildQuery()), t.api.buildQuery());
  t.stop();
}

// ---------------------------------------------------------------- Datum
group("Geburtsdatum, Monate und Beträge");
{
  const {api, newEl} = loadApp();
  const {parseBirth, fmtBirth, childYearAmount, maskBirth} = api;

  ok("27.07.2018 gültig", !!parseBirth("27.07.2018"));
  ok("27072018 gültig", !!parseBirth("27072018"));
  ok("ISO gültig", !!parseBirth("2018-07-27"));
  ok("31.02.2024 abgewiesen", parseBirth("31.02.2024") === null);
  ok("zweistelliges Jahr abgewiesen", parseBirth("27.07.18") === null);
  eq("Normalisierung", fmtBirth(parseBirth("1.1.2020")), "01.01.2020");

  const kid = b => ({label:"K", birth:b, beihilfe:true, amount:2000});
  eq("Geburt 01.09.2025 → 4 Monate", childYearAmount(kid("01.09.2025"), 2025).u18, 4);
  eq("Geburt 01.09.2025 → 666,72 €", childYearAmount(kid("01.09.2025"), 2025).cents, 4*16668);
  eq("volles Jahr → 2.000,16 €", childYearAmount(kid("27.07.2018"), 2025).cents, 12*16668);
  {
    const r = childYearAmount(kid("15.06.2007"), 2025);   // wird im Juni 2025 achtzehn
    eq("18. Geburtstag: Monate darunter", r.u18, 6);
    eq("18. Geburtstag: Monate darüber", r.o18, 6);
    eq("18. Geburtstag: Betrag", r.cents, 6*16668 + 6*5834);
  }
  {
    const r = childYearAmount({label:"K", birth:"15.06.2007", beihilfe:false}, 2025);
    eq("ohne Beihilfe keine Monate über 18", r.o18, 0);
  }
  eq("noch nicht geboren", childYearAmount(kid("01.03.2026"), 2025).cents, 0);

  // Eingefügtes "1.1.2020" darf nicht zu "11.20.20" gefaltet werden.
  const e = newEl();
  e.value = "1.1.2020";
  e.selectionStart = e.value.length;
  maskBirth(e, "", "insertFromPaste");
  eq("eingefügtes Datum bleibt lesbar", e.value, "01.01.2020");

  // Getippt entstehen die Punkte von selbst.
  const t = newEl();
  let prev = "";
  for(const ch of "27072018"){
    t.value += ch; t.selectionStart = t.value.length;
    maskBirth(t, prev, "insertText");
    prev = t.value;
  }
  eq("tippen: 27072018 → 27.07.2018", t.value, "27.07.2018");
  // Backspace bis leer – nicht bei "27." hängen bleiben.
  let guard = 0;
  while(t.value !== "" && guard++ < 40){
    const before = t.value;
    t.value = before.slice(0, -1);
    t.selectionStart = t.value.length;
    maskBirth(t, before, "deleteContentBackward");
    if(t.value === before) break;
  }
  eq("Backspace leert das Feld", t.value, "");
}

// ---------------------------------------------------------------- F10 Rundung
group("F10 – Rundung und Aufteilung in Cent");
{
  const {api} = loadApp();
  const {shareToA, evaluate, amountFor, set} = api;

  eq("666,72 € hälftig an A", shareToA(66672, 0.5), 33336);
  eq("666,72 € hälftig an B", 66672 - shareToA(66672, 0.5), 33336);
  eq("2.000,16 € bleibt 2.000,16 €", shareToA(200016, 1), 200016);
  eq("25 % von 2.000,16 €", shareToA(200016, 0.25), 50004);

  set({childMode:"birth", taxYear:2025,
       children:[{label:"Kind 1", birth:"01.09.2025", beihilfe:true, amount:2000}]});
  eq("amountFor rechnet in Cent", amountFor(api.state().children[0]), 66672);
  set({childMode:"amount", children:[{label:"Kind 1", birth:"", beihilfe:true, amount:2000}]});
  eq("Pauschalbetrag in Cent", amountFor(api.state().children[0]), 200000);

  // Die Zeilen je Kind müssen sich exakt auf "zugeteilt" summieren.
  const amounts = [66672, 200016, 70008];
  const r = evaluate([0.5, 0.5, 0.25], amounts, 1e9, 1e9);
  const rowsA = amounts.reduce((s, a, i) => s + shareToA(a, [0.5,0.5,0.25][i]), 0);
  eq("Zeilensumme A = zugeteilt A", rowsA, r.aSum);
  eq("A + B = gesamt", r.aSum + r.bSum, amounts.reduce((a,b)=>a+b,0));
}

// ---------------------------------------------------------------- N03 / Optimierung
group("N03 – Optimierung: alle Kinderzahlen, Deckel an den erreichbaren Summen");
{
  const {api} = loadApp();
  const {bestSplit, set} = api;

  // Unabhängig: alle Kombinationen durchgehen und nur das Maximum bestimmen.
  const bestUsed = (amounts, cA, cB, opts) => {
    const total = amounts.reduce((a,b)=>a+b,0);
    let max = -Infinity;
    const rec = (i, aSum) => {
      if(i === amounts.length){
        max = Math.max(max, Math.min(aSum, cA) + Math.min(total-aSum, cB));
        return;
      }
      for(const f of opts) rec(i+1, aSum + Math.round(amounts[i]*f));
    };
    rec(0, 0);
    return max;
  };
  const reachable = (amounts, opts) => {
    let sums = [0];
    for(const amt of amounts){
      const next = [];
      for(const s of sums) for(const f of opts) next.push(s + Math.round(amt*f));
      sums = [...new Set(next)];
    }
    return sums.sort((a,b)=>a-b);
  };

  // Realistische Jahresbeträge in Cent: volles Jahr, Teiljahr, über 18, gemischt.
  const POOL = [200016, 66672, 70008, 116676, 17502, 133344];
  const vector = n => Array.from({length:n}, (_, i) => POOL[i % POOL.length]);

  let rng = 987654321;
  const rnd = n => (rng = (rng*1103515245 + 12345) % 2147483648, rng % n);
  const seen = {};

  for(const mode of ["free", "restricted"]){
    set({splitMode: mode});
    const opts = mode === "restricted" ? [0.25,0.5,0.75] : [0,0.5,1];

    for(let n = 1; n <= 6; n++){
      const amounts = vector(n);
      const total = amounts.reduce((a,b)=>a+b,0);
      const sums = reachable(amounts, opts);
      // Über die erreichbaren Summen streuen, dann je Summe knapp darunter, genau
      // darauf und knapp darüber deckeln – dort entscheidet sich die Aufteilung.
      const probes = [];
      const step = Math.max(1, Math.floor(sums.length / 6));
      for(let i = 0; i < sums.length; i += step){
        const s = sums[i], rest = total - s;
        probes.push([s-1, rest], [s, rest], [s+1, rest],
                    [s, rest-1], [s, rest+1], [s, 0], [0, rest], [s, total]);
      }
      let worst = 0, cases = 0;
      for(const [cA, cB] of probes){
        const a = Math.max(0, cA), b = Math.max(0, cB);
        worst = Math.max(worst, bestUsed(amounts, a, b, opts) - bestSplit(amounts, a, b).used);
        cases++;
      }
      // Dazu Zufallsfälle mit **fester** Kinderzahl – die Abdeckung darf nicht davon
      // abhängen, was ein Generator gerade auswürfelt.
      for(let t = 0; t < 120; t++){
        const rndAmounts = Array.from({length:n}, () => (1 + rnd(2500)) * 12 + rnd(100));
        const rndTotal = rndAmounts.reduce((a,b)=>a+b,0);
        const cA = rnd(rndTotal + 1000), cB = rnd(rndTotal + 1000);
        worst = Math.max(worst, bestUsed(rndAmounts, cA, cB, opts) - bestSplit(rndAmounts, cA, cB).used);
        cases++;
      }
      seen[n] = (seen[n] || 0) + cases;
      eq(`${mode}, ${n} Kind(er): kein Cent unter dem Optimum (${cases} Fälle)`, worst, 0);
    }
  }
  for(let n = 1; n <= 6; n++) ok(`${n} Kind(er) tatsächlich geprüft`, seen[n] >= 200, `nur ${seen[n]||0} Fälle`);

  // Der dokumentierte gemischte Fall: 850 € / 9.000 € Tarifsteuer, 2.000 + 700, ab 2027.
  set({inputMode:"tax", childMode:"amount", splitMode:"restricted",
       children:[{label:"Kind 1", birth:"", beihilfe:true, amount:2000},
                 {label:"Kind 2", birth:"", beihilfe:true, amount:700}]});
  const mixed = bestSplit([200000, 70000], 85000, 900000);
  eq("gemischt: Kind 1 zu 25 % auf A", mixed.fractions[0], 0.25);
  eq("gemischt: Kind 2 hälftig", mixed.fractions[1], 0.5);

  // Mehrere Kinder, ein Elternteil ohne Steuer: alles muss zum anderen wandern.
  set({splitMode:"free"});
  const allToA = bestSplit([200016, 66672, 70008], 1e9, 0);
  eq("ohne Steuer bei B geht alles an A", allToA.aSum, 200016+66672+70008);
  eq("und nichts verpufft", allToA.wasted, 0);
}

// ---------------------------------------------------------------- F06
group("F06 – unvollständige Angaben sperren die Empfehlung");
{
  const t = loadApp();
  const {api, el} = t;
  api.set({childMode:"birth", taxYear:2025,
           children:[{label:"Kind 1", birth:"27.07.2018", beihilfe:true, amount:2000},
                     {label:"Kind 2", birth:"", beihilfe:true, amount:2000}]});
  el("valA").value = "55.000";
  el("valB").value = "32.000";
  api.compute();
  ok("zweites Kind ohne Datum wird gemeldet",
     /Kind 2/.test(el("issues").innerHTML), el("issues").innerHTML);
  ok("keine Vollständigkeitsbehauptung", !/kommt an/.test(el("dynNote").innerHTML), el("dynNote").innerHTML);
  ok("Karte trägt „vorläufig“", /vorläufig/.test(el("scenarios").innerHTML));
  ok("keine Empfehlung", !/Empfohlen/.test(el("scenarios").innerHTML));

  el("valB").value = "";
  api.set({children:[{label:"Kind 1", birth:"27.07.2018", beihilfe:true, amount:2000}]});
  api.compute();
  ok("leerer Elternbetrag wird gemeldet", /kein Betrag eingetragen/.test(el("issues").innerHTML));

  el("valB").value = "0";
  api.compute();
  eq("bewusste 0 ist kein Mangel", el("issues").innerHTML, "");
  ok("valide Nullfälle rechnen weiter", /Empfohlen/.test(el("scenarios").innerHTML));

  el("valB").value = "-500";
  api.compute();
  ok("negativer Betrag wird gemeldet", /negativer Betrag/.test(el("issues").innerHTML));
  ok("Deckel wird nicht behauptet", /Betrag nicht verwertbar/.test(el("ceilings").innerHTML));
  t.stop();
}

// ---------------------------------------------------------------- F04
group("F04 – Text und wirksame Regel stimmen überein");
{
  const t = loadApp();
  const {api} = t;
  for(const sm of ["auto", "free", "restricted"]){
    for(const ef of [false, true]){
      api.set({splitMode:sm, erhFB:ef, taxYear:2025, childMode:"birth",
               children:[{label:"Kind 1", birth:"27.07.2018", beihilfe:true, amount:2000}]});
      const eff = api.effSplit();
      const hint = api.splitHintText();
      const behauptetFrei = /freie Wahl bleibt|freie Wahl<\/b>\./.test(hint);
      ok(`sm=${sm} ef=${ef}: kein „freie Wahl“ bei Pflichtrechnung`,
         !(eff === "restricted" && behauptetFrei), hint);
      if(sm !== "auto" && eff === "restricted" && ef){
        ok("erhöhte Familienbeihilfe + Pflicht = ausgewiesene Simulation",
           /trotzdem/.test(hint), hint);
      }
    }
  }
  eq("erhöhte Familienbeihilfe hebt die Altersbedingung auf",
     (api.set({erhFB:true}), api.ruleForYear(2027).state), "free");
  t.stop();
}

// ---------------------------------------------------------------- F08
group("F08 – Eingabearten werden getrennt gehalten");
{
  const t = loadApp();
  const {api, el, seg} = t;
  el("valA").value = "20.000";
  el("valB").value = "10.000";
  api.compute();
  seg("inputMode", "mode", "tax").dispatch("click");
  eq("Umschalten deutet nichts um (A)", el("valA").value, "");
  eq("Umschalten deutet nichts um (B)", el("valB").value, "");
  el("valA").value = "1.500";
  api.compute();
  seg("inputMode", "mode", "income").dispatch("click");
  eq("Rückschalten holt das Einkommen zurück", el("valA").value, "20.000");
  seg("inputMode", "mode", "tax").dispatch("click");
  eq("und die Tarifsteuer bleibt auch erhalten", el("valA").value, "1.500");
  t.stop();
}

// ---------------------------------------------------------------- F07
group("F07 – Link, Speicher und Hash");
{
  const t = loadApp({hash:"#a=20000&b=10000"});
  const {api, el, loc} = t;
  eq("Link wird übernommen", el("valA").value, "20.000");
  eq("Hash bleibt nicht in der Adresse stehen", loc.hash, "");
  ok("Stand ist sofort gesichert", /a=20000/.test(t.store()), t.store());

  el("valA").value = "30.000";
  el("valA").dispatch("input", {inputType:"insertText"});
  await sleep(450);
  ok("Änderung ersetzt den gespeicherten Stand", /a=30000/.test(t.store()), t.store());
  t.stop();

  const reload = loadApp({store: t.store()});
  eq("Reload zeigt die Änderung, nicht den alten Link", reload.el("valA").value, "30.000");
  reload.stop();

  // Ein fremder Hash (Sprungziel) lässt den Stand in Ruhe.
  const anchor = loadApp({hash:"#sec-ergebnis", store:"a=44000"});
  eq("Sprungziel ändert den Stand nicht", anchor.el("valA").value, "44.000");
  eq("Sprungziel bleibt erhalten", anchor.loc.hash, "#sec-ergebnis");
  anchor.stop();
}

// ---------------------------------------------------------------- Link
group("Link: Kodierung, Fixpunkt, Fremdeingabe");
{
  const t = loadApp();
  const {api, el} = t;
  el("valA").value = "55.000";
  el("valB").value = "32.000";
  api.set({childMode:"birth", children:[
    {label:"Kind 1", birth:"27.07.2018", beihilfe:true, amount:2000},
    {label:"Kind 2", birth:"11.05.2022", beihilfe:true, amount:2000}]});
  const q = api.buildQuery();
  eq("Standardfall bleibt kurz", q, "a=55000&b=32000&cb=27072018&cb=11052022");
  api.applyQuery(q);
  eq("Fixpunkt", api.buildQuery(), q);

  // Fremdeingabe: Jahr, Betrag und Kinderzahl werden geprüft, nicht übernommen.
  const evil = "y=9999&ca=999999&" + Array.from({length:40}, () => "cn=X").join("&");
  api.applyQuery(evil);
  eq("unbekanntes Jahr fällt auf den Default", api.state().taxYear, 2025);
  eq("Kinderzahl gekappt", api.state().children.length, api.MAX_CHILDREN);
  eq("Betrag nur aus dem Select", api.state().children[0].amount, 2000);

  // Namen aus dem Feld landen escaped im DOM.
  api.applyQuery("na=" + encodeURIComponent('<img src=x onerror=alert(1)>'));
  api.compute();
  ok("Name wird escaped", !/<img/.test(el("scenarios").innerHTML), el("scenarios").innerHTML.slice(0, 200));
  ok("und erscheint als Text", /&lt;img/.test(el("scenarios").innerHTML));
  t.stop();
}

// ---------------------------------------------------------------- Ergebnis
group("Ergebnis: Deckel, Anzeige, Grenzfälle");
{
  const t = loadApp();
  const {api, el} = t;
  api.set({inputMode:"income", childMode:"birth", taxYear:2025, splitMode:"auto", erhFB:false,
           children:[{label:"Kind 1", birth:"27.07.2018", beihilfe:true, amount:2000},
                     {label:"Kind 2", birth:"11.05.2022", beihilfe:true, amount:2000}]});
  el("valA").value = "55.000";
  el("valB").value = "32.000";
  api.compute();
  eq("Deckel A in Cent", api.ceilingCents("55.000"), 1359310);
  eq("Deckel B in Cent", api.ceilingCents("32.000"), 477670);   // 4.776,70 €, nicht die gerundeten 4.777
  ok("Ceilings zeigen 13.593,10 €", /13\.593,10/.test(el("ceilings").innerHTML));
  ok("nichts verpufft", /verpufft nichts|kommt an/.test(el("dynNote").innerHTML), el("dynNote").innerHTML);

  el("valB").value = "8.000";
  api.compute();
  eq("unter der Steuergrenze = 0", api.ceilingCents("8.000"), 0);
  ok("Bonus wandert auf A", /Alles auf/.test(el("scenarios").innerHTML));

  // 50/50 eines 666,72-€-Kindes: 333,36 / 333,36 – nicht 334 / 334.
  api.set({children:[{label:"Kind 1", birth:"01.09.2025", beihilfe:true, amount:2000},
                     {label:"Kind 2", birth:"11.05.2022", beihilfe:true, amount:2000}]});
  el("valB").value = "32.000";
  api.compute();
  ok("Zeile je Kind mit Cent", /333,36 € \/ 333,36 €/.test(el("scenarios").innerHTML),
     el("scenarios").innerHTML.match(/pc-eur[^<]*>[^<]*/g));
  t.stop();
}

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen.`);
process.exit(failed ? 1 : 0);
