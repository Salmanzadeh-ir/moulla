#!/usr/bin/env python3
"""Optional V9 touch/navigation smoke test. Run after `pip install playwright`

  python -m playwright install chromium
  python tests/v9_browser_smoke.py

No network/media playback or real Android lifecycle is claimed by this test.
"""
from pathlib import Path
import shutil
import http.server
import threading
import functools
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / 'app/src/main/assets/index.html'
assert HTML.exists(), HTML
errors = []
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(HTML.parent))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/index.html' % server.server_address[1]
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path=shutil.which('chromium'), args=['--no-sandbox'])
    context = browser.new_context(
        viewport={'width': 393, 'height': 852},
        is_mobile=True, has_touch=True, device_scale_factor=1,
    )
    context.add_init_script('window.PMMNative={openEitaa:(url)=>{window.__eitaa=url;},exitApp:()=>{window.__exited=true;}};')
    page = context.new_page()
    page.on('pageerror', lambda exception: errors.append(str(exception)))
    page.set_content(HTML.read_text(encoding='utf-8'), wait_until='domcontentloaded')
    page.wait_for_timeout(250)
    assert page.evaluate('screen') == 'home'
    page.locator('[data-menu="photo_quotes"]').click(force=True)
    page.wait_for_timeout(350)
    assert page.evaluate('PMM_V8.getWheels().find(x=>x.name==="photos").total') == 18
    before = page.evaluate('PMM_V8.getWheels().find(x=>x.name==="photos").index')
    rect = page.locator('#photo-wheel-canvas').bounding_box()
    cdp = context.new_cdp_session(page)
    x, y = rect['x'] + rect['width'] * .65, rect['y'] + rect['height'] * .54
    cdp.send('Input.dispatchTouchEvent', {'type':'touchStart', 'touchPoints':[{'x':x, 'y':y, 'id':1}]})
    for i in range(1,8):
        cdp.send('Input.dispatchTouchEvent', {'type':'touchMove', 'touchPoints':[{'x':x-i*19, 'y':y, 'id':1}]})
    cdp.send('Input.dispatchTouchEvent', {'type':'touchEnd', 'touchPoints':[]})
    page.wait_for_timeout(850)
    assert page.evaluate('PMM_V8.getWheels().find(x=>x.name==="photos").index') != before
    page.locator('#back-top').click(force=True)
    assert page.evaluate('screen') == 'home'
    page.locator('[data-menu="videos"]').click(force=True)
    page.wait_for_timeout(350)
    rect = page.locator('#clips-wheel-canvas').bounding_box()
    x, y = rect['x'] + rect['width'] * .65, rect['y'] + rect['height'] * .54
    cdp.send('Input.dispatchTouchEvent', {'type':'touchStart', 'touchPoints':[{'x':x, 'y':y, 'id':2}]})
    for i in range(1,8):
        cdp.send('Input.dispatchTouchEvent', {'type':'touchMove', 'touchPoints':[{'x':x-i*19, 'y':y, 'id':2}]})
    cdp.send('Input.dispatchTouchEvent', {'type':'touchEnd', 'touchPoints':[]})
    page.wait_for_timeout(850)
    assert page.evaluate('PMM_V8.getWheels().find(x=>x.name==="clips").index') != 0
    page.locator('#legacy-back-top').click(force=True)
    assert page.evaluate('screen') == 'home'
    page.locator('[data-menu="kafi"]').click(force=True)
    page.locator('.session').first.click(force=True)
    assert 'eitaa.com' in page.evaluate('window.__eitaa || ""')
    page.evaluate("window.dispatchEvent(new Event('focus'))")
    page.locator('#legacy-back-top').click(force=True)
    assert page.evaluate('screen') == 'home'
    page.locator('#about').click(force=True)
    page.locator('#about-biography').click(force=True)
    page.locator('#legacy-back-top').click(force=True)
    assert page.evaluate('screen') == 'about'
    page.locator('#legacy-back-top').click(force=True)
    assert page.evaluate('screen') == 'home'
    assert not errors, errors
    context.close()
    browser.close()
server.shutdown()
print('PASS: V9 touch carousels, Eitaa return simulation, Back, and About.')
