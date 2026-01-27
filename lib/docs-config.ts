export type DocsConfig = {
  title: string
  items: {
    title: string
    href: string
    disabled?: boolean
  }[]
}[]

export const docsConfigEn: DocsConfig = [
  {
    title: "Introduction",
    items: [
      {
        title: "What is OpenCode?",
        href: "/en/what-is-opencode",
      },
      {
        title: "MCP Guide",
        href: "/en/mcp",
      },
      {
        title: "MCP Use Cases",
        href: "/en/opencode-mcp-use-cases",
      },
    ],
  },
  {
    title: "Oh My OpenCode",
    items: [
      {
        title: "Overview",
        href: "/en/oh-my-opencode",
      },
      {
        title: "Quick Start",
        href: "/en/oh-my-opencode/quick-start",
      },
      {
        title: "Best Practices",
        href: "/en/oh-my-opencode-best-practices",
      },
    ],
  },
  {
    title: "Getting Started",
    items: [
      {
        title: "Installation",
        href: "/en/installation",
      },
      {
        title: "CLI Commands",
        href: "/en/cli-commands",
      },
      {
        title: "CLI MCP Commands",
        href: "/en/cli-mcp",
      },
      {
        title: "Update Guide",
        href: "/en/how-to-update-opencode",
      },
    ],
  },
  {
    title: "Guides & Integrations",
    items: [
      {
        title: "Ollama Integration",
        href: "/en/opencode-with-ollama",
      },
      {
        title: "Claude Integration",
        href: "/en/opencode-claude",
      },
      {
        title: "MCP Tools",
        href: "/en/opencode-mcp",
      },
      {
        title: "Playwright MCP",
        href: "/en/opencode-mcp-playwright",
      },
      {
        title: "Anthropic Auth",
        href: "/en/opencode-anthropic-auth",
      },
      {
        title: "Neovim Setup",
        href: "/en/neovim-integration",
      },
      {
        title: "Use Cases",
        href: "/en/use-cases",
      },
    ],
  },
  {
    title: "Comparisons",
    items: [
      {
        title: "OpenCode vs Claude Code",
        href: "/en/opencode-vs-claude-code",
      },
    ],
  },
]

export const docsConfigKo: DocsConfig = [
  {
    title: "소개",
    items: [
      {
        title: "OpenCode란 무엇인가?",
        href: "/ko/opencode",
      },
      {
        title: "영문 가이드",
        href: "/en/what-is-opencode",
      },
    ],
  },
]

export const guideConfigZh: DocsConfig = [
  {
    title: "指南 (Guide)",
    items: [
      { title: "OpenCode 介绍", href: "/zh/opencode" },
      { title: "什么是 OpenCode", href: "/zh/what-is-opencode" },
      { title: "OpenCode 是什么", href: "/zh/opencode-shi-shen-me" },
      { title: "安装指南", href: "/zh/install" },
      { title: "更新指南", href: "/zh/how-to-update-opencode" },
      { title: "基础使用", href: "/zh/opencode-shi-yong" },
      { title: "中文支持", href: "/zh/opencode-zhong-wen" },
      { title: "Claude 集成", href: "/zh/opencode-claude" },
      { title: "对比 Cursor & Claude", href: "/zh/opencode-vs-cursor-claude" },
      { title: "对比 Claude Code", href: "/zh/vs-claude-code" },
      { title: "什么是 MCP", href: "/zh/what-is-mcp" },
      { title: "Ollama 本地部署", href: "/zh/ollama-local-deploy" },
      { title: "最佳实践", href: "/zh/oh-my-opencode-best-practices" },
    ],
  },
]

export const docsConfigZh: DocsConfig = [
  {
    title: "Intro (入门)",
    items: [
      { title: "介绍 (Intro)", href: "/zh/docs/intro" },
      { title: "配置 (Config)", href: "/zh/docs/config" },
      { title: "模型提供商 (Providers)", href: "/zh/docs/providers" },
      { title: "网络 (Network)", href: "/zh/docs/network" },
      { title: "企业版 (Enterprise)", href: "/zh/docs/enterprise" },
      { title: "故障排查 (Troubleshooting)", href: "/zh/docs/troubleshooting" },
      { title: "迁移指南 (Migrating to 1.0)", href: "/zh/docs/migrating-to-1-0" },
    ],
  },
  {
    title: "Usage (使用指南)",
    items: [
      { title: "使用概览 (Usage)", href: "/zh/docs/usage" },
      { title: "终端界面 (TUI)", href: "/zh/docs/tui" },
      { title: "命令行 (CLI)", href: "/zh/docs/cli" },
      { title: "编辑器集成 (IDE)", href: "/zh/docs/ide" },
      { title: "专注模式 (Zen)", href: "/zh/docs/zen" },
      { title: "分享 (Share)", href: "/zh/docs/share" },
      { title: "GitHub 集成", href: "/zh/docs/github" },
      { title: "GitLab 集成", href: "/zh/docs/gitlab" },
    ],
  },
  {
    title: "Configure (详细配置)",
    items: [
      { title: "工具 (Tools)", href: "/zh/docs/configure/tools" },
      { title: "规则 (Rules)", href: "/zh/docs/configure/rules" },
      { title: "智能体 (Agents)", href: "/zh/docs/configure/agents" },
      { title: "模型 (Models)", href: "/zh/docs/configure/models" },
      { title: "主题 (Themes)", href: "/zh/docs/configure/themes" },
      { title: "快捷键 (Keybinds)", href: "/zh/docs/configure/keybinds" },
      { title: "命令 (Commands)", href: "/zh/docs/configure/commands" },
      { title: "格式化 (Formatters)", href: "/zh/docs/configure/formatters" },
      { title: "权限 (Permissions)", href: "/zh/docs/configure/permissions" },
      { title: "LSP 服务器", href: "/zh/docs/configure/lsp-servers" },
      { title: "MCP 服务器", href: "/zh/docs/configure/mcp-servers" },
      { title: "ACP 支持", href: "/zh/docs/configure/acp-support" },
      { title: "智能体技能 (Skills)", href: "/zh/docs/configure/agent-skills" },
      { title: "自定义工具", href: "/zh/docs/configure/custom-tools" },
    ],
  },
  {
    title: "Develop (开发)",
    items: [
      { title: "SDK", href: "/zh/docs/develop/sdk" },
      { title: "服务器 (Server)", href: "/zh/docs/develop/server" },
      { title: "插件 (Plugins)", href: "/zh/docs/develop/plugins" },
      { title: "生态系统 (Ecosystem)", href: "/zh/docs/develop/ecosystem" },
    ],
  },
]
