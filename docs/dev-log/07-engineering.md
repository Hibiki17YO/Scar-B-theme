# 07 · 工程化阶段

> 日期：2026-05-16
> 范围：测试 / CI / lint / 环境变量 / Docker
> 状态：已完成

## 执行摘要

| # | 内容 | 状态 |
|---|---|---|
| P1 | Vitest 单元测试（server-auth + PostSchema）| ✅ 33 tests |
| P2 | API 集成测试（auth / config / posts / middleware）| ✅ +45 tests，共 78 个 |
| P3 | GitHub Actions CI（lint + build + test）| ✅ `.github/workflows/ci.yml` |
| P4 | ESLint flat config + Prettier | ✅ `eslint.config.js`, `.prettierrc.json` |
| P5 | 环境变量化 + `.env.example` | ✅ `SCAR_CONFIG_PATH` / `SCAR_POSTS_DIR` / 限流参数 |
| P6 | ~~Dockerfile + docker-compose~~ | ❌ 撤销（见下） |

## P6 撤销说明

写完后讨论判定：Docker 对单进程、无外部依赖、单实例部署的个人博客来说**收益小于成本**。

收益弱：

- 无多服务编排需求（项目就一个 Node 进程）
- 无横向扩展（进程内 rate-limit Map、文件锁本来就单实例）
- 环境一致性问题不大（Node 22 + npm install 已经稳定）

成本：

- 镜像 300-400 MB vs 直接 node 80 MB
- 编辑文章不如 SSH `vim` 直接
- 多一层故障排查（日志、卷权限、UID）

**最终方案**：直接 `node dist/server/entry.mjs` + PM2/systemd 守护。README 主推这条路。

> 留作历史教训：工程化阶段挑战在于「**别为了 checklist 而 checklist**」。Docker 是好工具，但要看场景。Synology / Kubernetes / 模板分发场景下值得加回来，但作为单仓的默认部署路径就过重了。

## 关键决策

### 测试边界 — 直接 import handler，不用 dev server

为了避免起 dev server / 端口冲突 / 真实文件污染：

```ts
import { POST as authPost } from '../../src/pages/api/auth';
const ctx = { request, clientAddress } as never;
const res = await authPost(ctx);
```

`as never` 是绕开 Astro `APIContext` 类型的最小手段，handler 只用 `request` 和 `clientAddress` 两个字段。

### `astro:schema` 在测试里的处理

`src/pages/api/posts/_schema.ts` 用 `import { z } from 'astro:schema'`。这是 Astro 的虚拟模块。`vitest.config.ts` 里用 alias 解到 `zod`：

```ts
resolve: {
  alias: { 'astro:schema': 'zod' },
},
```

### 环境变量的求值时机

最初写成 `export const CONFIG_PATH = process.env.SCAR_CONFIG_PATH ?? ...`，这种写法在模块加载时求值，测试里改 env 然后再 import 会拿到旧值。改成 `getConfigPath()` 函数，每次调用现取，测试隔离干净。

### 配置 / 文章目录抽离

新增 `getConfigPath()` 和 `getPostsDir()`，并替换三处硬编码：

- `src/lib/server-auth.ts`
- `src/lib/runtime-cache.ts`
- `src/pages/api/posts/{index,[id]}.ts`

副产品：路径变成单一来源，未来要换实现（多用户 / S3 等）只需改一处。

### Lint 配置取舍

ESLint flat config + `@typescript-eslint` 推荐规则。关闭：

- `astro/no-set-html-directive` — Terminal.astro 里 innerHTML 是有意为之
- `no-undef` — TypeScript 已经管这事，ESLint 在 .ts 文件上看不见所有 globals
- `@typescript-eslint/no-explicit-any` — 项目里部分 narrow 写法依赖 any

### Docker 多阶段（已撤销）

~~builder 阶段用 npm ci 装全部依赖跑 build；runtime 阶段只装 production deps + 拷贝 dist。~~

P6 见上方"撤销说明"。

## 踩坑

### 1. ESLint v10 + flat config

ESLint 10 默认走 flat config，`eslint.config.js` 而非 `.eslintrc`。`@eslint/js` 是新增依赖，提供推荐规则。

### 2. Astro Content Collections 的 build-time 快照

发现一个**已存在的设计缺陷**（不是本轮引入的）：

- `getCollection('posts')` 在 `astro build` 时把 `src/content/posts` 快照到 `.astro/`
- 用户通过 admin 编辑器新建的文章会**正确写入磁盘**
- 但 `/blog/<slug>` 路由是 prerender 的，**新文章不会自动出现，必须重新 build**
- Terminal 里的 `blog` 命令走 runtime API（直接 readdir posts 目录），所以**能看到新文章**——但点进去后 `/blog/<slug>` 是 404

这是 Astro Content Collections 与"运行时编辑器"两个用法天然冲突的地方。已记入 README，留待后续：要么把 `/blog/[slug]` 改成 SSR 直接读 .md，要么在 admin 保存时触发 rebuild webhook。

### 3. Terminal.astro 的 ESLint warning

`let ok = false; try { ok = res.ok } catch { ok = false }` 触发 `no-useless-assignment`。改成 `let ok: boolean;` + 两个分支都赋值。

## 数字快照

```
Test Files  6 passed (6)
     Tests  78 passed (78)
  Duration  ~430ms

build:       ~2.5s
lint:        ~1.5s
```

`npm run`：dev / build / preview / astro / test / test:watch / test:coverage / lint / format / format:check

## 文件改动清单

新增：

- `vitest.config.ts`
- `eslint.config.js`
- `.prettierrc.json`
- `.prettierignore`
- `.env.example`
- ~~`Dockerfile` / `docker-compose.yml` / `.dockerignore`~~（已撤销）
- `.github/workflows/ci.yml`
- `test/lib/server-auth.test.ts`
- `test/api/auth.test.ts`
- `test/api/config.test.ts`
- `test/api/posts.test.ts`
- `test/api/post-schema.test.ts`
- `test/middleware.test.ts`

修改：

- `package.json` — name 改为 scar-b-theme，新增 scripts，新增 devDependencies
- `src/lib/server-auth.ts` — `getConfigPath()` / `getPostsDir()` 抽出
- `src/lib/runtime-cache.ts` — 用 `getConfigPath()`
- `src/pages/api/posts/{index,[id]}.ts` — 用 `getPostsDir()`
- `src/pages/api/auth.ts` — 限流参数环境变量化
- `src/components/Terminal.astro` — lint 修复
- `.gitignore` — 加 coverage/
- `README.md` / `README.zh.md` — Docker / env 章节

## 下一步建议

按 06 中的 v1.x 路线：
- RSS feed (@astrojs/rss)
- 站内搜索（Pagefind）
- 图片上传 API
- giscus / Waline 评论
- 暗 / 亮主题切换
- 标签 / 分页路由
