import { DEFAULTS, normalize, profileAt, sizeToDiameter, sizeToUS } from './ring.js';
import { MATERIALS, MATERIAL_GROUPS, FINISHES, FORMS, PROFILES, PATTERNS, FACES, PATHS, CLOSURES, ENDS, OUTLINES, CONTOURS, ZONES, INLAYS, STONE_SHAPES, STONE_CUTS, STONE_LAYOUTS, SETTINGS } from './catalog.js';
import { STONE_COLORS, stoneOutline } from './gems.js';
import { FONTS } from './text.js';
import { Viewer } from './viewer.js';
import { db, persist, saveRing, deleteRing, getRing, deliver, ringFile, backupFile, parseImport, stlFile } from './store.js';
import { ERAS, STYLES, PRINT_NOTES } from './handbook.js';

const $ = (s, el = document) => el.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid);
  return el;
};
const fmt = (v, d = 1) => v.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const hex = (n) => '#' + n.toString(16).padStart(6, '0');

// ------------------------------------------------------------- Zustand
const cur = {
  id: db.draftId || null,
  name: db.draft?.name || 'Neuer Ring',
  params: normalize(db.draft?.params || DEFAULTS),
  dirty: !!db.draft?.dirty,
  seg: 'form',
  stats: null,
};
db.stack = (db.stack || []).map((s) => (typeof s === 'string' ? { id: s, flip: false } : s)).filter((s) => getRing(s.id));

let viewer, stackViewer;
try {
  viewer = new Viewer($('#bench-stage'));
} catch (e) {
  $('#bench-stage').append(h('div', { class: 'stage-empty' }, 'Die 3D-Ansicht konnte nicht gestartet werden. Bitte die Seite neu laden.'));
}

// ---------------------------------------------------- Toast und Blätter
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}
function sheet(...content) {
  const body = $('#sheet-body');
  body.replaceChildren(...content.flat(Infinity).filter(Boolean));
  $('#sheet').hidden = false;
}
const closeSheet = () => { $('#sheet').hidden = true; };
$('#sheet').addEventListener('click', (e) => { if (e.target.hasAttribute('data-close')) closeSheet(); });
const action = (label, fn, cls = '') => h('button', { class: 'btn ' + cls, type: 'button', onclick: () => { closeSheet(); fn && fn(); } }, label);
function ask(title, text, okLabel, fn, danger) {
  sheet(h('h2', {}, title), h('p', {}, text),
    h('div', { class: 'actions' }, action(okLabel, fn, danger ? 'danger' : ''), action('Abbrechen', null, 'ghost')));
}

// -------------------------------------------------- Vorschaubilder (Queue)
const thumbs = new Map();
const queue = [];
let pumping = false;
function thumb(key, params, first = false) {
  const img = h('img', { alt: '', loading: 'lazy' });
  if (thumbs.has(key)) img.src = thumbs.get(key);
  else { queue[first ? 'unshift' : 'push']({ key, params, img }); pump(); }
  return h('span', { class: 'thumb' }, img);
}
function pump() {
  if (pumping || !viewer) return;
  pumping = true;
  const step = () => {
    const job = queue.shift();
    if (!job) { pumping = false; return; }
    {
      if (!thumbs.has(job.key)) thumbs.set(job.key, viewer.snapshot(job.params, 300));
      job.img.src = thumbs.get(job.key);
    }
    setTimeout(step, 16);
  };
  setTimeout(step, 30);
}
const ringKey = (r) => r.id + ':' + r.updated;

// ============================================================ Werkbank
const SEGS = { form: 'Form', rail: 'Schiene', profile: 'Profil', size: 'Maße', stones: 'Steine', surface: 'Struktur', text: 'Gravur', material: 'Material' };

