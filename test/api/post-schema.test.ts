import { describe, it, expect } from 'vitest';
import { PostSchema } from '../../src/pages/api/posts/_schema';

describe('PostSchema', () => {
  const valid = {
    frontmatter: {
      title: 'Test Post',
      date: '2026-05-16',
      description: 'desc',
      author: 'me',
      tags: ['x'],
      draft: false,
    },
    body: '# hello',
  };

  it('accepts a valid post', () => {
    const r = PostSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('requires frontmatter.title', () => {
    const r = PostSchema.safeParse({
      frontmatter: { date: '2026-05-16' },
      body: '',
    });
    expect(r.success).toBe(false);
  });

  it('requires frontmatter.date', () => {
    const r = PostSchema.safeParse({
      frontmatter: { title: 't' },
      body: '',
    });
    expect(r.success).toBe(false);
  });

  it('defaults description / author / tags / draft', () => {
    const r = PostSchema.safeParse({
      frontmatter: { title: 't', date: '2026-05-16' },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.frontmatter.description).toBe('');
      expect(r.data.frontmatter.author).toBe('');
      expect(r.data.frontmatter.tags).toEqual([]);
      expect(r.data.frontmatter.draft).toBe(false);
      expect(r.data.body).toBe('');
    }
  });

  it('rejects title longer than 300 chars', () => {
    const r = PostSchema.safeParse({
      frontmatter: { title: 'x'.repeat(301), date: '2026-05-16' },
    });
    expect(r.success).toBe(false);
  });

  it('rejects body larger than 500_000 chars', () => {
    const r = PostSchema.safeParse({
      ...valid,
      body: 'x'.repeat(500_001),
    });
    expect(r.success).toBe(false);
  });

  it('rejects more than 50 tags', () => {
    const r = PostSchema.safeParse({
      frontmatter: { title: 't', date: '2026-05-16', tags: Array(51).fill('x') },
    });
    expect(r.success).toBe(false);
  });

  it('rejects unknown top-level keys (strict mode)', () => {
    const r = PostSchema.safeParse({ ...valid, sneaky: 'field' });
    expect(r.success).toBe(false);
  });

  it('rejects negative readingTime', () => {
    const r = PostSchema.safeParse({
      frontmatter: { ...valid.frontmatter, readingTime: -5 },
      body: '',
    });
    expect(r.success).toBe(false);
  });

  it('accepts integer readingTime', () => {
    const r = PostSchema.safeParse({
      frontmatter: { ...valid.frontmatter, readingTime: 5 },
      body: '',
    });
    expect(r.success).toBe(true);
  });

  it('rejects non-integer readingTime', () => {
    const r = PostSchema.safeParse({
      frontmatter: { ...valid.frontmatter, readingTime: 5.5 },
      body: '',
    });
    expect(r.success).toBe(false);
  });
});
