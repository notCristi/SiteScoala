/**
 * Admin authentication (docs/04 §5): PBKDF2-SHA256 + pepper, D1 sessions, CSRF synchroniser token,
 * lockout after 5 failures, one-time invite / reset links, bootstrap account for an empty database.
 *
 * Public pages never reach this module: the middleware calls `adminGate` only for /admin and /api/admin.
 */
import type { APIContext, AstroCookies } from 'astro';
import { and, count, eq, gt, sql } from 'drizzle-orm';
import { db, schema as s } from './db';
import { ipPrefix, verifyTurnstile } from './security';
import { b64, cfg, randomToken, safeEqual, sha256Hex, timingSafeEqual, unb64 } from './admin/util';
import type { Role } from '~/db/schema';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  csrf: string;
  uiLocale: 'ro' | 'de';
  /** true for the bootstrap account until its password is changed */
  mustChangePassword: boolean;
}

const IDLE_MS = 12 * 3600_000;
const ABSOLUTE_MS = 7 * 86400_000;
const TOUCH_EVERY_MS = 5 * 60_000;
const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60_000;
export const INVITE_TTL_MS = 7 * 86400_000;

// ───────────────────────────── passwords ─────────────────────────────
const enc = new TextEncoder();
const iterations = () => {
  const n = Number(cfg('PBKDF2_ITERATIONS') ?? 100_000);
  return Number.isFinite(n) && n >= 10_000 && n <= 1_000_000 ? Math.floor(n) : 100_000;
};
async function pepper(pw: string): Promise<Uint8Array> {
  const secret = cfg('AUTH_PEPPER');
  if (!secret) throw new Error('AUTH_PEPPER is not configured');
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(pw.normalize('NFKC'))));
}
async function derive(pw: string, salt: Uint8Array, iter: number): Promise<Uint8Array> {
  const base = await crypto.subtle.importKey('raw', (await pepper(pw)) as BufferSource, 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: iter }, base, 256));
}
/** `pbkdf2$<iterations>$<salt b64>$<hash b64>` — iterations stored per hash so they can be raised later. */
export async function hashPassword(pw: string, iter = iterations()): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${iter}$${b64(salt)}$${b64(await derive(pw, salt, iter))}`;
}
export async function verifyPassword(pw: string, stored: string | null | undefined): Promise<{ ok: boolean; rehash: boolean }> {
  const parts = (stored ?? '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    // constant-ish work so timing does not reveal unknown accounts
    await derive(pw, new Uint8Array(16), iterations());
    return { ok: false, rehash: false };
  }
  const iter = Number(parts[1]);
  const a = await derive(pw, unb64(parts[2]!), iter);
  const b = unb64(parts[3]!);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  return { ok, rehash: ok && iter < iterations() };
}

const COMMON = new Set([
  'parola123456', '123456789012', 'password1234', 'qwertyuiop12', 'honterus2024', 'honterus2025', 'honterus2026',
  'brasov123456', 'administrator', 'parolaparola', '1234567890ab', 'aaaaaaaaaaaa', 'passwordpassword',
]);
/** Returns an i18n error key or null. ≥ 12 characters, no composition rules (NIST 800-63B). */
export function passwordProblem(pw: string, email: string): string | null {
  if (pw.length < 12) return 'pwTooShort';
  if (pw.length > 256) return 'pwTooLong';
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  if (COMMON.has(pw.toLowerCase()) || (local.length >= 4 && pw.toLowerCase().includes(local))) return 'pwTooCommon';
  if (/^(.)\1+$/.test(pw)) return 'pwTooCommon';
  return null;
}

// ───────────────────────────── cookies / sessions ─────────────────────────────
export const sessionCookieName = (url: URL) => (url.protocol === 'https:' ? '__Host-hs' : 'hs');

function setSessionCookie(cookies: AstroCookies, url: URL, token: string) {
  cookies.set(sessionCookieName(url), token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: url.protocol === 'https:',
    maxAge: ABSOLUTE_MS / 1000,
  });
}

export async function createSession(ctx: APIContext, userId: string) {
  const token = randomToken(32);
  const now = Date.now();
  await db()
    .insert(s.sessions)
    .values({
      idHash: await sha256Hex(token),
      userId,
      csrfSecret: randomToken(24),
      createdAt: now,
      lastSeenAt: now,
      expiresAt: now + IDLE_MS,
      absoluteExpiresAt: now + ABSOLUTE_MS,
      userAgent: (ctx.request.headers.get('user-agent') ?? '').slice(0, 200),
      ipPrefix: ipPrefix(ctx.request),
    });
  setSessionCookie(ctx.cookies, ctx.url, token);
}

export async function destroySession(ctx: APIContext) {
  const token = ctx.cookies.get(sessionCookieName(ctx.url))?.value;
  if (token) await db().delete(s.sessions).where(eq(s.sessions.idHash, await sha256Hex(token)));
  ctx.cookies.delete(sessionCookieName(ctx.url), { path: '/' });
}

/** Revoke every session of a user (password change, deactivation, role change). */
export const revokeSessions = (userId: string) => db().delete(s.sessions).where(eq(s.sessions.userId, userId));

async function currentUser(ctx: APIContext): Promise<AdminUser | undefined> {
  const token = ctx.cookies.get(sessionCookieName(ctx.url))?.value;
  if (!token || token.length > 100) return undefined;
  const idHash = await sha256Hex(token);
  const now = Date.now();
  const [row] = await db()
    .select({ sess: s.sessions, user: s.adminUsers })
    .from(s.sessions)
    .innerJoin(s.adminUsers, eq(s.adminUsers.id, s.sessions.userId))
    .where(and(eq(s.sessions.idHash, idHash), gt(s.sessions.expiresAt, now), gt(s.sessions.absoluteExpiresAt, now)))
    .limit(1);
  if (!row || row.user.status !== 'active') return undefined;
  if (now - row.sess.lastSeenAt > TOUCH_EVERY_MS) {
    const p = db()
      .update(s.sessions)
      .set({ lastSeenAt: now, expiresAt: Math.min(now + IDLE_MS, row.sess.absoluteExpiresAt) })
      .where(eq(s.sessions.idHash, idHash))
      .run()
      .catch(() => undefined);
    ctx.locals.cfContext?.waitUntil?.(p);
  }
  const ui = ctx.cookies.get('hs_ui')?.value;
  return {
    id: row.user.id,
    email: row.user.email,
    name: row.user.displayName,
    role: row.user.role,
    csrf: row.sess.csrfSecret,
    uiLocale: ui === 'de' || ui === 'ro' ? ui : row.user.uiLocale,
    mustChangePassword: row.user.passwordChangedAt == null,
  };
}

// ───────────────────────────── the gate ─────────────────────────────
const OPEN = new Set(['/admin/login', '/admin/activare', '/admin/logout', '/admin/ui']);
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

async function csrfFrom(req: Request): Promise<string> {
  const h = req.headers.get('x-csrf');
  if (h) return h;
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    try {
      const v = (await req.clone().formData()).get('_csrf');
      return typeof v === 'string' ? v : '';
    } catch {
      return '';
    }
  }
  return '';
}

const deny = (isApi: boolean, status: number, msg: string) =>
  isApi
    ? new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } })
    : new Response(msg, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

/**
 * Admin page routes live under a UI-language segment: src/pages/admin/[ui]/… (ui = ro | de).
 * Public URLs stay /admin/…; the gate rewrites them internally to /admin/<ui>/…
 * Reason: astro.config's i18n strategy ('prefix-always') post-processes every *page* whose path has
 * no locale segment into a 404 — after it has rendered. A path containing "/ro/" or "/de/" passes.
 * Endpoints (/api/admin/**, /admin/logout, /admin/ui) are not affected and are not rewritten.
 */
const UI_PREFIX = /^\/admin\/(ro|de)(\/|$)/;
const ENDPOINTS = new Set(['/admin/logout', '/admin/ui']);
/** Strip the internal UI segment: /admin/ro/anunturi → /admin/anunturi */
export const publicAdminPath = (p: string) => p.replace(/^\/admin\/(ro|de)(?=\/|$)/, '/admin');

/**
 * Called by src/middleware.ts for /admin/** and /api/admin/**.
 * Returns a Response to stop (or rewrite) the request, or undefined to continue (with ctx.locals.admin set).
 */
export async function adminGate(ctx: APIContext): Promise<Response | undefined> {
  const rawPath = ctx.url.pathname.replace(/\/+$/, '') || '/';
  const isApi = rawPath.startsWith('/api/admin');
  const rewritten = UI_PREFIX.test(rawPath);
  const path = publicAdminPath(rawPath);
  const unsafe = !SAFE.has(ctx.request.method);
  // second pass of an internal rewrite: already authenticated and CSRF-checked on the first pass
  const trusted = rewritten && !!ctx.locals.admin;

  if (unsafe && !trusted) {
    const site = ctx.request.headers.get('sec-fetch-site');
    if (site && site !== 'same-origin' && site !== 'none') return deny(isApi, 403, 'Cross-site request blocked');
  }

  const user =
    ctx.locals.admin ??
    (await currentUser(ctx).catch((e: unknown) => {
      console.error('admin session lookup failed', e);
      return undefined;
    }));

  const pass = (): Promise<Response> | undefined => {
    if (user) ctx.locals.admin = user;
    if (isApi || rewritten || ENDPOINTS.has(path)) return undefined;
    const ui = user?.uiLocale ?? (ctx.cookies.get('hs_ui')?.value === 'de' ? 'de' : 'ro');
    return ctx.rewrite(`/admin/${ui}${path === '/admin' ? '' : path.slice('/admin'.length)}${ctx.url.search}`);
  };

  if (OPEN.has(path)) {
    if (path === '/admin/logout' && unsafe && user && !safeEqual(await csrfFrom(ctx.request), user.csrf)) {
      return deny(isApi, 403, 'Invalid CSRF token');
    }
    return pass();
  }

  if (!user) {
    if (isApi) return deny(true, 401, 'Not authenticated');
    const next = path + ctx.url.search;
    return new Response(null, { status: 302, headers: { Location: `/admin/login?next=${encodeURIComponent(next)}` } });
  }
  if (unsafe && !trusted && !safeEqual(await csrfFrom(ctx.request), user.csrf)) return deny(isApi, 403, 'Invalid CSRF token');

  // Bootstrap password (manual §2.3): nothing but „Contul meu” (and its password POST) until it is changed.
  if (user.mustChangePassword && !MUST_CHANGE_ALLOWED.has(path)) {
    if (isApi) return deny(true, 403, 'Password change required');
    return new Response(null, { status: 303, headers: { Location: '/admin/cont' } });
  }
  return pass();
}
const MUST_CHANGE_ALLOWED = new Set(['/admin/cont', '/admin/logout', '/admin/ui']);

// ───────────────────────────── login ─────────────────────────────
export type LoginResult = { ok: true; userId: string; bootstrap: boolean } | { ok: false; error: 'invalid' | 'locked' | 'turnstile' | 'config' };

const turnstileBypass = (url: URL) =>
  cfg('TURNSTILE_DEV_BYPASS') === '1' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1') && url.protocol === 'http:';

/**
 * Wrong passwords for this e-mail from this network in the current window. The window starts 15 minutes ago,
 * or at the last successful login / end of the last lock if that is later — so the counter resets on success
 * and attempts made while locked (summary 'locked') never extend a lock.
 */
async function recentFailures(email: string, ip: string): Promise<number> {
  const [u] = await db().select({ last: s.adminUsers.lastLoginAt, lockedUntil: s.adminUsers.lockedUntil }).from(s.adminUsers).where(eq(s.adminUsers.email, email)).limit(1);
  const since = Math.max(Date.now() - LOCK_MS, u?.last ?? 0, u?.lockedUntil && u.lockedUntil <= Date.now() ? u.lockedUntil : 0);
  const [r] = await db()
    .select({ n: count() })
    .from(s.auditLog)
    .where(and(eq(s.auditLog.action, 'login_fail'), eq(s.auditLog.summary, 'invalid'), eq(s.auditLog.entityId, email), eq(s.auditLog.ipPrefix, ip), gt(s.auditLog.at, since)));
  return r?.n ?? 0;
}

export async function hasUsers(): Promise<boolean> {
  const [r] = await db().select({ n: count() }).from(s.adminUsers);
  return (r?.n ?? 0) > 0;
}

export const bootstrapEmail = () => (cfg('ADMIN_BOOTSTRAP_EMAIL') ?? 'YOUR_EMAIL@EXAMPLE.COM').toLowerCase();

export async function login(ctx: APIContext, emailRaw: string, password: string, turnstileToken: string | null): Promise<LoginResult> {
  if (!cfg('AUTH_PEPPER')) return { ok: false, error: 'config' };
  const email = emailRaw.trim().toLowerCase().slice(0, 200);
  const ip = ipPrefix(ctx.request);
  const fail = async (error: 'invalid' | 'locked', userId?: string) => {
    await db().insert(s.auditLog).values({ action: 'login_fail', entityType: 'auth', entityId: email, userId: userId ?? null, ipPrefix: ip, summary: error });
    return { ok: false as const, error };
  };

  if (!turnstileBypass(ctx.url) && !(await verifyTurnstile(turnstileToken, ctx.request, 'login'))) return { ok: false, error: 'turnstile' };
  if ((await recentFailures(email, ip)) >= LOCK_AFTER) return fail('locked');

  // Bootstrap: an empty admin_users table lets the configured account in once and creates it as admin.
  if (!(await hasUsers())) {
    const bpw = cfg('ADMIN_BOOTSTRAP_PASSWORD');
    const okEmail = email === bootstrapEmail();
    const okPw = !!bpw && safeEqual(await sha256Hex(password), await sha256Hex(bpw));
    if (!okEmail || !okPw) return fail('invalid');
    const id = crypto.randomUUID();
    await db()
      .insert(s.adminUsers)
      .values({ id, email, displayName: 'Administrator', role: 'admin', status: 'active', passwordHash: await hashPassword(password), lastLoginAt: Date.now() });
    await db().insert(s.auditLog).values({ action: 'bootstrap', entityType: 'user', entityId: id, userId: id, ipPrefix: ip, summary: email });
    await createSession(ctx, id);
    return { ok: true, userId: id, bootstrap: true };
  }

  const [user] = await db().select().from(s.adminUsers).where(eq(s.adminUsers.email, email)).limit(1);
  const { ok, rehash } = await verifyPassword(password, user?.passwordHash);
  if (!user || user.status !== 'active') return fail('invalid');
  const now = Date.now();
  if (user.lockedUntil && user.lockedUntil > now) return fail('locked', user.id);
  if (!ok) {
    // Failures count only inside a 15-minute window that starts after the last lock ended: old typos and
    // an expired lock never carry over, so the account is not locked again by a single mistake.
    const since = Math.max(now - LOCK_MS, user.lockedUntil ?? 0, user.lastLoginAt ?? 0);
    const [r] = await db()
      .select({ n: count() })
      .from(s.auditLog)
      .where(and(eq(s.auditLog.action, 'login_fail'), eq(s.auditLog.summary, 'invalid'), eq(s.auditLog.userId, user.id), gt(s.auditLog.at, since)));
    const n = (r?.n ?? 0) + 1;
    await db()
      .update(s.adminUsers)
      .set({ failedLogins: n, lockedUntil: n >= LOCK_AFTER ? now + LOCK_MS : user.lockedUntil })
      .where(eq(s.adminUsers.id, user.id));
    return fail(n >= LOCK_AFTER ? 'locked' : 'invalid', user.id);
  }
  await db()
    .update(s.adminUsers)
    .set({
      failedLogins: 0,
      lockedUntil: null,
      lastLoginAt: Date.now(),
      ...(rehash ? { passwordHash: await hashPassword(password) } : {}),
    })
    .where(eq(s.adminUsers.id, user.id));
  await db().insert(s.auditLog).values({ action: 'login', entityType: 'user', entityId: user.id, userId: user.id, ipPrefix: ip });
  await createSession(ctx, user.id);
  return { ok: true, userId: user.id, bootstrap: false };
}

// ───────────────────────────── invites / resets ─────────────────────────────
/** Creates a one-time link token. Returns the raw token (shown once to the admin, stored hashed). */
export async function createInviteToken(userId: string, purpose: 'invite' | 'reset', createdBy: string): Promise<string> {
  const token = randomToken(32);
  const now = Date.now();
  // one valid link per user at a time
  await db().update(s.invites).set({ usedAt: now }).where(and(eq(s.invites.userId, userId), sql`${s.invites.usedAt} is null`));
  await db()
    .insert(s.invites)
    .values({ tokenHash: await sha256Hex(token), userId, purpose, createdBy, createdAt: now, expiresAt: now + INVITE_TTL_MS });
  return token;
}

export async function findInvite(token: string | null | undefined) {
  if (!token || token.length > 100) return undefined;
  const [row] = await db()
    .select({ invite: s.invites, user: s.adminUsers })
    .from(s.invites)
    .innerJoin(s.adminUsers, eq(s.adminUsers.id, s.invites.userId))
    .where(and(eq(s.invites.tokenHash, await sha256Hex(token)), gt(s.invites.expiresAt, Date.now())))
    .limit(1);
  if (!row || row.invite.usedAt || row.user.status === 'disabled') return undefined;
  return row;
}

export async function acceptInvite(ctx: APIContext, token: string, name: string, password: string) {
  const row = await findInvite(token);
  if (!row) return { ok: false as const, error: 'inviteInvalid' };
  const problem = passwordProblem(password, row.user.email);
  if (problem) return { ok: false as const, error: problem };
  const now = Date.now();
  await db().batch([
    db()
      .update(s.adminUsers)
      .set({
        displayName: name || row.user.displayName,
        status: 'active',
        passwordHash: await hashPassword(password),
        passwordChangedAt: now,
        failedLogins: 0,
        lockedUntil: null,
        updatedAt: now,
      })
      .where(eq(s.adminUsers.id, row.user.id)),
    db().update(s.invites).set({ usedAt: now }).where(eq(s.invites.tokenHash, row.invite.tokenHash)),
    db().delete(s.sessions).where(eq(s.sessions.userId, row.user.id)),
    db()
      .insert(s.auditLog)
      .values({ action: row.invite.purpose === 'invite' ? 'invite_accept' : 'password_reset', entityType: 'user', entityId: row.user.id, userId: row.user.id, ipPrefix: ipPrefix(ctx.request) }),
  ]);
  await createSession(ctx, row.user.id);
  return { ok: true as const };
}

export async function changePassword(ctx: APIContext, user: AdminUser, current: string, next: string) {
  const [row] = await db().select().from(s.adminUsers).where(eq(s.adminUsers.id, user.id)).limit(1);
  if (!row) return 'invalid';
  // the current-password check is rate-limited like the login (5 wrong answers per 15 minutes)
  const [fails] = await db()
    .select({ n: count() })
    .from(s.auditLog)
    .where(and(eq(s.auditLog.action, 'password_change_fail'), eq(s.auditLog.userId, user.id), gt(s.auditLog.at, Date.now() - LOCK_MS)));
  if ((fails?.n ?? 0) >= LOCK_AFTER) return 'errPwAttempts';
  if (!(await verifyPassword(current, row.passwordHash)).ok) {
    await db().insert(s.auditLog).values({ action: 'password_change_fail', entityType: 'user', entityId: user.id, userId: user.id, ipPrefix: ipPrefix(ctx.request) });
    return 'pwCurrentWrong';
  }
  const problem = passwordProblem(next, row.email);
  if (problem) return problem;
  const now = Date.now();
  await db().update(s.adminUsers).set({ passwordHash: await hashPassword(next), passwordChangedAt: now, updatedAt: now }).where(eq(s.adminUsers.id, user.id));
  await revokeSessions(user.id);
  await db().insert(s.auditLog).values({ action: 'password_change', entityType: 'user', entityId: user.id, userId: user.id, ipPrefix: ipPrefix(ctx.request) });
  await createSession(ctx, user.id);
  return null;
}
