# Project agent instructions — immutable user-approved V10.4.6

This repository is the Android application «پای منبر مولا». The owner **explicitly approved** the 2026-11-05 V10.4.6 installation APK, its exact images, UI, text, layout, navigation and behavior as the official baseline.

## Hard operating rule for anyone working on this repo
**DO NOT change any app file, layout, screen, image, text, code, or installable APK unless the user explicitly directs and authorizes that exact change.** Suggestions are not permission. A request to create or test a preview is not permission to commit, merge or publish it. Never silently optimize, reformat or regenerate approved artwork. Treat all six home screen icons, the original and new home backgrounds, Exit, Back, About, full-screen behavior, 18-image 3D guest gallery, every internal screen and every link as frozen.

- Primary record: `design/V10_4_6_APPROVED_FROZEN_FA.md`.
- Exact content and SHA locks: `design/v10.4.6-lock.json`.
- Verify with: `python3 scripts/verify_layout_lock.py`.
- Exact approved APK: `releases/v10.4.6/PayeMenbareMola_V10_4_6_Approved.apk` (SHA256 `3ecf3342635a3ed17b50dc8c2eb7c979d5c59e92c380b7432f7fe40234830ebf`).
- Immutable reference tag: `v10.4.6`.
- Old approved release `v10.4.3` remains archived for history.

If future changes receive explicit owner approval, use an independent branch, preserve old tags and APKs, verify isolated diffs, provide testable APK first, and merge only after a separate user authorization for final registration. Every new approved release gets a separate lock and release tag.

GitHub admin MUST enable main branch protection/rulesets with required PR reviews from CODEOWNERS and required lock status checks to block unapproved changes by repository writers. Documentation and CI alone cannot make admin-level changes impossible.
