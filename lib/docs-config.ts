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
        title: "MCP Explained",
        href: "/en/mcp-explained",
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

export const docsConfigZh: DocsConfig = [
  {
    title: "Intro (入门)",
    items: [
      { title: "介绍 (Intro)", href: "/zh/intro" },
      { title: "配置 (Config)", href: "/zh/config" },
      { title: "模型提供商 (Providers)", href: "/zh/providers" },
      { title: "网络 (Network)", href: "/zh/network" },
      { title: "企业版 (Enterprise)", href: "/zh/enterprise" },
      { title: "故障排查 (Troubleshooting)", href: "/zh/troubleshooting" },
      { title: "迁移指南 (Migrating to 1.0)", href: "/zh/migrating-to-1-0" },
    ],
  },
  {
    title: "Usage (使用指南)",
    items: [
      { title: "使用概览 (Usage)", href: "/zh/usage" },
      { title: "终端界面 (TUI)", href: "/zh/tui" },
      { title: "命令行 (CLI)", href: "/zh/cli" },
      { title: "编辑器集成 (IDE)", href: "/zh/ide" },
      { title: "专注模式 (Zen)", href: "/zh/zen" },
      { title: "分享 (Share)", href: "/zh/share" },
      { title: "GitHub 集成", href: "/zh/github" },
      { title: "GitLab 集成", href: "/zh/gitlab" },
    ],
  },
  {
    title: "Configure (详细配置)",
    items: [
      { title: "工具 (Tools)", href: "/zh/tools" },
      { title: "规则 (Rules)", href: "/zh/rules" },
      { title: "智能体 (Agents)", href: "/zh/agents" },
      { title: "模型 (Models)", href: "/zh/models" },
      { title: "主题 (Themes)", href: "/zh/themes" },
      { title: "快捷键 (Keybinds)", href: "/zh/keybinds" },
      { title: "命令 (Commands)", href: "/zh/commands" },
      { title: "格式化 (Formatters)", href: "/zh/formatters" },
      { title: "权限 (Permissions)", href: "/zh/permissions" },
      { title: "LSP 服务器", href: "/zh/lsp-servers" },
      { title: "MCP 服务器", href: "/zh/mcp-servers" },
      { title: "ACP 支持", href: "/zh/acp-support" },
      { title: "技能 (Skills)", href: "/zh/agent-skills" },
      { title: "自定义工具", href: "/zh/custom-tools" },
    ],
  },
  {
    title: "Develop (开发)",
    items: [
      { title: "SDK", href: "/zh/sdk" },
      { title: "服务器 (Server)", href: "/zh/server" },
      { title: "插件 (Plugins)", href: "/zh/plugins" },
      { title: "生态系统 (Ecosystem)", href: "/zh/ecosystem" },
    ],
  },
]
