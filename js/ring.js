// Parametrische Ring-Geometrie. Reines JavaScript ohne DOM/three.js,
// damit dieselbe Funktion Vorschau, STL-Export und Tests bedient.
//
// Koordinaten (mm): Ringachse = Z. Oberseite (Kopf/Platte) bei +Y.
// Winkel a = 0 liegt oben, a = ±PI unten.  X = r·sin(a), Y = r·cos(a).
//
// Ein Ring setzt sich aus unabhängigen Bausteinen zusammen:
//   form     Aufbau: gleichmäßig, verlaufend, mit Kopf (Siegel/Kuppel)
//   path     Verlauf der Schiene: gerade, Welle, V, Zickzack
//   closure  geschlossen, offen (Spange) oder Spirale/Bypass
//   outline  Außenkontur: rund oder Vieleck
//   contour  Kantenform: gerade, Bogenkante, Krone
//   twist    Drehung des Querschnitts um die eigene Achse
//   profile  Querschnitt · pattern Struktur · Gravur · Zweitmetall

const TAU = Math.PI * 2;

export const DEFAULTS = {
  form: 'band',          // band | taper | signet | bombe
  size: 54,              // Innenumfang in mm (= EU-Ringgröße)
  width: 5,              // Ringbreite (Schiene) in mm
  thickness: 1.8,        // Materialstärke (Schiene) in mm
  profile: 'd',
  crown: 0.8,            // Ausprägung des Profils 0..1
  edge: 0.3,             // Kantenradius in mm

  taperWidth: 9,
  taperThickness: 2.6,

  faceAcross: 14,        // Kopf: Ausdehnung quer zum Finger
  faceAlong: 11,         // Kopf: Ausdehnung entlang des Fingers
  headHeight: 3.6,       // Kopf: Materialstärke oben
  faceShape: 'oval',     // oval | cushion | square | navette

  path: 'straight',      // straight | wave | vee | zigzag
  waveAmp: 1.2,
  waveCount: 3,
  veeDepth: 3,
  veeSpread: 0.5,

  closure: 'closed',     // closed | open | spiral
  gap: 4,                // Öffnung in mm
  turns: 2.5,            // Windungen der Spirale (ab 1,1 = Bypass)
  spiralPitch: 0.6,      // Abstand zwischen den Windungen
  endStyle: 'round',     // round | flat | ball | point

  outline: 'round',      // round | poly
  outlineSides: 8,
  outlineSoft: 0.2,

  contour: 'none',       // none | scallop | crown
  contourAmp: 0.8,
  contourCount: 12,

  twist: 0,              // ganze Drehungen des Querschnitts

  pattern: 'none',
  patternDepth: 0.25,
  patternCount: 2,
  patternScale: 1,
  patternZone: 'all',    // all | center | edges

  textOuter: '',
  textInner: '',
  textTable: '',
  textSize: 0.6,
  textDepth: 0.25,
  textRaised: false,
  font: 'serif',

  material: 'gold',
  finish: 'polished',
  opacity: 1,
  inlay: 'none',         // none | center | edges | half | inside | head
  inlayWidth: 0.4,
  material2: 'silver',

  stones: 'none',        // none | solo | trio | row | around
  stoneShape: 'round',   // round | oval | octagon | square | cushion | baguette | pear | marquise
  stoneL: 4,             // Länge (mm), bei runden Steinen der Durchmesser
  stoneW: 4,             // Breite (mm)
  stoneCut: 'point',     // point = facettiert mit Spitze | flat = facettiert, flache Rückseite | cab = Cabochon
  stoneColor: 'crystal',
  stoneTurn: false,      // lange Achse quer zum Finger
  stoneCount: 5,         // Reihe
  stoneGap: 0.6,         // Abstand zwischen Steinen
  setting: 'bezel',      // flush = eingelassen | bezel = Zarge | cone = Kelch
  collar: 1.2,           // Höhe der Fassung über der Schiene
  wall: 0.8,             // Wandstärke der Fassung
  shoulder: 3,           // Auslauf des Kelchs
  clearance: 0.1,        // Spiel zwischen Stein und Sitz
};

export function normalize(p) {
  const o = { ...DEFAULTS, ...(p || {}) };
  // ältere Ringe: Welle und V waren eigene Grundformen
  if (o.form === 'wave' || o.form === 'vee') { o.path = o.form; o.form = 'band'; }
  if (o.pattern === 'facets') { o.pattern = 'none'; o.outline = 'poly'; o.outlineSides = Math.max(5, (o.patternCount || 4) + 4); o.outlineSoft = 0; }
  const num = (k, lo, hi) => {
    let v = Number(o[k]);
    if (!Number.isFinite(v)) v = DEFAULTS[k];
    o[k] = Math.min(hi, Math.max(lo, v));
  };
  num('size', 38, 80); num('width', 1, 16); num('thickness', 0.8, 5);
  num('crown', 0, 1); num('edge', 0, 1.2);
  num('taperWidth', 1, 20); num('taperThickness', 0.8, 7);
  num('faceAcross', 6, 26); num('faceAlong', 5, 24); num('headHeight', 1.5, 9);
  num('waveAmp', 0, 4); num('waveCount', 1, 12);
  num('veeDepth', 0, 8); num('veeSpread', 0.15, 1.2);
  num('gap', 0.5, 14); num('turns', 1.1, 5); num('spiralPitch', 0, 4);
  num('outlineSides', 3, 16); num('outlineSoft', 0, 1);
  num('contourAmp', 0.1, 3); num('contourCount', 3, 40);
  num('twist', 0, 16);
  num('patternDepth', 0.02, 0.8); num('patternCount', 1, 24); num('patternScale', 0.4, 2.5);
  num('textSize', 0.25, 0.95); num('textDepth', 0.05, 0.6); num('opacity', 0.15, 1);
  num('inlayWidth', 0.1, 0.9);
  num('stoneL', 1, 30); num('stoneW', 1, 30); num('stoneCount', 2, 15); num('stoneGap', 0, 6);
  num('collar', 0, 5); num('wall', 0.4, 2); num('shoulder', 0.5, 10); num('clearance', 0, 0.4);
  o.stoneCount = Math.round(o.stoneCount);
  if (o.stoneW > o.stoneL) [o.stoneL, o.stoneW] = [o.stoneW, o.stoneL];
  if (['round', 'square', 'cushion'].includes(o.stoneShape)) o.stoneW = o.stoneL;
  for (const k of ['waveCount', 'patternCount', 'outlineSides', 'contourCount', 'twist']) o[k] = Math.round(o[k]);
  if (o.closure === 'spiral') o.form = 'band';
  return o;
}

