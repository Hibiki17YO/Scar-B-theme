# 02 · 第一轮安全改造

> 日期：2026-05-15
> 范围：实施 01 中识别的 P0–P3 / 部分 P4
> 输出：服务端鉴权全链路打通

## 改动清单

### 新增

| 文件 | 作用 |
|---|---|
| `src/middleware.ts` | 拦截非 GET 的 `/api/config` 与 `/api/posts/*`，校验 `X-Admin-Token` / `X-Blog-Token` |
| `src/lib/server-auth.ts` | 服务端共享：原子写、SHA-256、常时比较、token 校验 |
| `src/pages/api/auth.ts` | `POST /api/auth`：客户端拿密码 hash 来此验证，返回 200 / 401 |
| `src/pages/api/posts/_schema.ts` | 文章 frontmatter 的 Zod schema |

### 修改

- `src/pages/api/config.ts` — GET 剥离 `adminPassHash`/`blogPassHash`，改为暴露 `hasAdminPass`/`hasBlogPass`；PUT 用 Zod `strict()` 校验，拒绝任何 hash 字段；接受可选明文 `newAdminPass`/`newBlogPass`，由服务端哈希后写入
- `src/pages/api/posts/index.ts` & `[id].ts` — POST/PUT 加 Zod 校验
- `src/pages/index.astro` — SSR 注入前 delete 掉 hash，传 `hasAdminPass`/`hasBlogPass` 给 Terminal
- `src/components/Terminal.astro` — 登录改为 fetch `/api/auth`，登录成功后存 hash 到 sessionStorage 当 token
- `src/pages/admin.astro` — checkAuth/save/reset 全部走 token；密码改为发明文新密码字段
- `src/pages/blog-admin/index.astro` & `[id].astro` — 同样改造，加 SHA-256 fallback
- `src/pages/blog-admin/[id].astro:147` — **修复 P1 bug**：`fm.author` → `fm.title`

## 关键设计

**Token 设计**：登录时客户端把密码做 SHA-256 → POST `/api/auth` 验证 → 服务端比对 `user.config.json` 中的 hash。验证通过后客户端把这个 hash 存进 sessionStorage，作为后续写请求的 `X-Admin-Token` / `X-Blog-Token` header。

服务端 middleware 收到带 token 的请求 → 重新读 user.config.json → constant-time 对比 → 匹配则放行。

> 这个设计的隐患：token 即 hash，无 TTL、无服务端会话表。XSS 偷到 sessionStorage = 偷到永久密码证明。02 → 04 → 06 阶段都讨论过这个，目前接受现状（单用户场景），后续 #7 再改。

## 验证（dev server）

```bash
curl -X PUT http://localhost:4321/api/config -d '{}'                    # 401
curl -X POST http://localhost:4321/api/posts -d '...'                   # 401
curl -X POST http://localhost:4321/api/auth -d '{"kind":"admin","hash":"<right>"}'  # 200
curl -X PUT http://localhost:4321/api/config -H "X-Admin-Token: <hash>" -d '{"siteTitle":12345}'  # 400
```

全部按预期。

## 踩坑

- **类型问题**：`TerminalConfig` 仍有 `adminPassHash` / `blogPassHash` 字段，SSR 已剥离但类型层面还存在。02 阶段没处理，留到 05。
- **测试时空 PUT 把 user.config.json 清空了**：`PUT {}` 走当时的"完整覆盖"语义，非 hash 字段全没。提醒：测试不能动真实数据。
