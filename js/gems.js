// Glassteine für die Darstellung. Die Druckdatei enthält nur die Sitze.
import * as THREE from 'three';
import { stoneOutline } from './ring.js';
export { stoneOutline };

export const STONE_COLORS = {
  crystal: { label: 'Kristall', color: 0xffffff },
  rose: { label: 'Rosa', color: 0xf7a3c6 },
  ruby: { label: 'Rubinrot', color: 0xd3123e },
  amber: { label: 'Bernstein', color: 0xe08a2c },
  citrine: { label: 'Citrin', color: 0xf6c12a },
  peridot: { label: 'Peridot', color: 0x9fd03a },
  emerald: { label: 'Smaragd', color: 0x11a05c },
  aqua: { label: 'Aquamarin', color: 0x86dcef },
  sapphire: { label: 'Saphir', color: 0x2452dd },
  amethyst: { label: 'Amethyst', color: 0x9148d0 },
  smoke: { label: 'Rauch', color: 0x6b6258 },
  jet: { label: 'Schwarz', color: 0x0e0e10 },
  opal: { label: 'Opalweiß', color: 0xf3f0ea, opaque: true },
  turquoise: { label: 'Türkis', color: 0x2fc4b2, opaque: true },
};

const cache = new Map();
export function gemGeometry(shape, hu, hv, turn, cut) {
  const key = [shape, hu.toFixed(2), hv.toFixed(2), turn, cut].join('|');
  if (cache.has(key)) return cache.get(key);
  const round = shape === 'round', step = ['octagon', 'square', 'baguette'].includes(shape);
  const n = round ? 16 : 48;
  const out = stoneOutline(shape, hu, hv, turn, n);
  const w = Math.min(hu, hv) * 2;
  const longU = hu > hv, keel = Math.max(0.02, (1 - Math.min(hu, hv) / Math.max(hu, hv)) * 0.9);
  // Ringe von oben nach unten: [Maßstab quer, Maßstab längs, Höhe, halber Versatz]
  let rings;
  if (cut === 'cab') {
    rings = [];
    for (let i = 5; i >= 0; i--) { const f = (i / 6) * Math.PI / 2 + 0.12; rings.push([Math.cos(f), Math.cos(f), 0.36 * w * Math.sin(f) / Math.sin(Math.PI / 2 * 5 / 6 + 0.12), 0]); }
    rings.push([1, 1, 0, 0]);
  } else {
    const crown = step ? [[0.6, 0.6, 0.16 * w, 0], [0.84, 0.84, 0.09 * w, 0], [1, 1, 0.02 * w, 0]] : [[0.56, 0.56, 0.15 * w, 1], [1, 1, 0.02 * w, 0]];
    const kl = longU ? [keel, 0.03] : [0.03, keel];
    const pav = cut === 'flat' ? [[1, 1, -0.02 * w, 0], [0.9, 0.9, -0.1 * w, 0]]
      : step ? [[1, 1, -0.02 * w, 0], [0.72 + 0.28 * kl[0], 0.72 + 0.28 * kl[1], -0.2 * w, 0], [0.38 + 0.62 * kl[0], 0.38 + 0.62 * kl[1], -0.35 * w, 0], [kl[0], kl[1], -0.43 * w, 0]]
        : [[1, 1, -0.02 * w, 0], [kl[0], kl[1], -0.43 * w, 1]];
    rings = [...crown, ...pav];
  }
  const pos = [], idx = [];
  rings.forEach(([su, sv, y, half]) => {
    for (let i = 0; i < n; i++) {
      const a = out[i], b = out[(i + 1) % n];
      const x = half ? (a[0] + b[0]) / 2 : a[0], z = half ? (a[1] + b[1]) / 2 : a[1];
      pos.push(x * su, y, z * sv);
    }
  });
  for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < n; i++) {
    const a = r * n + i, b = r * n + (i + 1) % n, c = (r + 1) * n + i, e = (r + 1) * n + (i + 1) % n;
    idx.push(a, b, c, b, e, c);
  }
  const top = pos.length / 3; pos.push(0, rings[0][2], 0);
  const bot = top + 1; pos.push(0, rings[rings.length - 1][2], 0);
  const last = (rings.length - 1) * n;
  for (let i = 0; i < n; i++) { idx.push(top, (i + 1) % n, i); idx.push(bot, last + i, last + (i + 1) % n); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  if (cache.size > 40) cache.clear();
  cache.set(key, geo);
  return geo;
}

const mats = new Map();
export function gemMaterial(colorKey, cut) {
  const key = colorKey + '|' + cut;
  if (mats.has(key)) return mats.get(key);
  const c = STONE_COLORS[colorKey] || STONE_COLORS.crystal;
  const cab = cut === 'cab';
  const m = new THREE.MeshPhysicalMaterial({
    color: c.color,
    metalness: c.opaque ? 0 : 0.35,
    roughness: cab ? 0.08 : 0.0,
    envMapIntensity: c.opaque ? 1 : 2.6,
    clearcoat: 1, clearcoatRoughness: 0.02,
    flatShading: !cab,
    side: THREE.DoubleSide,
  });
  mats.set(key, m);
  return m;
}
