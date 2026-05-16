# 05 · 第三轮：缓存 / 类型清理 / 文档

> 日期：2026-05-16
> 范围：处理 03 中识别的 #8 / #10 / #11 / #12
> 输出：性能与文档收尾

## 改动清单

| # | 修复 | 文件 |
|---|---|---|
| 10 | 首页 config + word count 缓存（dev mode 直通） | 新增 `src/lib/runtime-cache.ts`，重写 `src/pages/index.astro` |
| 8 | 移除 `TerminalConfig.adminPassHash` / `blogPassHash` 字段 | `src/config/terminal.config.ts:50-52,138,140` |
| 12 | atomic-write 后缀 `randomBytes(4)` → `randomBytes(8)` | `lib/server-auth.ts`, `api/posts/index.ts`, `api/posts/[id].ts` |
| 11 | README EN/ZH 更新认证流程文档 | `README.md`, `README.zh.md` |

## 关键设计

### #10 缓存策略

- **config** 用 `mtimeMs` 做 cache key：每次请求 `stat()` 一下 `user.config.json`，mtime 不变 → 命中缓存
- **word count** 用 posts 目录的 fingerprint（`name:size:mtime` 拼起来）做 cache key：任何文件变了 fingerprint 就变，自动失效
- `import.meta.env.DEV` 时直通不缓存，避免开发时困惑

```ts
if (!import.meta.env.DEV && _configCache && _configCache.mtimeMs === mtimeMs) {
  return _configCache.value;
}
```

### #11 README 主要改动

删掉 `adminPassHash` / `blogPassHash` 字段说明（它们是实现细节不是用户配置项）。新增「Authentication & API」章节，列出：

- `GET /api/config` 公开（hashes 已剥离）
- `PUT /api/config` 需 `X-Admin-Token`
- `POST /api/auth` 公开，body `{kind, hash}`，返回 200 / 401 / 429
- `POST/PUT/DELETE /api/posts/*` 需 `X-Blog-Token` 或 `X-Admin-Token`
- 限流策略
- first-run 引导说明 + 部署前必须设密码
- `{reset:true}` sentinel

中文版同步。

## 累计改动量

至此「安全加固阶段」全部收尾，覆盖原架构评估 P0–P3 + 新发现的 14 项缺陷中 11 项。

剩余未做：

- #7 Token 解耦（大重构）
- #9 sha256js 三处去重（用 `<script src>` 替换 `is:inline`，工程价值不大）
