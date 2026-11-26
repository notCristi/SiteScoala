#!/usr/bin/env node
/**
 * Honterus seal — vector build pipeline.
 *
 * Source of truth: docs/assets/logo-original.png (the new official emblem supplied by the school).
 * 1. The woodcut crest (Kronstadt crown-and-roots arms in a Renaissance cartouche) is traced
 *    with potrace from scripts/brand/crest-source-bw.png (masked, 4× upscaled, thresholded crop).
 * 2. Rings are constructed geometrically (concentric circles, measured from the original).
 * 3. The legend is set on arcs from real fonts (Liberation Serif — Times-metric; UnifrakturMaguntia —
 *    Fraktur) and converted to outlines, so the SVG has no font dependency.
 *
 * Outputs (committed, so this script only runs when the mark must be regenerated):
 *   public/brand/honterus-seal.svg            full colour master
 *   public/brand/honterus-seal-mono.svg       single ink (#14171F) on transparent
 *   public/brand/honterus-seal-mono-light.svg single ink (paper) for dark surfaces
 *   public/brand/honterus-crest.svg           crest only, ink
 *   public/brand/honterus-crest-light.svg     crest only on a paper-tone backing (for dark surfaces)
 *   src/brand/seal-geometry.json              path data for the inline/animated component
 *
 * Usage: node scripts/brand/build-logo.mjs   (needs devDeps: potrace, opentype.js)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import potrace from 'potrace';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const P = JSON.parse(fs.readFileSync(path.join(here, 'logo-params.json'), 'utf8'));
const load = (f) => {
  const b = fs.readFileSync(path.join(here, 'fonts', f));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
};
const frak = load('UnifrakturMaguntia-Book.ttf');
const serif = load('LiberationSerif-Regular.ttf');

const C = 500;
const f = (n) => Math.round(n * 10) / 10;

export const INK = '#14171F';
export const PAPER = '#FBF8F1';
export const RED = '#C40817'; // sampled from the original: rgb(196, 8, 23)
export const BLUE = '#001F77'; // sampled from the original: rgb(0, 31, 119)

/** Six-spoke asterisk used between „Brașov” and „Kronstadt”. */
function asterisk(cx, cy, r, w) {
  let d = '';
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 2;
    const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
    const nx = (-Math.sin(a) * w) / 2, ny = (Math.cos(a) * w) / 2;
    d += `M${f(cx - dx + nx)} ${f(cy - dy + ny)}L${f(cx + dx + nx)} ${f(cy + dy + ny)}L${f(cx + dx - nx)} ${f(cy + dy - ny)}L${f(cx - dx - nx)} ${f(cy - dy - ny)}Z`;
  }
  return d;
}

/**
 * Set text on a circular baseline of radius r.
 * dir = 1  → clockwise, glyph tops point outward (upper legend).
 * dir = -1 → counter-clockwise, tops point inward (lower legend, reads left→right).
 * Tracking is solved so the run spans exactly spanDeg degrees (measured from the original).
 */
function arcText(segments, r, centerDeg, dir, spanDeg) {
  let L0 = 0, n = 0;
  for (const s of segments) {
    const gl = s.font.stringToGlyphs(s.text);
    gl.forEach((g, i) => {
      L0 += (g.advanceWidth * s.size) / s.font.unitsPerEm;
      if (i < gl.length - 1) L0 += (s.font.getKerningValue(g, gl[i + 1]) * s.size) / s.font.unitsPerEm;
      n++;
    });
  }
  const tracking = ((spanDeg * Math.PI) / 180 * r - L0) / n;
  let ang = (centerDeg * Math.PI) / 180 + (dir * (spanDeg * Math.PI)) / 180 / 2;
  let out = '';
  for (const s of segments) {
    const gl = s.font.stringToGlyphs(s.text);
    gl.forEach((g, i) => {
      let adv = (g.advanceWidth * s.size) / s.font.unitsPerEm + tracking;
      if (i < gl.length - 1) adv += (s.font.getKerningValue(g, gl[i + 1]) * s.size) / s.font.unitsPerEm;
      const half = adv / 2 / r;
      const mid = ang - dir * half;
      if (s.star) {
        const rr = r - s.size * 0.33;
        out += asterisk(C + rr * Math.cos(mid), C - rr * Math.sin(mid), s.size * 0.27, s.size * 0.075);
      } else {
        const rr = r + dir * (s.dy || 0);
        const px = C + rr * Math.cos(mid), py = C - rr * Math.sin(mid);
        const th = ((dir === 1 ? 90 : -90) - (mid * 180) / Math.PI) * (Math.PI / 180);
        const cs = Math.cos(th), sn = Math.sin(th);
        const T = (x, y) => `${f(px + x * cs - y * sn)} ${f(py + x * sn + y * cs)}`;
        for (const c of g.getPath(-adv / 2 + tracking / 2, 0, s.size).commands) {
          if (c.type === 'M') out += `M${T(c.x, c.y)}`;
          else if (c.type === 'L') out += `L${T(c.x, c.y)}`;
          else if (c.type === 'Q') out += `Q${T(c.x1, c.y1)} ${T(c.x, c.y)}`;
          else if (c.type === 'C') out += `C${T(c.x1, c.y1)} ${T(c.x2, c.y2)} ${T(c.x, c.y)}`;
          else if (c.type === 'Z') out += 'Z';
        }
      }
      ang -= dir * 2 * half;
    });
  }
  return out;
}

