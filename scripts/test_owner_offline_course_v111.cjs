'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('app/src/main/assets/index.html');
const links=read('app/src/main/assets/nahj_audio_links.js');
const logicSource=read('app/src/main/assets/pmm_offline_course_logic.js');
const uiSource=read('app/src/main/assets/pmm_offline_course.js');

// Build from the exact owner-supplied 1019-link catalog, not a parallel/fabricated list.
const context={window:{}};context.window.window=context.window;
vm.runInNewContext(links,context,{filename:'nahj_audio_links.js'});
vm.runInNewContext(logicSource,context,{filename:'pmm_offline_course_logic.js'});
const catalog=context.window.PMM_NAHJ_AUDIO_DATA;
const logic=context.window.PMM_OFFLINE_COURSE_LOGIC;
const tracks=logic.buildTracks(catalog);
assert.equal(tracks.length,1019,'Course includes all 1019 original MP3 files');
assert.deepEqual(
 ['sermons','letters','wisdoms'].map(group=>tracks.filter(x=>x.groupId===group).length),
 [357,151,511],
 'All original sermon, letter and wisdom MP3s are included in order'
);
assert.equal(new Set(tracks.map(x=>x.id)).size,1019,'Every audio file has a stable unique ID');
const originalUrls=['sermons','letters','wisdoms'].flatMap(group=>catalog.items[group].flatMap(record=>catalog.parts[record.id]||[]));
assert.deepEqual(Array.from(tracks,x=>x.url),originalUrls,'Course uses exact original URLs in catalog order');
assert(tracks.every(x=>logic.validUrl(x.url)),'Every track uses the owner-approved MP3 host/path');
assert.equal(tracks[0].groupId,'sermons');
assert.equal(tracks[356].groupId,'sermons');
assert.equal(tracks[357].groupId,'letters');
assert.equal(tracks[508].groupId,'wisdoms');
assert.equal(tracks[1018].groupId,'wisdoms');

// Daily and weekly entitlement, including one-off extra listening days.
const daily1={plan:{mode:'daily1',startDate:'2026-11-18',baseCompleted:0},extras:{}};
assert.equal(logic.entitlement(daily1,'2026-11-18'),1);
assert.equal(logic.entitlement(daily1,'2026-11-19'),2);
const daily2={plan:{mode:'daily2',startDate:'2026-11-18',baseCompleted:0},extras:{}};
assert.equal(logic.entitlement(daily2,'2026-11-18'),2);
assert.equal(logic.entitlement(daily2,'2026-11-20'),6);
const weekly={plan:{mode:'weekly',startDate:'2026-11-18',weekday:6,baseCompleted:0},extras:{}};
assert.equal(logic.entitlement(weekly,'2026-11-20'),0,'Weekly course waits until the selected day');
assert.equal(logic.entitlement(weekly,'2026-11-21'),1,'Selected Saturday unlocks one audio');
assert.equal(logic.entitlement(weekly,'2026-11-28'),2,'Next selected weekday unlocks the next audio');
weekly.extras['2026-11-20']=1;
assert.equal(logic.entitlement(weekly,'2026-11-20'),1,'One extra audio can be added on a non-scheduled day');
const changedPlan={plan:{mode:'daily1',startDate:'2026-11-18',baseCompleted:12},extras:{}};
assert.equal(logic.entitlement(changedPlan,'2026-11-18'),13,'Changing schedule preserves prior completion');
assert.equal(logic.nextEligibleDate(weekly.plan,'2026-11-21'),'2026-11-28');
assert.equal(logic.canMarkHeard(399,600),false,'Less than two-thirds cannot be marked');
assert.equal(logic.canMarkHeard(400,600),true,'Two-thirds enables the listened check');
assert.equal(logic.canMarkHeard(601,600),true);
assert.deepEqual(JSON.parse(JSON.stringify(logic.progress(500,1019))),{completed:500,total:1019,percent:49.07});

// Verify the exact requested introduction, schedule controls, audio and notebook UI.
for(const phrase of [
 'شما می‌توانید با روزی چهل دقیقه وقت گذاشتن، شرح کل نهج‌البلاغه را شنیده و با معارف علوی آشنا شوید.',
 'این یک انتخاب نیست، یک توفیق الهی است برای انس شما با کلمات امیرالمؤمنین علیه‌السلام.',
 'اگر آماده همراهی هستید، یا علی بگویید',
 'من دستیار هوشمند شما هستم',
 'روزی ۱ صوت','روزی ۲ صوت','هفته‌ای ۱ صوت',
 'شنیدم؛ ثبت این صوت','دفترچه این صوت','دفترچه یادداشت‌های من',
 'امروز یک صوت بیشتر بشنوم','course-progress-fill','course-audio'
]) assert(html.includes(phrase),'Required course UI copy/element exists: '+phrase);
assert.equal((html.match(/data-course-weekday="[0-6]"/g)||[]).length,7,'All seven weekdays are selectable');
assert(html.includes('data-open-course="offline-course"'),'Home course entry opens the new page');
assert(!html.includes('data-home-placeholder="offline-course"'),'Old placeholder action removed');
assert(html.includes('<script src="pmm_offline_course_logic.js"></script>'));
assert(html.includes('<script src="pmm_offline_course.js"></script>'));
for(const term of [
 'pmm_offline_nahj_course_v111','localStorage.setItem(KEY','pendingAdvance',
 'visibilitychange','pagehide','timeupdate','loadedmetadata','savePlayback(true)',
 'state.completedCount','course-note-id','course-revisit-back','course-extra',
 'logic.canMarkHeard'
]) assert(uiSource.includes(term),'Course persistence/resume/notes behavior exists: '+term);
assert(logicSource.includes('duration*(2/3)'),'Two-thirds listening threshold is implemented');

