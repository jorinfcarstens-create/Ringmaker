// Parametrische Ring-Geometrie. Reines JavaScript ohne DOM/three.js,
// damit dieselbe Funktion Vorschau, STL-Export und Tests bedient.
//
// Koordinaten (mm): Ringachse = Z. Oberseite (Kopf/Platte) bei +Y.
// Winkel a = 0 liegt oben, a = ±PI unten.  X = r·sin(a), Y = r·cos(a).

const TAU = Math.PI * 2;

export const DEFAULTS = {
  form: 'band',          // band | taper | signet | bombe | wave | vee
  size: 54,              // Innenumfang in mm (= EU-Ringgröße)
  width: 5,              // Ringbreite (Schiene) in mm
  thickness: 1.8,        // Materialstärke (Schiene) in mm
  profile: 'd',          // flat | d | comfort | round | knife | bevel | concave
  crown: 0.8,            // Ausprägung des Profils 0..1
  edge: 0.3,             // Kantenradius in mm

  taperWidth: 9,         // Verlaufring: Breite oben
  taperThickness: 2.6,   // Verlaufring: Stärke oben

  faceAcross: 14,        // Kopf: Ausdehnung quer zum Finger
  faceAlong: 11,         // Kopf: Ausdehnung entlang des Fingers
  headHeight: 3.6,       // Kopf: Materialstärke oben
  faceShape: 'oval',     // oval | cushion | square

  waveAmp: 1.2,
  waveCount: 3,
  veeDepth: 3,
  veeSpread: 0.5,

  pattern: 'none',       // none | grooves | flutes | milgrain | hammered | rope | knurl | facets | beads
  patternDepth: 0.25,
  patternCount: 2,       // Rillen / Facetten-Zahl
  patternScale: 1,       // Dichte

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
};

export function normalize(p) {
  const o = { ...DEFAULTS, ...(p || {}) };
  const num = (k, lo, hi) => {
    let v = Number(o[k]);
    if (!Number.isFinite(v)) v = DEFAULTS[k];
    o[k] = Math.min(hi, Math.max(lo, v));
  };
  num('size', 38, 80); num('width', 1, 16); num('thickness', 0.8, 5);
  num('crown', 0, 1); num('edge', 0, 1.2);
  num('taperWidth', 1, 20); num('taperThickness', 0.8, 7);
  num('faceAcross', 6, 26); num('faceAlong', 5, 24); num('headHeight', 1.5, 9);
  num('waveAmp', 0, 4); num('waveCount', 1, 10);
  num('veeDepth', 0, 8); num('veeSpread', 0.15, 1.2);
  num('patternDepth', 0.02, 0.8); num('patternCount', 1, 24); num('patternScale', 0.4, 2.5);
  num('textSize', 0.25, 0.95); num('textDepth', 0.05, 0.6); num('opacity', 0.15, 1);
  o.waveCount = Math.round(o.waveCount);
  o.patternCount = Math.round(o.patternCount);
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

const _po = [0, 0];
// Höhe der Außen- (o) und Innenkontur (i) über der Fingerfläche an Stelle x.
export function profileAt(type, x, w, t, crown, edge, out = _po) {
  const q = Math.max(-1, Math.min(1, x / w)), aq = Math.abs(q), ax = aq * w;
  const arc = Math.sqrt(Math.max(0, 1 - q * q));
  let o, i;
  const ri = Math.min(edge * 0.6, w * 0.5, t * 0.3);
  switch (type) {
    case 'flat': {
      const rho = Math.min(edge, w * 0.9, t * 0.45);
      o = t - crown * 0.25 * t * q * q - cornerDrop(ax, w, rho);
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
    case 'round': {
      o = t / 2 + (t / 2) * arc;
      i = t / 2 - (t / 2) * arc;
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
      const rho = Math.min(edge, w * 0.5, t * 0.3);
      const b = 1 - q * q;
      o = t - dep * b * b - cornerDrop(ax, w, rho);
      i = cornerDrop(ax, w, ri);
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
};
const SHOULDER = 2.5; // Winkel (rad), bis zu dem die Schultern auslaufen
const DOME_E = 0.62;  // <1: Flanken des Kopfes fallen gerader ab
const BETA_E = 2.4;   // sorgt für weichen Auslauf der Schultern

const dome = (q, m) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(q), m)), DOME_E);

function derive(p) {
  const Rin = innerRadius(p);
  const wb = p.width / 2, tb = p.thickness;
  const d = { Rin, wb, tb, head: false, table: false };
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
      d.m = 2;
      Tpeak = Ttop;
      d.Wtop = Math.max(wb, p.faceAlong / 2);
      aL = Math.atan2(p.faceAcross / 2, Rin + Ttop);
      betaL = 0.55;
    }
    aL = Math.min(aL, SHOULDER * 0.75);
    betaL = Math.min(0.94, Math.max(0.05, betaL));
    d.Tpeak = Tpeak;
    // beta(a) = (1 - u^e1)^BETA_E mit u = |a| / SHOULDER, durch (aL, betaL)
    const e1 = Math.log(1 - Math.pow(betaL, 1 / BETA_E)) / Math.log(aL / SHOULDER);
    d.e1 = Math.min(9, Math.max(1.25, e1));
  }
  return d;
}

