/**
 * Worker entry: Astro handles every request; the cron (every 5 minutes, wrangler.jsonc) retries
 * queued edge-cache purges, purges pages whose content changes when a date passes (banner expiry,
 * guide steps opening/closing, events, document validity), and cleans up expired sessions and old purge rows.
 */
import { handle } from '@astrojs/cloudflare/handler';
import { processPurgeQueue } from './server/admin/purge';
import { purgeDateBoundaries } from './server/scheduled';

export default {
  fetch: handle,
  async scheduled(_controller, _env, ctx) {
    ctx.waitUntil(
      purgeDateBoundaries()
        .catch((e) => console.error('date-boundary purge failed', e))
        .then(() => processPurgeQueue())
        .catch((e) => console.error('purge queue failed', e)),
    );
  },
} satisfies ExportedHandler<Env>;
