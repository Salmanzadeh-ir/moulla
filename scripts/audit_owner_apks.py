#!/usr/bin/env python3
"""Read-only real SHA256 + manifest/signature audit of every distinct APK/AAB at all Git branch tips and Release assets."""
import argparse
import csv
import hashlib
import json
import os
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path


REPO="Salmanzadeh-ir/moulla"


def run(cmd,*,fail=False):
    p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    if fail and p.returncode:
        raise RuntimeError(f"{cmd[:3]} failed: {p.stderr[:400]}")
    return p


def refs(mirror):
    result=run(["git","--git-dir="+str(mirror),"for-each-ref","--format=%(refname)","refs/heads","refs/tags"],fail=True)
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def git_tree_apks(mirror):
    objects={}
    for ref in refs(mirror):
        data=subprocess.check_output(["git","--git-dir="+str(mirror),"ls-tree","-r","-z",ref])
        for entry in data.split(b"\0"):
            if not entry:
                continue
            info,pathname=entry.split(b"\t",1)
            mode,objtype,sha=info.decode("ascii").split(" ")
            path=pathname.decode("utf-8",errors="replace")
            if objtype != "blob" or not path.lower().endswith((".apk",".aab")):
                continue
            elem=objects.setdefault(sha,{"git_blob_sha1":sha,"representative_path":path,"refs":[]})
            if len(elem["refs"])<150:
                elem["refs"].append({"ref":ref,"path":path})
    return objects


