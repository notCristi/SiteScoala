/**
 * Small shared helpers for the admin: env access, Bucharest time ↔ form inputs, slugs, crypto encodings.
 */
import { env } from 'cloudflare:workers';

/** Non-binding env vars / secrets (wrangler vars, `wrangler secret`, .dev.vars). */
export const cfg = (k: string): string | undefined => {
  const v = (env as unknown as Record<string, unknown>)[k];
  return typeof v === 'string' && v !== '' ? v : undefined;
};

// ───────────── time (Europe/Bucharest) ─────────────
const TZ = 'Europe/Bucharest';
const dtf = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});
function offsetAt(utcMs: number): number {
  const p: Record<string, number> = {};
  for (const part of dtf.formatToParts(new Date(utcMs))) if (part.type !== 'literal') p[part.type] = Number(part.value);
  const asUtc = Date.UTC(p.year ?? 1970, (p.month ?? 1) - 1, p.day ?? 1, p.hour ?? 0, p.minute ?? 0, p.second ?? 0);
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000) * 60000;
}
/** ms → value for <input type="date|datetime-local"> in Bucharest time. */
export function toInput(ms: number | null | undefined, withTime: boolean): string {
  if (ms == null) return '';
  const iso = new Date(ms + offsetAt(ms)).toISOString();
  return withTime ? iso.slice(0, 16) : iso.slice(0, 10);
}
/** <input> value in Bucharest time → UTC ms (null if empty/invalid). */
export function fromInput(v: string | null | undefined): number | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(v.trim());
  if (!m) return null;
  const guess = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +(m[4] ?? 0), +(m[5] ?? 0));
  let t = guess - offsetAt(guess);
  const off2 = offsetAt(t);
  if (guess - off2 !== t) t = guess - off2;
  return t;
}
export function fmtDate(ms: number | null | undefined, ui: 'ro' | 'de', withTime = true): string {
  if (!ms) return '—';
  return new Intl.DateTimeFormat(ui === 'de' ? 'de-DE' : 'ro-RO', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(ms));
}
/** Current academic year: September starts the next one (2026-2027). */
export function currentAcademicYear(now = Date.now()): string {
  const d = new Date(now);
  const y = d.getUTCFullYear();
  return d.getUTCMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

// ───────────── slugs ─────────────
const TRANSLIT: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss', ș: 's', ş: 's', ț: 't', ţ: 't', ă: 'a', â: 'a', î: 'i' };
export function slugify(input: string, max = 80): string {
  const s = input
    .toLowerCase()
    .replace(/[äöüßșşțţăâî]/g, (c) => TRANSLIT[c] ?? c)
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
  return s;
}

// ───────────── encodings / crypto ─────────────
export function b64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
export function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export const b64url = (bytes: Uint8Array) => b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const hex = (buf: ArrayBuffer | Uint8Array) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export async function sha256Hex(data: string | ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return hex(await crypto.subtle.digest('SHA-256', bytes as BufferSource));
}
export const randomToken = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));
export function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  return timingSafeEqual(ea, eb);
}
/** Workers' constant-time comparison (non-standard extension of SubtleCrypto). */
export const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean =>
  (crypto.subtle as unknown as { timingSafeEqual(x: ArrayBufferView, y: ArrayBufferView): boolean }).timingSafeEqual(a, b);

export const str = (v: FormDataEntryValue | null | undefined, max = 2000) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim().slice(0, max) : '');
export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' } });
