// Minimale DOM-Nachbildung, gerade groß genug für index.html.
//
// Der Rechner ist bewusst eine einzige Datei ohne Build – es gibt also kein Modul zum
// Importieren. Statt die Datei dafür aufzuteilen (das wäre die teuerste Änderung von
// allen), wird hier das <script> herausgeschnitten und in einer nachgebauten Umgebung
// ausgeführt. Der Testhaken am Ende des Skripts reicht die Innereien heraus.
//
// Die Seg-Buttons und die Startwerte der Felder werden aus dem HTML gelesen, nicht
// notiert: benennt jemand ein data-Attribut um oder ändert einen Startwert, fallen die
// Tests darüber – genau da sollen sie es auch.

import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
export const HTML = readFileSync(join(HERE, "..", "index.html"), "utf8");

function scriptSource(html){
  const m = /<script>([\s\S]*?)<\/script>/.exec(html);
  if(!m) throw new Error("kein <script> in index.html gefunden");
  return m[1];
}

function attrs(tag){
  const out = {};
  for(const a of tag.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) out[a[1]] = a[2];
  if(/\schecked(\s|>|$)/.test(tag)) out.checked = "";
  return out;
}

class El {
  constructor(tag, id){
    this.tagName = String(tag || "div").toUpperCase();
    this.id = id || "";
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.childNodes = [];
    this.value = "";
    this.checked = false;
    this.hidden = false;
    this.disabled = false;
    this.placeholder = "";
    this.className = "";
    this.textContent = "";
    this.innerHTML = "";
    this.outerHTML = "";
    this.selectionStart = null;
    this.selectionEnd = null;
    this.buttons = null;          // nur die Seg-Container haben welche
  }
  addEventListener(type, fn){ (this.listeners[type] = this.listeners[type] || []).push(fn); }
  dispatch(type, ev){ (this.listeners[type] || []).forEach(fn => fn(Object.assign({target:this}, ev))); }
  setAttribute(k, v){ this.attributes[k] = String(v); }
  getAttribute(k){ return this.attributes[k]; }
  querySelectorAll(){ return this.buttons || []; }
  appendChild(c){ this.childNodes.push(c); return c; }
  setSelectionRange(a, b){ this.selectionStart = a; this.selectionEnd = b; }
  focus(){}
  select(){}
  closest(){ return null; }
}

// Lädt eine frische, isolierte Instanz des Rechners.
export function loadApp({hash = "", store = "", origin = "https://example.test/familienbonus/"} = {}){
  const html = HTML;
  const els = new Map();
  const el = id => {
    if(!els.has(id)) els.set(id, new El("div", id));
    return els.get(id);
  };

  // Startwerte der Felder aus dem HTML übernehmen (value="Elternteil A" etc.).
  for(const tag of html.matchAll(/<input\b[^>]*>/g)){
    const a = attrs(tag[0]);
    if(!a.id) continue;
    const e = el(a.id);
    e.tagName = "INPUT";
    if(a.value != null) e.value = a.value;
    if(a.placeholder != null) e.placeholder = a.placeholder;
    if("checked" in a) e.checked = true;
  }
  // Seg-Buttons samt ihrer data-Attribute.
  for(const seg of html.matchAll(/<div class="seg" id="([a-zA-Z]+)"[^>]*>([\s\S]*?)<\/div>/g)){
    const box = el(seg[1]);
    box.buttons = [...seg[2].matchAll(/<button\b[^>]*>/g)].map(b => {
      const e = new El("button");
      for(const d of b[0].matchAll(/data-([a-zA-Z]+)="([^"]*)"/g)) e.dataset[d[1]] = d[2];
      const a = attrs(b[0]);
      if(a["aria-pressed"] != null) e.attributes["aria-pressed"] = a["aria-pressed"];
      return e;
    });
  }

  const document = {
    getElementById: id => el(id),
    createElement: tag => new El(tag),
    addEventListener(){}
  };

  const loc = {
    _href: origin + (hash ? (hash.startsWith("#") ? hash : "#" + hash) : ""),
    get href(){ return this._href; },
    set href(v){ this._href = v; },
    get hash(){ const i = this._href.indexOf("#"); return i < 0 ? "" : this._href.slice(i); },
    set hash(v){ this._href = this._href.split("#")[0] + (String(v).startsWith("#") ? v : "#" + v); }
  };
  const history = {
    replaceState(_s, _t, url){
      if(url == null) return;
      if(String(url).startsWith("#")) loc.hash = String(url);
      else loc.href = String(url);
    }
  };

  const backing = new Map();
  if(store) backing.set("familienbonus.state.v1", store);
  const localStorage = {
    getItem: k => (backing.has(k) ? backing.get(k) : null),
    setItem: (k, v) => backing.set(k, String(v)),
    removeItem: k => backing.delete(k)
  };

  const timers = new Set();
  const setT = (fn, ms) => { const t = setTimeout(fn, ms); if(t.unref) t.unref(); timers.add(t); return t; };
  const clearT = t => { clearTimeout(t); timers.delete(t); };

  const win = {__FB_TEST: true, addEventListener(type, fn){ (win._l = win._l || {}), (win._l[type] = fn); }};
  const fire = (type, ev) => { if(win._l && win._l[type]) win._l[type](ev || {}); };

  const fn = new Function(
    "window", "document", "location", "history", "localStorage", "navigator", "confirm",
    "setTimeout", "clearTimeout", scriptSource(html));
  fn(win, document, loc, history, localStorage, {}, () => true, setT, clearT);

  return {
    api: win.__FB_TEST,
    el, loc, document, fire,
    seg: (id, key, val) => el(id).buttons.find(b => b.dataset[key] === val),
    store: () => backing.get("familienbonus.state.v1") || "",
    stop: () => timers.forEach(clearTimeout),
    newEl: (value = "") => { const e = new El("input"); e.value = value; return e; }
  };
}
