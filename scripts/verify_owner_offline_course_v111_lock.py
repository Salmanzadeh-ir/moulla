#!/usr/bin/env python3
"""Verify every application file against the owner-approved v111 full-app lock."""
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'design/owner-offline-course-v111-app-lock.json').read_text(encoding='utf-8'))
locked=manifest['files']
actual={p.relative_to(ROOT).as_posix():p for p in (ROOT/'app').rglob('*') if p.is_file()}
assert set(actual)==set(locked), (
    'Application file set changed. Added: '+repr(sorted(set(actual)-set(locked)))+
    ' Removed: '+repr(sorted(set(locked)-set(actual)))
)
for rel,path in actual.items():
    data=path.read_bytes()
    got=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
    want=locked[rel]['sha']
    assert got==want, f'Owner-locked app file changed: {rel}'
    assert locked[rel]['mode']=='100644', f'Unexpected mode in owner lock: {rel}'
print(f"PASS: all {len(locked)} app files match the owner-approved v111 Git blob SHA lock.")
