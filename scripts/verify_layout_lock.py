#!/usr/bin/env python3
"""Verify the EXACT owner-approved V10.4.9 app, artwork and installation APK.

A change to this verifier, a lock manifest or an APK is NOT authorization.
The project owner must explicitly authorize every future change.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
lock = json.loads((root / "design/v10.4.9-lock.json").read_text(encoding="utf-8"))
expected = lock["protected_paths"]["git_blob_sha_by_path"]
protected = ["app/build.gradle", "app/src/main/AndroidManifest.xml",
             "app/src/main/assets", "app/src/main/java", "app/src/main/res"]


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as f:
        for data in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(data)
    return digest.hexdigest()


def git_blob_sha(path):
    return subprocess.run(["git", "hash-object", str(path)], cwd=root,
                          check=True, text=True, capture_output=True).stdout.strip()


tracked = subprocess.run(["git", "ls-files", "--stage", "--", *protected], cwd=root,
                         check=True, text=True, capture_output=True).stdout
actual = {}
errors = []
for item in tracked.splitlines():
    gitpart, path = item.split("\t", 1)
    mode, sha, stage = gitpart.split()
    if stage != "0":
        errors.append("Unmerged app file: " + path)
    actual[path] = sha

for path in sorted(set(expected) - set(actual)):
    errors.append("Missing approved app file: " + path)
for path in sorted(set(actual) - set(expected)):
    errors.append("Unexpected additional app file: " + path)
for path in sorted(set(expected) & set(actual)):
    if expected[path] != actual[path]:
        errors.append("Unauthorized app modification: " + path)

if lock["protected_paths"]["count"] != len(expected):
    errors.append("Inconsistent locked file count")

for key in ["protected_original_background", "protected_new_home_background",
            "protected_back_icon"]:
    entry = lock[key]
    path = root / entry["path"]
    if not path.is_file() or sha256_file(path) != entry["sha256"]:
        errors.append("Approved image is missing or altered: " + entry["path"])

apk_hash = hashlib.sha256()
total = 0
parts = lock["exact_apk_parts"]
for part in parts:
    path = root / part["path"]
    if not path.is_file():
        errors.append("Missing approved APK binary part: " + part["path"])
        continue
    if path.stat().st_size != part["bytes"]:
        errors.append("Changed APK part size: " + part["path"])
    if sha256_file(path) != part["sha256"]:
        errors.append("Changed APK part SHA-256: " + part["path"])
    if git_blob_sha(path) != part["git_blob_sha1"]:
        errors.append("Changed APK part Git blob: " + part["path"])
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            total += len(chunk)
            apk_hash.update(chunk)

approved = lock["approved_apk"]
if total != approved["size_bytes"] or apk_hash.hexdigest() != approved["sha256"]:
    errors.append("Concatenated APK DOES NOT match the approved original APK")

out = root / approved["path"]
sums = out.parent / "SHA256SUMS.txt"
if sums.exists() and not out.exists():
    errors.append("Checksum exists but approved APK is missing")
if out.exists():
    if out.stat().st_size != approved["size_bytes"] or sha256_file(out) != approved["sha256"]:
        errors.append("Published APK file changed")
    if git_blob_sha(out) != approved["git_blob_sha1"]:
        errors.append("Published APK Git blob changed")
if sums.exists():
    expected_line = f"{approved['sha256']}  {out.name}\n"
    if sums.read_text(encoding="utf-8") != expected_line:
        errors.append("Published APK checksum file changed")

if errors:
    print("OWNER-APPROVED V10.4.9 LOCK FAILED — NO CHANGES WITHOUT OWNER PERMISSION")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print(f"PASS — {len(actual)} approved app files, images and {len(parts)} exact APK binary parts match V10.4.9.")
print("SHA-256 APK:", approved["sha256"])
