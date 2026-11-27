import type { APIRoute } from 'astro';
import { destroySession } from '~/server/auth';
import { audit } from '~/server/admin/audit';

export const POST: APIRoute = async (ctx) => {
  if (ctx.locals.admin) await audit(ctx, 'logout', 'user', ctx.locals.admin.id);
  await destroySession(ctx);
  return ctx.redirect('/admin/login', 303);
};
export const GET: APIRoute = (ctx) => ctx.redirect(ctx.locals.admin ? '/admin' : '/admin/login', 302);