// Every inline and external script parses as JavaScript.
for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries())
 if(m[1].trim())new vm.Script(m[1],{filename:'inline-'+i+'.js'});
new vm.Script(links,{filename:'nahj_audio_links.js'});
new vm.Script(logicSource,{filename:'pmm_offline_course_logic.js'});
new vm.Script(uiSource,{filename:'pmm_offline_course.js'});
console.log('PASS: 1019 exact MP3s (357 sermons, 151 letters, 511 wisdoms); daily 1/2 and weekly weekday scheduling; extra audio; 2/3 listening gate; progress math; local resume and notes hooks; all course scripts parse.');

// Exercise the complete onboarding -> schedule -> player -> mark -> next track -> notes flow.
class FakeElement{
 constructor(id=''){
  this.id=id;this.hidden=true;this.disabled=false;this.checked=false;this.value='';this.textContent='';
  this.dataset={};this.style={};this.attributes={};this.listeners={};this.children=[];this.scrollTop=0;this.scrollHeight=600;this.clientHeight=300;
  this.classList={toggle:()=>{},add:()=>{},remove:()=>{}};
  this._innerHTML='';
 }
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
 dispatch(name,event={}){for(const fn of this.listeners[name]||[])fn({target:this,preventDefault(){},...event})}
 click(){this.dispatch('click')}
 setAttribute(k,v){this.attributes[k]=String(v)}
 getAttribute(k){return this.attributes[k]??(k==='src'?this.src||'':null)}
 removeAttribute(k){delete this.attributes[k];if(k==='src')this.src=''}
 focus(){}
 querySelector(selector){if(selector==='[role=progressbar]')return progressbar;return null}
 querySelectorAll(selector){if(selector==='[data-course-note-id]')return this.children;return []}
 set innerHTML(value){
  this._innerHTML=String(value);this.children=[];
  for(const match of this._innerHTML.matchAll(/data-course-note-id="([^"]+)"/g)){
   const button=new FakeElement('saved-note');button.dataset.courseNoteId=match[1];this.children.push(button);
  }
 }
 get innerHTML(){return this._innerHTML}
}
const ids=['offline-course-scroll','main-scroll','wisdom-scroll','gallery-scroll','scene','back-top','exit','about','wisdom-floor-cover',
 'course-welcome','course-setup','course-dashboard','course-note-list','course-accept-check','course-welcome-error','course-weekdays',
 'course-setup-back','course-save-plan','course-progress-panel','course-progress-fill','course-progress-count','course-progress-percent',
 'course-plan-summary','course-after-mark','course-after-mark-text','course-after-mark-home','course-no-due','course-no-due-text','course-next-date',
 'course-complete','course-complete-home','course-track-card','course-track-group','course-track-title','course-track-sequence',
 'course-audio','course-audio-toggle','course-seek','course-current-time','course-duration-time','course-audio-status','course-listened-status',
 'course-note-text','course-note-status','course-note-save','course-threshold','course-heard','course-revisit-back','course-extra',
 'course-notes-open','course-settings-open','course-notes-back','course-notes-items','new-toast','scroll-thumb'];
const elements=Object.fromEntries(ids.map(id=>[id,new FakeElement(id)]));
const progressbar=new FakeElement('progressbar');
const plans=['daily1','daily2','weekly'].map(mode=>{const b=new FakeElement('plan');b.dataset.coursePlan=mode;return b});
const days=[6,0,1,2,3,4,5].map(day=>{const b=new FakeElement('day');b.dataset.courseWeekday=String(day);return b});
const speeds=[0.75,1,1.25,1.5,2].map(value=>{const b=new FakeElement('speed');b.dataset.courseSpeed=String(value);return b});
const courseButton=new FakeElement('course-button');
const courseAudio=elements['course-audio'];courseAudio.paused=true;courseAudio.currentTime=0;courseAudio.duration=NaN;courseAudio.playbackRate=1;courseAudio.src='';
courseAudio.load=function(){this.currentTime=0;this.duration=NaN;this.paused=true};
courseAudio.play=function(){this.paused=false;this.dispatch('play');return Promise.resolve()};
courseAudio.pause=function(){if(!this.paused){this.paused=true;this.dispatch('pause')}};
const documentFake={visibilityState:'visible',
 getElementById:id=>elements[id]||null,
 querySelectorAll:selector=>selector==='[data-course-plan]'?plans:selector==='[data-course-weekday]'?days:selector==='[data-course-speed]'?speeds:selector==='audio'?[courseAudio]:[],
 querySelector:selector=>selector==='[data-open-course]'?courseButton:null,
 addEventListener(){},
};
const local=new Map();
const storage={getItem:key=>local.has(key)?local.get(key):null,setItem:(key,value)=>local.set(key,String(value)),removeItem:key=>local.delete(key)};
let homeReturned=0;
const windowFake={PMM_NAHJ_AUDIO_DATA:catalog,PMM_OFFLINE_COURSE_LOGIC:logic,
 PMM_NEW_UI:{showHome(){homeReturned++;elements['main-scroll'].hidden=false;elements['exit'].hidden=false;elements['about'].hidden=false;elements['back-top'].hidden=true;elements['wisdom-floor-cover'].hidden=true;elements.scene.dataset.screen='home'}},
 addEventListener(){}};
