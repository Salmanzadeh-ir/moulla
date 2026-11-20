#!/usr/bin/env python3
"""Fail-closed OWNER cleanup eligibility report. No GitHub API writes or delete functionality."""
import argparse
import hashlib
import json
from pathlib import Path

PROTECT_EXACT={
 "main","owner-v119-handoff-20261120","v16-direct-download",
 "download/owner-v119-review-44670627786-1",
 "feature/owner-v120-restore-12-historical-photos-20261120",
 "feature/owner-v121-unified-learning-safe-trial-20261120",
 "feature/owner-approved-ux-audio-library-v108-trial-20261117",
 "feature/owner-learning-experience-except-search-20261117",
}
PROTECT_PREFIX=("release/","release-","snapshot/","transfer/","download/","owner-")
REVIEW_PREFIX=("feature/","fix/","chore/","integration/","automation/","audit/","policy/")


def parse_backup_refs(lines):
    refs={}
    for text in lines.splitlines():
        if not text.strip():
            continue
        fields=text.strip().split()
        if len(fields)<2:
            raise ValueError("Malformed saved Git ref")
        ref,sha=fields[:2]
        if not ref.startswith("refs/heads/"):
            continue
        name=ref[len("refs/heads/"):]
        if name in refs or len(sha)!=40 or not all(c in "0123456789abcdef" for c in sha):
            raise ValueError("Duplicate/malformed backup branch SHA")
        refs[name]=sha
    if len(refs)<78 or "main" not in refs:
        raise ValueError("Incomplete backup ref inventory")
    return refs


