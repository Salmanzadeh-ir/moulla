#!/usr/bin/env python3
"""Check the owner-frozen V16 code and EXACT separately downloadable Android TEST APK."""
from __future__ import annotations
import hashlib
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def git(*args: str) -> bytes:
    return subprocess.check_output(["git", *args], cwd=ROOT, stderr=subprocess.PIPE)

ref=json.loads((ROOT/"design/V16_OWNER_APPROVED_REFERENCE_2026_11_14.json").read_text(encoding="utf-8"))
apk=ref["test_apk"]
assert ref["schema"]=="pmm-owner-approved-v16-reference-v1"
assert ref["source_locked_file_count"]==164
assert ref["reference_source_commit"]=="cbb58c0932ec94531e517652a08f29caffee5d8c"
assert apk["size_bytes"]==28981850
assert apk["sha256"]=="35e83c49e42e5afb2ea959bb9f7b79ffe413936083e2f20ccd8794a9f1753652"

# The complete approved file set and Git blob content hashes must remain EXACT.
lock_file=ROOT/ref["source_lock_file"]
lock_data=lock_file.read_bytes()
lock_sha=hashlib.sha1(b"blob "+str(len(lock_data)).encode()+b"\0"+lock_data).hexdigest()
assert lock_sha==ref["source_lock_git_blob_sha"], "Approved owner lock file changed"
lock=json.loads(lock_data)
assert lock["lockedFileCount"]==164 and len(lock["files"])==164
for rel,want in lock["files"].items():
    data=(ROOT/rel).read_bytes()
    actual=hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
    assert actual==want, "Application file differs from owner reference: "+rel

# Compare the entire app tree with the baseline source commit; no app file may drift.
source=ref["reference_source_commit"]
try:
    git("cat-file","-e",source+"^{commit}")
except subprocess.CalledProcessError:
    subprocess.run(["git","fetch","--no-tags","--depth=1","origin",source],cwd=ROOT,check=True)
assert git("ls-tree","-r",source,"--","app/")==git("ls-tree","-r","HEAD","--","app/"), "App tree differs from reference source commit"

# Refuse a replaced download branch, even if its file name is unchanged.
branch=apk["download_branch"]
remote=git("ls-remote","--heads","origin","refs/heads/"+branch).decode().strip()
assert remote, "Frozen APK download branch missing"
assert remote.split()[0]==apk["download_branch_commit"], "Frozen APK download branch moved"
subprocess.run(["git","fetch","--no-tags","--depth=1","origin","refs/heads/"+branch],
               cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
tree=git("ls-tree","FETCH_HEAD",apk["download_path"]).decode().strip()
assert tree, "Frozen APK absent from download branch"
blob_sha=tree.split()[2]
assert blob_sha==apk["git_blob_sha"], "Frozen APK Git blob changed"

# Read binary from the pinned Git commit in chunks; do not store duplicate files.
proc=subprocess.Popen(["git","show","FETCH_HEAD:"+apk["download_path"]],
                      cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
digest=hashlib.sha256()
count=0
assert proc.stdout is not None
for chunk in iter(lambda:proc.stdout.read(1024*1024),b""):
    digest.update(chunk)
    count+=len(chunk)
stderr=proc.stderr.read() if proc.stderr is not None else b""
assert proc.wait()==0, "Unable to read archived APK: "+stderr.decode(errors="replace")
assert count==apk["size_bytes"], "Frozen APK file size changed"
assert digest.hexdigest()==apk["sha256"], "Frozen APK SHA-256 changed"
print("PASS: V16 owner baseline: 164 exact source files and frozen independent APK (SHA-256 verified)")