export const innerRadius = (p) => p.size / TAU;

// ---------------------------------------------------------------- Profile

function cornerDrop(ax, w, rho) {
  if (rho <= 0) return 0;
  const d = ax - (w - rho);
  if (d <= 0) return 0;
  return rho - Math.sqrt(Math.max(0, rho * rho - d * d));
}
const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

const _po = [0, 0];
// Höhe der Außen- (o) und Innenkontur (i) über der Fingerfläche an Stelle x.
export function profileAt(type, x, w, t, crown, edge, out = _po) {
  const q = Math.max(-1, Math.min(1, x / w)), aq = Math.abs(q), ax = aq * w;
  const arc = Math.sqrt(Math.max(0, 1 - q * q));
  let o, i;
  const ri = Math.min(edge * 0.6, w * 0.5, t * 0.3);
  const rho = Math.min(edge, w * 0.5, t * 0.3);
  switch (type) {
    case 'flat': {
      const r = Math.min(edge, w * 0.9, t * 0.45);
      o = t - crown * 0.25 * t * q * q - cornerDrop(ax, w, r);
      i = cornerDrop(ax, w, ri);
      break;
    }
    case 'comfort': {
      const hi = t * 0.22;
      const hs = hi + t * 0.45 * (1 - crown);
      i = hi * q * q;
      o = hs + (t - hs) * arc;
      break;
    }
    case 'lens': {
      const hi = t * (0.25 + 0.2 * crown);
      i = hi * q * q;
      o = hi + (t - hi) * arc;
      break;
    }
    case 'round': {
      o = t / 2 + (t / 2) * arc;
      i = t / 2 - (t / 2) * arc;
      break;
    }
    case 'cushion': {
      const n = 2.4 + 4 * crown;
      const s = Math.pow(Math.max(0, 1 - Math.pow(aq, n)), 1 / n);
      o = t / 2 + (t / 2) * s;
      i = t / 2 - (t / 2) * s;
      break;
    }
    case 'knife': {
      const hs = t * (0.22 + 0.4 * (1 - crown));
      const e = 0.07, n = Math.sqrt(1 + e * e);
      const f = (n - Math.sqrt(q * q + e * e)) / (n - e);
      o = hs + (t - hs) * f;
      i = cornerDrop(ax, w, Math.min(ri, hs * 0.8));
      break;
    }
    case 'bevel': {
      const c = w * (0.2 + 0.55 * crown);
      const hs = t * 0.5;
      const k = Math.max(0, (ax - (w - c)) / c);
      o = t - (t - hs) * k;
      i = cornerDrop(ax, w, ri);
      break;
    }
    case 'concave': {
      const dep = t * (0.08 + 0.3 * crown);
      const b = 1 - q * q;
      o = t - dep * b * b - cornerDrop(ax, w, rho);
      i = cornerDrop(ax, w, ri);
      break;
    }
    case 'step': {         // erhöhte Mittelbahn
      const c = w * (0.3 + 0.4 * crown), hs = t * 0.62, e = Math.max(0.12, w * 0.06);
      o = hs + (t - hs) * sm((c - ax) / e + 0.5) - cornerDrop(ax, w, rho * 0.7);
      i = cornerDrop(ax, w, ri);
      break;
    }
    case 'channel': {      // erhöhte Ränder, vertiefte Mitte
      const r = w * 0.3, dep = t * (0.14 + 0.32 * crown), e = Math.max(0.12, w * 0.06);
      o = t - dep * sm((w - r - ax) / e + 0.5) - cornerDrop(ax, w, rho * 0.7);
      i = cornerDrop(ax, w, ri);
      break;
    }
    case 'bead': {         // flach mit Mittelwulst
      const c = w * (0.22 + 0.3 * crown), hs = t * 0.6;
      o = (ax < c ? hs + (t - hs) * Math.sqrt(1 - (ax / c) * (ax / c)) : hs) - cornerDrop(ax, w, rho * 0.7);
      i = cornerDrop(ax, w, ri);
      break;
    }
    case 'double': {       // zwei Wülste nebeneinander
      const u = (ax - w / 2) / (w / 2), dep = 0.25 + 0.55 * crown;
      o = t * (1 - dep * (1 - Math.sqrt(Math.max(0, 1 - u * u))));
      i = cornerDrop(ax, w, Math.min(ri, t * (1 - dep) * 0.8));
      break;
    }
    case 'triple': {       // drei Wülste
      const u = ax < w / 3 ? ax / (w / 3) : (ax - 2 * w / 3) / (w / 3), dep = 0.25 + 0.5 * crown;
      o = t * (1 - dep * (1 - Math.sqrt(Math.max(0, 1 - u * u))));
      i = cornerDrop(ax, w, Math.min(ri, t * (1 - dep) * 0.8));
      break;
    }
    case 'rimmed': {       // großer Mittelwulst, kleine Randwülste
      const hw = w * (0.13 + 0.12 * crown), c = w - 2 * hw, hv = t * 0.3, hr = t * 0.62;
      if (ax < c) o = hv + (t - hv) * Math.sqrt(Math.max(0, 1 - (ax / c) * (ax / c)));
      else { const u = (ax - (w - hw)) / hw; o = hv + (hr - hv) * Math.sqrt(Math.max(0, 1 - u * u)); }
      i = cornerDrop(ax, w, Math.min(ri, hv * 0.7));
      break;
    }
    case 'slant': {        // Pultprofil: eine Seite hoch, eine niedrig
      const lo = t * (1 - 0.65 * crown);
      o = lo + (t - lo) * (q + 1) / 2 - cornerDrop(ax, w, Math.min(rho, lo * 0.6));
      i = cornerDrop(ax, w, Math.min(ri, lo * 0.5));
      break;
    }
    case 'd':
    default: {
      const hs = t * 0.55 * (1 - crown);
      o = hs + (t - hs) * arc;
      i = cornerDrop(ax, w, Math.min(ri, hs * 0.8));
    }
  }
  out[0] = o; out[1] = i;
  return out;
}

