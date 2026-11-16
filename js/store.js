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

// ZIP ohne Kompression – nur für Umgebungen nötig, die keine .stl-Dateien
// speichern lassen (die claude.ai-Vorschau).
function crc32(bytes) {
  let c, crc = -1;
  if (!crc32.t) { crc32.t = new Uint32Array(256); for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc32.t[n] = c; } }
  for (let i = 0; i < bytes.length; i++) crc = crc32.t[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}
export async function zipOf(blob, filename) {
  const data = new Uint8Array(await blob.arrayBuffer());
  const name = new TextEncoder().encode(filename);
  const crc = crc32(data), n = data.length;
  const head = (sig, extra) => {
    const b = new DataView(new ArrayBuffer(extra ? 46 : 30));
    let o = 0;
    b.setUint32(o, sig, true); o += 4;
    if (extra) { b.setUint16(o, 20, true); o += 2; }
    b.setUint16(o, 20, true); b.setUint16(o + 2, 0x0800, true); b.setUint16(o + 4, 0, true); o += 6;
    b.setUint16(o, 0, true); b.setUint16(o + 2, 0x21, true); o += 4;
    b.setUint32(o, crc, true); b.setUint32(o + 4, n, true); b.setUint32(o + 8, n, true); o += 12;
    b.setUint16(o, name.length, true);
    return b.buffer;
  };
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, 1, true); end.setUint16(10, 1, true);
  end.setUint32(12, 46 + name.length, true); end.setUint32(16, 30 + name.length + n, true);
  return new Blob([head(0x04034b50), name, data, head(0x02014b50, true), name, end.buffer], { type: 'application/zip' });
}

export async function deliver(blob, filename) {
  // In der claude.ai-Vorschau läuft das Speichern über die Plattform.
  if (window.claude && window.claude.use) {
    const dl = await window.claude.use('downloads');
    if (!dl) throw new Error('Speichern ist in dieser Ansicht nicht möglich');
    if (/\.stl$/i.test(filename)) { blob = await zipOf(blob, filename); filename += '.zip'; }
    try { await dl.save({ filename, data: blob }); return true; }
    catch (e) { if (e && e.code === 'declined') return false; throw e; }
  }
  const file = new File([blob], filename, { type: blob.type });
  const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return true; }
    catch (e) { if (e && e.name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return true;
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
