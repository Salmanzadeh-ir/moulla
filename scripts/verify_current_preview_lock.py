#!/usr/bin/env python3
"""Detect changes to ANY current preview app section without a new owner-approved lock."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
locked=json.loads((ROOT/"design/v16-current-preview-lock.json").read_text(encoding="utf-8"))["files"]
assert locked and len(locked)>150, "Current preview lock incomplete"
tracked=subprocess.check_output(["git","ls-files","-z","--","app/"],cwd=ROOT)
actual_paths={p.decode() for p in tracked.split(b"\0") if p}
assert actual_paths==set(locked), (sorted(actual_paths-set(locked)),sorted(set(locked)-actual_paths))
for rel,want in locked.items():
    content=(ROOT/rel).read_bytes()
    got=hashlib.sha1(b"blob "+str(len(content)).encode()+b"\0"+content).hexdigest()
    assert got==want, f"Locked app section changed: {rel}"
print(f"PASS: all {len(locked)} owner-approved V16 app files match the locked Git blob hashes.")
