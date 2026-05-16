import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://yourdomain.com',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: false,
    },
    // Treat raw HTML inside .md posts as text, not executable markup.
    // Blocks stored XSS from blog post bodies (`<script>`, `onerror`, etc).
    // Does not affect .mdx files, which intentionally allow components.
    remarkRehype: {
      allowDangerousHtml: false,
    },
  },
});