// ------------------------------------------------- Formverlauf um den Ring

const FACE = {
  oval: { m: 2, tau: 0.8 },
  cushion: { m: 3.6, tau: 0.86 },
  square: { m: 8, tau: 0.92 },
  navette: { m: 1.25, tau: 0.62 },
};
const SHOULDER = 2.5; // Winkel (rad), bis zu dem die Schultern auslaufen
const DOME_E = 0.62;  // <1: Flanken des Kopfes fallen gerader ab
const BETA_E = 2.4;   // sorgt für weichen Auslauf der Schultern

const dome = (q, m) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(q), m)), DOME_E);
const tri = (x) => { const f = x - Math.floor(x); return f < 0.5 ? 2 * f : 2 - 2 * f; }; // 0..1..0

// ---------------------------------------------------------------- Steine
// Umrissmaß eines Steins: 1 auf der Rundiste, <1 innen, >1 außen.
// l = Koordinate entlang der langen Achse, w = quer dazu; hl/hw = halbe Maße.
const PEAR = (t) => Math.pow(Math.max(0, 1 - t), 0.6) * Math.pow(Math.max(0, 1 + t), 0.5);
export function stoneRho(shape, l, w, hl, hw) {
  const a = Math.abs(l) / hl, b = Math.abs(w) / hw;
  switch (shape) {
    case 'octagon': return Math.max(a, b, (a + b) / 1.72);
    case 'square': return Math.pow(Math.pow(a, 10) + Math.pow(b, 10), 0.1);
    case 'baguette': return Math.pow(Math.pow(a, 12) + Math.pow(b, 12), 1 / 12);
    case 'cushion': return Math.pow(Math.pow(a, 4) + Math.pow(b, 4), 0.25);
    case 'marquise': return (b + Math.sqrt(b * b + 4 * a * a)) / 2;
    case 'pear': {
      let lo = Math.max(a, 1e-6), hi = Math.max(a, b) * 2.2 + 1e-6; // Maßstab k mit b/k = PEAR(l/(k·hl))
      for (let i = 0; i < 14; i++) {
        const k = (lo + hi) / 2;
        if (b / k > PEAR(l / hl / k)) lo = k; else hi = k;
      }
      return hi;
    }
    default: return Math.sqrt(a * a + b * b);
  }
}
const BOXY = { octagon: 3.2, square: 6, baguette: 8, cushion: 3.4 };

// Sitztiefe unter der Oberkante der Fassung
function seatDepth(cut, wmin) {
  if (cut === 'point') return 0.15 + 0.43 * wmin;     // Kegel für die Steinspitze
  if (cut === 'flat') return Math.max(0.4, 0.14 * wmin);
  return Math.max(0.5, 0.1 * wmin);                     // Cabochon
}

function placeSites(p, d) {
  d.sites = [];
  if (p.stones === 'none' || d.spiral || d.twist) return;
  const hl = p.stoneL / 2, hw = p.stoneW / 2;
  const hu0 = p.stoneTurn ? hl : hw, hv0 = p.stoneTurn ? hw : hl; // u = quer zum Finger (Umlauf), v = längs
  const Rref = d.siteRef = d.Rin + d.tb;
  const collar = p.setting === 'flush' ? 0 : p.collar;
  const skirt = p.setting === 'cone' ? p.shoulder : p.setting === 'bezel' ? 0.35 : 0.3;
  const list = [];
  const pitch = (k1, k2) => (hu0 * k1 + hu0 * k2 + Math.max(p.stoneGap, p.setting === 'flush' ? 0.3 : 2 * p.wall * 0.6) + 2 * p.clearance) / Rref;
  if (p.stones === 'solo') list.push([0, 1]);
  else if (p.stones === 'trio') { const k = 0.62, da = pitch(1, k); list.push([-da, k], [0, 1], [da, k]); }
  else if (p.stones === 'row') { const da = pitch(1, 1), n = p.stoneCount; for (let i = 0; i < n; i++) list.push([(i - (n - 1) / 2) * da, 1]); }
  else if (p.stones === 'around') { const n = Math.max(3, Math.floor(TAU / pitch(1, 1))); for (let i = 0; i < n; i++) list.push([-Math.PI + (i + 0.5) * TAU / n, 1]); }
  const c = newCol(), po = [0, 0];
  for (const [a, k] of list) {
    if (Math.abs(a) > Math.PI) continue;
    colAt(p, d, (a + Math.PI) / TAU, c);
    profileAt(p.profile, 0, c.w, c.t, p.crown, p.edge, po);
    let o = po[0];
    if (c.beta > 0) o = (1 - c.beta) * o + c.beta * d.Tpeak;
    let nat = d.Rin + o;
    if (d.table && Math.cos(a) > 0) nat = Math.min(nat, d.H / Math.cos(a));
    const hu = hu0 * k, hv = hv0 * k, wmin = Math.min(hu, hv) * 2;
    const depth = seatDepth(p.stoneCut, wmin);
    const floorN = d.Rin + 0.8;
    const Hc = Math.max(nat + collar, floorN + depth);
    d.sites.push({
      a, sin: Math.sin(a), cos: Math.cos(a), zs: c.x0, hu, hv, rm: Math.min(hu, hv), Hc, depth, floorN,
      rise: Hc - nat, skirt: Math.max(skirt, 0.55 * (Hc - nat + 0.5)), skirtV: Math.max(0.4, 0.55 * (Hc - nat + 0.5)), foot: p.clearance + p.wall + 0.75 + 1.0 * (Hc - nat), flare: p.setting === 'cone' ? skirt * 1.1 : 0,
      reach: hu + p.clearance + p.wall + Math.max(skirt, 0.55 * (Hc - nat + 0.5)) * 1.8, reachV: hv + p.clearance + p.wall + 0.8 + 1.1 * (Hc - nat),
    });
  }
}

