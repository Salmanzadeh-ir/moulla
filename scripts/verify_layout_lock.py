#!/usr/bin/env python3
"""Check exact owner-approved V10.4.6 app files and its original installable APK.

The owner expressly approved V10.4.6. Editing this script or the lock file
is NOT authorization; first obtain a new explicit owner instruction and approval.
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
lock = json.loads((root / "design/v10.4.6-lock.json").read_text(encoding="utf-8"))
expected = lock["protected_paths"]["git_blob_sha_by_path"]
protected = [
    "app/build.gradle",
    "app/src/main/AndroidManifest.xml",
    "app/src/main/assets",
    "app/src/main/java",
    "app/src/main/res",
]
r = subprocess.run(["git", "ls-files", "--stage", "--", *protected],
                   cwd=root, check=True, text=True, capture_output=True)
actual = {}
for line in r.stdout.splitlines():
    metadata, path = line.split("\t", 1)
    mode, git_sha, stage = metadata.split()
    if stage != "0":
        raise SystemExit("Unmerged file in locked source: " + path)
    actual[path] = git_sha

errors = []
for path in sorted(set(expected) - set(actual)):
    errors.append("Missing locked app file: " + path)
for path in sorted(set(actual) - set(expected)):
    errors.append("Unauthorized extra app file: " + path)
for path in sorted(set(expected) & set(actual)):
    if actual[path] != expected[path]:
        errors.append("Unauthorized edit: " + path)

def sha256_file(p):
    h = hashlib.sha256()
    with p.open("rb") as source:
        for piece in iter(lambda: source.read(1024 * 1024), b""):
            h.update(piece)
    return h.hexdigest()

for ref in ["protected_original_background", "protected_new_home_background"]:
    item = lock[ref]
    p = root / item["path"]
    if not p.is_file() or sha256_file(p) != item["sha256"]:
        errors.append("Background image changed: " + item["path"])

# The binary chunks store the EXACT approved APK bytes without repackaging or
# signing again. All SHA-256 and Git blob checks must pass before publication.
sha = hashlib.sha256()
total = 0
for part in lock["exact_apk_parts"]:
    p = root / part["path"]
    if not p.is_file():
        errors.append("Missing original APK part: " + part["path"])
        continue
    if p.stat().st_size != part["bytes"] or sha256_file(p) != part["sha256"]:
        errors.append("APK part modified: " + part["path"])
    git_sha = subprocess.run(["git", "hash-object", str(p)],
                             cwd=root, check=True, text=True, capture_output=True).stdout.strip()
    if git_sha != part["git_blob_sha1"]:
        errors.append("APK chunk Git blob mismatch: " + part["path"])
    with p.open("rb") as source:
        for piece in iter(lambda: source.read(1024 * 1024), b""):
            total += len(piece)
            sha.update(piece)
apk = lock["approved_apk"]
if total != apk["size_bytes"] or sha.hexdigest() != apk["sha256"]:
    errors.append("Reassembled APK does not exactly match the owner-approved installation file.")

# First approved PR contains the exact APK in original parts. A GitHub Actions
# workflow archives the assembled file on main only after verifying its bytes.
output = root / apk["path"]
checksum_file = output.parent / "SHA256SUMS.txt"
if not output.exists() and checksum_file.exists():
    errors.append("Published APK is missing.")
if output.exists():
    if output.stat().st_size != apk["size_bytes"] or sha256_file(output) != apk["sha256"]:
        errors.append("Published APK bytes have changed.")
    git_sha = subprocess.run(["git", "hash-object", str(output)],
                             cwd=root, check=True, text=True, capture_output=True).stdout.strip()
    if git_sha != apk["git_blob_sha1"]:
        errors.append("Published APK Git blob changed.")

if errors:
    print("OWNER DESIGN LOCK FAILED — do not modify approved V10.4.6 without permission:")
    for error in errors:
        print(" *", error)
    sys.exit(1)

print(f"PASS — {len(actual)} app files and {len(lock['exact_apk_parts'])} APK binary parts match approved V10.4.6.")
print("PASS — exact original APK SHA256:", apk["sha256"])
