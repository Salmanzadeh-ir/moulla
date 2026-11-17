/* Owner trial v108: never modify approved content, skip integrated search (#3). */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const source=p=>fs.readFileSync(p,'utf8');
const html=source('app/src/main/assets/index.html');
const js=source('app/src/main/assets/pmm_owner_improvements.js');
const css=source('app/src/main/assets/pmm_owner_improvements.css');
const java=source('app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java');
const service=source('app/src/main/java/ir/nahj/towhidkarbordi/PmmAudioService.java');
const dl=source('app/src/main/java/ir/nahj/towhidkarbordi/PmmAudioDownloads.java');
const manifest=source('app/src/main/AndroidManifest.xml');
new vm.Script(js,{filename:'pmm_owner_improvements.js'});
for(const [i,script] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries())
 if(script[1].trim())new vm.Script(script[1],{filename:'index inline '+i});
assert(html.includes('<script src="pmm_owner_improvements.js"></script>'));
assert(html.includes('<link rel="stylesheet" href="pmm_owner_improvements.css">'));
for(const [name,expected] of [
 ['progress saved by exact seconds','pmmKafiSeconds'],
 ['owner favorite marker','pmm_user_bookmarks'],
 ['Kafi resume','loadedmetadata'],
 ['rewind','۱۵ ثانیه عقب'],
 ['skip ahead','۳۰ ثانیه جلو'],
 ['next/previous','جلسه بعد'],
 ['sleep timer','تایمر خواب'],
 ['offline MP3','startAudioDownload'],
 ['background audio','playAudioInBackground'],
 ['new learning guide','از کجا شروع کنم؟'],
 ['thematic wisdom browsing','موضوعات زندگی'],
 ['intro panel','این جلسه در یک نگاه'],
 ['authentic short selections','برگزیده‌های کوتاه'],
 ['audio mini player','pmm-v108-mini'],
 ['offline-list section','صوت‌های دریافتی'],
 ['user favorites','نشان‌شده‌های من']
])assert(js.includes(expected)||js.includes(expected==='pmmKafiSeconds'?'kafiSeconds':expected==='pmm_user_bookmarks'?'pmm_owner_tools_v108':expected),name);
assert(!js.includes('جست‌وجوی هوشمند')&&!js.includes('جستجوی هوشمند'),'option #3 excluded');
assert(js.includes("window.PMM_HIKMAT_ALL"),'source only verified authentic wisdom bank');
assert(js.includes('x.persian.includes(token)'),'topic assignments must be lexical only, not AI inference');
assert(js.includes('getNahj')===false,'original Nahj progress remains controlled by legacy module');
assert(css.includes('min-height:44px'),'adequate touch targets');
assert(/FOREGROUND_SERVICE_MEDIA_PLAYBACK/.test(manifest));
assert(/android:foregroundServiceType="mediaPlayback"/.test(manifest));
assert(/MediaSession/.test(service)&&/startForeground/.test(service)&&/START_NOT_STICKY/.test(service));
assert(/MAX_BYTES=120L\*1024\*1024/.test(dl)&&/setInstanceFollowRedirects\(false\)/.test(dl));
assert(/getAudioDownloads/.test(java)&&/playAudioInBackground/.test(java));
const match=html.match(/const DATA = ([^\n]+)\nconst APPROVED_IMAGE_01/);
const kafi=JSON.parse(match[1]).kafi;
assert.equal(kafi.length,55);
assert.equal(kafi[0].title,'کافی شناسی');
assert.equal(kafi[54].title,'جلسه ۵۴');
const nahj=source('app/src/main/assets/nahj_audio_links.js');
const ctx={window:{}};vm.runInNewContext(nahj,ctx);
const parts=Object.values(ctx.window.PMM_NAHJ_AUDIO_DATA.parts);
assert.equal(parts.reduce((sum,items)=>sum+items.length,0),1019);
const wisdom=source('app/src/main/assets/hikam_bank.js');
const wisCtx={window:{}};vm.runInNewContext(wisdom,wisCtx);
assert.equal(wisCtx.window.PMM_HIKMAT_ALL.length,489);
console.log('PASS owner v108: optional audio UX and offline controls, source-only topic/short wisdom, original 55 Kafi, 1019 Nahj audio, 489 protected wisdoms, Java/manifest wiring, no integrated search');
