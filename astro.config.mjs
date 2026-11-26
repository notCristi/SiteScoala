// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';

export default defineConfig({
  site: 'https://liceulhonterusbrasov.ro',
  output: 'server',
  trailingSlash: 'ignore',
  adapter: cloudflare({ imageService: 'compile' }),
  session: false,
  // Public HTML is cached at the edge by tag and purged on publish (src/server/cache.ts).
  cache: { provider: cacheCloudflare() },
  i18n: {
    locales: ['ro', 'de', 'en'],
    defaultLocale: 'ro',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  // Admin forms post same-origin; the API also checks a CSRF token.
  security: { checkOrigin: true },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
});
