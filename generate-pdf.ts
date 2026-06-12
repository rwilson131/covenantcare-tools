/**
 * generate-pdf.ts — CovenantCare branded document PDF generator.
 *
 * markdown --> branded HTML --> headless Chrome --print-to-pdf --> PDF.
 * Only external dependency: Google Chrome (already on every machine).
 * Self-contained: bundles brand fonts + wordmark. Cross-platform (Mac/Windows).
 *
 * Usage:
 *   bun generate-pdf.ts --doctype "Policy" --output out.pdf input.md
 *   flags: --doctype <str>  --confidential   --output <path>  <input.md>
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { dirname, resolve, basename } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const HERE = dirname(fileURLToPath(import.meta.url));

// ---- args ----
const argv = process.argv.slice(2);
let docType = 'Document', confidential = false, output = '', input = '';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--doctype') docType = argv[++i];
  else if (argv[i] === '--confidential') confidential = true;
  else if (argv[i] === '--output') output = argv[++i];
  else input = argv[i];
}
if (!input) { console.error('Usage: bun generate-pdf-html.ts [--doctype X] [--confidential] --output out.pdf input.md'); process.exit(1); }
input = resolve(input);
if (!output) output = input.replace(/\.md$/i, '.pdf');
output = resolve(output);

// ---- parse frontmatter + body ----
let raw = readFileSync(input, 'utf8');
let fm: Record<string, string> = {};
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
if (fmMatch) {
  for (const line of fmMatch[1].split('\n')) {
    const m = line.match(/^([a-zA-Z0-9_-]+):\s*"?(.*?)"?\s*$/);
    if (m) fm[m[1]] = m[2];
  }
  raw = raw.slice(fmMatch[0].length);
}
const title = fm.title || basename(input, '.md');
const subtitle = fm.subtitle || '';
const effectiveDate = fm['effective-date'] || '';
const version = fm.version || '';

// Drop a leading H1 that just repeats the frontmatter title. The title block
// already prints the title under the wordmark; without this the title shows
// twice (once in the masthead, once as the first body heading).
{
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;          // skip leading blanks
    const h = lines[i].match(/^#\s+(.*\S)\s*$/);    // first non-blank line only
    if (h && norm(h[1]) === norm(title)) lines.splice(i, 1);
    break;
  }
  raw = lines.join('\n');
}

// Strip ## Internal Notes section — internal tracking only, never published
{
  const notesIdx = raw.indexOf('\n## Internal Notes\n');
  if (notesIdx !== -1) {
    const after = raw.slice(notesIdx + 1);
    const nextH2 = after.slice(1).search(/\n## /);
    raw = nextH2 === -1
      ? raw.slice(0, notesIdx)
      : raw.slice(0, notesIdx) + '\n' + after.slice(nextH2 + 1);
  }
}

// strip markdown horizontal rules used as separators (keep content)
raw = raw.split('\n').filter(l => !/^(\s*---\s*|\s*\*\*\*\s*)$/.test(l)).join('\n');
const bodyHtml = marked.parse(raw, { async: false }) as string;

// ---- fonts as base64 data URIs (so Chrome renders them reliably) ----
const fontFace = (family: string, file: string, weight = 'normal', style = 'normal') => {
  const p = `${HERE}/assets/fonts/${file}`;
  if (!existsSync(p)) return '';
  const b64 = readFileSync(p).toString('base64');
  const fmt = file.endsWith('.otf') ? 'opentype' : 'truetype';
  return `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};src:url(data:font/${fmt};base64,${b64}) format('${fmt}');}`;
};
const fonts = [
  fontFace('EB Garamond', 'EBGaramond-Regular.otf'),
  fontFace('EB Garamond', 'EBGaramond-Italic.otf', 'normal', 'italic'),
  fontFace('Libertine', 'LinLibertine-Regular.otf'),
  fontFace('Libertine', 'LinLibertine-Bold.otf', 'bold'),
  fontFace('Libertine', 'LinLibertine-Italic.otf', 'normal', 'italic'),
  fontFace('Libertine', 'LinLibertine-BoldItalic.otf', 'bold', 'italic'),
].join('\n');

const wordmarkB64 = existsSync(`${HERE}/assets/logos/cc-wordmark.png`)
  ? 'data:image/png;base64,' + readFileSync(`${HERE}/assets/logos/cc-wordmark.png`).toString('base64') : '';

const NAVY = '#003F87', RED = '#C8102E', CHARCOAL = '#2A2A2A';
const footer = `<span style="color:${NAVY}"><b><i>Covenant</i>Care Practices</b> | (931) 245-1150 | www.<i>Covenant</i>CarePractices.com</span>`;

// ---- assemble HTML ----
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${fonts}
@page { size: letter; margin: 0.85in 1in 0.85in 1in; }
html,body{margin:0;padding:0;color:${CHARCOAL};font-family:'Libertine',Georgia,serif;font-size:11.5pt;line-height:1.4;}
/* Repeating footer with RESERVED space. The layout table's <tfoot> repeats on
   every printed page and reserves a band at the bottom of each page, so flowing
   body text can never run into the footer. The footer text itself is pinned into
   that band with position:fixed (Chrome repeats fixed elements on every page).
   This is the reliable Chrome-print pattern — a fixed footer ALONE overlaps the
   last lines because Chrome reserves no per-page space for it. */
