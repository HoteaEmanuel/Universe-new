# Current Feature
<!-- No active feature. Use `/feature load` or `/feature start` to begin one. -->

## Status
Not Started

## Goals
<!-- What does success look like? -->

## Notes
<!-- Context, constraints, details from spec -->

## History
- **Emoji Picker in Comment and Reply Inputs** (2026-08-21): Added the existing theme-aware emoji picker to comment and reply fields, inserting at the cursor or replacing a selected range while preserving react-hook-form validation and dirty state. Extracted the shared selection/caret behavior into `frontend/src/utils/insertEmojiAtSelection.ts` and adopted it in chat too, keeping emoji insertion consistent across chat, comments, and replies. Frontend TypeScript and `git diff --check` passed; live browser verification was unavailable in this workspace. Merged to `main` as `2b25fc0` (`feat: add emoji picker to comment inputs`).