function derive(p) {
  const Rin = innerRadius(p);
  const wb = p.width / 2, tb = p.thickness;
  const d = { Rin, wb, tb, head: false, table: false, open: p.closure !== 'closed', spiral: p.closure === 'spiral' };
  if (p.form === 'signet' || p.form === 'bombe') {
    const f = FACE[p.faceShape] || FACE.oval;
    const Ttop = Math.max(p.headHeight, tb + 0.2);
    const hs = Math.min(tb * 0.7, Ttop * 0.4);
    d.head = true; d.hs = hs;
    const tbo = profileAt(p.profile, 0, wb, tb, p.crown, p.edge)[0];
    let Tpeak, betaL, aL;
    if (p.form === 'signet') {
      d.table = true; d.m = f.m;
      d.H = Rin + Ttop;
      Tpeak = hs + (Ttop - hs) / dome(f.tau, f.m);
      d.Wtop = Math.max(wb, p.faceAlong / 2 / f.tau);
      aL = Math.atan2(p.faceAcross / 2, d.H);
      const need = d.H / Math.cos(aL) - Rin;
      if (need > tbo + (Tpeak - tbo) * 0.94) Tpeak = tbo + (need - tbo) / 0.94;
      betaL = (need - tbo) / (Tpeak - tbo);
    } else {
      d.m = p.faceShape === 'navette' ? 1.5 : 2;
      Tpeak = Ttop;
      d.Wtop = Math.max(wb, p.faceAlong / 2);
      aL = Math.atan2(p.faceAcross / 2, Rin + Ttop);
      betaL = 0.55;
    }
    aL = Math.min(aL, SHOULDER * 0.75);
    betaL = Math.min(0.94, Math.max(0.05, betaL));
    d.Tpeak = Tpeak;
    const e1 = Math.log(1 - Math.pow(betaL, 1 / BETA_E)) / Math.log(aL / SHOULDER);
    d.e1 = Math.min(9, Math.max(1.25, e1));
  }
  // Öffnung: bei schlichten Ringen oben, bei Ringen mit Kopf/Verlauf unten
  const Rmid = Rin + tb / 2;
  if (d.spiral) {
    d.span = p.turns * TAU;
    d.th0 = Math.PI - d.span / 2;
    d.pitch = p.width + p.spiralPitch;
  } else if (d.open) {
    const g = Math.min(p.gap / Rmid, 2.2);
    const center = p.form === 'band' && p.stones === 'none' ? 0 : Math.PI;
    d.span = TAU - g;
    d.th0 = center + g / 2;
  }
  d.len = d.open ? d.span * Rmid : TAU * Rmid;
  d.endR = Math.max(wb, tb / 2);
  d.twist = d.head ? 0 : p.twist;
  d.lift = d.twist ? Math.max(0, Math.hypot(wb, tb / 2) - tb / 2) : 0;
  d.sites = [];
  placeSites(p, d);
  return d;
}

// Größen einer „Spalte“ (Querschnitt an einer Stelle des Umlaufs)
function colAt(p, d, tt, c) {
  const theta = d.open ? d.th0 + tt * d.span : -Math.PI + tt * TAU;
  const a = theta - TAU * Math.round(theta / TAU);
  const aa = Math.abs(a);
  let w = d.wb, t = d.tb, beta = 0, x0 = 0, e = 1;
  if (p.form === 'taper') {
    const k = Math.pow(0.5 + 0.5 * Math.cos(a), 1.6);
    w = d.wb + (p.taperWidth / 2 - d.wb) * k;
    t = d.tb + (p.taperThickness - d.tb) * k;
  } else if (d.head) {
    if (aa < SHOULDER) beta = Math.pow(1 - Math.pow(aa / SHOULDER, d.e1), BETA_E);
    w = d.wb + (d.Wtop - d.wb) * Math.pow(beta, 0.85);
  }
  for (let i = 0; i < d.sites.length; i++) { // Schiene trägt die Fassung: bei Bedarf verbreitern
    const st = d.sites[i];
    let da = a - st.a; da -= TAU * Math.round(da / TAU);
    const su = Math.abs(da) * d.siteRef, ext = st.hu + st.foot + st.flare;
    if (su < ext) {
      const n = st.flare ? 2 : (BOXY[p.stoneShape] || 2);
      const z = (st.hv + st.foot) * Math.pow(1 - Math.pow(su / ext, n), 1 / n) + 0.12;
      w = 0.5 * (w + z + Math.sqrt((w - z) * (w - z) + 0.03));
    }
  }
  const calm = 1 - beta; // am Kopf laufen Verlauf und Kantenform aus
  if (p.path === 'wave') x0 = p.waveAmp * Math.cos(p.waveCount * theta) * calm;
  else if (p.path === 'zigzag') {
    const z = tri(p.waveCount * theta / TAU + 0.5) * 2 - 1;
    x0 = p.waveAmp * (Math.sign(z) * (1 - Math.pow(1 - Math.abs(z), 1.6))) * calm;
  } else if (p.path === 'vee') x0 = p.veeDepth * Math.exp(-(Math.sqrt(a * a + 0.02) - 0.1414) / p.veeSpread) * calm;
  if (d.spiral) x0 += d.pitch * (tt - 0.5) * p.turns;

  let wL = w, wR = w;
  if (p.contour === 'scallop') {
    const k = p.contourAmp * 0.5 * (1 - Math.abs(Math.cos(p.contourCount * theta / 2))) * 2 * calm;
    wL = Math.max(0.3, w - k); wR = wL;
  } else if (p.contour === 'crown') {
    wR = w + p.contourAmp * 1.6 * Math.pow(tri(p.contourCount * theta / TAU), 1.2) * calm;
  }
  if (d.open) {
    const dist = Math.min(tt, 1 - tt) * d.len, r = d.endR;
    if (p.endStyle === 'round') { if (dist < r) e = Math.sqrt(Math.max(0, 1 - (1 - dist / r) * (1 - dist / r))); }
    else if (p.endStyle === 'ball') {
      const rb = r * 1.75;
      if (dist < 2 * rb) {
        const eb = Math.sqrt(Math.max(0, 1 - ((dist - rb) / rb) * ((dist - rb) / rb))) * 1.75;
        e = dist < rb ? eb : Math.max(eb, 1);
      }
    } else if (p.endStyle === 'point') {
      const L = Math.min(d.len * 0.3, 16);
      if (dist < L) e = Math.pow(dist / L, 0.75);
    }
    e = Math.max(e, 0.04);
  }
  c.theta = theta; c.a = a; c.w = w; c.wL = wL; c.wR = wR; c.t = t; c.beta = beta; c.x0 = x0; c.e = e;
  return c;
}
const newCol = () => ({ theta: 0, a: 0, w: 0, wL: 0, wR: 0, t: 0, beta: 0, x0: 0, e: 1 });

