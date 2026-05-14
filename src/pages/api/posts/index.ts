import type { APIRoute } from 'astro';
import { readdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { parseMd, serializeMd, slugify } from './_parser';

const POSTS_DIR = join(process.cwd(), 'src', 'content', 'posts');

export const GET: APIRoute = async () => {
  try {
    const files = await readdir(POSTS_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    const posts = await Promise.all(
      mdFiles.map(async file => {
        const raw = await readFile(join(POSTS_DIR, file), 'utf-8');
        const id = file.replace(/\.(md|mdx)$/, '');
        const { frontmatter } = parseMd(id, raw);
        return { id, ...frontmatter };
      })
    );
    posts.sort((a, b) => b.date.localeCompare(a.date));
    return Response.json(posts);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { frontmatter, body: mdBody } = body;

    const baseSlug = slugify(frontmatter.title || 'untitled');
    const files = await readdir(POSTS_DIR);
    const existing = new Set(files.map(f => f.replace(/\.(md|mdx)$/, '')));

    let slug = baseSlug;
    let counter = 1;
    while (existing.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const dest = join(POSTS_DIR, `${slug}.md`);
    const tmp  = dest + '.' + randomBytes(4).toString('hex') + '.tmp';
    const content = serializeMd(frontmatter, mdBody ?? '');
    await writeFile(tmp, content, 'utf-8');
    await rename(tmp, dest);

    return Response.json({ id: slug }, { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
