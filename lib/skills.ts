import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Constants
const CONTENT_ROOT = path.join(process.cwd(), "content/skills");

export interface SkillMetadata {
  id: string; // The filename slug (e.g., 'vercel-react-best-practices')
  title: string;
  description: string;
  repo: string;
  author: string;
  tags: string[];
  installs: string;
  content?: string; // Markdown content
}

// Get the correct directory for a locale, falling back to 'en' if not found?
function getSkillsDirectory(locale: string = "en") {
  const localeDir = path.join(CONTENT_ROOT, locale);
  if (fs.existsSync(localeDir)) {
    return localeDir;
  }
  return path.join(CONTENT_ROOT, "en");
}

export async function getAllSkills(locale: string = "en"): Promise<SkillMetadata[]> {
  const directory = getSkillsDirectory(locale);
  
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = fs.readdirSync(directory);

  const skills = files
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"))
    .map((file) => {
      const filePath = path.join(directory, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data } = matter(fileContent);

      return {
        id: file.replace(/\.mdx$/, ""),
        title: data.title || "Untitled Skill",
        description: data.description || "",
        repo: data.repo || "unknown/repo",
        author: data.author || "Global",
        tags: data.tags || [],
        installs: data.installs || "0",
      } as SkillMetadata;
    });

  return skills.sort((a, b) => {
    return parseFloat(b.installs) - parseFloat(a.installs);
  });
}

export async function getSkillBySlug(slug: string, locale: string = "en"): Promise<SkillMetadata | null> {
  let directory = getSkillsDirectory(locale);
  let filePath = path.join(directory, `${slug}.mdx`);

  // Fallback to English if not found in requested locale
  if (!fs.existsSync(filePath) && locale !== "en") {
     directory = getSkillsDirectory("en");
     filePath = path.join(directory, `${slug}.mdx`);
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContent);

  return {
    id: slug,
    title: data.title || "Untitled Skill",
    description: data.description || "",
    repo: data.repo || "unknown/repo",
    author: data.author || "Global",
    tags: data.tags || [],
    installs: data.installs || "0",
    content: content,
  } as SkillMetadata;
}
