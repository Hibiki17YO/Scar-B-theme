# 08 · v1 功能阶段

> 日期：2026-05-16
> 范围：RSS / 标签页 / 分页 / 主题系统 / 搜索 / SSR 博客路由
> 状态：已完成，commit `fa3733a`

## 执行摘要

| # | 内容 | 状态 |
|---|---|---|
| F1 | SSR 化博客路由 + `posts-runtime` | ✅ |
| F2 | sha256 去重 | ✅ |
| F3 | RSS 订阅源 + 终端 `rss` 命令 | ✅ |
| F4 | 标签归档页 `/tag` + `/tag/[name]` | ✅ |
| F5 | 博客分页 `/blog/page/[n]` | ✅ |
| F6 | 暗/亮/Amaris 三主题 + 过渡动画 | ✅ |
| F7 | 终端 `search` 命令 | ✅ |
| F8 | admin/blog-admin 完整主题覆盖 | ✅ |
| F9 | README 清理 + CHANGELOG | ✅ |

---

## F1 · SSR 化博客路由

**问题**：`getCollection('posts')` 是 build-time API，admin 编辑器写入的 `.md` 文件必须重新 build 才对外可见。  
**方案**：新建 `src/lib/posts-runtime.ts`，运行时 `readdir` 文章目录，复用已有的 `parseMd` / `PostSchema`，结果按目录 fingerprint 缓存。

改动：
- `src/pages/blog/index.astro` — 删除 `prerender = true`，`getCollection` → `getPostsRuntime`
- `src/pages/blog/[...slug].astro` — 同上，动态读取单篇文章，用 `marked` 渲染 body
- `src/pages/index.astro` — 首页 post 统计数据源统一到 `getPostsRuntime`
- `src/lib/runtime-cache.ts` — `getPostStats` 改为接收 `RuntimePost[]` 而非 collection entry

保留了 `src/content.config.ts` 不动，避免 Astro build 报错（虽然 SSR 页面已不走它）。

**踩坑**：`getCollection` 即使在 SSR 页面调用，返回的仍是 build-time 快照。必须彻底绕过 Content Collections，不能只删 prerender。

---

## F2 · sha256 去重

四个文件（admin.astro、blog-admin 两个页面、Terminal.astro）各自内联了一份 43 行的 SHA-256 实现（含 pure-JS 回退）。

抽取到 `public/js/sha256.js`，挂载 `window.sha256hex`。各页面改用 `<script is:inline src="/js/sha256.js">` 引入。Terminal.astro 中声明了一个本地类型包装函数，调用 `window.sha256hex`，保持调用处类型正确。

---

## F3 · RSS

新建 `src/pages/rss.xml.ts`（SSR 端点），用 `@astrojs/rss` 组合 feed，过滤草稿，读取 `getRuntimeConfig()` 作为 feed 标题和描述。

`BaseLayout.astro` 已有 `<link rel="alternate" href="/rss.xml">`，不需要改动。

终端新增内置命令 `rss`，输出 `/rss.xml` 可点击链接。同时更新 `defaultConfig.builtinCommands` 和 `help` 输出列表。

---

## F4 · 标签归档页

新建：
- `src/pages/tag/index.astro` — 按使用频率排序的标签总览
- `src/pages/tag/[name].astro` — 单标签过滤列表，URL 参数做 `decodeURIComponent` 处理

两个页面都走 `getPostsRuntime`，完全 SSR，新增标签不需要 build。

博客列表（`blog/index.astro`、`blog/page/[n].astro`）和文章页（`PostLayout.astro`）的标签 `<span>` 全部替换为 `<a href="/tag/...">` 链接。

---

## F5 · 博客分页

`TerminalConfig` 新增 `postsPerPage: number`（默认 10）。`/api/config` schema 加对应校验，admin 面板加输入框。

- `src/pages/blog/index.astro` — 取第 1 页切片，总页数 > 1 时显示 "next →" 导航
- `src/pages/blog/page/[n].astro` — 新建，处理第 n 页；n=1 重定向到 `/blog`；越界返回 404

分页导航 prev/next 链接直接拼字符串，无依赖。

---

## F6 · 主题系统

### 三主题配色

