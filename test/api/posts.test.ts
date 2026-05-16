import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GET as listGet, POST as listPost } from '../../src/pages/api/posts/index';
import {
  GET as itemGet,
  PUT as itemPut,
  DELETE as itemDelete,
} from '../../src/pages/api/posts/[id]';

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'scar-posts-'));
  process.env.SCAR_POSTS_DIR = tempDir;
});

afterEach(async () => {
  delete process.env.SCAR_POSTS_DIR;
  await rm(tempDir, { recursive: true, force: true });
});

const sample = {
  frontmatter: {
    title: 'Sample Post',
    date: '2026-05-16',
    description: 'desc',
    author: 'me',
    tags: ['x'],
    draft: false,
  },
  body: '# hi',
};

function makeReq(method: string, body?: unknown): Request {
  return new Request('http://localhost/api/posts', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('GET /api/posts', () => {
  it('returns [] when directory is empty', async () => {
    const res = await listGet({} as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([]);
  });

  it('lists posts in date-descending order', async () => {
    await writeFile(join(tempDir, 'a.md'), '---\ntitle: A\ndate: 2026-01-01\n---\n', 'utf-8');
    await writeFile(join(tempDir, 'b.md'), '---\ntitle: B\ndate: 2026-05-01\n---\n', 'utf-8');
    const res = await listGet({} as never);
    const json = await res.json();
    expect(json[0].id).toBe('b');
    expect(json[1].id).toBe('a');
  });
});

describe('POST /api/posts', () => {
  it('creates a new post and returns its slug', async () => {
    const res = await listPost({ request: makeReq('POST', sample) } as never);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe('sample-post');
    const files = await readdir(tempDir);
    expect(files).toContain('sample-post.md');
  });

  it('auto-suffixes when slug collides', async () => {
    await listPost({ request: makeReq('POST', sample) } as never);
    const r2 = await listPost({ request: makeReq('POST', sample) } as never);
    const j2 = await r2.json();
    expect(j2.id).toBe('sample-post-1');
  });

  it('rejects invalid schema with 400', async () => {
    const res = await listPost({
      request: makeReq('POST', { frontmatter: { title: 't' /* no date */ } }),
    } as never);
    expect(res.status).toBe(400);
  });

  it('rejects malformed JSON with 400', async () => {
    const req = new Request('http://localhost/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    });
    const res = await listPost({ request: req } as never);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/posts/[id]', () => {
  it('returns 404 for non-existent id', async () => {
    const res = await itemGet({ params: { id: 'missing' } } as never);
    expect(res.status).toBe(404);
  });

  it('returns parsed frontmatter + body', async () => {
    await writeFile(
      join(tempDir, 'hi.md'),
      '---\ntitle: Hi\ndate: 2026-05-16\ndescription: ""\nauthor: ""\ntags: []\ndraft: false\n---\nbody text',
      'utf-8',
    );
    const res = await itemGet({ params: { id: 'hi' } } as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.frontmatter.title).toBe('Hi');
    expect(json.body).toBe('body text');
  });
});

describe('PUT /api/posts/[id]', () => {
  it('returns 404 when the post does not exist (no ghost-file creation)', async () => {
    const res = await itemPut({
      params: { id: 'never-existed' },
      request: makeReq('PUT', sample),
    } as never);
    expect(res.status).toBe(404);
    const files = await readdir(tempDir);
    expect(files).not.toContain('never-existed.md');
  });

  it('updates an existing post', async () => {
    await writeFile(join(tempDir, 'foo.md'), '---\ntitle: old\ndate: 2026-01-01\n---\n', 'utf-8');
    const res = await itemPut({
      params: { id: 'foo' },
      request: makeReq('PUT', {
        frontmatter: { title: 'new', date: '2026-05-16' },
        body: 'new body',
      }),
    } as never);
    expect(res.status).toBe(200);
    const raw = await readFile(join(tempDir, 'foo.md'), 'utf-8');
    expect(raw).toContain('title: "new"');
    expect(raw).toContain('new body');
  });

  it('rejects invalid schema with 400', async () => {
    await writeFile(join(tempDir, 'foo.md'), '---\ntitle: t\ndate: 2026-01-01\n---\n', 'utf-8');
    const res = await itemPut({
      params: { id: 'foo' },
      request: makeReq('PUT', { frontmatter: { title: 't' } }),
    } as never);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/posts/[id]', () => {
  it('deletes the file', async () => {
    await writeFile(join(tempDir, 'gone.md'), '---\ntitle: x\ndate: 2026-01-01\n---\n', 'utf-8');
    const res = await itemDelete({ params: { id: 'gone' } } as never);
    expect(res.status).toBe(200);
    const files = await readdir(tempDir);
    expect(files).not.toContain('gone.md');
  });

  it('returns 404 for missing file', async () => {
    const res = await itemDelete({ params: { id: 'nope' } } as never);
    expect(res.status).toBe(404);
  });

  it('sanitizes the id (path traversal)', async () => {
    // safeId strips /, ., etc. so '../foo' becomes 'foo' — that file also doesn't exist
    const res = await itemDelete({ params: { id: '../../etc/passwd' } } as never);
    expect(res.status).toBe(404);
  });
});
