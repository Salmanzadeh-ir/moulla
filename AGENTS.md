# Current working source: owner-requested New Iwan V9 PREVIEW (2026-11-12)

The owner explicitly asked to replace the repository's **active source** with the separately tested V9 seven-option New Iwan prototype. This authorization is for source/development only; do NOT publish or sign an official release without fresh owner approval.

The previously approved V10.4.9 must remain preserved byte-for-byte in historical tag `v10.4.9`, old releases, and `design/v10.4.9-lock.json`. The older freeze rules below describe the **historical V10.4.9 reference**, not the now-authorized V9 preview changes on `main`. Run V9 checks using `python3 scripts/verify_v9_preview.py` and historical verification on `v10.4.9`. For details see `docs/V9_NEW_IWAN_FA.md`.

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
