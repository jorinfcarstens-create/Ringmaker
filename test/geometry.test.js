// Prüft: jede Form/jedes Profil/jedes Muster ergibt ein geschlossenes,
// nach außen orientiertes Netz mit plausiblem Volumen (druckbar).
import { buildRing, DEFAULTS } from '../js/ring.js';

const forms = ['band', 'taper', 'signet', 'bombe', 'wave', 'vee'];
const profiles = ['flat', 'd', 'comfort', 'round', 'knife', 'bevel', 'concave', 'lens', 'cushion', 'step', 'channel', 'bead', 'double', 'triple', 'slant', 'rimmed'];
const patterns = ['none', 'grooves', 'flutes', 'milgrain', 'hammered', 'rope', 'knurl', 'facets', 'beads', 'ribs', 'diagonal', 'waves', 'bark', 'dots', 'pyramids', 'scales', 'meander', 'fret', 'steps'];
let fails = 0, count = 0;

function check(label, p, quality) {
  count++;
  const t0 = performance.now();
  const m = buildRing(p, { quality });
  const ms = performance.now() - t0;
  const { positions: pos, indices: idx, stats } = m;
  const errs = [];
  for (const v of pos) if (!Number.isFinite(v)) { errs.push('NaN'); break; }
  // Mannigfaltigkeit: jede gerichtete Kante genau einmal, Gegenkante vorhanden
  const edges = new Map(), nv = pos.length / 3;
  for (let i = 0; i < idx.length; i += 3) for (let k = 0; k < 3; k++) {
    const a = idx[i + k], b = idx[i + (k + 1) % 3], key = a * nv + b;
    edges.set(key, (edges.get(key) || 0) + 1);
  }
  for (const [key, c] of edges) {
    const a = Math.floor(key / nv), b = key % nv;
    if (c !== 1 || edges.get(b * nv + a) !== 1) { errs.push('nicht geschlossen'); break; }
  }
  if (!(stats.volume > 5)) errs.push('Volumen ' + stats.volume);
  if (!(stats.minWall > 0.03)) errs.push('Wand ' + stats.minWall);
  if (errs.length) { fails++; console.log('FAIL', label, errs.join(', ')); }
  return { ms, stats, tris: idx.length / 3 };
}

for (const form of forms) for (const profile of profiles) check(`${form}/${profile}`, { ...DEFAULTS, form, profile });
for (const pattern of patterns) for (const form of ['band', 'signet']) check(`${form}/${pattern}`, { ...DEFAULTS, form, pattern });
for (const faceShape of ['oval', 'cushion', 'square']) check('signet/' + faceShape, { ...DEFAULTS, form: 'signet', faceShape, faceAcross: 20, faceAlong: 8 });
for (const closure of ['open', 'spiral']) for (const endStyle of ['round', 'flat', 'ball', 'point']) for (const form of ['band', 'signet', 'taper']) check(`${closure}/${endStyle}/${form}`, { ...DEFAULTS, closure, endStyle, form });
for (const path of ['wave', 'vee', 'zigzag']) for (const form of ['band', 'signet']) check(`${path}/${form}`, { ...DEFAULTS, path, form });
for (const contour of ['scallop', 'crown']) check(contour, { ...DEFAULTS, contour });
for (const sides of [3, 4, 8, 12]) check('poly' + sides, { ...DEFAULTS, outline: 'poly', outlineSides: sides, profile: 'flat' });
for (const twist of [1, 6]) for (const closure of ['closed', 'open', 'spiral']) check(`twist${twist}/${closure}`, { ...DEFAULTS, twist, closure, profile: 'flat', width: 2.5, thickness: 2.5 });
for (const inlay of ['center', 'edges', 'half', 'inside', 'head']) check('inlay/' + inlay, { ...DEFAULTS, inlay, form: 'signet' });
for (const stones of ['solo', 'trio', 'row', 'around']) for (const setting of ['flush', 'bezel', 'cone']) for (const form of ['band', 'signet', 'bombe']) check(`${stones}/${setting}/${form}`, { ...DEFAULTS, stones, setting, form, stoneL: 3, stoneW: 3 });
for (const stoneShape of ['round', 'oval', 'octagon', 'square', 'cushion', 'baguette', 'pear', 'marquise']) for (const stoneCut of ['point', 'flat', 'cab']) for (const stoneTurn of [false, true]) check(`${stoneShape}/${stoneCut}`, { ...DEFAULTS, stones: 'solo', stoneShape, stoneCut, stoneTurn, stoneL: 10, stoneW: 7, setting: 'cone' });
check('großer Stein', { ...DEFAULTS, stones: 'solo', stoneShape: 'oval', stoneL: 18, stoneW: 13, stoneCut: 'cab', setting: 'cone', width: 3 });
check('offen mit Stein', { ...DEFAULTS, stones: 'solo', closure: 'open' });
check('navette', { ...DEFAULTS, form: 'signet', faceShape: 'navette', faceAcross: 9, faceAlong: 18 });
check('alles', { ...DEFAULTS, path: 'wave', contour: 'scallop', outline: 'poly', twist: 2, closure: 'open', endStyle: 'ball', pattern: 'bark', profile: 'double' });
const a = check('preview', { ...DEFAULTS, pattern: 'hammered' });
const b = check('export', { ...DEFAULTS, pattern: 'hammered' }, 'export');
console.log(`Vorschau ${a.tris} Dreiecke in ${a.ms.toFixed(0)} ms, Export ${b.tris} in ${b.ms.toFixed(0)} ms`);
console.log('Beispiel', a.stats);
console.log(fails ? `${fails} von ${count} fehlgeschlagen` : `Alle ${count} Varianten in Ordnung`);
process.exit(fails ? 1 : 0);
