# Git Hooks 配置指南（push 前网络检查 + 提交前密钥检查）

本仓库在 `git push` 前强制执行一次网络环境确认，策略与 `autoxhs` 仓库一致：**未连接 VPN、当前不是办公网络、记录 WiFi/网络名称、输入 `ALLOW PUSH`**，全部满足才允许推送。

- macOS：跳过检查。
- Windows / WSL / Linux：每次 push 都检查。
- 非交互环境（agent、CI、输出被重定向）：默认阻断，必须显式声明环境变量才放行。

## 启用

```bash
bash scripts/install-git-hooks.sh
```

脚本做两件事：

1. 给 `.githooks/pre-push` 与 `.githooks/pre-commit` 添加执行权限；
2. 把**当前仓库**的 `core.hooksPath` 设为 `.githooks`。

不会修改全局 Git 配置，也不影响其他仓库。

验证：

```bash
git config --local --get core.hooksPath   # 期望输出：.githooks
ls -l .githooks/pre-push .githooks/pre-commit   # 期望都带可执行权限
```

`core.hooksPath` 是本地配置，不会随仓库克隆自动生效，每个新克隆都需要执行一次安装脚本。

## 检查项

### pre-push（网络环境）

| 检查项 | 行为 |
| --- | --- |
| 交互终端 | stdout 不是终端（agent / CI / 重定向）时直接阻断 |
| VPN | 回答 `y` 则阻断，提示先断开 VPN |
| 办公网络 | 回答 `y` 则阻断 |
| WiFi / 网络名称 | 去空白后为空则阻断；填写后记录到通过信息中 |
| 二次确认 | 必须完整输入 `ALLOW PUSH` |

检查通过时输出：

```text
Network check passed for network: <你填写的网络名称>
```

## 非交互环境（agent / CI）

```bash
GIT_PUSH_CONFIRMED=yes GIT_PUSH_NETWORK=HomeWiFi git push
```

- `GIT_PUSH_CONFIRMED=yes`：显式声明已确认网络环境。
- `GIT_PUSH_NETWORK`：记录当前 WiFi/网络名称；缺省时记为 `unknown` 并打印警告。

## 应急跳过

```bash
git push --no-verify
```

仅用于钩子自身故障等紧急情况。仓库策略仍然要求推送前人工确认网络环境。

## 常见问题

- **钩子没生效**：确认执行过 `bash scripts/install-git-hooks.sh`，且 `git config --local --get core.hooksPath` 输出 `.githooks`；确认 `.githooks/pre-push` 有可执行权限。
- **在终端里仍提示 `interactive confirmation is required`**：stdout 被重定向或由 GUI/IDE 的 Git 集成接管时（例如 `git push > log.txt`）会出现，属于有意设计的 fail-closed 行为，改用环境变量方式推送。
- **Windows 原生 `git.exe`**：钩子由 Git Bash 执行，需保证 bash 可用；在 WSL 内执行不受影响。
- **为什么不用 `[[ -t 0 ]]` 判断交互**：`pre-push` 的 stdin 是 Git 传入的 ref 列表管道，永远不是终端，用它判断会让交互分支永远不可达。脚本改用 stdout 判断是否有人可交互，并从 `/dev/tty` 读取回答；stdin 保持不动，避免 Git 写 ref 列表时报错。
- **临时查看配置**：`git config --local --list | grep hooksPath`。

## 与参考项目（autoxhs）的差异

- `core.hooksPath` 使用相对路径 `.githooks`（参考项目为绝对路径），更换机器或挂载路径后仍有效。
- 修复了 stdin 不是终端导致交互分支不可达的问题。
- 不提供 `npm install` 的 `postinstall` 自动配置，避免安装依赖时隐式修改 Git 配置。

## pre-commit（密钥护栏）

本仓库是**公开仓库**，密钥一旦提交就会永久留在 git 历史里（删文件、force push 都清不干净）。`pre-commit` 在本地拦一道：

| 检查 | 行为 |
| --- | --- |
| 文件名 | 拦截 `.dev.vars`、`.env`、`.env.local`、`*.pem`、`*.key`、`id_rsa`、`credentials.json` 等；`*.example` / `*.sample` / `*.template` 放行 |
| 内容 | 扫描暂存区（`git grep --cached`），匹配 `sk_live_`、`sk_test_`、`rk_live_`、`whsec_`、`GOCSPX-`、`re_`、`ghp_`、`github_pat_`、`AKIA…`、`BEGIN … PRIVATE KEY` 等形态 |
| 输出 | 命中值**打码**成 `[REDACTED]`，避免日志二次泄露 |

误报放行：

```bash
GIT_ALLOW_SECRETS=yes git commit -m "..."
```

### 密钥不该进仓库时的正确做法

| 场景 | 做法 |
| --- | --- |
| 线上 Worker 的 secret | `npx wrangler secret put <NAME>`（存 Cloudflare，不落文件） |
| 本地联调 | `workers/course-delivery/.dev.vars`（已 gitignore）+ `.dev.vars.example` 模板入库 |
| 多机器同步 | 密码管理器，或每台机器重新生成 `SESSION_SECRET`（`openssl rand -hex 32`） |

> 护栏不是安全边界。真正的边界是「真实密钥不写进任何被跟踪的文件」。