let rafPending = false, saveTimer, refineTimer, pendingRefit = false, pendingLight = true;
// light = während des Ziehens an einem Regler: grobes Netz sofort, feines kurz danach
function changed({ refit = false, rerender = false, light = false } = {}) {
  cur.dirty = true;
  pendingRefit = pendingRefit || refit;
  pendingLight = pendingLight && light;
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      const l = pendingLight, r = pendingRefit;
      pendingLight = true; pendingRefit = false;
      redraw(r, l ? 'light' : 'preview');
      clearTimeout(refineTimer);
      if (l) refineTimer = setTimeout(() => redraw(false, 'preview'), 240);
    });
  }
  if (rerender) renderControls();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 400);
  $('#btn-save').classList.add('dirty');
}
function saveDraft() {
  db.draft = { name: cur.name, params: cur.params, dirty: cur.dirty };
  db.draftId = cur.id;
  persist();
}
function redraw(refit, quality = 'preview') {
  if (!viewer) return;
  cur.stats = viewer.setRing(cur.params, { refit, quality });
  renderStats();
}
// Der Ring wird zwischen Kopfzeile und Fußzeile der Bühne eingepasst.
function updateInsets() {
  const stage = $('#bench-stage');
  if (!viewer || !stage.clientHeight) return;
  const box = stage.getBoundingClientRect();
  viewer.setInsets($('#bench-stage .stage-top').getBoundingClientRect().bottom - box.top, (box.bottom - $('#bench-stage .stage-bottom').getBoundingClientRect().top) * 0.6);
}
function weight() {
  const m = MATERIALS[cur.params.material] || MATERIALS.gold;
  return cur.stats.volume / 1000 * m.density;
}
function renderStats() {
  const s = cur.stats, p = cur.params;
  if (!s) return;
  const thin = s.minWall < 0.8;
  $('#bench-stats').innerHTML =
    `<b>Größe ${fmt(p.size, 0)}</b> · Ø ${fmt(s.innerDiameter)} mm<br>` +
    `${fmt(weight())} g ${(MATERIALS[p.material] || MATERIALS.gold).label}` +
    (s.stones && s.stones.length ? ` · ${s.stones.length} ${s.stones.length === 1 ? 'Stein' : 'Steine'}` : '') +
    (thin ? `<br><span class="warn">Dünnste Stelle ${fmt(s.minWall, 2)} mm</span>` : '');
  updateInsets();
  const sl = $('#stone-list');
  if (sl) sl.textContent = stoneList();
  const thinEl = $('#stone-thin');
  if (thinEl) thinEl.hidden = !(s.stones || []).some((x) => x.thin);
  const facts = $('#facts');
  if (facts) facts.replaceWith(factsBlock());
}
function factsBlock() {
  const s = cur.stats || {}, p = cur.params;
  const row = (k, v) => h('div', {}, h('dt', {}, k), h('dd', {}, v));
  return h('dl', { class: 'facts', id: 'facts' },
    row('Innendurchmesser', fmt(sizeToDiameter(p.size), 2) + ' mm'),
    row('US-Größe', fmt(Math.max(0, sizeToUS(p.size)), 1)),
    row('Außenmaß', s.outerDiameter ? fmt(s.outerDiameter) + ' mm' : '–'),
    row('Gesamtbreite', s.axialWidth ? fmt(s.axialWidth) + ' mm' : '–'),
    row('Volumen', s.volume ? fmt(s.volume, 0) + ' mm³' : '–'),
    row('Gewicht', s.volume ? fmt(weight()) + ' g' : '–'));
}

// ---- Bausteine der Bedienfelder
function slider(key, label, min, max, step, unit = 'mm', digits = 1, extra) {
  const p = cur.params;
  const out = h('span', { class: 'value' });
  const show = () => { out.innerHTML = fmt(p[key], digits) + (unit ? ' ' + unit : '') + (extra ? `<small>${extra(p[key])}</small>` : ''); };
  show();
  const input = h('input', {
    type: 'range', min, max, step, value: p[key], id: 'f-' + key, 'aria-label': label,
    oninput: (e) => { p[key] = Number(e.target.value); show(); changed({ light: true }); },
  });
  return h('div', { class: 'field' }, h('div', { class: 'field-head' }, h('label', { class: 'label', for: 'f-' + key }, label), out), input);
}
function chips(key, label, options, { tiles = false, icon, refit = false } = {}) {
  const p = cur.params;
  const wrap = h('div', { class: 'chips' + (tiles ? ' tiles' : ''), role: 'group', 'aria-label': label });
  for (const [val, text] of Object.entries(options)) {
    const btn = h('button', {
      class: 'chip', type: 'button', 'aria-pressed': String(p[key] === val),
      onclick: () => { if (p[key] !== val) { p[key] = val; changed({ rerender: true, refit }); } },
    });
    if (icon) btn.append(icon(val));
    btn.append(typeof text === 'string' ? text : text.label);
    wrap.append(btn);
  }
  return h('div', { class: 'field' }, label ? h('span', { class: 'label' }, label) : null, wrap);
}
function textField(key, label, placeholder, max = 40) {
  const p = cur.params;
  let t;
  return h('div', { class: 'field' }, h('label', { class: 'label', for: 'f-' + key }, label),
    h('input', {
      class: 'text-input', type: 'text', id: 'f-' + key, maxlength: max, placeholder, value: p[key], autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false',
      oninput: (e) => { p[key] = e.target.value; clearTimeout(t); t = setTimeout(() => changed(), 180); },
    }));
}
const svgNS = 'http://www.w3.org/2000/svg';
function svg(viewBox, d, cls) {
  const s = document.createElementNS(svgNS, 'svg');
  s.setAttribute('viewBox', viewBox); s.setAttribute('aria-hidden', 'true');
  if (cls) s.setAttribute('class', cls);
  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', d); path.setAttribute('fill-rule', 'evenodd');
  s.append(path);
  return s;
}
// Querschnitt-Symbol direkt aus der echten Profilfunktion
function profileIcon(type) {
  const w = 3, t = 2.2, n = 40, pts = [];
  for (let i = 0; i <= n; i++) { const x = w * Math.sin((-1 + 2 * i / n) * Math.PI / 2); pts.push([x, profileAt(type, x, w, t, 0.8, 0.3)[0]]); }
  for (let i = n; i >= 0; i--) { const x = w * Math.sin((-1 + 2 * i / n) * Math.PI / 2); pts.push([x, profileAt(type, x, w, t, 0.8, 0.3)[1]]); }
  const d = pts.map(([x, y], i) => (i ? 'L' : 'M') + (x + 3.5).toFixed(2) + ' ' + (3 - y).toFixed(2)).join('') + 'Z';
  return svg('0 0 7 3.8', d);
}
const ring = 'M22 16m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0Z';
const ICONS = {
  band: ['0 0 44 30', 'M22 15m-12.5 0a12.5 12.5 0 1 0 25 0a12.5 12.5 0 1 0-25 0ZM22 15m-9.5 0a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0-19 0Z'],
  taper: ['0 0 44 30', 'M22 14m-13.5 0a13.5 13.5 0 1 0 27 0a13.5 13.5 0 1 0-27 0Z' + ring],
  signet: ['0 0 44 30', 'M13 2h18l5 8a14 14 0 1 1-28 0Z' + ring],
  bombe: ['0 0 44 30', 'M22 1c9 0 15 6 15 14a15 13.5 0 1 1-30 0c0-8 6-14 15-14Z' + ring],
  straight: ['0 0 44 30', 'M4 15h36', 'line'],
  wave: ['0 0 44 30', 'M3 15c5-9 8-9 13 0s8 9 13 0 8-9 12 0', 'line'],
  zigzag: ['0 0 44 30', 'M3 20l8-10 8 10 8-10 8 10 6-8', 'line'],
  vee: ['0 0 44 30', 'M4 8l18 14L40 8', 'line'],
  closed: ['0 0 44 30', 'M22 15m-11 0a11 11 0 1 0 22 0a11 11 0 1 0-22 0', 'line'],
  open: ['0 0 44 30', 'M27 5.2A11 11 0 1 1 17 5.2', 'line'],
  spiral: ['0 0 44 30', 'M8 9c8-5 22-5 28 0M8 15c8-5 22-5 28 0M8 21c8-5 22-5 28 0', 'line'],
  round: ['0 0 44 30', 'M22 15m-11 0a11 11 0 1 0 22 0a11 11 0 1 0-22 0', 'line'],
  poly: ['0 0 44 30', 'M17 4h10l7 7v8l-7 7H17l-7-7v-8Z', 'line'],
  none: ['0 0 44 30', 'M4 9h36M4 21h36', 'line'],
  scallop: ['0 0 44 30', 'M4 10q4-5 8 0t8 0 8 0 8 0M4 20q4 5 8 0t8 0 8 0 8 0', 'line'],
  crown: ['0 0 44 30', 'M4 11l4.500-6 4.500 6 4.500-6 4.500 6 4.500-6 4.500 6 4.500-6 4.500 6M4 21h36', 'line'],
};
const icon = (k) => svg(...ICONS[k]);

