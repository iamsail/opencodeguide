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

## 中文指南与文章 (Chinese Hub & Articles)
| 路由路径 (Route) | 对应文件路径 (File Path) | 功能说明 (Description) |
| :--- | :--- | :--- |
| `/zh/opencode` | `app/(zh)/zh/opencode/page.mdx` | **OpenCode 中文指南 (Hub)**<br>中文权威入口，分发流量到核心子页面。 |
| `/zh/opencode-shi-shen-me` | `app/(zh)/zh/opencode-shi-shen-me/page.mdx` | **科普文章**<br>介绍什么是 OpenCode (Updated)。 |
| `/zh/opencode-shi-yong` | `app/(zh)/zh/opencode-shi-yong/page.mdx` | **科普文章**<br>基础命令与交互模式使用指南。 |
| `/zh/opencode-zhong-wen` | `app/(zh)/zh/opencode-zhong-wen/page.mdx` | **科普文章**<br>中文环境配置与优化说明。 |
| `/zh/install` | `app/(zh)/zh/install/page.mdx` | **安装指南**<br>中文版安装教程，适配国内网络环境说明。 |
| `/zh/vs-claude-code` | `app/(zh)/zh/vs-claude-code/page.mdx` | **竞品对比**<br>OpenCode 与 Claude Code 的详细对比分析。 |

## 中文官方文档镜像 (Chinese Documentation Center)
| 路由路径 (Route) | 对应文件路径 (File Path) | 功能说明 (Description) |
| :--- | :--- | :--- |
| `/zh/docs` | `app/(zh)/zh/docs/page.mdx` | **文档中心首页**<br>全新的中文文档聚合入口。 |
| `/zh/docs/intro` | `app/(zh)/zh/docs/intro/page.mdx` | **入门介绍**<br>对应官方 Intro 章节。 |
| `/zh/docs/config` | `app/(zh)/zh/docs/config/page.mdx` | **配置概览**<br>对应官方 Config 章节。 |
| `/zh/docs/usage` | `app/(zh)/zh/docs/usage/page.mdx` | **使用指南**<br>对应官方 Usage 章节。 |
| `/zh/docs/configure/tools` | `app/(zh)/zh/docs/configure/tools/page.mdx` | **详细配置**<br>对应官方 Configure 章节。 |
| `/zh/docs/develop/sdk` | `app/(zh)/zh/docs/develop/sdk/page.mdx` | **开发文档**<br>对应官方 Develop 章节。 |

## 目录结构说明
- `app/(main)/`：包含主页和英文内容（路由组），共享相同的英文版布局。
- `app/(zh)/`：包含中文内容（路由组），使用独立的中文版布局（设置了 html lang="zh"）。
