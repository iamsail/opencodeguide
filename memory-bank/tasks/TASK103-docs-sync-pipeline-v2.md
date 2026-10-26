# [TASK103] - OpenCode v2 文档自动化同步流水线

**Status:** In Progress
**Added:** 2026-10-24
**Updated:** 2026-10-26

## Original Request
自动化处理文档的更新与翻译，参考文档来自官网 https://opencode.ai/v2/docs。要求结合 SEO 策略、非破坏（non-breaking）处理，设计合理详细的方案并实施。

## Thought Process
- 上游 v2 文档源码在 GitHub `anomalyco/opencode` 仓库 `dev` 分支 `services/www/src/docs/content/`（66 篇英文 MDX，官方无中文翻译）。可直接拉原始 MDX，比抓 HTML 可靠。
- v2 信息架构与本地 v1 时代的 `/zh/docs` 四层结构完全不同（Docs/CLI/Build/API/Console 五大区）。
- **SEO 硬约束**：现有 URL 全部存活、metadata（canonical/hreflang）保留、零删除零重定向。策略定为：同主题页**原地更新**（17+4 页），新主题**增量新增**（约 45 页），v1 独有页（14 页）**保留 + 页首迁移提示**。
- 翻译引擎用 `claude -p`（复用本机 Claude Code 凭据与模型），术语表强制注入，内容哈希缓存断点续跑。
- **关键技术发现（mdxjs-rs 限制）**：Next 的 MDX-RS 会在 JSX 属性表达式中**对象字面量内部的逗号处**截断表达式，`tabs={[{label, code}]}` 语法无法编译（swc "Expected ',', got '<eof>'"）。解法：CodeTabs 改用 **JSON 字符串属性** `tabs='[{"label":...,"code":...}]'`，组件端 `JSON.parse`；transform 自动转换、generate 防御性回转、翻译 prompt 约束单行保留。JSX 字符串属性不支持反斜杠转义，JSON 含单引号时会告警。
- SEO 保护机制实际触发一次：`/zh/docs/config` 原缺 `export const metadata`，generate 拒绝覆盖，补 metadata 后重跑成功。
- GitHub API 匿名限流（60 次/时）：树枚举失败时回退 `.upstream/tree.json` 缓存；文件内容走 `raw.githubusercontent.com` + 并发 6 + 3 次退避重试。支持 `--skip-fetch` 用本地快照。

## Implementation Plan
- [x] Phase 0：MDX 组件（Callout/Card/CardGroup/CodeTabs）+ `scripts/docs-sync/` 流水线 + page-map.json + glossary + README
- [x] Phase 1：5 个试点页原地更新（intro/config/cli/troubleshooting/configure/agents），build 全绿，幂等性验证通过
- [x] Phase 2：剩余 16 个 update 页 + 14 个 legacy 页迁移提示注入（2026-10-26 完成；期间升级 next16.1.1→16.4.3 修复 SWC 多字节 panic）
- [ ] Phase 3：45 个 create 页 + 侧边栏扩展（docsConfigZh 追加 + Console 新组）+ ROUTE_MAP.md 增补
- [ ] Phase 4：sitemap/SEO 回归验证、metadata 完整性抽查、memory-bank 收尾
- [ ] Phase 5（可选）：GitHub Actions 每周 fetch/diff 检测开 issue

## Progress Tracking

**Overall Status:** In Progress - 55%（Phase 0+1+2 完成，Phase 2 待提交）

