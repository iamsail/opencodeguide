# 09 · 课程内容的仓库边界（方案 B 思路）

> 记录时间：2026-11-22 · 状态：**方向已定，未实施** · 分支 `dev`
> 本文只沉淀「为什么这么分、边界在哪、有哪些硬约束」，不含实施步骤。

## 0. 一句话

**元数据公开，正文私有**：文档站继续开源可构建，付费正文与鉴权代码搬进私有仓；公开仓只留课程大纲、课时清单（manifest）与 8 节免费正文。

---

## 1. 问题

本站的付费墙是**构建期**生效的：`COURSE_ACCESS=public` 的产物里，付费课时只渲染锁定页，正文不进 HTML / RSC / `search.json`。

但这条边界只覆盖**构建产物**，不覆盖**源码**。而本仓库是公开仓库，于是：

| 事实（2026-11-22 实测） | 值 |
| :--- | :--- |
| `origin/main` 中的 `content/courses/` | 0 个文件 |
| `origin/main` 中的 `workers/` | 0 个文件 |
| 线上 `/zh/courses/`、`/en/courses/`、任意课时页 | 全部 404 |
| 线上 `sitemap.xml` 中的课程 URL | 0 条（共 128 条） |
| `dev` 分支中已入库的课时正文 | **123 个 `.mdx`**（含 115 节付费），约 27.4 万字符、984 KB |
| 社区指标 | 0 star / 0 fork / 0 watcher |

**结论**：课程**没有上线**（产物里没有、搜索引擎看不到），但正文**已经公开**（`git clone` 即可读）。这是两个独立的事实，不能互相替代。

也就是说：**付费墙在源头上是敞开的**，只是目前还没人走到那个地址。

---

## 2. 目标与非目标

**目标**

1. 文档站保持公开：外部人 clone 下来能 `npm run build`，站点继续走 GitHub Pages（免费）。
2. 付费正文只在私有边界内存在，公开仓不再出现全文。
3. 课程页仍然完整：课表 123 节、卖点、试听、锁定页一个不少。

**非目标**

- 不是"防破解"。构建产物里本来就没有付费正文，这点已经由 `courses:assert` 守住。
- 不是"藏起鉴权代码"。`workers/course-delivery` 里没有密钥，公开无害；代码保密不构成安全边界。

---

## 3. 边界怎么划

```
私有仓                              公开仓
─────────────────────────────      ─────────────────────────────
123 节课时正文（.mdx）        ──▶   course-manifest.json（只有元数据）
workers/course-delivery            8 节免费正文（.mdx）
                                   content/courses/*.json（大纲、价格、卖点）
                                   文档站、脚本、组件
```

- **manifest 是课表的真相源**：slug、标题、摘要、module / lesson、时长、是否免费。**不含正文**。
- 公开构建：manifest 出课表 → 有正文的渲染正文（免费 8 节），没有正文的渲染锁定页。
- 成员构建：manifest + 私有仓全文 → 渲染全部正文。

这样"课表完整"和"正文不公开"同时成立，而这两件事目前是耦合的（见 §5）。

---

## 4. 为什么是 B，不是 A 或 C

| 方案 | 一句话 | 为什么不选 |
| :--- | :--- | :--- |
| **A 仓库整体转私有** | 10 分钟止血 | 公开站要改托管（GitHub Pages 私有仓需 Pro，或迁 Cloudflare Pages）；文档源码不再公开 |
| **B 拆仓（本文）** | 元数据公开、正文私有 | ✅ 选定 |
| C1 私有子模块 | 单仓假象 | 本质仍是两个仓，且公开仓 clone 后无法构建 |
| C2 对象存储（R2/S3） | 正文放私有桶 | 失去 git 的 diff / 回滚 / review；留作 P3「按用户签名下发」时的演进方向 |
| C3 加密入库（git-crypt） | 密文提交公开仓 | 密钥成为单点，泄露即全丢；且内容变成不可读、不可搜的密文 |

