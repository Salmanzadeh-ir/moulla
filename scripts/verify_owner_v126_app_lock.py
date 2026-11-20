#!/usr/bin/env python3
"""Fail closed on every source byte; only home title CSS/JS may differ from v125."""
from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[1]
def sha(p):
    raw=(root/p).read_bytes()
    return hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
new=json.loads((root/'design/owner-v126-test-app-lock.json').read_text())
old=json.loads((root/'design/owner-v125-test-app-lock.json').read_text())
paths=subprocess.check_output(['git','ls-files','--','app/'],cwd=root,text=True).splitlines()
assert len(paths)==199 and set(paths)==set(new['files'])==set(old['files'])
assert new['status']=='TRIAL_OWNER_PHONE_CONFIRMATION_REQUIRED_NOT_MAIN'
modified=['app/src/main/assets/index.html']
assert new['modified_existing_app_files']==modified
for p in paths:
    assert sha(p)==new['files'][p],('new file hash mismatch',p)
    if p not in modified:assert new['files'][p]==old['files'][p],('unapproved change',p)
assert new['files'][modified[0]]!=old['files'][modified[0]]
html=(root/modified[0]).read_text()
css=html[html.index('/* v125 OWNER: only SIX main Home titles'):html.index('/* v124: native audio controls')]
assert "font-family:'PMM Lalezar'" in css and "text-align:center!important" in css
assert 'font-size:var(--pmm-home-six-uniform-size,22px)!important' in css
assert 'white-space:nowrap!important' in css
js=html[html.index('// v126: all SIX captions'):html.index('function resetHomeMenu(restoreFocus=false)')]
assert "const model=titles[0]" in js and "شرح جامع صوتی" in js
assert "homeMenuRoot.style.setProperty('--pmm-home-six-uniform-size'" in js
assert "titles.forEach(title=>" in js and "title.style.transform" in js
assert "title.style.setProperty('--pmm-home-title-individual'" not in js
assert (root/'app/src/main/assets/fonts/Lalezar-Regular.ttf').is_file()
assert (root/'app/src/main/assets/fonts/Lalezar-OFL.txt').is_file()
assert not (root/'app/src/main/assets/pmm_owner_wisdom_tools_v121.js').exists()
print('PASS: v126 exact 199-file lock, v125 unchanged except one Home HTML file, all six same Lalezar font size/weight, centered and nowrap')
