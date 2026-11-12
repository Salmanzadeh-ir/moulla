#!/usr/bin/env python3
"""Read-only acceptance checks for owner-requested New Iwan V9 preview.

This verifier never re-writes or relaxes the historical V10.4.9 lock.
The official V10.4.9 is verified separately at its immutable tag.
"""
from __future__ import annotations
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'app/src/main/assets'
EXPECTED = {
    'index.html': '4fa46be2af47df03ee26fe4af751fbce0dcc8f93fe0a8df9b8b3523f5749f8bf',
    'images/new_ui_bg.png': '7f911cd1d12bb014eee9660f2be4dbaaf5e49d84a198291ca9f51f2bc36e86e3',
    'images/new_ui_menu.png': 'e0292655a3a6fae05419912fe681362634107ef2d84940a7c96946a8f7360edf',
    'lessons.json': 'fe8cbfe83c5b7caa4944e31c94d9619df59d70417e62fc46650d356e2303d550',
    'kafi.json': '8399ad93c5d7112eb02901995cabf2ad4d3229e2e800a13e4b4ba2286b61ddad',
    'life.json': '188b09948bafc6f321c584206cdc6af48052d2c35031f8f120785753583ab330',
    'library.json': '8a71a6e76bd5ba705c192b881c923ac6b372067cd71cfdb1b32574f9308156b8',
    'session_manifest_v8.json': '269d289c2d14a6fd2160abe6d1205b8eb2029953e800c69171e5da649b2fa25d',
}


def verify() -> None:
    for relative, expected in EXPECTED.items():
        p = ASSETS / relative
        if not p.is_file():
            raise AssertionError(f'Missing V9 dependency: {relative}')
        actual = hashlib.sha256(p.read_bytes()).hexdigest()
        if actual != expected:
            raise AssertionError(f'Unexpected change to V9 source/content: {relative}: {actual}')
    html = (ASSETS / 'index.html').read_text(encoding='utf-8')
    menu = ('nahj_audio', 'tawhid', 'see_god', 'kafi', 'videos',
            'photo_quotes', 'guest_sentence_new')
    for key in menu:
        if len(re.findall(r'data-menu="' + key + r'"', html)) != 1:
            raise AssertionError(f'V9 seven-button menu mismatch: {key}')
    for i in range(1, 19):
        p = ASSETS / 'images/guest_album' / f'{i:02d}.jpg'
        if not p.is_file():
            raise AssertionError(f'Missing 18-photo original guest carousel: {p}')
    for i in range(1, 11):
        p = ASSETS / 'images/gallery' / f'photo_{i:02d}.webp'
        if not p.is_file():
            raise AssertionError(f'Missing 10-photo About gallery: {p}')
    for path in set(re.findall(r'images/[\w./-]+\.(?:png|jpg|webp)', html)):
        if not (ASSETS / path).is_file():
            raise AssertionError(f'Missing image used by V9 HTML: {path}')
    for symbol in ('function goBack()', 'window.PMM_V9', 'PMMNative',
                   'touchstart', 'touchend', 'guest_sentence_new'):
        if symbol not in html:
            raise AssertionError(f'Missing V9 behavior: {symbol}')
    print('PASS: owner-requested V9 HTML, two original images, data,'
          ' seven-button menu, 18+10 gallery images and navigation hooks.')
    print('NOTE: online playback and real-device Eitaa resume require a phone test.')
    print('NOTE: only five DEMO wisdoms; 480 verified wisdoms are not in this preview.')


if __name__ == '__main__':
    verify()