function renderSegs() {
  const nav = $('#segs');
  nav.replaceChildren(...Object.entries(SEGS).map(([id, label]) =>
    h('button', { type: 'button', role: 'tab', 'aria-selected': String(cur.seg === id), onclick: () => { cur.seg = id; renderSegs(); renderControls(); $('#controls').scrollTop = 0; } }, label)));
}

function stoneIcon(shape) {
  const sz = STONE_SHAPES[shape].sizes[2], l = Array.isArray(sz) ? sz[0] : sz, w = Array.isArray(sz) ? sz[1] : sz;
  const k = 22 / l, pts = stoneOutline(shape, w / 2 * k, l / 2 * k, false, 40);
  return svg('0 0 44 30', pts.map(([x, z], i) => (i ? 'L' : 'M') + (22 + z).toFixed(1) + ' ' + (15 - x).toFixed(1)).join('') + 'Z');
}
const sizeLabel = (v) => (Array.isArray(v) ? `${fmt(v[0], v[0] % 1 ? 1 : 0)} × ${fmt(v[1], v[1] % 1 ? 1 : 0)}` : `${fmt(v, v % 1 ? 1 : 0)} mm`);
function stoneName(p) {
  const size = ['round', 'square', 'cushion'].includes(p.stoneShape) ? `${fmt(p.stoneL, p.stoneL % 1 ? 1 : 0)} mm` : `${fmt(p.stoneL, p.stoneL % 1 ? 1 : 0)} × ${fmt(p.stoneW, p.stoneW % 1 ? 1 : 0)} mm`;
  return `${STONE_SHAPES[p.stoneShape].label} ${size}, ${STONE_CUTS[p.stoneCut].label.toLowerCase()}, ${STONE_COLORS[p.stoneColor].label}`;
}
function stoneList() {
  const p = cur.params, n = cur.stats?.stones?.length || 0;
  if (!n) return 'Einkaufsliste: –';
  const small = p.stones === 'trio' ? ` (Mitte) und 2 kleinere mit etwa ${fmt(p.stoneL * 0.62)} mm` : '';
  return `Einkaufsliste: ${p.stones === 'trio' ? 1 : n} × ${stoneName(p)}${small}.`;
}
const matChip = (k) => h('span', { class: 'swatch', style: `background:${hex(MATERIALS[k].color)}` });
const matOptions = (keys) => Object.fromEntries(keys.map((k) => [k, MATERIALS[k].label + (MATERIALS[k].note ? ' ' + MATERIALS[k].note : '')]));

