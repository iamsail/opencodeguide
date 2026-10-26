# docs-sync：OpenCode v2 官方文档同步流水线

把上游 `anomalyco/opencode`（`dev` 分支 `services/www/src/docs/content/`）的英文 MDX 同步为本站中文文档。
设计原则：**SEO 不受伤、非破坏**——现有 URL 原地更新并保留 metadata，新主题增量新增，v1 旧页保留加迁移提示。

## 用法

```bash
npm run docs:sync                 # 全量：上游有变更的页才处理
npm run docs:sync -- --dry-run    # 只拉取+检测，不翻译不写文件
npm run docs:sync -- --only index,config
npm run docs:sync -- --force      # 忽略上游 diff，全部重译
npm run docs:sync -- --no-build   # 跳过 validate 的 npm run build
npm run docs:sync -- --ref <branch|sha>
npm run docs:validate             # 只跑校验（内链 + 裸 HTML table lint）
node scripts/docs-sync/legacy.mjs             # v1 独有页注入迁移提示（幂等；--dry-run 预览）
node scripts/docs-sync/sidebar-snippet.mjs --action create   # 生成侧边栏追加片段
```

前置：本机已登录 Claude Code（流水线通过 `claude -p` 翻译，复用其凭据与模型配置）。
可选：`GITHUB_TOKEN` 环境变量提高 GitHub API 限额（没有也能跑——树枚举限流时自动回退缓存树，文件内容走 raw.githubusercontent.com）。

## 流水线

```
fetch → diff → transform → translate → generate → validate → report
```

| 模块 | 职责 |
| --- | --- |
| `fetch.mjs` | 拉上游 MDX → `.upstream/content/`；blob sha 记入 `.upstream/manifest.json`；树枚举 API 失败时回退 `.upstream/tree.json` |
| `diff.mjs` | 对比 `.upstream/processed.json`，只处理上游 sha 变化的页 |
| `transform.mjs` | 剥 YAML frontmatter、内链按 `page-map.json.linkRewrites` 重写、PlanTabs 降级为 Callout |
| `translate.mjs` | `claude -p` 逐文件翻译；术语表注入；缓存 `.translation-cache/`（gitignore），键含上游 sha + 术语表版本 |
| `generate.mjs` | **update**：保留原 `export const metadata` 整块，只换正文；**create**：生成 metadata 骨架（canonical 自指） |
| `validate.mjs` | 内链存在性、裸多行 HTML table lint、`npm run build` |
| `report.mjs` | 写根目录 `SYNC_REPORT.md`（含 ROUTE_MAP 建议行） |

## 关键数据文件

- **`page-map.json`** — 唯一映射事实来源：`v2 slug → { localUrl, action, sidebar }`。`action`：`update`（原地更新）/ `create`（新增）/ `legacy`（保留旧页注入提示）/ `defer`（暂缓）。上游出现未声明 slug 时 fetch **报错退出**，强制先更新此表。
- **`glossary.zh.json`** — 翻译术语表；`version` 字段参与缓存键，改术语后旧缓存自动失效。
- **`.upstream/`** — 上游快照 + manifest + processed 记录，**提交进 git** 作为 diff 基线。
- **`.translation-cache/`** — 翻译缓存，gitignore。

## SEO 保护规则（不要绕过）

1. `update` 页若现有文件缺少 `export const metadata`，generate 会**拒绝覆盖**——先补 metadata。
2. 不改任何现有 URL；不做重定向；`vercel.json` 无需动。
3. 新页 title 统一 `"{中文标题} | OpenCode 中文文档"`；description 结尾不留中文标点（SWC 崩溃规避）。
4. 跨域 hreflang 不加（社区站与官方站互指有风险）。

## 故障排查

- **fetch 报 403 rate limit**：正常，会自动回退缓存树；如需最新树枚举，设 `GITHUB_TOKEN` 或等限流重置（1 小时）。
- **raw 下载 ECONNRESET**：已内置 3 次指数退避重试；网络长期不稳时可先手工下载到 `.upstream/content/`。
- **build 因中文标点崩**：定位到具体页 metadata，把 description/title 结尾标点改为英文或删掉。
- **翻译质量不佳**：改 `glossary.zh.json`（version +1）或 `translate.mjs` 内 `PROMPT_VERSION`，然后 `--force --only <slug>` 重跑。
