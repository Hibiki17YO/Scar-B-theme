# 03 · 第一轮改造后的二次审计

> 日期：2026-05-16
> 范围：审视 02 改造留下的新问题
> 输出：14 项缺陷清单 + 优先级

## 发现的缺陷

### 🔴 Critical

| # | 标题 | 位置 |
|---|---|---|
| 1 | First-run bootstrap deadlock — 无法初始化第一个密码 | `middleware.ts:16-22`、`server-auth.ts:38` |
| 2 | Stored XSS via username/hostname | `Terminal.astro:186-188` |

#1 详解：客户端 `checkAuth` 看到 `hasAdminPass=false` → `showPanel()` 不发 token → save 请求 `X-Admin-Token: ""` → middleware 中 `verifyToken` 因 stored hash 空字符串返回 false → 401。**用户永远无法**通过 UI 写入第一个密码。

#2 详解：`neofetch-prompt` 用 `innerHTML` 直接拼接 `${config.username}@${config.hostname}`，已认证管理员把 username 设为 `<img src=x onerror=...>` 即可在每位访客浏览器执行 JS。

### 🟠 Important

| # | 标题 | 位置 |
|---|---|---|
| 3 | PUT /api/posts/[id] 静默创建幽灵文章 | `api/posts/[id].ts:30-48` |
| 4 | Markdown body 未做 HTML 净化 | `astro.config.mjs` |
| 5 | /api/auth 无速率限制 | `api/auth.ts` |
| 6 | Reset 按钮无确认 + 空 PUT 销毁配置 | `admin.astro:711-728`, `api/config.ts:91-107` |
| 7 | Token 即 hash，无过期 / 无轮换 | `lib/server-auth.ts` |

### 🟡 Nice-to-have

| # | 标题 |
|---|---|
| 8 | `defaultConfig.adminPassHash` / `blogPassHash` 类型残留 |
| 9 | sha256js 在三处文件复制粘贴 |
| 10 | SSR 性能 — 首页每次请求统计字数 |
| 11 | README 未更新认证流程 |
| 12 | atomic-write 4 字节后缀熵偏低 |
| 13 | siteInfoTemplate / icpNumber 转义不完整 |
| 14 | （审计中合并到 #13）|

## 决定

下一轮先做 1 + 2 + 3 + 6 + 4 + 5：覆盖 1 Critical bug、1 Critical 安全、3 Important，6 个文件可以一次性收尾"安全加固阶段"。
