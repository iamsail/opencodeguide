# [TASK109] - 发布链路：一条命令 + 部署基线

**Status:** In Progress（Phase 0 止血 + Phase 1 一条命令已完成并实测；Phase 2 等部署基线数据）
**Added:** 2026-11-23
**Updated:** 2026-11-23

## Original Request

课程卖法定为**按课程卖**（不按节）。现状是改一节课要跨 2 个仓库、4 个产物、6 个手工步骤，
不可持续。要求：一次内容改动只做一次发布动作，且不增加月度成本。

## 结论与设计

见 [`docs/courses/10-publish-baseline.md`](../../docs/courses/10-publish-baseline.md)（实测基线）
与 [`docs/courses/09-content-repo-boundary.md`](../../docs/courses/09-content-repo-boundary.md) §10（发布流程）。

分三期，每期可独立停下：

1. **Phase 0（完成）**：修 sitemap 尾斜杠、锁定页改 noindex、测量发布基线
2. **Phase 1（完成）**：`npm run publish` 一条命令封装元数据同步 + 成员构建 + 自检 + 部署
3. **Phase 2（待定）**：按部署基线决定要不要把成员内容改成运行时下发

## Phase 0 落地（2026-11-23）

| 改动 | 文件 | 效果 |
| :--- | :--- | :--- |
| sitemap 尾斜杠 | [app/sitemap.ts](../../app/sitemap.ts) + 新增 [scripts/assert-sitemap.mjs](../../scripts/assert-sitemap.mjs) | 148 条 URL 全部带 `/`，不再每条吃一次 301；构建期自动断言（无尾斜杠/重复/指向 404 都会失败） |
| 锁定页索引策略 | [app/(zh)/zh/courses/[slug]/[lesson]/page.tsx](../../app/(zh)/zh/courses/[slug]/[lesson]/page.tsx) + [lib/course-access.ts](../../lib/course-access.ts) | 锁定页默认 `noindex, follow`；`LOCKED_PAGE_INDEX=true` 可一键回退 |
| 发布基线 | [docs/courses/10-publish-baseline.md](../../docs/courses/10-publish-baseline.md) | 公开站 12–26s、成员站 19s；**部署上传未测**（缺 wrangler/登录） |

## Phase 1 落地（2026-11-23）

| 脚本 | 作用 |
| :--- | :--- |
| `scripts/content/publish.mjs` | 一条命令：元数据同步 → 只 stage 自己产出的文件并提交 → 成员构建 → 自检 → 部署 |
| `scripts/courses/assert-members-pages.mjs` | 部署前逐节确认：123 页存在、每页有正文（多点探针）、无锁定页、无死链 |
| `npm run publish` / `:content` / `:metadata` / `:check` | 四种模式；`--dry-run`、`--skip-deploy`、`--push` 开关 |

关键约束：
- **只 stage** `manifest.json`、`content/courses/zh`、`.gitignore`，绝不 `git add -A`
- **默认不 push**；`--push` 必须带 `GIT_PUSH_CONFIRMED=yes GIT_PUSH_NETWORK=<网络名>`
- 任一步失败立即停止，不产生半截状态

### 实测（一次性副本里验证，未污染真实仓库）

| 场景 | 结果 |
| :--- | :--- |
| 改一节付费课标题 | 只提交 `manifest.json`；提交内 0 个付费正文；新标题进入 manifest |
| 重复运行 | 无变化、无新提交 |
| 改一节免费课摘要 | 提交 `manifest.json` + 该节 `.mdx` |
| `publish --content --skip-deploy` | 19.3s 完成构建 + 123 节自检 |
| `publish:check` | 0.1s，发现漂移即 exit 1 |

### 顺带修掉的问题

- `build-manifest.mjs` 之前只扫公开根，会把 manifest 生成成"只有 8 节"。已改为**私有根优先、公开根兜底**。

## 待做

- [ ] **部署基线测量**：`workers/course-delivery` 装 wrangler + 登录后，测两次 deploy（空跑 / 改一节）的上传量与耗时，补进 `10-publish-baseline.md`
- [ ] **Phase 2 决策**：按 §10 的规则判定——单节部署 ≤ 90s 且 ≤ 10MB 就保持静态方案，否则启动运行时下发（先做渲染 spike）
- [ ] Phase 3：公开仓 CI 加 `publish:check`；runbook 补发布前置；`09` 文档补发布流程（已完成 §10）

## 验收标准

1. 改一节课正文：`npm run publish` 一条命令，公开仓工作区干净、公开站不重建
2. 改一节课标题：同一条命令，公开仓出现且仅出现 manifest（+ 免费节）的提交
3. 成员站构建缺正文时：`publish` 在自检处失败，**不会**部署出"只有 8 节"的成员站
4. sitemap 148 条 URL 全部带尾斜杠，构建期断言通过
5. 锁定页 `noindex, follow`，免费试听页仍 `index`