| 主题 | 特征 | `data-theme` 值 |
|---|---|---|
| Dark | 原始终端暗红 | （无，默认） |
| Eliana | 大地色系 / 工业机能 / 战术橙 | `light` |
| Amaris | 深夜潜入 / 冷蓝银 | `amaris` |

所有 token 集中在 `src/styles/global.css`：`@theme`（暗色默认）、`[data-theme="light"]`（Eliana）、`[data-theme="amaris"]`（Amaris）。新增语义 token：`--color-input-bg`、`--color-button-text`、`--color-row-border`、`--color-row-hover`、`--color-panel-shadow`。

### 防闪脚本

`BaseLayout.astro` 在 `<head>` 内最早执行：

```js
var theme = localStorage.getItem('theme');
if (!theme && matchMedia('(prefers-color-scheme: light)').matches) theme = 'light';
if (theme === 'light' || theme === 'amaris') document.documentElement.dataset.theme = theme;
```

在任何 CSS 渲染前就把 `data-theme` 写好，首屏不闪。

### 过渡动画

`global.css` 对 `html, body, a, button, input, textarea, select, pre, code, table, th, td, .prose *, #terminal-window, #title-bar` 等元素加 240ms ease 过渡，只涵盖颜色类属性（`background-color`, `color`, `border-color`, `box-shadow`, `caret-color`）。

**不** transition `opacity` / `transform`：终端输出行的进场动画就用这两个属性，全局 transition 会让每条输出都慢半拍。

`prefers-reduced-motion: reduce` 分支禁用所有主题过渡。

### 切换机制

标题栏改为纯文字 span，无边框无背景，PC 端 `position: absolute` 居中，移动端 inline 靠右。循环顺序 Dark → Eliana → Amaris → Dark，通过 `localStorage.setItem('theme', next)` 持久化。

### 踩坑：admin 页面暗色残留

三个后台页面（admin.astro、blog-admin/index.astro、blog-admin/[id].astro）的 title bar、auth 弹窗、input/textarea/select 等元素全部是 inline style 硬编码 `#1a1a1a` / `#0d0d0d`，不走 CSS 变量。逐一替换为 `var(--color-titlebar)` / `var(--color-input-bg)` 等新 token。

---

## F7 · 终端搜索命令

完全复用 `handleLogin` 的"inline 输入"模式：把 `inputEl` 移入输出区、隐藏底部输入行、等待 Enter。

不同点：
- 不做 hash / auth，直接拿文字
- 查询完后立刻还原输入行（auth 流程是跳页，搜索要留在终端）
- 输出结果后 `inputEl.focus()`，可继续输入

匹配范围：post 标题 + 描述 + 标签，全部 `toLowerCase()` 模糊匹配。输出格式与 `blog` 命令一致：日期 / 可点击标题 / 简述 / 标签。

`Tab` 补全候选词列表里手动加了 `'search'`（因为 COMMANDS 字典里没有它，它在 executeCommand 里直接处理，不走 COMMANDS 注册路径）。

---

## F8 · admin 页面完整主题覆盖

除 inline style 替换外，`admin.astro` 原来有 `export const prerender = true` —— admin 是完全动态的 SSR 页面（需要读运行时配置），这个 export 是历史遗留，此次一并删除。

---

## 数字快照

```
build:   ~2.0s（server）
files changed: 24（17 改动 + 7 新增）
insertions: +1075
deletions:  -316
commit:  fa3733a
```

---

## 关键决策

**为什么不用 Pagefind 做搜索**：Pagefind 需要在 build 产物上跑索引，admin 写新文章后索引滞后，要么触发 rebuild 要么切 runtime 索引（FlexSearch）。客户端内存过滤对个人博客体量（<500 篇）完全够用，零依赖，且随 SSR 实时反映新文章。

**为什么保留 Content Collections schema**：删掉 `src/content.config.ts` 会导致 `astro build` 报错（Astro 检测到 content 目录但没有 config）。保留文件不影响 SSR 路由，成本低于风险。

---

## 下一步

v1 路线图剩余：
- 草稿 / 定时发布（publishAt）
- 图片 / 文件上传（编辑器拖拽）
- WYSIWYG / 分屏预览
- giscus 评论
- 可视化主题定制（admin 调色板）
