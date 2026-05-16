import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { getPostsRuntime } from '../lib/posts-runtime';
import { getRuntimeConfig } from '../lib/runtime-cache';

// SSR endpoint — reads posts and site config at request time, so newly
// published or scheduled posts appear without rebuild.

function parseDate(s: string): Date {
  // posts-runtime gives strings like "2026-05-16" or "2026-05-16 14:00"
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
  if (!isNaN(d.valueOf())) return d;
  return new Date(s);
}

export const GET: APIRoute = async (context) => {
  const [posts, { config }] = await Promise.all([
    getPostsRuntime(p => !p.frontmatter.draft),
    getRuntimeConfig(),
  ]);

  const site = context.site ?? new URL(context.url.origin);
  const title = config.siteTitle?.trim() || `${config.username}@${config.hostname}`;
  const description = (config.whoami?.bio ?? []).join(' ').trim()
    || 'A terminal-style personal blog.';

  return rss({
    title,
    description,
    site,
    items: posts.map(post => ({
      title: post.frontmatter.title,
      pubDate: parseDate(post.frontmatter.date),
      description: post.frontmatter.description,
      link: `/blog/${post.id}/`,
      categories: post.frontmatter.tags,
    })),
    customData: `<language>zh-cn</language>`,
  });
};