function renderControls() {
  const p = cur.params, out = [];
  const add = (...els) => out.push(...els);
  const head = p.form === 'signet' || p.form === 'bombe';
  const hint = (t) => h('p', { class: 'hint' }, t);
  const note = (t) => h('p', { class: 'note' }, t);
  const divider = () => h('div', { class: 'divider' });
  if (cur.seg === 'form') {
    add(chips('form', 'Aufbau', FORMS, { tiles: true, icon, refit: true }), hint(FORMS[p.form].hint + '.'));
    if (p.closure === 'spiral' && p.form !== 'band') add(note('Die Spirale gibt es nur mit gleichmäßiger Schiene.'));
    if (p.form === 'taper') add(slider('taperWidth', 'Breite oben', 2, 16, 0.1), slider('taperThickness', 'Stärke oben', 1, 6, 0.1));
    if (head) {
      add(chips('faceShape', p.form === 'signet' ? 'Plattenform' : 'Kopfform', p.form === 'signet' ? FACES : { oval: 'Oval', navette: 'Navette' }));
      add(slider('faceAcross', 'Kopf quer zum Finger', 7, 24, 0.5), slider('faceAlong', 'Kopf längs zum Finger', 6, 22, 0.5), slider('headHeight', 'Kopfhöhe', 2, 8, 0.1));
    }
    add(divider(), chips('outline', 'Außenkontur', OUTLINES, { tiles: true, icon }));
    if (p.outline === 'poly') add(slider('outlineSides', 'Ecken', 3, 12, 1, '', 0), slider('outlineSoft', 'Eckenrundung', 0, 1, 0.05, '', 2));
    add(hint('Innen bleibt der Ring immer rund. Verlauf, Öffnung und Kanten findest du unter „Schiene“.'));
  } else if (cur.seg === 'rail') {
    add(chips('path', 'Verlauf', PATHS, { tiles: true, icon }));
    if (p.path === 'wave' || p.path === 'zigzag') add(slider('waveAmp', 'Ausschlag', 0.2, 3.5, 0.1), slider('waveCount', p.path === 'wave' ? 'Wellen' : 'Zacken', 1, 10, 1, '', 0));
    if (p.path === 'vee') add(slider('veeDepth', 'Tiefe der Spitze', 0.5, 7, 0.1), slider('veeSpread', 'Öffnung', 0.2, 1.1, 0.05, '', 2));
    add(divider(), chips('closure', 'Verschluss', CLOSURES, { tiles: true, icon, refit: true }));
    if (p.closure !== 'closed') {
      add(hint(CLOSURES[p.closure].hint + '.'));
      if (p.closure === 'open') add(slider('gap', 'Öffnung', 0.5, 12, 0.5));
      else add(slider('turns', 'Windungen', 1.1, 4.5, 0.05, '', 2), slider('spiralPitch', 'Abstand der Windungen', 0, 3, 0.1));
      add(chips('endStyle', 'Enden', ENDS));
    }
    add(divider(), chips('contour', 'Kantenform', CONTOURS, { tiles: true, icon }));
    if (p.contour !== 'none') add(slider('contourAmp', p.contour === 'crown' ? 'Höhe der Zacken' : 'Tiefe der Bögen', 0.2, 2.5, 0.1), slider('contourCount', p.contour === 'crown' ? 'Zacken' : 'Bögen', 4, 36, 1, '', 0));
    add(divider(), slider('twist', 'Drehung des Querschnitts', 0, 12, 1, '', 0, (v) => (v ? (v === 1 ? 'Umdrehung' : 'Umdrehungen') : 'keine')));
    add(hint(head ? 'Bei Ringen mit Kopf ist die Drehung abgeschaltet.' : 'Wirkt am stärksten mit kantigen Profilen: „Flach“ oder „Kissen“ bei gleicher Breite und Stärke ergibt den gedrehten Vierkant.'));
  } else if (cur.seg === 'stones') {
    add(chips('stones', 'Anordnung', STONE_LAYOUTS, { refit: true }));
    if (p.stones === 'none') add(hint('Glassteine zum Einkleben: Der Ring bekommt passende Sitze, die mitgedruckt werden. Die Steine selbst sind nicht Teil der Druckdatei.'));
    else {
      if (p.closure === 'spiral' || (p.twist && !head)) add(note('Bei Spiralen und gedrehten Schienen sind keine Fassungen möglich.'));
      add(chips('stoneShape', 'Form des Steins', STONE_SHAPES, { tiles: true, icon: stoneIcon }));
      const sizes = STONE_SHAPES[p.stoneShape].sizes;
      if (!sizes.some((v) => Math.abs((Array.isArray(v) ? v[0] : v) - p.stoneL) < 0.01)) { const v = sizes[Math.min(3, sizes.length - 1)]; p.stoneL = Array.isArray(v) ? v[0] : v; p.stoneW = Array.isArray(v) ? v[1] : v; }
      const wrap = h('div', { class: 'chips', role: 'group', 'aria-label': 'Größe' });
      for (const v of sizes) {
        const l = Array.isArray(v) ? v[0] : v, w = Array.isArray(v) ? v[1] : v;
        wrap.append(h('button', { class: 'chip', type: 'button', 'aria-pressed': String(Math.abs(p.stoneL - l) < 0.01 && Math.abs(p.stoneW - w) < 0.01), onclick: () => { p.stoneL = l; p.stoneW = w; changed({ rerender: true, refit: true }); } }, sizeLabel(v)));
      }
      add(h('div', { class: 'field' }, h('span', { class: 'label' }, 'Größe'), wrap));
      if (p.stoneL !== p.stoneW) add(h('label', { class: 'switch' }, h('span', {}, 'Lange Seite quer zum Finger'), h('input', { type: 'checkbox', id: 'f-turn', checked: p.stoneTurn, onchange: (e) => { p.stoneTurn = e.target.checked; changed({ refit: true }); } })));
      add(chips('stoneCut', 'Schliff', STONE_CUTS), hint(STONE_CUTS[p.stoneCut].hint + '.'));
      add(chips('stoneColor', 'Farbe', Object.fromEntries(Object.entries(STONE_COLORS).map(([k, v]) => [k, v.label])), { icon: (k) => h('span', { class: 'swatch gem', style: `background:${hex(STONE_COLORS[k].color)}` }) }));
      if (p.stones === 'row') add(slider('stoneCount', 'Anzahl', 2, 13, 1, '', 0));
      if (p.stones !== 'solo') add(slider('stoneGap', 'Abstand zwischen den Steinen', 0, 4, 0.1));
      add(divider(), chips('setting', 'Fassung', SETTINGS), hint(SETTINGS[p.setting].hint + '.'));
      if (p.setting !== 'flush') add(slider('collar', 'Höhe über der Schiene', 0, 4.5, 0.1));
      if (p.setting === 'cone') add(slider('taper', 'Verjüngung nach unten', 0, 0.6, 0.02, '', 2));
      add(slider('wall', 'Wandstärke', 0.4, 1.8, 0.05, 'mm', 2), slider('clearance', 'Spiel zum Stein', 0, 0.3, 0.01, 'mm', 2));
      add(h('p', { class: 'note warn', id: 'stone-thin', hidden: true }, 'Die Schiene ist an dieser Stelle zu dünn für den Stein – er würde überstehen. Mehr Stärke geben, einen Aufbau mit Kopf wählen oder die Fassung „Zarge“ nehmen.'));
      add(h('p', { class: 'note', id: 'stone-list' }, stoneList()));
      add(hint('Das Spiel gleicht Maßabweichungen der Steine (etwa ±0,1 mm) und des Drucks aus. Zum Kleben eignet sich Zweikomponenten-Epoxid oder UV-Kleber.'));
    }
  } else if (cur.seg === 'size') {
    add(slider('size', 'Ringgröße (Innenumfang)', 40, 76, 0.5, 'mm', 1, (v) => 'Ø ' + fmt(sizeToDiameter(v), 1) + ' mm'),
      slider('width', p.form === 'band' ? 'Breite' : 'Breite der Schiene', 1.2, 14, 0.1),
      slider('thickness', p.form === 'band' ? 'Stärke' : 'Stärke der Schiene', 0.9, 4.5, 0.1),
      factsBlock(),
      hint('Größe ermitteln: einen Papierstreifen um den Finger legen und die Länge in Millimetern messen – das ist der Innenumfang.'));
  } else if (cur.seg === 'profile') {
    add(chips('profile', 'Querschnitt', PROFILES, { tiles: true, icon: profileIcon }));
    const pr = PROFILES[p.profile];
    add(hint(pr.hint + '.'));
    if (pr.crown) add(slider('crown', pr.crown, 0, 1, 0.05, '', 2));
    if (pr.edge) add(slider('edge', 'Kantenrundung', 0, 1, 0.05));
  } else if (cur.seg === 'surface') {
    add(chips('pattern', 'Struktur', PATTERNS));
    const pt = PATTERNS[p.pattern];
    if (p.pattern !== 'none' && !pt.noDepth) add(slider('patternDepth', p.pattern === 'milgrain' ? 'Korngröße' : 'Tiefe', 0.05, 0.6, 0.01, 'mm', 2));
    if (pt.count) add(slider('patternCount', pt.count, 1, 6, 1, '', 0));
    if (pt.scale) add(slider('patternScale', 'Dichte', 0.5, 2.2, 0.05, '', 2));
    if (p.pattern !== 'none' && !pt.noZone) add(chips('patternZone', 'Bereich', ZONES));
    if (head) add(note('Am Kopf läuft die Struktur aus – die Fläche bleibt glatt.'));
  } else if (cur.seg === 'text') {
    add(textField('textOuter', 'Außen', 'z. B. CARPE DIEM'));
    add(textField('textInner', 'Innen', 'z. B. Name und Datum'));
    if (p.form === 'signet') add(textField('textTable', 'Auf der Platte', 'Initialen', 4));
    if (p.textOuter || p.textInner || p.textTable) {
      add(chips('font', 'Schrift', Object.fromEntries(Object.entries(FONTS).map(([k, v]) => [k, v.label]))),
        slider('textSize', 'Schriftgröße', 0.3, 0.9, 0.02, '', 2),
        slider('textDepth', 'Tiefe', 0.05, 0.5, 0.01, 'mm', 2));
      if (p.textOuter) {
        add(h('label', { class: 'switch' }, h('span', {}, 'Außen erhaben prägen statt vertiefen'),
          h('input', { type: 'checkbox', id: 'f-raised', checked: p.textRaised, onchange: (e) => { p.textRaised = e.target.checked; changed(); } })));
      }
      if (p.textInner) add(note('Die Innengravur liegt oben im Ring. Unter „Material“ die Deckkraft senken, dann scheint sie durch.'));
    } else add(hint('Text wird als echte Vertiefung in den Ring gearbeitet und ist damit auch im 3D-Druck vorhanden.'));
  } else if (cur.seg === 'material') {
    const keys = Object.keys(MATERIALS);
    add(h('span', { class: 'label' }, 'Werkstoff'));
    for (const g of MATERIAL_GROUPS) {
      add(h('div', { class: 'group-label' }, g), chips('material', '', matOptions(keys.filter((k) => MATERIALS[k].group === g)), { icon: matChip }));
    }
    add(divider(), chips('finish', 'Oberfläche', FINISHES));
    add(slider('opacity', 'Deckkraft', 0.15, 1, 0.05, '', 2));
    const inl = Object.fromEntries(Object.entries(INLAYS).filter(([, v]) => !v.needsHead || head));
    add(divider(), chips('inlay', 'Zweites Metall', inl));
    if (p.inlay !== 'none') {
      add(chips('material2', 'Zweitmetall', matOptions(keys.filter((k) => MATERIALS[k].metal)), { icon: matChip }));
      if (p.inlay === 'center' || p.inlay === 'edges') add(slider('inlayWidth', 'Breite des Streifens', 0.1, 0.9, 0.05, '', 2));
      add(hint('Die Gewichtsangabe rechnet mit dem Hauptwerkstoff.'));
    }
    add(hint('Das Material bestimmt Aussehen und Gewichtsangabe. Die exportierte Druckdatei ist materialneutral.'));
  }
  $('#controls').replaceChildren(...out);
}

