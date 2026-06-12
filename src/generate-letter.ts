/**
 * generate-letter.ts — CovenantCare professional letterhead generator.
 *
 * markdown-with-frontmatter → branded HTML → headless Chrome → PDF
 *
 * Usage:
 *   bun generate-letter.ts [--output out.pdf] input.md
 *
 * Frontmatter fields:
 *   date:          "June 12, 2026"              (required)
 *   from-name:     "Robert Wilson, MD"           (optional — signature block)
 *   from-title:    "Chairman, CovenantCare Practices"  (optional)
 *   from-location: sango | hilldale | dover | none     (default: sango)
 *   to: |                                        (addressee block, multiline)
 *     Jane Doe
 *     123 Main St
 *   re:            "Subject line"                (optional)
 *   closing:       "Sincerely,"                  (default: "Sincerely,")
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const FONTS = `${ROOT}/assets/fonts`;
const LOGO_PATH = `${ROOT}/assets/logos/cc-lockup-familymedicine.png`;

// ── location data ──────────────────────────────────────────────────────────────
const LOCATIONS: Record<string, { name: string; street: string; city: string; state: string; zip: string; phone: string; fax: string }> = {
  sango:    { name: 'CovenantCare Sango',    street: '1000 Highway 76W',    city: 'Clarksville', state: 'TN', zip: '37043', phone: '(931) 245-1150', fax: '(931) 245-1153' },
  hilldale: { name: 'CovenantCare Hilldale', street: '236 Uffelman Drive',  city: 'Clarksville', state: 'TN', zip: '37043', phone: '(931) 647-6305', fax: '(931) 245-0605' },
  dover:    { name: 'CovenantCare Dover',    street: '1511 Donelson Pkwy',  city: 'Dover',       state: 'TN', zip: '37058', phone: '(931) 232-5555', fax: '(931) 232-9851' },
};

// ── args ───────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
let output = '', input = '', locationOverride = '';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--output') output = argv[++i];
  else if (argv[i] === '--location') locationOverride = argv[++i];
  else input = argv[i];
}
if (!input || argv.includes('--help')) {
  console.log(`Usage: bun generate-letter.ts [--output out.pdf] input.md

Frontmatter:
  date:          "June 12, 2026"
  from-name:     "Robert Wilson, MD"
  from-title:    "Chairman, CovenantCare Practices"
  from-location: sango | hilldale | dover | none  (default: sango)
  to: |
    Jane Doe
    123 Main Street
  re:            "Subject line"
  closing:       "Sincerely,"  (default)

Flags override frontmatter — same template works for any location:
  --location sango | hilldale | dover

Body: markdown prose — no H1 needed (letterhead serves as the header).`);
  process.exit(input ? 0 : 1);
}
input = resolve(input);
if (!output) output = input.replace(/\.md$/i, '.pdf');
output = resolve(output);

// ── frontmatter parser (handles | block scalars) ──────────────────────────────
function parseFrontmatter(raw: string): { fm: Record<string, string>; body: string } {
  if (!raw.startsWith('---\n')) return { fm: {}, body: raw };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { fm: {}, body: raw };

  const fmBlock = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const fm: Record<string, string> = {};

  const lines = fmBlock.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*?)\s*$/);
    if (keyMatch) {
      const key = keyMatch[1];
      const val = keyMatch[2];
      if (val === '|') {
        const blockLines: string[] = [];
        i++;
        while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
          blockLines.push(lines[i].startsWith('  ') ? lines[i].slice(2) : '');
          i++;
        }
        fm[key] = blockLines.join('\n').trimEnd();
        continue;
      } else {
        fm[key] = val.replace(/^["']|["']$/g, '');
      }
    }
    i++;
  }

  return { fm, body };
}

const rawFile = readFileSync(input, 'utf8');
const { fm, body } = parseFrontmatter(rawFile);

const date          = fm['date'] || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const fromName      = fm['from-name'] || '';
const fromTitle     = fm['from-title'] || '';
const fromLocation  = locationOverride || fm['from-location'] || 'sango';
const toBlock       = fm['to'] || '';
const re            = fm['re'] || '';
const closing       = fm['closing'] || 'Sincerely,';

const loc = LOCATIONS[fromLocation] || null;

// ── fonts ──────────────────────────────────────────────────────────────────────
const fontFace = (family: string, file: string, weight = 'normal', style = 'normal') => {
  const p = `${FONTS}/${file}`;
  if (!existsSync(p)) return '';
  const b64 = readFileSync(p).toString('base64');
  const fmt = file.endsWith('.otf') ? 'opentype' : 'truetype';
  return `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};src:url(data:font/${fmt};base64,${b64}) format('${fmt}');}`;
};
const fonts = [
  fontFace('Source Sans 3', 'SourceSans3-Regular.ttf'),
  fontFace('Source Sans 3', 'SourceSans3-Bold.ttf', 'bold'),
  fontFace('Source Sans 3', 'SourceSans3-Italic.ttf', 'normal', 'italic'),
  fontFace('Source Sans 3', 'SourceSans3-BoldItalic.ttf', 'bold', 'italic'),
  fontFace('EB Garamond',   'EBGaramond-Regular.otf'),
  fontFace('EB Garamond',   'EBGaramond-Italic.otf', 'normal', 'italic'),
].join('\n');

// ── logo ───────────────────────────────────────────────────────────────────────
const logoB64 = existsSync(LOGO_PATH)
  ? 'data:image/png;base64,' + readFileSync(LOGO_PATH).toString('base64')
  : '';

// ── colors ─────────────────────────────────────────────────────────────────────
const NAVY = '#003F87', CHARCOAL = '#2A2A2A', LIGHT_GRAY = '#F5F5F5';

// ── address block HTML ─────────────────────────────────────────────────────────
const addressHtml = loc
  ? `<div class="lh-address">
      ${loc.street}<br>
      ${loc.city}, ${loc.state} ${loc.zip}<br>
      ${loc.phone}<br>
      <a href="https://www.CovenantCarePractices.com" style="color:${NAVY};text-decoration:none;">CovenantCarePractices.com</a>
    </div>`
  : '';

// ── to block ───────────────────────────────────────────────────────────────────
const toHtml = toBlock
  ? `<div class="lh-to">${toBlock.split('\n').map(l => l.trimEnd()).join('<br>')}</div>`
  : '';

// ── re line ────────────────────────────────────────────────────────────────────
const reHtml = re ? `<p class="lh-re"><strong>Re:</strong> ${re}</p>` : '';

// ── signature block ────────────────────────────────────────────────────────────
const sigHtml = (fromName || fromTitle)
  ? `<div class="lh-sig">
      <p>${closing}</p>
      <div class="lh-sig-space"></div>
      <p>${fromName ? `<strong>${fromName}</strong>` : ''}${fromName && fromTitle ? '<br>' : ''}${fromTitle ? fromTitle : ''}</p>
    </div>`
  : `<p>${closing}</p>`;

// ── body HTML ──────────────────────────────────────────────────────────────────
const bodyHtml = marked.parse(body.trim(), { async: false }) as string;

// ── footer ─────────────────────────────────────────────────────────────────────
const footerText = loc
  ? `<em>Covenant</em>Care Practices | ${loc.street}, ${loc.city}, ${loc.state} ${loc.zip} | ${loc.phone} | CovenantCarePractices.com`
  : `<em>Covenant</em>Care Practices | CovenantCarePractices.com`;

// ── assemble HTML ──────────────────────────────────────────────────────────────
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
${fonts}
@page { size: letter; margin: 0.5in 0.9in 0.6in 0.9in; }
html,body { margin:0; padding:0; color:${CHARCOAL}; font-family:'Source Sans 3',Arial,sans-serif; font-size:10.5pt; line-height:1.45; }

/* repeating footer pattern (same as policy generator) */
table.page-layout { width:100%; border-collapse:collapse; }
table.page-layout > tbody > tr > td, table.page-layout > tfoot > tr > td { border:0; padding:0; }
.footer-space { height:0.35in; }
.docfoot { position:fixed; bottom:0; left:0; right:0; height:0.28in; line-height:0.28in; font-size:7.5pt; text-align:center; color:${CHARCOAL}; }
.docfoot a { color:${CHARCOAL}; }

