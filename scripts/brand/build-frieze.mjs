#!/usr/bin/env node
/**
 * Footer frieze — emits public/brand/courtyard-frieze.svg from the drawing in
 * src/components/svg/CourtyardElevation.astro (the source of truth), in the footer ink (--lapis-deep).
 *
 * Why a file: the frieze is decorative and identical on every page, so as an <img> it is fetched once
 * and cached instead of travelling inside every (uncached-by-the-browser) HTML response.
 *
 * Usage: node scripts/brand/build-frieze.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minPath } from './path-min.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const src = fs.readFileSync(path.join(root, 'src/components/svg/CourtyardElevation.astro'), 'utf8');
const get = (k) => {
  const m = new RegExp(`const ${k} =\\s*'([^']*)'`).exec(src);
  if (!m) throw new Error(`frieze: ${k} not found`);
  return minPath(m[1], 1);
};
const INK = '#0b1b4d'; // --lapis-deep (src/styles/global.css)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 260" preserveAspectRatio="xMidYMax slice" fill="none" stroke="${INK}" stroke-linecap="square"><mask id="o" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="260"><rect width="1600" height="260" fill="#fff"/><path d="${get('OCCLUDE')}" fill="#000"/></mask><path d="${get('RIDGE')}" stroke-width=".9" mask="url(#o)" opacity=".55"/><path d="${get('HATCH')}" stroke-width=".8" stroke-linecap="butt"/><path d="${get('DETAIL')}" stroke-width="1.1"/><path d="${get('OUTLINE')}" stroke-width="1.7"/><path d="${get('FILL')}" fill="${INK}" stroke="none"/></svg>
`;
const out = path.join(root, 'public/brand/courtyard-frieze.svg');
fs.writeFileSync(out, svg);
console.log('public/brand/courtyard-frieze.svg', (svg.length / 1024).toFixed(1), 'KB');