windowFake.window=windowFake;
const uiContext={window:windowFake,document:documentFake,localStorage:storage,goBack(){},resetHomeMenu(){},
 requestAnimationFrame:fn=>fn(),setTimeout:()=>1,clearTimeout(){},Date,Intl,Map,Number,Math,JSON,String,Object,Array,encodeURI,Promise};
vm.runInNewContext(uiSource,uiContext,{filename:'pmm_offline_course-ui-test.js'});
assert.equal(windowFake.PMM_OFFLINE_COURSE.getTrackCount(),1019);
courseButton.click();
assert.equal(elements['offline-course-scroll'].hidden,false);
assert.equal(elements['course-welcome'].hidden,false,'First visit shows invitation');
elements['course-accept-check'].checked=true;elements['course-accept-check'].dispatch('change',{target:elements['course-accept-check']});
assert.equal(elements['course-setup'].hidden,false,'Accepting invitation immediately opens schedule setup');
plans.find(x=>x.dataset.coursePlan==='daily2').click();
elements['course-save-plan'].click();
assert.equal(elements['course-dashboard'].hidden,false);
assert.equal(elements['course-track-card'].hidden,false);
assert.equal(elements['course-track-title'].textContent,'خطبه ۱ — بخش اول');
courseAudio.duration=600;courseAudio.dispatch('loadedmetadata');
elements['course-audio-toggle'].click();
for(let i=1;i<=200;i++){courseAudio.currentTime=i*2;courseAudio.dispatch('timeupdate')}
assert.equal(elements['course-heard'].disabled,false,'After 400/600 seconds the listened check activates');
elements['course-heard'].click();
assert.equal(elements['course-after-mark'].hidden,false,'Marking listened records completion and shows success');
assert(elements['course-progress-count'].textContent.includes('۱ از ۱۰۱۹'));
vm.runInNewContext('goBack()',uiContext);
assert.equal(homeReturned,1,'Back returns to the original home page');
courseButton.click();
assert.equal(elements['course-track-title'].textContent,'خطبه ۱ — بخش دوم','Next visit advances to the next audio in the two-per-day plan');
courseAudio.duration=600;courseAudio.dispatch('loadedmetadata');
elements['course-audio-toggle'].click();
for(let i=1;i<=20;i++){courseAudio.currentTime=i*2;courseAudio.dispatch('timeupdate')}
courseAudio.pause();
const stored=JSON.parse(local.get('pmm_offline_nahj_course_v111'));
const secondTrack=tracks[1];
assert.equal(stored.positions[secondTrack.id].position,40,'Pause saves the exact current second');
const resumePosition=stored.positions[secondTrack.id].position;
vm.runInNewContext('goBack()',uiContext);
courseButton.click();
assert.equal(elements['course-track-title'].textContent,'خطبه ۱ — بخش دوم');
courseAudio.duration=600;courseAudio.dispatch('loadedmetadata');
assert.equal(courseAudio.currentTime,resumePosition,'Reopening restores the exact saved second');
elements['course-note-text'].value='خلاصه و برداشت شخصی من از این صوت';
elements['course-note-text'].dispatch('input');
elements['course-notes-open'].click();
assert.equal(elements['course-note-list'].hidden,false,'Notebook list opens');
const noteButton=elements['course-notes-items'].children[0];assert(noteButton,'Saved note appears in notebook list');
noteButton.click();
assert.equal(elements['course-track-card'].hidden,false,'Opening a saved note opens its audio card');
assert.equal(elements['course-track-title'].textContent,'خطبه ۱ — بخش دوم');
assert.equal(elements['course-note-text'].value,'خلاصه و برداشت شخصی من از این صوت');
assert.equal(courseAudio.src,encodeURI(secondTrack.url),'The note opens the exact corresponding original MP3');
console.log('PASS: real course UI flow — welcome/check, plan setup, daily-2 sequencing, 2/3 threshold, mark heard, progress, resume at saved second, private notebook save and reopening its exact audio.');
