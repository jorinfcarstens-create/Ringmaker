// Entwicklungswerkzeug: erzeugt aus index.html die Seitenfassung für die
// claude.ai-Vorschau (kein eigenes <head>, CSS eingebettet).
import { readFileSync, writeFileSync } from 'node:fs';
const out = process.argv[2];
const html = readFileSync('index.html', 'utf8');
const css = readFileSync('css/app.css', 'utf8');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
writeFileSync(out, `<title>Ringmaker</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
${css}
</style>
<script type="importmap">{ "imports": { "three": "./js/vendor/three.module.min.js" } }</script>
${body.trim()}
`);
