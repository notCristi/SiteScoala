/** Public documents from R2: /files/<yyyy>/<sha12>-<name>.<ext> — served only while the document is published. */
import type { APIRoute } from 'astro';
import { serveR2 } from '~/server/admin/serve';

// Uploads from /admin, plus documents imported from the old site (scripts/media/import-legacy-documents.mjs;
// the legacy set holds pdf, doc, docx, xlsx, pptx and ppsx — the rest are accepted for future imports).
const KEY =
  /^(\d{4}\/[0-9a-f]{12}-[a-z0-9-]{1,80}\.(pdf|docx?|xlsx?|odt|pptx|ppsx|jpg|png)|legacy\/(\d{4}\/\d{2}\/)?[0-9a-f]{8}-[a-z0-9.-]{1,90}\.(pdf|docx?|xlsx?|odt|ods|pptx?|ppsx?|jpe?g|png|zip|rar))$/;
export const GET: APIRoute = (ctx) => serveR2(ctx, 'files', KEY);
export const HEAD: APIRoute = (ctx) => serveR2(ctx, 'files', KEY);
