<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Git Push Policy

- 未经用户明确要求，不要执行 `git commit` 或 `git push`；代码改完后先等用户确认。
- macOS 上 push 不需要网络确认。Windows / WSL / Linux 上每次 push 前必须人工确认：
  - 未连接 VPN；
  - 当前不是办公网络；
  - 记录当前 WiFi / 网络名称；
  - 手动输入 `ALLOW PUSH`。
- 非交互环境（agent、CI）必须显式放行：`GIT_PUSH_CONFIRMED=yes GIT_PUSH_NETWORK=<名称> git push`。
- 每个克隆首次使用时运行 `bash scripts/install-git-hooks.sh` 启用仓库自带的 `.githooks/pre-push` 检查；该脚本只修改当前仓库的本地 Git 配置。
- 详细说明见 [`docs/GIT_HOOKS_SETUP.md`](./docs/GIT_HOOKS_SETUP.md)。
