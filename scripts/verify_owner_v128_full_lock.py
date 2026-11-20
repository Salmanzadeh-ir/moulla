#!/usr/bin/env python3
"""Fail-closed exact Git blob SHA lock for ALL 199 active v128 Android files."""
from pathlib import Path
import hashlib, json, subprocess
root=Path(__file__).resolve().parents[1]
old=json.loads((root/'design/owner-v127-test-app-lock.json').read_text(encoding='utf-8'))
new=json.loads((root/'design/owner-v128-test-app-lock.json').read_text(encoding='utf-8'))
files=subprocess.check_output(['git','ls-files','--','app/'],cwd=root,text=True).splitlines()
assert len(files)==len(old['files'])==len(new['files'])==199
assert set(files)==set(old['files'])==set(new['files'])
assert new['status']=='CANDIDATE_V128_OWNER_PHONE_NOT_YET_APPROVED'
changed='app/src/main/java/ir/nahj/towhidkarbordi/PmmKafiAudioService.java'
for path in files:
    content=(root/path).read_bytes()
    digest=hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()
    assert digest==new['files'][path],('v128 changed unexpectedly',path)
    if path!=changed:
        assert digest==old['files'][path],('v127 owner-tested source changed unexpectedly',path)
assert new['files'][changed]!=old['files'][changed]
assert new['changed_app_files']==[changed]
assert new['original_source_unmodified_count']==198
manifest=(root/'app/src/main/AndroidManifest.xml').read_text(encoding='utf-8')
assert 'android:stopWithTask="true"' not in manifest
assert 'android:foregroundServiceType="mediaPlayback"' in manifest
source=(root/changed).read_text(encoding='utf-8')
assert '@Override public void onTaskRemoved(Intent rootIntent)' in source
assert 'saveSecond(true);' in source
assert 'discardPlayer();' in source
assert 'stopForeground(true);foreground=false;' in source
assert 'stopSelf();' in source
assert 'super.onTaskRemoved(rootIntent);' in source
assert 'return START_NOT_STICKY;' in source
assert not (root/'app/src/main/assets/pmm_owner_wisdom_tools_v121.js').exists()
print('PASS: 199/199 exact Git SHA locked; 198 unchanged from v127; native audio stops on Recents task removal')
