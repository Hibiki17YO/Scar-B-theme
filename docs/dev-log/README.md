# 开发日志索引

本目录归档每一轮重要开发会话的总结。新条目追加在底部。

## 时间线

| 日期 | 文件 | 主题 |
|---|---|---|
| 2026-05-14 | [01-architecture-review.md](./01-architecture-review.md) | Astro 选型与前后端分离评估 |
| 2026-05-15 | [02-security-pass-1.md](./02-security-pass-1.md) | 服务端鉴权 / Zod / 密码哈希流程改造 |
| 2026-05-16 | [03-post-pass-audit.md](./03-post-pass-audit.md) | 安全改造后的二次审计 |
| 2026-05-16 | [04-security-pass-2.md](./04-security-pass-2.md) | 第二轮：first-run / XSS / 限流 / markdown 净化 |
| 2026-05-16 | [05-polish-and-docs.md](./05-polish-and-docs.md) | 第三轮：缓存 / 类型清理 / 文档 |
| 2026-05-16 | [06-overall-evaluation.md](./06-overall-evaluation.md) | 综合评估 + 大众市场功能盘点 |
| 2026-05-16 | [07-engineering.md](./07-engineering.md) | 工程化阶段（测试 / CI / lint / Docker） |
| 2026-05-16 | [08-v1-features.md](./08-v1-features.md) | v1 功能阶段（RSS / 标签 / 分页 / 主题 / 搜索） |

## 写作约定

- 每个文件独立成篇，开头写明日期、范围、目标
- 引用代码用文件路径 + 行号，避免长段贴代码
- 截图 / 命令输出可以留，用代码块包起来
- 失败的尝试、踩坑、回退也写进去 — 这才是日志的价值
- 不要写明文密码、不要泄漏真实 hash
