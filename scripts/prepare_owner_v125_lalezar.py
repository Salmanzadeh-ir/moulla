#!/usr/bin/env python3
"""Safely install actual OFL Lalezar and individually maximize CENTERED one-line home titles.

Owner-reviewed v124 remains immutable; this script is used ONLY in an isolated trial branch.
"""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path
from urllib.request import Request, urlopen
from io import BytesIO

ROOT=Path(__file__).resolve().parents[1]
HTML=ROOT/"app/src/main/assets/index.html"
DIR=ROOT/"app/src/main/assets/fonts"
FONT=DIR/"Lalezar-Regular.ttf"
LICENSE=DIR/"Lalezar-OFL.txt"
LOCK=ROOT/"design/owner-v125-test-app-lock.json"
PREVIOUS=ROOT/"design/owner-v124-test-app-lock.json"
SOURCE="https://raw.githubusercontent.com/google/fonts/main/ofl/lalezar/"
HTML_START="/* v123: only SIX primary-home labels use the owner's free Persian A Shablon Cut font."
HTML_END="/* v124: native audio controls deliberately mirror existing navy/gold buttons;"
JS_START="// v123: font-aware responsive title fit, shared maximum single-line size across six labels."
JS_END="function resetHomeMenu(restoreFocus=false){"

def git(*args):
    return subprocess.check_output(["git",*args],cwd=ROOT,text=True).strip()
