# 10 · 发布链路基线（2026-11-23）

> 目的：给"要不要把成员内容改成运行时下发"提供决策依据。**这张表里的数字是实测的**，
> 没测的项明确写"未测"，不预设结论。

## 测量环境

- WSL2 / Ubuntu，Node v22.22.3，npm 10.9.8
- 公开仓 `dev` 分支工作区（8 节免费正文 + manifest 123 节）
- 私有正文根 `../opencodeCourse/content/courses`

## 实测结果

| 项目 | 数字 | 说明 |
| :--- | :--- | :--- |
| 公开站构建（冷，删掉 `.next`） | **12.3 s** | `build-search` + `validate` + `next build` + `assert` + `assert-sitemap` |
| 公开站构建（热） | **25.6 s** | 与并发任务有关，比冷构建还慢，说明测量波动大于缓存收益 |
| 成员站构建 | **19.0 s** | `build-members.mjs`（`COURSE_ACCESS=members` → `out-members/`） |
| 成员站自检 | **0.2 s** | 123 节逐页检查正文/锁定/死链 |
| `publish --content --skip-deploy` 全流程 | **19.3 s** | 构建 + 自检 |
| `publish:check`（CI 一致性） | **0.1 s** | manifest + 免费节一致性 |
| 公开站产物 | 67 MB | `out/` |
| 成员站产物 | 78 MB / 1778 文件 | `out-members/`，单页均值 137 KB |
| 123 节正文源文件 | 1.0 MB（纯文本 336 KB） | 平均每节 2800 字符 |

**结论 1（修正之前的判断）**：构建不是瓶颈。之前说"改一个字要等 5 分钟构建"是错的，
实测是 **12–26 秒**。真正的未知数是**部署上传**耗时。

## 未测项：部署上传

**状态：未测。** 原因：本机没有安装 `wrangler`（`workers/course-delivery` 未 `npm install`），
Cloudflare 账号也未处于登录态（`wrangler login` 之前超时过）。

测量方法（凭据就绪后 10 分钟可完成）：

```bash
cd workers/course-delivery
npm install

# 1. 空跑一次（记录 "Uploaded N files" 与耗时）
time npx wrangler deploy

# 2. 改一节正文 → 重新构建 → 再部署（记录同一组数字）
cd ../.. && npm run build:members && cd workers/course-delivery
time npx wrangler deploy
```

记录三件事：CLI 报告的上传文件数、上传体积、总耗时。

## Phase 2 决策规则（写死，等数据）

- **若单节改动的部署 ≤ 90 秒且上传 ≤ 10 MB** → 保持现有静态方案（Phase 1 已足够），
  把测量结果补进本文件，Phase 2 关闭。
- **否则** → 进入运行时下发方案，先做 0.5 天渲染可行性 spike（风险点见计划 §5.2）。

## 附：发布一条命令的实测

```bash
$ npm run publish -- --content --skip-deploy
▶ 构建成员站
  ✔ 构建成员站（19.0s）
▶ assert-members-pages
✔ 成员站自检通过：123 节全部有页面、有正文、无锁定页、无死链
完成：2 步，用时 19.2s
```

元数据路径（在一次性副本里验证过）：

| 改动 | 结果 |
| :--- | :--- |
| 改一节付费课标题 | 只提交 `manifest.json`（1 个文件），提交里 0 个付费正文，新标题进入 manifest |
| 重复运行 | 无变化、不产生新提交 |
| 改一节免费课摘要 | 提交 `manifest.json` + 该节 `.mdx`（2 个文件），公开仓同步更新 |
