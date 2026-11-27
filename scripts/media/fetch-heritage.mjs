#!/usr/bin/env node
/**
 * Downloads the curated, freely licensed heritage images listed in HERITAGE from Wikimedia Commons,
 * records licence metadata, and writes responsive WebP variants + credits.json into public/media/heritage/.
 *
 *   node scripts/media/fetch-heritage.mjs          # fetch missing files only
 *   node scripts/media/fetch-heritage.mjs --force  # re-fetch everything
 *   node scripts/media/fetch-heritage.mjs --variants  # no network: (re)build the width steps from the largest local file
 *
 * Width steps 640 · 800 · 1024 · 1200 · 1600 so phones at DPR 2–3 get a file close to their box.
 * Engraved maps and prints (line art) are encoded at a lower WebP quality: they stay crisp at half the bytes.
 *
 * Polite: one request at a time, pause between files, retries on 429 with backoff.
 * Selection rationale and licensing rules: docs/02_HONTERUS_HERITAGE_AND_MEDIA_DOSSIER.md §9.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT = 'public/media/heritage';
const WIDTHS = [640, 800, 1024, 1200, 1600];
/** Line-art sources (maps, woodcuts, prints): lower quality is invisible, the bytes halve. */
const LINE_ART = new Set(['harta-transilvaniei-1532', 'burzenland-1532', 'rudimenta-1542', 'cosmographia-1546', 'portret-septemcastrensis', 'tipografia', 'portret-xilogravura', 'stema-1539']);
const quality = (id) => (LINE_ART.has(id) ? 48 : 74);
const UA = 'HonterusSiteBuilder/1.0 (school website rebuild; heritage image import)';
const force = process.argv.includes('--force');