table.page-layout{ width:100%; border-collapse:collapse; }
table.page-layout > tbody > tr > td, table.page-layout > tfoot > tr > td{ border:0; padding:0; }
.footer-space{ height:0.5in; }
.docfoot{ position:fixed; bottom:0; left:0; right:0; height:0.3in; line-height:0.3in; font-size:8pt; text-align:center; }
.titleblock{ text-align:center; margin-bottom:6pt; }
.titleblock img{ height:54px; }
.titleblock .doctitle{ font-family:'EB Garamond',Georgia,serif; color:${NAVY}; font-size:20pt; font-weight:bold; margin:8pt 0 0; }
.titleblock .subtitle{ font-family:'EB Garamond',Georgia,serif; color:${NAVY}; font-size:13pt; margin:3pt 0 0; }
.metarule{ border:0; border-top:1px solid ${NAVY}; margin:14pt 0 10pt; }
.meta{ font-size:10pt; margin:0 0 14pt; }
.meta .eff{ font-weight:bold; } .meta .ver{ float:right; }
${confidential ? `.confidential{ color:${RED}; font-weight:bold; letter-spacing:.1em; text-align:center; margin:0 0 12pt; }` : ''}
h1,h2{ font-family:'EB Garamond',Georgia,serif; color:${NAVY}; font-weight:bold; }
h2{ font-size:1.5rem; border-bottom:1px solid ${NAVY}; padding-bottom:3pt; margin-top:18pt; }
h3{ font-family:'EB Garamond',Georgia,serif; color:${NAVY}; font-size:1.1rem; font-weight:bold; margin-top:14pt; }
h4{ font-family:'EB Garamond',Georgia,serif; color:${CHARCOAL}; font-style:italic; font-size:1rem; margin-top:12pt; }
p{ margin:6pt 0; } ul,ol{ margin:6pt 0 6pt 1.2em; } li{ margin:2pt 0; }
a{ color:${NAVY}; }
code{ font-family:Menlo,Consolas,monospace; font-size:0.92em; }
.center{ text-align:center; }       /* pandoc-converted centered blocks */
.smallcaps{ font-variant:small-caps; }
table{ border-collapse:collapse; width:100%; margin:8pt 0; }
th,td{ border:1px solid #ccc; padding:4pt 8pt; text-align:left; font-size:10.5pt; }
th{ background:#f5f5f5; color:${NAVY}; }
</style></head><body>
<table class="page-layout">
<tfoot><tr><td><div class="footer-space"></div></td></tr></tfoot>
<tbody><tr><td>
<div class="titleblock">
  ${wordmarkB64 ? `<img src="${wordmarkB64}" alt="CovenantCare">` : ''}
  <p class="doctitle">${title}</p>
  ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
</div>
<hr class="metarule">
<div class="meta">
  ${version ? `<span class="ver">Version: ${version}</span>` : ''}
  ${effectiveDate ? `<span class="eff">Effective Date:</span> ${effectiveDate}` : ''}
</div>
${confidential ? `<p class="confidential">CONFIDENTIAL</p>` : ''}
${bodyHtml}
</td></tr></tbody>
</table>
<div class="docfoot">${footer}</div>
</body></html>`;

const htmlPath = output.replace(/\.pdf$/i, '.__gen.html');
writeFileSync(htmlPath, html);

// ---- Chrome --print-to-pdf ----
const LOCALAPPDATA = process.env.LOCALAPPDATA || '';
const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  // Windows per-user install (very common — Chrome defaults here without admin)
  LOCALAPPDATA ? `${LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : '',
  // Microsoft Edge (Chromium) is on every Windows 10/11 box — works as a fallback
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'google-chrome', 'chromium', 'chrome',
].filter(Boolean);
const chrome = CHROME_CANDIDATES.find(c => c.includes('/') || c.includes('\\') ? existsSync(c) : true) || 'google-chrome';
execFileSync(chrome, [
  '--headless', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
  `--print-to-pdf=${output}`, `file://${htmlPath}`,
], { stdio: 'ignore' });
try { (await import('fs')).unlinkSync(htmlPath); } catch {}
console.log(`PDF generated: ${output}`);
