import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeUserConfig } from '../../src/lib/server-auth';

// Import the route handler directly. Middleware is tested separately;
// here we focus on schema validation + happy path.
import { POST as authPost } from '../../src/pages/api/auth';

const VALID_HASH = 'a'.repeat(64);

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'scar-auth-api-'));
  process.env.SCAR_CONFIG_PATH = join(tempDir, 'user.config.json');
  await writeUserConfig({ adminPassHash: VALID_HASH });
});

afterEach(async () => {
  delete process.env.SCAR_CONFIG_PATH;
  await rm(tempDir, { recursive: true, force: true });
});

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Astro APIRoute receives an APIContext; we only use { request, clientAddress }.
function makeCtx(body: unknown, ip = '1.2.3.4') {
  return { request: makeReq(body), clientAddress: ip } as never;
}

describe('POST /api/auth', () => {
  it('200 with correct admin hash', async () => {
    const res = await authPost(makeCtx({ kind: 'admin', hash: VALID_HASH }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it('401 with wrong hash', async () => {
    const res = await authPost(makeCtx({ kind: 'admin', hash: '0'.repeat(64) }));
    expect(res.status).toBe(401);
  });

  it('400 on invalid kind', async () => {
    const res = await authPost(makeCtx({ kind: 'root', hash: VALID_HASH }));
    expect(res.status).toBe(400);
  });

  it('400 on non-hex hash', async () => {
    const res = await authPost(makeCtx({ kind: 'admin', hash: 'not-a-hash' }));
    expect(res.status).toBe(400);
  });

  it('400 on missing hash', async () => {
    const res = await authPost(makeCtx({ kind: 'admin' }));
    expect(res.status).toBe(400);
  });

  it('rate-limits after 10 failures per IP', async () => {
    const ip = '9.9.9.9';
    for (let i = 0; i < 10; i++) {
      const res = await authPost(makeCtx({ kind: 'admin', hash: '0'.repeat(64) }, ip));
      expect(res.status).toBe(401);
    }
    const res = await authPost(makeCtx({ kind: 'admin', hash: '0'.repeat(64) }, ip));
    expect(res.status).toBe(429);
  });

  it('rate-limit buckets are per-IP', async () => {
    for (let i = 0; i < 11; i++) {
      await authPost(makeCtx({ kind: 'admin', hash: '0'.repeat(64) }, '8.8.8.8'));
    }
    // Different IP: still allowed
    const res = await authPost(makeCtx({ kind: 'admin', hash: VALID_HASH }, '7.7.7.7'));
    expect(res.status).toBe(200);
  });

  it('successful login clears that IP\'s failure bucket', async () => {
    const ip = '6.6.6.6';
    for (let i = 0; i < 9; i++) {
      await authPost(makeCtx({ kind: 'admin', hash: '0'.repeat(64) }, ip));
    }
    // Hit the right password
    const ok = await authPost(makeCtx({ kind: 'admin', hash: VALID_HASH }, ip));
    expect(ok.status).toBe(200);
    // Bucket should be cleared — 10 more fails are allowed again
    for (let i = 0; i < 10; i++) {
      const r = await authPost(makeCtx({ kind: 'admin', hash: '0'.repeat(64) }, ip));
      expect(r.status).toBe(401);
    }
  });
});
