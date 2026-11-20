// Static regression guard for owner's phone-approved exact HTML touch response.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','app/src/main/assets/index.html'),'utf8');
assert.match(html,/id="pmm-owner-touch97-trial"/);
assert.match(html,/\.pmm-owner-touch97\s*\{\s*scale:\.97!important;/);
assert.match(html,/DURATION_DOWN=100,DURATION_UP=145/);
for(const p of [
  'button,a[href],select,summary',
  '[role="button"]',
  '#photo-fullscreen img',
  'document.addEventListener(\'pointerdown\'',
  'document.addEventListener(\'pointermove\'',
  'document.addEventListener(\'pointerup\'',
  'document.addEventListener(\'pointercancel\'',
  'document.addEventListener(\'dragstart\'',
  'document.addEventListener(\'scroll\'',
  'document.addEventListener(\'keydown\'',
  'document.addEventListener(\'keyup\'',
  'document.addEventListener(\'visibilitychange\'',
  "window.addEventListener('blur',finish)",
  'prefers-reduced-motion:reduce',
  "if(!window.PointerEvent)",
  "if(!el||el.matches(':disabled,[disabled],[aria-disabled=\"true\"]'))return null",
  "if(active)finish();",
  'el.classList.remove(\'pmm-owner-touch97\')',
  'scale:none!important',
  '.home-menu-card.pmm-owner-touch97:active',
  '.home-hit.pmm-owner-touch97:active',
  '.session.pmm-owner-touch97:active',
  '#home-pane #home-exit.pmm-owner-touch97:active',
  '#scene #back-top.pmm-owner-touch97:active',
  '#stage .nahj-part-play.pmm-owner-touch97:active',
  '#wisdom-scroll .wisdom-utility-button.pmm-owner-touch97:active'
])assert(html.includes(p),'Missing owner-approved touch97 feature: '+p);
assert(!html.includes("pmm-owner-touch-compression-20261120"),'old 98.7% handler must not duplicate');
assert(html.includes("previousUniformSize*(5/6)"),'do not change approved six home labels');
assert(!html.includes("pmm_owner_wisdom_tools_v121.js"),'removed wisdom tools must not return');
console.log("PASS: exact approved touch97 CSS + delegated pointer, keyboard, reduced-motion, no duplicate handler");
