import { type Metadata } from "next";
import { getAllSkills } from "@/lib/skills";
import { SkillsList, InstallBlock } from "@/components/skills/skills-list";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "OpenCode Skills Ecosystem",
  description: "Browse and install reusable capabilities for your OpenCode agents in one command.",
  alternates: {
    canonical: "/en/skills",
    languages: {
      "zh-CN": "/zh/skills",
    },
  },
};

export default async function SkillsPage() {
  const skills = await getAllSkills();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      
      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-16 md:py-24">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-12">
            <Link href="/" className="flex items-center hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
            </Link>
          <span>/</span>
          <span className="text-foreground">Skills</span>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-24 items-start">
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground decoration-gray-400">
              SKILLS
            </h1>
            <div className="inline-block bg-muted/50 border border-neutral-200 dark:border-neutral-800 rounded px-2 py-0.5 text-xs font-mono text-muted-foreground mb-2">
              THE OPEN AGENT SKILLS ECOSYSTEM
            </div>
            
            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
              Skills are reusable capabilities for AI agents. Install them <span className="text-foreground underline decoration-neutral-400 underline-offset-4 decoration-1">with</span> a single command to enhance your agents <span className="text-foreground underline decoration-neutral-400 underline-offset-4 decoration-1">with</span> access to procedural knowledge.
            </p>

            <div className="pt-4 space-y-2">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Install in one command
              </p>
              <InstallBlock command="npx skills add <owner/repo>" />
            </div>
          </div>

          <div className="space-y-6 pt-4">
             <div className="space-y-2">
               <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                 Available for these agents
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
              Skills Leaderboard
            </h2>
          </div>
          
          <SkillsList skills={skills} locale="en" />
        </div>
      </div>
    </div>
  );
}
