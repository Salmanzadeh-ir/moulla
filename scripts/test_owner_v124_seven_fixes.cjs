'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const get=p=>fs.readFileSync(p,'utf8');
const html=get('app/src/main/assets/index.html');
const course=get('app/src/main/assets/pmm_offline_course.js');
const java=get('app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java');
const service=get('app/src/main/java/ir/nahj/towhidkarbordi/PmmKafiAudioService.java');
const audio=get('app/src/main/assets/pmm_unified_background_audio_v124.js');
// 1 consent content is understandable, opt-in and separate from OS notifications
for(const word of ['همراه گرامی!','از آنجا که مطالب','بدون درخواست شما دانلود یا پخش','CONTENT_OPT_IN_PREFS'])
 assert(java.includes(word),word);
// 2 same Persian Shablon, doubled perceptual stroke and proportional single-line fit
for(const word of ['fonts/A-Shablon-Cut.ttf','-webkit-text-stroke:.06em','white-space:nowrap!important',
                   'ResizeObserver(queueHomeTitleFit)','if(titles.length!==6)return;'])
 assert(html.includes(word),word);
// 3 course Back while rules unchecked and no implicit acceptance
for(const word of ["if(!$('course-welcome').hidden){leaveCourse();return;}","exit.disabled=true;",
 "backTop.hidden=false;backTop.disabled=false;","if(!event.target.checked)return;"])assert(course.includes(word),word);
assert(html.includes('window.PMM_OFFLINE_COURSE.back();'));
// 4 deleted unsolicited Tafal bookmark/notes script AND reference
assert(!fs.existsSync('app/src/main/assets/pmm_owner_wisdom_tools_v121.js'));
assert(!html.includes('<script src="pmm_owner_wisdom_tools_v121.js"></script>'));
// 5 only four choices, one label, fixed Back; no extra text/icons/actions
const settings=html.slice(html.indexOf('function renderReminderSettings(){'),
 html.indexOf('function closeWisdomReminderSettings(){'));
for(const word of ['تکرار یادآوری','هر روز (پیش‌فرض)','هفته‌ای یک‌بار','ماهی یک‌بار','خاموش',
 'back.hidden=false;back.disabled=false'])assert(settings.includes(word),word);
for(const gone of ['یادآور مهمانی مولا','id="pmm-reminder-status"','id="pmm-reminder-permission"',
 'id="pmm-reminder-back"','اجازهٔ نمایش اعلان</button>'])
 assert(!settings.includes(gone),'Extra text/settings found: '+gone);
// 6 all first-party Nahj catalog and course use the same validated foreground native engine
for(const word of ['pmmAudioStart','kafiStatus','kafiToggle','startWisdom','attachNahjCards',
                    'attachDirect'])assert(audio.includes(word),word);
assert(java.includes('pmmAudioStart(final String url')&&java.includes('startForegroundService(start)'));
assert(service.includes('/Audio/nahj-al-balaghe/tartibi/')&&service.includes('captureListening();'));
assert(service.includes('"listened"')&&service.includes('lastListenWall'));
assert(course.includes('nativeAudio.start(source,formatTrack(activeTrack),speed,startingAt)'));
assert(course.includes('Math.max(before.listened,Math.max(0,Number(snapshot.listened)||0))'));
assert(course.includes('logic.canMarkHeard(pos.listened,duration)'));
assert(html.includes('window.PMM_GLOBAL_AUDIO?.attachNahjCards'));
assert(html.includes('window.PMM_GLOBAL_AUDIO.startWisdom'));
assert(html.includes('window.PMM_GLOBAL_AUDIO?.attachDirect'));
// Native controls reject arbitrary origins / open content / premature calls.
const calls=[];
const owner={PMMNative:{
 pmmAudioStart:(...args)=>calls.push(['start',...args]),
 kafiStatus:()=>JSON.stringify({valid:true,active:true,position:3}),
 kafiToggle:(...args)=>calls.push(['toggle',...args]),
 kafiSeek:(...args)=>calls.push(['seek',...args]),
 kafiSpeed:(...args)=>calls.push(['speed',...args])
}};
owner.window=owner;vm.runInNewContext(audio,owner);
const bridge=owner.PMM_GLOBAL_AUDIO;
assert(bridge.available());
assert(!bridge.approved('https://evil.test/Audio/kafi/kafi 2.mp3'));
assert(!bridge.start('https://evil.test/x.mp3','invalid',1,0));
assert.equal(calls.length,0,'No automatic media playback');
const approved='https://dl.kazeminia110.ir/Audio/kafi/kafi 2.mp3';
assert(bridge.approved(approved));
assert(bridge.start(approved,'owner audio',1,0));
assert.equal(calls.length,1);
assert(bridge.seek(approved,10));
assert.equal(calls[1][0],'seek');
// 7 Eitaa native focus restoration and JS explicit first-touch release
assert(java.includes('requestFocusFromTouch()'));
assert(java.includes("window.dispatchEvent(new Event('pmm:external-return'))"));
assert(html.includes("lastBackClick=-1000;lastResume=0;resumed();"));
assert(html.includes("if(openedAt||screen==='about')top.focus({preventScroll:true})"));
console.log('PASS: all seven owner defects checked; no remote media before Play, background service routed and consent protected');
