import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeUserConfig, sha256hex } from '../../src/lib/server-auth';
import { GET as configGet, PUT as configPut } from '../../src/pages/api/config';

const ADMIN_HASH = sha256hex('admin-pass');

let tempDir: string;
let configPath: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'scar-config-api-'));
  configPath = join(tempDir, 'user.config.json');
  process.env.SCAR_CONFIG_PATH = configPath;
});

afterEach(async () => {
  delete process.env.SCAR_CONFIG_PATH;
  await rm(tempDir, { recursive: true, force: true });
});

function makePut(body: unknown): never {
  return {
    request: new Request('http://localhost/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  } as never;
}

describe('GET /api/config', () => {
  it('exposes hasAdminPass / hasBlogPass and strips hashes', async () => {
    await writeUserConfig({
      siteTitle: 'X',
      adminPassHash: ADMIN_HASH,
      blogPassHash: '',
    });
    const res = await configGet({} as never);
    const body = await res.json();
    expect(body.siteTitle).toBe('X');
    expect(body.adminPassHash).toBeUndefined();
    expect(body.blogPassHash).toBeUndefined();
    expect(body.hasAdminPass).toBe(true);
    expect(body.hasBlogPass).toBe(false);
  });

  it('falls back to defaults when no config file exists', async () => {
    const res = await configGet({} as never);
    const body = await res.json();
    expect(body.username).toBe('visitor');  // defaultConfig
    expect(body.hasAdminPass).toBe(false);
  });
});

describe('PUT /api/config — body validation', () => {
  it('rejects empty body with 400', async () => {
    const res = await configPut(makePut({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/empty config body/);
  });

  it('rejects invalid types with 400', async () => {
    const res = await configPut(makePut({ siteTitle: 12345 }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid config');
  });

  it('rejects unknown fields (strict)', async () => {
    const res = await configPut(makePut({ adminPassHash: 'sneaky' }));
    expect(res.status).toBe(400);
  });

  it('rejects siteTitle longer than 200 chars', async () => {
    const res = await configPut(makePut({ siteTitle: 'x'.repeat(201) }));
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/config — happy path', () => {
  it('writes valid config and preserves hashes', async () => {
    await writeUserConfig({ adminPassHash: ADMIN_HASH, blogPassHash: 'bbb' });
    const res = await configPut(makePut({ siteTitle: 'New' }));
    expect(res.status).toBe(200);
    const written = JSON.parse(await readFile(configPath, 'utf-8'));
    expect(written.siteTitle).toBe('New');
    expect(written.adminPassHash).toBe(ADMIN_HASH);
    expect(written.blogPassHash).toBe('bbb');
  });

  it('hashes newAdminPass and never persists plain text', async () => {
    const res = await configPut(makePut({
      siteTitle: 'X',
      newAdminPass: 'hunter2',
    }));
    expect(res.status).toBe(200);
    const written = JSON.parse(await readFile(configPath, 'utf-8'));
    expect(written.newAdminPass).toBeUndefined();
    expect(written.adminPassHash).toBe(sha256hex('hunter2'));
  });

  it('hashes newBlogPass independently of newAdminPass', async () => {
    const res = await configPut(makePut({
      siteTitle: 'X',
      newBlogPass: 'blog-pw',
    }));
    expect(res.status).toBe(200);
    const written = JSON.parse(await readFile(configPath, 'utf-8'));
    expect(written.blogPassHash).toBe(sha256hex('blog-pw'));
  });
});

describe('PUT /api/config — reset sentinel', () => {
  it('wipes non-password fields when { reset: true }', async () => {
    await writeUserConfig({
      siteTitle: 'A',
      username: 'me',
      adminPassHash: ADMIN_HASH,
      blogPassHash: 'bbb',
    });
    const res = await configPut(makePut({ reset: true }));
    expect(res.status).toBe(200);
    const written = JSON.parse(await readFile(configPath, 'utf-8'));
    expect(written.siteTitle).toBeUndefined();
    expect(written.username).toBeUndefined();
    expect(written.adminPassHash).toBe(ADMIN_HASH);
    expect(written.blogPassHash).toBe('bbb');
  });

  it('does not reset if reset is not exactly true', async () => {
    await writeUserConfig({ siteTitle: 'A', adminPassHash: ADMIN_HASH });
    // reset: 1 (truthy but not === true) is rejected as unknown field by strict()
    const res = await configPut(makePut({ reset: 1 }));
    expect(res.status).toBe(400);
  });
});
