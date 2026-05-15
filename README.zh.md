# Scar-B-theme

基于 [Astro 6](https://astro.build/) 和 Tailwind CSS v4 构建的终端风格个人博客主题。

这个名字来自于我爱的两部作品，少女前线（Scar-L & Scar-H）和飞跃巅峰（GunBuster），选择红色为基色调的一部分原因来自 Vanguard Sound 的专辑 Scarlet，另一部分是想要模仿 Sukeban Games 官方网页的视觉风格。没有什么特殊含义，仅仅是我喜欢。

[English](README.md)

---

## 预览

> [动态演示 GIF 待补充]

---

## 特性

- 终端交互界面，支持命令输入、历史记录、Tab 自动补全
- 内置指令：`whoami`、`blog`、`projects`、`name`、`clear`、`help`
- 通过浏览器管理面板（`sudo admin`）完整配置，无需手动编辑文件
- 博客文章编辑器，支持 Markdown（`sudo blog`）
- 配置持久化到服务端文件，重新部署后不丢失
- ASCII Art 横幅、点阵图、站点信息块（支持 `{uptime}`、`{posts}`、`{words}`、`{last_update}` 变量）
- 备案号展示、版权文字、"Powered by" 角标
- 管理面板与博客面板各自独立密码保护（SHA-256 哈希，不存明文）
- 可从管理面板重命名或禁用任意内置指令
- 移动端响应式终端窗口，全站等宽字体

## 技术栈

| 层级     | 技术                         |
| -------- | ---------------------------- |
| 框架     | Astro 6（服务端模式）        |
| 样式     | Tailwind CSS v4              |
| 适配器   | `@astrojs/node`（standalone）|
| 内容管理 | Astro Content Collections    |

## 快速开始

```bash
git clone https://github.com/Hibiki17YO/Scar-B-theme.git
cd Scar-B-theme
npm install
npm run dev
```

打开 `http://localhost:4321`，在终端输入 `help` 查看可用指令。

## 配置

默认配置位于 `src/config/terminal.config.ts` 的 `defaultConfig`。
运行时覆盖存储在 `src/config/user.config.json`，由管理面板写入，优先级更高，不应提交到 git。

启动开发服务器后，在终端输入 `sudo admin` 进入管理面板。
**默认管理密码为空**，部署前请在管理面板中设置密码。

### 主要配置项

| 字段                                  | 说明                          |
| ------------------------------------- | ----------------------------- |
| `username` / `hostname`               | 终端提示符显示内容            |
| `bannerArt`                           | 加载时显示的 ASCII Art        |
| `whoami`                              | `whoami` 指令输出的作者信息   |
| `adminCommand` / `adminPassHash`      | 管理面板访问控制（仅存哈希）  |
| `blogCommand` / `blogPassHash`        | 博客编辑器访问控制            |
| `showSiteInfo` / `siteInfoTemplate`   | Banner 下方信息块             |
| `icpNumber`                           | ICP 备案号，点击跳转工信部    |
| `copyrightText`                       | 标题栏版权文字                |

## 项目结构

```
src/
├── components/
│   └── Terminal.astro         # 主终端 UI
├── config/
│   ├── terminal.config.ts     # 默认配置（已提交）
│   └── user.config.json       # 运行时覆盖（勿提交）
├── content/
│   └── posts/                 # Markdown 博客文章
├── layouts/
│   ├── BaseLayout.astro
│   └── PostLayout.astro
└── pages/
    ├── index.astro            # 终端首页（动态 SSR）
    ├── admin.astro            # 配置管理面板
    ├── blog/                  # 博客列表与文章页
    ├── blog-admin/            # 文章编辑器
    └── api/
        ├── config.ts          # GET/PUT 配置 API
        └── posts/             # 文章 CRUD API
```

## 部署

```bash
npm run build
node dist/server/entry.mjs
```

或使用 PM2：

```bash
pm2 start dist/server/entry.mjs --name scar-b-theme
```

> **注意**：`src/config/user.config.json` 在运行时需要可写权限。本主题适合 VPS 或容器部署，不适合 Vercel/Netlify 等文件系统只读的无服务器平台。

## 许可证

MIT
