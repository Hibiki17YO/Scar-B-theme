# 01 · Astro 选型与前后端分离评估

> 日期：2026-05-14
> 范围：架构层面的方向判断
> 输出：决定继续用 Astro，并列出后续硬伤

## 一、Astro 在这个项目里真正在用的特性

| 特性 | 使用情况 |
|---|---|
| SSR | 首页每次请求时读取 `user.config.json` + 统计文章字数 |
| API Routes | `/api/config`、`/api/posts/*` — 承担了全部后端逻辑 |
| Content Collections | 博客文章的 Zod schema 校验、slug 管理、MDX 支持 |
| `@astrojs/node` adapter | standalone 模式，产出可直接 `node dist/server/entry.mjs` |
| MDX | 文章可嵌入组件 |

## 二、前后端分离的现状

```
浏览器 JS（客户端）
  ├── SHA-256 密码哈希              ← 认证全在前端
  ├── sessionStorage 鉴权状态
  ├── fetch /api/config (PUT)       ← 任何人都可以调
  ├── fetch /api/posts/* (CRUD)     ← 任何人都可以调
  └── Terminal 交互逻辑（660+ 行）

Astro SSR（服务端）
  ├── 首页：读文件 + 渲染 HTML
  ├── API Routes：读写 src/config/user.config.json
  └── API Routes：读写 src/content/posts/*.md
```

### 核心问题：API 层零认证

所有写接口都是公开 HTTP，浏览器层的 sessionStorage 判断只是 UI 表面。任何人知道接口地址就能：

- 修改网站所有配置（包括密码 hash）
- 增删改全部文章

## 三、加固方案的选择

不换栈。Astro 内部已经有一切需要的东西：

1. `src/middleware.ts` — 请求到达 API route 前拦截，检查 `X-Admin-Token`
2. API route 加 Zod 校验
3. 首页 config 缓存（避免每请求读文件）
4. 修复 `blog-admin/[id].astro:147` 的 title/author bug

## 四、是否换技术栈？

不需要。理由：

- 个人博客不是 SaaS，不需要 Postgres + 微服务
- Content Collections 是同类工具里最好用的
- SSR + Node adapter 已经支撑得起认证中间件、文件操作
- 换 Express/Hono 只是把问题搬家，照样要手写认证

## 五、优先级

| 优先级 | 改动 | 收益 |
|---|---|---|
| P0 | API 写操作服务端认证 | 堵住最大安全漏洞 |
| P1 | 修 blog-admin title/author bug | 已知功能 bug |
| P2 | API 输入 Zod 校验 | 防脏数据 |
| P3 | 首页 config 内存缓存 | 性能 |
| P4 | bcrypt 替换 SHA-256 | 密码硬度 |
