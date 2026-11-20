#!/usr/bin/env python3
"""Read-only owner version inventory. NEVER performs GitHub writes or cleanup."""
import argparse
import base64
import hashlib
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

REPO = "Salmanzadeh-ir/moulla"
BASE = f"https://api.github.com/repos/{REPO}"
UA = "PMM-owner-version-inventory/1.0"


def classify(name):
    """Classification is advisory only; none is permission to delete."""
    if name == "main":
        return "ACTIVE_PROTECTED"
    if name.startswith(("release/", "release-")):
        return "RELEASE_PROTECTED"
    if name.startswith("snapshot/"):
        return "HISTORICAL_SNAPSHOT_PROTECTED"
    if name == "owner-v119-handoff-20261120" or name.startswith("transfer/"):
        return "HANDOFF_PROTECTED_PENDING_REVIEW"
    if name.startswith("download/"):
        return "APK_DOWNLOAD_NEEDS_EXTERNAL_BACKUP"
    if name.startswith(("feature/", "fix/", "chore/", "integration/", "automation/")):
        return "DEVELOPMENT_REVIEW_ONLY"
    return "UNKNOWN_PROTECTED"


def request_json(path, token):
    if not path.startswith("/"):
        raise ValueError("Only GitHub repository-relative URL paths are accepted")
    req = urllib.request.Request(
        BASE + path,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": UA,
            **({"Authorization": f"Bearer {token}"} if token else {}),
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    with urllib.request.urlopen(req, timeout=40) as resp:
        return json.load(resp)


def pages(path, token):
    result = []
    for page in range(1, 21):
        delimiter = "&" if "?" in path else "?"
        batch = request_json(f"{path}{delimiter}per_page=100&page={page}", token)
        if not isinstance(batch, list):
            raise RuntimeError(f"API did not return list for {path}: {type(batch)}")
        result.extend(batch)
        if len(batch) < 100:
            return result
    raise RuntimeError("Pagination exceeded 20 pages; refusing incomplete inventory")


def read_file(path, token):
    obj = request_json("/contents/" + urllib.parse.quote(path, safe="/") + "?ref=main", token)
    if obj.get("encoding") != "base64":
        raise RuntimeError(f"Unexpected content encoding for {path}")
    return base64.b64decode(obj["content"], validate=False)


def validate_main_lock(tree, lock, config):
    expected = lock.get("files")
    if not isinstance(expected, dict):
        raise RuntimeError("Active lock missing file object")
    app = {
        item["path"]: item["sha"]
        for item in tree
        if item.get("type") == "blob" and item.get("path", "").startswith("app/")
    }
    required = config["active_app_files"]
    if len(app) != len(expected) or len(app) != required:
        raise RuntimeError(f"Active app/ count mismatch: tree={len(app)} lock={len(expected)} expected={required}")
    missing, unexpected = sorted(set(expected) - set(app)), sorted(set(app) - set(expected))
    mismatches = [name for name, sha in expected.items() if app.get(name) != sha]
    if missing or unexpected or mismatches:
        raise RuntimeError(f"FAIL-CLOSED active lock: missing={missing}, unexpected={unexpected}, changed={mismatches}")
    return {"passed": True, "active_app_file_count":len(app), "active_app_blob_hashes_match": True}


def generate(token):
    meta = json.loads(read_file("design/owner-active-version.json", token))
    if meta.get("active_branch") != "main":
        raise RuntimeError("Active version manifest must point only to main")
    lock = json.loads(read_file(meta["active_lock"], token))
    main = request_json("/branches/main", token)
    head = main["commit"]["sha"]
    tree = request_json(f"/git/trees/{head}?recursive=1", token)
    if tree.get("truncated"):
        raise RuntimeError("GitHub returned truncated tree; no incomplete inventory permitted")
    check = validate_main_lock(tree["tree"], lock, meta)
    refs = pages("/branches", token)
    if len({b["name"] for b in refs}) != len(refs):
        raise RuntimeError("Duplicated branches from GitHub API")
    if not any(b["name"] == "main" and b["commit"]["sha"] == head for b in refs):
        raise RuntimeError("main is absent or inconsistent in branch listing")
    tags = request_json("/git/matching-refs/tags/", token)
    releases = pages("/releases", token)
    apk_in_main = [
        {"path":x["path"],"size_bytes":x.get("size"),"git_blob_sha1_not_binary_sha256":x.get("sha")}
        for x in tree["tree"] if x.get("type") == "blob" and x["path"].lower().endswith((".apk", ".aab"))
    ]
    branches = [
        {"name":b["name"], "head_sha":b["commit"]["sha"], "role":classify(b["name"])}
        for b in refs
    ]
    tag_list = [
        {"ref":t["ref"],"object_sha":t["object"]["sha"],"object_type":t["object"]["type"],"role":"TAG_PROTECTED"}
        for t in tags
    ]
    release_list = [
        {
            "tag":r["tag_name"], "release_id":r["id"],
            "draft":r["draft"], "prerelease":r["prerelease"],
            "assets":[
                {
                    "name":a["name"], "asset_id":a["id"],"size_bytes":a["size"],
                    "sha256":"NOT_DOWNLOADED_OR_VERIFIED"
                } for a in r.get("assets", [])
            ],
            "role":"RELEASE_PROTECTED_NEEDS_SEPARATE_OWNER_APPROVAL"
        } for r in releases
    ]
    report={
        "schema":"pmm-owner-readonly-repository-inventory-v1",
        "generated_for_main_sha":head,
        "active_version":meta["active_version"],
        "active_lock_path":meta["active_lock"],
        "lock_verification":check,
        "github_repository":REPO,
        "roles_are_advisory_not_deletion_approval":True,
        "branch_count":len(branches),
        "branches":branches,
        "tag_count":len(tag_list),
        "tags":tag_list,
        "release_count":len(release_list),
        "releases":release_list,
        "apk_files_in_main_count":len(apk_in_main),
        "apk_files_in_main":apk_in_main,
        "content_tree_files":sum(1 for t in tree["tree"] if t["type"] == "blob"),
        "backup_independent_and_restorable":False,
        "owner_approved_exact_deletion_targets":False,
        "actual_sha256_of_remote_historical_apks":"NOT_VERIFIED",
        "cleanup_allowed":False,
        "deleted_branches_or_tags_or_releases":[],
        "note":"Repository inventory is metadata and source hashes only; not a byte-for-byte external backup, restore test, complete device feature audit or approval to delete."
    }
    return report


def save(report, output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)
    data=json.dumps(report,ensure_ascii=False,indent=2,sort_keys=True).encode("utf-8")+b"\n"
    (output_dir/"owner-version-inventory.json").write_bytes(data)
    digest=hashlib.sha256(data).hexdigest()
    (output_dir/"SHA256SUMS.txt").write_text(f"{digest}  owner-version-inventory.json\n", encoding="utf-8")
    roles=Counter(b["role"] for b in report["branches"])
    lines=[
        "# پای منبر مولا — گزارش خودکار فقط-خواندنی موجودی نسخه‌ها",
        "",
        f"- Active main SHA: \`{report['generated_for_main_sha']}\`",
        f"- Active version: **{report['active_version']}**",
        f"- Active app lock: **{report['lock_verification']['active_app_file_count']} exact Git blobs PASS**",
        f"- Git branches: **{report['branch_count']}**; tags: **{report['tag_count']}**; releases: **{report['release_count']}**",
        f"- APK/AAB blobs inside main tree: **{report['apk_files_in_main_count']}** (binary SHA-256 not downloaded or checked)",
        "",
        "## طبقه‌بندی شاخه‌ها (صرفاً پیشنهادی)",
        "",
    ] + [f"- {k}: {v}" for k,v in sorted(roles.items())] + [
        "",
        "## حالت ایمنی",
        "",
        "**NO CLEANUP AUTHORIZED. NO BRANCH, TAG, RELEASE OR FILE DELETED.**",
        "This report does not prove that historical functionality is completely incorporated.",
        "GitHub Actions artifacts are not durable off-repository backups.",
        "",
        "## لیست دقیق منابع",
        "",
        "The accompanying JSON records every branch SHA, tag object SHA, release asset name/size and APK blob path.",
    ]
    (output_dir/"owner-version-inventory.md").write_text("\n".join(lines)+"\n", encoding="utf-8")
    print(f"PASS: {len(report['branches'])} branches, {len(report['tags'])} tags, {len(report['releases'])} releases; main active lock valid; cleanup denied")
    print("Inventory sha256:",digest)


def self_test():
    expected={
        "main":"ACTIVE_PROTECTED",
        "release/prod":"RELEASE_PROTECTED",
        "snapshot/old":"HISTORICAL_SNAPSHOT_PROTECTED",
        "owner-v119-handoff-20261120":"HANDOFF_PROTECTED_PENDING_REVIEW",
        "download/old":"APK_DOWNLOAD_NEEDS_EXTERNAL_BACKUP",
        "feature/old":"DEVELOPMENT_REVIEW_ONLY",
        "unknown-name":"UNKNOWN_PROTECTED",
    }
    for k,v in expected.items():
        assert classify(k)==v
    sample = [{"path":"app/a","type":"blob","sha":"111"},{"path":"app/b","type":"blob","sha":"222"}]
    lock={"files":{"app/a":"111","app/b":"222"}}
    cfg={"active_app_files":2}
    assert validate_main_lock(sample,lock,cfg)["passed"]
    for broken in ({"files":{"app/a":"111"}}, {"files":{"app/a":"wrong","app/b":"222"}}):
        try:
            validate_main_lock(sample,broken,cfg)
        except RuntimeError:
            pass
        else:
            raise AssertionError("fail closed verification did not fail")
    print("PASS: owner governance classification and active Git blob integrity fail-closed tests")


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--self-test",action="store_true")
    p.add_argument("--output-dir",default="audit-output")
    args=p.parse_args()
    if args.self_test:
        self_test()
        return
    token=os.environ.get("GITHUB_TOKEN", "")
    if not token:
        raise SystemExit("GITHUB_TOKEN (read-only) is required; refusing unchecked output")
    save(generate(token),Path(args.output_dir))


if __name__=="__main__":
    main()
