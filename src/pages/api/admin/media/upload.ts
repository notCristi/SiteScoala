/**
 * Image upload. The browser sends the original (kept in R2 as the master, never served publicly)
 * plus WebP variants it resized itself with <canvas> (Workers have no image library):
 *   orig, variant_640, variant_1024, variant_1600, width, height, placeholder, alt*, caption*, credit, license, sourceUrl, replaceId?
 * "Înlocuiește imaginea" (replaceId) keeps the media id, so every page that uses it updates.
 */
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '~/server/db';
import { audit, can } from '~/server/admin/audit';
import { purge } from '~/server/admin/purge';
import { cleanFilename, IMG_MAX, putObject, readFile, sniffImage, VARIANT_MAX, webpSize } from '~/server/admin/upload';
import { json, str } from '~/server/admin/util';

const URL_RE = /^https?:\/\/[^\s<>"]+$/i;

export const POST: APIRoute = async (ctx) => {
  const user = ctx.locals.admin;
  if (!can(user, 'content')) return json({ error: 'forbidden' }, 403);
  const fd = await ctx.request.formData();
  const orig = fd.get('orig');
  if (!(orig instanceof File) || orig.size === 0) return json({ error: 'file' }, 400);
  if (orig.size > IMG_MAX) return json({ error: 'size' }, 413);
  const { bytes, sha } = await readFile(orig);
  const type = sniffImage(bytes);
  if (!type) return json({ error: 'type' }, 415);

  const replaceId = str(fd.get('replaceId'), 64) || null;
  const existingReplace = replaceId ? (await db().select().from(s.mediaAssets).where(eq(s.mediaAssets.id, replaceId)).limit(1))[0] : undefined;
  if (replaceId && !existingReplace) return json({ error: 'not found' }, 404);

  if (!replaceId) {
    const [dupe] = await db().select({ id: s.mediaAssets.id }).from(s.mediaAssets).where(eq(s.mediaAssets.sha256, sha)).limit(1);
    if (dupe) return json({ id: dupe.id, duplicate: true });
  }

  const altRo = str(fd.get('altRo'), 300) || existingReplace?.altRo || '';
  if (!altRo) return json({ error: 'alt' }, 400);

  // variants (client-resized WebP) — verified server-side
  const base = `img/${sha.slice(0, 16)}`;
  const variants: { w: number; key: string }[] = [];
  for (const [k, v] of fd.entries()) {
    const m = /^variant_(\d{2,4})$/.exec(k);
    if (!m || !(v instanceof File)) continue;
    const w = Number(m[1]);
    if (v.size > VARIANT_MAX || w > 2400) return json({ error: 'variant' }, 400);
    const vb = new Uint8Array(await v.arrayBuffer());
    const dim = webpSize(vb);
    if (!dim || Math.abs(dim.w - w) > 1 || dim.h < 1 || dim.w / dim.h > 4 || dim.h / dim.w > 4) return json({ error: 'variant' }, 400);
    const key = `${base}/${w}.webp`;
    await putObject(key, vb, 'image/webp', { uploadedBy: user!.id });
    variants.push({ w, key });
  }
  variants.sort((a, b) => a.w - b.w);
  await putObject(`${base}/orig.${type.ext}`, bytes, type.mime, { uploadedBy: user!.id, originalName: encodeURIComponent(cleanFilename(orig.name)).slice(0, 500) });

  const width = Math.round(Number(fd.get('width'))) || null;
  const height = Math.round(Number(fd.get('height'))) || null;
  const placeholder = /^#[0-9a-f]{6}$/i.test(str(fd.get('placeholder'), 7)) ? str(fd.get('placeholder'), 7).toLowerCase() : null;
  const largest = variants.at(-1)?.key ?? null;
  const file = {
    src: largest,
    variantsJson: JSON.stringify(variants),
    mime: largest ? 'image/webp' : type.mime,
    sizeBytes: bytes.length,
    sha256: sha,
    width,
    height,
    placeholder,
    originalFilename: cleanFilename(orig.name),
  };

  if (existingReplace) {
    await db().update(s.mediaAssets).set(file).where(eq(s.mediaAssets.id, existingReplace.id));
    await audit(ctx, 'replace', 'media', existingReplace.id, file.originalFilename);
    await purge(ctx, ['media']);
    return json({ id: existingReplace.id, replaced: true });
  }

  const sourceUrl = str(fd.get('sourceUrl'), 500);
  const id = crypto.randomUUID();
  await db()
    .insert(s.mediaAssets)
    .values({
      id,
      kind: 'image',
      ...file,
      altRo,
      altDe: str(fd.get('altDe'), 300) || null,
      altEn: str(fd.get('altEn'), 300) || null,
      captionRo: str(fd.get('captionRo'), 500) || null,
      captionDe: str(fd.get('captionDe'), 500) || null,
      captionEn: str(fd.get('captionEn'), 500) || null,
      credit: str(fd.get('credit'), 200) || null,
      license: str(fd.get('license'), 100) || null,
      sourceUrl: URL_RE.test(sourceUrl) ? sourceUrl : null,
      uploadedBy: user!.id,
    });
  await audit(ctx, 'upload', 'media', id, file.originalFilename);
  return json({ id });
};