def build_plan(backup,current,prs):
    if not isinstance(current,list) or len(current)<80:
        raise ValueError("Incomplete live branch API inventory")
    if not isinstance(prs,list):
        raise ValueError("Open PR inventory unavailable")
    live={}
    for b in current:
        name=b.get("name")
        sha=b.get("commit",{}).get("sha")
        if not isinstance(name,str) or name in live or not isinstance(sha,str) or len(sha)!=40:
            raise ValueError("Missing/duplicate/malformed live branch")
        live[name]=sha
    if "main" not in live:
        raise ValueError("Missing protected main")
    open_heads=set()
    for p in prs:
        if p.get("state")=="open" and p.get("head",{}).get("ref"):
            open_heads.add(p["head"]["ref"])
    findings=[]
    for name,sha in sorted(live.items()):
        archived_sha=backup.get(name)
        matches=archived_sha==sha
        if name in PROTECT_EXACT or name in open_heads or name.startswith(PROTECT_PREFIX):
            reason="PROTECTED_ACTIVE_OR_RELEASE_OR_HANDOFF_OR_SOURCE_PENDING_FEATURE_OR_PR"
            proposed="KEEP"
        elif not matches:
            reason="NOT_BYTE_EXACT_IN_DOWNLOADED_BACKUP_OR_BRANCH_MOVED"
            proposed="KEEP_UNTIL_NEW_BACKUP"
        elif name.startswith(REVIEW_PREFIX):
            reason="BACKED_UP_AT_EXACT_BRANCH_SHA_BUT_REQUIRES_SEMANTIC_PARITY_AND_ITEMIZED_APPROVAL"
            proposed="REVIEW_CANDIDATE_ONLY"
        else:
            reason="UNKNOWN_ROLE_PROTECTED"
            proposed="KEEP"
        findings.append({
            "branch":name,"current_head_sha":sha,
            "backed_up_ref_head_sha":archived_sha,
            "exact_tip_head_in_original_phone_archive":matches,
            "open_pull_request_head":name in open_heads,
            "recommendation":proposed,
            "reason":reason,
        })
    review=[x for x in findings if x["recommendation"]=="REVIEW_CANDIDATE_ONLY"]
    missing=[x for x in findings if x["backed_up_ref_head_sha"] is None]
    changed=[x for x in findings if x["backed_up_ref_head_sha"] is not None and not x["exact_tip_head_in_original_phone_archive"]]
    return {
        "schema":"pmm-sha-locked-advisory-branch-cleanup-plan-v1",
        "downloaded_backup_archive_manifest_ref_count":len(backup),
        "current_branches":len(live),
        "archived_head_matches":sum(x["exact_tip_head_in_original_phone_archive"] for x in findings),
        "new_unarchived_heads":missing,
        "moved_heads_since_backup":changed,
        "open_pr_heads":sorted(open_heads),
        "review_candidates_exact_sha_only":review,
        "protected_branches":[x for x in findings if x["recommendation"]!="REVIEW_CANDIDATE_ONLY"],
        "deletions_performed":[],
        "approved_exact_delete_manifest":None,
        "owner_phone_file_sha256_verified":False,
        "all_historical_approved_features_transferred":False,
        "latest_candidate_apk_owner_device_approved":False,
        "signing_and_market_releases_unchanged":True,
        "delete_operations_allowed":False,
        "note":"This is an advisory report, not an executable deletion plan. Never delete tags, releases, branch refs, APKs or source until all gates are separately proven and itemized owner authorization is supplied."
    }


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--archived-refs",required=True)
    ap.add_argument("--branches-json",required=True)
    ap.add_argument("--open-prs-json",required=True)
    ap.add_argument("--output",default="cleanup-audit")
    p=ap.parse_args()
    backup=parse_backup_refs(Path(p.archived_refs).read_text())
    branches=json.loads(Path(p.branches_json).read_text())
    prs=json.loads(Path(p.open_prs_json).read_text())
    plan=build_plan(backup,branches,prs)
    out=Path(p.output)
    out.mkdir(parents=True,exist_ok=True)
    data=(json.dumps(plan,indent=2,ensure_ascii=False,sort_keys=True)+"\n").encode()
    (out/"EXACT-BRANCH-CLEANUP-REVIEW-ONLY.json").write_bytes(data)
    candidate=plan["review_candidates_exact_sha_only"]
    protected=plan["protected_branches"]
    lines=[
      "# پای منبر مولا — فهرست SHA-قفل‌شده شاخه‌های پیشنهادی برای بررسی پاک‌سازی",
      "",
      "## هشدار: هیچ حذف مجاز یا انجام نشده است",
      "",
      "این فهرست یک **بررسی مقدماتی و فقط‌خواندنی** است؛ انتقال تمام امکانات تأییدشده، تایید APK جدید و SHA فایل پشتیبان **روی گوشی مالک** هنوز کامل نشده‌اند.",
      "",
      f"- شاخه‌های فعلی: **{plan['current_branches']}**",
      f"- شاخه‌های موجود در پشتیبان اصلی Git: **{plan['downloaded_backup_archive_manifest_ref_count']}**",
      f"- نوک شاخه‌ها که دقیقاً با نسخه پشتیبان برابر است: **{plan['archived_head_matches']}**",
      f"- شاخه‌های جدید بدون آن مرجع دقیق: **{len(plan['new_unarchived_heads'])}**",
      f"- شاخه‌های با SHA تغییرکرده پس از پشتیبان: **{len(plan['moved_heads_since_backup'])}**",
      f"- نامزدهای صرفاً قابل بررسی: **{len(candidate)}** (نه تایید‌شده برای حذف)",
      f"- شاخه‌های محافظت‌شده: **{len(protected)}**",
      "",
      "## نامزدهای بررسی با نام و SHA دقیق (بدون مجوز حذف)",
      "",
      "| نام شاخه | SHA در GitHub، برابر SHA موجود در پشتیبان |",
      "|---|---|",
    ]
    for x in candidate:
        lines.append(f"| \`{x['branch']}\` | \`{x['current_head_sha']}\` |")
    lines.extend(["","## شاخه‌های محافظت‌شده یا تغییرکرده","",
                  "| شاخه | HEAD کنونی | دلیل توقف |","|---|---|---|"])
    for x in protected:
        lines.append(f"| \`{x['branch']}\` | \`{x['current_head_sha']}\` | {x['reason']} |")
    lines.extend(["","## شرایط لازم پیش از حذف","",
      "۱. مالک SHA256 بایت‌های واقعی فایل ZIP ذخیره‌شده **در گوشی** را با SHA منتشرشده تطبیق دهد.",
      "۲. همه قابلیت‌های تاریخی لازم، از جمله سرویس‌های صوتی آزمایشی Native، تعیین تکلیف و نسخه یکپارچه با APK جدید و SHA مشخص روی گوشی تایید شوند.",
      "۳. بعد از آزمون، مالک **نام‌های دقیق** این جدول را برای حذف جداگانه تایید کند؛ تگ‌ها و Releaseها نیازمند اجازه موردی مستقل هستند.",
      "۴. پشتیبان تازه‌ای از refs/اصلاحات جدید پس از پشتیبان اصلی تهیه و خارج مخزن ذخیره و بازیابی شود.",
      "۵. تطبیق دوباره SHA هر شاخه درست در لحظه حذف؛ هر عدم تطبیق یا CI قرمز، توقف و حذف صفر.",
      "۶. حذف فقط در Workflow مخصوص با حداقل دسترسی و گزارش کامل و آزمون دوباره.",
      "",
      "**نتیجه: هیچ شاخه، تگ، Release یا APK حذف نشده و عملیات حذف غیر‌فعال است.**",
      "",
    ])
    md="\n".join(lines).encode()
    (out/"EXACT-BRANCH-CLEANUP-REVIEW-ONLY.md").write_bytes(md)
    with (out/"SHA256SUMS.txt").open("w") as f:
        for name in ["EXACT-BRANCH-CLEANUP-REVIEW-ONLY.json","EXACT-BRANCH-CLEANUP-REVIEW-ONLY.md"]:
            f.write(hashlib.sha256((out/name).read_bytes()).hexdigest()+"  "+name+"\n")
    assert plan["delete_operations_allowed"] is False
    print("PASS: matched %d/%d exact branch tips, %d review-only candidates, %d protected; ZERO DELETIONS"%
          (plan['archived_head_matches'],plan['current_branches'],len(candidate),len(protected)))


if __name__=="__main__":
    main()
