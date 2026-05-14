# Scar-B

A terminal-style personal blog theme built with [Astro 6](https://astro.build/) and Tailwind CSS v4.

[中文说明](#中文说明)

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
- Responsive terminal window, monospace font throughout

## Stack

| Layer | Technology |
|---|---|
| Framework | Astro 6 (server mode) |
| Styling | Tailwind CSS v4 |
| Adapter | `@astrojs/node` (standalone) |
| Content | Astro Content Collections |

## Quick Start

```bash
git clone https://github.com/Hibiki17YO/Scar-B.git
cd Scar-B
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

| Field | Description |
|---|---|
| `username` / `hostname` | Shown in the terminal prompt |
| `bannerArt` | ASCII art displayed on load |
| `whoami` | Author info shown by the `whoami` command |
| `adminCommand` / `adminPassHash` | Admin panel access (hash only, never plaintext) |
| `blogCommand` / `blogPassHash` | Blog editor access |
| `showSiteInfo` / `siteInfoTemplate` | Info block below the banner |
| `icpNumber` | ICP filing number, links to beian.miit.gov.cn |
| `copyrightText` | Centered text in the terminal title bar |

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
pm2 start dist/server/entry.mjs --name scar-b
```

> **Note**: `src/config/user.config.json` must be writable at runtime. This theme is designed for VPS or container deployment — not for serverless platforms (Vercel, Netlify, etc.) where the filesystem is read-only.

## License

MIT

---

## 中文说明

**Scar-B** 是一个基于 [Astro 6](https://astro.build/) 和 Tailwind CSS v4 构建的终端风格个人博客主题。

### 特性

- 终端交互界面，支持命令输入、历史记录、Tab 自动补全
- 内置指令：`whoami`、`blog`、`projects`、`name`、`clear`、`help`
- 通过浏览器管理面板（`sudo admin`）完整配置，无需手动编辑文件
- 博客文章编辑器，支持 Markdown（`sudo blog`）
- 配置持久化到服务端文件，重新部署后不丢失
- ASCII Art 横幅、点阵图、站点信息块（支持 `{uptime}`、`{posts}`、`{words}`、`{last_update}` 变量）
- 备案号展示、版权文字、"Powered by" 角标
- 管理面板与博客面板各自独立密码保护（SHA-256 哈希，不存明文）
- 可从管理面板重命名或禁用任意内置指令
- 响应式终端窗口，全站等宽字体

### 快速开始

```bash
git clone https://github.com/Hibiki17YO/Scar-B.git
cd Scar-B
npm install
npm run dev
```

打开 `http://localhost:4321`，在终端输入 `help` 查看可用指令。

### 配置

默认配置位于 `src/config/terminal.config.ts` 的 `defaultConfig`。  
运行时覆盖存储在 `src/config/user.config.json`（由管理面板写入，优先级更高，不应提交到 git）。

启动开发服务器后，在终端输入 `sudo admin` 进入管理面板。  
**默认管理密码为空**，部署前请在管理面板中设置密码。

### 主要配置项

| 字段 | 说明 |
|---|---|
| `username` / `hostname` | 终端提示符显示内容 |
| `bannerArt` | 加载时显示的 ASCII Art |
| `whoami` | `whoami` 指令输出的作者信息 |
| `adminCommand` / `adminPassHash` | 管理面板访问控制（仅存哈希） |
| `blogCommand` / `blogPassHash` | 博客编辑器访问控制 |
| `showSiteInfo` / `siteInfoTemplate` | Banner 下方信息块 |
| `icpNumber` | ICP 备案号，点击跳转 beian.miit.gov.cn |
| `copyrightText` | 标题栏居中版权文字 |

### 部署

```bash
npm run build
node dist/server/entry.mjs
```

或使用 PM2：

```bash
pm2 start dist/server/entry.mjs --name scar-b
```

> **注意**：`src/config/user.config.json` 在运行时需要可写权限。本主题适合 VPS 或容器部署，不适合 Vercel/Netlify 等文件系统只读的无服务器平台。

### 许可证

MIT
