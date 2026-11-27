/**
 * Contact form handling, shared by the contact page (POST to itself — no JS needed) and /api/contact.
 *
 * Spam defence in layers:
 *  - honeypot field (`website`): pretend success, store nothing;
 *  - Cloudflare Turnstile when the widget produced a token (JS on);
 *  - without a token (JS off, or the widget was blocked by a privacy extension) the message is still
 *    accepted, but rate-limited per IP prefix and overall, and marked for the office in /admin.
 */
import { and, eq, gt, sql } from 'drizzle-orm';
import { db, schema } from './db';
import { ipPrefix, verifyTurnstile } from './security';
import { isLocale, type Locale } from '~/i18n/locales';

export const TOPICS = ['secretariat', 'admitere', 'documente', 'altele'] as const;
export type Topic = (typeof TOPICS)[number];

export interface ContactValues {
  name: string;
  email: string;
  phone: string;
  topic: Topic;
  message: string;
}
export type ContactError = 'date' | 'verificare' | 'limita';
export type ContactResult = { ok: true; locale: Locale } | { ok: false; locale: Locale; error: ContactError; values: ContactValues };

const HOUR = 3_600_000;
/** Messages without a Turnstile token: per /24 (IPv4) or /48 (IPv6) prefix, and across the whole site. */
const LIMIT_PER_PREFIX = 5;
const LIMIT_GLOBAL = 40;
/** Shown to the office at the top of a message that was not checked by Turnstile. */
export const UNVERIFIED_MARK = '[Trimis fără verificarea anti-spam (browser fără JavaScript sau verificare blocată).]';

const str = (v: FormDataEntryValue | null, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const emptyValues = (): ContactValues => ({ name: '', email: '', phone: '', topic: 'secretariat', message: '' });

/** True when the request body is a form (urlencoded or multipart); anything else is answered with 415. */
export function isFormRequest(req: Request): boolean {
  const ct = (req.headers.get('content-type') ?? '').toLowerCase();
  return ct.startsWith('application/x-www-form-urlencoded') || ct.startsWith('multipart/form-data');
}

export async function handleContact(request: Request, fallbackLocale: Locale = 'ro'): Promise<ContactResult> {
  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return { ok: false, locale: fallbackLocale, error: 'date', values: emptyValues() };
  }
  const loc = fd.get('locale');
  const locale: Locale = isLocale(loc) ? loc : fallbackLocale;
  const topicRaw = str(fd.get('topic'), 20);
  const values: ContactValues = {
    name: str(fd.get('name'), 120),
    email: str(fd.get('email'), 200),
    phone: str(fd.get('phone'), 40),
    topic: (TOPICS as readonly string[]).includes(topicRaw) ? (topicRaw as Topic) : 'secretariat',
    message: str(fd.get('message'), 5000),
  };
  // honeypot: look successful, keep nothing
  if (str(fd.get('website'), 100)) return { ok: true, locale };
  if (values.name.length < 2 || !EMAIL.test(values.email) || values.message.length < 10) return { ok: false, locale, error: 'date', values };

  const token = str(fd.get('cf-turnstile-response'), 2048);
  const prefix = ipPrefix(request);
  let verified = false;
  if (token) {
    if (!(await verifyTurnstile(token, request, 'contact'))) return { ok: false, locale, error: 'verificare', values };
    verified = true;
  } else {
    const since = Date.now() - HOUR;
    const t = schema.contactMessages;
    const d = db();
    const [[mine], [all]] = await d.batch([
      d.select({ n: sql<number>`count(*)` }).from(t).where(and(eq(t.ipPrefix, prefix), gt(t.createdAt, since))),
      d.select({ n: sql<number>`count(*)` }).from(t).where(and(gt(t.createdAt, since), sql`${t.message} like ${UNVERIFIED_MARK.slice(0, 20) + '%'}`)),
    ]);
    if ((mine?.n ?? 0) >= LIMIT_PER_PREFIX || (all?.n ?? 0) >= LIMIT_GLOBAL) return { ok: false, locale, error: 'limita', values };
  }
  await db()
    .insert(schema.contactMessages)
    .values({
      name: values.name,
      email: values.email,
      phone: values.phone || null,
      topic: values.topic,
      message: verified ? values.message : `${UNVERIFIED_MARK}\n\n${values.message}`,
      locale,
      ipPrefix: prefix,
    });
  return { ok: true, locale };
}
