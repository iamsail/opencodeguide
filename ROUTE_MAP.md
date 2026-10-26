# 项目路由映射表 (Route Map)

本文档列出了项目中所有的页面路由及其对应的功能说明与 SEO 策略。

## 1. 核心页面 (Core Pages)
| 路由 (Route) | 文件路径 (File Path) | 功能说明 (Description) |
| :--- | :--- | :--- |
| `/` | `app/(main)/page.tsx` | 项目主页 (Landing Page) |
| `/zh/opencode` | `app/(zh)/zh/opencode/page.mdx` | 中文指南总入口 (Hub) - 引导用户前往文档中心 |
| `/about` | `app/(main)/about/page.mdx` | 关于我们 (About Us) |
| `/contact` | `app/(main)/contact/page.mdx` | 联系我们 (Contact Us) |
| `/privacy` | `app/(main)/privacy/page.mdx` | 隐私政策 (Privacy Policy) |

## 2. 英文文档 (English Documentation)
| 路由 (Route) | 对应中文对等页 (ZH Equivalent) | 功能说明 (Description) |
| :--- | :--- | :--- |
| `/en/what-is-opencode` | `/zh/docs/intro` | Introduction |
| `/en/oh-my-opencode` | `/zh/docs/usage` | **Oh My OpenCode Hub (Agent workflows)** |
| `/en/oh-my-opencode/quick-start` | `/zh/docs/usage` | Oh My OpenCode Quick Start |
| `/en/installation` | `/zh/docs/intro` | Installation Guide |
| `/en/cli-commands` | `/zh/docs/cli` | CLI Commands Reference |
| `/en/cli-mcp` | `/zh/docs/cli` | CLI MCP Commands |
| `/en/mcp-explained` | `/zh/docs/mcp` | MCP Technical Deep Dive |
| `/en/opencode-mcp-use-cases` | `/zh/docs/usage` | MCP Use Cases |
| `/en/opencode-vs-claude-code` | `/zh/vs-claude-code` | Comparisons |
| `/en/opencode-with-ollama` | `/zh/docs/providers` | Local Models (Ollama) |
| `/en/mcp` | `/zh/docs/mcp` | **MCP Hub (Central Guide)** |
| `/en/opencode-skills` | `/zh/docs/configure/agent-skills` | **Agent Skills Guide** |
| `/en/skills` | `/zh/skills` | **Skills Ecosystem Hub** |
| `/en/opencode-agents` | `/zh/docs/configure/agents` | **Opencode Agents Guide** |
| `/en/mcp-configuration` | `/zh/docs/configure/mcp-servers` | MCP Configuration Guide |
| `/en/mcp-client` | `/zh/docs/develop/server` | MCP Client Architecture |
| `/en/neovim-integration` | `/zh/docs/ide` | Neovim Setup |
| `/en/use-cases` | `/zh/docs/usage` | Usage Scenarios |

### 2.1 SEO Landing Pages (Guides & Troubleshooting)
| 路由 (Route) | 功能说明 (Description) |
| :--- | :--- |
| `/en/opencode-claude` | **Opencode + Claude Guide** (Setup, Auth, Errors) |
| `/en/opencode-mcp` | **Opencode MCP Hub** (Tools, Playwright, Integrations) |
| `/en/opencode-anthropic-auth` | **Anthropic Authentication** (Key setup, env vars) |
| `/en/opencode-mcp-playwright` | **Playwright MCP Guide** (Browser automation) |
| `/en/opencode/errors/claude-credential-only-authorized` | **Error Fix**: "credential is only authorized for use with Claude Code" |
| `/en/oh-my-opencode-best-practices` | **Oh My OpenCode Quick Start** (Multi-agent guide) |
| `/en/how-to-update-opencode` | **Update Guide** (Manual & Auto update mechanism) |
| `/en/docs/configure/agents` | `/zh/docs/configure/agents` | **Agent Configuration** (Reference) |

## 3. 中文科普/引流文章 (Chinese SEO Articles)
这些页面主要用于外部引流，通过 `canonical` 将权重集中到官方文档。

