# 04 · 第二轮安全改造

> 日期：2026-05-16
> 范围：处理 03 中识别的 #1 / #2 / #3 / #4 / #5 / #6
> 输出：6 项 critical + important 修复落地

## 改动清单

| # | 修复 | 文件 | 验证 |
|---|---|---|---|
| 1 | First-run deadlock | `middleware.ts`, `lib/server-auth.ts` | 空 hash → 写开放；写入第一个密码后立即锁住 |
| 2 | username/hostname XSS | `Terminal.astro:186-188,207,242-244,270` | `escapeHtml` 覆盖三处 innerHTML，并补全 `"` `'` |
| 3 | PUT 幽灵文章 | `api/posts/[id].ts` | 不存在 ID → 404 |
| 4 | Markdown raw HTML | `astro.config.mjs` | `<script>` 和 `onerror` 全部被 strip |
| 5 | /api/auth 限流 | `api/auth.ts` | 11 次失败后 → 429 |
| 6 | Reset 加 confirm + 空 PUT 拒收 | `admin.astro`, `api/config.ts` | `{}` → 400；`{reset:true}` → 200 |

## 关键实现

### #1 First-run deadlock

`server-auth.ts` 新增 `passwordSet(kind)`，middleware 在 stored hash 为空时直接 `next()`：

```ts
if (pathname === '/api/config') {
  if (!(await passwordSet('admin'))) return next();
  // ... token check
}
```

语义：**未配置密码 = 单机调试模式 = 写入开放**。一旦第一个密码被写入，立即转为鉴权模式。

### #4 Markdown 净化

最简方式：Astro 默认 `remarkRehype.allowDangerousHtml` 透过 raw HTML。改 false 即可，不引入新依赖。

```js
markdown: {
  remarkRehype: {
    allowDangerousHtml: false,
  },
},
```

测试用文章：

```md
<script>window.__xssProbe = true;</script>
<img src=x onerror="window.__imgProbe=true">
```

curl 出来 raw HTML 已被剔除，只留下 `&lt;script&gt;` 文本。

### #5 /api/auth 限流

进程内 `Map<ip, {fails, resetAt}>`，每 IP 每 15 分钟最多 10 次失败：

```ts
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 10;
```

成功登录立即清掉对应 bucket，避免被合法用户登录后还累计上次失败数。

### #6 Reset 安全语义

服务端区分两种 PUT：

- `{reset:true}` → 显式重置非密码字段
- `{}` → 拒收 400（避免误操作清空配置）
- `{...fields}` → 正常 save，先 spread 现有 hash 再覆盖

前端 reset 加 `confirm()` 对话框。

## 验证（dev server）

全部 6 项验证通过。详细命令见 commit message 或 git log。

## 留待后续

- #7 token 解耦（大重构，单用户场景收益有限）
- #8 类型清理 / #11 README / #10 性能 → 第三轮
