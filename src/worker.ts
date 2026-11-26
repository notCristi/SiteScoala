import { handle } from '@astrojs/cloudflare/handler';

export default {
  fetch: handle,
  async scheduled(_controller, _env, _ctx) {},
} satisfies ExportedHandler<Env>;
