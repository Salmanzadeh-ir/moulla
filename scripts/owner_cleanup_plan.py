#!/usr/bin/env python3
"""Advisory ONLY. Never connects to GitHub and has no code path to delete refs."""
import argparse
import hashlib
import json
from pathlib import Path

REQUIRED_GATES = {
    "owner_approved_candidate_apk_and_sha": False,
    "full_feature_and_data_compatibility_audit": False,
    "off_repository_git_mirror_and_release_assets_backup": False,
    "per_file_sha256_manifest_verified": False,
    "restoration_test_from_independent_storage": False,
    "owner_approved_exact_branch_deletion_list": False,
    "pre_cleanup_ci_green": False,
    "post_cleanup_build_and_tests_planned": False,
}

NEVER_AUTOMATICALLY_DELETE_ROLES={
    "ACTIVE_PROTECTED", "RELEASE_PROTECTED",
    "HISTORICAL_SNAPSHOT_PROTECTED", "HANDOFF_PROTECTED_PENDING_REVIEW",
    "UNKNOWN_PROTECTED",
}


def plan(inventory):
    if not inventory.get("lock_verification", {}).get("passed"):
        raise ValueError("Missing verified active source lock")
    if inventory.get("cleanup_allowed") is not False:
        raise ValueError("Inventory must explicitly forbid cleanup")
    branches=inventory.get("branches")
    if not isinstance(branches,list) or not branches:
        raise ValueError("No branch inventory")
    for b in branches:
        if not b.get("name") or not b.get("head_sha"):
            raise ValueError("Incomplete branch list")
    proposed=[
        {"name":b["name"],"expected_head_sha":b["head_sha"],"role":b["role"],"status":"REVIEW_ONLY_NO_DELETION"}
        for b in branches if b["role"] not in NEVER_AUTOMATICALLY_DELETE_ROLES
    ]
    protected=[
        {"name":b["name"],"role":b["role"]}
        for b in branches if b["role"] in NEVER_AUTOMATICALLY_DELETE_ROLES
    ]
    if "main" not in [b["name"] for b in protected]:
        raise ValueError("main branch is not protected")
    return {
        "schema":"pmm-owner-cleanup-proposal-only-v1",
        "active_main_sha":inventory["generated_for_main_sha"],
        "must_not_execute_deletions":True,
        "all_gates_satisfied":False,
        "gates":REQUIRED_GATES,
        "review_candidates":proposed,
        "protected_branches":protected,
        "protected_tags":inventory.get("tags",[]),
        "protected_releases":inventory.get("releases",[]),
        "deleted_paths_or_branches_or_tags_or_releases":[],
        "mandatory_next_action":"Verify complete external independent restore, compare feature parity, obtain signed explicit owner approval of exact SHA-locked target list, then separately implement tightly-scoped deletion workflow.",
    }


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--inventory",default="audit-output/owner-version-inventory.json")
    p.add_argument("--output-dir",default="audit-output")
    p.add_argument("--self-test",action="store_true")
    opt=p.parse_args()
    if opt.self_test:
        fake={
            "lock_verification":{"passed":True},
            "cleanup_allowed":False,
            "generated_for_main_sha":"abc",
            "branches":[
                {"name":"main","head_sha":"abc","role":"ACTIVE_PROTECTED"},
                {"name":"snapshot/v117","head_sha":"def","role":"HISTORICAL_SNAPSHOT_PROTECTED"},
                {"name":"feature/old","head_sha":"ghi","role":"DEVELOPMENT_REVIEW_ONLY"},
            ],
            "tags":[],"releases":[],
        }
        outcome=plan(fake)
        assert outcome["must_not_execute_deletions"] and not outcome["all_gates_satisfied"]
        assert len(outcome["review_candidates"])==1
        assert {b["name"] for b in outcome["protected_branches"]}=={"main","snapshot/v117"}
        try:
            plan({**fake,"lock_verification":{"passed":False}})
        except ValueError:
            pass
        else:
            raise AssertionError("unverified lock did not stop planner")
        print("PASS: cleanup plan is read-only and fail-closed")
        return
    inv=json.loads(Path(opt.inventory).read_text(encoding="utf-8"))
    result=plan(inv)
    output=Path(opt.output_dir)
    output.mkdir(parents=True,exist_ok=True)
    raw=(json.dumps(result,indent=2,ensure_ascii=False,sort_keys=True)+"\n").encode("utf-8")
    (output/"owner-cleanup-plan-NO-DELETE.json").write_bytes(raw)
    (output/"owner-cleanup-plan-NO-DELETE.md").write_text(
        "# گزارش پیشنهادی پاک‌سازی — بدون هیچ حذف\n\n"
        f"- main: \`{result['active_main_sha']}\`\n"
        f"- شاخه‌های صرفاً نامزد بررسی: {len(result['review_candidates'])}\n"
        f"- شاخه‌های محافظت‌شده: {len(result['protected_branches'])}\n"
        f"- تگ‌های محافظت‌شده: {len(result['protected_tags'])}\n"
        f"- Releaseهای محافظت‌شده: {len(result['protected_releases'])}\n\n"
        "**پاک‌سازی ممنوع است؛ پشتیبان مستقل، بازیابی آزمایشی، ممیزی قابلیت‌ها و تصویب دقیق اسامی وجود ندارد.**\n"
        "این فایل و Artifact، پشتیبان یا مجوز حذف نیستند.\n",
        encoding="utf-8"
    )
    print("PASS: read-only cleanup proposal; deleted zero refs, tags, releases, or APKs")
    print("Plan sha256:",hashlib.sha256(raw).hexdigest())


if __name__=="__main__":
    main()
