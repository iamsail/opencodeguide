# [TASK096] - Integrate Google AdSense

**Status:** Completed
**Added:** 2026-02-02
**Updated:** 2026-02-02

## Original Request
Integrate Google AdSense based on the provided screenshot and code snippet.
Snippet:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1345496474366685"
     crossorigin="anonymous"></script>
```

## Thought Process
- The project uses Next.js App Router with localized layouts in `app/(main)`, `app/(zh)`, and `app/(ko)`.
- Each layout manages its own `<html>` and `<body>` tags.
- To ensure AdSense runs on all pages, the script should be added to each of these root layouts.
- We will create a `components/google-adsense.tsx` component to encapsulate the script.
- We will use `next/script` to load the external script efficiently.
- The `crossOrigin` attribute in React is camelCase. Next.js Script component handles this.
- The ID `ca-pub-1345496474366685` will be passed as a prop or hardcoded since it's specific to this site. given the user request, hardcoding usage in the component or layouts is fine.

## Implementation Plan
- [x] Create `components/google-adsense.tsx`.
- [x] Add `<GoogleAdsense pId="1345496474366685" />` to `app/(main)/layout.tsx`.
- [x] Add `<GoogleAdsense pId="1345496474366685" />` to `app/(zh)/layout.tsx`.
- [x] Add `<GoogleAdsense pId="1345496474366685" />` to `app/(ko)/layout.tsx`.

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1 | Create AdSense component | Completed | 2026-02-02 | Created component using next/script |
| 2 | Add to Main Layout | Completed | 2026-02-02 | |
| 3 | Add to ZH Layout | Completed | 2026-02-02 | |
| 4 | Add to KO Layout | Completed | 2026-02-02 | |

## Progress Log
### 2026-02-02
- Created task file.
- Implement AdSense component and integrated into all layouts.
