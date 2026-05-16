import type { APIRoute } from 'astro';
import { verifyToken } from '../../lib/server-auth';

// In-memory sliding-window rate limiter, keyed by client IP.
// SHA-256 is fast enough for unbounded brute force; a small per-IP cap
// reduces opportunistic password guessing without needing external infra.
const WINDOW_MS = Number(process.env.SCAR_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const MAX_FAILS = Number(process.env.SCAR_RATE_LIMIT_MAX_FAILS ?? 10);
type Bucket = { fails: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now >= b.resetAt) return false;
  return b.fails >= MAX_FAILS;
}

function recordFail(ip: string): void {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now >= b.resetAt) {
    buckets.set(ip, { fails: 1, resetAt: now + WINDOW_MS });
    return;
  }
  b.fails++;
}

function recordSuccess(ip: string): void {
  buckets.delete(ip);
}

// POST /api/auth — verify a SHA-256 password hash against stored hashes.
// Body: { kind: 'admin' | 'blog', hash: string }
// Returns 200 { ok: true } on match, 401 otherwise, 429 when rate-limited.
// The hash itself is used as the bearer token for subsequent write requests.
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || 'unknown';
  if (rateLimited(ip)) {
    return Response.json({ error: 'too many attempts' }, { status: 429 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const kind = body?.kind;
    const hash = typeof body?.hash === 'string' ? body.hash : '';
    if (kind !== 'admin' && kind !== 'blog') {
      return Response.json({ error: 'invalid kind' }, { status: 400 });
    }
    if (!/^[a-f0-9]{64}$/i.test(hash)) {
      return Response.json({ error: 'invalid hash' }, { status: 400 });
    }
    if (await verifyToken(kind, hash)) {
      recordSuccess(ip);
      return Response.json({ ok: true });
    }
    recordFail(ip);
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
