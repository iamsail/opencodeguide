# [TASK103] - Add Homepage API CTA

**Status:** Completed  
**Added:** 2026-04-26  
**Updated:** 2026-04-26

## Original Request
将 ccapi.ai 的注册链接挂到官网首页，并放在首页高曝光位置。

## Thought Process
用户要求把 API 服务链接直接挂到官网首页，因此优先级是曝光，而不是内容内的低侵入推荐。
首页根路由目前是英文 Hero 首屏，天然适合作为强 CTA 入口。
为了不破坏站点本身作为文档入口的定位，保留现有 Get Started 按钮为主路径，同时新增一个外部 API CTA 作为高可见次级动作。

## Implementation Plan
- [x] 创建任务文件并更新索引
- [x] 修改首页 Hero，新增外部 API CTA
- [x] 校验页面诊断与布局
- [x] 更新 Memory Bank 当前状态

## Progress Tracking

**Overall Status:** Completed - 100%

### Subtasks
| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Create task file and update index | Completed | 2026-04-26 | |
| 1.2 | Update homepage hero CTA | Completed | 2026-04-26 | Added outbound API button beside Get Started |
| 1.3 | Validate diagnostics and layout | Completed | 2026-04-26 | No file diagnostics reported |
| 1.4 | Update Memory Bank | Completed | 2026-04-26 | Synced task status and project context |

## Progress Log
### 2026-04-26
- Created task file for homepage API CTA implementation.
- Chose the root homepage Hero CTA row as the insertion point because the user requested strong exposure on the official landing page.
- Planned to preserve the existing documentation CTA while adding the new outbound registration CTA.
- Updated the homepage hero CTA row to support responsive stacked/mobile and side-by-side desktop actions.
- Added a new external button labeled "Get API Access" pointing to `https://ccapi.ai/register?aff=6dhz` with safe external link attributes.
- Verified the edited homepage file with workspace diagnostics and found no errors.
- Refined the CTA wording to "Get AI API Access" after visual review on the local homepage.
- Extended the same external API entry into the shared top navigation so it also appears in the global header across locales.