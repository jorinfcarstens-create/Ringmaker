// Gravur: Text wird in ein Graustufenbild gezeichnet, das die Geometrie
// als Höhenkarte abtastet. Ergebnisse werden zwischengespeichert.
import { innerRadius } from './ring.js';

export const FONTS = {
  serif: { label: 'Antiqua', css: '600 SIZEpx "Times New Roman", Times, Georgia, serif' },
  sans: { label: 'Grotesk', css: '700 SIZEpx "Helvetica Neue", Helvetica, Arial, sans-serif' },
  script: { label: 'Schreibschrift', css: 'SIZEpx "Snell Roundhand", "Savoye LET", "Apple Chancery", "Brush Script MT", cursive' },
  mono: { label: 'Schablone', css: '700 SIZEpx "Courier New", Courier, monospace' },
};

const cache = new Map();

function render(key, w, h, draw) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.shadowColor = '#fff'; g.shadowBlur = Math.max(1, h / 90);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  draw(g);
  const px = g.getImageData(0, 0, w, h).data;
  const data = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i++) data[i] = px[i * 4];
  const map = { data, w, h };
  if (cache.size > 24) cache.delete(cache.keys().next().value);
  cache.set(key, map);
  return map;
}

function band(text, font, sizeFrac, circ, width) {
  const W = 2048, H = Math.max(48, Math.min(512, Math.round(W * width / circ)));
  return render(['b', text, font, sizeFrac, W, H].join('|'), W, H, (g) => {
    let size = H * sizeFrac;
    g.font = FONTS[font].css.replace('SIZE', size);
    const tw = g.measureText(text).width;
    if (tw > W * 0.96) { size *= W * 0.96 / tw; g.font = FONTS[font].css.replace('SIZE', size); }
    g.fillText(text, W / 2, H / 2 + size * 0.04);
  });
}

function table(text, font, across, along) {
  const W = 384, H = Math.max(96, Math.min(768, Math.round(W * along / across)));
  return render(['t', text, font, W, H].join('|'), W, H, (g) => {
    let size = H * 0.82;
    g.font = FONTS[font].css.replace('SIZE', size);
    const tw = g.measureText(text).width;
    if (tw > W * 0.9) { size *= W * 0.9 / tw; g.font = FONTS[font].css.replace('SIZE', size); }
    g.fillText(text, W / 2, H / 2 + size * 0.05);
  });
}

export function textMaps(p) {
  const font = FONTS[p.font] ? p.font : 'serif';
  const maps = {};
  const R = innerRadius(p);
  if (p.textOuter) maps.outer = band(p.textOuter, font, p.textSize, 2 * Math.PI * (R + p.thickness), p.width);
  if (p.textInner) maps.inner = band(p.textInner, font, p.textSize, 2 * Math.PI * R, p.width);
  if (p.textTable && p.form === 'signet') maps.table = table(p.textTable, font, p.faceAcross, p.faceAlong);
  return maps;
}
