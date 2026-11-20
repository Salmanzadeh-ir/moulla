#!/usr/bin/env python3
"""Apply ONLY verified owner v123 trial changes on CI; never change main or release signing."""
import argparse, hashlib, io, json, re, subprocess, tempfile, zipfile
from pathlib import Path
import requests
from PIL import Image
import numpy as np
import cv2
from fontTools.ttLib import TTFont

ROOT=Path(__file__).resolve().parents[1]
BASE_APP_COUNT=195
EXPECTED_PARENT="a90bfde7a6ac3d1aa79429a2a08baa356f036f46"
APP=ROOT/"app/src/main/assets"
HTML=APP/"index.html"
JAVA=ROOT/"app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java"
BG=APP/"images/new_ui_bg.png"
NEW_BG=APP/"images/new_ui_bg_no_exit.png"
FONT=APP/"fonts/A-Shablon-Cut.ttf"
LOCK=ROOT/"design/owner-v123-test-app-lock.json"
SOURCE_URL="https://www.fontyab.com/download?id=7512"

def run(*a):
    return subprocess.check_output(["git",*a],cwd=ROOT,text=True).strip()

def sha(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

def replace_once(source,original,revised,label):
    n=source.count(original)
    if n!=1:raise RuntimeError(f"Guarded patch {label}: expected one match, got {n}")
    return source.replace(original,revised,1)

def verified_previous():
    baseline=json.loads((ROOT/"design/owner-v121-trial-app-lock.json").read_text())
    if len(baseline["files"])!=195 or baseline["candidate_app_files_count"]!=195:
        raise RuntimeError("v121 approved candidate inventory unexpectedly changed")
    allowed={"app/src/main/assets/index.html","app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java"}
    tracked=run("ls-files","--","app/").splitlines()
    if len(tracked)!=195 or set(tracked)!=set(baseline["files"]):
        raise RuntimeError("unexpected app inventory before v123 source build")
    for path,blob in baseline["files"].items():
        if path in allowed: continue
        if sha((ROOT/path).read_bytes())!=blob:
            raise RuntimeError("v121 app content changed unexpectedly: "+path)
    if sha((ROOT/"app/build.gradle").read_bytes())!=baseline["files"]["app/build.gradle"]:
        raise RuntimeError("Gradle source differs")
    if NEW_BG.exists() or FONT.exists():
        raise RuntimeError("new binary output unexpectedly preexists")
    return baseline

def download_font():
    headers={"User-Agent":"Mozilla/5.0","Referer":"https://www.fontyab.com/2504/a-shablon.html",
             "Accept":"application/zip,application/octet-stream,*/*"}
    r=requests.get(SOURCE_URL,headers=headers,timeout=30)
    r.raise_for_status()
    body=r.content
    # FontYab intentionally serves a 5-second browser download page before
    # exposing the actual binary in the server-generated secure hidden field.
    # Follow that ONE first-party-provided URL; do not scrape random substitutes.
    if b"<html" in body[:1000].lower() or b"<!doctype html" in body[:1000].lower():
        from bs4 import BeautifulSoup
        from urllib.parse import urlparse
        soup=BeautifulSoup(r.text,"html.parser")
        target=soup.find(id="secure-download-link")
        direct=str(target.get("value","")).strip() if target else ""
        scheme=urlparse(direct)
        if scheme.scheme!="https" or not scheme.hostname or scheme.username or scheme.password:
            raise RuntimeError("Official Shablon page did not expose a validated HTTPS download URL")
        print("SHABLON_SOURCE_HOST",scheme.hostname,flush=True)
        download=requests.get(direct,headers={"User-Agent":"Mozilla/5.0","Referer":r.url},timeout=35)
        download.raise_for_status()
        body=download.content
    candidates=[]
    if zipfile.is_zipfile(io.BytesIO(body)):
        with zipfile.ZipFile(io.BytesIO(body)) as z:
            for info in z.infolist():
                if info.filename.lower().endswith((".ttf",".otf")) and not info.is_dir() and info.file_size<4_000_000:
                    candidates.append((info.filename,z.read(info)))
            for info in z.infolist():
                if info.filename.lower().endswith(("license.txt","ofl.txt","readme.txt")) and info.file_size<100_000:
                    text=z.read(info).decode("utf-8",errors="replace")
                    (ROOT/"docs"/"OWNER_SHABLON_DISTRIBUTION_SOURCE_NOTE.txt").write_text(
                        "Downloaded with the font archive from "+SOURCE_URL+"\\n\\n"+text,encoding="utf-8")
    elif body[:4] in (b"\\x00\\x01\\x00\\x00",b"OTTO",b"true") or body[:4]==b"ttcf":
        candidates=[("A-Shablon-Cut.ttf",body)]
    else:
        raise RuntimeError("Verified first-party Shablon file is not a font or ZIP. Actual bytes="+repr(body[:110]))
    ranked=[]
    for name,data in candidates:
        try:
            f=TTFont(io.BytesIO(data))
            names=[x.toUnicode() for x in f["name"].names if x.nameID in (1,2,4,6)]
            family=" ".join(names)
            cmap=f.getBestCmap() or {}
            persian=all(ord(c) in cmap for c in "ابپترحمنو")
            match=bool(re.search(r"shablon|شابلون",name+" "+family,re.I))
            if persian and match:
                ranked.append((int(name.lower().endswith(".ttf")),len(cmap),name,data,family))
        except Exception as e:
            print("FONT_CANDIDATE_REJECTED",name,str(e)[:120],flush=True)
    if not ranked:
        raise RuntimeError("Requested A Shablon Cut font with Persian glyphs not validated; fail closed")
    ranked.sort(reverse=True)
    _,cmap_size,name,data,family=ranked[0]
    if data[:4] in (b"OTTO",):
        font_file=FONT.with_suffix(".otf")
        raise RuntimeError("Shablon font supplied as OTF; expected TTF -- requires explicit source update")
    FONT.parent.mkdir(parents=True,exist_ok=True)
    FONT.write_bytes(data)
    print("FONT_OK",name,"family:",family[:160],"glyphs:",cmap_size,"bytes:",len(data),"sha256:",hashlib.sha256(data).hexdigest(),flush=True)
    return {"download_source":SOURCE_URL,"selected_filename_inside_archive":name,
            "postscript_family":family,"sha256":hashlib.sha256(data).hexdigest(),"bytes":len(data)}

def repair_background():
    old=Image.open(BG).convert("RGB")
    if old.size!=(941,1672):
        raise RuntimeError("Unexpected approved background size "+repr(old.size))
    arr=np.asarray(old).copy()
    # The ONLY baked-in Exit plaque is x roughly 755..860, y 570..650.
    # The surrounding blue/gold frame, central title, about button and interior are preserved.
    mask=np.zeros((arr.shape[0],arr.shape[1]),dtype=np.uint8)
    cv2.ellipse(mask,(801,606),(73,53),0,0,360,255,-1)
    # Tiny outer shadow border within the ornament, not the adjacent central blue title.
    repaired=cv2.inpaint(cv2.cvtColor(arr,cv2.COLOR_RGB2BGR),mask,5,cv2.INPAINT_TELEA)
    out=Image.fromarray(cv2.cvtColor(repaired,cv2.COLOR_BGR2RGB))
    NEW_BG.parent.mkdir(parents=True,exist_ok=True)
    out.save(NEW_BG,format="PNG",optimize=True)
    # Exactly unchanged outside inpaint oval; fail if any other pixel differed.
    before=np.asarray(old)
    after=np.asarray(out)
    outside=mask==0
    if not np.array_equal(before[outside],after[outside]):raise RuntimeError("Unexpected image alteration outside Exit plaque")
    if NEW_BG.stat().st_size<150_000:raise RuntimeError("Unexpected tiny image")
    print("BACKGROUND_OK",str(NEW_BG),NEW_BG.stat().st_size,"old_exit_plaque_removed",flush=True)
    return {"original_size":list(old.size),"mask_ellipse_px":{"center":[801,606],"axes":[73,53]},
            "sha256":hashlib.sha256(NEW_BG.read_bytes()).hexdigest(),
            "source_original_git_blob_sha":sha(BG.read_bytes())}

def patch_html():
    original=HTML.read_text(encoding="utf-8")
    if "images/new_ui_bg_no_exit.png" not in original:
        raise RuntimeError("Expected v122 guarded Back/Exit route image selection absent")
    font_css="""/* v123: only SIX primary-home labels use the owner's free Persian A Shablon Cut font.
   Inner-page titles, audio, notes, Back and the approved iwan remain unchanged. */
@font-face{font-family:'PMM Shablon';src:url('fonts/A-Shablon-Cut.ttf') format('truetype');
  font-style:normal;font-weight:400;font-display:swap}
#home-main-menu > .home-menu-card > .home-menu-title{
  font-family:'PMM Shablon',Tahoma,Arial,sans-serif!important;
  font-weight:400!important;-webkit-text-stroke:0!important;text-shadow:none!important;
  font-size:var(--pmm-home-six-title-size,14px)!important;
  white-space:nowrap!important;overflow-wrap:normal!important;word-break:keep-all!important;
  text-overflow:clip;overflow:hidden;min-width:0;max-width:100%;
}
"""
    original=replace_once(original,
      "/* v122: Home submenus use #back-top; Exit remains home-root only. */",
      font_css+"\n/* v122: Home submenus use #back-top; Exit remains home-root only. */",
      "font CSS")
    fit_start=original.index("// Measure the actual loaded Estedad text at the available title width.")
    fit_end=original.index("function resetHomeMenu(restoreFocus=false){",fit_start)
    before=original[fit_start:fit_end]
    replacement="""// v123: font-aware responsive title fit, shared maximum single-line size across six labels.
// Schedule at most ONE fit per frame; document.fonts.ready and ResizeObserver handle
// font swaps, viewport rotation and narrow phones without repeated layout thrash.
let homeTitleFitFrame=0;
const homeTitleMeasure=document.createElement('canvas').getContext('2d');
function fitHomeMainMenuTitles(){
  if(!homeMenuRoot||homeMenuRoot.hidden||!homeMenuRoot.clientWidth||!homeTitleMeasure)return;
  const titles=Array.from(homeMenuRoot.querySelectorAll(':scope > .home-menu-card > .home-menu-title'));
  if(titles.length!==6)return;
  const reference=44;
  homeTitleMeasure.font='400 '+reference+'px "PMM Shablon",Tahoma,Arial,sans-serif';
  let bound=reference;
  for(const title of titles){
    const available=title.getBoundingClientRect().width-4;
    const needed=homeTitleMeasure.measureText(title.textContent.trim()).width;
    if(available>0&&needed>0)bound=Math.min(bound,available*reference/needed);
  }
  let size=Math.min(reference,Math.max(3,Math.floor(bound*9.6)/10));
  for(let trial=0;trial<9;trial++){
    homeMenuRoot.style.setProperty('--pmm-home-six-title-size',size.toFixed(1)+'px');
    const ratio=Math.max(1,...titles.map(t=>t.scrollWidth/Math.max(1,t.clientWidth-2)));
    if(ratio<=1.001)break;
    size=Math.max(3,Math.floor(size/ratio*9.4)/10);
  }
}
function queueHomeTitleFit(){
  if(homeTitleFitFrame)return;
  homeTitleFitFrame=requestAnimationFrame(()=>{
    homeTitleFitFrame=0;
    fitHomeMainMenuTitles();
  });
}
if(document.fonts?.ready)document.fonts.ready.then(queueHomeTitleFit);
if(document.fonts?.load)document.fonts.load('18px "PMM Shablon"').then(queueHomeTitleFit).catch(()=>{});
window.addEventListener('resize',queueHomeTitleFit,{passive:true});
window.addEventListener('load',queueHomeTitleFit,{once:true});
if(typeof ResizeObserver==='function'&&homeMenuRoot){
 const homeTitleObserver=new ResizeObserver(queueHomeTitleFit);
 homeTitleObserver.observe(homeMenuRoot);
}
queueHomeTitleFit();
"""
    if len(before)<800 or len(before)>2400 or "PMM Estedad" not in before:
        raise RuntimeError("Unrecognized home-title fitter; refuse unsafe patch")
    original=original[:fit_start]+replacement+original[fit_end:]
    # Speed: batch creation of 105 image carousel buttons into one DOM insertion.
    original=replace_once(original,
      " const boards=[];\n let index=0,step=0,swiped=false,suppressClickUntil=0;",
      " const boards=[];\n const wheelFragment=document.createDocumentFragment();\n let index=0,step=0,swiped=false,suppressClickUntil=0;",
      "wheel DocumentFragment")
    original=replace_once(original,
      "  rotor.appendChild(board);boards.push(board);\n });\n function closest(to){",
      "  wheelFragment.appendChild(board);boards.push(board);\n });\n rotor.appendChild(wheelFragment); // one layout insertion, not 105 reflows\n function closest(to){",
      "wheel append batch")
    # The submenu Exit is deactivated; the Back and display artwork remain separate.
    for expected in ("exit.hidden=isBack;","exit.disabled=isBack;","showSceneArtwork(!isBack);",
       "showSceneArtwork(false);","scene.dataset.navMode='inner'","scene.dataset.navMode=isBack?'submenu':'home-root';"):
        if expected not in original:raise RuntimeError("Missing v122 navigation safety "+expected)
    HTML.write_text(original,encoding="utf-8")
    print("HTML_OK","bytes",len(original), "single-line six labels, batched 105-image wheel",flush=True)

def patch_java():
    txt=JAVA.read_text(encoding="utf-8")
    a="((!s.hidden&&s.dataset.screen==='home'&&t.hidden)||(s.hidden&&!t.hidden));"
    b=("((!s.hidden&&s.dataset.screen==='home'&&s.dataset.navMode==='home-root'&&t.hidden"
       "&&document.getElementById('home-main-menu')&&!document.getElementById('home-main-menu').hidden)"
       "||(s.hidden&&!t.hidden&&document.getElementById('home-pane')"
       "&&!document.getElementById('home-pane').classList.contains('gone')));")
    txt=replace_once(txt,a,b,"native exit route guard")
    if "maybeStartContentUpdates();" not in txt or "PMM_CONTENT_MANIFEST_URL" not in txt:
        raise RuntimeError("v122 owner-opt-in update check disappeared")
    if "setAllowUniversalAccessFromFileURLs(false)" not in txt:
        raise RuntimeError("Unsafe WebView file URL setting")
    JAVA.write_text(txt,encoding="utf-8")
    print("NATIVE_OK","home root only exit; unchanged owner online updates & reminders")

def lock_candidate(font_meta,bg_meta,baseline):
    tracked=run("ls-files","--","app/").splitlines()
    expected=set(baseline["files"])|{
      "app/src/main/assets/fonts/A-Shablon-Cut.ttf",
      "app/src/main/assets/images/new_ui_bg_no_exit.png"
    }
    # Stage new binary source files first. Exact allowlist, no edits to app/build.gradle.
    subprocess.check_call(["git","add","--",str(FONT.relative_to(ROOT)),str(NEW_BG.relative_to(ROOT))],cwd=ROOT)
    tracked=run("ls-files","--","app/").splitlines()
    if len(tracked)!=197 or set(tracked)!=expected:
        raise RuntimeError(f"Wrong 197-app-file candidate inventory {len(tracked)}")
    old_exceptions={
      "app/src/main/assets/index.html","app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java"}
    hashes={}
    for path in sorted(tracked):
        raw=(ROOT/path).read_bytes()
        digest=sha(raw)
        hashes[path]=digest
        if path in baseline["files"] and path not in old_exceptions:
            if digest!=baseline["files"][path]:
                raise RuntimeError("Existing v121 app file altered: "+path)
    report={
      "schema":"pmm-owner-v123-test-candidate-app-file-lock-v1",
      "status":"TRIAL_NOT_OWNER_APPROVED_DO_NOT_MERGE_MAIN",
      "parent_test_version":"v121 gallery105 and local wisdom tools",
      "app_file_count":197,
      "prior_app_file_count":195,
      "new_binary_assets":list(sorted(expected-set(baseline["files"]))),
      "shablon_font_download_metadata":font_meta,
      "inner_exit_free_image":bg_meta,
      "functional_changes":[
        "Exit only on root Home with native and JS guards",
        "no baked Exit on any inner-page image background",
        "separate Back with no overlay/Exit click",
        "six primary home titles use local A Shablon Cut, largest one-line size responsive to actual rendered glyphs",
        "native startup content-update manifest check only after user consent; separate from notifications",
        "105 photo wheel DOM nodes inserted in a single DocumentFragment",
        "unchanged original photo gallery and audio service",
        "historical Cloudflare admin panel source with read-only manifest and protected admin endpoint"
      ],
      "official_app_id_signing_gradle_unchanged":True,
      "preserved_v119_voice_notes_and_reminders":True,
      "files":hashes
    }
    LOCK.write_text(json.dumps(report,ensure_ascii=False,indent=2,sort_keys=True)+"\n")
    subprocess.check_call(["git","add","--",
       "app/src/main/assets/index.html",
       "app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java",
       str(LOCK.relative_to(ROOT))],cwd=ROOT)
    subprocess.check_call(["git","diff","--check","--cached"],cwd=ROOT)
    altered=run("diff","--cached","--name-only").splitlines()
    allowed=set(old_exceptions)|set(report["new_binary_assets"])|{str(LOCK.relative_to(ROOT))}
    if set(altered)!=allowed:
        raise RuntimeError("Unexpected changes in candidate staged files "+repr(altered))
    print("LOCK_OK",len(hashes),"exact Git blob hashes",flush=True)
    return report

def verify():
    cfg=json.loads(LOCK.read_text(encoding="utf-8"))
    files=run("ls-files","--","app/").splitlines()
    if len(files)!=cfg["app_file_count"] or set(files)!=set(cfg["files"]):
        raise RuntimeError("Postbuild app file inventory changed")
    for p,expected in cfg["files"].items():
        if not (ROOT/p).is_file() or sha((ROOT/p).read_bytes())!=expected:
            raise RuntimeError("V123 source hash mismatch: "+p)
    if "v123" not in HTML.read_text():
        raise RuntimeError("Missing v123 home title updates")
    if cfg["status"]!="TRIAL_NOT_OWNER_APPROVED_DO_NOT_MERGE_MAIN":
        raise RuntimeError("Candidate status must not be approved")
    print("PASS: v123 source lock 197/197; approved audio/fonts/images/notes untouched outside allowed changes")

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("mode",choices=["apply","verify"])
    args=parser.parse_args()
    if args.mode=="verify":verify();return
    baseline=verified_previous()
    font_meta=download_font()
    bg_meta=repair_background()
    patch_html()
    patch_java()
    lock_candidate(font_meta,bg_meta,baseline)
    verify()
    print("PASS: candidate v123 prepared for independent owner-installed Android APK")

if __name__=="__main__":main()
