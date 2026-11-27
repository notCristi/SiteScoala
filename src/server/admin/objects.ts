/**
 * Retiring R2 objects when the file behind them is replaced or deleted (GDPR: a file removed by mistake must
 * really disappear). Objects are deleted from R2 and their edge copies purged; the public routes already
 * refuse keys that no row references (src/server/admin/serve.ts).
 */
import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';
import { like } from 'drizzle-orm';
import { db, schema as s } from '../db';
import { purgeObjects } from './purge';

/** Delete these R2 keys (bundled /media/… paths are ignored) and purge their edge copies. */
export async function retireObjects(ctx: APIContext | undefined, keys: (string | null | undefined)[]) {
  const clean = [...new Set(keys.filter((k): k is string => !!k && /^(files|img)\//.test(k)))];
  if (!clean.length) return;
  try {
    await env.MEDIA.delete(clean);
  } catch (e) {
    console.error('R2 delete failed', clean, e);
  }
  await purgeObjects(ctx, clean);
}

/** Every R2 object of an image (`img/<sha16>/…`: variants + original), unless another media row still uses that prefix. */
export async function retireImagePrefix(ctx: APIContext | undefined, prefix: string | null | undefined, exceptMediaId?: string) {
  if (!prefix || !/^img\/[0-9a-f]{16}\/$/.test(prefix)) return;
  const users = await db()
    .select({ id: s.mediaAssets.id })
    .from(s.mediaAssets)
    .where(like(s.mediaAssets.variantsJson, `%"${prefix}%`))
    .limit(3);
  if (users.some((u) => u.id !== exceptMediaId)) return;
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.MEDIA.list({ prefix, limit: 1000, ...(cursor ? { cursor } : {}) });
    keys.push(...page.objects.map((o) => o.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  await retireObjects(ctx, keys);
}

/** `img/<sha16>/` of a media row (from its variants or src), or null for bundled / YouTube media. */
export function imagePrefixOf(m: { src: string | null; variantsJson: string | null }): string | null {
  const k = m.src ?? '';
  const fromSrc = /^(img\/[0-9a-f]{16}\/)/.exec(k)?.[1];
  if (fromSrc) return fromSrc;
  return /"(img\/[0-9a-f]{16}\/)/.exec(m.variantsJson ?? '')?.[1] ?? null;
}
