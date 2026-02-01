import { notFound } from "next/navigation";
import { getSkillBySlug, getAllSkills } from "@/lib/skills";
import { MDXRemote } from "next-mdx-remote/rsc";
import { InstallBlock } from "@/components/skills/skills-list";
import { ArrowLeft, Github, User, Download } from "lucide-react";
import Link from "next/link";
import { type Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const skills = await getAllSkills("zh");
  return skills.map((skill) => ({
    slug: skill.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug, "zh");
  if (!skill) return { title: "未找到技能" };
  return {
    title: `${skill.title} - OpenCode 技能`,
    description: skill.description,
  };
}

export default async function SkillPage({ params }: PageProps) {
  const { slug } = await params;
  const skill = await getSkillBySlug(slug, "zh");

  if (!skill) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container max-w-4xl mx-auto px-4 py-16 md:py-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/zh/skills" className="flex items-center hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            技能广场
            </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{skill.title}</span>
        </div>

        {/* Header */}
        <div className="mb-16 border-b border-neutral-200 dark:border-neutral-800 pb-12">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                <div className="space-y-4 flex-1">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight">{skill.title}</h1>
                    <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">{skill.description}</p>
                    
                    <div className="flex flex-wrap gap-4 pt-2">
                        {skill.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-muted-foreground">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="min-w-[300px] space-y-4 bg-muted/30 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800">
                     <div>
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
                            安装命令
                        </p>
                        <InstallBlock command={`npx skills add ${skill.repo}`} />
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                        <div>
                             <p className="text-xs text-muted-foreground mb-1">作者</p>
                             <div className="flex items-center gap-2 font-medium">
                                <User className="w-4 h-4" />
                                {skill.author}
                             </div>
                        </div>
                         <div>
                             <p className="text-xs text-muted-foreground mb-1">源码</p>
                             <div className="flex items-center gap-2 font-medium truncate">
                                <Github className="w-4 h-4" />
                                {skill.repo.split('/')[1] || skill.repo}
                             </div>
                        </div>
                        <div>
                             <p className="text-xs text-muted-foreground mb-1">安装量</p>
                             <div className="flex items-center gap-2 font-medium">
                                <Download className="w-4 h-4" />
                                {skill.installs}
                             </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>

        {/* Content */}
        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-p:leading-relaxed prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none">
            <MDXRemote source={skill.content || ""} />
        </article>
      </div>
    </div>
  );
}
