"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkillMetadata } from "@/lib/skills";

interface SkillsListProps {
  skills: SkillMetadata[];
  locale?: string;
  labels?: {
    searchPlaceholder?: string;
    allTime?: string;
    trending?: string;
    hot?: string;
    rank?: string;
    skill?: string;
    installs?: string;
    installCommand?: string;
  };
}

export function SkillsList({ skills, locale = "en", labels = {} }: SkillsListProps) {
  const [query, setQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("all");

  const defaultLabels = {
    searchPlaceholder: "Search skills...",
    allTime: "All Time",
    trending: "Trending (24h)",
    hot: "Hot",
    rank: "#",
    skill: "SKILL",
    installs: "INSTALLS",
    installCommand: "npm install",
    ...labels,
  };

  const filteredSkills = React.useMemo(() => {
    if (!query) return skills;
    const lowerQuery = query.toLowerCase();
    return skills.filter(
      (skill) =>
        skill.title.toLowerCase().includes(lowerQuery) ||
        skill.repo.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery)
    );
  }, [query, skills]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
        <input
          type="text"
          placeholder={defaultLabels.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-background border border-neutral-200 dark:border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-all placeholder:text-muted-foreground/50 shadow-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-200 dark:border-neutral-800 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">/</span>
          </kbd>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-neutral-200 dark:border-neutral-800 pb-4 text-sm scrollbar-hide overflow-x-auto">
        <button
          onClick={() => setActiveTab("all")}
          className={cn(
            "font-medium transition-colors hover:text-foreground whitespace-nowrap",
            activeTab === "all" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {defaultLabels.allTime} <span className="text-muted-foreground/60 ml-1">({skills.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("trending")}
          className={cn(
            "font-medium transition-colors hover:text-foreground whitespace-nowrap",
            activeTab === "trending" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {defaultLabels.trending}
        </button>
        <button
          onClick={() => setActiveTab("hot")}
          className={cn(
            "font-medium transition-colors hover:text-foreground whitespace-nowrap",
            activeTab === "hot" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {defaultLabels.hot}
        </button>
      </div>

      {/* List Header */}
      <div className="grid grid-cols-12 gap-4 text-xs font-mono text-muted-foreground uppercase tracking-wider px-4">
        <div className="col-span-1">{defaultLabels.rank}</div>
        <div className="col-span-9 md:col-span-10">{defaultLabels.skill}</div>
        <div className="col-span-2 md:col-span-1 text-right">{defaultLabels.installs}</div>
      </div>

      {/* List Items */}
      <div className="space-y-1">
        {filteredSkills.map((skill, index) => (
          <Link
            href={`/${locale}/skills/${skill.id}`}
            key={skill.id}
            className="group grid grid-cols-12 gap-4 items-center rounded-lg border border-transparent px-4 py-4 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            <div className="col-span-1 font-mono text-muted-foreground group-hover:text-foreground transition-colors">
              {index + 1}
            </div>
            <div className="col-span-9 md:col-span-10 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground group-hover:text-foreground transition-colors truncate">
                  {skill.title}
                </span>
                <span className="text-muted-foreground text-sm truncate hidden sm:inline-block">
                  {skill.repo}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1 group-hover:text-muted-foreground/80">
                {skill.description}
              </p>
            </div>
            <div className="col-span-2 md:col-span-1 text-right font-mono text-sm text-foreground group-hover:text-foreground transition-colors">
              {skill.installs}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function InstallBlock({ command }: { command: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="w-full flex items-center justify-between text-left font-mono text-sm bg-muted/40 hover:bg-muted/60 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 transition-all group max-w-lg"
    >
      <span className="text-muted-foreground group-hover:text-foreground transition-colors truncate mr-4">
        <span className="select-none text-muted-foreground/50 mr-2">$</span>
        {command}
      </span>
      <div className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </div>
    </button>
  );
}