选 B 的三条理由：

1. **工作流不降级**：123 节、27 万字的内容最需要 diff、回滚、分支——这是 git 的本职。
2. **公开仓仍可构建**：外部 clone 后 `npm run build` 能跑通，这是"开源文档站"的硬要求。
3. **没有密钥单点**：边界是 GitHub 仓库权限，泄露面只有一个。

C2 不是被否决，而是**留作后续演进**：真要做按订阅级别下发、加水印时，正文已经在独立仓里，搬去 R2 只是换存储层。

---

## 5. 四条硬约束（不管怎么实施都不能违反）

1. **课表现在由正文文件驱动**
   `lib/course-lessons.ts` 用 `readdirSync` 扫 `.mdx` 生成课表，slug 来自文件名；而大纲 JSON 里的 `lessons` 只是标题字符串（没有 slug）。
   ⇒ 直接删正文会让课表从 123 节退化成 8 节。**必须先把 manifest 立为课表真相源**，否则拆分即等于商品页自残。

2. **拆仓 ≠ 删历史**
   正文已存在于公开历史（`159de3d`、`48b66bc`）。删文件只影响未来的 commit，旧 commit 依然能 checkout 出全文。
   ⇒ 真正止血需要**重写公开仓历史**；B / C1 / C2 / C3 全部绕不开这一步，所以它不是选型依据。

3. **公开仓必须保持可构建**
   这是 B 相对 C1 的核心优势，也是最容易被实施细节破坏的地方（例如校验脚本断言 123/123、断言脚本从正文抽取探针）。

4. **先拆分，后发布**
   课程一旦合到 `main` 发布，站点开始被收录、外链开始产生，再重写历史的成本会显著上升。

---

## 6. 遗留的开放问题（实施前需拍板）

| # | 问题 | 备注 |
| :--- | :--- | :--- |
| 1 | 私有仓是否也放 `workers/course-delivery` | 放：边界统一；不放：Worker 本就无密钥，公开也无害 |
| 2 | manifest 的同步方式：手工提交 / 私有仓 Actions 自动提交到公开仓 | 后者能消掉"改一节课要跨两个仓"的摩擦 |
| 3 | 历史重写的时机与通知 | 会改写全部 commit hash；需确认没有其他克隆在用 |
| 4 | 免费正文是否也搬进私有仓再由构建注入 | 建议留在公开仓：试听页要能被搜索引擎索引 |
| 5 | 英文正文（当前 0 节）是否直接生在私有仓 | 建议是，避免重蹈一次 |

---

## 7. 与其它文档的关系

- 付费墙与门禁设计：[07-access-control.md](./07-access-control.md)
- 部署与验收：[08-launch-runbook.md](./08-launch-runbook.md)
- 进度看板：[06-todo.md](./06-todo.md)
- 仓库密钥护栏（`.githooks/pre-commit`）：[../GIT_HOOKS_SETUP.md](../GIT_HOOKS_SETUP.md)

> 本文只定方向与边界。具体脚本改动、manifest schema、历史重写命令等见 [TASK108](../../memory-bank/tasks/TASK108-course-content-split.md)。

---

## 8. 实施记录（2026-11-23）

**止血已完成**

| 动作 | 结果 |
| :--- | :--- |
| 备份 | 改写前的全量镜像 + 123 个 `.mdx` 副本 |
| 私有仓 | `iamsail/opencodeCourse` 收下完整旧历史（`dev` = `5336b94`） |
| 公开仓 | `main` + `dev` 一起 `filter-repo` 改写后强推；`dev` 现在只有 8 节免费正文 + 7 个课程 JSON |
| 免费课 | 8 节（每门前 2 节）以新提交恢复，历史从零开始 |
| 本地 | 115 节正文留在工作区、写进 `.git/info/exclude`，`git status` 干净，`courses:validate` 仍 123/123 |

