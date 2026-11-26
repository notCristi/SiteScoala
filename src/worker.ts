/**
 * Worker entry: Astro handles every request; the cron (every 5 minutes, wrangler.jsonc) retries
 * queued edge-cache purges and cleans up expired sessions and old purge rows.
 */
import { handle } from '@astrojs/cloudflare/handler';
import { processPurgeQueue } from './server/admin/purge';

export default {
  fetch: handle,
  async scheduled(_controller, _env, ctx) {
    ctx.waitUntil(processPurgeQueue().catch((e) => console.error('purge queue failed', e)));
  },
} satisfies ExportedHandler<Env>;
