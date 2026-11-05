#!/usr/bin/env python3
"""Fail verification if any approved V10.4.3 app file is modified, added or removed.

Approved future changes must be explicitly authorized by the project owner,
then accompanied by an updated lock manifest in that authorized PR.
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "design/v10.4.3-lock.json").read_text(encoding="utf-8"))
expected = manifest["protected_paths"]["git_blob_sha_by_path"]
protected = [
    "app/build.gradle",
    "app/src/main/AndroidManifest.xml",
    "app/src/main/assets",
    "app/src/main/java",
    "app/src/main/res",
]
result = subprocess.run(
    ["git", "ls-files", "--stage", "--", *protected],
    cwd=root, check=True, text=True, capture_output=True,
)
actual = {}
for line in result.stdout.splitlines():
    metadata, path = line.split("\t", 1)
    mode, blob_sha, stage = metadata.split()
    if stage != "0":
        print(f"Unmerged file: {path}")
        sys.exit(1)
    actual[path] = blob_sha

missing = sorted(set(expected) - set(actual))
added = sorted(set(actual) - set(expected))
changed = sorted(p for p in expected.keys() & actual.keys() if expected[p] != actual[p])
image = root / manifest["approved_background_path"]
image_digest = hashlib.sha256(image.read_bytes()).hexdigest() if image.is_file() else ""
image_unchanged = image_digest == manifest["approved_background_sha256"]

if missing or added or changed or not image_unchanged:
    print("DESIGN LOCK VIOLATION — explicit owner permission required before any change.")
    for label, entries in [("missing", missing), ("added", added), ("changed", changed)]:
        for path in entries:
            print(f"{label}: {path}")
    if not image_unchanged:
        print(f"approved Image 01 SHA-256 mismatch: {image_digest}")
    sys.exit(1)
print(f"APPROVED UI LOCK PASSED — {len(actual)} tracked files unchanged; Image 01 hash verified.")