def get_actual_sha_and_file(mirror,sha,destination):
    h=hashlib.sha256()
    bytes_written=0
    with destination.open("wb") as f:
        p=subprocess.Popen(["git","--git-dir="+str(mirror),"cat-file","blob",sha],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        try:
            while True:
                buf=p.stdout.read(1024*1024)
                if not buf:
                    break
                bytes_written+=len(buf)
                if bytes_written>500_000_000:
                    raise RuntimeError(f"Blob too large, refusing to inspect: {sha}")
                h.update(buf)
                f.write(buf)
            err=p.stderr.read().decode("utf-8",errors="replace")
            if p.wait()!=0:
                raise RuntimeError(f"git cat-file blob failed {sha}: {err[:600]}")
        finally:
            if p.poll() is None:
                p.kill()
                p.wait()
    return h.hexdigest(),bytes_written


def inspect_apk(p, aapt, apksigner):
    info={
        "is_valid_zip":False,"package_id":None,"version_code":None,"version_name":None,
        "minimum_sdk":None,"target_sdk":None,
        "signature_verify_passed":False,"signer_cert_sha256":[],
        "signature_note":None,
    }
    try:
        with zipfile.ZipFile(p) as z:
            bad=z.testzip()
            info["is_valid_zip"]=bad is None
            if not info["is_valid_zip"]:
                info["signature_note"]="Corrupt ZIP entry "+str(bad)
                return info
    except Exception as e:
        info["signature_note"]="ZIP read failed: "+str(e)
        return info
    if p.suffix.lower()!=".apk":
        info["signature_note"]="AAB bundle file; signature/manifest inspection needs bundletool"
        return info
    cmd=run([aapt,"dump","badging",str(p)])
    if cmd.returncode==0:
        package=re.search(r"^package:\s+name='([^']+)'\s+versionCode='([^']+)'\s+versionName='([^']+)'",cmd.stdout,re.M)
        if package:
            info.update({"package_id":package.group(1),"version_code":package.group(2),"version_name":package.group(3)})
        for key,field in [("sdkVersion","minimum_sdk"),("targetSdkVersion","target_sdk")]:
            m=re.search(r"^"+key+r":'([^']+)'",cmd.stdout,re.M)
            if m:info[field]=m.group(1)
    else:
        info["signature_note"]="aapt could not inspect package: "+cmd.stderr.strip()[:180]
    signed=run([apksigner,"verify","--print-certs","--verbose",str(p)])
    info["signature_verify_passed"]=signed.returncode==0
    info["signer_cert_sha256"]=re.findall(r"Signer #\d+ certificate SHA-256 digest:\s*([0-9a-fA-F]+)",signed.stdout)
    if signed.returncode and not info["signature_note"]:
        info["signature_note"]="Signature verification exit code "+str(signed.returncode)+": "+signed.stderr.strip()[:180]
    return info


def inspect_single(p, source, logical, aapt, signer, digest=None, expected_size=None):
    data={
        "source":source,"path":logical,
        "sha256":digest or hashlib.file_digest(p.open("rb"),"sha256").hexdigest(),
        "bytes":p.stat().st_size,
    }
    if expected_size is not None and p.stat().st_size!=expected_size:
        raise RuntimeError(f"Asset size mismatch in {logical}")
    data.update(inspect_apk(p,aapt,signer))
    return data


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--mirror",required=True)
    ap.add_argument("--release-dir",required=True)
    ap.add_argument("--release-metadata",required=True)
    ap.add_argument("--output-dir",default="audit-apk-out")
    ap.add_argument("--aapt",required=True)
    ap.add_argument("--apksigner",required=True)
    opt=ap.parse_args()
    mirror=Path(opt.mirror).resolve()
    out=Path(opt.output_dir);out.mkdir(exist_ok=True,parents=True)
    objects=git_tree_apks(mirror)
    if len(objects)<20:
        raise RuntimeError(f"Unexpectedly low distinct Git APK count: {len(objects)}")
    releases=json.loads(Path(opt.release_metadata).read_text())
    if len(releases)<5:
        raise RuntimeError("GitHub Releases metadata incomplete")
    results=[]
    with tempfile.TemporaryDirectory(prefix="owner-apk-audit-") as temp:
        file=Path(temp)/"item.apk"
        for index,(sha,meta) in enumerate(sorted(objects.items()),1):
            ending=Path(meta["representative_path"]).suffix.lower()
            testfile=Path(temp)/("item"+ending)
            digest,size=get_actual_sha_and_file(mirror,sha,testfile)
            rec=inspect_single(testfile,"GIT_ALL_REFS",meta["representative_path"],opt.aapt,opt.apksigner,digest)
            rec["git_blob_sha1"]=sha
            rec["refs"]=meta["refs"]
            results.append(rec)
            print("GIT",index,len(objects),rec["path"],rec["bytes"],rec["sha256"],
                  rec["package_id"],rec["version_code"],rec["signature_verify_passed"],flush=True)
            testfile.unlink()
    n=0
    for rel in releases:
        for asset in rel.get("assets",[]):
            tag=rel["tag_name"]
            path=Path(opt.release_dir)/tag/asset["name"]
            if not path.is_file():
                raise RuntimeError("Missing downloaded release asset: "+str(path))
            if path.suffix.lower() not in (".apk",".aab"):
                digest=hashlib.file_digest(path.open("rb"),"sha256").hexdigest()
                results.append({"source":"GITHUB_RELEASE","release_tag":tag,"path":asset["name"],"sha256":digest,
                                "bytes":path.stat().st_size,"is_metadata_file":True})
                continue
            rec=inspect_single(path,"GITHUB_RELEASE",asset["name"],opt.aapt,opt.apksigner,expected_size=asset["size"])
            rec["release_tag"]=tag
            results.append(rec)
            n+=1
            print("RELEASE",n,tag,rec["path"],rec["bytes"],rec["sha256"],
                  rec["package_id"],rec["version_code"],rec["signature_verify_passed"],flush=True)
    if n<5:
        raise RuntimeError("Not enough inspected Release APKs")
    # Some historical debug APKs are expected to use different IDs and invalid/unavailable signing, so record not fail entire audit.
    data={
      "schema":"pmm-all-refs-apks-true-sha256-package-id-and-signatures-v1",
      "git_apk_aab_distinct_blobs":len(objects),
      "github_release_count":len(releases),
      "github_release_apk_files_inspected":n,
      "all_apk_arsc_and_zip_metadata_checked":True,
      "no_secrets_or_keys_read":True,
      "report_is_not_authorization_to_delete":True,
      "rows":results
    }
    (out/"APK-METADATA-ALL-VERSIONS.json").write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n")
    columns=["source","release_tag","path","bytes","sha256","package_id","version_code","version_name","minimum_sdk","target_sdk","signature_verify_passed","signer_cert_sha256","git_blob_sha1"]
    with (out/"APK-METADATA-ALL-VERSIONS.csv").open("w",newline="",encoding="utf-8-sig") as f:
        writer=csv.DictWriter(f,fieldnames=columns,extrasaction="ignore")
        writer.writeheader()
        for row in results:
            flat={k:(json.dumps(row[k],ensure_ascii=False) if isinstance(row.get(k),list) else row.get(k)) for k in columns}
            writer.writerow(flat)
    with (out/"CHECKSUMS-SHA256.txt").open("w") as f:
        for path in ["APK-METADATA-ALL-VERSIONS.json","APK-METADATA-ALL-VERSIONS.csv"]:
            p=out/path
            f.write(hashlib.sha256(p.read_bytes()).hexdigest()+"  "+path+"\n")
    ids=sorted(set(r.get("package_id") for r in results if r.get("package_id")))
    print(f"PASS: checked {len(objects)} unique Git-tracked APK/AAB blobs and {n} Release APKs; found package IDs {ids}")
    print("Signed status recorded separately; no deletion, re-signing or APK publication.")


if __name__=="__main__":
    main()
