/** Document picker data. */
import type { APIRoute } from 'astro';
import { desc, like, or } from 'drizzle-orm';
import { db, schema as s } from '~/server/db';
import { json } from '~/server/admin/util';

export const GET: APIRoute = async ({ url }) => {
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100).replace(/[%_]/g, '');
  const rows = await db()
    .select({ id: s.documents.id, title: s.documents.titleRo, category: s.documents.category, year: s.documents.academicYear, status: s.documents.status, ext: s.documents.fileExt })
    .from(s.documents)
    .where(q ? or(like(s.documents.titleRo, `%${q}%`), like(s.documents.registrationNo, `%${q}%`)) : undefined)
    .orderBy(desc(s.documents.updatedAt))
    .limit(60);
  return json({ items: rows });
};