def gitsha(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
def get(name):
    url=SOURCE+name
    request=Request(url,headers={"User-Agent":"PayeMenbareMola-owner-review/125"})
    with urlopen(request,timeout=35) as stream:
        content=stream.read(2_500_001)
    if not content or len(content)>2_500_000:raise RuntimeError("Missing/oversized licensed font source "+name)
    return content

def ensure_baseline():
    old=json.loads(PREVIOUS.read_text(encoding="utf-8"))
    if old.get("app_file_count")!=197 or len(old["files"])!=197:
        raise RuntimeError("v124 owner source lock mismatch")
    tracked=git("ls-files","--","app/").splitlines()
    if set(tracked)!=set(old["files"]):raise RuntimeError("Unexpected tracked app file inventory")
    for name,blob in old["files"].items():
        if gitsha((ROOT/name).read_bytes())!=blob:
            raise RuntimeError("Old v124 app modified before isolated review: "+name)
    for p in (FONT,LICENSE,LOCK):
        if p.exists():raise RuntimeError("Candidate source already exists before apply: "+str(p))
    return old

def apply():
    old=ensure_baseline()
    font_bytes=get("Lalezar-Regular.ttf")
    license_bytes=get("OFL.txt")
    if font_bytes[:4]!=bytes.fromhex("00010000") or len(font_bytes)<50_000:
        raise RuntimeError("Google Fonts Lalezar font is not a genuine TrueType file")
    text=license_bytes.decode("utf-8")
    if "SIL OPEN FONT LICENSE Version 1.1" not in text.upper().replace("  "," "):
        if "SIL OPEN FONT LICENSE" not in text.upper() or "1.1" not in text:
            raise RuntimeError("Lalezar open font license not validated")
    from fontTools.ttLib import TTFont
    font=TTFont(BytesIO(font_bytes))
    names=" ".join(x.toUnicode() for x in font["name"].names if x.nameID in (1,4,6))
    if "Lalezar" not in names:raise RuntimeError("Downloaded font is not actually Lalezar")
    glyphs=font.getBestCmap() or {}
    for character in "ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی":
        if ord(character) not in glyphs:raise RuntimeError("Missing Persian letter in font: "+character)
    DIR.mkdir(parents=True,exist_ok=True)
    FONT.write_bytes(font_bytes)
    LICENSE.write_bytes(license_bytes)
    print("LICENSE_OK",len(license_bytes),"FONT_OK",names[:70],len(font_bytes),
          hashlib.sha256(font_bytes).hexdigest(),flush=True)

    html=HTML.read_text(encoding="utf-8")
    if html.count(HTML_START)!=1 or html.count(HTML_END)!=1:
        raise RuntimeError("Unable to locate exact v124 font CSS boundaries")
    css="""/* v125 OWNER: only SIX main Home titles, bold genuine OFL Lalezar.
   All other titles, text, Back/Exit, reminder panels and audio remain unchanged. */
@font-face {
  font-family:'PMM Lalezar';
  src:url('fonts/Lalezar-Regular.ttf') format('truetype');
  font-style:normal;font-weight:400;font-display:swap;
}
#home-main-menu > .home-menu-card {
  text-align:center!important; /* never inherit right alignment */
}
#home-main-menu > .home-menu-card > .home-menu-title {
  font-family:'PMM Lalezar',Tahoma,Arial,sans-serif!important;
  font-weight:400!important;
  -webkit-text-stroke:0!important; /* Lalezar is already a heavy display face */
  text-shadow:none!important;
  display:block;flex:1 1 0%;width:auto;min-width:0;max-width:100%;
  text-align:center!important;direction:rtl!important;
  font-size:var(--pmm-home-title-individual,22px)!important;
  line-height:1.15!important;
  white-space:nowrap!important;
  overflow-wrap:normal!important;word-break:keep-all!important;
  text-overflow:clip;overflow:hidden;
}
"""
    first=html.index(HTML_START)
    last=html.index(HTML_END,first)
    html=html[:first]+css+"\n"+html[last:]
    if html.count(JS_START)!=1 or html.count(JS_END)!=1:
        raise RuntimeError("Unable to locate exact v124 font measurement routine")
    js="""// v125: largest comfortably fitting font PER title, not the old shared
// minimum that shrank all six labels to the size of the longest phrase.
// Recalculate after local Lalezar is loaded, on orientation/viewport change.
let homeTitleFitFrame=0;
const homeTitleMeasure=document.createElement('canvas').getContext('2d');
function fitHomeMainMenuTitles(){
  if(!homeMenuRoot||homeMenuRoot.hidden||!homeMenuRoot.clientWidth||!homeTitleMeasure)return;
  const titles=Array.from(homeMenuRoot.querySelectorAll(':scope > .home-menu-card > .home-menu-title'));
  if(titles.length!==6)return;
  const reference=48;
  homeTitleMeasure.font='400 '+reference+'px "PMM Lalezar",Tahoma,Arial,sans-serif';
  titles.forEach(title=>{
    const card=title.closest('.home-menu-card');
    const available=title.clientWidth-6;
    const needed=homeTitleMeasure.measureText(title.textContent.trim()).width;
    if(available<=0||needed<=0)return;
    // Vertical cap respects the tile height and avoids trimming descenders.
    const maximum=Math.min(48,Math.max(9,(card?.clientHeight||70)*0.70));
    let size=Math.min(maximum,available*reference/needed*0.985);
    size=Math.max(3,Math.floor(size*10)/10);
    // Apply to THIS title only; preserve bigger sizes on short captions.
    for(let trial=0;trial<5;trial++){
      title.style.setProperty('--pmm-home-title-individual',size.toFixed(1)+'px');
      if(title.scrollWidth<=title.clientWidth+1)break;
      size=Math.max(3,Math.floor(size*0.94*10)/10);
    }
  });
}
function queueHomeTitleFit(){
  if(homeTitleFitFrame)return;
  homeTitleFitFrame=requestAnimationFrame(()=>{
    homeTitleFitFrame=0;
    fitHomeMainMenuTitles();
  });
}
if(document.fonts?.ready)document.fonts.ready.then(queueHomeTitleFit);
if(document.fonts?.load)document.fonts.load('24px "PMM Lalezar"').then(queueHomeTitleFit).catch(()=>{});
window.addEventListener('resize',queueHomeTitleFit,{passive:true});
window.addEventListener('load',queueHomeTitleFit,{once:true});
if(typeof ResizeObserver==='function'&&homeMenuRoot){
  const homeTitleObserver=new ResizeObserver(queueHomeTitleFit);
  homeTitleObserver.observe(homeMenuRoot);
}
queueHomeTitleFit();
"""
    a=html.index(JS_START)
    b=html.index(JS_END,a)
    html=html[:a]+js+html[b:]
    if html.count("PMM Lalezar")<3 or "PMM Shablon" in html:
        raise RuntimeError("Wrong font remains in active home HTML")
    if html.count("text-align:center!important;")<2:
        raise RuntimeError("Main home text not center aligned")
    HTML.write_text(html,encoding="utf-8")

    added={
      str(FONT.relative_to(ROOT)),
      str(LICENSE.relative_to(ROOT)),
    }
    subprocess.check_call(["git","add","--",str(HTML.relative_to(ROOT)),*sorted(added)],cwd=ROOT)
    tracked=git("ls-files","--","app/").splitlines()
    if len(tracked)!=199 or set(tracked)!=(set(old["files"])|added):
        raise RuntimeError("Expected 199 app files, got "+str(len(tracked)))
    hashes={}
    for path in sorted(tracked):
        digest=gitsha((ROOT/path).read_bytes())
        hashes[path]=digest
        if path in old["files"] and path!="app/src/main/assets/index.html":
            if digest!=old["files"][path]:
                raise RuntimeError("Unapproved older app file changed: "+path)
    report={
      "schema":"owner-v125-lalezar-six-centered-test-lock-v1",
      "status":"CANDIDATE_PENDING_OWNER_PHONE_TEST_NOT_MAIN",
      "parent_branch":"feature/owner-v124-seven-owner-fixes-test-20261120",
      "app_file_count":199,
      "prior_app_file_count":197,
      "changed_existing_file":["app/src/main/assets/index.html"],
      "new_files":sorted(added),
      "font_source":SOURCE+"Lalezar-Regular.ttf",
      "font_license":SOURCE+"OFL.txt",
      "font_sha256":hashlib.sha256(font_bytes).hexdigest(),
      "license_sha256":hashlib.sha256(license_bytes).hexdigest(),
      "description":"Only six primary Home captions: genuine Lalezar OFL, centered, largest individual no-wrap size per screen width; all 198 other app file hashes preserved",
      "files":hashes
    }
    LOCK.write_text(json.dumps(report,ensure_ascii=False,indent=2,sort_keys=True)+"\n")
    subprocess.check_call(["git","add","--",str(LOCK.relative_to(ROOT))],cwd=ROOT)
    # Google Fonts distributes a verbatim OFL license with upstream trailing spaces.
    # Preserve legally supplied bytes; still reject whitespace errors in our app code.
    subprocess.check_call(["git","diff","--check","--cached","--",
                           "app/src/main/assets/index.html"],cwd=ROOT)
    names=set(git("diff","--cached","--name-only").splitlines())
    if names!=added|{"app/src/main/assets/index.html",str(LOCK.relative_to(ROOT))}:
        raise RuntimeError("Unexpected staged content "+repr(names))
    verify()
    print("PASS: exact 199 app hashes, sole previous app modification is main Home index; 6 bold Lalezar titles centered and no wrap",flush=True)

def verify():
    config=json.loads(LOCK.read_text(encoding="utf-8"))
    old=json.loads(PREVIOUS.read_text(encoding="utf-8"))
    paths=git("ls-files","--","app/").splitlines()
    if len(paths)!=199 or set(paths)!=set(config["files"]):raise RuntimeError("199 lock file inventory differs")
    for path,expected in config["files"].items():
        if gitsha((ROOT/path).read_bytes())!=expected:raise RuntimeError("App hash mismatch: "+path)
        if path in old["files"] and path!="app/src/main/assets/index.html":
            if expected!=old["files"][path]:raise RuntimeError("Unexpected old app change "+path)
    if config["status"]!="CANDIDATE_PENDING_OWNER_PHONE_TEST_NOT_MAIN":
        raise RuntimeError("Candidate incorrectly authorized")
    html=HTML.read_text()
    if html.count("PMM Lalezar")<3 or 'text-align:center!important;' not in html:
        raise RuntimeError("Not all six main labels centered and using Lalezar")
    if "homeTitleMeasure.font='400 '+reference+'px \"PMM Lalezar\"" not in html:
        raise RuntimeError("Per-label measurement not using local Lalezar")
    if "titles.forEach(title=>" not in html or "white-space:nowrap!important" not in html:
        raise RuntimeError("One-line individual title fit missing")
    print("PASS: v125 199 app files remain locked; v124 unchanged except Home HTML; true local OFL font packaged",flush=True)

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("action",choices=["apply","verify"])
    args=p.parse_args()
    if args.action=="apply":apply()
    else:verify()
