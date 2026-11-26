/** Media picker data (images only by default). */
import type { APIRoute } from 'astro';
import { and, desc, eq, like, or } from 'drizzle-orm';
import { db, schema as s } from '~/server/db';
import { json } from '~/server/admin/util';
import { mediaThumb } from '~/server/admin/view';

export const GET: APIRoute = async ({ url }) => {
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100).replace(/[%_]/g, '');
  const kind = url.searchParams.get('kind') === 'youtube' ? 'youtube' : url.searchParams.get('kind') === 'all' ? undefined : 'image';
  const rows = await db()
    .select()
    .from(s.mediaAssets)
    .where(
      and(
        kind ? eq(s.mediaAssets.kind, kind) : undefined,
        q ? or(like(s.mediaAssets.altRo, `%${q}%`), like(s.mediaAssets.captionRo, `%${q}%`), like(s.mediaAssets.originalFilename, `%${q}%`)) : undefined,
      ),
    )
    .orderBy(desc(s.mediaAssets.createdAt))
    .limit(120);
  return json({ items: rows.map((m) => ({ id: m.id, thumb: mediaThumb(m), alt: m.altRo ?? '', kind: m.kind })) });
};