// Axiale Ausdehnung je Winkel – für passgenaues Stapeln.
export const EXTENT_STEPS = 72;
export function ringExtents(p0) {
  const p = normalize(p0), d = derive(p);
  const lo = new Float32Array(EXTENT_STEPS).fill(Infinity), hi = new Float32Array(EXTENT_STEPS).fill(-Infinity);
  const n = Math.ceil(EXTENT_STEPS * 3 * (d.spiral ? p.turns : 1)), c = newCol();
  const grow = d.twist ? Math.hypot(d.wb, d.tb / 2) - d.wb : 0;
  let min = Infinity, max = -Infinity;
  for (let k = 0; k <= n; k++) {
    colAt(p, d, Math.min(k / n, 0.99999), c);
    const b = Math.min(EXTENT_STEPS - 1, Math.floor((c.a + Math.PI) / TAU * EXTENT_STEPS));
    const l = c.x0 - c.wL * Math.max(c.e, 0.2) - grow, h = c.x0 + c.wR * Math.max(c.e, 0.2) + grow;
    if (l < lo[b]) lo[b] = l;
    if (h > hi[b]) hi[b] = h;
    if (l < min) min = l;
    if (h > max) max = h;
  }
  return { lo, hi, min, max };
}

// ------------------------------------------------------------ Oberflächen

