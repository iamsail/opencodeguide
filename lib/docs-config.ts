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
    title: "入门",
    items: [
      {
        title: "什么是 OpenCode？",
        href: "/zh/opencode-shi-shen-me",
      },
      {
        title: "使用指南",
        href: "/zh/opencode-shi-yong",
      },
      {
        title: "中文支持",
        href: "/zh/opencode-zhong-wen",
      },
      {
        title: "安装指南",
        href: "/zh/install",
      },
    ],
  },
  {
    title: "深度指南",
    items: [
      {
        title: "本地部署 (Ollama)",
        href: "/zh/ollama-local-deploy",
      },
      {
        title: "理解 MCP 协议",
        href: "/zh/what-is-mcp",
      },
      {
        title: "VS Claude Code",
        href: "/zh/vs-claude-code",
      },
    ],
  },
]