function loadIntoBench({ id = null, name, params, dirty = false }) {
  cur.id = id; cur.name = name; cur.params = normalize(params); cur.dirty = dirty;
  $('#ring-name').value = name;
  $('#btn-save').classList.toggle('dirty', dirty);
  renderControls();
  if (viewer) { viewer.resetCamera(); redraw(true); }
  saveDraft();
}
function guard(fn) {
  if (!cur.dirty) return fn();
  ask('Änderungen verwerfen?', `„${cur.name}“ hat ungespeicherte Änderungen.`, 'Verwerfen', fn, true);
}

$('#ring-name').value = cur.name;
$('#ring-name').addEventListener('input', (e) => { cur.name = e.target.value.trim() || 'Ring ohne Namen'; cur.dirty = true; $('#btn-save').classList.add('dirty'); clearTimeout(saveTimer); saveTimer = setTimeout(saveDraft, 400); });
$('#ring-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });
$('#btn-new').addEventListener('click', () => guard(() => { loadIntoBench({ name: 'Neuer Ring', params: DEFAULTS }); cur.seg = 'form'; renderSegs(); renderControls(); }));
$('#btn-save').addEventListener('click', () => {
  const r = saveRing({ id: cur.id, name: cur.name, params: cur.params });
  cur.id = r.id; cur.dirty = false;
  $('#btn-save').classList.remove('dirty');
  saveDraft();
  toast(persist() ? 'In der Galerie gespeichert' : 'Speichern nicht möglich – Speicher voll oder gesperrt');
});
$('#btn-spin').addEventListener('click', (e) => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', String(on));
  viewer?.setAutoRotate(on);
});
$('#btn-home').addEventListener('click', () => viewer?.resetCamera());
$('#btn-export').addEventListener('click', () => exportSheet(cur.name, cur.params));