| 路由 (Route) | 权威文档 (Canonical Docs) | 说明 (Notes) |
| :--- | :--- | :--- |
| `/zh/opencode-shi-shen-me` | `/zh/docs/intro` | 介绍页引流 |
| `/zh/opencode-shi-yong` | `/zh/docs/usage` | 使用指南引流 |
| `/zh/opencode-zhong-wen` | `/zh/docs/config` | 中文支持说明引流 |
| `/zh/install` | `/zh/docs/intro` | 安装教程引流 |
| `/zh/vs-claude-code` | - | 竞品对比专题 (与 `/en/...` 互链) |
| `/zh/opencode-claude` | - | **Opencode + Claude 使用指南** |
| `/zh/opencode-vs-cursor-claude` | - | **OpenCode vs Cursor vs Claude** |
| `/zh/oh-my-opencode-best-practices` | `/zh/docs/usage` | Oh My OpenCode 快速上手与最佳实践 |
| `/zh/how-to-update-opencode` | - | **官方更新指南** (与 `/en/...` 互链) |
| `/zh/what-is-opencode` | `/zh/docs/intro` | 什么是 OpenCode |
| `/zh/what-is-mcp` | `/zh/docs/mcp` | 什么是 MCP |
| `/zh/skills` | - | **技能生态中心** (Skills Ecosystem) |
| `/zh/ollama-local-deploy` | `/zh/docs/providers` | Ollama 本地部署 |

## 4. 中文官方文档中心 (Chinese Documentation Center - /zh/docs)
所有技术细节的唯一事实来源。采用分层路由架构。

### 4.1 入门 (Intro)
| 路由 (Route) | 说明 (Description) |
| :--- | :--- |
| `/zh/docs` | 文档中心首页 |
| `/zh/docs/intro` | 核心介绍与快速开始 |
| `/zh/docs/config` | 配置系统总览 |
| `/zh/docs/providers` | 模型提供商 (OpenAI, Claude, Ollama 等) |
| `/zh/docs/network` | 网络与代理配置 |
| `/zh/docs/enterprise` | 企业版功能 |
| `/zh/docs/troubleshooting` | 故障排除指南 |
| `/zh/docs/windows-wsl` | Windows (WSL) 运行指南 |
| `/zh/docs/migrating-to-1-0` | 1.0 迁移指南（v1 时代遗留） |
| `/zh/docs/migrating-to-v2` | 从 v1 迁移到 v2（v2 同步新增） |

### 4.2 使用 (Usage)
| 路由 (Route) | 说明 (Description) |
| :--- | :--- |
| `/zh/docs/usage` | 多模式使用概览（v1 遗留） |
| `/zh/docs/tui` | 终端交互界面 (TUI) 指南 |
| `/zh/docs/cli` | 命令行工具 (CLI) 指南 |
| `/zh/docs/cli/commands` | CLI 命令参考（v2 同步新增） |
| `/zh/docs/cli/config` | CLI 设置（v2 同步新增） |
| `/zh/docs/cli/providers` | `/connect` 连接提供商（v2 同步新增） |
| `/zh/docs/cli/web` | Web 界面与配对（v2 同步新增） |
| `/zh/docs/cli/theme` | CLI 主题命令（v2 同步新增） |
| `/zh/docs/cli/plugins` | CLI 插件命令（v2 同步新增） |
| `/zh/docs/ide` | VS Code / Neovim 编辑器集成（v1 遗留） |
| `/zh/docs/zen` | OpenCode Zen 精选模型列表（v1 遗留） |
| `/zh/docs/share` | 会话分享功能（v1 遗留） |
| `/zh/docs/github` | GitHub 集成（v1 遗留） |
| `/zh/docs/gitlab` | GitLab 集成（v1 遗留） |

