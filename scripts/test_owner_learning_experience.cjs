/* Owner-authorized trial: exact features except unified search. No old content removed. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const js=fs.readFileSync('app/src/main/assets/pmm_learning_experience.js','utf8');
const css=fs.readFileSync('app/src/main/assets/pmm_learning_experience.css','utf8');
const main=fs.readFileSync('app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java','utf8');
const service=fs.readFileSync('app/src/main/java/ir/nahj/towhidkarbordi/PmmBackgroundAudioService.java','utf8');
const downloader=fs.readFileSync('app/src/main/java/ir/nahj/towhidkarbordi/PmmAudioDownloads.java','utf8');
const manifest=fs.readFileSync('app/src/main/AndroidManifest.xml','utf8');
assert(html.includes('<script src="pmm_learning_experience.js"></script>'));
assert(html.includes('<link rel="stylesheet" href="pmm_learning_experience.css">'));
new vm.Script(js,{filename:'pmm_learning_experience.js'});
for(const script of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)])if(script[1].trim())new vm.Script(script[1]);
for(const feature of [
 'PMM_LEARNING_EXTRAS','pmm_learning_extras_v1','function toggleMark',
 'function setNote','function setSleep','function renderToolPage','function decorateAudio',
 'function enhancePage','function navigateMark','pmm-cal m'
].filter(x=>x!=='pmm-cal m'))assert(js.includes(feature),'missing '+feature);
for(const feature of [
 'از کجا شروع کنم؟','موضوعات زندگی','برگزیده‌های کوتاه','نشان‌شده‌های من',
 'صوت‌های دریافتی','زمان‌سنج خواب','حالت مطالعه آرام','راهنمای برنامه',
 'پخش پس‌زمینه','دریافت آفلاین','تلاش دوباره','یادداشت من','گزارش مشکل لینک',
 '۱۵ ثانیه','۳۰ ثانیه','پخش خودکار جلسه بعد'
])assert(js.includes(feature),'missing '+feature);
assert(!js.includes('type="search"')&&!js.includes('id="pmm-unified-search"'),'global search excluded by owner');
assert(js.includes('bank().filter'),'topics are based on existing source wisdom data');
assert(js.includes('متن و خلاصه این جلسه هنوز تأیید نشده است'),'no fabricated lesson summary');
assert(service.includes('MediaSession')&&service.includes('startForeground')&&service.includes('PlaybackState'));
assert(service.includes('PmmAudioDownloads.offlineFile')&&service.includes('allowed(String link)'));
assert(service.includes('5[0-4]')&& !service.includes('5[5-9]'),'Kafi 55-59 remain denied');
assert(downloader.includes('AtomicBoolean')&&downloader.includes('setInstanceFollowRedirects(false)'));
assert(main.includes('playBackgroundAudio')&&main.includes('getBackgroundAudioState')&&main.includes('downloadLessonAudio'));
assert(manifest.includes('android:foregroundServiceType="mediaPlayback"'));
assert(manifest.includes('android:exported="false"'));
assert(css.includes('#pmm-tools-button')&&css.includes('.pmm-calm-reading'));
const album=html.match(/const DATA = ([^\n]+)\nconst APPROVED_IMAGE_01/);
assert(album);const data=JSON.parse(album[1]);
assert.equal(data.kafi.length,55);
assert.equal(data.kafi[0].title,'کافی شناسی');
assert.equal(data.kafi.at(-1).title,'جلسه ۵۴');
assert.equal(data.towhid.length,50);
assert.equal(data.life.length,17);
const urls=fs.readFileSync('app/src/main/assets/nahj_audio_links.js','utf8');
const ctx={window:{}};vm.runInNewContext(urls,ctx);
const count=Object.values(ctx.window.PMM_NAHJ_AUDIO_DATA.parts).reduce((x,y)=>x+y.length,0);
assert.equal(count,1019);
assert(!html.includes('این جلسه را شنیدم'),'obsolete lesson marking remains');
console.log('PASS: all requested features except unified search; 1019 Nahj audio, 55 Kafi items, 50/17 lessons and protected original UI preserved.');
