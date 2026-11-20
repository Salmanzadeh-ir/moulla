#!/usr/bin/env python3
"""Owner-approved active v119 reminder source lock. Preserve all 182 app files."""
import hashlib,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'design/owner-v119-main-app-lock.json').read_text(encoding='utf-8'))
expected=data['files']
assert len(expected)==data['approved_app_files_count']==182
tracked={x.decode('utf-8') for x in subprocess.check_output(['git','ls-files','-z','--','app/'],cwd=root).split(b'\0') if x}
assert tracked==set(expected),('Owner lock set changed',sorted(tracked-set(expected)),sorted(set(expected)-tracked))
for path,want in sorted(expected.items()):
 b=(root/path).read_bytes()
 have=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
 assert have==want,('Owner v119 lock violation',path,have,want)
print('PASS: 182 owner-approved v119 app Git blobs are frozen.')