function exportSheet(name, params) {
  const run = (make, okMsg) => async () => {
    toast('Datei wird vorbereitet …');
    await new Promise((r) => setTimeout(r, 40));
    try { const f = make(); if (await deliver(f.blob, f.filename)) toast(okMsg); }
    catch (e) { toast('Export fehlgeschlagen'); }
  };
  sheet(h('h2', {}, 'Exportieren'), h('p', {}, `„${name}“ als Datei sichern oder weitergeben.`),
    h('div', { class: 'actions' },
      action('3D-Druck-Datei (STL)', run(() => stlFile(name, params), 'STL-Datei erstellt')),
      action('Ring-Datei zum Weitergeben', run(() => ringFile(name, params), 'Ring-Datei erstellt'), 'ghost'),
      action('Bild (PNG)', run(() => {
        const url = viewer.snapshot(params, 1200), bin = atob(url.split(',')[1]);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return { blob: new Blob([bytes], { type: 'image/png' }), filename: (name || 'Ring') + '.png' };
      }, 'Bild erstellt'), 'ghost'),
      action('Abbrechen', null, 'ghost')),
    h('p', { class: 'fine' }, 'STL: Maße in Millimetern, der Ring liegt flach auf dem Druckbett. Die Ring-Datei lässt sich in der Galerie wieder importieren.'));
}

