# 项目路由映射表 (Route Map)

本文档列出了项目中目前所有的页面路由及其对应的功能说明。

## 首页 (Main)
| 路由路径 (Route) | 对应文件路径 (File Path) | 功能说明 (Description) |
| :--- | :--- | :--- |
| `/` | `app/(main)/page.tsx` | **项目主页 (Landing Page)**<br>包含 Hero 区域、特性介绍、对比表格以及入口链接。 |

## 英文文档 (English Documentation)
| 路由路径 (Route) | 对应文件路径 (File Path) | 功能说明 (Description) |
| :--- | :--- | :--- |
| `/en/what-is-opencode` | `app/(main)/en/what-is-opencode/page.mdx` | **Introduction**<br>介绍什么是 OpenCode，核心理念和价值。 |
| `/en/installation` | `app/(main)/en/installation/page.mdx` | **Installation**<br>英文版安装指南，包含环境要求和安装步骤。 |
| `/en/cli-commands` | `app/(main)/en/cli-commands/page.mdx` | **CLI Reference**<br>OpenCode 命令行工具的详细指令手册。 |
| `/en/opencode-vs-claude-code` | `app/(main)/en/opencode-vs-claude-code/page.mdx` | **Comparisons**<br>详细对比 OpenCode 与 Claude Code 的区别（隐私、成本、功能）。 |
| `/en/opencode-with-ollama` | `app/(main)/en/opencode-with-ollama/page.mdx` | **Local Models**<br>如何配置 OpenCode 使用 Ollama 运行本地模型。 |
| `/en/mcp-explained` | `app/(main)/en/mcp-explained/page.mdx` | **MCP Protocol**<br>模型上下文协议 (MCP) 的原理解析与应用。 |
| `/en/neovim-integration` | `app/(main)/en/neovim-integration/page.mdx` | **Integrations**<br>Neovim 编辑器集成指南。 |
| `/en/use-cases` | `app/(main)/en/use-cases/page.mdx` | **Use Cases**<br>常见使用场景和最佳实践示例。 |

## 中文文档 (Chinese Documentation)
| 路由路径 (Route) | 对应文件路径 (File Path) | 功能说明 (Description) |
| :--- | :--- | :--- |
| `/zh/what-is-opencode` | `app/(zh)/zh/what-is-opencode/page.mdx` | **介绍**<br>什么是 OpenCode，为中文用户介绍核心功能。 |
| `/zh/install` | `app/(zh)/zh/install/page.mdx` | **安装指南**<br>中文版安装教程，适配国内网络环境说明。 |
| `/zh/vs-claude-code` | `app/(zh)/zh/vs-claude-code/page.mdx` | **竞品对比**<br>OpenCode 与 Claude Code 的详细对比分析。 |
| `/zh/ollama-local-deploy` | `app/(zh)/zh/ollama-local-deploy/page.mdx` | **本地模型**<br>结合 Ollama 进行本地大模型部署与调用的教程。 |
| `/zh/what-is-mcp` | `app/(zh)/zh/what-is-mcp/page.mdx` | **协议解析**<br>什么是 MCP (Model Context Protocol) 及其重要性。 |

## 目录结构说明
- `app/(main)/`：包含主页和英文内容（路由组），共享相同的英文版布局。
- `app/(zh)/`：包含中文内容（路由组），使用独立的中文版布局（设置了 html lang="zh"）。
