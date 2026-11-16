// Prüft die exportierte STL-Datei: Größe, Dreieckszahl, Maße in mm, Lage auf dem Druckbett.
import { stlFile } from '../js/store.js';
import { DEFAULTS } from '../js/ring.js';

const { blob, filename, triangles } = stlFile('Test Ring', { ...DEFAULTS, form: 'signet', pattern: 'hammered', size: 54 });
const dv = new DataView(await blob.arrayBuffer());
const n = dv.getUint32(80, true);
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (let t = 0; t < n; t++) for (let v = 0; v < 3; v++) for (let k = 0; k < 3; k++) {
  const x = dv.getFloat32(84 + t * 50 + 12 + v * 12 + k * 4, true);
  if (x < min[k]) min[k] = x; if (x > max[k]) max[k] = x;
}
const size = max.map((m, i) => +(m - min[i]).toFixed(2));
console.log(filename, n, 'Dreiecke,', (blob.size / 1e6).toFixed(1), 'MB, Maße mm:', size, 'Z ab', min[2].toFixed(3));
const ok = n === triangles && blob.size === 84 + n * 50 && Math.abs(min[2]) < 1e-4 && size[0] > 17 && size[0] < 30 && filename === 'Test-Ring.stl';
console.log(ok ? 'STL in Ordnung' : 'STL FEHLER');
process.exit(ok ? 0 : 1);
