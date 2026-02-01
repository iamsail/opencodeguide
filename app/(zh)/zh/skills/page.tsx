import { type Metadata } from "next";
import { getAllSkills } from "@/lib/skills";
import { SkillsList, InstallBlock } from "@/components/skills/skills-list";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "OpenCode 技能生态 (Skills)",
  description: "浏览并安装 OpenCode 智能体的可重用能力 (Skills)，一行命令即可扩展智能体功能。",
  alternates: {
    canonical: "/zh/skills",
    languages: {
      "en-US": "/en/skills",
    },
  },
};

export default async function SkillsPage() {
  const skills = await getAllSkills("zh");

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      
      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-16 md:py-24">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-12">
            <Link href="/zh/opencode" className="flex items-center hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
            </Link>
          <span>/</span>
          <span className="text-foreground">技能广场 (Skills)</span>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-24 items-start">
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground decoration-gray-400">
              SKILLS
            </h1>
            <div className="inline-block bg-muted/50 border border-neutral-200 dark:border-neutral-800 rounded px-2 py-0.5 text-xs font-mono text-muted-foreground mb-2">
              OPENCODE 智能体技能生态
            </div>
            
            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
              技能 (Skills) 是 AI 智能体的可重用能力模块。无需复杂配置，只需<span className="text-foreground underline decoration-neutral-400 underline-offset-4 decoration-1">一行命令</span>即可快速安装，为您的智能体赋予强大的过程知识与工具集。
            </p>

            <div className="pt-4 space-y-2">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                一行命令安装
              </p>
              <InstallBlock command="npx skills add <owner/repo>" />
            </div>
          </div>

          <div className="space-y-6 pt-4">
             <div className="space-y-2">
               <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                 支持的智能体平台
               </p>
               <div className="flex gap-6 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                  {/* Mock logos for visual parity */}
                  <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-800" />
                  <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-800" />
               </div>
             </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              技能排行榜
            </h2>
          </div>
          
          <SkillsList 
            skills={skills} 
            locale="zh"
            labels={{
              searchPlaceholder: "搜索技能...",
              allTime: "历史总榜",
              trending: "24h 飙升",
              hot: "热门推荐",
              rank: "#",
              skill: "技能",
              installs: "安装量",
            }}
          />
        </div>
      </div>
    </div>
  );
}
