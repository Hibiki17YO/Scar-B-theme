import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeUserConfig } from '../src/lib/server-auth';

// astro:middleware exposes defineMiddleware; it just identity-wraps the handler.
vi.mock('astro:middleware', () => ({
  defineMiddleware: (fn: unknown) => fn,
}));

// The middleware reads getConfigPath() every call, so SCAR_CONFIG_PATH wins.
import { onRequest } from '../src/middleware';

let tempDir: string;
const VALID_ADMIN = 'a'.repeat(64);
const VALID_BLOG = 'b'.repeat(64);

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'scar-mw-'));
  process.env.SCAR_CONFIG_PATH = join(tempDir, 'user.config.json');
  await writeUserConfig({ adminPassHash: VALID_ADMIN, blogPassHash: VALID_BLOG });
});

afterEach(async () => {
  delete process.env.SCAR_CONFIG_PATH;
  await rm(tempDir, { recursive: true, force: true });
});

function ctx(url: string, method: string, headers: Record<string, string> = {}) {
  const u = new URL(url);
  return {
    url: u,
    request: new Request(url, { method, headers }),
  } as never;
}

function next() {
  return new Response('OK', { status: 200 });
}

describe('middleware', () => {
  it('passes through GET requests', async () => {
    const res = await onRequest(ctx('http://x/api/config', 'GET'), next);
    expect(res.status).toBe(200);
  });

  it('passes through non-/api routes', async () => {
    const res = await onRequest(ctx('http://x/blog', 'POST'), next);
    expect(res.status).toBe(200);
  });

  it('passes through /api/auth without token', async () => {
    const res = await onRequest(ctx('http://x/api/auth', 'POST'), next);
    expect(res.status).toBe(200);
  });

  it('blocks PUT /api/config without token', async () => {
    const res = await onRequest(ctx('http://x/api/config', 'PUT'), next);
    expect(res.status).toBe(401);
  });

  it('allows PUT /api/config with correct admin token', async () => {
    const res = await onRequest(
      ctx('http://x/api/config', 'PUT', { 'X-Admin-Token': VALID_ADMIN }),
      next,
    );
    expect(res.status).toBe(200);
  });

  it('rejects PUT /api/config with wrong admin token', async () => {
    const res = await onRequest(
      ctx('http://x/api/config', 'PUT', { 'X-Admin-Token': '0'.repeat(64) }),
      next,
    );
    expect(res.status).toBe(401);
  });

  it('rejects blog token on /api/config', async () => {
    const res = await onRequest(
      ctx('http://x/api/config', 'PUT', { 'X-Admin-Token': VALID_BLOG }),
      next,
    );
    expect(res.status).toBe(401);
  });

  it('allows POST /api/posts with blog token', async () => {
    const res = await onRequest(
      ctx('http://x/api/posts', 'POST', { 'X-Blog-Token': VALID_BLOG }),
      next,
    );
    expect(res.status).toBe(200);
  });

  it('allows POST /api/posts with admin token (admin = superuser)', async () => {
    const res = await onRequest(
      ctx('http://x/api/posts', 'POST', { 'X-Admin-Token': VALID_ADMIN }),
      next,
    );
    expect(res.status).toBe(200);
  });

  it('first-run: passes through /api/config writes when no admin password set', async () => {
    await writeUserConfig({});  // no hashes
    const res = await onRequest(ctx('http://x/api/config', 'PUT'), next);
    expect(res.status).toBe(200);
  });

  it('first-run: passes through /api/posts writes when neither password set', async () => {
    await writeUserConfig({});
    const res = await onRequest(ctx('http://x/api/posts', 'POST'), next);
    expect(res.status).toBe(200);
  });

  it('locks /api/config once admin password is set, even if blog is empty', async () => {
    await writeUserConfig({ adminPassHash: VALID_ADMIN });
    const res = await onRequest(ctx('http://x/api/config', 'PUT'), next);
    expect(res.status).toBe(401);
  });
});