**实施时发现的三个坑（§5 未覆盖）**

1. **构建期闸门会静默空转**：`assert-no-gated-content.mjs` 的付费清单是从 `.mdx` 反推的，正文搬走后 `gated` 变成 0 条，脚本仍打印 ✔。
2. **拆完是 404，不是课表退化**：课时 URL 由 `generateStaticParams` 扫正文生成，文件不在则页面不存在，`dynamicParams = false` 直接 404。
3. **`main` 必须一起改写**：`main` 上有 64 个带 `gpgsig` 的网页合并提交，只改 `dev` 会让两条分支对同一次提交产生两个哈希（`main..dev` 从 18 条涨到 141 条），以后无法 merge。

**残留风险与决定**

强推后旧对象仍可按 SHA 访问（实测 `/commit/48b66bc`、`/blob/48b66bc/...` 返回 200），GitHub 不会主动回收。决定**不删库**：收益只覆盖"手里已有 SHA 的人"，代价却是 62 个 PR、Actions secret 与 Pages 配置。若要零残留，走 GitHub Support 请求 GC。

**当前状态：公开仓是半成品。** 课表会退化到 8 节、115 个课时 URL 404。manifest 是下一步；在它落地前**不要把课程合到 `main`**。

---

## 9. 接入架构（2026-11-23 落地）

§8 只做到「正文搬走」；§9 是搬走之后站点怎么继续完整。

### 9.1 两个仓库的分工

| 仓库 | 内容 | 谁消费 |
| :--- | :--- | :--- |
| **公开仓** `iamsail/opencodeguide` | 站点代码、课程 JSON（价格/卖点）、`access.json`、`manifest.json`、8 节免费正文 | GitHub Pages（公开站） |
| **私有仓** `iamsail/opencodeCourse` | 123 节正文（`.mdx`，含 8 节免费节的源），未来英文正文 | 本地/成员的 members 构建 |
| **成员站** learn.opencodeguide.com | 由「公开仓代码 + 私有仓正文」构建出的 `out-members/` | Cloudflare Worker + D1 门禁 |

代码只有一份（公开仓）。私有仓只存正文——不做整站 fork，避免两份代码漂移。

### 9.2 构建期怎么取正文：双根 + 模式分流

实现：`lib/course-paths.ts`（应用侧）/ `scripts/courses/content-paths.mjs`（脚本侧，两份要同步）。

| 构建模式 | 正文查找顺序 | 说明 |
| :--- | :--- | :--- |
| `COURSE_ACCESS=public`（默认） | 只读公开根 | 公开构建永远看不到私有正文，这条不变量在没有私有仓的机器上也成立 |
| `COURSE_ACCESS=members` | **私有根 → 公开根** | 私有优先；私有根不存在直接报错，绝不产出「只有 8 节的成员站」 |

私有根默认 `../opencodeCourse/content/courses`（两个仓同级 clone 时零配置），可用 `COURSE_PRIVATE_DIR` 覆盖。

`manifest.json` 决定**课表**（123 节），文件系统决定**哪几节有正文**——两者解耦，所以「公开仓只有 8 节正文」和「课表完整 + 115 个锁定页」同时成立。manifest 刻意不含正文，也不含 `hasBody`。

### 9.3 免费试听是派生产物

公开仓里那 8 节不手拷，由 `npm run courses:export-free` 从私有仓导出：

- 规则：manifest 顺序每门前 `access.json` 的 `freeLessonLimit` 节 + frontmatter 显式 `free: true`
- 产物：复制/删除公开根里的课时文件，顺带刷新 `.gitignore` 的免费试听区块
- `npm run courses:export-free:check` 只比对不写入，给 CI 用

### 9.4 三层护栏