/** id → Commons file name + trilingual alt text (written for the site, not copied from Commons). */
export const HERITAGE = [
  { id: 'curtea-honterus', file: 'Ro Bv Curtea-Honterus.jpg', alt: { ro: 'Curtea Johannes Honterus, cu clădirile școlii în jurul Bisericii Negre', de: 'Der Honterushof mit den Schulgebäuden rund um die Schwarze Kirche', en: 'The Honterus Courtyard, with the school buildings around the Black Church' } },
  { id: 'curtea-honterus-2', file: 'Curtea Honterus Johannes 1.jpg', alt: { ro: 'Curtea Honterus, vedere spre clădirile colegiului', de: 'Honterushof, Blick auf die Gebäude des Kollegs', en: 'Honterus Courtyard, looking towards the college buildings' } },
  { id: 'scoala-a', file: 'Honterus School Brasov (A).jpg', alt: { ro: 'Clădirea A a Colegiului Național „Johannes Honterus”', de: 'Gebäude A des Honterus-Nationalkollegs', en: 'Building A of the “Johannes Honterus” National College' } },
  { id: 'scoala-b', file: 'Honterus School Brasov (B).jpg', alt: { ro: 'Clădirea B a colegiului, în Curtea Honterus', de: 'Gebäude B des Kollegs am Honterushof', en: 'Building B of the college, in the Honterus Courtyard' } },
  { id: 'scoala', file: 'Honterus School Brasov.jpg', alt: { ro: 'Fațada colegiului spre Curtea Honterus', de: 'Fassade des Kollegs zum Honterushof', en: 'The college façade facing the Honterus Courtyard' } },
  { id: 'statuie', file: 'Statue des Johannes Honterus.jpg', alt: { ro: 'Statuia lui Johannes Honterus de lângă Biserica Neagră', de: 'Das Honterus-Denkmal an der Schwarzen Kirche', en: 'The statue of Johannes Honterus beside the Black Church' } },
  { id: 'portret-xilogravura', file: 'Johannes-Honterus.jpg', alt: { ro: 'Portretul lui Johannes Honterus, xilogravură din secolul al XVI-lea', de: 'Bildnis des Johannes Honterus, Holzschnitt des 16. Jahrhunderts', en: 'Portrait of Johannes Honterus, sixteenth-century woodcut' } },
  { id: 'portret-septemcastrensis', file: 'Johann Honterus Septemcastrensis de Corona.jpg', alt: {ro: "Johannes Honterus „Septemcastrensis de Corona”: semnătura de pe harta Transilvaniei din 1532", de: "„Johannes Honterus Septemcastrensis de Corona“: Signatur auf der Siebenbürgen-Karte von 1532", en: "“Johannes Honterus Septemcastrensis de Corona”: signature on the 1532 map of Transylvania"} },
  { id: 'tipografia', file: 'Johannes Honterus in seiner Buchdruckerei.jpg', alt: {ro: "Johannes Honterus în tipografia sa, ilustrație din secolul al XIX-lea", de: "Johannes Honterus in seiner Druckerei, Illustration des 19. Jahrhunderts", en: "Johannes Honterus in his printing house, nineteenth-century illustration"} },
  { id: 'harta-transilvaniei-1532', file: 'Chorographia Transylvaniae Sybembürgen 1532.jpg', alt: { ro: 'Chorographia Transylvaniae, harta Transilvaniei de Johannes Honterus, 1532', de: 'Chorographia Transylvaniae, Siebenbürgen-Karte des Johannes Honterus, 1532', en: 'Chorographia Transylvaniae, Johannes Honterus’s map of Transylvania, 1532' } },
  { id: 'rudimenta-1542', file: 'Johannes Honter-RudimentaCosmographica-Brasov1542.jpg', alt: { ro: 'Pagină din Rudimenta Cosmographica, Brașov, 1542', de: 'Seite aus der Rudimenta Cosmographica, Kronstadt 1542', en: 'Page from the Rudimenta Cosmographica, Brașov, 1542' } },
  { id: 'cosmographia-1546', file: 'Honter Universalis Cosmographia 1546 UTA.jpg', alt: { ro: 'Universalis Cosmographia, harta lumii de Honterus, 1546', de: 'Universalis Cosmographia, Weltkarte des Honterus, 1546', en: 'Universalis Cosmographia, Honterus’s world map, 1546' } },
  { id: 'stema-1539', file: 'Historical Brasov CoA 1539.png', alt: { ro: 'Stema Brașovului cu coroană și rădăcini, marca tipografică a lui Honterus, 1539', de: 'Kronstädter Wappen mit Krone und Wurzel, Druckerzeichen des Honterus, 1539', en: 'The Brașov crown-and-roots arms, Honterus’s printer’s mark, 1539' } },
  { id: 'biserica-neagra', file: 'Exterior of Black Church-Brasov.jpg', alt: { ro: 'Biserica Neagră din Brașov, exterior', de: 'Die Schwarze Kirche in Kronstadt, Außenansicht', en: 'The Black Church in Brașov, exterior' } },
  { id: 'biserica-neagra-statuie', file: 'Crna crkva 18. srpnja 2025.jpg', alt: { ro: 'Biserica Neagră și statuia lui Honterus', de: 'Die Schwarze Kirche mit dem Honterus-Denkmal', en: 'The Black Church with the Honterus statue' } },
  { id: 'panorama', file: 'Panorama of Brașov old town with the Black Church and Mount Tâmpa (2025).jpg', alt: { ro: 'Centrul vechi al Brașovului cu Biserica Neagră și Tâmpa', de: 'Die Kronstädter Altstadt mit Schwarzer Kirche und Zinne', en: 'Brașov old town with the Black Church and Mount Tâmpa' } },
  { id: 'biserica-neagra-interior', file: 'Biserica Neagră interior.jpg', alt: { ro: 'Interiorul Bisericii Negre', de: 'Innenraum der Schwarzen Kirche', en: 'Interior of the Black Church' } },
  { id: 'burzenland-1532', file: 'Burzenland-JohannesHonterus-1532.jpg', alt: { ro: 'Țara Bârsei pe harta lui Honterus din 1532', de: 'Das Burzenland auf der Honterus-Karte von 1532', en: 'The Burzenland on Honterus’s 1532 map' } },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => access(p).then(() => true, () => false);
const strip = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function get(url, type = 'json') {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } });
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 15000 * (attempt + 1);
      console.warn(`  ${res.status}, waiting ${Math.round(wait / 1000)} s`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return type === 'json' ? res.json() : Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`gave up: ${url}`);
}

