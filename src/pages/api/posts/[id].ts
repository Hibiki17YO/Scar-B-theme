import type { APIRoute } from 'astro';
import { readFile, writeFile, unlink, rename, access } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { parseMd, serializeMd } from './_parser';
import { PostSchema } from './_schema';
import { getPostsDir } from '../../../lib/server-auth';

function safeId(id: string): string {
  return id.replace(/[^a-z0-9\-_]/gi, '');
}

function filePath(id: string): string {
  return join(getPostsDir(), `${safeId(id)}.md`);
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
    // PUT updates an existing post; refuse to silently create a new file
    try {
      await access(filePath(id));
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return Response.json({ error: 'not found' }, { status: 404 });
      }
      throw e;
    }
    const raw = await request.json().catch(() => null);
    const parsed = PostSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: 'invalid post', issues: parsed.error.issues }, { status: 400 });
    }
    const content = serializeMd(parsed.data.frontmatter, parsed.data.body ?? '');
    // Atomic write: write to temp then rename so the file watcher never sees a partial file
    const tmp = filePath(id) + '.' + randomBytes(8).toString('hex') + '.tmp';
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
