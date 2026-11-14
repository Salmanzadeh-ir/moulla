# Active development baseline: owner-authorized V16 (2026-11-14)

The owner explicitly authorized updating the active source in this repository with the latest combined preview (V15 photo gallery plus V16 wisdom typography/tools). **No official release is authorized.** The historical signed V10.4.9 and tag `v10.4.9` stay unchanged.

## Owner-controlled freeze for ALL active app sections

Every active app screen and feature is frozen after this merge, including seven-button gold/blue home, audio/course menus, videos, About, navigation, 93-photo random 3D gallery without Share, 489 offline wisdoms, original Amiri Arabic, Sahel SemiBold Persian translation, intention/draw animation, copy-text tool with exact Eitaa invitation and link, and four-level Arabic/Persian text enlargement. **Do not change any part unless the owner explicitly requests that precise change.** Do not silently change artwork, copy, font, data, order, dimension, text, behavior, identifiers, signing or dependencies. Never create/publish an official release without separate explicit authorization.

Active checks: `python3 scripts/verify_v16_preview.py` and `python3 scripts/verify_current_preview_lock.py`; hashes: `design/v16-current-preview-lock.json`. Historical check: `v10.4.9` tag via `scripts/verify_layout_lock.py`. A future OWNER-APPROVED change must be implemented in a separate branch, have a preview/test, update the current lock with owner authorization and be reviewed before merge. Use CODEOWNERS and branch protection in GitHub settings to enforce owner review. SHA locks alone are tamper-detection, not administrator-proof.

---

# Historical approvals and owner restrictions

---

# Project agent instructions — frozen owner-approved V10.4.9

This repository contains «پای منبر مولا» Android application. **V10.4.9 is the latest owner-approved official reference.** The owner explicitly authorized final registration and permanent protection on 2026-11-05.

## Absolute working rule for agents and collaborators
**Never change any approved file, screen, asset, pixel arrangement, font, label, text, layout, behavior, navigation, source code, signing or installation APK unless the owner issues a NEW, explicit instruction authorizing that particular change.** A discussion, improvement suggestion, or permission to test does not authorize committing, merging or publishing. Do not silently optimize, refactor, format, recrop, upscale, redraw, fix or replace artwork.

Freeze all six independent home plaques (close, symmetric arrangement around «شرح صوتی نهج‌البلاغه»), their positions and labels, the independent gold-and-blue background, the title, Exit button, approved right-facing Back badge, all internal pages, full-screen layout, About page without the duplicate «یک جمله مهمان مولا» section, and the independent 18-poster guest carousel.

- Current Persian approval record: `design/V10_4_9_APPROVED_FROZEN_FA.md`
- SHA-locked app source and all reference assets: `design/v10.4.9-lock.json`
- Verification: `python3 scripts/verify_layout_lock.py`
- Exact user-approved APK: `releases/v10.4.9/PayeMenbareMola_V10_4_9_Approved.apk`
- Exact APK SHA-256: `3b93a7974402bbdeb7318ee68c0881873d33fa94e61ed1ab6ae594616ddf8624`
- Exact APK Git blob SHA-1: `a88295e2b7673766a8b3c6ea705b177f6cb3f4bc`
- Official immutable historical release tag: `v10.4.9`
- Preserve `v10.4.6` and `v10.4.3` as older references; **never rewrite old tags or artifacts**.

Workflow for any *future* authorized change: create a new branch, change only owner-requested items, provide an installable preview, obtain separate express approval before publishing, update lock for a **new version**, use a PR and owner review, verify hashes before merger, and preserve all older approved tags.

GitHub branch protections / rulesets are a separate administrator control: require pull requests, CODEOWNERS reviews, and the `verify-ui-lock` status on `main` and protect release tags. These must be enabled by the repository owner/admin to technically prevent unauthorized merges. This file and CI are documentary and detection controls, not an unbreakable lock against administrators.
