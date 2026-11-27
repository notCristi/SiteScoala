/** Gallery items: { galleryId, add: mediaId[] } or { galleryId, remove: mediaId }. */
import type { APIRoute } from 'astro';
import { and, eq, max } from 'drizzle-orm';
import { db, schema as s } from '~/server/db';
import { audit, can } from '~/server/admin/audit';
import { purge } from '~/server/admin/purge';
import { json } from '~/server/admin/util';

export const POST: APIRoute = async (ctx) => {
  if (!can(ctx.locals.admin, 'content')) return json({ error: 'forbidden' }, 403);
  const body = (await ctx.request.json().catch(() => ({}))) as { galleryId?: unknown; add?: unknown[]; remove?: unknown };
  const gid = Number(body.galleryId);
  const [g] = await db().select({ id: s.galleries.id }).from(s.galleries).where(eq(s.galleries.id, gid)).limit(1);
  if (!g) return json({ error: 'not found' }, 404);
  if (typeof body.remove === 'string') {
    await db()
      .delete(s.galleryItems)
      .where(and(eq(s.galleryItems.galleryId, gid), eq(s.galleryItems.mediaId, body.remove)));
  } else if (Array.isArray(body.add)) {
    const add = body.add.filter((x): x is string => typeof x === 'string' && /^[\w-]{1,64}$/.test(x)).slice(0, 200);
    const [m] = await db().select({ m: max(s.galleryItems.sortOrder) }).from(s.galleryItems).where(eq(s.galleryItems.galleryId, gid));
    let n = Number(m?.m ?? 0);
    for (const mediaId of add) {
      await db()
        .insert(s.galleryItems)
        .values({ galleryId: gid, mediaId, sortOrder: ++n })
        .onConflictDoNothing();
    }
  } else return json({ error: 'bad request' }, 400);
  await audit(ctx, 'update', 'galleries', gid, 'items');
  await purge(ctx, ['galleries']);
  return json({ ok: true });
};