// ============================================================== Galerie
function formName(raw) {
  const p = normalize(raw);
  const parts = [FORMS[p.form].label];
  if (p.closure !== 'closed') parts.push(CLOSURES[p.closure].label);
  if (p.path !== 'straight') parts.push(PATHS[p.path].label);
  return parts.join(', ');
}
function metaLine(p) {
  return `Gr. ${fmt(p.size, 0)} · ${fmt(p.width)} mm · ${MATERIALS[p.material]?.label || ''}`;
}
function renderGallery() {
  const grid = $('#gallery-grid');
  const n = db.rings.length;
  $('#gallery-sub').textContent = n ? `${n} ${n === 1 ? 'Ring' : 'Ringe'}, auf diesem Gerät gespeichert` : 'Deine gespeicherten Ringe';
  $('#btn-backup').hidden = !n;
  if (!n) {
    grid.replaceChildren(h('div', { class: 'empty' },
      h('h2', {}, 'Noch leer'),
      h('span', {}, 'Gestalte einen Ring in der Werkbank und tippe auf „Speichern“. Oder beginne mit einer historischen Vorlage.'),
      h('button', { class: 'pill primary', type: 'button', onclick: () => go('bench') }, 'Zur Werkbank'),
      h('button', { class: 'pill', type: 'button', onclick: () => go('book') }, 'Stilbuch öffnen')));
    return;
  }
  grid.replaceChildren(...db.rings.map((r) => h('button', { class: 'card', type: 'button', onclick: () => ringSheet(r) },
    thumb(ringKey(r), r.params),
    h('span', { class: 'card-body' }, h('span', { class: 'card-title', style: 'display:block' }, r.name), h('span', { class: 'card-meta', style: 'display:block' }, metaLine(r.params))))));
}
function ringSheet(r) {
  sheet(h('h2', {}, r.name), h('p', {}, metaLine(r.params) + ' · ' + formName(r.params)),
    h('div', { class: 'actions' },
      action('Bearbeiten', () => guard(() => { loadIntoBench({ id: r.id, name: r.name, params: r.params }); go('bench'); })),
      action('Zum Stapel hinzufügen', () => { db.stack.push({ id: r.id, flip: false }); persist(); toast('Zum Stapel hinzugefügt'); }, 'ghost'),
      action('Duplizieren', () => { saveRing({ name: r.name + ' (Kopie)', params: r.params }); renderGallery(); }, 'ghost'),
      action('Exportieren …', () => exportSheet(r.name, r.params), 'ghost'),
      action('Löschen', () => ask('Ring löschen?', `„${r.name}“ wird endgültig entfernt.`, 'Löschen', () => {
        if (cur.id === r.id) { cur.id = null; cur.dirty = true; saveDraft(); }
        deleteRing(r.id); renderGallery(); toast('Gelöscht');
      }, true), 'danger')));
}
$('#btn-backup').addEventListener('click', async () => { const f = backupFile(); await deliver(f.blob, f.filename); });
$('#btn-import').addEventListener('click', () => $('#file-import').click());
$('#file-import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const list = parseImport(await file.text());
    list.reverse().forEach((r) => saveRing(r));
    renderGallery();
    toast(list.length === 1 ? `„${list[0].name}“ importiert` : `${list.length} Ringe importiert`);
  } catch (err) { toast('Diese Datei ist keine Ringmaker-Datei'); }
});

// =============================================================== Stapel
function renderStack() {
  if (!stackViewer) {
    try { stackViewer = new Viewer($('#stack-stage')); } catch (e) { return; }
  }
  db.stack = db.stack.filter((s) => getRing(s.id));
  const items = db.stack.map((s) => ({ s, r: getRing(s.id) }));
  for (const b of $('#stack-mode').children) b.setAttribute('aria-pressed', String(b.dataset.mode === db.stackMode));
  $('#stack-finger').checked = !!db.finger;
  $('#stack-finger').parentElement.hidden = db.stackMode !== 'stack';
  $('#stack-empty').hidden = items.length > 0;
  { const st = $('#stack-stage'), bx = st.getBoundingClientRect(); stackViewer.setInsets($('#stack-stage .stage-top').getBoundingClientRect().bottom - bx.top, 34); }
  const info = stackViewer.setRings(items.map(({ s, r }) => ({ ...r.params, _flip: s.flip })), { mode: db.stackMode, finger: db.finger });
  $('#stack-stats').innerHTML = items.length
    ? `<b>${items.length} ${items.length === 1 ? 'Ring' : 'Ringe'}</b>` + (db.stackMode === 'stack' ? ` · zusammen ${fmt(info.length)} mm breit` : '')
    : '';
  const list = $('#stack-list');
  if (!items.length) {
    list.replaceChildren(h('p', { class: 'hint' }, db.rings.length
      ? 'Füge gespeicherte Ringe hinzu und sieh, wie sie zusammen am Finger wirken. V- und Wellenringe schmiegen sich ineinander.'
      : 'Speichere zuerst einen Ring in der Werkbank – dann kannst du ihn hier mit anderen kombinieren.'));
    return;
  }
  const move = (i, d) => { const [x] = db.stack.splice(i, 1); db.stack.splice(i + d, 0, x); persist(); renderStack(); };
  list.replaceChildren(...items.map(({ s, r }, i) => h('div', { class: 'stack-item' },
    thumb(ringKey(r), r.params),
    h('div', { class: 'who' }, h('div', { class: 'card-title' }, r.name), h('div', { class: 'card-meta' }, metaLine(r.params))),
    h('div', { class: 'tools' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Umdrehen', 'aria-pressed': String(!!s.flip), title: 'Umdrehen', onclick: () => { s.flip = !s.flip; persist(); renderStack(); } }, '⇄'),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Nach vorn', disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Nach hinten', disabled: i === items.length - 1, onclick: () => move(i, 1) }, '↓'),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Entfernen', onclick: () => { db.stack.splice(i, 1); persist(); renderStack(); } }, '✕')))));
}
$('#stack-mode').addEventListener('click', (e) => { const m = e.target.dataset.mode; if (m) { db.stackMode = m; persist(); renderStack(); } });
$('#stack-finger').addEventListener('change', (e) => { db.finger = e.target.checked; persist(); renderStack(); });
$('#btn-stack-add').addEventListener('click', () => {
  if (!db.rings.length) return toast('Speichere zuerst einen Ring in der Werkbank');
  sheet(h('h2', {}, 'Ring hinzufügen'), h('p', {}, 'Ein Ring kann auch mehrfach im Stapel liegen.'),
    h('div', { class: 'pick' }, db.rings.map((r) => h('button', {
      class: 'stack-item', type: 'button', style: 'text-align:left',
      onclick: () => { db.stack.push({ id: r.id, flip: false }); persist(); closeSheet(); renderStack(); },
    }, thumb(ringKey(r), r.params), h('span', { class: 'who' }, h('span', { class: 'card-title', style: 'display:block' }, r.name), h('span', { class: 'card-meta', style: 'display:block' }, metaLine(r.params)))))),
    h('div', { class: 'actions' }, action('Fertig', null, 'ghost')));
});

