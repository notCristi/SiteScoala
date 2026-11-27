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
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppsx: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  doc: 'application/msword',
  xls: 'application/vnd.ms-excel',
  ppt: 'application/vnd.ms-powerpoint',
  pps: 'application/vnd.ms-powerpoint',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
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
export async function sniffDocument(b: Uint8Array, nameHint: string): Promise<Sniffed | { error: 'type' | 'pdfActive' | 'macro' }> {
  const img = sniffImage(b);
  if (img && img.ext !== 'webp') return img;
  // A real PDF starts with its header. Accepting "%PDF-" further in would let HTML/PDF polyglots through.
  if (ascii(b, 0, 5) === '%PDF-') {
    // Reject active content: scripts, launch actions, attachments or forms have no place in a school document.
    if (await pdfHasActiveContent(b)) return { error: 'pdfActive' };
    return { ext: 'pdf', mime: MIME.pdf!, kind: 'pdf' };
  }
  if (startsWith(b, [0x50, 0x4b, 0x03, 0x04])) {
    const text = ascii(b, 0, b.length);
    if (/vbaProject\.bin|vbaData\.xml|macroEnabled/i.test(text)) return { error: 'macro' };
    if (ascii(b, 30, 38) === 'mimetype' && text.slice(0, 200).includes('application/vnd.oasis.opendocument.text')) return { ext: 'odt', mime: MIME.odt!, kind: 'office' };
    if (text.includes('[Content_Types].xml')) {
      if (text.includes('word/')) return { ext: 'docx', mime: MIME.docx!, kind: 'office' };
      if (text.includes('xl/')) return { ext: 'xlsx', mime: MIME.xlsx!, kind: 'office' };
      if (text.includes('ppt/')) {
        const show = /\.ppsx$/i.test(nameHint);
        return show ? { ext: 'ppsx', mime: MIME.ppsx!, kind: 'office' } : { ext: 'pptx', mime: MIME.pptx!, kind: 'office' };
      }
    }
    return { error: 'type' };
  }
  if (startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    const ext = /\.xls$/i.test(nameHint) ? 'xls' : 'doc';
    return { ext, mime: MIME[ext]!, kind: 'office' };
  }
  return { error: 'type' };
}

// ───────────────────────────── PDF active-content scan ─────────────────────────────
/**
 * Names that make a PDF "active". Matched after `#xx` escapes in names are decoded
 * (`/J#61vaScript` is `/JavaScript` to every reader) and inside compressed object streams.
 */
const PDF_ACTIVE = /\/(JavaScript|JS|Launch|EmbeddedFiles?|RichMedia|XFA|AA|SubmitForm|ImportData|GoToR|GoToE)(?=[\s/<>[\]()%{}]|$)/;
const INFLATE_MAX_TOTAL = 64 * 1024 * 1024;
const INFLATE_MAX_STREAMS = 4000;
const SCAN_MS = 4000;

