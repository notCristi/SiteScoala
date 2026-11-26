import { env } from 'cloudflare:workers';

/** Coarse IP prefix for audit/rate limiting (privacy: never the full address). */
export function ipPrefix(req: Request): string {
  const ip = req.headers.get('cf-connecting-ip') ?? '';
  if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + '::/48';
  const p = ip.split('.');
  return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0/24` : 'unknown';
}

/** Cloudflare Turnstile server-side validation. https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ */
export async function verifyTurnstile(token: string | null, req: Request, action?: string): Promise<boolean> {
  const secret = (env as unknown as Record<string, string | undefined>).TURNSTILE_SECRET;
  if (!secret) return false;
  if (!token || token.length > 2048) return false;
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  const ip = req.headers.get('cf-connecting-ip');
  if (ip) body.append('remoteip', ip);
  body.append('idempotency_key', crypto.randomUUID());
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const j = (await r.json()) as { success: boolean; action?: string };
    return j.success === true && (!action || !j.action || j.action === action);
  } catch {
    return false;
  }
}

export const turnstileSiteKey = () => (env as unknown as Record<string, string | undefined>).TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA';
