#!/usr/bin/env python3
"""Owner-approved v129: fail-closed Git blob lock for all 199 active app files."""
import hashlib
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
new = json.loads((root / "design/owner-v129-main-app-lock.json").read_text(encoding="utf-8"))
old = json.loads((root / "design/owner-v128-test-app-lock.json").read_text(encoding="utf-8"))
active = json.loads((root / "design/owner-active-version.json").read_text(encoding="utf-8"))
paths = subprocess.check_output(["git", "ls-files", "--", "app/"], cwd=root, text=True).splitlines()
approved = "app/src/main/assets/index.html"
service = "app/src/main/java/ir/nahj/towhidkarbordi/PmmKafiAudioService.java"
assert len(paths) == len(new["files"]) == len(old["files"]) == 199
assert set(paths) == set(new["files"]) == set(old["files"])
assert new["status"] == "APPROVED_BY_OWNER_20261120_PHONE_TOUCH97"
assert new["changed_app_files"] == [approved]
assert new["approved_apk"]["source_index_blob_sha"] == "9c215076a6efc0a02333425bd06810ca1112b3c1"
assert new["approved_apk"]["sha256"] == "d590deb4521bb08a17913a5c951b3ea0a0d404bb5debd313bf2f6c8874dfe76f"
assert active["active_branch"] == "main"
assert active["active_version"] == "v129"
assert active["active_lock"] == "design/owner-v129-main-app-lock.json"
assert active["active_app_files"] == 199
for p in paths:
    data = (root / p).read_bytes()
    sha = hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
    assert sha == new["files"][p], ("Changed approved app file", p)
    if p != approved:
        assert sha == old["files"][p], ("Unexpected v128 regression", p)
assert new["files"][approved] != old["files"][approved]
assert new["files"][approved] == "9c215076a6efc0a02333425bd06810ca1112b3c1"
html = (root / approved).read_text(encoding="utf-8")
assert 'id="pmm-owner-touch97-trial"' in html
assert "scale:.97!important" in html
assert "const DURATION_DOWN=100,DURATION_UP=145" in html
assert "document.addEventListener('pointerdown'" in html
assert "document.addEventListener('pointercancel'" in html
assert "window.addEventListener('blur',finish)" in html
assert "prefers-reduced-motion:reduce" in html
assert "font-family:'PMM Lalezar'" in html
assert "previousUniformSize*(5/6)" in html
native = (root / service).read_text(encoding="utf-8")
assert "@Override public void onTaskRemoved(Intent rootIntent)" in native
assert "saveSecond(true);" in native
assert "discardPlayer();" in native
assert "stopSelf();" in native
assert "return START_NOT_STICKY;" in native
assert not (root / "app/src/main/assets/pmm_owner_wisdom_tools_v121.js").exists()
print("PASS: 199/199 exact approved app Git blob SHAs, only Touch97 HTML differs from v128, audio task-stop and all assets retained")
