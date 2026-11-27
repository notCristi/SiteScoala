/** Live "Previzualizare": renders Markdown with the same sanitising renderer used at save time. */
import type { APIRoute } from 'astro';
import { renderMarkdown } from '~/server/markdown';
import { json } from '~/server/admin/util';

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as { md?: unknown };
  const md = typeof body.md === 'string' ? body.md.slice(0, 200_000) : '';
  return json({ html: renderMarkdown(md) ?? '' });
};
