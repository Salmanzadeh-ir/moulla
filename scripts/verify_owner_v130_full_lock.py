#!/usr/bin/env python3
"""Fail-closed SHA-1 Git-blob lock for ALL owner v130 trial app files (not main)."""
import hashlib
import json
import subprocess
from pathlib import Path

root=Path(__file__).resolve().parents[1]
locked=json.loads((root/'design/owner-v130-test-app-lock.json').read_text(encoding='utf-8'))
base=json.loads((root/'design/owner-v129-main-app-lock.json').read_text(encoding='utf-8'))
paths=subprocess.check_output(['git','ls-files','--','app/'],cwd=root,text=True).splitlines()
expected=locked['files']; old=base['files']
html_path='app/src/main/assets/index.html'
course_path='app/src/main/assets/pmm_offline_course.js'
clock_path='app/src/main/assets/pmm_shrine_clock_v130.js'
image_path='app/src/main/assets/images/pmm_shrine_clock_clean.webp'
changed={html_path,course_path}
added={clock_path,image_path}
assert locked['status']=='OWNER_PHONE_TEST_PENDING_NOT_MERGED'
assert locked['parent_approved_version']=='v129'
assert locked['baseline_app_files_count']==199
assert locked['app_files_count']==201
assert len(paths)==len(expected)==201
assert set(paths)==set(expected)==set(old)|added
assert set(locked['changed_app_files'])==changed
assert set(locked['added_app_files'])==added
assert locked['deleted_app_files']==[]
assert locked['original_source_unmodified_count']==197
for path in paths:
    data=(root/path).read_bytes()
    sha=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
    assert sha==expected[path],('Trial source corrupted',path)
    if path not in changed|added:
        assert sha==old[path],('Owner-approved source changed without permission',path)
for path in changed:
    assert expected[path]!=old[path],('Expected fix absent',path)
for path in added:
    assert path not in old
original=(root/'design/owner-v130-shrine-clock/ImamAliClock-APP-768w.webp').read_bytes()
original_sha=hashlib.sha1(b'blob '+str(len(original)).encode()+b'\0'+original).hexdigest()
assert original_sha=='244e8c1afd547e3413d387efdce8f8aa8769fa1b'
img=(root/image_path).read_bytes()
assert img[:4]==b'RIFF' and img[8:12]==b'WEBP' and 20000<len(img)<400000
html=(root/html_path).read_text(encoding='utf-8')
controller=(root/clock_path).read_text(encoding='utf-8')
course=(root/course_path).read_text(encoding='utf-8')
assert html.count('id="course-shrine-clock"')==1
assert html.count('id="course-reminder-time"')==1
assert 'pmm_shrine_clock_clean.webp' in html
assert 'pmm_shrine_clock_v130.js' in html
assert 'touch-action:none' in html
assert 'prefers-reduced-motion:reduce' in html
assert 'font-family:\'PMM Lalezar\'' in html
assert 'previousUniformSize*(5/6)' in html
assert 'scale:.97!important' in html
assert 'setPointerCapture(e.pointerId)' in controller
assert 'rawHour+=delta/30' in controller
assert 'input.dispatchEvent(new Event(\'change\'' in controller
assert "window.PMM_SHRINE_CLOCK?.sync();" in course
assert 'setCourseReminderSchedule(state.plan.mode,state.plan.weekday??-1,state.plan.reminderTime)' in course
assert not (root/'app/src/main/assets/pmm_owner_wisdom_tools_v121.js').exists()
assert locked['main_must_remain_on_v129'] is True
print('PASS: EXACT 201/201 Git blobs; 197 owner-approved v129 app files unchanged, 2 narrowly edited, 2 new; no main promotion')
