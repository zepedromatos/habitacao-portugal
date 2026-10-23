// Gera dist/index.html e dist/app.js a partir de conteudo/, graficos/ e dados/.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const REPO = 'https://github.com/zepedromatos/habitacao-portugal';

// ---------- texto ----------
const files = fs.readdirSync(path.join(ROOT, 'conteudo')).filter((f) => f.endsWith('.md')).sort();
let md = files.map((f) => fs.readFileSync(path.join(ROOT, 'conteudo', f), 'utf8')).join('\n\n');

const chartNames = new Set(fs.readdirSync(path.join(ROOT, 'graficos')).filter((f) => f.endsWith('.jsx')).map((f) => f.slice(0, -4)));
const figures = [];
md = md.replace(/^::: grafico (\S+)\n([\s\S]*?)\n:::\s*$/gm, (_, name, caption) => {
  if (!chartNames.has(name)) throw new Error(`Gráfico inexistente em conteudo/: "${name}" (falta graficos/${name}.jsx)`);
  figures.push({ name, caption: caption.trim() });
  return `\n\nFIGURETOKEN${figures.length - 1}\n\n`;
});

const slug = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
const used = new Map();
const uniq = (id) => { const n = used.get(id) || 0; used.set(id, n + 1); return n ? `${id}-${n + 1}` : id; };

const marked = new Marked({ gfm: true });
marked.use({
  renderer: {
    heading(text, level, raw) {
      const id = uniq(slug(raw));
      return `<h${level} id="${id}">${text}</h${level}>\n`;
    },
  },
});
let body = marked.parse(md);

const inline = new Marked({ gfm: true });
body = body.replace(/<p>FIGURETOKEN(\d+)<\/p>/g, (_, i) => {
  const f = figures[Number(i)];
  return `<figure class="fig" id="fig-${f.name}"><div class="fig-scroll"><div class="chart" data-w="${f.name}">`
    + `<p class="chart-wait">A carregar o gráfico…</p></div></div>`
    + `<figcaption><span>Fonte</span> ${inline.parseInline(f.caption)}</figcaption></figure>`;
});
if (body.includes('FIGURETOKEN')) throw new Error('Marcador de gráfico por substituir: coloque "::: grafico" numa linha própria, com linhas em branco à volta.');

body = body
  .replaceAll('<table>', '<div class="table-wrap"><table>').replaceAll('</table>', '</table></div>')
  .replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"')
  .replace(/(<h3 id="[^"]+">)([EMS]\d)\. /g, '$1<span class="code">$2</span> ');

// índice
const toc = [];
for (const m of body.matchAll(/<h([12]) id="([^"]+)">(.*?)<\/h\1>/g)) {
  const [, lvl, id, html] = m;
  const title = html.replace(/<[^>]+>/g, '');
  if (lvl === '1') toc.push({ id, title, items: [] });
  else if (!toc.length || id === 'fontes') toc.push({ id, title, items: [], single: true });
  else toc.at(-1).items.push({ id, title });
}
const tocHtml = '<ol class="toc-list">' + toc.map((p) => p.single
  ? `<li class="toc-single"><a href="#${p.id}">${p.title}</a></li>`
  : `<li class="toc-part"><a class="toc-head" href="#${p.id}">${p.title}</a><ol>${p.items.map((i) => `<li><a href="#${i.id}">${i.title}</a></li>`).join('')}</ol></li>`).join('') + '</ol>';

body = body.replace(/<h1 id="([^"]+)">Parte (I+) — (.*?)<\/h1>/g,
  '<h1 class="part" id="$1"><span class="part-n">Parte $2</span><span class="part-t">$3</span></h1>');
const fi = body.indexOf('<h2 id="fontes">');
if (fi >= 0) body = body.slice(0, fi) + '<section class="sources">' + body.slice(fi) + '</section>';

// data da última alteração (último commit, ou hoje)
let updated;
try { updated = execSync('git log -1 --format=%cs', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
if (!updated) updated = new Date().toISOString().slice(0, 10);
const updatedPt = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  .format(new Date(`${updated}T12:00:00Z`));

// ---------- gráficos ----------
function parseCsv(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') q = false; else field += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head, ...data] = rows.filter((r) => r.length > 1);
  return data.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const NUM = new Set(['p', 'g', 'v', 'x', 'y']);
const concelhos = parseCsv(fs.readFileSync(path.join(ROOT, 'dados', 'concelhos.csv'), 'utf8'))
  .map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, NUM.has(k) ? (v === '' ? null : Number(v)) : v])));

const names = [...chartNames].sort();
const entry = [
  "import './runtime.js';",
  "import { mount } from './mount.js';",
  ...names.map((n, i) => `import g${i} from '../graficos/${n}.jsx';`),
  `mount({ ${names.map((n, i) => `${JSON.stringify(n)}: g${i}`).join(', ')} });`,
].join('\n');

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

await esbuild.build({
  stdin: { contents: entry, resolveDir: path.join(ROOT, 'src'), loader: 'js' },
  bundle: true, minify: true, format: 'iife', target: 'es2020',
  jsx: 'automatic', loader: { '.jsx': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  outfile: path.join(DIST, 'app.js'),
  legalComments: 'none',
  plugins: [{
    name: 'datasets',
    setup(b) {
      b.onResolve({ filter: /^virtual:datasets$/ }, () => ({ path: 'datasets', namespace: 'virtual' }));
      b.onLoad({ filter: /.*/, namespace: 'virtual' }, () => ({
        contents: `export const datasets = ${JSON.stringify({ concelhos })};`, loader: 'js',
      }));
    },
  }],
});

const tpl = fs.readFileSync(path.join(ROOT, 'src', 'template.html'), 'utf8');
const html = tpl.replace('{{TOC}}', tocHtml).replace('{{BODY}}', body)
  .replaceAll('{{UPDATED}}', updatedPt).replaceAll('{{UPDATED_ISO}}', updated).replaceAll('{{REPO}}', REPO);
fs.writeFileSync(path.join(DIST, 'index.html'), html);
for (const f of ['favicon.svg']) {
  const p = path.join(ROOT, 'src', f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(DIST, f));
}
console.log(`dist/index.html (${(html.length / 1024).toFixed(0)} KB), ${figures.length} gráficos, atualizado ${updated}`);
