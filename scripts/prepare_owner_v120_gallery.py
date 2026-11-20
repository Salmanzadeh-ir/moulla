#!/usr/bin/env python3
"""Candidate-only restoration of 12 distinct v10.4.9 photos. NEVER modifies main or tags."""
import hashlib
import json
import re
import subprocess
from pathlib import Path
from typing import List

ROOT = Path(__file__).resolve().parents[1]
SOURCE_TAG = "v10.4.9"
HISTORICAL_NUMBERS = [1,2,3,5,6,12,13,14,15,16,17,18]
GALLERY_DIR = ROOT/"app/src/main/assets/images/photo_quotes"
MANIFEST = ROOT/"app/src/main/assets/photo_quotes_manifest.js"
LOCK = ROOT/"design/owner-v120-gallery-review-app-lock.json"
PRIOR_LOCK = ROOT/"design/owner-v119-main-app-lock.json"
PRIOR_MANIFEST_BLOB="TODO"  # populated below by review helper once original v119 sha is verified


def git(*args, raw=False):
    x=subprocess.check_output(["git",*args],cwd=ROOT)
    return x if raw else x.decode().strip()


def git_blob(content):
    return hashlib.sha1(b"blob "+str(len(content)).encode()+b"\0"+content).hexdigest()


def expected_images():
    pairs=[]
    for i,old in enumerate(HISTORICAL_NUMBERS,94):
        source=f"app/src/main/assets/images/guest_album/{old:02}.jpg"
        dest=f"app/src/main/assets/images/photo_quotes/quote_{i:03}.jpg"
        pairs.append((source,dest))
    return pairs


def verify_original_v119():
    prior=json.loads(PRIOR_LOCK.read_text(encoding="utf-8"))
    if prior["approved_app_files_count"]!=182 or len(prior["files"])!=182:
        raise RuntimeError("Historical v119 lock invalid")
    if prior["files"].get("app/src/main/assets/photo_quotes_manifest.js") is None:
        raise RuntimeError("Prior manifest not found")
    expected=prior["files"]
    differences=[]
    for path,original_sha in expected.items():
        # Only the active manifest may change. Every other old application file
        # must be byte-identical to the already owner-approved v119 source.
        if path=="app/src/main/assets/photo_quotes_manifest.js":
            continue
        if not (ROOT/path).is_file() or git_blob((ROOT/path).read_bytes())!=original_sha:
            differences.append(path)
    if differences:
        raise RuntimeError("A previously approved app source/asset was changed: "+repr(differences))
    return prior


def current_gallery_paths(text):
    return re.findall(r"'(images/photo_quotes/quote_\d{3}\.(?:jpg|jpeg|png|webp))'",text)


