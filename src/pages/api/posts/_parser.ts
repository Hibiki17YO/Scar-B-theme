export interface PostFrontmatter {
  title: string;
  date: string;
  description: string;
  author: string;
  tags: string[];
  draft: boolean;
  readingTime?: number;
}

export interface RawPost {
  id: string;
  frontmatter: PostFrontmatter;
  body: string;
}

const FM_FENCE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?([\s\S]*)$/;

function parseYamlValue(val: string): unknown {
  val = val.trim();
  if (val === 'true') return true;
  if (val === 'false') return false;
  const n = Number(val);
  if (!isNaN(n) && val !== '') return n;
  if (val.startsWith('[') && val.endsWith(']')) {
    return val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
  return val.replace(/^["']|["']$/g, '');
}

export function parseMd(id: string, raw: string): RawPost {
  const match = FM_FENCE.exec(raw.replace(/\r\n/g, '\n'));
  if (!match) {
    return { id, frontmatter: emptyFm(), body: raw };
  }
  const [, fmRaw, body] = match;
  const fm: Record<string, unknown> = {};
  for (const line of fmRaw.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (key) fm[key] = parseYamlValue(val);
  }
  return {
    id,
    frontmatter: {
      title: String(fm.title ?? ''),
      date: String(fm.date ?? new Date().toISOString().slice(0, 10)),
      description: String(fm.description ?? ''),
      author: String(fm.author ?? ''),
      tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
      draft: Boolean(fm.draft ?? false),
      readingTime: fm.readingTime != null ? Number(fm.readingTime) : undefined,
    },
    body: body.trimStart(),
  };
}

export function serializeMd(fm: PostFrontmatter, body: string): string {
  const tagsYaml = `[${fm.tags.map(t => `"${t}"`).join(', ')}]`;
  // Normalize date: "YYYY-MM-DD HH:MM" or "YYYY-MM-DDTHH:MM" → "YYYY-MM-DDTHH:MM:00"
  // Plain "YYYY-MM-DD" stays as-is (Astro coerces it to midnight UTC)
  // Normalise to "YYYY-MM-DD HH:MM" (space, no seconds)
  let dateVal = fm.date;
  if (fm.date.includes('T')) {
    dateVal = fm.date.slice(0, 16).replace('T', ' ');
  } else if (fm.date.length > 10 && fm.date.includes(' ')) {
    dateVal = fm.date.slice(0, 16); // trim seconds if present
  }
  const lines = [
    '---',
    `title: "${fm.title.replace(/"/g, '\\"')}"`,
    `date: ${dateVal}`,
    `description: "${fm.description.replace(/"/g, '\\"')}"`,
    `author: "${fm.author.replace(/"/g, '\\"')}"`,
    `tags: ${tagsYaml}`,
    `draft: ${fm.draft}`,
  ];
  if (fm.readingTime != null) lines.push(`readingTime: ${fm.readingTime}`);
  lines.push('---', '');
  return lines.join('\n') + body;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9一-鿿-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';
}

function emptyFm(): PostFrontmatter {
  return {
    title: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    author: '',
    tags: [],
    draft: false,
  };
}
