# 项目路由映射表 (Route Map)

本文档列出了项目中所有的页面路由及其对应的功能说明与 SEO 策略。

## 1. 核心页面 (Core Pages)
| 路由 (Route) | 文件路径 (File Path) | 功能说明 (Description) |
| :--- | :--- | :--- |
| `/` | `app/(main)/page.tsx` | 项目主页 (Landing Page) |
| `/zh/opencode` | `app/(zh)/zh/opencode/page.mdx` | 中文指南总入口 (Hub) - 引导用户前往文档中心 |

## 2. 英文文档 (English Documentation)
| 路由 (Route) | 对应中文对等页 (ZH Equivalent) | 功能说明 (Description) |
| :--- | :--- | :--- |
| `/en/what-is-opencode` | `/zh/docs/intro` | Introduction |
| `/en/installation` | `/zh/docs/intro` | Installation Guide |
| `/en/cli-commands` | `/zh/docs/cli` | CLI Commands Reference |
| `/en/opencode-vs-claude-code` | `/zh/vs-claude-code` | Comparisons |
| `/en/opencode-with-ollama` | `/zh/docs/providers` | Local Models (Ollama) |
| `/en/mcp` | `/zh/docs/mcp` | **MCP Hub (Central Guide)** |
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
| `/zh/docs/troubleshooting` | 常见问题排查 |
| `/zh/docs/migrating-to-1-0` | 1.0 迁移指南 |

### 4.2 使用 (Usage)
| 路由 (Route) | 说明 (Description) |
| :--- | :--- |
| `/zh/docs/usage` | 多模式使用概览 |
| `/zh/docs/tui` | 终端交互界面 (TUI) 指南 |
| `/zh/docs/cli` | 命令行工具 (CLI) 指南 |
| `/zh/docs/ide` | VS Code / Neovim 编辑器集成 |
| `/zh/docs/zen` | 专注模式 (Zen Mode) |
| `/zh/docs/share` | 会话分享功能 |
| `/zh/docs/github` | GitHub 集成 |
| `/zh/docs/gitlab` | GitLab 集成 |

### 4.3 配置 (Configure)
| 路由 (Route) | 说明 (Description) |
| :--- | :--- |
| `/zh/docs/configure/tools` | 工具权限与配置 |
| `/zh/docs/configure/rules` | 指令与规则文件 |
| `/zh/docs/configure/agents` | 自定义智能体 |
| `/zh/docs/configure/models` | 详细模型参数配置 |
| `/zh/docs/configure/themes` | 主题与 UI 自定义 |
| `/zh/docs/configure/keybinds` | 快捷键绑定 |
| `/zh/docs/configure/commands` | 自定义命令 |
| `/zh/docs/configure/formatters` | 代码格式化器 |
| `/zh/docs/configure/permissions` | 细粒度权限控制 |
| `/zh/docs/configure/lsp-servers` | LSP 服务器集成 |
| `/zh/docs/configure/mcp-servers` | MCP 服务器扩展 |
| `/zh/docs/configure/acp-support` | ACP 协议支持 |
| `/zh/docs/configure/agent-skills` | 智能体技能库 |
| `/zh/docs/configure/custom-tools` | 自定义工具开发 |

### 4.4 开发 (Develop)
| 路由 (Route) | 说明 (Description) |
| :--- | :--- |
| `/zh/docs/develop/sdk` | OpenCode SDK 使用指南 |
| `/zh/docs/develop/server` | 集成服务端配置 |
| `/zh/docs/develop/plugins` | 插件系统开发 |
| `/zh/docs/develop/ecosystem` | 社区生态与扩展 |

---
**SEO 说明**：
1. **Canonical**: 所有引流文章均指向对应的 `/zh/docs/` 页面。
2. **Hreflang**: 核心页面均已配置 `alternates.languages`，实现中英版本互认。
