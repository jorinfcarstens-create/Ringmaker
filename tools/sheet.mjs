// Entwicklungswerkzeug: Übersichtsblatt vieler Ringvarianten als ein Bild.
// Aufruf: node tools/sheet.mjs <ausgabe.png> '<json-liste von parametern>' [spalten]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const list = JSON.parse(process.argv[3]);
const cols = Number(process.argv[4] || 4);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: cols * 300, height: Math.ceil(list.length / cols) * 300 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8080/index.html');
await page.waitForFunction(() => window.ringmaker);
await page.evaluate(({ list, cols }) => {
  const d = document.createElement('div');
  d.style.cssText = `position:fixed;inset:0;z-index:99;background:#0d1020;display:grid;grid-template-columns:repeat(${cols},300px)`;
  for (const p of list) { const i = new Image(); i.src = ringmaker.viewer.snapshot(p, 300); d.append(i); }
  document.body.append(d);
}, { list, cols });
await page.waitForTimeout(500);
await page.screenshot({ path: process.argv[2] });
await browser.close();
