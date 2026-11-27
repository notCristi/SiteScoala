/**
 * Time-based edge-cache purges (run by the 5-minute cron in src/worker.ts).
 *
 * Public HTML is cached at the edge and purged on publish — but some pages change when a date passes,
 * without anyone publishing: an urgent banner expires (every page), a guide step opens or closes
 * ("Open now", the "next step" box), an event drops out of "Coming up", a document's validity ends.
 * Every run looks for such boundaries in the last WINDOW and purges the affected tags through the
 * durable purge queue (src/server/admin/purge.ts). Date-dependent routes also have a short edge TTL
 * (src/server/cache.ts), so a missed run costs at most ten minutes.
 */
import { and, between, eq, or, sql } from 'drizzle-orm';
import { db, schema as s } from './db';
import { purge } from './admin/purge';

/** Look back a little over two cron periods, so one failed run does not lose a boundary. */
const WINDOW = 11 * 60_000;
const DAY = 86_400_000;

export async function purgeDateBoundaries(now = Date.now()): Promise<string[]> {
  const from = now - WINDOW;
  const d = db();
  const a = s.announcements;
  const one = sql<number>`1`;
  const [banners, steps, events, docs] = await d.batch([
    d.select({ x: one }).from(a).where(and(eq(a.pinnedBanner, true), between(a.bannerUntil, from, now))).limit(1),
    d
      .select({ x: one })
      .from(s.guideSteps)
      .where(or(between(s.guideSteps.startsAt, from, now), between(s.guideSteps.endsAt, from, now)))
      .limit(1),
    // the home page keeps an event in "Coming up" until a day after it ends (src/views/Home.astro)
    d
      .select({ x: one })
      .from(a)
      .where(
        and(
          eq(a.type, 'event'),
          or(between(a.eventStart, from, now), sql`coalesce(${a.eventEnd}, ${a.eventStart}) + ${DAY} between ${from} and ${now}`),
        ),
      )
      .limit(1),
    d.select({ x: one }).from(s.documents).where(between(s.documents.validUntil, from, now)).limit(1),
  ]);
  const tags = new Set<string>();
  if (banners.length) tags.add('layout');
  if (steps.length) ['guides', 'home'].forEach((t) => tags.add(t));
  if (events.length) ['home', 'ann'].forEach((t) => tags.add(t));
  if (docs.length) ['docs', 'home', 'guides', 'search'].forEach((t) => tags.add(t));
  if (tags.size) await purge(undefined, [], [...tags]);
  return [...tags];
}
