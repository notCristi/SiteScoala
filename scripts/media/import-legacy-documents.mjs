#!/usr/bin/env node
/**
 * Moves the legacy documents (PDF/DOC/XLS… linked from the old WordPress site) into R2, so they keep
 * working after the domain switches to the new site.
 *
 *   node scripts/media/import-legacy-documents.mjs download          # fetch into .cache/legacy-docs + write the manifest
 *   node scripts/media/import-legacy-documents.mjs upload --local    # put every file into the local R2 (wrangler dev)
 *   node scripts/media/import-legacy-documents.mjs upload --remote   # put every file into the production bucket
 *
 * Manifest: scripts/seed/content/documents-files.json  { "<legacy url>": { r2_key, size_bytes, sha256, mime } }
 * build-seed.mjs reads it: documents get an r2_key (served at /files/…) and every old upload URL gets a 301 to the new one.
 * Only files listed in documents.json are imported — the personal-data exclusions in documents-excluded.json never are.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../../', import.meta.url).pathname;
const CACHE = join(ROOT, '.cache/legacy-docs');
const MANIFEST = join(ROOT, 'scripts/seed/content/documents-files.json');
const BUCKET = 'honterus-media';
const MIME = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', odt: 'application/vnd.oasis.opendocument.text', ods: 'application/vnd.oasis.opendocument.spreadsheet', ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', zip: 'application/zip', rar: 'application/vnd.rar' };

const [cmd = 'download', flag = '--local'] = process.argv.slice(2);
const docs = JSON.parse(readFileSync(join(ROOT, 'scripts/seed/content/documents.json'), 'utf8'));
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safeName = (s) =>
  decodeURIComponent(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-90);

if (cmd === 'download') {
  mkdirSync(CACHE, { recursive: true });
  let ok = 0;
  let fail = 0;
  for (const d of docs) {
    const u = d.external_url;
    if (!u || !/liceulhonterusbrasov\.ro\/.*wp-content\/uploads\//.test(u)) continue;
    if (manifest[u] && existsSync(join(CACHE, manifest[u].r2_key.replaceAll('/', '__')))) {
      ok++;
      continue;
    }
    try {
      const res = await fetch(u, { headers: { 'User-Agent': 'HonterusSiteMigration/1.0' }, redirect: 'follow' });
      if (!res.ok) throw new Error(String(res.status));
      const buf = Buffer.from(await res.arrayBuffer());
      const sha = createHash('sha256').update(buf).digest('hex');
      const m = u.match(/uploads\/(\d{4})\/(\d{2})\/([^?#]+)$/);
      const name = safeName(m ? m[3] : u.split('/').pop());
      const ext = name.split('.').pop();
      const key = `files/legacy/${m ? `${m[1]}/${m[2]}/` : ''}${sha.slice(0, 8)}-${name}`;
      writeFileSync(join(CACHE, key.replaceAll('/', '__')), buf);
      manifest[u] = { r2_key: key, size_bytes: buf.length, sha256: sha, mime: MIME[ext] ?? 'application/octet-stream' };
      ok++;
      if (ok % 20 === 0) writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
      await sleep(250);
    } catch (e) {
      fail++;
      console.error(`✗ ${u}: ${e.message}`);
    }
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
  console.log(`downloaded/known ${ok}, failed ${fail}; manifest ${Object.keys(manifest).length} entries`);
} else if (cmd === 'upload') {
  const where = flag === '--remote' ? '--remote' : '--local';
  let n = 0;
  for (const v of Object.values(manifest)) {
    const file = join(CACHE, v.r2_key.replaceAll('/', '__'));
    if (!existsSync(file)) {
      console.error(`missing in cache (run download first): ${v.r2_key}`);
      continue;
    }
    execFileSync('npx', ['wrangler', 'r2', 'object', 'put', `${BUCKET}/${v.r2_key}`, '--file', file, '--content-type', v.mime, where], { stdio: 'ignore' });
    if (++n % 25 === 0) console.log(`  ${n} uploaded`);
  }
  console.log(`uploaded ${n} files to R2 (${where})`);
} else {
  console.error('usage: import-legacy-documents.mjs download | upload --local | upload --remote');
  process.exit(1);
}
