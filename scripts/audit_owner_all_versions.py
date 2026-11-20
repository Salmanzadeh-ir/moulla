#!/usr/bin/env python3
"""Owner's fail-closed, read-only integration audit. Never modifies app or refs."""
import argparse
import collections
import hashlib
import io
import json
import os
import re
import subprocess
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageOps
except ImportError:
    Image = ImageDraw = ImageOps = None

ROOT = Path(__file__).resolve().parents[1]
MARKERS = [
    ("offline_course", "pmm_offline_course.js"),
    ("offline_course_state", "pmm_offline_course_logic.js"),
    ("audio_on_demand", "pmm_audio_stream_helper.js"),
    ("kafi_resume", "pmm_kafi_resume_screenoff.js"),
    ("online_content_updates", "pmm_online_updates.js"),
    ("text_notes_navigation", "index.html"),
]
MILESTONES = [
    ("v10.4.9", "refs/tags/v10.4.9"),
    ("V16", "4d2c84863deef5f3c948b734f11e471949127d89"),
    ("v117", "3c2ab679576337fb6a35786f88d8b737d4366a7b"),
    ("v118", "0fce031b91ffd90893482dba664a8bd0704fac98"),
    ("v119", "refs/heads/main"),
]


def git(mirror, *args, data=False, check=True):
    cmd = ["git", "--git-dir=" + str(mirror), *args]
    p = subprocess.run(cmd, capture_output=True, check=False)
    if check and p.returncode != 0:
        raise RuntimeError(f"git {args} exited {p.returncode}: {p.stderr.decode(errors='replace')[:1000]}")
    return p.stdout if data else p.stdout.decode("utf-8", errors="replace")


def trees(mirror, ref, prefix="app/"):
    args = ("ls-tree", "-r", "-z", ref, "--", prefix) if prefix else ("ls-tree", "-r", "-z", ref)
    output = git(mirror, *args, data=True)
    out = {}
    for entry in output.split(b"\0"):
        if not entry:
            continue
        info, name = entry.split(b"\t", 1)
        mode, objtype, sha = info.decode("ascii").split(" ")
        if objtype != "blob":
            continue
        out[name.decode("utf-8")] = sha
    return out


def commits_and_branches(mirror, active):
    raw = git(mirror, "for-each-ref", "--format=%(refname)\t%(objectname)", "refs/heads")
    all_branches = []
    main_blobs = trees(mirror, "refs/heads/main")
    main_sha_values = set(main_blobs.values())
    for line in raw.splitlines():
        ref, sha = line.split("\t")
        name = ref[len("refs/heads/"):]
        was_merged = subprocess.run(["git", "--git-dir=" + str(mirror), "merge-base", "--is-ancestor", sha, active], capture_output=True).returncode == 0
        if name == "main":
            all_branches.append({"name": name, "sha": sha, "role": "ONLY_ACTIVE_SOURCE", "ancestor_of_main": True,
                                 "potential_unrepresented_app_blobs": [], "count": 0})
            continue
        merge = subprocess.run(["git", "--git-dir=" + str(mirror), "merge-base", sha, active], capture_output=True, text=True)
        mb = merge.stdout.strip() if merge.returncode == 0 else None
        tips = trees(mirror, sha)
        changes = []
        if mb:
            added = git(mirror, "diff", "--name-only", "--diff-filter=AMR", mb, sha, "--", "app/")
            for path in [line for line in added.splitlines() if line]:
                head_blob = tips.get(path)
                if not head_blob:
                    continue
                main_blob = main_blobs.get(path)
                if head_blob == main_blob:
                    continue
                exact_equivalent_anywhere = head_blob in main_sha_values
                changes.append({
                    "path": path,
                    "branch_blob_sha": head_blob,
                    "main_path_blob_sha": main_blob,
                    "same_blob_somewhere_in_main": exact_equivalent_anywhere,
                    "file_missing_from_main": main_blob is None
                })
        # Most divergences are earlier iterations of current code, not safe to resurrect.
        candidates = [item for item in changes if not item["same_blob_somewhere_in_main"]]
        all_branches.append({
            "name":name,"sha":sha,
            "role":"HISTORICAL_OR_CANDIDATE_UNTIL_OWNER_AUDIT",
            "ancestor_of_main":was_merged,"merge_base":mb,
            "unrepresented_in_main_blob_count":len(candidates),
            "unrepresented_exact_blob_deltas":candidates,
            "count":len(candidates),
            "note":"A different SHA is NOT proof that a feature was lost; review semantics before any transplant."
        })
    all_branches.sort(key=lambda b:b["name"])
    return all_branches, main_blobs


