import type { APIRoute } from 'astro';
import { readFile, writeFile, unlink, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { parseMd, serializeMd } from './_parser';

const POSTS_DIR = join(process.cwd(), 'src', 'content', 'posts');

function safeId(id: string): string {
  return id.replace(/[^a-z0-9\-_]/gi, '');
}

function filePath(id: string): string {
  return join(POSTS_DIR, `${safeId(id)}.md`);
}

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = safeId(params.id ?? '');
    const raw = await readFile(filePath(id), 'utf-8');
    return Response.json(parseMd(id, raw));
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return Response.json({ error: 'not found' }, { status: 404 });
    return Response.json({ error: String(e) }, { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = safeId(params.id ?? '');
    const body = await request.json();
    const content = serializeMd(body.frontmatter, body.body ?? '');
    // Atomic write: write to temp then rename so the file watcher never sees a partial file
    const tmp = filePath(id) + '.' + randomBytes(4).toString('hex') + '.tmp';
    await writeFile(tmp, content, 'utf-8');
    await rename(tmp, filePath(id));
    return Response.json({ ok: true });
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return Response.json({ error: 'not found' }, { status: 404 });
    return Response.json({ error: String(e) }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = safeId(params.id ?? '');
    await unlink(filePath(id));
    return Response.json({ ok: true });
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return Response.json({ error: 'not found' }, { status: 404 });
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