def patch():
    # Owner's new policy: never overwrite any existing photo, and make no changes
    # to the original 93 images or unrelated app screens/audio/manifest/Gradle.
    prior=verify_original_v119()
    before=git("show","12016838e98d8c1eadadbb0a96321f4855f1c5cd:app/src/main/assets/photo_quotes_manifest.js")
    original=before
    if git_blob(original.encode()) != prior["files"]["app/src/main/assets/photo_quotes_manifest.js"]:
        raise RuntimeError("The original approved gallery manifest does not match v119 lock")
    old_paths=current_gallery_paths(original)
    if len(old_paths)!=93 or len(set(old_paths))!=93:
        raise RuntimeError(f"Unexpected v119 gallery paths: {len(old_paths)}")
    if not original.rstrip().endswith("]);"):
        raise RuntimeError("Unexpected JS gallery structure, refusing patch")
    for source,dest in expected_images():
        data=git("show",f"{SOURCE_TAG}:{source}",raw=True)
        path=ROOT/dest
        if path.exists():
            if path.read_bytes()!=data:
                raise RuntimeError("Historical image collision at "+dest)
        else:
            path.write_bytes(data)
        if git_blob(path.read_bytes())!=git("rev-parse",f"{SOURCE_TAG}:{source}"):
            raise RuntimeError("Historical Git blob mismatch: "+source)
    append="".join("  'images/photo_quotes/quote_%03d.jpg',\n"%n for n in range(94,106))
    after=re.sub(r"\]\);\s*$",append+"]);\\n", original, count=1)
    after=after.replace(
        "/* 93 distinct user-supplied photo quotes, stored fully offline.",
        "/* v120 REVIEW: 93 unchanged approved photos + 12 distinct historic v10.4.9 photos, fully offline."
    ).replace(
        " * Mixed order is stable; the previous 18-image library is not referenced.",
        " * The first 93 images retain their exact order and bytes; 12 historic originals are appended."
    )
    new_paths=current_gallery_paths(after)
    if new_paths[:93]!=old_paths or len(new_paths)!=105 or len(set(new_paths))!=105:
        raise RuntimeError("Cannot preserve exact original 93 gallery paths")
    MANIFEST.write_text(after,encoding="utf-8")
    # Stage exactly the 12 image additions and the one gallery manifest.
    expected_added=[dest for _,dest in expected_images()]
    git("add","--","app/src/main/assets/photo_quotes_manifest.js",*expected_added)
    tracked=git("ls-files","--","app/").splitlines()
    if len(tracked)!=194:
        raise RuntimeError(f"Expected 194 files after adding 12 unique images, got {len(tracked)}")
    protected_files=prior["files"]
    hashes={}
    for p in sorted(tracked):
        file=ROOT/p
        if not file.is_file():
            raise RuntimeError("Tracked file not found: "+p)
        hashes[p]=git_blob(file.read_bytes())
        if p in protected_files and p != "app/src/main/assets/photo_quotes_manifest.js":
            if hashes[p]!=protected_files[p]:
                raise RuntimeError("An old v119 app blob changed: "+p)
    new_lock={
        "schema":"pmm-v120-not-owner-approved-gallery-candidate-lock-v1",
        "status":"CANDIDATE_FOR_ANDROID_TRIAL_ONLY_NEVER_ACTIVE_UNTIL_EXPLICIT_OWNER_APPROVAL",
        "source_reference":"main@12016838e98d8c1eadadbb0a96321f4855f1c5cd",
        "parent_owner_approved_lock":"design/owner-v119-main-app-lock.json",
        "prior_owner_approved_app_files_count":182,
        "candidate_app_files_count":194,
        "previous_approved_gallery_count":93,
        "candidate_gallery_count":105,
        "additional_exact_historical_photos":{old:{"new_path":new,"git_blob_sha":hashes[new]} for old,new in expected_images()},
        "note":"12 distinct original 18-image v10.4.9 posters restored to end of gallery. No UI/HTML, audio, reminders, fonts, Gradle, market signing, old 93 photo bytes, or main branch changes.",
        "files":hashes
    }
    LOCK.write_text(json.dumps(new_lock,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")
    git("add","--",str(LOCK.relative_to(ROOT)))
    git("diff","--check","--cached")
    print("PASS: v120 105-photo trial candidate assembled with 194-file lock; original 182 app blobs frozen except manifest, original 93 photos unchanged.")
    print("Exact historical photos appended:",[(p.rsplit("/",1)[-1],d.rsplit("/",1)[-1]) for p,d in expected_images()])
    return new_lock


def validate():
    lock=json.loads(LOCK.read_text(encoding="utf-8"))
    prior=verify_original_v119()
    assert lock["status"].startswith("CANDIDATE_")
    assert lock["candidate_app_files_count"]==194
    paths=git("ls-files","--","app/").splitlines()
    assert len(paths)==194 and set(paths)==set(lock["files"])
    for p,sha in lock["files"].items():
        assert git_blob((ROOT/p).read_bytes())==sha,(p,"v120 lock mismatch")
        if p in prior["files"] and p!="app/src/main/assets/photo_quotes_manifest.js":
            assert sha==prior["files"][p],("v119 file changed",p)
    old=git("show","12016838e98d8c1eadadbb0a96321f4855f1c5cd:app/src/main/assets/photo_quotes_manifest.js")
    paths_old=current_gallery_paths(old)
    paths_new=current_gallery_paths(MANIFEST.read_text(encoding="utf-8"))
    assert len(paths_old)==93 and len(paths_new)==105
    assert paths_new[:93]==paths_old
    assert len(set(paths_new))==105
    for source,dest in expected_images():
        old_blob=git("rev-parse",SOURCE_TAG+":"+source)
        assert git_blob((ROOT/dest).read_bytes())==old_blob,("wrong original photo",source)
        assert ("images/photo_quotes/"+Path(dest).name) in paths_new
    print("PASS: all 194 app files locked; all 12 original historical images exact; original 93 images and all other v119 app files preserved.")


def main():
    import sys
    if len(sys.argv)!=2 or sys.argv[1] not in ("apply","verify"):
        raise SystemExit("Usage: python scripts/prepare_owner_v120_gallery.py [apply|verify]")
    if sys.argv[1]=="apply":
        patch()
    else:
        validate()


if __name__=="__main__":
    main()