const seg = (font, size, text, [a0, a1], dy = 0) =>
  arcText([{ font, size, text, dy }], P.topR, (a0 + a1) / 2, 1, a0 - a1);

// NB: the official artwork spells the German line „Naționalkolleg” (with Romanian ț).
// We reproduce the mark faithfully; site copy uses the correct German „Nationalkolleg”.
const legendTop =
  seg(serif, P.serifSize, 'Colegiul Național', P.s1) +
  seg(frak, P.frakSize, 'Johannes Honterus', P.s2, P.frakDy) +
  seg(serif, P.serifSize, P.germanLine ?? '-Naționalkolleg', P.s3);
const legendBottom = arcText(
  [
    { font: serif, size: P.botSize, text: 'Brașov ' },
    { font: serif, size: P.botSize, text: 'o', star: true },
    { font: serif, size: P.botSize, text: ' Kronstadt' },
  ],
  P.botR, P.botCenter, -1, P.botSpan,
);

const trace = (file, opts) =>
  new Promise((res, rej) =>
    potrace.trace(file, { blackOnWhite: true, ...opts }, (e, svg) => (e ? rej(e) : res(svg))),
  );

const crestSvg = await trace(path.join(here, 'crest-source-bw.png'), {
  turdSize: 8, alphaMax: 1, optCurve: true, optTolerance: 0.4,
});
const silSvg = await trace(path.join(here, 'crest-silhouette.png'), { turdSize: 200, optTolerance: 1 });
// crest-source-bw.png = crop (330,260)… of the 1254px original, upscaled ×4.
const k = P.k;
const toViewBox = (svgText) => [...svgText.matchAll(/<path d="([^"]+)"/g)]
  .map((m) => m[1])
  .join('')
  .replace(/(-?\d+(?:\.\d+)?)[ ,]+(-?\d+(?:\.\d+)?)/g, (_, x, y) => {
    const ox = 330 + parseFloat(x) / 4, oy = 260 + parseFloat(y) / 4;
    return `${f((ox - P.ocx) * k + C)} ${f((oy - P.ocy) * k + C)}`;
  })
  .replace(/\s*([MCLZ])\s*/g, '$1');
const crest = toViewBox(crestSvg);
const crestBack = toViewBox(silSvg);

const R = P.ringR, t = P.ringT, hair = P.hair;
const geometry = {
  viewBox: '0 0 1000 1000',
  ring: { r: R, t, hair, red: RED, blue: BLUE },
  legendTop, legendBottom, crest, crestBack,
  crestBox: [276, 224, 458, 570],
};

const rings = (ink, red, blue, paper) => `${paper ? `<circle cx="500" cy="500" r="${R}" fill="${paper}"/>` : ''}
<circle cx="500" cy="500" r="${f(R - t / 2)}" fill="none" stroke="${red}" stroke-width="${t}"/>
<circle cx="500" cy="500" r="${f(R - t * 1.5)}" fill="none" stroke="${blue}" stroke-width="${t}"/>
<circle cx="500" cy="500" r="${R}" fill="none" stroke="${ink}" stroke-width="${hair}"/>
<circle cx="500" cy="500" r="${f(R - 2 * t)}" fill="none" stroke="${ink}" stroke-width="${hair}"/>`;

const seal = (title, ink, red, blue, paper, crestPaper = null, crestInk = null) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img" aria-labelledby="t">
<title id="t">${title}</title>
${rings(ink, red, blue, paper)}
<path fill="${ink}" d="${legendTop}${legendBottom}"/>
${crestPaper ? `<path fill="${crestPaper}" d="${crestBack}"/>` : ''}<path fill="${crestInk ?? ink}" fill-rule="evenodd" d="${crest}"/>
</svg>
`;
const crestOnly = (ink, back) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="276 224 458 570" role="img" aria-label="Stema Colegiului Național „Johannes Honterus”"><path fill="${back}" d="${crestBack}"/><path fill="${ink}" fill-rule="evenodd" d="${crest}"/></svg>
`;

const name = 'Colegiul Național „Johannes Honterus” Brașov — Honterus-Nationalkolleg Kronstadt';
const out = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true });
  fs.writeFileSync(path.join(root, p), s);
  console.log(p.padEnd(46), (s.length / 1024).toFixed(1), 'KB');
};
out('public/brand/honterus-seal.svg', seal(name, '#111111', RED, BLUE, '#FFFFFF'));
out('public/brand/honterus-seal-mono.svg', seal(name, INK, INK, INK, null));
out('public/brand/honterus-seal-mono-light.svg', seal(name, PAPER, PAPER, PAPER, null, PAPER, INK));
out('public/brand/honterus-crest.svg', crestOnly(INK, '#FFFFFF'));
out('public/brand/honterus-crest-light.svg', crestOnly(INK, PAPER));
out('src/brand/seal-geometry.json', JSON.stringify(geometry));
