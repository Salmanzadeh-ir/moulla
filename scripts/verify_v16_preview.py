#!/usr/bin/env python3
"""Owner-authorized V16 preview functional / asset integrity checks."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
AS = ROOT / "app/src/main/assets"
HTML = (AS / "index.html").read_text(encoding="utf-8")
BANK = (AS / "hikam_bank.js").read_text(encoding="utf-8")
PHOTOS = (AS / "photo_quotes_manifest.js").read_text(encoding="utf-8")

menu = ("nahj_audio", "tawhid", "see_god", "kafi", "videos", "photo_quotes", "guest_sentence_new")
for key in menu:
    assert len(re.findall(r'data-menu="' + re.escape(key) + r'"', HTML)) == 1, key
assert HTML.count('id="wisdom-copy-action"') == 1
assert HTML.count('id="wisdom-textsize-action"') == 1
for marker in ("copyWisdomText", "wisdomClipboardText", "adjustWisdomFontSize",
               "Sahel-SemiBold.woff2", "PMM Sahel SemiBold", "PMM Amiri",
               "pmm_photo_quotes_drawbag_v1", "این جمله هدیه مولا به شماست.",
               "https://eitaa.com/joinchat/2066481246Cb13f0be69d"):
    assert marker in HTML, f"Missing V16 behavior: {marker}"
assert 'photo-fullscreen-share' not in HTML
assert 'sharePhoto' not in HTML
assert (AS / "fonts/Sahel-SemiBold.woff2").read_bytes()[:4] == b"wOF2"
for file in ("fonts/Amiri-Regular.ttf","fonts/Amiri-Bold.ttf", "fonts/OFL.txt", "fonts/Sahel-OFL.txt"):
    assert (AS / file).is_file(), file
m = re.search(r"window\.PMM_HIKMAT_ALL\s*=\s*(\[.*\])\s*;", BANK, re.S)
assert m, "Cannot locate wisdom JSON bank"
data = json.loads(m.group(1))
assert len(data) == 489, f"Wisdom bank has {len(data)} entries"
assert {w["number"] for w in data if w["kind"] == "hikmat"} == set(range(1,481))
assert {w["number"] for w in data if w["kind"] == "gharaib"} == set(range(1,10))
assert len({w["id"] for w in data}) == 489
assert all(w["arabic"].strip() and w["persian"].strip() for w in data)
photo_paths = re.findall(r"'(images/photo_quotes/quote_\d{3}\.(?:jpg|webp))'", PHOTOS)
assert len(photo_paths) == 93 and len(set(photo_paths)) == 93
for rel in photo_paths:
    photo = AS / rel
    assert photo.exists() and photo.stat().st_size > 100, rel
assert not (AS / "images/guest_album").exists(), "The old 18 posters must be removed"
assert "public void copyText(" in (ROOT/"app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java").read_text(encoding="utf-8")
print("PASS: V16 7 sections, 489 offline wisdoms, two icons, Sahel/Amiri, 93 offline photos, no Share.")
