---
title: "Hello, World"
date: 2026-05-14 12:29
description: "第一篇博客文章——关于这个终端风格博客的搭建过程和设计思路。"
author: "Hibiki21"
tags: ["astro", "blog", "terminal"]
draft: false
readingTime: 3
---
# Hello, World

欢迎来到 hibiki 的博客。这是用 **Astro 6** 构建的第一篇文章。

## 为什么用终端风格

终端界面有一种独特的美学：纯粹、高效、无干扰。没有多余的视觉噪音，只有内容本身。

> "The best interface is no interface."
> — Golden Krishna

## 技术栈

这个博客使用了：

- **Astro 6.x** — 静态站点生成，零 JS 默认
- **Tailwind CSS v4** — CSS-first 配置，`@tailwindcss/vite` 插件
- **MDX** — 在 Markdown 中使用 Astro 组件
- **Shiki** — 代码语法高亮（Astro 内置，`github-dark` 主题）

## 代码示例

```typescript
// Content Collection schema 定义
import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).optional().default([]),
  }),
});

export const collections = { posts };
```

## 终端命令

在首页试试这些命令：

| 命令 | 说明 |
|------|------|
| `help` | 显示所有可用命令 |
| `whoami` | 关于作者 |
| `blog` | 列出所有文章 |
| `clear` | 清空终端 |

---

终端已就绪，欢迎 `help`。
