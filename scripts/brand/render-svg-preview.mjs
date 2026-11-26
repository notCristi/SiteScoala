#!/usr/bin/env node
/**
 * Renders every component in src/components/svg/ through Astro's container API and
 * assembles a standalone specimen sheet at docs/svg-preview.html.
 *
 *   node scripts/brand/render-svg-preview.mjs
 *
 * Optional: SCREENSHOT=1 also writes docs/assets/svg-preview.png with Playwright
 * (resolved from the local or global node_modules; set NODE_PATH=$(npm root -g)).
 *
 * The project config is bypassed (`configFile: false`) so the Cloudflare adapter does not
 * replace Vite's runnable SSR environment — we only need the .astro compiler here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { getViteConfig } from 'astro/config';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const out = path.join(root, 'docs/svg-preview.html');
const fontDir = process.env.FONT_DIR ?? '/tmp/claude-0/fonts';

const viteCfg = await getViteConfig(
  { root, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' },
  { configFile: false, root, output: 'static', logLevel: 'error', devToolbar: { enabled: false } },
)({ command: 'serve', mode: 'production' });
const server = await createServer(viteCfg);
const { experimental_AstroContainer } = await server.ssrLoadModule('astro/container');
const container = await experimental_AstroContainer.create();

const dir = '/src/components/svg/';
const cssCache = new Map();
async function load(name) {
  const id = `${dir}${name}.astro`;
  const mod = await server.ssrLoadModule(id);
  if (!cssCache.has(name)) {
    let css = '';
    for (let i = 0; i < 4; i++) {
      try {
        const s = await server.ssrLoadModule(`${id}?astro&type=style&index=${i}&inline&lang.css`);
        css += s.default ?? '';
      } catch {
        break;
      }
    }
    cssCache.set(name, css);
  }
  return mod.default;
}
const strip = (html) => html.replace(/\s?data-astro-source-(file|loc)="[^"]*"/g, '');
async function render(name, props = {}) {
  return strip(await container.renderToString(await load(name), { props }));
}

const iconNames = [
  'search', 'menu', 'close', 'arrow-right', 'arrow-left', 'external', 'download', 'file-pdf', 'file-doc',
  'file-sheet', 'phone', 'mail', 'map-pin', 'clock', 'calendar', 'chevron-down', 'check', 'alert', 'play',
  'language', 'user', 'lock', 'upload', 'edit', 'trash', 'eye', 'plus', 'filter', 'grip',
];
const emblems = ['EmblemPrimar', 'EmblemGimnaziu', 'EmblemLiceu', 'EmblemDSD', 'EmblemCoetus', 'EmblemPress'];

const exists = (n) => fs.existsSync(path.join(root, `src/components/svg/${n}.astro`));
const sections = [];
const add = async (title, note, body, cls = '') => sections.push({ title, note, body: await body, cls });
const fig = (label, html, cls = '') => `<figure class="${cls}">${html}<figcaption>${label}</figcaption></figure>`;

if (exists('Seal'))
  await add('Seal', 'variant color · ink · light (on lapis-deep) — animate on load', (async () =>
    `<div class="row">${fig('color, animate', await render('Seal', { variant: 'color', animate: true, size: 260 }))}
     ${fig('ink', await render('Seal', { variant: 'ink', size: 260 }))}
     ${fig('light', await render('Seal', { variant: 'light', size: 260 }), 'dark')}
     ${fig('color 96px', await render('Seal', { variant: 'color', size: 96 }))}</div>`)());

if (exists('CrestMark'))
  await add('CrestMark', 'simplified crest for 16–48 px', (async () => {
    const sizes = [16, 20, 24, 32, 48, 96, 200];
    const r = await Promise.all(sizes.map((s) => render('CrestMark', { size: s })));
    return `<div class="row baseline">${r.map((h, i) => fig(`${sizes[i]}px`, h)).join('')}
      ${fig('48 on lapis', await render('CrestMark', { size: 48 }), 'dark')}
      ${fig('favicon.svg 16/32/64', ['16', '32', '64'].map((s) => `<img src="../public/favicon.svg" width="${s}" height="${s}" alt="">`).join(' '))}</div>`;
  })());

if (exists('CompassRose'))
  await add('CompassRose', '16-point rose, fleur-de-lis north, degree ring — animate', (async () =>
    `<div class="row">${fig('animate', await render('CompassRose', { animate: true, class: 'w320' }))}
     ${fig('64px', await render('CompassRose', { class: 'w64' }))}</div>`)());

if (exists('Graticule'))
  await add('Graticule', 'background ornament, shown at 100% ink (use at ~5–10%)', (async () =>
    `${fig('animate', await render('Graticule', { animate: true, class: 'wfull' }))}`)());

if (exists('CourtyardElevation'))
  await add('CourtyardElevation', 'Honterushof frieze — full width on paper and on lapis-deep, then 390 px crop', (async () => {
    const h = await render('CourtyardElevation', {});
    return `${fig('1440 wide', h, 'full')}${fig('on lapis-deep, animate', await render('CourtyardElevation', { animate: true }), 'full dark')}
    <div class="row">${fig('390 px (mobile crop)', `<div style="width:390px">${h}</div>`, 'dark')}${fig('768 px', `<div style="width:768px">${h}</div>`)}</div>`;
  })());

if (emblems.every(exists))
  await add('Cycle emblems', '64 × 64, stroke 1.5 — shown at 64, 128 and 32 px', (async () => {
    let s = '<div class="row">';
    for (const e of emblems) s += fig(e.replace('Emblem', ''), `${await render(e, { class: 'w128' })}${await render(e, { class: 'w64' })}${await render(e, { class: 'w32' })}`);
    return s + '</div>';
  })());

const orn = ['Fleuron', 'Manicule', 'DoubleRule', 'RubricNumeral'].filter(exists);
if (orn.length)
  await add('Ornaments', 'fleuron, manicule, double rule, rubric numerals', (async () => {
    let s = '<div class="row baseline">';
    if (exists('Fleuron')) s += fig('Fleuron 24 / 48 / 160', (await render('Fleuron', { size: 24 })) + (await render('Fleuron', { size: 48 })) + (await render('Fleuron', { size: 160 })));
    if (exists('Manicule')) s += fig('Manicule 32 / 64 / 160', (await render('Manicule', { size: 32 })) + (await render('Manicule', { size: 64 })) + (await render('Manicule', { size: 160 })));
    if (exists('RubricNumeral')) s += fig('RubricNumeral', `<span class="rubric">${await render('RubricNumeral', { n: 1 })}${await render('RubricNumeral', { n: 4 })}${await render('RubricNumeral', { n: 'XII' })}${await render('RubricNumeral', { n: 3, filled: true })}${await render('RubricNumeral', { n: 7, class: 'big' })}</span>`);
    s += '</div>';
    if (exists('DoubleRule')) s += fig('DoubleRule', await render('DoubleRule', {}), 'full') + fig('DoubleRule with crest', await render('DoubleRule', { crest: true }), 'full');
    return s;
  })());

if (exists('Icon'))
  await add('Icon', '24 × 24 grid, stroke 1.5 — at 24 px and 48 px', (async () => {
    let a = '', b = '';
    for (const n of iconNames) {
      a += `<figure class="ic">${await render('Icon', { name: n })}<figcaption>${n}</figcaption></figure>`;
      b += await render('Icon', { name: n, class: 'w48' });
    }
    return `<div class="icons">${a}</div><div class="icons big">${b}</div><div class="icons dark">${b}</div>`;
  })());

const css = [...cssCache.values()].join('\n');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>SVG suite — Honterus</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
@font-face{font-family:'EB Garamond';src:url('file://${fontDir}/EBGaramond[wght].ttf');font-weight:400 800}
@font-face{font-family:'EB Garamond';font-style:italic;src:url('file://${fontDir}/EBGaramond-Italic[wght].ttf');font-weight:400 800}
:root{--paper:#F7F3EA;--ink:#15171E;--rubric:#B0121E;--lapis-deep:#0B1B4D;--font-serif:'EB Garamond',Georgia,serif}
*{box-sizing:border-box}
body{margin:0;padding:40px 48px 80px;background:var(--paper);color:var(--ink);font:16px/1.4 var(--font-serif);width:1440px}
h1{font-weight:500;font-size:44px;margin:0 0 4px}
h2{font-weight:500;font-size:28px;margin:0}
section{border-top:1px solid rgb(21 23 30/.4);padding:20px 0 28px}
section>p{margin:0 0 16px;font-style:italic;color:#4B4D57}
.row{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start}
.row.baseline{align-items:flex-end}
figure{margin:0;display:flex;flex-direction:column;gap:8px;align-items:flex-start}
figure.full{width:100%}
figure>svg,figure>div{max-width:100%}
figcaption{font-size:13px;font-style:italic;color:#4B4D57}
.dark{background:var(--lapis-deep);color:var(--paper);padding:16px}
.dark figcaption{color:#c9cbe0}
figure.full.dark{padding:16px 0 0}
.w24{width:24px;height:24px}.w32{width:32px;height:32px}.w48{width:48px;height:48px}.w64{width:64px;height:64px}
.w96{width:96px;height:96px}.w128{width:128px;height:128px}.w320{width:320px;height:320px}.wfull{width:100%;height:auto}
figure svg + svg{margin-left:0}
.icons{display:grid;grid-template-columns:repeat(15,1fr);gap:10px 6px;margin-bottom:16px}
.icons.big{grid-template-columns:repeat(15,1fr)}
.ic{align-items:center}.ic svg{width:24px;height:24px}.ic figcaption{font-size:11px}
.rubric{color:var(--rubric);display:flex;gap:16px;align-items:center;font-size:20px}
.rubric .big{font-size:40px}
</style>
<style>${css}</style></head><body>
<h1>Officina Coronensis — SVG suite</h1>
<p style="margin:0 0 24px;font-style:italic">Hand-authored components in <code>src/components/svg/</code>. One ink, currentColor. Rendered by <code>scripts/brand/render-svg-preview.mjs</code>.</p>
${sections.map((s) => `<section class="${s.cls}"><h2>${s.title}</h2><p>${s.note}</p>${s.body}</section>`).join('\n')}
</body></html>`;
fs.writeFileSync(out, html);
console.log('wrote', path.relative(root, out), (html.length / 1024).toFixed(0), 'KB');
await server.close();

if (process.env.SCREENSHOT) {
  const require = createRequire(import.meta.url);
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1536, height: 900 }, deviceScaleFactor: 1 });
  await page.goto('file://' + out);
  await page.waitForTimeout(1800);
  const png = path.join(root, 'docs/assets/svg-preview.png');
  await page.screenshot({ path: png, fullPage: true });
  await browser.close();
  console.log('wrote', path.relative(root, png));
}
process.exit(0);
