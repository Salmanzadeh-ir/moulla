#!/usr/bin/env python3
"""Detect ANY edit, addition or deletion of owner-frozen v117 app components."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / "design/owner-v117-main-app-lock.json"
doc = json.loads(LOCK.read_text(encoding="utf-8"))
expected = doc["files"]
assert doc["approved_app_files_count"] == 180
assert len(expected) == 180
raw = subprocess.check_output(["git", "ls-files", "-z", "--", "app/"], cwd=ROOT)
tracked = {p.decode("utf-8") for p in raw.split(b"\0") if p}
assert tracked == set(expected), (
    "OWNER V117 FROZEN FILE SET CHANGED",
    sorted(tracked-set(expected)),
    sorted(set(expected)-tracked),
)
for rel, want in sorted(expected.items()):
    buf=(ROOT/rel).read_bytes()
    have=hashlib.sha1(b"blob "+str(len(buf)).encode()+b"\0"+buf).hexdigest()
    assert have == want, f"OWNER V117 LOCK VIOLATION: {rel}: {have} != {want}"
print(f"PASS: {len(expected)} owner-frozen active v117 app files match the exact Git blob hashes.")
