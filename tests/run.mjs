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
  const {api} = loadApp();
  const {amountVal, amountBad, maskAmount, amountToLink, amountFromLink} = api;

  eq("1.234,56 → 1234.56", amountVal("1.234,56"), 1234.56);
  eq("55.000,00 → 55000", amountVal("55.000,00"), 55000);
  eq("55.000 → 55000", amountVal("55.000"), 55000);
  eq("-500 bleibt negativ", amountVal("-500"), -500);
  eq("-500 ist ungültig", amountBad("-500"), true);
  eq("leeres Feld ist nicht ungültig", amountBad(""), false);
  eq("englischer Dezimalpunkt 12.34", amountVal("12.34"), 12.34);
  eq("Tausenderpunkt 12.345 bleibt ganz", amountVal("12.345"), 12345);
  eq("dritte Nachkommastelle fällt weg", amountVal("1,239"), 1.23);

  const {newEl} = loadApp();
  const type = (text, opts={}) => {
    const e = newEl();
    let prev = "";
    for(const ch of text){
      e.value += ch;
      e.selectionStart = e.value.length;
      maskAmount(e, prev, false);
      prev = e.value;
    }
    return e.value;
  };
  eq("tippen: 55000 → 55.000", type("55000"), "55.000");
  eq("tippen: 1234,56 → 1.234,56", type("1234,56"), "1.234,56");
  eq("Link: 1.234,56 → 1234.56", amountToLink("1.234,56"), "1234.56");
  eq("Link zurück: 1234.56 → 1.234,56", amountFromLink("1234.56"), "1.234,56");
  eq("Link: 55.000 → 55000", amountToLink("55.000"), "55000");

  // Backspace auf dem Tausenderpunkt nimmt die Ziffer davor mit (ein Tastendruck).
  const e = newEl("55.000");
  e.value = "55000";            // der Browser hat den Punkt entfernt
  e.selectionStart = 2;
  maskAmount(e, "55.000", true);
  eq("Backspace auf Trennzeichen", e.value, "5.000");
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

// ---------------------------------------------------------------- Optimierung
group("Optimierung gegen unabhängige Suche");
{
  const {api} = loadApp();
  const {bestSplit, set} = api;

  // Unabhängig: alle Kombinationen durchgehen und nur das Maximum bestimmen.
  const bestUsed = (amounts, cA, cB, opts) => {
    let max = -Infinity;
    const rec = (i, aSum) => {
      if(i === amounts.length){
        const total = amounts.reduce((a,b)=>a+b,0);
        max = Math.max(max, Math.min(aSum, cA) + Math.min(total-aSum, cB));
        return;
      }
      for(const f of opts) rec(i+1, aSum + Math.round(amounts[i]*f));
    };
    rec(0, 0);
    return max;
  };

  let rng = 12345;
  const rnd = n => (rng = (rng*1103515245 + 12345) % 2147483648, rng % n);
  for(const mode of ["free", "restricted"]){
    set({splitMode: mode});
    const opts = mode === "restricted" ? [0.25,0.5,0.75] : [0,0.5,1];
    let worst = 0;
    for(let t = 0; t < 400; t++){
      const n = 1 + rnd(4);
      const amounts = Array.from({length:n}, () => (1 + rnd(300)) * 100 + rnd(100));
      const cA = rnd(400000), cB = rnd(400000);
      const got = bestSplit(amounts, cA, cB);
      const want = bestUsed(amounts, cA, cB, opts);
      worst = Math.max(worst, want - got.used);
    }
    eq(`${mode}: kein Cent unter dem Optimum`, worst, 0);
  }

  // Der dokumentierte gemischte Fall: 850 € / 9.000 € Tarifsteuer, 2.000 + 700, ab 2027.
  set({inputMode:"tax", childMode:"amount", splitMode:"restricted",
       children:[{label:"Kind 1", birth:"", beihilfe:true, amount:2000},
                 {label:"Kind 2", birth:"", beihilfe:true, amount:700}]});
  const mixed = bestSplit([200000, 70000], 85000, 900000);
  eq("gemischt: Kind 1 zu 25 % auf A", mixed.fractions[0], 0.25);
  eq("gemischt: Kind 2 hälftig", mixed.fractions[1], 0.5);
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
