// Lokaler Speicher (bleibt auf dem Gerät) sowie Datei-Export/-Import.
import { buildRing, normalize } from './ring.js';
import { textMaps } from './text.js';

const KEY = 'ringmaker.v1';
let state = { rings: [], stack: [], stackMode: 'stack', finger: true, draft: null, draftId: null };

try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = { ...state, ...JSON.parse(raw) };
} catch (e) { /* Speicher nicht verfügbar – App läuft trotzdem */ }

export const db = state;
export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function saveRing({ id, name, params, thumb }) {
  const now = Date.now();
  let r = id && state.rings.find((x) => x.id === id);
  if (r) Object.assign(r, { name, params: { ...params }, thumb, updated: now });
  else { r = { id: uid(), name, params: { ...params }, thumb, created: now, updated: now }; state.rings.unshift(r); }
  persist();
  return r;
}

export function deleteRing(id) {
  state.rings = state.rings.filter((r) => r.id !== id);
  state.stack = state.stack.filter((x) => x !== id);
  if (state.draftId === id) state.draftId = null;
  persist();
}

export const getRing = (id) => state.rings.find((r) => r.id === id);

// ------------------------------------------------------------- Dateien

const safeName = (s) => (s || 'Ring').replace(/[^\p{L}\p{N} _-]+/gu, '').trim().replace(/\s+/g, '-') || 'Ring';

export async function deliver(blob, filename) {
  const file = new File([blob], filename, { type: blob.type });
  const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function ringFile(name, params) {
  const data = { app: 'Ringmaker', version: 1, rings: [{ name, params: normalize(params) }] };
  return { blob: new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename: safeName(name) + '.ring.json' };
}

export function backupFile() {
  const data = { app: 'Ringmaker', version: 1, rings: state.rings.map((r) => ({ name: r.name, params: r.params, created: r.created })) };
  const d = new Date().toISOString().slice(0, 10);
  return { blob: new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename: `Ringmaker-Sammlung-${d}.ring.json` };
}

export function parseImport(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== 'Ringmaker' || !Array.isArray(data.rings)) throw new Error('Keine Ringmaker-Datei');
  return data.rings.filter((r) => r && r.params).map((r) => ({ name: String(r.name || 'Importierter Ring').slice(0, 60), params: normalize(r.params) }));
}

// Binäres STL in Millimetern. Der Ring liegt flach auf dem Druckbett
// (Achse senkrecht), die Unterkante bei Z = 0.
export function stlFile(name, params) {
  const p = normalize(params);
  const { positions: pos, indices: idx } = buildRing(p, { quality: 'export', maps: textMaps(p) });
  let zMin = Infinity;
  for (let i = 2; i < pos.length; i += 3) if (pos[i] < zMin) zMin = pos[i];
  const nTri = idx.length / 3;
  const buf = new ArrayBuffer(84 + nTri * 50);
  const dv = new DataView(buf);
  const header = 'Ringmaker STL (mm)';
  for (let i = 0; i < header.length; i++) dv.setUint8(i, header.charCodeAt(i));
  dv.setUint32(80, nTri, true);
  let o = 84;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ax = pos[a], ay = pos[a + 1], az = pos[a + 2] - zMin;
    const bx = pos[b], by = pos[b + 1], bz = pos[b + 2] - zMin;
    const cx = pos[c], cy = pos[c + 1], cz = pos[c + 2] - zMin;
    let nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay);
    let ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    let nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const l = Math.hypot(nx, ny, nz) || 1;
    dv.setFloat32(o, nx / l, true); dv.setFloat32(o + 4, ny / l, true); dv.setFloat32(o + 8, nz / l, true);
    dv.setFloat32(o + 12, ax, true); dv.setFloat32(o + 16, ay, true); dv.setFloat32(o + 20, az, true);
    dv.setFloat32(o + 24, bx, true); dv.setFloat32(o + 28, by, true); dv.setFloat32(o + 32, bz, true);
    dv.setFloat32(o + 36, cx, true); dv.setFloat32(o + 40, cy, true); dv.setFloat32(o + 44, cz, true);
    o += 50;
  }
  return { blob: new Blob([buf], { type: 'model/stl' }), filename: safeName(name) + '.stl', triangles: nTri };
}
