/**
 * Audit trail + revisions + role checks. Every admin write goes through `audit()`.
 */
import type { APIContext } from 'astro';
import { db, schema as s } from '../db';
import { ipPrefix } from '../security';
import type { AdminUser } from '../auth';
import type { Role } from '~/db/schema';

export type Capability = 'content' | 'translate' | 'publish' | 'banner' | 'admin';
const MATRIX: Record<Role, Capability[]> = {
  admin: ['content', 'translate', 'publish', 'banner', 'admin'],
  editor: ['content', 'translate', 'publish', 'banner'],
  translator: ['translate'],
};
export const can = (u: AdminUser | undefined, cap: Capability) => !!u && MATRIX[u.role].includes(cap);

export function audit(ctx: APIContext, action: string, entityType: string | null, entityId: string | number | null, summary?: string) {
  return db()
    .insert(s.auditLog)
    .values({
      userId: ctx.locals.admin?.id ?? null,
      action,
      entityType,
      entityId: entityId == null ? null : String(entityId),
      summary: summary ? summary.slice(0, 300) : null,
      ipPrefix: ipPrefix(ctx.request),
    })
    .run();
}

export function revision(ctx: APIContext, entityType: string, entityId: string | number, data: unknown) {
  return db()
    .insert(s.revisions)
    .values({ entityType, entityId: String(entityId), dataJson: JSON.stringify(data), savedBy: ctx.locals.admin?.id ?? null })
    .run();
}