### Subtasks（后续 TODO）
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Phase 0 基础设施（组件+流水线+数据文件） | Completed | 2026-10-24 | commit 7b755e4 |
| 1.2 | Phase 1 试点 5 页同步 | Completed | 2026-10-24 | build 通过 |
| 2.1 | Phase 2 其余 update 页（providers/network/models/skills/themes/commands/formatters/tools/mcp-servers/permissions/instructions→rules/cli/tui/acp/keybinds/build/plugins/build/sdk） | Completed | 2026-10-26 | 16 页全部 update-in-place；models/network 补 metadata |
| 2.2 | Phase 2 legacy 提示注入（usage/ide/zen/share/github/gitlab/enterprise/windows-wsl/migrating-to-1-0/mcp/lsp-servers/custom-tools/develop/server/develop/ecosystem） | Completed | 2026-10-26 | 14 页页首 Callout；标记用 MDX 注释 `{/* */}`（HTML 注释会编译失败） |
| 3.1 | Phase 3 create 批：Docs 新主题 9 页（migrating-to-v2/plugins/websearch/snapshots/compaction/references/attachments/policies/warming） | Not Started | 2026-10-24 | |
| 3.2 | Phase 3 create 批：CLI 子页 6 页（cli/config·web·providers·commands·theme·plugins） | Not Started | 2026-10-24 | **优先 cli/commands**：当前 /zh/docs/cli 变薄，命令参考在该页缺失 |
| 3.3 | Phase 3 create 批：Build 区 12 页（develop 落地页/client/sdk/cloudflare/plugins 子页/effect 4 页） | Not Started | 2026-10-24 | |
| 3.4 | Phase 3 create 批：Console 区 20 页（/zh/docs/console/**） | Not Started | 2026-10-24 | 内容较短可一个 PR |
| 3.5 | Phase 3 侧边栏扩展：docsConfigZh 追加各组条目 + 新 Console 组 | Not Started | 2026-10-24 | 用 `node scripts/docs-sync/sidebar-snippet.mjs --action create` 生成片段 |
| 3.6 | ROUTE_MAP.md 增补（SYNC_REPORT.md 已给建议行） | Not Started | 2026-10-24 | |
| 4.1 | Phase 4：sitemap 含全部新 URL、metadata/hreflang 抽查、现有 URL 存活对比 | Not Started | 2026-10-24 | |
| 5.1 | Phase 5（可选）：.github/workflows/docs-sync-check.yml 每周检测 | Not Started | 2026-10-24 | 仅 fetch/diff 开 issue，翻译留本地 |

### 遗留注意事项
- `/zh/docs/intro` 的 CodeTabs `label` 属性仍为英文 "Install method"（组件 aria-label，不影响正文）。
- validate 报告的 `configure/agent-skills` 多行 HTML table 为存量问题，该页在 Phase 2 update 名单内会被替换。
- 仓库曾无 git 身份，已设 repo 级 `iamsail <865605793@qq.com>`。
- 提交 7b755e4 的后台安全审查未完成（API HTTP 400），push 时会自动再审。

## Progress Log
### 2026-10-26
- Phase 2.1：16 个 update 页全部同步完成（上游 commit 08ac673/5b41e1f）；`models`、`network` 两页原缺 metadata，SEO 保护拦截后补齐再跑成功。
- Phase 2.2：`scripts/docs-sync/legacy.mjs` 新增并为 14 个 v1 旧页注入迁移提示（幂等标记 `{/* v2-legacy-banner */}`；HTML 注释在 MDX 中编译失败，已改 MDX 注释语法）。
- **根因修复 SWC panic**：生产构建在 page data 阶段稳定 panic（swc_common source_map.rs char boundary，文件集合随调度漂移）。定位为 Next 官方 issue vercel/next.js#87713（16.1.0 SWC 回归，MDX 正文多字节字符触发；修复随 #87841 swc_core v50.2.3）。**升级 next16.1.1→16.4.3 后 build 全绿（97 页静态生成，零 panic）**；此前试过的英文 description、English buffer、experimental.cpus 均为治标，已全部还原。
- validate：无真实断链、无裸多行 HTML table；44 处"计划中链接"指向 Phase 3 待建页。
- 待提交（47 文件）：16 update 页 + 14 legacy 页 + .upstream 快照 + next 升级。

### 2026-10-24
- 完成上游调研：确认 v2 源码位置、66 页清单、5 大区 IA、组件清单（Callout/Card/CardGroup/CodeTabs/PlanTabs/OpenApiReference）、官方无 v2 中文。
- 设计方案获批：非破坏 + SEO 保护 + 5 阶段实施（计划文件 https-opencode-ai-v2-docs-zany-raccoon.md）。
- Phase 0：4 个 MDX 组件 + 13 个流水线文件 + page-map（66 slug）+ glossary；`npm run docs:sync` 可用。
- 排查并解决 mdxjs-rs 对象字面量逗号截断问题（CodeTabs JSON 字符串属性方案），dev 服务器二分验证。
- Phase 1：试点 5 页走完整链路（fetch→diff→transform→translate→generate→validate），metadata 全保留，build 全绿，幂等通过。
- config 页补 metadata（原缺失，SEO 保护拒覆盖后修复）。
- 提交 `7b755e4`（只提交未 push）。
- 待办登记本文件；等用户审阅试点 diff 后继续 Phase 2。