function hash2(i, j) {
  let h = (i * 374761393 + j * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function hammer(s, x, C, cell) {
  const n = Math.max(3, Math.round(C / cell)), cw = C / n;
  const u = s / cw, v = x / cw;
  const iu = Math.floor(u), iv = Math.floor(v);
  let best = 9;
  for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
    const ci = iu + di, cj = iv + dj;
    const wi = ((ci % n) + n) % n;
    const fx = ci + 0.15 + 0.7 * hash2(wi, cj);
    const fy = cj + 0.15 + 0.7 * hash2(wi + 57, cj + 131);
    const dd = (fx - u) * (fx - u) + (fy - v) * (fy - v);
    if (dd < best) best = dd;
  }
  return Math.max(0, 1 - best / 0.55); // 1 in der Mulde, 0 am Grat
}

// weiches Rauschen, in u nahtlos über n Zellen
function vnoise(u, v, n) {
  const iu = Math.floor(u), iv = Math.floor(v), fu = u - iu, fv = v - iv;
  const su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
  const w0 = ((iu % n) + n) % n, w1 = (w0 + 1) % n;
  const a = hash2(w0, iv), b = hash2(w1, iv), c = hash2(w0, iv + 1), e = hash2(w1, iv + 1);
  return (a + (b - a) * su) * (1 - sv) + (c + (e - c) * su) * sv;
}

function sampleMap(map, u, v) {
  if (!map || u < 0 || u > 1 || v < 0 || v > 1) return 0;
  const x = u * (map.w - 1), y = v * (map.h - 1);
  const x0 = x | 0, y0 = y | 0;
  const x1 = Math.min(map.w - 1, x0 + 1), y1 = Math.min(map.h - 1, y0 + 1);
  const fx = x - x0, fy = y - y0, d = map.data, w = map.w;
  return ((d[y0 * w + x0] * (1 - fx) + d[y0 * w + x1] * fx) * (1 - fy) +
    (d[y1 * w + x0] * (1 - fx) + d[y1 * w + x1] * fx) * fy) / 255;
}

// Ornamentbänder als kleine Kacheln ('#' = vertiefte Linie), endlos wiederholt.
const MOTIFS = {
  meander: ['..######', '..#....#', '..#.##.#', '..#..#.#', '..####.#', '.......#', '########'],
  fret: ['####......', '#..#......', '#.##....#.', '#......##.', '#.....###.', '#....####.', '##########'],
  steps: ['...####...', '...#..#...', '.###..###.', '.#......#.', '##......##'],
};
for (const k in MOTIFS) MOTIFS[k] = { rows: MOTIFS[k].length, cols: MOTIFS[k][0].length, bits: MOTIFS[k].map((r) => [...r].map((c) => (c === '#' ? 1 : 0))) };
function motif(m, u, v) { // u in Kachelbreiten (endlos), v in 0..1 über die Bandhöhe
  if (v < 0 || v > 1) return 0;
  const fx = (u - Math.floor(u)) * m.cols - 0.5, fy = v * m.rows - 0.5;
  const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
  const at = (x, y) => (y < 0 || y >= m.rows ? 0 : m.bits[y][((x % m.cols) + m.cols) % m.cols]);
  const val = (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty;
  return sm((val - 0.5) * 2.2 + 0.5);
}

const FINE = ['meander', 'fret', 'steps', 'milgrain', 'hammered', 'rope', 'knurl', 'dots', 'pyramids', 'bark', 'scales', 'ribs', 'waves', 'diagonal'];
export function needsDetail(p) {
  return FINE.includes(p.pattern) || p.twist > 0 || p.contour !== 'none' || p.stones !== 'none' ||
    !!(p.textOuter || p.textInner || (p.textTable && p.form === 'signet'));
}

// ------------------------------------------------------------------ Aufbau

export function buildRing(p0, opts = {}) {
  const p = normalize(p0);
  const d = derive(p);
  const maps = opts.maps || {};
  const exportQ = opts.quality === 'export';
  const light = opts.quality === 'light'; // für Ansichten mit mehreren Ringen
  const detail = needsDetail(p);
  const hasInnerText = !!(p.textInner && maps.inner);
  const hasTableText = !!(p.textTable && maps.table && d.table);

  let nU = exportQ ? (detail ? 1040 : 520) : light ? (detail ? 400 : 220) : (detail ? 600 : 340);
  if (d.spiral) nU = Math.round(nU * Math.min(3, Math.max(1, p.turns * 0.8)));
  const nO = exportQ ? (detail ? 132 : 64) : light ? (detail ? 56 : 32) : (detail ? 84 : 48);
  const nI = hasInnerText || d.twist ? nO : (exportQ ? 32 : 22);
  const nS = 3;
  const nV = nO + nI + 2 * nS;
  const open = d.open;
  const nVert = nU * nV + (open ? 2 : 0);

  const { Rin, wb, tb } = d;
  const Cout = TAU * (Rin + tb);
  const topStones = d.sites.length > 0 && d.sites.every((st) => Math.abs(st.a) < 1);
  const warp = d.head || topStones ? (hasTableText || topStones ? 0.72 : 0.55) : 0;
  const sites = d.sites, stoneShape = p.stoneShape, turn = p.stoneTurn, clr = p.clearance, wallT = p.wall, pointCut = p.stoneCut === 'point';

  const pos = new Float32Array(nVert * 3);
  const zone = new Uint8Array(nVert); // 1 = Zweitmetall
  const pat = p.pattern;
  const pd = Math.min(p.patternDepth, tb * 0.45);
  const sc = p.patternScale;
  const td = Math.min(p.textDepth, tb * 0.5) * (p.textRaised ? 1 : -1);
  const tdIn = Math.min(p.textDepth, tb * 0.4);
  const around = (pitch) => Math.max(6, Math.round(Cout / (pitch / sc)));
  const fluteN = around(1.8), ropeN = around(2.2), knurlN = around(1.5), ribN = around(0.9);
  const dotN = around(1.5), pyrN = around(1.6), scaleN = around(2.0), diagN = around(1.6), waveN = Math.max(3, Math.round(around(5) / 1));
  const beadN = Math.max(8, Math.round(Cout / (Math.max(p.width, 1.6) * 1.05 / sc)));
  const barkN = around(0.9);
  const mot = MOTIFS[pat];
  let motN = 0, motH = 0;
  if (mot) {
    motH = Math.min(p.width * 0.78, p.width * 0.62 / Math.sqrt(sc) + 0.4);
    motN = Math.max(3, Math.round(Cout / (motH / mot.rows * mot.cols)));
  }
  const mgR = Math.min(Math.max(0.22, pd * 1.2), wb * 0.4);
  const mgN = Math.max(12, Math.round(Cout / (2 * mgR)));
  const grooveG = Math.max(0.16, pd * 0.8);
  const tabW = p.faceAcross * 0.8, tabH = p.faceAlong * 0.8;
  const polyN = p.outlineSides, polyOn = p.outline === 'poly';
  const polyMax = 1 / Math.cos(Math.PI / polyN) - 1;
  const inlay = p.inlay, iw = p.inlayWidth;

  let minWall = Infinity, maxR = 0, zLo = Infinity, zHi = -Infinity;
  const po = [0, 0], col = newCol(), colSites = [];

  // Verteilung der Profilpunkte (an den Kanten dichter)
  const qs = new Float32Array(nO), qi = new Float32Array(nI);
  for (let j = 0; j < nO; j++) {
    const s = -1 + 2 * j / (nO - 1);
    qs[j] = 0.55 * Math.sin(s * Math.PI / 2) + 0.45 * s;
  }
  for (let j = 0; j < nI; j++) {
    const s = 1 - 2 * j / (nI - 1);
    qi[j] = 0.55 * Math.sin(s * Math.PI / 2) + 0.45 * s;
  }

  for (let iu = 0; iu < nU; iu++) {
    let tt;
    if (open) {
      const s = iu / (nU - 1);
      tt = 0.55 * s + 0.45 * (0.5 - 0.5 * Math.cos(Math.PI * s)); // an den Enden dichter
    } else {
      const v = -1 + 2 * iu / nU;
      tt = 0.5 + 0.5 * ((1 - warp) * v + warp * v * v * v);
    }
    colAt(p, d, tt, col);
    const a = col.a, theta = col.theta;
    const sinA = Math.sin(a), cosA = Math.cos(a);
    let w = col.w, wL = col.wL, wR = col.wR;
    const t = col.t, beta = col.beta, x0 = col.x0, e = col.e;
    const fade = beta <= 0.02 ? 1 : beta >= 0.3 ? 0 : 1 - (beta - 0.02) / 0.28;
    const s = (theta + Math.PI) * (Rin + tb);
    const ua = (a + Math.PI) / TAU;
    const uu = (theta + Math.PI) / TAU; // läuft bei Spiralen über 1 hinaus

    let bead = 1;
    if (pat === 'beads') {
      const f = (((uu * beadN) % 1) + 1) % 1, c = 2 * f - 1;
      bead = 0.5 + 0.5 * Math.sqrt(Math.max(0, 1 - c * c));
      bead = 1 - (1 - bead) * fade;
      const k = 0.62 + 0.38 * bead;
      w *= k; wL *= k; wR *= k;
    }
    let poly = 0;
    if (polyOn) {
      const seg = TAU / polyN;
      const l = ((a + seg / 2) % seg + seg) % seg - seg / 2;
      poly = Math.min(1 / Math.cos(l) - 1, polyMax * (1 - 0.7 * p.outlineSoft)) * (Rin + tb) * fade;
    }
    const cH = t / 2;
    colSites.length = 0;
    for (let si = 0; si < sites.length; si++) {
      let da = a - sites[si].a; da -= TAU * Math.round(da / TAU);
      if (Math.abs(da) * (Rin + tb) < sites[si].reach + 1.5 && Math.abs(da) < 1.2) colSites.push(sites[si]);
    }
    const phi = d.twist ? d.twist * theta : 0;
    const cosP = Math.cos(phi), sinP = Math.sin(phi);
    const shaped = e !== 1 || d.twist;

    const heights = (q) => {
      profileAt(p.profile, q * w, w, t, p.crown, p.edge, po);
      let o = po[0], i = po[1];
      if (beta > 0) {
        o = (1 - beta) * o + beta * (d.hs + (d.Tpeak - d.hs) * dome(q, d.m));
        i = (1 - beta) * i;
      }
      if (bead !== 1) {
        const mid = t / 2;
        o = mid + (o - mid) * bead; i = mid - (mid - i) * bead;
      }
      po[0] = o + poly; po[1] = i;
    };

    const put = (j, q, h, kind) => { // kind: 0 außen, 1 Flanke, 2 innen
      let x = q * (q < 0 ? wL : wR);
      if (shaped) {
        let dx = x * e, dh = (h - cH) * e;
        if (d.twist) { const nx = dx * cosP - dh * sinP; dh = dx * sinP + dh * cosP; dx = nx; }
        x = dx; h = cH + d.lift + dh;
      }
      const r = Rin + h;
      let X = r * sinA, Y = r * cosA;
      const k = iu * nV + j;
      if (kind !== 2 && d.table && cosA > 0 && Y > d.H) {
        Y = d.H;
        if (hasTableText) Y -= tdIn * sampleMap(maps.table, 0.5 + X / tabW, 0.5 + x / tabH);
      }
      if (kind === 0) for (let si = 0; si < colSites.length; si++) {
        const st = colSites[si];
        const u = X * st.cos - Y * st.sin, v = x0 + x - st.zs;
        if (Math.abs(u) > st.reach || Math.abs(v) > st.reachV) continue;
        const rho = turn ? stoneRho(stoneShape, u, v, st.hu, st.hv) : stoneRho(stoneShape, v, u, st.hv, st.hu);
        const ex = (rho - 1) * st.rm;
        if (ex > clr + wallT + st.skirt * 1.8) continue;
        const n0 = X * st.sin + Y * st.cos;
        let n1;
        if (ex <= clr) {
          const dep = pointCut ? 0.15 + (st.depth - 0.15) * Math.max(0, 1 - rho) : st.depth;
          n1 = Math.max(st.floorN, st.Hc - dep * sm((clr - ex) / 0.14));
          if (n1 - Rin < minWall) minWall = n1 - Rin;
        } else if (ex <= clr + wallT) n1 = st.Hc;
        else { // Auslauf: seitlich steil, in Umlaufrichtung als Schulter
          const dist = ex - clr - wallT;
          const cu = (u * u) / (u * u + v * v + 1e-6);
          const L = st.skirtV + (st.skirt - st.skirtV) * cu * cu * (3 - 2 * cu);
          if (dist > L * 1.8) continue;
          const cone = st.Hc - (st.rise + 0.5) / L * dist;
          const mx = 0.5 * (n0 + cone + Math.sqrt((n0 - cone) * (n0 - cone) + 0.12));
          n1 = n0 + (mx - n0) * (1 - sm((dist - L * 1.3) / (L * 0.5)));
        }
        X += st.sin * (n1 - n0); Y += st.cos * (n1 - n0);
        break;
      }
      pos[k * 3] = X; pos[k * 3 + 1] = Y; pos[k * 3 + 2] = x0 + x;
      const rr = X * X + Y * Y;
      if (rr > maxR) maxR = rr;
      if (x0 + x < zLo) zLo = x0 + x;
      if (x0 + x > zHi) zHi = x0 + x;
      if (inlay !== 'none') {
        const aq = Math.abs(q);
        zone[k] = inlay === 'center' ? (kind === 0 && aq < iw ? 1 : 0)
          : inlay === 'edges' ? (kind !== 2 && aq > 1 - iw ? 1 : 0)
            : inlay === 'half' ? (q > 0 ? 1 : 0)
              : inlay === 'inside' ? (kind === 2 || (kind === 1 && h < t * 0.5) ? 1 : 0)
                : inlay === 'head' ? (beta > 0.45 ? 1 : 0) : 0;
      }
    };

    let oL = 0, iL = 0, oR = 0, iR = 0;
    // Außenfläche
    for (let j = 0; j < nO; j++) {
      const q = qs[j], x = q * w;
      heights(q);
      let o = po[0];
      const i = po[1];
      if (fade > 0) {
        let dsp = 0;
        const aq = Math.abs(q);
        const zw = p.patternZone === 'center' ? 1 - sm((aq - 0.42) / 0.12) : p.patternZone === 'edges' ? sm((aq - 0.46) / 0.12) : 1;
        if (zw > 0) switch (pat) {
          case 'grooves': {
            const n = Math.min(p.patternCount, 7);
            for (let g = 1; g <= n; g++) {
              const xg = (-1 + 2 * g / (n + 1)) * w, ee = (x - xg) / grooveG;
              dsp -= pd * Math.exp(-ee * ee);
            }
            break;
          }
          case 'meander': case 'fret': case 'steps': dsp = -pd * motif(mot, uu * motN, 0.5 - x / motH); break;
          case 'flutes': dsp = -pd * (0.5 - 0.5 * Math.cos(fluteN * theta)); break;
          case 'ribs': dsp = -pd * tri(ribN * uu); break;
          case 'diagonal': dsp = -pd * Math.pow(0.5 + 0.5 * Math.cos(diagN * theta + x * 2.4 * sc), 3); break;
          case 'waves': {
            const ph = (x + 0.45 * Math.sin(waveN * theta)) * 5.2 * sc;
            dsp = -pd * Math.pow(0.5 + 0.5 * Math.cos(ph), 4);
            break;
          }
          case 'milgrain': {
            const dx = (Math.abs(x) - (w - mgR * 1.15)) / mgR;
            const ds = ((((uu * mgN) % 1) + 1) % 1) * 2 - 1;
            const b = 1 - dx * dx - ds * ds;
            if (b > 0) dsp = mgR * 0.75 * Math.sqrt(b);
            else if (dx < -1 && dx > -1.9) dsp = -mgR * 0.35 * Math.sin((dx + 1.9) / 0.9 * Math.PI);
            break;
          }
          case 'hammered': dsp = -pd * hammer(s, x + 40, Cout, 1.7 / sc); break;
          case 'bark': {
            const u1 = uu * barkN, v1 = (x + 40) * 0.28 * sc;
            const n1 = vnoise(u1, v1, barkN) * 0.6 + vnoise(u1 * 2, v1 * 2.3 + 9, barkN * 2) * 0.28 + vnoise(u1 * 4, v1 * 5 + 3, barkN * 4) * 0.12;
            dsp = -pd * 1.5 * Math.abs(n1 - 0.5) * 2;
            break;
          }
          case 'rope': dsp = pd * 1.6 * (Math.sqrt(Math.abs(Math.sin(ropeN * theta / 2 + q * 1.1))) - 1); break;
          case 'knurl': {
            const k1 = Math.max(0, Math.cos(knurlN * theta + q * w * 2.2 * sc));
            const k2 = Math.max(0, Math.cos(knurlN * theta - q * w * 2.2 * sc));
            dsp = -pd * Math.pow(Math.max(k1, k2), 5);
            break;
          }
          case 'dots': {
            const cw = Cout / dotN, row = Math.round(x / (cw * 0.87));
            const fu = uu * dotN + (row & 1 ? 0.5 : 0), du = (fu - Math.round(fu)) * cw, dv = x - row * cw * 0.87;
            const rr = (du * du + dv * dv) / (cw * cw * 0.1);
            if (rr < 1 && Math.abs(row * cw * 0.87) < w - cw * 0.3) dsp = -pd * (1 - rr) * (1 - rr);
            break;
          }
          case 'pyramids': {
            const cw = Cout / pyrN;
            const fu = uu * pyrN, fv = x / cw + 0.5;
            const du = Math.abs(fu - Math.floor(fu) - 0.5) * 2, dv = Math.abs(fv - Math.floor(fv) - 0.5) * 2;
            dsp = -pd * 1.4 * Math.max(du, dv);
            break;
          }
          case 'scales': {
            const cw = Cout / scaleN, rowH = cw * 0.55;
            let best = 0;
            for (let dr = 0; dr <= 1; dr++) {
              const row = Math.floor(x / rowH) + dr;
              const fu = uu * scaleN + (row & 1 ? 0.5 : 0), du = (fu - Math.round(fu)) * cw, dv = row * rowH - x;
              const k = 1 - (du * du + dv * dv * 0.55) / (cw * cw * 0.3);
              if (k > best) best = k * (0.35 + 0.65 * (dv / rowH));
            }
            dsp = -pd * 1.3 * (1 - Math.min(1, Math.max(0, best) * 1.6));
            break;
          }
        }
        dsp *= zw;
        if (maps.outer && p.textOuter) dsp += td * sampleMap(maps.outer, ua, 0.5 - q * 0.5);
        o += dsp * fade;
      }
      if (o < i + 0.06) o = i + 0.06;
      if (o - i < minWall && Math.abs(q) < 0.6) minWall = o - i;
      if (j === 0) { oL = o; iL = i; } else if (j === nO - 1) { oR = o; iR = i; }
      put(j, q, o, 0);
    }
    for (let j = 0; j < nS; j++) put(nO + j, 1, oR + (iR - oR) * (j + 1) / (nS + 1), 1);
    for (let j = 0; j < nI; j++) {
      const q = qi[j];
      heights(q);
      let i = po[1];
      if (hasInnerText) i += tdIn * sampleMap(maps.inner, ua, 0.5 - q * 0.5);
      put(nO + nS + j, q, i, 2);
    }
    for (let j = 0; j < nS; j++) put(nO + nS + nI + j, -1, iL + (oL - iL) * (j + 1) / (nS + 1), 1);
  }

  const rows = open ? nU - 1 : nU;
  const idx = new Uint32Array(rows * nV * 6 + (open ? nV * 6 : 0));
  let n = 0;
  for (let iu = 0; iu < rows; iu++) {
    const i2 = (iu + 1) % nU;
    for (let j = 0; j < nV; j++) {
      const j2 = (j + 1) % nV;
      const A = iu * nV + j, B = iu * nV + j2, C = i2 * nV + j, D = i2 * nV + j2;
      idx[n++] = A; idx[n++] = B; idx[n++] = C;
      idx[n++] = B; idx[n++] = D; idx[n++] = C;
    }
  }
  if (open) { // Enden verschließen
    for (let end = 0; end < 2; end++) {
      const base = end ? (nU - 1) * nV : 0, cI = nU * nV + end;
      let cx = 0, cy = 0, cz = 0;
      for (let j = 0; j < nV; j++) { cx += pos[(base + j) * 3]; cy += pos[(base + j) * 3 + 1]; cz += pos[(base + j) * 3 + 2]; }
      pos[cI * 3] = cx / nV; pos[cI * 3 + 1] = cy / nV; pos[cI * 3 + 2] = cz / nV;
      zone[cI] = zone[base];
      for (let j = 0; j < nV; j++) {
        const j2 = (j + 1) % nV;
        if (end) { idx[n++] = cI; idx[n++] = base + j; idx[n++] = base + j2; }
        else { idx[n++] = cI; idx[n++] = base + j2; idx[n++] = base + j; }
      }
    }
  }

  return {
    positions: pos, indices: idx, zone: inlay !== 'none' ? zone : null, nU, nV,
    // Steine für die Darstellung (nicht Teil der Druckdatei)
    stones: sites.map((st) => {
      const y = pointCut ? st.Hc - 0.15 : st.Hc - st.depth;
      return { pos: [st.sin * y, st.cos * y, st.zs], a: st.a, hu: st.hu, hv: st.hv, rise: st.rise };
    }),
    stats: {
      innerDiameter: 2 * Rin,
      outerDiameter: 2 * Math.sqrt(maxR),
      axialWidth: zHi - zLo,
      minWall,
      volume: meshVolume(pos, idx), // mm³
    },
  };
}

export function meshVolume(pos, idx) {
  let v = 0;
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    v += pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1])
      - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c])
      + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c]);
  }
  return v / 6;
}

// Ringgrößen-Umrechnung
export const sizeToDiameter = (size) => size / Math.PI;
export const sizeToUS = (size) => (size / Math.PI - 11.63) / 0.8128;
