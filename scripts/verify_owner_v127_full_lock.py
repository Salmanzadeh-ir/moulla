#!/usr/bin/env python3
"""Fail-closed exact Git-blob SHA lock for ALL active v127 Android app files."""
from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[1]
old=json.loads((root/'design/owner-v126-test-app-lock.json').read_text(encoding='utf-8'))
new=json.loads((root/'design/owner-v127-test-app-lock.json').read_text(encoding='utf-8'))
files=subprocess.check_output(['git','ls-files','--','app/'],cwd=root,text=True).splitlines()
assert len(files)==199==len(new['files'])==len(old['files'])
assert set(files)==set(new['files'])==set(old['files'])
assert new['status']=='CANDIDATE_V127_OWNER_PHONE_NOT_YET_APPROVED'
changed='app/src/main/assets/index.html'
for path in files:
    content=(root/path).read_bytes()
    digest=hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()
    assert digest==new['files'][path],('v127 file tampered',path)
    if path!=changed:assert new['files'][path]==old['files'][path],('unrequested source edit',path)
assert new['files'][changed]!=old['files'][changed]
assert new['app_files_count']==199
html=(root/changed).read_text(encoding='utf-8')
assert html.count("font-family:'PMM Lalezar'")>=1
assert "font-size:var(--pmm-home-six-uniform-size,22px)!important" in html
assert "text-align:center!important" in html
assert 'white-space:nowrap!important' in html
assert "const previousUniformSize=Math.max(3,Math.floor(Math.min(maxSize,modelSpace*reference/modelWidth*0.985)*10)/10);" in html
assert "const uniformSize=Math.max(3,previousUniformSize*(5/6));" in html
assert "homeMenuRoot.style.setProperty('--pmm-home-six-uniform-size',uniformSize.toFixed(1)+'px');" in html
assert "let bound=reference" not in html
assert "overflow:visible;" in html
assert (root/'app/src/main/assets/fonts/Lalezar-Regular.ttf').is_file()
assert (root/'app/src/main/assets/fonts/Lalezar-OFL.txt').is_file()
assert not (root/'app/src/main/assets/pmm_owner_wisdom_tools_v121.js').exists()
print('PASS: 199/199 exact source files Git-blob locked; 198 equal v126; all six identical Lalezar size = 5/6 prior with centered nowrap and no clipping')
