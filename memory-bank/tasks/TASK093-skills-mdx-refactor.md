# [TASK093] - Refactor Skills to MDX-as-Database

**Status:** Completed
**Added:** 2026-02-01
**Updated:** 2026-02-01

## Original Request
The user requested to "Start implementation" of the "MDX as Database" architecture for the Skills section. This followed a discussion where the user wanted a maintenance-friendly architecture for Skills (manual entry now, allowing for future community PRs) instead of the initial static `lib/data/skills.ts` array.

## Thought Process
- **Goal**: Move from hardcoded TypeScript array to a file-based CMS using MDX.
- **Benefits**:
  - Decouples content from code.
  - Enables easier community contributions via GitHub PRs (just add a file).
  - Supports rich content (Markdown/MDX) for skill details.
  - Better localization support (files in `en/` vs `zh/` folders).
- **Architecture**:
  - **Data Source**: `content/skills/{locale}/*.mdx`
  - **Metadata Extraction**: Use `gray-matter` to parse Frontmatter (YAML) for list views.
  - **Rendering**: Use `next-mdx-remote` for rendering the MDX body in Server Components.
  - **Routing**: Dynamic routes `[slug]` to handle individual skill pages.

## Implementation Plan
- [x] **New Content Architecture**
    - [x] Create `content/skills/` directory structure (`en/`, `zh/`).
    - [x] Create MDX files with Frontmatter (Title, Description, Repo, etc.).
- [x] **Backend Logic (`lib/skills.ts`)**
    - [x] Implement file system scanning using `fs`.
    - [x] Implement Frontmatter parsing using `gray-matter`.
    - [x] Implement `getAllSkills(locale)` and `getSkillBySlug(slug, locale)`.
    - [x] Add locale fallback logic (default to EN if ZH missing).
- [x] **Frontend Refactoring**
    - [x] Update `SkillsList` component to accept dynamic data.
    - [x] Refactor `/en/skills` and `/zh/skills` to Async Server Components.
    - [x] Implement dynamic detail pages `/en/skills/[slug]` and `/zh/skills/[slug]`.
    - [x] Add features: Breadcrumbs, Copy-paste install block, Metadata generation.
- [x] **Cleanup**
    - [x] Remove `lib/data/skills.ts`.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1 | Create content directory structure | Completed | 2026-02-01 | `content/skills/{en,zh}` |
| 2 | Migrate data to MDX | Completed | 2026-02-01 | Created sample files |
| 3 | Implement `lib/skills.ts` | Completed | 2026-02-01 | With gray-matter |
| 4 | Refactor List Pages | Completed | 2026-02-01 | Async components |
| 5 | Create Detail Pages | Completed | 2026-02-01 | Dynamic routing |
| 6 | Verify & Cleanup | Completed | 2026-02-01 | Removed legacy data |

## Progress Log
### 2026-02-01
- Installed `gray-matter` and `next-mdx-remote`.
- Created directory structure and MDX files.
- Implemented `lib/skills.ts` for data fetching.
- Refactored list pages and created detail pages.
- Verified localized content functioning correctly.
- Restarted dev server to fix port lock issue.
- Refined UI: Removed "Trending/Hot" tabs (kept "All Time" only) and removed "Available for these agents" section based on user feedback.