/* letterhead header */
.lh-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:6pt; }
.lh-logo img { height:62px; max-width:280px; }
.lh-address { font-size:9pt; text-align:right; line-height:1.4; color:${CHARCOAL}; }
.lh-rule { border:0; border-top:2px solid ${NAVY}; margin:0 0 10pt; }

/* letter body sections */
.lh-date { margin:0 0 10pt; font-size:10.5pt; }
.lh-to { margin-bottom:10pt; line-height:1.5; font-size:10.5pt; }
.lh-re { margin:0 0 10pt; font-size:10.5pt; }
.lh-body { font-size:10.5pt; }
.lh-body p { margin:0 0 7pt; }
.lh-body ul, .lh-body ol { margin:4pt 0 7pt 1.1em; }
.lh-body li { margin:1pt 0; }
.lh-body h1,h2,h3 { font-family:'EB Garamond',Georgia,serif; color:${NAVY}; }

/* signature */
.lh-sig { margin-top:12pt; font-size:10.5pt; }
.lh-sig p { margin:0; }
.lh-sig-space { height:40pt; }

/* general type */
a { color:${NAVY}; }
strong { font-weight:600; }
</style>
</head>
<body>
<table class="page-layout">
<tfoot><tr><td><div class="footer-space"></div></td></tr></tfoot>
<tbody><tr><td>

<div class="lh-header">
  <div class="lh-logo">${logoB64 ? `<img src="${logoB64}" alt="CovenantCare Practices">` : `<strong style="font-size:16pt;color:${NAVY}"><em>Covenant</em>Care Practices</strong>`}</div>
  ${addressHtml}
</div>
<hr class="lh-rule">

<p class="lh-date">${date}</p>

${toHtml}

${reHtml}

<div class="lh-body">
${bodyHtml}
</div>

${sigHtml}

</td></tr></tbody>
</table>
<div class="docfoot">${footerText}</div>
</body>
</html>`;

// ── write HTML and invoke Chrome ───────────────────────────────────────────────
const htmlPath = output.replace(/\.pdf$/i, '.__letter.html');
writeFileSync(htmlPath, html);

const LOCALAPPDATA = process.env.LOCALAPPDATA || '';
const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  LOCALAPPDATA ? `${LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : '',
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
console.log(`Letter PDF: ${output}`);
