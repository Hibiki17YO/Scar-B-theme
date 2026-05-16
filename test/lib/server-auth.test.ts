import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// IMPORTANT: server-auth resolves the config path on every call via getConfigPath(),
// so changing SCAR_CONFIG_PATH between tests works without re-importing the module.
import {
  sha256hex,
  readUserConfig,
  writeUserConfig,
  verifyToken,
  passwordSet,
  getConfigPath,
  getPostsDir,
} from '../../src/lib/server-auth';

let tempDir: string;
let tempConfig: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'scar-auth-'));
  tempConfig = join(tempDir, 'user.config.json');
  process.env.SCAR_CONFIG_PATH = tempConfig;
});

afterEach(async () => {
  delete process.env.SCAR_CONFIG_PATH;
  await rm(tempDir, { recursive: true, force: true });
});

describe('sha256hex', () => {
  it('produces a 64-char lowercase hex digest', () => {
    const h = sha256hex('hello');
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(h).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('handles empty input', () => {
    expect(sha256hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('is deterministic across multiple calls', () => {
    expect(sha256hex('abc')).toBe(sha256hex('abc'));
  });

  it('produces different digests for different inputs', () => {
    expect(sha256hex('a')).not.toBe(sha256hex('b'));
  });
});

describe('getConfigPath / getPostsDir', () => {
  it('honors SCAR_CONFIG_PATH env var', () => {
    expect(getConfigPath()).toBe(tempConfig);
  });

  it('falls back when env var is unset', () => {
    delete process.env.SCAR_CONFIG_PATH;
    expect(getConfigPath()).toMatch(/user\.config\.json$/);
  });

  it('honors SCAR_POSTS_DIR env var', () => {
    process.env.SCAR_POSTS_DIR = '/tmp/scar-posts-test';
    expect(getPostsDir()).toBe('/tmp/scar-posts-test');
    delete process.env.SCAR_POSTS_DIR;
  });
});

describe('readUserConfig', () => {
  it('returns empty object when file does not exist', async () => {
    const cfg = await readUserConfig();
    expect(cfg).toEqual({});
  });

  it('returns empty object on malformed JSON', async () => {
    await writeFile(tempConfig, '{not valid json', 'utf-8');
    const cfg = await readUserConfig();
    expect(cfg).toEqual({});
  });

  it('parses valid JSON', async () => {
    await writeFile(tempConfig, JSON.stringify({ siteTitle: 'X' }), 'utf-8');
    const cfg = await readUserConfig();
    expect(cfg).toEqual({ siteTitle: 'X' });
  });
});

describe('writeUserConfig', () => {
  it('writes JSON to the configured path atomically', async () => {
    await writeUserConfig({ siteTitle: 'A', adminPassHash: 'h' });
    const raw = await readFile(tempConfig, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.siteTitle).toBe('A');
    expect(parsed.adminPassHash).toBe('h');
  });

  it('overwrites existing content', async () => {
    await writeUserConfig({ siteTitle: 'first' });
    await writeUserConfig({ siteTitle: 'second' });
    const cfg = await readUserConfig();
    expect(cfg.siteTitle).toBe('second');
  });
});

describe('verifyToken', () => {
  beforeEach(async () => {
    await writeUserConfig({
      adminPassHash: 'a'.repeat(64),
      blogPassHash: 'b'.repeat(64),
    });
  });

  it('rejects null token', async () => {
    expect(await verifyToken('admin', null)).toBe(false);
  });

  it('rejects empty token', async () => {
    expect(await verifyToken('admin', '')).toBe(false);
  });

  it('accepts matching admin token', async () => {
    expect(await verifyToken('admin', 'a'.repeat(64))).toBe(true);
  });

  it('accepts matching blog token', async () => {
    expect(await verifyToken('blog', 'b'.repeat(64))).toBe(true);
  });

  it('rejects admin token in blog slot', async () => {
    expect(await verifyToken('blog', 'a'.repeat(64))).toBe(false);
  });

  it('rejects length-mismatched token', async () => {
    expect(await verifyToken('admin', 'a'.repeat(63))).toBe(false);
  });

  it('rejects when stored hash is missing', async () => {
    await writeUserConfig({});
    expect(await verifyToken('admin', 'a'.repeat(64))).toBe(false);
  });
});

describe('passwordSet', () => {
  it('returns false when config is empty', async () => {
    expect(await passwordSet('admin')).toBe(false);
    expect(await passwordSet('blog')).toBe(false);
  });

  it('returns false for empty-string hash', async () => {
    await writeUserConfig({ adminPassHash: '', blogPassHash: '' });
    expect(await passwordSet('admin')).toBe(false);
    expect(await passwordSet('blog')).toBe(false);
  });

  it('returns true once a hash is stored', async () => {
    await writeUserConfig({ adminPassHash: 'a'.repeat(64) });
    expect(await passwordSet('admin')).toBe(true);
    expect(await passwordSet('blog')).toBe(false);
  });
});
