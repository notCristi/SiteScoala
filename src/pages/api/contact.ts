import type { APIRoute } from 'astro';
import { db, schema } from '~/server/db';
import { ipPrefix, verifyTurnstile } from '~/server/security';
import { isLocale } from '~/i18n/locales';
import { url } from '~/i18n/routes';

const TOPICS = ['secretariat', 'admitere', 'documente', 'altele'] as const;
const str = (v: FormDataEntryValue | null, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const POST: APIRoute = async ({ request, redirect }) => {
  const fd = await request.formData();
  const locale = isLocale(fd.get('locale')) ? (fd.get('locale') as 'ro' | 'de' | 'en') : 'ro';
  const back = (state: string) => redirect(`${url('contact', locale)}?${state}#formular`, 303);
  // honeypot
  if (str(fd.get('website'), 100)) return back('trimis=1');
  const name = str(fd.get('name'), 120);
  const email = str(fd.get('email'), 200);
  const message = str(fd.get('message'), 5000);
  const topic = (TOPICS as readonly string[]).includes(str(fd.get('topic'), 20)) ? (str(fd.get('topic'), 20) as (typeof TOPICS)[number]) : 'secretariat';
  if (name.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || message.length < 10) return back('eroare=date');
  if (!(await verifyTurnstile(str(fd.get('cf-turnstile-response'), 2048), request, 'contact'))) return back('eroare=verificare');
  await db()
    .insert(schema.contactMessages)
    .values({ name, email, phone: str(fd.get('phone'), 40) || null, topic, message, locale, ipPrefix: ipPrefix(request) });
  return back('trimis=1');
};
