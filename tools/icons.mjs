// Entwicklungswerkzeug: erzeugt die App-Icons aus einem gerenderten Ring.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.goto('http://localhost:8080/index.html');
await page.waitForFunction(() => window.ringmaker);
for (const [name, size] of [['icon-512', 512], ['icon-192', 192], ['apple-touch-icon', 180]]) {
  const url = await page.evaluate(async (size) => {
    const ring = new Image();
    ring.src = ringmaker.viewer.snapshot({ form: 'signet', faceShape: 'oval', material: 'gold', width: 5, thickness: 2 }, 1024);
    await ring.decode();
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(size / 2, size * 0.4, 0, size / 2, size / 2, size * 0.75);
    grad.addColorStop(0, '#3a4276'); grad.addColorStop(1, '#090b15');
    g.fillStyle = grad; g.fillRect(0, 0, size, size);
    const s = size * 0.8;
    g.drawImage(ring, (size - s) / 2, (size - s) / 2 + size * 0.02, s, s);
    return c.toDataURL('image/png');
  }, size);
  writeFileSync(`icons/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
await browser.close();
