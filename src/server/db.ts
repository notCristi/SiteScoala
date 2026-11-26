import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '~/db/schema';

export type DB = ReturnType<typeof drizzle<typeof schema>>;

let cached: DB | undefined;
/** Drizzle client bound to the D1 `DB` binding (one per isolate). */
export function db(): DB {
  cached ??= drizzle(env.DB, { schema });
  return cached;
}
export { schema };