const _col = { w: 0, t: 0, beta: 0, x0: 0, wHead: 0 };
function columnAt(p, d, a, out = _col) {
  let w = d.wb, t = d.tb, beta = 0, x0 = 0;
  const aa = Math.abs(a);
  if (p.form === 'taper') {
    const c = Math.pow(0.5 + 0.5 * Math.cos(a), 1.6);
    w = d.wb + (p.taperWidth / 2 - d.wb) * c;
    t = d.tb + (p.taperThickness - d.tb) * c;
  } else if (d.head) {
    if (aa < SHOULDER) beta = Math.pow(1 - Math.pow(aa / SHOULDER, d.e1), BETA_E);
    w = d.wb + (d.Wtop - d.wb) * Math.pow(beta, 0.85);
  } else if (p.form === 'wave') {
    x0 = p.waveAmp * Math.cos(p.waveCount * a);
  } else if (p.form === 'vee') {
    const s = p.veeSpread;
    x0 = p.veeDepth * Math.exp(-(Math.sqrt(a * a + 0.02) - 0.1414) / s);
  }
  out.w = w; out.t = t; out.beta = beta; out.x0 = x0;
  return out;
}

// Axiale Ausdehnung je Winkel – für passgenaues Stapeln.
export const EXTENT_STEPS = 72;
export function ringExtents(p0) {
  const p = normalize(p0), d = derive(p);
  const lo = new Float32Array(EXTENT_STEPS), hi = new Float32Array(EXTENT_STEPS);
  for (let k = 0; k < EXTENT_STEPS; k++) {
    const a = -Math.PI + (k / EXTENT_STEPS) * TAU;
    const c = columnAt(p, d, a);
    lo[k] = c.x0 - c.w; hi[k] = c.x0 + c.w;
  }
  return { lo, hi };
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

function sampleMap(map, u, v) {
  if (!map || u < 0 || u > 1 || v < 0 || v > 1) return 0;
  const x = u * (map.w - 1), y = v * (map.h - 1);
  const x0 = x | 0, y0 = y | 0;
  const x1 = Math.min(map.w - 1, x0 + 1), y1 = Math.min(map.h - 1, y0 + 1);
  const fx = x - x0, fy = y - y0, d = map.data, w = map.w;
  return ((d[y0 * w + x0] * (1 - fx) + d[y0 * w + x1] * fx) * (1 - fy) +
    (d[y1 * w + x0] * (1 - fx) + d[y1 * w + x1] * fx) * fy) / 255;
}

export function needsDetail(p) {
  return ['milgrain', 'hammered', 'rope', 'knurl'].includes(p.pattern) ||
    !!(p.textOuter || p.textInner || (p.textTable && p.form === 'signet'));
}

// ------------------------------------------------------------------ Aufbau

export function buildRing(p0, opts = {}) {
  const p = normalize(p0);
  const d = derive(p);
  const maps = opts.maps || {};
  const exportQ = opts.quality === 'export';
  const detail = needsDetail(p);
  const hasInnerText = !!(p.textInner && maps.inner);
  const hasTableText = !!(p.textTable && maps.table && d.table);

  const light = opts.quality === 'light'; // für Ansichten mit mehreren Ringen
  const nU = exportQ ? (detail ? 1040 : 520) : light ? (detail ? 400 : 220) : (detail ? 600 : 340);
  const nO = exportQ ? (detail ? 132 : 64) : light ? (detail ? 56 : 32) : (detail ? 84 : 48);
  const nI = hasInnerText ? nO : (exportQ ? 32 : 22);
  const nS = 3;
  const nV = nO + nI + 2 * nS;

  const { Rin, wb, tb } = d;
  const Cout = TAU * (Rin + tb);
  const warp = d.head ? (hasTableText ? 0.72 : 0.55) : 0;

  const pos = new Float32Array(nU * nV * 3);
  const pat = p.pattern;
  const pd = Math.min(p.patternDepth, tb * 0.45);
  const sc = p.patternScale;
  const td = Math.min(p.textDepth, tb * 0.5) * (p.textRaised ? 1 : -1);
  const tdIn = Math.min(p.textDepth, tb * 0.4);
  const facetN = Math.max(5, p.patternCount + 4);
  const fluteN = Math.max(6, Math.round(Cout / (1.8 / sc)));
  const ropeN = Math.max(6, Math.round(Cout / (2.2 / sc)));
  const knurlN = Math.max(8, Math.round(Cout / (1.5 / sc)));
  const beadN = Math.max(8, Math.round(Cout / (Math.max(p.width, 1.6) * 1.05 / sc)));
  const mgR = Math.min(Math.max(0.22, pd * 1.2), wb * 0.4);
  const mgN = Math.max(12, Math.round(Cout / (2 * mgR)));
  const grooveG = Math.max(0.16, pd * 0.8);
  const tabW = p.faceAcross * 0.8, tabH = p.faceAlong * 0.8;

  let minWall = Infinity, maxR = 0, zLo = Infinity, zHi = -Infinity;
  const po = [0, 0], col = { w: 0, t: 0, beta: 0, x0: 0 };

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
    const v = -1 + 2 * iu / nU;
    const a = Math.PI * ((1 - warp) * v + warp * v * v * v);
    const sinA = Math.sin(a), cosA = Math.cos(a);
    columnAt(p, d, a, col);
    let w = col.w, t = col.t;
    const beta = col.beta, x0 = col.x0;
    const fade = beta <= 0.02 ? 1 : beta >= 0.3 ? 0 : 1 - (beta - 0.02) / 0.28;
    const s = (a + Math.PI) * (Rin + tb);
    const ua = (a + Math.PI) / TAU;

    let bead = 1;
    if (pat === 'beads') {
      const f = (ua * beadN) % 1, c = 2 * f - 1;
      bead = 0.5 + 0.5 * Math.sqrt(Math.max(0, 1 - c * c));
      bead = 1 - (1 - bead) * fade;
      w *= 0.62 + 0.38 * bead;
    }
    let facet = 0;
    if (pat === 'facets') {
      const seg = TAU / facetN;
      const l = ((a % seg) + seg) % seg - seg / 2;
      facet = Math.cos(Math.PI / facetN) / Math.cos(l) - 1; // ≤ 0
    }

    const heights = (q) => {
      const x = q * w;
      profileAt(p.profile, x, w, t, p.crown, p.edge, po);
      let o = po[0], i = po[1];
      if (beta > 0) {
        o = (1 - beta) * o + beta * (d.hs + (d.Tpeak - d.hs) * dome(q, d.m));
        i = (1 - beta) * i;
      }
      if (bead !== 1) {
        const mid = t / 2;
        o = mid + (o - mid) * bead; i = mid - (mid - i) * bead;
      }
      po[0] = o; po[1] = i;
    };

    const put = (j, x, h, clampable) => {
      const r = Rin + h;
      let X = r * sinA, Y = r * cosA;
      const k = (iu * nV + j) * 3;
      if (clampable && d.table && cosA > 0 && Y > d.H) {
        Y = d.H;
        if (hasTableText) {
          Y -= tdIn * sampleMap(maps.table, 0.5 + X / tabW, 0.5 + x / tabH);
        }
      }
      pos[k] = X; pos[k + 1] = Y; pos[k + 2] = x0 + x;
      const rr = X * X + Y * Y;
      if (rr > maxR) maxR = rr;
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
        switch (pat) {
          case 'grooves': {
            const n = Math.min(p.patternCount, 7);
            for (let g = 1; g <= n; g++) {
              const xg = (-1 + 2 * g / (n + 1)) * w, e = (x - xg) / grooveG;
              dsp -= pd * Math.exp(-e * e);
            }
            break;
          }
          case 'flutes': dsp = -pd * (0.5 - 0.5 * Math.cos(fluteN * a)); break;
          case 'milgrain': {
            const dx = (Math.abs(x) - (w - mgR * 1.15)) / mgR;
            const ds = ((ua * mgN) % 1) * 2 - 1;
            const b = 1 - dx * dx - ds * ds;
            if (b > 0) dsp = mgR * 0.75 * Math.sqrt(b);
            else if (dx < -1 && dx > -1.9) dsp = -mgR * 0.35 * Math.sin((dx + 1.9) / 0.9 * Math.PI);
            break;
          }
          case 'hammered': dsp = -pd * hammer(s, x + 40, Cout, 1.7 / sc); break;
          case 'rope': dsp = pd * 1.6 * (Math.sqrt(Math.abs(Math.sin(ropeN * a / 2 + q * 1.1))) - 1); break;
          case 'knurl': {
            const k1 = Math.max(0, Math.cos(knurlN * a + q * w * 2.2 * sc));
            const k2 = Math.max(0, Math.cos(knurlN * a - q * w * 2.2 * sc));
            dsp = -pd * Math.pow(Math.max(k1, k2), 5);
            break;
          }
          case 'facets': dsp = (Rin + o) * facet; break;
        }
        if (maps.outer && p.textOuter) dsp += td * sampleMap(maps.outer, ua, 0.5 - q * 0.5);
        o += dsp * fade;
      }
      if (o < i + 0.06) o = i + 0.06;
      if (o - i < minWall && Math.abs(q) < 0.6) minWall = o - i;
      if (j === 0) { oL = o; iL = i; } else if (j === nO - 1) { oR = o; iR = i; }
      put(j, x, o, true);
    }
    // rechte Flanke
    for (let j = 0; j < nS; j++) {
      const f = (j + 1) / (nS + 1);
      put(nO + j, w, oR + (iR - oR) * f, true);
    }
    // Innenfläche
    for (let j = 0; j < nI; j++) {
      const q = qi[j];
      heights(q);
      let i = po[1];
      if (hasInnerText) i += tdIn * sampleMap(maps.inner, ua, 0.5 - q * 0.5);
      put(nO + nS + j, q * w, i, false);
    }
    // linke Flanke
    for (let j = 0; j < nS; j++) {
      const f = (j + 1) / (nS + 1);
      put(nO + nS + nI + j, -w, iL + (oL - iL) * f, true);
    }
    if (x0 - w < zLo) zLo = x0 - w;
    if (x0 + w > zHi) zHi = x0 + w;
  }

  const idx = new Uint32Array(nU * nV * 6);
  let n = 0;
  for (let iu = 0; iu < nU; iu++) {
    const i2 = (iu + 1) % nU;
    for (let j = 0; j < nV; j++) {
      const j2 = (j + 1) % nV;
      const A = iu * nV + j, B = iu * nV + j2, C = i2 * nV + j, D = i2 * nV + j2;
      idx[n++] = A; idx[n++] = B; idx[n++] = C;
      idx[n++] = B; idx[n++] = D; idx[n++] = C;
    }
  }

  return {
    positions: pos, indices: idx, nU, nV,
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
