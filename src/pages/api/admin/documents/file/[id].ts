/**
 * Admin preview of a document's file, whatever its status (drafts and archived files 404 on /files).
 * Behind the admin gate (session required); never cached.
 */
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '~/server/db';
import { serveObject } from '~/server/admin/serve';

const handler: APIRoute = async (ctx) => {
  if (!ctx.locals.admin) return new Response('Not authenticated', { status: 401 });
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id) || id <= 0) return new Response('Not found', { status: 404 });
  const [d] = await db().select({ key: s.documents.r2Key }).from(s.documents).where(eq(s.documents.id, id)).limit(1);
  if (!d?.key) return new Response('Not found', { status: 404 });
  return serveObject(ctx, d.key, 'private');
};
export const GET = handler;
export const HEAD = handler;
