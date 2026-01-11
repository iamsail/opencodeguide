# 项目路由映射表 (Route Map)

本文档列出了项目中目前所有的页面路由及其对应的功能说明。

## 首页 (Main)
| 路由路径 (Route) | 对应文件路径 (File Path) | 功能说明 (Description) |
| :--- | :--- | :--- |
| \`/\` | \`app/(main)/page.tsx\` | **项目主页 (Landing Page)**<br>包含 Hero 区域、特性介绍、对比表格以及入口链接。 |

## 英文文档 (English Documentation)
| 路由路径 (Route) | 对应文件路径 (File Path) | 功能说明 (Description) |
| :--- | :--- | :--- |
| \`/en/what-is-opencode\` | \`app/(main)/en/what-is-opencode/page.mdx\` | **Introduction**<br>介绍什么是 OpenCode，核心理念和价值。 |
| \`/en/installation\` | \`app/(main)/en/installation/page.mdx\` | **Installation**<br>英文版安装指南，包含环境要求和安装步骤。 |
| \`/en/cli-commands\` | \`app/(main)/en/cli-commands/page.mdx\` | **CLI Reference**<br>OpenCode 命令行工具的详细指令手册。 |
| \`/en/opencode-vs-claude-code\` | \`app/(main)/en/opencode-vs-claude-code/page.mdx\` | **Comparisons**<br>详细对比 OpenCode 与 Claude Code 的区别（隐私、成本、功能）。 |
| \`/en/opencode-with-ollama\` | \`app/(main)/en/opencode-with-ollama/page.mdx\` | **Local Models**<br>如何配置 OpenCode 使用 Ollama 运行本地模型。 |
| \`/en/mcp-explained\` | \`app/(main)/en/mcp-explained/page.mdx\` | **MCP Protocol**<br>模型上下文协议 (MCP) 的原理解析与应用。 |
| \`/en/neovim-integration\` | \`app/(main)/en/neovim-integration/page.mdx\` | **Integrations**<br>Neovim 编辑器集成指南。 |
| \`/en/use-cases\` | \`app/(main)/en/use-cases/page.mdx\` | **Use Cases**<br>常见使用场景和最佳实践示例。 |

## 中文指南与文章 (Chinese Hub & Articles)
| 路由路径 (Route) | 对应文件路径 (File Path) | 功能说明 (Description) |
| :--- | :--- | :--- |
| \`/zh/opencode\` | \`app/(zh)/zh/opencode/page.mdx\` | **OpenCode 中文指南 (Hub)**<br>中文权威入口，分发流量到核心子页面。 |
| \`/zh/opencode-shi-shen-me\` | \`app/(zh)/zh/opencode-shi-shen-me/page.mdx\` | **科普文章** (Canonical -> \`/zh/docs/intro\`) |
| \`/zh/opencode-shi-yong\` | \`app/(zh)/zh/opencode-shi-yong/page.mdx\` | **科普文章** (Canonical -> \`/zh/docs/usage\`) |
| \`/zh/opencode-zhong-wen\` | \`app/(zh)/zh/opencode-zhong-wen/page.mdx\` | **科普文章** (Canonical -> \`/zh/docs/config\`) |
| \`/zh/install\` | \`app/(zh)/zh/install/page.mdx\` | **安装指南** (Canonical -> \`/zh/docs/intro\`) |
| \`/zh/vs-claude-code\` | \`app/(zh)/zh/vs-claude-code/page.mdx\` | **竞品对比** (与英文版 \`/en/opencode-vs-claude-code\` 互链) |

## 中文官方文档镜像 (Chinese Documentation Center)
| 路由路径 (Route) | 对应文件路径 (File Path) | 功能说明 (Description) |
| :--- | :--- | :--- |
| \`/zh/docs\` | \`app/(zh)/zh/docs/page.mdx\` | **文档中心首** |
| \`/zh/docs/intro\` | \`app/(zh)/zh/docs/intro/page.mdx\` | 入门介绍 |
| \`/zh/docs/config\` | \`app/(zh)/zh/docs/config/page.mdx\` | 配置概览 |
| \`/zh/docs/usage\` | \`app/(zh)/zh/docs/usage/page.mdx\` | 使用指南 |
| \`/zh/docs/cli\` | \`app/(zh)/zh/docs/cli/page.mdx\` | 命令行指南 |
| \`/zh/docs/ide\` | \`app/(zh)/zh/docs/ide/page.mdx\` | 编辑器集成 |
| \`/zh/docs/configure/tools\` | \`app/(zh)/zh/docs/configure/tools/page.mdx\` | 详细工具配置 |
| \`/zh/docs/configure/mcp-servers\` | \`app/(zh)/zh/docs/configure/mcp-servers/page.mdx\` | MCP 服务器配置 |
| \`/zh/docs/develop/sdk\` | \`app/(zh)/zh/docs/develop/sdk/page.mdx\` | SDK 开发文档 |

## 目录结构说明
- \`app/(main)/\`：包含主页和英文内容（路由组），共享相同的英文版布局。
- \`app/(zh)/\`：包含中文内容（路由组），使用独立的中文版布局（设置了 html lang="zh"）。
- **SEO 策略**：科普文章通过 \`alternates.canonical\` 指向官方文档页，避免权重分散。中英文对等页通过 \`alternates.languages\` 进行关联。
