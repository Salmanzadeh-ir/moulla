# New owner-authorized v119 reminder branch — 2026-11-20
Only owner-approved persistent Wisdom and course local reminders are changed.
Active file lock: design/owner-v119-main-app-lock.json (182 app files).
Historical v118 lock is preserved. No official release authorized.

---

# Current owner-approved v118 freeze — 2026-11-19

The owner tested and approved the v118 trial APK, then explicitly requested that the exact approved changes be registered on main. **The new active lock is `design/owner-v118-main-app-lock.json`**, verified by `python3 scripts/verify_owner_v118_lock.py` and the unchanged CI status context `verify-ui-lock`. All 180 app files remain covered: exactly two files differ from historical v117 (`app/src/main/assets/index.html`, `app/src/main/assets/pmm_offline_course.js`). The earlier approved audio on-demand cleanup is preserved. All other 178 files, fonts, visual assets, course data and release identifiers are unchanged.

The original v117 lock `design/owner-v117-main-app-lock.json`, its frozen snapshot `snapshot/owner-v117-final-frozen-main-20261119`, historical tags, APK and all official market releases remain untouched. The v118 trial APK was built separately (GitHub Actions run 44603122562), and **this does not authorize an official release**. No subsequent app modifications without a NEW explicit owner command. Branch protection/rulesets still require owner setup in GitHub repository settings. The v117 and older paragraphs below remain as historical records; where they describe "current" v117, read them as historically current at that time.

---

# Active freeze: OWNER-AUTHORIZED v117 source registered 2026-11-19

The owner explicitly instructed registering all tested v117 changes into the repository, locking ALL app sections and forbidding any future change without another **new, specific, explicit owner approval**. The active `main` now uses v117 app behavior and assets; source snapshot: `snapshot/owner-v117-frozen-source-20261119`. Full 180-file lock: `design/owner-v117-main-app-lock.json`; check with `python3 scripts/verify_owner_v117_lock.py`. The pre-v117 main is preserved at `snapshot/owner-main-before-v117-20261119`. Official Bazaar release APKs, signatures, release branches and historical tags remain unchanged. `app/build.gradle` in main intentionally retains its previous identity/signing metadata; v117 trial metadata is applied in the dedicated workflow only.

**Do not alter UI, media, code, dependencies, server URLs, fonts, audio policy, app IDs, files, tests, workflows, documentation, hashes or branch/tag history without express, separate owner authorization.** CI + CODEOWNERS detect/flag changes; GitHub branch protection ruleset still must be enabled by repository owner in Settings for server-side blocking. See `OWNER_LOCK.md`.

---

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
