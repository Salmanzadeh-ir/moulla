/* Owner v109: ONLY resume-at-second for Kafi and screen-off MP3. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('app/src/main/assets/index.html');
const addon=read('app/src/main/assets/pmm_kafi_resume_screenoff.js');
const java=read('app/src/main/java/ir/nahj/towhidkarbordi/PmmKafiAudioService.java');
const activity=read('app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java');
const manifest=read('app/src/main/AndroidManifest.xml');
const approved=cp.execFileSync('git',['show','7467a3ac4445ba2a7bc16fcebe02c5f9068b2fa5:app/src/main/assets/index.html'],{encoding:'utf8'});
assert(html.includes('<script src="pmm_kafi_resume_screenoff.js"></script>'));
const added=[
' // Two approved additions only: last-second Kafi resume and screen-off playback.',
' // Keep the exact existing Kafi controls; substitute native media when available.',
' if(window.PMM_KAFI_ONLY?.attach?.(card,item))return;',
' window.PMM_KAFI_ONLY?.attachFallback?.(card,item);',
''].join('\n');
assert.equal(html.replace('<script src="pmm_kafi_resume_screenoff.js"></script>\n','').replace(added,''),approved,
 'original owner-approved HTML (including all non-Kafi sections) remains byte-for-byte identical');
new vm.Script(addon,{filename:'pmm_kafi_resume_screenoff.js'});
for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries())
 if(m[1].trim())new vm.Script(m[1],{filename:'approved script #'+i});
for(const term of ['kafiPlay(','kafiToggle(','kafiStatus(','kafiSeek(','kafiSpeed(','loadedmetadata',
                      "'pause'","'timeupdate'","'ended'",'clearInterval(timer)'])
 assert(addon.includes(term),'Kafi native/fallback feature missing: '+term);
for(const forbidden of ['pmm_owner_improvements','pmm-v108','برگزیده‌های کوتاه','موضوعات زندگی',
                         'از کجا شروع کنم','تایمر خواب','نشانک','صوت‌های دریافتی'])
 assert(!addon.includes(forbidden),'rejected UX feature reappeared: '+forbidden);
for(const term of ['private final Handler handler','Math.abs(position-lastSaved)>=2','saveSecond()',
                    'clearSavedSecond()','startForeground','MediaSession','setWakeMode',
                    'START_NOT_STICKY','onDestroy()','ACTION_SEEK','ACTION_SPEED'])
 assert(java.includes(term),'service lacks: '+term);
for(const term of ['kafiPlay','kafiStatus','kafiToggle','kafiSeek','kafiSpeed'])
 assert(activity.includes(term),'restricted MainActivity Kafi bridge: '+term);
assert(manifest.includes('FOREGROUND_SERVICE_MEDIA_PLAYBACK'));
assert(manifest.includes('android:foregroundServiceType="mediaPlayback"'));
assert(manifest.includes('android:name="android.permission.WAKE_LOCK"'));
assert(!/PmmAudioDownloads|pmm_owner_improvements|startAudioDownload|copyAudioReport/.test(activity+manifest+addon));
const data=JSON.parse(html.match(/const DATA = ([^\n]+)\nconst APPROVED_IMAGE_01/)[1]);
assert.equal(data.kafi.length,55);
assert.equal(data.kafi[0].title,'کافی شناسی');
assert.equal(data.kafi[54].title,'جلسه ۵۴');
const ctx={window:{}};
vm.runInNewContext(read('app/src/main/assets/nahj_audio_links.js'),ctx);
assert.equal(Object.values(ctx.window.PMM_NAHJ_AUDIO_DATA.parts).reduce((sum,x)=>sum+x.length,0),1019);
const wisdom={window:{}};
vm.runInNewContext(read('app/src/main/assets/hikam_bank.js'),wisdom);
assert.equal(wisdom.window.PMM_HIKMAT_ALL.length,489);

/* Real JS fallback behavior: pause, reopen, resume exactly at saved second. */
const cache=new Map(),events={};
const localStorage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)};
const url='https://dl.kazeminia110.ir/Audio/kafi/kafi 2.mp3';
const c={window:{},localStorage,console,Math,Number,JSON,String,
 pmmKafiAudioIsOwnerURL:u=>u===url,nahjAudioTime:n=>String(n)};
vm.runInNewContext(addon,c);
const audio={duration:4000,currentTime:0,ended:false,addEventListener:(name,fn)=>{events[name]=fn}};
const status={textContent:''};
const card={querySelector:q=>q==='audio.kafi-audio-media'?audio:q==='[data-kafi-status]'?status:null};
const record={url,title:'جلسه ۲'};
c.window.PMM_KAFI_ONLY.attachFallback(card,record);
audio.currentTime=193.8;events.timeupdate();events.pause();
assert.equal(JSON.parse(cache.get('pmm_kafi_seconds_html_v109'))[url],193);
const events2={},audio2={duration:4000,currentTime:0,ended:false,addEventListener:(name,fn)=>events2[name]=fn};
const card2={querySelector:q=>q==='audio.kafi-audio-media'?audio2:q==='[data-kafi-status]'?status:null};
c.window.PMM_KAFI_ONLY.attachFallback(card2,record);
events2.loadedmetadata();
assert.equal(audio2.currentTime,193,'reopened Kafi resumes at exactly 193 seconds');
events2.ended();
assert.equal(JSON.parse(cache.get('pmm_kafi_seconds_html_v109'))[url],0,'finished file resets position');
console.log('PASS: only 2 requested Kafi features, original HTML untouched otherwise, 55 Kafi, 1019 Nahj links, 489 wisdoms, exact HTML5 fallback seek after reopen.');
