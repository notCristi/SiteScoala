/** /admin → dashboard. The admin gate normally rewrites this before it runs (see src/server/auth.ts). */
import type { APIRoute } from 'astro';

export const GET: APIRoute = (ctx) => ctx.redirect('/admin/ro', 302);