def summarize_milestones(mirror):
    found = []
    for name, ref in MILESTONES:
        files = trees(mirror,ref)
        images = [p for p in files if re.search(r"assets/images/photo_quotes/quote_\d+\.",p)]
        fonts = [p for p in files if "/fonts/" in p]
        java = [p for p in files if p.endswith(".java")]
        snapshot = {
            "version":name, "git_ref":ref, "file_count_in_app":len(files),
            "gallery_image_count":len(images), "font_file_count":len(fonts),
            "java_file_count":len(java),
            "source_modules":{
                label: any(p.endswith("/"+filename) for p in files)
                for label, filename in MARKERS
            },
            "gradle_identifiers_are_historical_not_installed_apk_metadata":True
        }
        found.append(snapshot)
    return found


def hamming(a,b):
    return (a^b).bit_count()


def dhash(img):
    gray=ImageOps.grayscale(img).resize((9,8),Image.Resampling.LANCZOS)
    data=list(gray.getdata());bits=0
    for y in range(8):
        for x in range(8):
            bits=(bits<<1)|int(data[y*9+x]>data[y*9+x+1])
    return bits


def ahash(img):
    gray=ImageOps.grayscale(img).resize((8,8),Image.Resampling.LANCZOS)
    vals=list(gray.getdata());m=sum(vals)/64
    result=0
    for v in vals:
        result=(result<<1)|int(v>m)
    return result


def image_normalize(b):
    return ImageOps.exif_transpose(Image.open(io.BytesIO(b))).convert("RGB")


def image_signature(img):
    return (dhash(img),ahash(img))


def image_distance(x, y):
    d=hamming(x[0],y[0]);a=hamming(x[1],y[1])
    return d * 1.0 + a * 0.55, d,a


def check_legacy_images(mirror,outdir,main_files):
    if Image is None:
        raise RuntimeError("Pillow unavailable: failing closed because visual audit was requested")
    old=trees(mirror, "refs/tags/v10.4.9")
    old_images=sorted(
        p for p in old
        if re.search(r"assets/images/guest_album/\d+\.jpe?g$",p)
    )
    current_images=sorted(p for p in main_files if re.search(r"assets/images/photo_quotes/quote_\d+\.",p))
    if len(old_images)!=18 or len(current_images)!=93:
        raise RuntimeError(f"Legacy image inventory unexpectedly changed, old={len(old_images)}, new={len(current_images)}")

    def loadblob(sha):
        return git(mirror, "cat-file", "blob", sha, data=True)
    current_img={p:image_normalize(loadblob(main_files[p])) for p in current_images}
    current_sig={p:image_signature(img) for p,img in current_img.items()}
    old_img={p:image_normalize(loadblob(old[p])) for p in old_images}
    old_sha_to_main=collections.defaultdict(list)
    for p,sha in main_files.items():
        old_sha_to_main[sha].append(p)
    rows=[]
    sheet=Image.new("RGB",(900,len(old_images)*160+60),"white")
    draw=ImageDraw.Draw(sheet)
    draw.text((12,8),"v10.4.9 guest_album vs v119 photo_quotes: exact Git blob and perceptual nearest candidates",fill="black")
    for i,path in enumerate(old_images):
        img=old_img[path]
        matched=old_sha_to_main.get(old[path],[])
        nearest=[]
        sig=image_signature(img)
        for current in current_images:
            score,dh,ah=image_distance(sig,current_sig[current])
            nearest.append({"current_path":current,"rank_score":round(score,2),"dhash_distance":dh,
                            "ahash_distance":ah,"same_git_blob":old[path]==main_files[current]})
        nearest.sort(key=lambda x:(x["rank_score"],x["dhash_distance"],x["current_path"]))
        # If there is an exact byte match, always include it as first proposal.
        exact=[x for x in nearest if x["same_git_blob"]]
        head=exact[:1] + [x for x in nearest if not x["same_git_blob"]][:3] if exact else nearest[:3]
        head=head[:3]
        rows.append({
            "old_path":path, "old_git_blob_sha":old[path],
            "exact_identical_blob_paths_anywhere_in_main":matched,
            "byte_identical_match_found":bool(matched),
            "nearest_visual_candidates_NOT_VERIFIED_AS_EQUIVALENT":head,
            "verification":"EXACT_BLOB" if matched else "VISUAL_REVIEW_REQUIRED"
        })
        top=40+i*160
        t=ImageOps.contain(img,(170,115))
        sheet.paste(t,(15,top+18))
        draw.text((15,top),path.rsplit("/",1)[-1],fill="black")
        for j,c in enumerate(head):
            p=c["current_path"]
            t=ImageOps.contain(current_img[p],(170,115))
            xpos=230+j*218
            sheet.paste(t,(xpos,top+18))
            draw.text((xpos,top),f"{p.rsplit('/',1)[-1]} d={c['dhash_distance']} a={c['ahash_distance']}",fill="black")
        draw.line((8,top+153,892,top+153),fill="#cccccc",width=1)
    sheet.save(outdir/"LEGACY-PHOTO-COMPARISON.png")
    exact_count=sum(x["byte_identical_match_found"] for x in rows)
    return {"v10_4_9_image_count":len(old_images),"v119_gallery_count":len(current_images),
            "exact_blob_matches":exact_count,"unverified_image_count":len(rows)-exact_count,
            "important":"A near perceptual match is NOT proof of feature preservation. Owner/visual review needed.",
            "old_images":rows}


