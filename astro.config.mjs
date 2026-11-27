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
  // Same-origin links prefetch on hover/focus (docs/04 §7.5); external links and downloads are never prefetched.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // 'auto' inlines stylesheets below vite's assetsInlineLimit: the critical global.css (~12 KB raw, ~3.5 KB brotli)
  // ships inside the HTML, so only the shared component bundle is a render-blocking request.
  build: { inlineStylesheets: 'auto' },
  vite: { build: { assetsInlineLimit: 12288 } },
});
