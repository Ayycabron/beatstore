// Génère les contrats vierges : contrats/*.md (+ contrats/pdf/*.pdf si Playwright est installé)
// Usage : npm run contrats
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, site, licenses } from '../server/config.js';
import { renderContract } from '../shared/contract.js';

const require = createRequire(import.meta.url);
const outDir = path.join(ROOT, 'contrats');
mkdirSync(path.join(outDir, 'pdf'), { recursive: true });

const docs = licenses.licenses.map((l, i) => {
  const name = `${String(i + 1).padStart(2, '0')}-licence-${l.id}`;
  const md = renderContract(l, {}, site);
  writeFileSync(path.join(outDir, `${name}.md`), md);
  return { name, md, license: l };
});
console.log(`${docs.length} contrats Markdown écrits dans contrats/`);

let chromium;
let marked;
try {
  ({ chromium } = require('playwright'));
  ({ marked } = await import(pathToFileURL(path.join(ROOT, 'frontend/node_modules/marked/lib/marked.esm.js')).href));
} catch {
  console.log('Playwright ou marked absent : PDF non générés (le site permet aussi « Imprimer / PDF » depuis /admin).');
  process.exit(0);
}

const css = `body{font-family:Helvetica,Arial,sans-serif;color:#17151f;font-size:10.5pt;line-height:1.5}
h1{font-size:16pt;margin:0 0 4px}h2{font-size:12pt;margin:18px 0 6px;break-after:avoid}
table{border-collapse:collapse;width:100%;margin:8px 0;break-inside:avoid}th,td{border:1px solid #bbb;padding:5px 8px;text-align:left;vertical-align:top}
blockquote{margin:8px 0;padding:4px 10px;border-left:3px solid #8b5cf6;color:#555}a{color:inherit;text-decoration:none}`;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const d of docs) {
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>${css}</style>${marked.parse(d.md)}`);
  await page.pdf({
    path: path.join(outDir, 'pdf', `${d.name}.pdf`),
    format: 'A4',
    margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '18mm' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-size:8px;width:100%;text-align:center;color:#888">Licence « ${d.license.name} » · page <span class="pageNumber"></span>/<span class="totalPages"></span> · Paraphes : ______ / ______</div>`,
  });
}
await browser.close();
console.log(`${docs.length} PDF écrits dans contrats/pdf/`);
