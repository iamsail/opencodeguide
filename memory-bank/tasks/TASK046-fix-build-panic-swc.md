# TASK046 - Fix SWC Build Panic on Multibyte Characters

**Status:** Completed
**Added:** 2026-01-14
**Updated:** 2026-01-14

## Original Request
User reported a build error during deployment (Vercel) with a screenshot showing `byte index ... is not a char boundary` panic in `swc_common`.

## Thought Process
The error "byte index ... is not a char boundary" is a known issue in Rust/SWC when slicing strings if the split point lands in the middle of a multibyte UTF-8 character (like Chinese characters).
The error log pointed to:
1. `app/(zh)/zh/docs/configure/keybinds/page.mdx` (byte 332)
2. `app/(zh)/zh/docs/configure/themes/page.mdx` (byte 380)

Inspection of the files and byte offsets revealed that valid Chinese punctuation characters (`。`) were present exactly at the byte boundaries mentioned in the error logs, within bold text immediately following the metadata block.

It appears SWC (or Next.js build process) has a bug where it likely tries to truncate or parse the file content/metadata and incorrectly handles these specific Chinese characters at these specific offsets.

## Implementation Plan
- [x] Investigate file content and byte offsets to confirm the problematic characters.
- [x] Modify `keybinds/page.mdx` to remove the Chinese period `。` from the bold subtitle at byte 332.
- [x] Modify `themes/page.mdx` to remove the Chinese period `。` from the bold subtitle at byte 380.
- [x] Update `themes/page.mdx` metadata description to avoid potential issues (replace `。` with `，`).
- [x] Verify local dev server starts without syntax errors.

## Progress Log
### 2026-01-14
- Analyzed Vercel build logs and confirmed `swc` panic.
- Used Python script to inspect byte offsets in MDX files.
- Confirmed that byte 332 in `keybinds` and byte 380 in `themes` corresponded to `。` characters.
- Removed `。` from `**自定义您的快捷键。**` in `keybinds/page.mdx`.
- Removed `。` from `**选择内置主题或定义您自己的主题。**` in `themes/page.mdx`.
- Updated metadata description in `themes/page.mdx`.
- Verified dev server startup (Success).