// ============================================================= Stilbuch
function renderBook() {
  const list = $('#book-list');
  if (list.childElementCount) return;
  list.append(h('header', { class: 'book-head' }, h('h1', {}, 'Stilbuch'),
    h('p', {}, 'Woher die Ringformen kommen, wer sie trug und wie sie heute getragen werden. Jede Form lässt sich als Vorlage öffnen.')));
  for (const era of ERAS) {
    const sec = h('section', { class: 'era' }, h('div', { class: 'era-head' }, h('h2', {}, era.label), h('span', {}, era.span)));
    for (const s of STYLES.filter((x) => x.era === era.id)) {
      sec.append(h('button', { class: 'style-row', type: 'button', onclick: () => openStyle(s) },
        thumb('style:' + s.id, { ...DEFAULTS, ...s.preset }),
        h('span', { style: 'min-width:0' }, h('h3', {}, s.title), h('span', { class: 'when', style: 'display:block' }, s.when), h('p', {}, s.lead))));
    }
    list.append(sec);
  }
  const print = h('section', { class: 'era' }, h('div', { class: 'era-head' }, h('h2', {}, 'Vom Entwurf zum Objekt'), h('span', {}, '3D-Druck')));
  print.append(h('button', { class: 'style-row', type: 'button', onclick: openPrint },
    h('span', { style: 'min-width:0;padding:6px' }, h('h3', {}, 'Ringe drucken'), h('p', {}, 'Welches Druckverfahren passt, worauf bei Passform und Wandstärke zu achten ist.'))));
  list.append(print, h('p', { class: 'fine' }, 'Die Texte geben einen vereinfachten Überblick. Jahreszahlen bezeichnen Schwerpunkte, keine scharfen Grenzen.'));
}
function showDetail(node) {
  const view = $('#view-book');
  view.dataset.scroll = view.scrollTop;
  $('#book-list').hidden = true;
  const d = $('#book-detail');
  d.hidden = false; d.replaceChildren(node);
  view.scrollTop = 0;
}
function closeDetail() {
  $('#book-detail').hidden = true; $('#book-list').hidden = false;
  $('#view-book').scrollTop = Number($('#view-book').dataset.scroll || 0);
}
const backBtn = () => h('button', { class: 'pill back', type: 'button', onclick: closeDetail }, '‹ Stilbuch');
function openStyle(s) {
  const params = { ...DEFAULTS, ...s.preset };
  showDetail(h('div', { class: 'detail' }, backBtn(),
    h('div', { class: 'hero' }, thumb('style:' + s.id, params, true)),
    h('h1', {}, s.title), h('div', { class: 'when' }, s.when),
    h('p', { class: 'lead' }, s.lead),
    h('div', { class: 'stand' }, h('b', {}, 'Wer trug ihn'), s.stand),
    s.sections.map(([t, body]) => [h('h2', {}, t), h('p', { class: 'body' }, body)]),
    h('div', { class: 'cta' }, h('button', { class: 'btn', type: 'button', onclick: () => guard(() => { loadIntoBench({ name: s.title, params, dirty: true }); go('bench'); }) }, 'Als Vorlage in der Werkbank öffnen'))));
}
function openPrint() {
  showDetail(h('div', { class: 'detail' }, backBtn(), h('h1', {}, 'Ringe drucken'),
    h('p', { class: 'lead' }, 'Jeder Ring lässt sich als STL-Datei exportieren – in Originalgröße, in Millimetern, als geschlossener Körper.'),
    PRINT_NOTES.map(([t, body]) => [h('h2', {}, t), h('p', { class: 'body' }, body)])));
}

// ========================================================== Navigation
function go(tab) {
  for (const v of document.querySelectorAll('.view')) v.hidden = v.dataset.view !== tab;
  for (const b of $('#tabbar').children) b.toggleAttribute('aria-current', b.dataset.tab === tab), b.dataset.tab === tab && b.setAttribute('aria-current', 'page');
  if (tab === 'bench') { viewer?.resize(); updateInsets(); }
  if (tab === 'gallery') renderGallery();
  if (tab === 'stack') { renderStack(); stackViewer?.resize(); }
  if (tab === 'book') renderBook();
  try { sessionStorage.setItem('ringmaker.tab', tab); } catch (e) { /* egal */ }
}
$('#tabbar').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) go(b.dataset.tab); });

renderSegs();
renderControls();
redraw(true);
addEventListener('resize', updateInsets);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { viewer?.refreshBackdrop(); stackViewer?.refreshBackdrop(); });
let startTab = 'bench';
try { startTab = sessionStorage.getItem('ringmaker.tab') || 'bench'; } catch (e) { /* egal */ }
go(startTab);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
window.ringmaker = { cur, db, viewer, go, loadIntoBench }; // für Tests
