import { z } from 'astro:schema';

const FrontmatterSchema = z.object({
  title: z.string().max(300),
  date: z.string().max(50),
  description: z.string().max(1000).optional().default(''),
  author: z.string().max(100).optional().default(''),
  tags: z.array(z.string().max(50)).max(50).optional().default([]),
  draft: z.boolean().optional().default(false),
  readingTime: z.number().int().nonnegative().max(10000).optional(),
});

export const PostSchema = z.object({
  frontmatter: FrontmatterSchema,
  body: z.string().max(500_000).optional().default(''),
}).strict();

export type ValidatedPost = z.infer<typeof PostSchema>;
