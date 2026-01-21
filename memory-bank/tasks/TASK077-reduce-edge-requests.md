# [TASK077] - Reduce Edge and Function Usage

**Status:** Completed
**Added:** 2026-01-21
**Updated:** 2026-01-21

## Original Request
The user reported high "Edge Requests" usage (10k+/day) on Vercel despite having low traffic (~300 users). They wanted to understand why static content was consuming so much resources and how to fix it to avoid billing issues.

## Thought Process
1.  **Diagnosis:**
    *   **Function Invocations**: We confirmed these were actually low, but the potential for them exists with default Next.js server-side features.
    *   **Edge Requests**: These are CDN hits. High usage relative to traffic is typically caused by:
        *   **Middleware**: Every file (images, favicons) hits middleware. (Checked: None present).
        *   **Next.js Prefetching**: Default `<Link>` behavior prefetches JSON data for every link in the viewport. With a 50+ item sidebar, one page load = 50+ extra requests.
        *   **Crawler Traffic**: Bots crawling the site.
        *   **Dynamic Metadata/i18n**: If executed at runtime.

2.  **Strategy**: "Stop the Bleeding" via strict Static Site Generation (SSG).
    *   **Zero Compute**: Move to `output: 'export'`. This physically prevents any server-side code from running.
    *   **Reduce Requests**: Disable prefetching on Sidebar links.
    *   **Cache Control**: Use `vercel.json` to enforce aggressive browser caching (1 hour for HTML, 1 year for assets).

## Implementation Plan
-   [x] **Enforce Static Export**: Update `next.config.mjs` with `output: 'export'` and `images: { unoptimized: true }`.
-   [x] **Disable Prefetching**: Add `prefetch={false}` to all Sidebar and Header links to stop "request storms" on page load.
-   [x] **Configure Headers**: Create `vercel.json` to handle redirects (which fail in `next.config` under export mode) and strict `Cache-Control` headers.
-   [x] **Verify**: Ensure the project builds locally in dev mode.

## Progress Log
### 2026-01-21
-   analyzed the project structure. Confirmed no `middleware.ts`.
-   Updated `next.config.mjs` to enable static export.
-   Created `vercel.json` for headers and redirects.
-   Updated `components/docs-sidebar.tsx` and `components/site-header.tsx` to disable prefetching on navigation links.
-   This architecture change ensures that **Function Invocations will be 0** and **Edge Requests will be significantly reduced** (only actual user clicks + initial load, no background prefetch spam).
