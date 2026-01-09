# [TASK007] - Domain Setup

**Status:** Completed
**Added:** 2026-01-09
**Updated:** 2026-01-09

## Original Request
Bind domain `opencodeguide.com` (currently on Namecheap) to Cloudflare and the project.

## Thought Process
The user wants to use Cloudflare for DNS resolution. The codebase already has `https://opencodeguide.com` configured in `sitemap.ts`, `robots.ts`, and metadata.
I verified:
- `app/sitemap.ts` has `https://opencodeguide.com`
- `app/robots.ts` has `https://opencodeguide.com`
- `app/(main)/layout.tsx` has `metadataBase: new URL('https://opencodeguide.com')`
- `app/(zh)/layout.tsx` has `metadataBase: new URL('https://opencodeguide.com')`

No code changes are needed. I will provide instructions to the user on how to updating nameservers.

## Implementation Plan
- [x] Verify codebase uses correct domain.
- [x] Provide instructions for Namecheap -> Cloudflare migration.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 7.1 | Verify domain in codebase | Completed | 2026-01-09 | Already correct |
| 7.2 | User instructions | Completed | 2026-01-09 | Provided in chat |

## Progress Log
### 2026-01-09
- Checked `sitemap.ts`, `robots.ts`, layout files. All good.
- Created this task to track the domain setup request.
- Marked as completed as it requires no code changes, only user action.
