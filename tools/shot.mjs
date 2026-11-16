// Entwicklungswerkzeug: startet die App im Headless-Browser und macht Bildschirmfotos.
// Aufruf: node tools/shot.mjs <ausgabeordner> '<json-szenen>'
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const scenes = JSON.parse(process.argv[3] || '[]');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[' + m.type() + ']', m.text().slice(0, 300)); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8080/index.html');
await page.waitForFunction(() => window.ringmaker);
for (const s of scenes) {
  if (s.viewport) await page.setViewportSize(s.viewport);
  if (s.eval) await page.evaluate(s.eval);
  await page.waitForTimeout(s.wait || 700);
  if (s.name) console.log("shot", s.name);
  if (s.name) await page.screenshot({ path: `${out}/${s.name}.png` });
}
await browser.close();
