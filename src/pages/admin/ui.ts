/** Admin interface language (RO/DE), remembered in a cookie scoped to /admin. */
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '~/server/db';

export const GET: APIRoute = async (ctx) => {
  const l = ctx.url.searchParams.get('l') === 'de' ? 'de' : 'ro';
  ctx.cookies.set('hs_ui', l, { path: '/admin', maxAge: 365 * 86400, sameSite: 'lax', httpOnly: true, secure: ctx.url.protocol === 'https:' });
  if (ctx.locals.admin) await db().update(s.adminUsers).set({ uiLocale: l }).where(eq(s.adminUsers.id, ctx.locals.admin.id));
  const next = ctx.url.searchParams.get('next') ?? '/admin';
  return ctx.redirect(/^\/admin(\/|$|\?)/.test(next) && !next.startsWith('//') ? next : '/admin', 302);
};
