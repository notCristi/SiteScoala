/**
 * Upload validation (docs/04 §6.4): type from magic bytes (never the client's Content-Type),
 * size limits, SHA-256, content-addressed R2 keys, safe filenames.
 */
import { env } from 'cloudflare:workers';
import { sha256Hex, slugify } from './util';

export const DOC_MAX = 25 * 1024 * 1024;
export const IMG_MAX = 15 * 1024 * 1024;
export const VARIANT_MAX = 3 * 1024 * 1024;

export interface Sniffed {
  ext: string;
  mime: string;
  kind: 'pdf' | 'office' | 'image';
}

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  odt: 'application/vnd.oasis.opendocument.text',
  doc: 'application/msword',
  xls: 'application/vnd.ms-excel',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
export const mimeForExt = (ext: string) => MIME[ext] ?? 'application/octet-stream';

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((x, i) => b[at + i] === x);
const ascii = (b: Uint8Array, from: number, to: number) => new TextDecoder('latin1').decode(b.subarray(from, Math.min(to, b.length)));

export function sniffImage(b: Uint8Array): Sniffed | null {
  if (startsWith(b, [0xff, 0xd8, 0xff])) return { ext: 'jpg', mime: MIME.jpg!, kind: 'image' };
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ext: 'png', mime: MIME.png!, kind: 'image' };
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') return { ext: 'webp', mime: MIME.webp!, kind: 'image' };
  return null;
}

/** Returns the detected type, or an error code. `nameHint` only disambiguates legacy OLE (.doc vs .xls). */
export function sniffDocument(b: Uint8Array, nameHint: string): Sniffed | { error: string } {
  const img = sniffImage(b);
  if (img && img.ext !== 'webp') return img;
  if (ascii(b, 0, 1024).includes('%PDF-')) {
    // Reject active content: scripts or launch actions have no place in a school document.
    const text = ascii(b, 0, b.length);
    if (/\/JavaScript|\/Launch\b/.test(text)) return { error: 'pdfActive' };
    return { ext: 'pdf', mime: MIME.pdf!, kind: 'pdf' };
  }
  if (startsWith(b, [0x50, 0x4b, 0x03, 0x04])) {
    const text = ascii(b, 0, b.length);
    if (text.includes('vbaProject.bin')) return { error: 'macro' };
    if (ascii(b, 30, 38) === 'mimetype' && text.slice(0, 200).includes('application/vnd.oasis.opendocument.text')) return { ext: 'odt', mime: MIME.odt!, kind: 'office' };
    if (text.includes('[Content_Types].xml')) {
      if (text.includes('word/')) return { ext: 'docx', mime: MIME.docx!, kind: 'office' };
      if (text.includes('xl/')) return { ext: 'xlsx', mime: MIME.xlsx!, kind: 'office' };
    }
    return { error: 'type' };
  }
  if (startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    const ext = /\.xls$/i.test(nameHint) ? 'xls' : 'doc';
    return { ext, mime: MIME[ext]!, kind: 'office' };
  }
  return { error: 'type' };
}

/** Best-effort PDF page count. */
export function pdfPages(b: Uint8Array): number | null {
  const m = ascii(b, 0, b.length).match(/\/Type\s*\/Page(?![s\w])/g);
  return m ? m.length : null;
}

/** Width/height of a WebP (VP8, VP8L, VP8X). */
export function webpSize(b: Uint8Array): { w: number; h: number } | null {
  if (ascii(b, 0, 4) !== 'RIFF' || ascii(b, 8, 12) !== 'WEBP') return null;
  const chunk = ascii(b, 12, 16);
  if (chunk === 'VP8X') return { w: 1 + (b[24]! | (b[25]! << 8) | (b[26]! << 16)), h: 1 + (b[27]! | (b[28]! << 8) | (b[29]! << 16)) };
  if (chunk === 'VP8 ') return { w: (b[26]! | (b[27]! << 8)) & 0x3fff, h: (b[28]! | (b[29]! << 8)) & 0x3fff };
  if (chunk === 'VP8L') {
    const b0 = b[21]!, b1 = b[22]!, b2 = b[23]!, b3 = b[24]!;
    return { w: 1 + (((b1 & 0x3f) << 8) | b0), h: 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)) };
  }
  return null;
}

export const cleanFilename = (name: string) => name.replace(/[\u0000-\u001f\u007f]/g, '').replace(/^.*[\\/]/, '').slice(0, 255);
export const safeBase = (name: string) => slugify(cleanFilename(name).replace(/\.[a-z0-9]{1,5}$/i, ''), 80) || 'document';

export async function readFile(f: File) {
  const bytes = new Uint8Array(await f.arrayBuffer());
  return { bytes, sha: await sha256Hex(bytes) };
}

export async function putObject(key: string, bytes: Uint8Array, contentType: string, meta: Record<string, string>, disposition?: string) {
  await env.MEDIA.put(key, bytes, {
    httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable', ...(disposition ? { contentDisposition: disposition } : {}) },
    customMetadata: meta,
  });
}

/** RFC 6266 / 5987 Content-Disposition with an ASCII fallback and the original UTF-8 name. */
export function disposition(kind: 'inline' | 'attachment', safe: string, original: string) {
  return `${kind}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(original)}`;
}
