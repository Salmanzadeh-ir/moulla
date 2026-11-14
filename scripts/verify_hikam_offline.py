#!/usr/bin/env python3
"""Validate only the new offline wisdom preview; historical official tag remains locked."""
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
assets=ROOT/'app/src/main/assets'
source=(assets/'hikam_bank.js').read_text(encoding='utf-8')
match=re.search(r'window\.PMM_HIKMAT_ALL\s*=\s*(\[.*\]);\s*$',source,re.S)
assert match,'Offline wisdom data not found'
data=json.loads(match.group(1))
assert len(data)==489,f'Expected 489; got {len(data)}'
ids=set()
for item in data:
    assert isinstance(item,dict)
    id=item['id']
    assert id not in ids,id
    ids.add(id)
    assert item['arabic'].strip() and item['persian'].strip(),id
    assert '**' not in item['arabic'] and '**' not in item['persian'],id
for n in range(1,481):
    assert f'h{n:03d}' in ids,f'Missing wisdom #{n}'
for n in range(1,10):
    assert f'g{n:03d}' in ids,f'Missing gharaib #{n}'
assert [i['id'] for i in data]==([f'h{i:03d}' for i in range(1,261)]+[f'g{i:03d}' for i in range(1,10)]+[f'h{i:03d}' for i in range(261,481)])
html=(assets/'index.html').read_text(encoding='utf-8')
for word in ('hikam_bank.js','id="wisdom-intro"','id="wisdom-drawing"','id="wisdom-result"','function startWisdomDraw()','نیت کن و یک یک جمله مهمان کلام امیرالمومنین علیه السلام باش.'):
    assert word in html,word
assert 'SAMPLE_WISDOM' not in html
assert 'PMM_HIKMAT_480 = []' not in html
assert (assets/'images/new_ui_bg.png').exists()
assert (assets/'images/new_ui_menu.png').exists()
print('PASS offline wisdom preview: 480 hikam, 9 gharaib, owner-supplied Arabic/Persian, no sample rows')
