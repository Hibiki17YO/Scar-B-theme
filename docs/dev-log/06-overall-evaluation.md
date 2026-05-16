# 06 · 综合评估 + 大众市场功能盘点

> 日期：2026-05-16
> 范围：站在「项目是否合格」与「面向用户群」两个层面回看
> 输出：v1 / v2 / v3 路线图

## 一、达到「合格」标准了吗？

作为**个人博客主题**：✅ 合格。

| 维度 | 评分 | 说明 |
|---|---|---|
| 功能完整性 | 8 / 10 | 列表 / 详情 / 编辑器 / 配置 / 认证 / 移动端 |
| 安全性 | 7 / 10 | 服务端鉴权、Zod、限流、XSS 净化、原子写、CSRF；只差 token 解耦和 bcrypt |
| 代码质量 | 7 / 10 | 模块边界清晰，但有 sha256js 三处重复、Terminal.astro 单文件 739 行 |
| 工程化 | 4 / 10 | **无测试、无 CI、无 lint config、无 .env.example** ← 最大短板 |
| 文档 | 7 / 10 | README EN/ZH 齐全，缺贡献指南、CHANGELOG |
| 可维护性 | 7 / 10 | TS 严格、模块抽离合理 |

## 二、被「Astro SSR + Node adapter」限制的能力

| 受限能力 | 原因 |
|---|---|
| Serverless 部署 | 依赖运行时写本地 JSON / .md，无文件系统 |
| 多实例水平扩展 | 文件锁、进程内 rate limit、进程内 cache 都假设单进程 |
| 全文搜索 | 没有数据库 |
| 评论系统 | 必须依赖外部 |
| 多用户协作 | 单密码 = 单角色 |
| 统计 / 分析 | 没持久存储 |
| 图床 / 上传 | 编辑器没接 |
| 草稿历史版本 | .md 文件只有最新版 |
| 真实时通知 / WS | Astro SSR 无内置 |

> 这些限制大多不是 Astro 的锅，是「无数据库」选型的代价。

## 三、对现有技术栈发挥的优势

| 优势 | 体现 |
|---|---|
| Content Collections + Zod | frontmatter 类型安全、build-time 校验、`render(post)` 一行出 HTML |
| 零 JS 默认 | `/blog`、`/blog/[slug]` 都是 prerender 纯静态 |
| MDX | 文章可嵌入组件 |
| 单进程一体化 | 页面 + API + 静态资产同一个 node 进程 |
| middleware.ts | 鉴权一处生效 |
| prerender + SSR 混合 | 博客静态化、管理 API 动态化、admin 也静态 |
| Shiki 内置 | 代码高亮无依赖 |
| crypto.subtle + 纯 JS fallback | HTTPS / HTTP 都兼容 |

## 四、尚可改进的工程项

### 工程化（最值得做的）

1. Vitest 单元测试
2. GitHub Actions CI
3. ESLint + Prettier
4. .env.example + 环境变量化
5. Husky + lint-staged
6. Dockerfile + docker-compose

### 安全收尾

7. Token 解耦（server-side session table + TTL）
8. bcrypt / argon2 替换 SHA-256
9. CSP header
10. SameSite=Strict cookie（如果转用 cookie）

### 代码质量

11. Terminal.astro 拆分（739 行 → terminal-shell / commands / ui）
12. sha256js 提到 public/js/sha256.js
13. is:inline 内的 JS 加 JSDoc 类型

### 性能 / SEO

14. RSS feed (@astrojs/rss)
15. sitemap.xml (@astrojs/sitemap)
16. OpenGraph / Twitter Card meta
17. <link rel="canonical">
18. 404 页（保持终端风格）
19. prefers-reduced-motion 支持

## 五、面向大众市场的功能缺口

### 🟥 必做（v1.x）

| # | 功能 | 用户痛点 |
|---|---|---|
| 1 | 图片 / 文件上传 | 当前要 SSH 把图放 public/ |
| 2 | WYSIWYG / split-view 实时预览 | textarea 太原始 |
| 3 | 评论系统集成（giscus / Waline） | 99% 博主想要互动 |
| 4 | 搜索（Pagefind 静态生成） | 文章一多就找不到 |
| 5 | RSS / Atom | 订阅者命脉 |
| 6 | 草稿 / 定时发布 | frontmatter 加 publishAt |
| 7 | 分类 / 标签页 | 现在标签是装饰 |
| 8 | 分页 | 文章一多首屏太长 |
| 9 | 暗 / 亮主题切换 | CSS 变量都准备好了 |
| 10 | 可视化主题定制 | admin 面板调色板 |

### 🟧 锦上添花（v2.x）

11. 多作者（@astrojs/db / SQLite）
12. 浏览统计
13. 点赞 / 收藏
14. 目录 (TOC) 自动生成
15. 代码块复制按钮
16. 图片懒加载 + WebP
17. 关联文章
18. Markdown 数学公式
19. 多语言文章
20. PWA / 离线阅读
21. Webhook on publish
22. 导入 / 导出
23. 数据迁移工具

### 🟨 选做（独特卖点）

24. AI 摘要 / 关键词提取
25. AI 写作助手
26. 终端命令扩展生态
27. 嵌入第三方块（Bilibili / YouTube oembed）
28. **真正的命令式博客** — `cd 2024/01/post-1`、`ls --tag=astro`、`cat about.md`，整个站点是 fake-shell。这是其他主题做不到的差异化锚点

## 六、判断

**对现状**：作为 geek 自用 / 技术博主自用的开源主题，**已经合格**，可以挂个 release 发到 GitHub 收 star。

**面向大众市场**：还差两个阶段：

1. **v1.x 工程化 + UX 补齐**（评论 / 搜索 / RSS / 图片上传 / 主题切换 / 标签页 / 分页）
2. **v2.x 找差异化锚点** — 看好 #28「真正的命令式博客」

**最不推荐方向**：试图做成 WordPress 替代品。既离开 Astro 优势区，又被 Ghost / Hexo 压制。

## 下一步

先做 #1 工程化（测试 + CI）+ #5 RSS + #4 搜索 + 图片上传。这四项加起来不到一周，能让项目从「自用工具」变成「他人愿意试用的主题」。

**本轮先开工程化部分，作为 07-engineering.md 的内容。**
