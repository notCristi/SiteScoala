/** Bulk reorder (drag or ▲▼ in lists): { entity, ids[] } or { entity: 'galerie', galleryId, ids[] }. */
import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db, schema as s } from '~/server/db';
import { entityByKey } from '~/server/admin/entities';
import { reorder } from '~/server/admin/crud';
import { audit, can } from '~/server/admin/audit';
import { purge } from '~/server/admin/purge';
import { json } from '~/server/admin/util';

export const POST: APIRoute = async (ctx) => {
  if (!can(ctx.locals.admin, 'content')) return json({ error: 'forbidden' }, 403);
  const body = (await ctx.request.json().catch(() => ({}))) as { entity?: string; ids?: unknown[]; galleryId?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.slice(0, 500) : [];
  if (body.entity === 'galerie') {
    const gid = Number(body.galleryId);
    const mids = ids.filter((x): x is string => typeof x === 'string');
    if (!gid || !mids.length) return json({ error: 'bad request' }, 400);
    await db().batch(
      mids.map((m, i) =>
        db()
          .update(s.galleryItems)
          .set({ sortOrder: i + 1 })
          .where(and(eq(s.galleryItems.galleryId, gid), eq(s.galleryItems.mediaId, m))),
      ) as never,
    );
    await audit(ctx, 'reorder', 'galleries', gid);
    await purge(ctx, ['galleries']);
    return json({ ok: true });
  }
  const def = entityByKey(body.entity);
  const nums = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (!def || !nums.length || nums.length !== ids.length) return json({ error: 'bad request' }, 400);
  const ok = await reorder(ctx, def, nums);
  return ok ? json({ ok: true }) : json({ error: 'bad request' }, 400);
};
