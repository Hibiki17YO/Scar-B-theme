# Scar-B-theme

A terminal-style personal blog theme built with [Astro 6](https://astro.build/) and Tailwind CSS v4.

The name comes from two works I love: *Girls' Frontline* (Scar-L & Scar-H) and *Gunbuster*. The red accent is partly inspired by Vanguard Sound's album *Scarlet* and partly by the visual style of Sukeban Games' official website. No deeper meaning — just things I like.

[中文说明](README.zh.md)

---

## Preview

> [动态演示 GIF 待补充 / Demo GIF coming soon]

---

## Features

- Terminal UI with command input, history, and Tab autocomplete
- Built-in commands: `whoami`, `blog`, `projects`, `name`, `clear`, `help`
- Fully configurable via a browser-based admin panel (`sudo admin`)
- Blog post editor with Markdown support (`sudo blog`)
- Server-side config persistence — changes survive redeployment
- ASCII art banner, dot pattern, site info block with computed variables (`{uptime}`, `{posts}`, `{words}`, `{last_update}`)
- ICP number display, copyright text, "Powered by" footer
- Password-protected admin and blog panels (SHA-256 hashed, no plaintext stored)
- Rename or disable any built-in command from the admin panel
- Mobile-responsive terminal window, monospace font throughout

## Stack

| Layer     | Technology                   |
| --------- | ---------------------------- |
| Framework | Astro 6 (server mode)        |
| Styling   | Tailwind CSS v4              |
| Adapter   | `@astrojs/node` (standalone) |
| Content   | Astro Content Collections    |

## Quick Start

```bash
git clone https://github.com/Hibiki17YO/Scar-B-theme.git
cd Scar-B-theme
npm install
npm run dev
```

Open `http://localhost:4321`. Type `help` in the terminal to see available commands.

## Configuration

Default config lives in `src/config/terminal.config.ts` (`defaultConfig`).
Runtime overrides are stored in `src/config/user.config.json` and take precedence — this file is written by the admin panel and should not be committed.

To configure via the UI, start the dev server and type `sudo admin` in the terminal.
**Default admin password is empty** — set one in the admin panel before deploying.

### Key fields

| Field                                 | Description                                     |
| ------------------------------------- | ----------------------------------------------- |
| `username` / `hostname`               | Shown in the terminal prompt                    |
| `bannerArt`                           | ASCII art displayed on load                     |
| `whoami`                              | Author info shown by the `whoami` command       |
| `adminCommand` / `adminPassHash`      | Admin panel access (hash only, never plaintext) |
| `blogCommand` / `blogPassHash`        | Blog editor access                              |
| `showSiteInfo` / `siteInfoTemplate`   | Info block below the banner                     |
| `icpNumber`                           | ICP filing number, links to beian.miit.gov.cn   |
| `copyrightText`                       | Centered text in the terminal title bar         |

## Project Structure

```
src/
├── components/
│   └── Terminal.astro         # Main terminal UI
├── config/
│   ├── terminal.config.ts     # Default config (committed)
│   └── user.config.json       # Runtime overrides (do not commit)
├── content/
│   └── posts/                 # Markdown blog posts
├── layouts/
│   ├── BaseLayout.astro
│   └── PostLayout.astro
└── pages/
    ├── index.astro            # Terminal homepage (dynamic SSR)
    ├── admin.astro            # Config admin panel
    ├── blog/                  # Blog list + post pages
    ├── blog-admin/            # Post editor
    └── api/
        ├── config.ts          # GET/PUT config API
        └── posts/             # CRUD API for blog posts
```

## Deployment

Build and run with the Node adapter:

```bash
npm run build
node dist/server/entry.mjs
```

Or with PM2:

```bash
pm2 start dist/server/entry.mjs --name scar-b-theme
```

> **Note**: `src/config/user.config.json` must be writable at runtime. This theme is designed for VPS or container deployment — not for serverless platforms (Vercel, Netlify, etc.) where the filesystem is read-only.

## License

MIT