def apk_git_blobs(mirror, branches):
    index={}
    for b in branches:
        full=trees(mirror,"refs/heads/"+b["name"],prefix="")
        for path,sha in full.items():
            if path.lower().endswith((".apk",".aab")):
                k=sha
                entry=index.setdefault(k,{"git_blob_sha":sha,"paths_and_branch_examples":[]})
                if len(entry["paths_and_branch_examples"])<25:
                    entry["paths_and_branch_examples"].append({"branch":b["name"],"path":path})
    return sorted(index.values(),key=lambda x:x["git_blob_sha"])


def write_reports(out,report):
    raw=(json.dumps(report,ensure_ascii=False,indent=2,sort_keys=True)+"\n").encode("utf-8")
    (out/"OWNER-UNIFICATION-AUDIT.json").write_bytes(raw)
    b=report["branches"]
    with_deltas=[x for x in b if x["count"]>0 and not x["ancestor_of_main"]]
    lines=[
        "# Owner all-version integration audit (READ ONLY, NO APP CHANGE, NO DELETE)",
        "",f"Main SHA: \`{report['main_sha']}\`",
        f"All branch tips audited: **{len(b)}**; all Git tags: **{report['tag_count']}**",
        f"Branches with at least one differing app blob after fork: **{len(with_deltas)}**",
        f"Unique .apk/.aab Git blobs among branch tips: **{len(report['git_apk_blobs'])}**",
        f"v10.4.9 historical photos: {report['legacy_photos']['v10_4_9_image_count']}",
        f"Exact old photo byte matches: **{report['legacy_photos']['exact_blob_matches']}**",
        f"Historical photos requiring visual/content audit: **{report['legacy_photos']['unverified_image_count']}**",
        "",
        "## Milestone source facts (not device certification)",
        "",
        "| Ref | app files | 93-photo gallery count | font files | Java classes |",
        "|---|---:|---:|---:|---:|",
    ]
    for m in report["milestones"]:
        lines.append(f"| {m['version']} | {m['file_count_in_app']} | {m['gallery_image_count']} | {m['font_file_count']} | {m['java_file_count']} |")
    lines+=["","## Branches with different app changes after diverging from main",
    "These are **investigation leads, not missing functionality proofs**: changes may be older alternatives superseded by main. Never blindly merge them.",""]
    for branch in sorted(with_deltas,key=lambda x:-x["count"]):
        lines.append(f"- \`{branch['name']}\`: {branch['count']} different app blob(s) not byte-identical in active main; see JSON for file-level details")
    lines+=["","## 18 legacy album photos compared visually","",
    "| Original | Exact identical blob anywhere in main? | Nearest new photo candidate / distances |",
    "|---|---|---|"]
    for pic in report["legacy_photos"]["old_images"]:
        k=pic["old_path"].rsplit("/",1)[-1]
        exact="yes" if pic["byte_identical_match_found"] else "**NO**"
        c=pic["nearest_visual_candidates_NOT_VERIFIED_AS_EQUIVALENT"][0]
        value=c["current_path"].rsplit("/",1)[-1]+f" (dHash={c['dhash_distance']}, aHash={c['ahash_distance']})"
        lines.append(f"| {k} | {exact} | {value} |")
    lines += ["","## Mandatory holds","",
        "- A visual image match remains unconfirmed until owner checks content; 12 historical photos have no identical bytes.",
        "- All branch-tip deltas require semantic review; not all experimental branch behavior was owner-approved.",
        "- Data migration on compatible installed package and reboot/notification behavior require independent device checks if app source changes.",
        "- No official APK, signing ID, tags, GitHub Releases, or main app files were altered.",
        "- **No destructive cleanup, no active code merge and no release without approved test APK and independently stored backup.**",
        "", "Other evidence: JSON inventory, image contact sheet, and GitHub Actions successful run.", ""]
    (out/"OWNER-UNIFICATION-AUDIT.md").write_text("\n".join(lines),encoding="utf-8")
    (out/"REPORT-SHA256SUMS.txt").write_text(
        "".join(f"{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n" for p in sorted(out.iterdir()) if p.is_file() and p.name!="REPORT-SHA256SUMS.txt"),
        encoding="utf-8"
    )


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--mirror",required=True)
    ap.add_argument("--output-dir",default="audit-integration-out")
    args=ap.parse_args()
    mirror=Path(args.mirror).resolve()
    out=Path(args.output_dir).resolve();out.mkdir(parents=True,exist_ok=True)
    sha=git(mirror,"rev-parse","refs/heads/main").strip()
    if sha!="d811536ca2bf7f630eb450a30e1d17d31f6d4bc9":
        raise RuntimeError(f"Unexpected moving main while auditing: {sha}. Stop and review.")
    branches,main_files=commits_and_branches(mirror,sha)
    milestones=summarize_milestones(mirror)
    if len(branches)<79 or len(main_files)!=182:
        raise RuntimeError("Repository inventory unexpected. Refuse incomplete audit.")
    tags=git(mirror,"for-each-ref","--format=%(refname)", "refs/tags").splitlines()
    pics=check_legacy_images(mirror,out,main_files)
    apks=apk_git_blobs(mirror,branches)
    report={
        "schema":"pmm-owner-semantic-integration-leads-v1",
        "main_sha":sha, "main_active_version":"v119",
        "branches":branches,"branch_count":len(branches),
        "tag_count":len(tags), "tag_names":tags,
        "milestones":milestones, "legacy_photos":pics, "git_apk_blobs":apks,
        "approved_app_modified":False,"files_deleted":False,
        "no_backup_destination_proven_on_owner_phone":True,
        "cleanup_authorized":False
    }
    write_reports(out,report)
    print(f"PASS READ-ONLY INTEGRATION AUDIT: {len(branches)} branches, {len(tags)} tags, {len(main_files)} main app files, {len(apks)} unique APK/AAB Git blobs")
    print(f"LEGACY PHOTO COMPARISON: {pics['exact_blob_matches']} exact of {pics['v10_4_9_image_count']}, {pics['unverified_image_count']} need semantic review")
    print("Branches with app changes not byte-identical to main (not proof of missing features):")
    for x in sorted([b for b in branches if b["count"]>0 and not b["ancestor_of_main"]],key=lambda z:-z["count"])[:22]:
        print("  ",x["count"],x["name"])
    for x in pics["old_images"]:
        c=x["nearest_visual_candidates_NOT_VERIFIED_AS_EQUIVALENT"][0]
        print("PHOTO",x["old_path"].split("/")[-1],
              "EXACT" if x["byte_identical_match_found"] else "REVIEW",
              c["current_path"].split("/")[-1],
              "dHash",c["dhash_distance"],"aHash",c["ahash_distance"])
    print("NO FILES DELETED OR APP MODIFIED. SHA256 audit outputs:")
    print((out/"REPORT-SHA256SUMS.txt").read_text())
    print(f"Output files at {out}")


if __name__=="__main__":
    main()
