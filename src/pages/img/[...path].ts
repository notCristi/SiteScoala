/** Public image variants from R2: /img/<sha16>/<width>.webp (originals are never served — they may carry EXIF/GPS). */
import type { APIRoute } from 'astro';
import { serveR2 } from '~/server/admin/serve';

const KEY = /^[0-9a-f]{16}\/\d{2,4}\.webp$/;
export const GET: APIRoute = (ctx) => serveR2(ctx, 'img', KEY);
export const HEAD: APIRoute = (ctx) => serveR2(ctx, 'img', KEY);