| 层 | 机制 | 拦什么 |
| :--- | :--- | :--- |
| 仓库 | `.gitignore` 里自动生成的区块：`content/courses/zh/**/*.mdx` 整体忽略，只放行 8 节 | 付费正文被 `git add -A` 带上 |
| 提交 | `.githooks/pre-commit` → `scripts/courses/check-staged-lessons.mjs` | 强制 `git add -f` 进来的付费正文 |
| 构建 | `courses:assert`：manifest 付费清单 + `git ls-files` 检查 + 115 个锁定页必须存在 | 产物泄露、锁定页缺失、仓库混入 |

### 9.5 日常操作

| 要做什么 | 命令 |
| :--- | :--- |
| 改一节正文 | 在私有仓改 `.mdx` |
| 让课表/标题变更生效 | `npm run courses:manifest`（在私有环境）→ 提交公开仓的 `manifest.json` |
| 免费试听节有变动 | `npm run courses:export-free` → 一起提交 |
| 本地起公开站 | `npm run build`（不读私有根） |
| 本地起成员站 | `npm run build:members`（默认读 `../opencodeCourse`） |

### 9.6 验证矩阵（2026-11-23 实测）

| 场景 | 结果 |
| :--- | :--- |
| 公开仓只有 8 节正文 → `npm run build` | ✅ 通过；课时页 123、锁定页 115、正文页 8；sitemap 课时 URL 8 条 |
| `courses:assert` | ✅ 公开 8 / 锁定 115 / 仓库内付费正文 0 |
| 往 git 索引塞一节付费正文 | ✅ exit 1 |
| 把付费正文拷进公开根（不 add） | ✅ 被 `.gitignore` 忽略，`check-ignore` 命中第 59 行 |
| 强制 `git add -f` 后提交 | ✅ pre-commit exit 1，点名文件 |
| 成员构建（私有根默认路径） | ✅ `out-members/` 课时页 123、锁定页 0、付费课页面含正文 |
| members 缺私有根 | ✅ exit 1，给出应设置的路径 |
| `tsc --noEmit` | ✅ 0 错误 |

---

## 10. 发布流程（2026-11-23）

内容改动只做一次动作：

| 想做什么 | 命令 |
| :--- | :--- |
| 改了一节课正文 | `npm run publish` |
| 只发正文，不动公开站 | `npm run publish:content` |
| 只同步 manifest / 免费试听节 | `npm run publish:metadata` |
| CI 校验一致性（不写不部署） | `npm run publish:check` |
| 先看看会做什么 | `npm run publish -- --dry-run` |
| 只构建 + 自检，不部署 | `npm run publish -- --skip-deploy` |

`npm run publish` 内部顺序（任一步失败即停止）：

1. **preflight**：确认私有正文根可读（`COURSE_PRIVATE_DIR` 或 `../opencodeCourse`）
2. **元数据**：`courses:manifest` + `courses:export-free`
3. **提交**：只 stage `content/courses/manifest.json`、`content/courses/zh`、`.gitignore` 三处，**绝不 `git add -A`**
4. **成员站**：`build:members` → `assert-members-pages`（123 节逐页确认有正文、无锁定页、无死链）
5. **部署**：`wrangler deploy`
6. **推送**：默认**不推**；`--push` 才推，且必须带 `GIT_PUSH_CONFIRMED=yes GIT_PUSH_NETWORK=<网络名>`

两条设计取舍：

- **公开站只在元数据/免费边界变化时重建**。改一节正文不会触发公开仓提交，因此不会重建公开站——
  正文只在成员站生效，公开站的锁定页本来就与正文无关。
- **部署前一定自检**。成员站最危险的失败不是报错，而是"静默降级成只有 8 节的站点"：
  付费用户点进去看到锁定页。`assert-members-pages` 用「每节正文抽多条探针」做逐页确认。

发布基线（实测）见 [`10-publish-baseline.md`](./10-publish-baseline.md)：
公开站构建 12–26 秒、成员站构建 19 秒、自检 0.2 秒；部署上传耗时待凭据就绪后补测。