/** Decode `#xx` escapes inside PDF names (only in name tokens, which start with "/"). */
export function normalisePdfNames(text: string): string {
  return text.replace(/\/[^\s/<>[\]()%{}]*/g, (name) => (name.includes('#') ? name.replace(/#([0-9a-fA-F]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16))) : name));
}

const hasActive = (text: string) => PDF_ACTIVE.test(normalisePdfNames(text));

/** zlib inflate with a hard output cap. Returns null when the data cannot be inflated (or exceeds the cap). */
async function inflate(data: Uint8Array, cap: number): Promise<Uint8Array | null> {
  try {
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    writer.write(data as unknown as BufferSource).catch(() => undefined);
    writer.close().catch(() => undefined);
    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      let r: ReadableStreamReadResult<Uint8Array>;
      try {
        r = await reader.read();
      } catch {
        // trailing bytes after the zlib stream (common: EOL before "endstream") — keep what was decoded
        break;
      }
      if (r.done) break;
      total += r.value.length;
      if (total > cap) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      chunks.push(r.value);
    }
    if (!total) return null;
    const out = new Uint8Array(total);
    let o = 0;
    for (const c of chunks) {
      out.set(c, o);
      o += c.length;
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * True when the PDF contains (or may hide) active content:
 *  1. the file structure (everything outside stream bodies), with name escapes decoded, uses an active name;
 *  2. a compressed object stream (/ObjStm) — where objects and their actions can hide — contains one,
 *     or cannot be inspected (unknown filter, predictor, encryption, size/time cap): rejected to be safe.
 * Other stream bodies (page content, images, fonts) cannot carry actions themselves — the dictionaries that
 * point at them are structure and covered by step 1 — and are skipped, so binary data cannot cause false alarms.
 */
export async function pdfHasActiveContent(b: Uint8Array): Promise<boolean> {
  const text = ascii(b, 0, b.length);
  const deadline = Date.now() + SCAN_MS;
  const encrypted = /\/Encrypt(?![^\s/<>[\]()%{}])/.test(normalisePdfNames(text.slice(-8192)));
  let budget = INFLATE_MAX_TOTAL;
  let streams = 0;
  let cursor = 0;
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index >= 3 && text.slice(m.index - 3, m.index) === 'end') continue; // "endstream"
    if (Date.now() > deadline || ++streams > INFLATE_MAX_STREAMS) return true;
    const head = text.slice(cursor, m.index);
    if (hasActive(head)) return true;
    const dictStart = text.lastIndexOf('obj', m.index);
    const dict = normalisePdfNames(text.slice(dictStart < cursor ? cursor : dictStart, m.index));
    const start = m.index + m[0].length;
    const lenM = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict);
    let end = lenM ? start + Number(lenM[1]) : -1;
    if (end < start || end > b.length || !/^\s*endstream/.test(text.slice(end, end + 40))) {
      end = text.indexOf('endstream', start);
      if (end < 0) return true; // truncated or malformed: cannot be inspected
      while (end > start && (b[end - 1] === 0x0a || b[end - 1] === 0x0d)) end--;
    }
    cursor = end;
    re.lastIndex = end;
    if (!/\/Type\s*\/ObjStm(?![^\s/<>[\]()%{}])/.test(dict)) continue;
    if (encrypted) return true;
    const filters = [...dict.matchAll(/\/(ASCIIHexDecode|ASCII85Decode|LZWDecode|FlateDecode|RunLengthDecode|CCITTFaxDecode|JBIG2Decode|DCTDecode|JPXDecode|Crypt|AHx|A85|LZW|Fl|RL|CCF|DCT)(?![^\s/<>[\]()%{}])/g)].map((x) => x[1]);
    const raw = b.subarray(start, end);
    let body: Uint8Array | null;
    if (filters.length === 0) body = raw;
    else if (filters.length === 1 && (filters[0] === 'FlateDecode' || filters[0] === 'Fl')) {
      // a PNG/TIFF predictor would interleave filter bytes with the text: cannot inspect reliably
      const pred = /\/Predictor\s+(\d+)/.exec(dict);
      if (pred && Number(pred[1]) > 1) return true;
      body = await inflate(raw, budget);
    } else return true;
    if (!body) return true;
    budget -= body.length;
    if (hasActive(ascii(body, 0, body.length))) return true;
  }
  return hasActive(text.slice(cursor));
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

/**
 * Structural check of a client-made WebP variant: the RIFF size matches the file, and the file is made only
 * of known image chunks that end exactly at EOF (no appended payload, no EXIF/XMP metadata).
 */
export function webpWellFormed(b: Uint8Array): boolean {
  if (b.length < 20 || ascii(b, 0, 4) !== 'RIFF' || ascii(b, 8, 12) !== 'WEBP') return false;
  const riff = (b[4]! | (b[5]! << 8) | (b[6]! << 16) | (b[7]! << 24)) >>> 0;
  if (riff + 8 !== b.length) return false;
  const ok = new Set(['VP8 ', 'VP8L', 'VP8X', 'ALPH', 'ICCP']);
  let o = 12;
  let image = false;
  while (o < b.length) {
    if (o + 8 > b.length) return false;
    const id = ascii(b, o, o + 4);
    const size = (b[o + 4]! | (b[o + 5]! << 8) | (b[o + 6]! << 16) | (b[o + 7]! << 24)) >>> 0;
    if (!ok.has(id)) return false;
    if (id === 'VP8 ' || id === 'VP8L') image = true;
    o += 8 + size + (size & 1);
  }
  return o === b.length && image;
}

export const cleanFilename = (name: string) => name.replace(/[\u0000-\u001f\u007f]/g, '').replace(/^.*[\\/]/, '').slice(0, 255);
export const safeBase = (name: string) => slugify(cleanFilename(name).replace(/\.[a-z0-9]{1,5}$/i, ''), 80) || 'document';

export async function readFile(f: File) {
  const bytes = new Uint8Array(await f.arrayBuffer());
  return { bytes, sha: await sha256Hex(bytes) };
}

export async function putObject(key: string, bytes: Uint8Array, contentType: string, meta: Record<string, string>, disposition?: string) {
  await env.MEDIA.put(key, bytes, {
    httpMetadata: { contentType, cacheControl: 'public, max-age=86400', ...(disposition ? { contentDisposition: disposition } : {}) },
    customMetadata: meta,
  });
}

/** RFC 6266 / 5987 Content-Disposition with an ASCII fallback and the original UTF-8 name. */
export function disposition(kind: 'inline' | 'attachment', safe: string, original: string) {
  return `${kind}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(original)}`;
}
