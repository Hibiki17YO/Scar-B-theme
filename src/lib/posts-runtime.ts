import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { getPostsDir } from './server-auth';
import { parseMd, type RawPost } from '../pages/api/posts/_parser';

// Replaces Astro's build-time Content Collections with a runtime reader.
// Lets admin-edited posts appear immediately on /blog/* without rebuilding.

export type RuntimePost = RawPost;

interface ListCache {
  fingerprint: string;
  value: RuntimePost[];
}
let _listCache: ListCache | null = null;

async function postsFingerprint(dir: string): Promise<string> {
  try {
    const files = (await readdir(dir)).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    files.sort();
    const parts: string[] = [];
    for (const f of files) {
      const s = await stat(join(dir, f));
      parts.push(`${f}:${s.size}:${s.mtimeMs}`);
    }
    return parts.join('|');
  } catch {
    return '';
  }
}

function safeId(id: string): string {
  return id.replace(/[^a-z0-9\-_]/gi, '');
}

export async function getPostsRuntime(
  filter?: (post: RuntimePost) => boolean,
): Promise<RuntimePost[]> {
  const dir = getPostsDir();
  const fingerprint = await postsFingerprint(dir);

  let posts: RuntimePost[];
  if (!import.meta.env.DEV && _listCache && _listCache.fingerprint === fingerprint) {
    posts = _listCache.value;
  } else {
    let files: string[];
    try {
      files = (await readdir(dir)).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    } catch {
      return [];
    }
    posts = await Promise.all(
      files.map(async file => {
        const raw = await readFile(join(dir, file), 'utf-8');
        const id = file.replace(/\.(md|mdx)$/, '');
        return parseMd(id, raw);
      }),
    );
    posts.sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
    _listCache = { fingerprint, value: posts };
  }

  return filter ? posts.filter(filter) : posts;
}

export async function getPostRuntime(id: string): Promise<RuntimePost | null> {
  const safe = safeId(id);
  if (!safe) return null;
  const dir = getPostsDir();
  for (const ext of ['md', 'mdx']) {
    try {
      const raw = await readFile(join(dir, `${safe}.${ext}`), 'utf-8');
      return parseMd(safe, raw);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
  }
  return null;
}