### 4.3 配置 (Configure)
| 路由 (Route) | 说明 (Description) |
| :--- | :--- |
| `/zh/docs/configure/tools` | 工具权限与配置 |
| `/zh/docs/configure/rules` | 规则与指令（v2 instructions） |
| `/zh/docs/configure/agents` | 自定义智能体 |
| `/zh/docs/configure/models` | 详细模型参数配置 |
| `/zh/docs/configure/themes` | 主题与 UI 自定义 |
| `/zh/docs/configure/keybinds` | 快捷键绑定 |
| `/zh/docs/configure/commands` | 自定义命令 |
| `/zh/docs/configure/formatters` | 代码格式化器 |
| `/zh/docs/configure/permissions` | 细粒度权限控制 |
| `/zh/docs/configure/lsp-servers` | LSP 服务器集成（v1 遗留） |
| `/zh/docs/configure/mcp-servers` | MCP 服务器扩展 |
| `/zh/docs/configure/acp-support` | ACP 协议支持 |
| `/zh/docs/configure/agent-skills` | 智能体技能 (Skills) |
| `/zh/docs/configure/custom-tools` | 自定义工具开发（v1 遗留） |
| `/zh/docs/configure/plugins` | 插件配置（v2 同步新增） |
| `/zh/docs/configure/websearch` | 网络搜索（v2 同步新增） |
| `/zh/docs/configure/snapshots` | 快照（v2 同步新增） |
| `/zh/docs/configure/compaction` | 上下文压缩（v2 同步新增） |
| `/zh/docs/configure/references` | 引用（v2 同步新增） |
| `/zh/docs/configure/attachments` | 附件（v2 同步新增） |
| `/zh/docs/configure/policies` | 策略（v2 同步新增） |
| `/zh/docs/configure/warming` | 预热（v2 同步新增） |

### 4.4 开发 (Develop)
| 路由 (Route) | 说明 (Description) |
| :--- | :--- |
| `/zh/docs/develop` | Build 区概览（v2 同步新增） |
| `/zh/docs/develop/sdk` | OpenCode SDK 使用指南 |
| `/zh/docs/develop/sdk/cloudflare` | Cloudflare 部署 SDK（v2 同步新增） |
| `/zh/docs/develop/client` | JavaScript 客户端（v2 同步新增） |
| `/zh/docs/develop/plugins` | 插件系统开发 |
| `/zh/docs/develop/plugins/rpc` | 插件 RPC（v2 同步新增） |
| `/zh/docs/develop/plugins/cli` | 插件 CLI（v2 同步新增） |
| `/zh/docs/develop/plugins/migrate-v1` | 插件 v1 迁移（v2 同步新增） |
| `/zh/docs/develop/effect/plugins` | Effect 插件（v2 同步新增） |
| `/zh/docs/develop/effect/rpc` | Effect RPC（v2 同步新增） |
| `/zh/docs/develop/effect/client` | Effect 客户端（v2 同步新增） |
| `/zh/docs/develop/effect/sdk` | Effect SDK（v2 同步新增） |
| `/zh/docs/develop/server` | 集成服务端配置（v1 遗留） |
| `/zh/docs/develop/ecosystem` | 社区生态与扩展（v1 遗留） |

### 4.5 控制台 (Console)（v2 同步新增）
| 路由 (Route) | 说明 (Description) |
| :--- | :--- |
| `/zh/docs/console` | OpenCode Console 介绍 |
| `/zh/docs/console/models` | 控制台模型管理 |
| `/zh/docs/console/providers` | 控制台提供商 |
| `/zh/docs/console/websearch` | 控制台网络搜索 |
| `/zh/docs/console/go` | OpenCode Go 订阅 |
| `/zh/docs/console/workspaces` | 工作区基础 |
| `/zh/docs/console/members` | 成员管理 |
| `/zh/docs/console/sso` | SSO 单点登录 |
| `/zh/docs/console/scim` | SCIM 配置同步 |
| `/zh/docs/console/budgets` | 预算管理 |
| `/zh/docs/console/billing` | 账单 |
| `/zh/docs/console/api` | 控制台 API 概览 |
| `/zh/docs/console/api/inference` | 推理 API |
| `/zh/docs/console/api/providers` | 提供商 API |
| `/zh/docs/console/harnesses` | Harnesses 概览 |
| `/zh/docs/console/harnesses/claude-code` | Claude Code Harness |
| `/zh/docs/console/harnesses/codex` | Codex Harness |
| `/zh/docs/console/harnesses/hermes` | Hermes Harness |
| `/zh/docs/console/harnesses/pi` | Pi Harness |
| `/zh/docs/console/harnesses/raycast` | Raycast Harness |

## 5. 韩国语页面 (Korean Version)
| 路由 (Route) | 说明 (Description) |
| :--- | :--- |
| `/ko/opencode` | 韩国语落地页 (Korean Landing Page) |

---
**SEO 说明**：
1. **Canonical**: 所有引流文章均指向对应的 `/zh/docs/` 页面。
2. **Hreflang**: 核心页面均已配置 `alternates.languages`，实现中英版本互认。
