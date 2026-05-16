# Scar-B-theme

A terminal-style personal blog theme built with [Astro 6](https://astro.build/) and Tailwind CSS v4.

The name comes from two works I love: *Girls' Frontline* (Scar-L & Scar-H) and *Gunbuster*. The red accent is partly inspired by Vanguard Sound's album *Scarlet* and partly by the visual style of Sukeban Games' official website. No deeper meaning — just things I like.

[中文说明](README.zh.md)

---

## Preview

> ![1778825719739](image/README.zh/1778825719739.gif)
>
> ![1778825766979](image/README.zh/1778825766979.png)
>
> #### [My Blog](hibiki17.icu)

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

| Layer     | Technology                     |
| --------- | ------------------------------ |
| Framework | Astro 6 (server mode)          |
| Styling   | Tailwind CSS v4                |
| Adapter   | `@astrojs/node` (standalone) |
| Content   | Astro Content Collections      |

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

| Field                                   | Description                                     |
| --------------------------------------- | ----------------------------------------------- |
| `username` / `hostname`             | Shown in the terminal prompt                    |
| `bannerArt`                           | ASCII art displayed on load                     |
| `whoami`                              | Author info shown by the `whoami` command     |
| `adminCommand`                        | Trigger word for the admin panel (e.g. `sudo admin`) |
| `blogCommand`                         | Trigger word for the blog editor (e.g. `sudo blog`) |
| `showSiteInfo` / `siteInfoTemplate` | Info block below the banner                     |
| `icpNumber`                           | ICP filing number, links to beian.miit.gov.cn   |
| `copyrightText`                       | Centered text in the terminal title bar         |

> Passwords are written **only** through the admin panel's password fields (sent as `newAdminPass` / `newBlogPass` over HTTPS, hashed server-side). The stored hashes (`adminPassHash` / `blogPassHash`) are an internal detail — never edit them directly, and they are never exposed via the public `GET /api/config` response.

## Authentication & API

All write endpoints (`PUT /api/config`, `POST/PUT/DELETE /api/posts/*`) require a server-side token check via `src/middleware.ts`.

| Endpoint                  | Auth                              |
| ------------------------- | --------------------------------- |
| `GET /api/config`       | Public (hashes stripped)          |
| `PUT /api/config`       | `X-Admin-Token` header (= SHA-256 of admin password) |
| `POST /api/auth`        | Public — body `{ kind, hash }`, returns 200 / 401 / 429 |
| `POST/PUT/DELETE /api/posts/*` | `X-Blog-Token` or `X-Admin-Token` |

Login flow: client SHA-256s the password → POSTs to `/api/auth` for validation → on success, stores the hash in `sessionStorage` as the bearer token.

`/api/auth` is rate-limited to 10 failures per IP per 15 minutes (returns 429).

If no admin password has been set yet, `/api/config` writes are open — set a password from the admin panel before exposing the server publicly. **Do not deploy with an empty password.**

`PUT /api/config` accepts a `{ reset: true }` sentinel to wipe non-password fields back to defaults; an empty body `{}` is rejected with 400 to prevent accidental data loss.

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
        ├── auth.ts            # POST: verify password hash, issue session token
        ├── config.ts          # GET/PUT site config (PUT requires X-Admin-Token)
        └── posts/             # CRUD blog posts (writes require X-Blog-Token)
```

## Deployment

Build and run with the Node adapter:

```bash
npm run build
node dist/server/entry.mjs
```

Keep the process alive with PM2:

```bash
pm2 start dist/server/entry.mjs --name scar-b-theme
pm2 save
pm2 startup    # generate the systemd unit, then run the command it prints
```

Or with a systemd unit directly — see `docs/deployment.md` (TODO).

### Environment variables

| Var | Default | Purpose |
|---|---|---|
| `SCAR_CONFIG_PATH` | `src/config/user.config.json` | Writable site config |
| `SCAR_POSTS_DIR` | `src/content/posts` | Markdown post directory |
| `SCAR_RATE_LIMIT_MAX_FAILS` | `10` | Auth attempts before throttle |
| `SCAR_RATE_LIMIT_WINDOW_MS` | `900000` | Throttle window (ms) |

See `.env.example`.

> **Note**: `src/config/user.config.json` must be writable at runtime. This theme is designed for VPS deployment — not for serverless platforms (Vercel, Netlify, etc.) where the filesystem is read-only.

> **Build-time content collection caveat**: Astro Content Collections snapshot `src/content/posts` at `npm run build`. New posts created via the editor after the build *do* persist to disk, but only show up on `/blog/<slug>` after a rebuild. The Terminal `blog` command reads via the runtime API and is unaffected.

## License

MIT