async function info(file) {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  Object.entries({ action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo', titles: `File:${file}`, iiprop: 'url|size|extmetadata', iiurlwidth: '2000' }).forEach(([k, v]) => u.searchParams.set(k, v));
  const j = await get(u);
  const ii = j.query?.pages?.[0]?.imageinfo?.[0];
  if (!ii) throw new Error(`not found: ${file}`);
  const m = ii.extmetadata ?? {};
  return {
    url: ii.thumburl ?? ii.url,
    sourceUrl: ii.descriptionurl,
    author: strip(m.Artist?.value) || 'Unknown',
    license: strip(m.LicenseShortName?.value) || 'see source',
    licenseUrl: m.LicenseUrl?.value ?? null,
    title: strip(m.ObjectName?.value) || file,
  };
}

await mkdir(OUT, { recursive: true });
const credPath = join(OUT, 'credits.json');
const credits = (await exists(credPath)) ? JSON.parse(await readFile(credPath, 'utf8')) : [];
const byId = new Map(credits.map((c) => [c.id, c]));

if (process.argv.includes('--variants')) {
  // Offline: rebuild every width step from the largest local variant (originals are not kept in the repo).
  for (const c of byId.values()) {
    const largest = [...c.variants].sort((a, b) => b.w - a.w)[0];
    const src = await readFile(join('public', largest.key));
    const width = largest.w;
    const ratio = c.height / c.width;
    const variants = [];
    for (const w of WIDTHS.filter((x, i) => x <= width || i === 0)) {
      const tw = Math.min(w, width);
      const key = `/media/heritage/${c.id}-${tw}.webp`;
      const existing = c.variants.find((v) => v.w === tw);
      // keep photo variants that already exist (no second lossy pass); re-encode line art and fill new steps
      if (!existing || LINE_ART.has(c.id)) {
        const out = await sharp(src).resize({ width: tw }).webp({ quality: quality(c.id), effort: 6 }).toBuffer();
        if (!existing || out.length < (await readFile(join('public', key))).length) await writeFile(join('public', key), out);
      }
      variants.push({ w: tw, key });
    }
    if (width > WIDTHS.at(-1)) variants.push(largest);
    c.variants = variants;
    c.height = Math.round(c.width * ratio);
    console.log(`${c.id}: ${variants.map((v) => v.w).join(' · ')}`);
  }
  await writeFile(credPath, JSON.stringify([...byId.values()], null, 2) + '\n');
  process.exit(0);
}

for (const h of HERITAGE) {
  const done = byId.get(h.id);
  if (done && !force && (await exists(join(OUT, `${h.id}-1024.webp`)))) continue;
  try {
    console.log(`→ ${h.file}`);
    const meta = await info(h.file);
    await sleep(1500);
    const buf = await get(meta.url, 'buf');
    const img = sharp(buf, { limitInputPixels: false }).rotate();
    const { width = 0, height = 0 } = await img.metadata();
    const { dominant } = await img.stats();
    const variants = [];
    for (const w of WIDTHS.filter((x, i) => x < width || i === 0)) {
      const tw = Math.min(w, width);
      const key = `/media/heritage/${h.id}-${tw}.webp`;
      await img.clone().resize({ width: tw }).webp({ quality: quality(h.id), effort: 5 }).toFile(join('public', key));
      variants.push({ w: tw, key });
    }
    const largest = variants.at(-1);
    const ratio = height / width;
    byId.set(h.id, {
      id: h.id,
      file: h.file,
      ...meta,
      width: largest.w,
      height: Math.round(largest.w * ratio),
      placeholder: `#${[dominant.r, dominant.g, dominant.b].map((n) => n.toString(16).padStart(2, '0')).join('')}`,
      variants,
      alt: h.alt,
    });
    await writeFile(credPath, JSON.stringify([...byId.values()], null, 2) + '\n');
    console.log(`  ok ${largest.w}×${Math.round(largest.w * ratio)} · ${meta.license} · ${meta.author}`);
    await sleep(4000);
  } catch (e) {
    console.error(`  ✗ ${h.file}: ${e.message}`);
    await sleep(4000);
  }
}
console.log(`credits: ${byId.size}/${HERITAGE.length}`);
