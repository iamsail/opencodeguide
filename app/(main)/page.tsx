import Link from "next/link";
import { ArrowRight, Terminal, Cpu, Zap, Lock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-24 lg:py-32 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
        <div className="mb-6 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
          The Unofficial OpenCode Guide
        </div>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl text-gray-900 mb-6">
          Master your local <br className="hidden sm:inline" /> coding agent.
        </h1>
        <p className="max-w-[42rem] leading-normal text-gray-500 sm:text-xl sm:leading-8 mb-10">
          OpenCode is the offline-first, plugin-driven alternative to cloud coding assistants. 
          Learn how to run it with Ollama, connect via MCP, and integrate with Neovim.
        </p>
        <div className="flex gap-4">
          <Link
            href="/en/installation"
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/zh/install"
            className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-8 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 placeholder:text-gray-400"
          >
            中文指南
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="w-full py-20 bg-gray-50 border-t border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <Terminal className="h-5 w-5 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold mb-2">CLI First</h3>
              <p className="text-gray-500 leading-relaxed">
                Built for the terminal. No Electron bloat. Runs purely in your shell with full access to your local environment.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <Cpu className="h-5 w-5 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold mb-2">Local Models</h3>
              <p className="text-gray-500 leading-relaxed">
                 First-class support for Ollama. Run Llama 3 or DeepSeek Coder locally without sending code to the cloud.
              </p>
            </div>
             <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <Zap className="h-5 w-5 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold mb-2">MCP Ready</h3>
              <p className="text-gray-500 leading-relaxed">
                Full implementation of the Model Context Protocol. Connect databases, APIs, and custom tools easily.
              </p>
            </div>
          </div>
        </div>
      </section>

       {/* Comparison Section (Feature Level) */}
      <section className="w-full py-24 px-4 container max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Why OpenCode?</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Designed for local-first workflows, offering a different approach compared to hosted assistants like Claude Code.
          </p>
        </div>
        
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-3 bg-gray-50 p-4 font-medium text-sm text-gray-500 border-b border-gray-200">
            <div>Feature</div>
            <div>OpenCode</div>
            <div>Claude Code</div>
          </div>
          <div className="divide-y divide-gray-200 text-sm">
            <div className="grid grid-cols-3 p-4 items-center">
              <div className="font-medium text-gray-900">Execution Environment</div>
              <div className="text-gray-700">Local (Your Machine)</div>
              <div className="text-gray-500">Cloud / SaaS</div>
            </div>
             <div className="grid grid-cols-3 p-4 items-center">
              <div className="font-medium text-gray-900">Model Support</div>
              <div className="text-gray-700">Any (Ollama, OpenAI, Anthropic, etc)</div>
              <div className="text-gray-500">Anthropic Only</div>
            </div>
             <div className="grid grid-cols-3 p-4 items-center">
              <div className="font-medium text-gray-900">Plugin System</div>
              <div className="text-gray-700">Open Ecosystem (npm)</div>
              <div className="text-gray-500">Controlled</div>
            </div>
             <div className="grid grid-cols-3 p-4 items-center">
              <div className="font-medium text-gray-900">Cost</div>
              <div className="text-gray-700">Free (Open Source)</div>
              <div className="text-gray-500">Usage-based Pricing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Topics & CTA */}
       <section className="w-full py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to build your own agent?</h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto text-lg">
            Dive into advanced topics like setting up MCP servers or integrating directly into Neovim for a seamless workflow.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
             <Link
              href="/en/mcp-explained"
              className="flex items-center justify-center rounded-md bg-white text-gray-900 px-8 py-4 text-sm font-semibold hover:bg-gray-100 transition-all"
            >
              Explore MCP
            </Link>
             <Link
              href="/en/neovim"
              className="flex items-center justify-center rounded-md border border-gray-700 bg-gray-800 text-white px-8 py-4 text-sm font-semibold hover:bg-gray-700 transition-all"
            >
              Neovim Setup
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
