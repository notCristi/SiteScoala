/// <reference types="astro/client" />
import type { AdminUser } from '~/server/auth';

declare global {
  namespace App {
    interface Locals {
      /** Set by the admin gate (src/server/auth.ts) for /admin and /api/admin requests only. */
      admin?: AdminUser;
    }
  }
}
export {};
