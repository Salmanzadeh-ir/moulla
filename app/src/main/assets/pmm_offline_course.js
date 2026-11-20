/* Owner-approved v111: daily/weekly Nahj course, exact resume, 2/3 completion and private notes. */
(function(){
'use strict';
const logic=window.PMM_OFFLINE_COURSE_LOGIC;
if(!logic)return;
const $=id=>document.getElementById(id);
const course=$('offline-course-scroll');
if(!course)return;
const KEY='pmm_offline_nahj_course_v111';
const tracks=logic.buildTracks(window.PMM_NAHJ_AUDIO_DATA);
const trackById=new Map(tracks.map((track,index)=>[track.id,{track,index}]));
const audio=$('course-audio');
const nativeAudio=window.PMM_GLOBAL_AUDIO;
const courseStream=window.PMM_STREAM_HELPER.attach(audio,$('course-audio-status'));
function usingNativeAudio(){
 return !!(nativeAudio?.available?.()&&activeTrack&&nativeAudio.approved(activeTrack.url));
}
const mainScroll=$('main-scroll'),wisdomScroll=$('wisdom-scroll'),galleryScroll=$('gallery-scroll');
const scene=$('scene'),backTop=$('back-top'),exit=$('exit'),about=$('about'),floor=$('wisdom-floor-cover');
const weekdays=[
 {value:6,label:'شنبه'},{value:0,label:'یکشنبه'},{value:1,label:'دوشنبه'},
 {value:2,label:'سه‌شنبه'},{value:3,label:'چهارشنبه'},{value:4,label:'پنجشنبه'},{value:5,label:'جمعه'}
];
const SPEEDS=[0.75,1,1.25,1.5,2];
const SPEED_KEY='pmm_nahj_audio_speed_v1';
let speed=1;
try{const saved=Number(localStorage.getItem(SPEED_KEY));if(SPEEDS.includes(saved))speed=saved}catch(_){}
// The validator MUST be initialized before loadState() reads any existing saved plan.
const COURSE_REMINDER_TIME=/^(?:00:00|(?:0[5-9]|1[0-9]|2[0-3]):[0-5][0-9])$/;
let state=loadState(),courseOpen=false,draftMode='daily1',draftWeekday=null;
function validCourseReminderTime(value){return typeof value==='string'&&COURSE_REMINDER_TIME.test(value)}
function syncNativeCourseReminder(){
 const bridge=window.PMMNative;
 if(!bridge||typeof bridge.setCourseReminderSchedule!=='function')return;
 if(state.completedCount>=tracks.length||!state.accepted||!state.plan){
  try{bridge.clearCourseReminderSchedule?.()}catch(_){}
  return;
 }
 if(validCourseReminderTime(state.plan.reminderTime)){
  try{bridge.setCourseReminderSchedule(state.plan.mode,state.plan.weekday??-1,state.plan.reminderTime)}catch(_){}
 }
}

let activeTrack=null,activeTrackIndex=-1,activeTrackId='',activeIsRevisit=false,lastObservedTime=null,lastObservedWall=null,lastPersistedAt=0,switchingTrack=false;
let pendingRestoreId='',restorePosition=0;
function blankState(){return {accepted:false,plan:null,completedCount:0,extras:{},positions:{},notes:{},pendingAdvance:false}}
function loadState(){
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return blankState();
  const value=blankState();
  value.accepted=raw.accepted===true;
  if(raw.plan&&['daily1','daily2','weekly'].includes(raw.plan.mode)&&logic.parseDateKey(raw.plan.startDate)){
   value.plan={mode:raw.plan.mode,startDate:raw.plan.startDate,
    weekday:Number.isInteger(raw.plan.weekday)&&raw.plan.weekday>=0&&raw.plan.weekday<=6?raw.plan.weekday:null,
    baseCompleted:Number.isInteger(raw.plan.baseCompleted)&&raw.plan.baseCompleted>=0?raw.plan.baseCompleted:0,
    reminderTime:validCourseReminderTime(raw.plan.reminderTime)?raw.plan.reminderTime:null};
  }
  value.completedCount=Math.max(0,Math.min(tracks.length,Number.isInteger(raw.completedCount)?raw.completedCount:0));
  value.extras=raw.extras&&typeof raw.extras==='object'&&!Array.isArray(raw.extras)?raw.extras:{};
  value.positions=raw.positions&&typeof raw.positions==='object'&&!Array.isArray(raw.positions)?raw.positions:{};
  value.notes=raw.notes&&typeof raw.notes==='object'&&!Array.isArray(raw.notes)?raw.notes:{};
  value.pendingAdvance=raw.pendingAdvance===true;
  return value;
 }catch(_){return blankState()}
}
function saveState(){
 try{localStorage.setItem(KEY,JSON.stringify(state));return true}
 catch(_){showToast('ذخیره اطلاعات در حافظه گوشی ممکن نشد. فضای ذخیره‌سازی را بررسی کنید.');return false}
}
function todayKey(){return logic.dateKey(new Date())}
function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showToast(message){
 const target=$('new-toast')||$('toast');if(!target)return;
 target.textContent=message;target.hidden=false;
 clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>target.hidden=true,3600);
}
function updateCourseScrollbar(){
 const thumb=$('scroll-thumb');if(!thumb)return;
 const max=Math.max(0,course.scrollHeight-course.clientHeight),fraction=max?course.scrollTop/max:0;
 const ratio=Math.max(.15,Math.min(.96,course.clientHeight/Math.max(course.clientHeight,course.scrollHeight)));
 const height=Math.max(16,Math.min(88,ratio*90));
 thumb.style.height=height+'%';thumb.style.top=(5+fraction*(90-height))+'%';
}
function enterScene(){
 if(typeof resetHomeMenu==='function')resetHomeMenu(false);
 mainScroll.hidden=true;wisdomScroll.hidden=true;if(galleryScroll)galleryScroll.hidden=true;
 course.hidden=false;exit.hidden=true;exit.disabled=true;about.hidden=true;
 backTop.hidden=false;backTop.disabled=false;backTop.style.pointerEvents='auto';
 backTop.setAttribute('aria-label','بازگشت به صفحه اصلی');
 floor.hidden=false;
 // Course welcome does not depend on checking the acceptance box for Back.
 // In particular, never leave the root-home Exit artwork behind the Back.
 scene.dataset.navMode='inner';
 if(typeof showSceneArtwork==='function')showSceneArtwork(false);
 scene.dataset.screen='offline-course';course.scrollTop=0;
 requestAnimationFrame(updateCourseScrollbar);
}
function leaveCourse(){
 if(!courseOpen)return;
 savePlayback(true);audio.pause();courseOpen=false;activeTrack=null;activeTrackIndex=-1;activeIsRevisit=false;activeTrackId='';
 audio.removeAttribute('src');audio.load(); // Abort buffering when leaving the course.
 course.hidden=true;
 exit.disabled=false;
 if(window.PMM_NEW_UI&&typeof window.PMM_NEW_UI.showHome==='function')window.PMM_NEW_UI.showHome();
 else{
  mainScroll.hidden=false;exit.hidden=false;about.hidden=false;backTop.hidden=true;floor.hidden=true;scene.dataset.screen='home';
 }
}
function openCourse(){
 if(courseOpen)return;
 courseOpen=true;enterScene();
 if(!logic||tracks.length!==1019){showPanel('welcome');$('course-welcome-error').hidden=false;return;}
 if(!state.accepted){showPanel('welcome');return;}
 if(!state.plan){renderSetup();return;}
 if(state.pendingAdvance){state.pendingAdvance=false;saveState();}
 renderDashboard();
}
function showPanel(name){
 $('course-welcome').hidden=name!=='welcome';
 $('course-setup').hidden=name!=='setup';
 $('course-dashboard').hidden=name!=='dashboard';
 $('course-note-list').hidden=name!=='notes';
 course.scrollTop=0;requestAnimationFrame(updateCourseScrollbar);
}
$('course-accept-check').addEventListener('change',event=>{
 if(!event.target.checked)return;
 state.accepted=true;saveState();renderSetup();
});
function renderSetup(){
 draftMode=state.plan?.mode||'daily1';
 draftWeekday=state.plan?.weekday??null;
 $('course-reminder-time').value=validCourseReminderTime(state.plan?.reminderTime)?state.plan.reminderTime:'09:00';
 window.PMM_SHRINE_CLOCK?.sync();
 document.querySelectorAll('[data-course-plan]').forEach(button=>{
  const selected=button.dataset.coursePlan===draftMode;
  button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));
 });
 $('course-weekdays').hidden=draftMode!=='weekly';
 document.querySelectorAll('[data-course-weekday]').forEach(button=>{
  const selected=Number(button.dataset.courseWeekday)===draftWeekday;
  button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));
 });
 $('course-setup-back').hidden=!state.plan;
 showPanel('setup');
}
document.querySelectorAll('[data-course-plan]').forEach(button=>button.addEventListener('click',()=>{
 draftMode=button.dataset.coursePlan;
 document.querySelectorAll('[data-course-plan]').forEach(other=>{
  const selected=other===button;other.classList.toggle('is-selected',selected);other.setAttribute('aria-pressed',String(selected));
 });
 $('course-weekdays').hidden=draftMode!=='weekly';
}));
document.querySelectorAll('[data-course-weekday]').forEach(button=>button.addEventListener('click',()=>{
 draftWeekday=Number(button.dataset.courseWeekday);
 document.querySelectorAll('[data-course-weekday]').forEach(other=>{
  const selected=other===button;other.classList.toggle('is-selected',selected);other.setAttribute('aria-pressed',String(selected));
 });
}));
$('course-save-plan').addEventListener('click',()=>{
 if(draftMode==='weekly'&&!Number.isInteger(draftWeekday)){showToast('لطفاً روز هفتگی خود را انتخاب کنید.');return;}
 const time=$('course-reminder-time').value;
 if(!validCourseReminderTime(time)){
  showToast('ساعت یادآوری باید از ۵ صبح تا ۱۲ شب باشد. فقط ۰۰:۰۰ برای نیمه‌شب مجاز است.');
  $('course-reminder-time').focus();return;
 }
 const priorPlan=state.plan,priorExtras=state.extras,priorAdvance=state.pendingAdvance;
 state.plan={mode:draftMode,weekday:draftMode==='weekly'?draftWeekday:null,
  startDate:todayKey(),baseCompleted:state.completedCount,reminderTime:time};
 state.extras={};state.pendingAdvance=false;
 if(!saveState()){
  state.plan=priorPlan;state.extras=priorExtras;state.pendingAdvance=priorAdvance;
  return;
 }
 syncNativeCourseReminder();
 // On older Android there is no OS-level POST_NOTIFICATIONS runtime dialog.
 // The native bridge uses an explicit app consent dialog on these devices.
 try{
  if(window.PMMNative&&typeof window.PMMNative.getReminderSettings==='function'){
   const status=JSON.parse(window.PMMNative.getReminderSettings());
   if((!status.consent||!status.allowed)&&typeof window.PMMNative.askReminderPermission==='function')
    window.PMMNative.askReminderPermission();
  }
 }catch(_){}
 renderDashboard();
});
$('course-setup-back').addEventListener('click',()=>{if(state.plan)renderDashboard()});
$('course-settings-open').addEventListener('click',()=>{savePlayback(true);audio.pause();renderSetup()});
function planLabel(plan){
 if(!plan)return '';
 if(plan.mode==='daily1')return 'روزی یک صوت';
 if(plan.mode==='daily2')return 'روزی دو صوت';
 return 'هفته‌ای یک صوت؛ '+(weekdays.find(x=>x.value===plan.weekday)?.label||'روز انتخابی');
}
function persianDate(key){
 const date=logic.parseDateKey(key);if(!date)return key;
 try{return date.toLocaleDateString('fa-IR',{weekday:'long',day:'numeric',month:'long'})}catch(_){return key}
}
function getPosition(trackId){
 const value=state.positions[trackId];
 if(!value||typeof value!=='object')return {position:0,listened:0,duration:0};
 return {position:Number.isFinite(value.position)?Math.max(0,value.position):0,
  listened:Number.isFinite(value.listened)?Math.max(0,value.listened):0,
  duration:Number.isFinite(value.duration)?Math.max(0,value.duration):0};
}
function setPosition(trackId,patch){
 const old=getPosition(trackId);state.positions[trackId]={...old,...patch};
}
function formatTime(seconds){
 if(!Number.isFinite(seconds)||seconds<0)return '۰۰:۰۰';
 const whole=Math.floor(seconds),minutes=Math.floor(whole/60),secs=whole%60;
 return logic.fa(minutes)+':'+logic.fa(String(secs).padStart(2,'0'));
}
function formatTrack(track){return track.groupLabel+' · '+track.displayTitle}
function updateProgress(){
 const value=logic.progress(state.completedCount,tracks.length);
 $('course-progress-fill').style.width=value.percent+'%';
 $('course-progress-count').textContent='شنیده‌شده: '+logic.fa(value.completed)+' از '+logic.fa(value.total)+' صوت';
 $('course-progress-percent').textContent=logic.fa(value.percent.toFixed(1))+'٪';
}
function pauseOtherPlayers(){
 document.querySelectorAll('audio').forEach(other=>{if(other!==audio){try{other.pause()}catch(_){}}});
 try{if(typeof pmmStopKafiAudio==='function')pmmStopKafiAudio()}catch(_){}
 try{if(typeof stopNahjInlineAudio==='function')stopNahjInlineAudio()}catch(_){}
 try{if(typeof audioPlayer!=='undefined'&&audioPlayer!==audio)audioPlayer.pause()}catch(_){}
}
function renderDashboard(){
 showPanel('dashboard');updateProgress();
 $('course-note-list').hidden=true;
 if(state.pendingAdvance&&!activeIsRevisit){
  $('course-track-card').hidden=true;$('course-no-due').hidden=true;$('course-complete').hidden=true;$('course-after-mark').hidden=false;
  $('course-after-mark-text').textContent='این صوت در دفتر همراهی شما ثبت شد. با خروج و ورود دوباره، صوت بعدی برنامه نمایش داده می‌شود.';
  return;
 }
 $('course-after-mark').hidden=true;
 if(activeIsRevisit&&activeTrack){
  $('course-complete').hidden=true;$('course-no-due').hidden=true;$('course-track-card').hidden=false;showTrack(activeTrack,activeTrackIndex,true);return;
 }
 if(state.completedCount>=tracks.length){
  $('course-track-card').hidden=true;$('course-no-due').hidden=true;$('course-complete').hidden=false;return;
 }
 $('course-complete').hidden=true;
 const entitlement=Math.min(tracks.length,logic.entitlement(state,todayKey()));
 if(state.completedCount<entitlement){
  const nextIndex=state.completedCount,nextTrack=tracks[nextIndex];activeIsRevisit=false;
  $('course-no-due').hidden=true;$('course-track-card').hidden=false;showTrack(nextTrack,nextIndex,false);return;
 }
 savePlayback(true);audio.pause();activeTrack=null;activeTrackIndex=-1;activeTrackId='';$('course-track-card').hidden=true;$('course-no-due').hidden=false;
 const next=logic.nextEligibleDate(state.plan,todayKey());
 $('course-next-date').textContent=next?persianDate(next):'نوبت بعدی';
 $('course-no-due-text').textContent=state.plan.mode==='weekly'?
  (state.plan.weekday!==new Date().getDay()?'امروز روز انتخابی شما نیست. در روز تعیین‌شده، صوت بعدی آماده خواهد بود.':'نوبت این هفته را انجام داده‌اید؛ در روز انتخابی هفته آینده، صوت بعدی آماده می‌شود.'):
  'سهم امروز را شنیده‌اید. صوت بعدی در نوبت فردا آماده می‌شود.';
}
function showTrack(track,index,isRevisit){
 if(!track)return;
 const changed=activeTrackId!==track.id;
 if(changed){
  savePlayback(true);switchingTrack=true;audio.pause();switchingTrack=false;
 }
 activeTrack=track;activeTrackIndex=index;activeIsRevisit=isRevisit;activeTrackId=track.id;
 $('course-track-group').textContent=track.groupLabel;
 $('course-track-title').textContent=track.displayTitle;
 $('course-track-sequence').textContent='صوت '+logic.fa(index+1)+' از '+logic.fa(tracks.length);
 $('course-revisit-back').hidden=!isRevisit;
 $('course-heard').hidden=isRevisit;
 $('course-heard').disabled=true;
 $('course-threshold').hidden=isRevisit;
 const note=state.notes[track.id];$('course-note-text').value=note&&typeof note.text==='string'?note.text:'';
 $('course-notebook').hidden=true;$('course-note-toggle').setAttribute('aria-expanded','false');
 $('course-note-status').textContent=note&&note.text?'یادداشت ذخیره‌شده شما روی همین گوشی':'یادداشت این صوت را اینجا بنویسید.';
 if(changed){
  lastObservedTime=null;pendingRestoreId=track.id;
  const saved=getPosition(track.id);restorePosition=saved.position;
  audio.removeAttribute('src');audio.load(); // no URL or network until Play
  $('course-audio-status').textContent='برای شروع، دکمه پخش را لمس کنید.';
  $('course-audio-toggle').innerHTML=playIcon();$('course-audio-toggle').setAttribute('aria-label','پخش '+track.displayTitle);
  $('course-seek').value='0';$('course-current-time').textContent=formatTime(saved.position);
  $('course-duration-time').textContent=saved.duration?formatTime(saved.duration):'--:--';
  $('course-listened-status').textContent='';
 }else{
  updateAudioUI();
 }
 updateHeardButton();
}
function playIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5a1 1 0 0 1 1.53-.85l10 6.5a1 1 0 0 1 0 1.7l-10 6.5A1 1 0 0 1 8 18.5z" fill="currentColor"/></svg>'}
function pauseIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.5" width="4.5" height="15" rx="1" fill="currentColor"/><rect x="13.5" y="4.5" width="4.5" height="15" rx="1" fill="currentColor"/></svg>'}
function updateAudioUI(){
 if(!activeTrack)return;
 const native=usingNativeAudio()?syncNativePlayback():null;
 const playing=native?!!(native.active&&native.playing):!audio.paused;
 $('course-audio-toggle').innerHTML=playing?pauseIcon():playIcon();
 $('course-audio-toggle').setAttribute('aria-label',(playing?'توقف':'پخش')+' '+activeTrack.displayTitle);
 const stored=getPosition(activeTrack.id);
 const duration=native?(Number(native.duration)||stored.duration):
    Number.isFinite(audio.duration)?audio.duration:stored.duration;
 const current=native?(native.active?Number(native.position)||0:stored.position):
    Number.isFinite(audio.currentTime)?audio.currentTime:stored.position;
 $('course-current-time').textContent=formatTime(current);
 $('course-duration-time').textContent=duration>0?formatTime(duration):'--:--';
 $('course-seek').disabled=!(duration>0);$('course-seek').value=duration>0?String(Math.min(100,current/duration*100)):'0';
 const pos=getPosition(activeTrack.id),ratio=duration>0?Math.min(1,pos.listened/duration):0;
 $('course-listened-status').textContent=duration>0?'میزان شنیدن شما: '+logic.fa(Math.floor(ratio*100))+'٪':'پس از بارگذاری صوت، میزان شنیدن ثبت می‌شود.';
 updateHeardButton();
}
function updateHeardButton(){
 const button=$('course-heard'),mini=$('course-mini-heard');if(!activeTrack||activeIsRevisit){button.disabled=true;mini.disabled=true;return;}
 const pos=getPosition(activeTrack.id);
 const native=usingNativeAudio()?nativeAudio.status(activeTrack.url):null;
 const duration=native&&native.duration>0?Number(native.duration):pos.duration;
 button.disabled=!logic.canMarkHeard(pos.listened,duration);mini.disabled=button.disabled;
}
function syncNativePlayback(){
 if(!usingNativeAudio())return null;
 const snapshot=nativeAudio.status(activeTrack.url);
 if(!snapshot.valid)return null;
 const before=getPosition(activeTrack.id);
 const duration=Math.max(before.duration,Number(snapshot.duration)||0);
 // The service counts ACTUAL playing wall time, even when the user leaves
 // this page/the app. Seeking does not increase its listened counter.
 const listened=Math.max(before.listened,Math.max(0,Number(snapshot.listened)||0));
 const position=snapshot.active?Math.max(0,Number(snapshot.position)||0):
   snapshot.finished?0:
   Number(snapshot.saved)>0?Math.max(0,Number(snapshot.saved)):before.position;
 if(Math.abs(before.position-position)>.2||
    Math.abs(before.duration-duration)>.2||
    Math.abs(before.listened-listened)>.2){
   setPosition(activeTrack.id,{position,duration,listened});
   if(Date.now()-lastPersistedAt>1600){
     saveState();lastPersistedAt=Date.now();
   }
 }
 return snapshot;
}
function persistPosition(){
 if(!activeTrack)return;
 if(usingNativeAudio()){
   syncNativePlayback();saveState();return;
 }
 const old=getPosition(activeTrack.id);
 setPosition(activeTrack.id,{
  position:Number.isFinite(audio.currentTime)?Math.max(0,Math.round(audio.currentTime*1000)/1000):old.position,
  duration:Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:old.duration
 });
 saveState();
}
function savePlayback(force){
 if(!activeTrack)return;
 persistPosition();lastObservedTime=null;lastObservedWall=null;lastPersistedAt=Date.now();
}
audio.addEventListener('loadedmetadata',()=>{
 if(!activeTrack||pendingRestoreId!==activeTrack.id)return;
 const saved=getPosition(activeTrack.id);
 if(restorePosition>0&&Number.isFinite(audio.duration)&&audio.duration>0){
  try{audio.currentTime=Math.min(restorePosition,Math.max(0,audio.duration-0.25))}catch(_){}
 }
 pendingRestoreId='';restorePosition=0;lastObservedTime=audio.currentTime;lastObservedWall=Date.now();
 setPosition(activeTrack.id,{position:audio.currentTime,duration:audio.duration,listened:saved.listened});
 saveState();updateAudioUI();
});
audio.addEventListener('play',()=>{pauseOtherPlayers();lastObservedTime=audio.currentTime;lastObservedWall=Date.now();updateAudioUI();$('course-audio-status').textContent='در حال پخش';});
audio.addEventListener('pause',()=>{if(switchingTrack)return;savePlayback(true);updateAudioUI();if(activeTrack)$('course-audio-status').textContent='پخش متوقف شد؛ زمان شنیدن ذخیره شد.';});
audio.addEventListener('timeupdate',()=>{
 if(!activeTrack)return;
 const now=audio.currentTime;
 const wall=Date.now();
 if(!audio.paused&&lastObservedTime!==null){
  const delta=now-lastObservedTime;
  const elapsed=lastObservedWall===null?0:Math.max(0,(wall-lastObservedWall)/1000);
  const allowed=Math.max(4,(elapsed+1.5)*Math.max(.75,Number(audio.playbackRate)||1));
  if(delta>0&&delta<=allowed){const old=getPosition(activeTrack.id);setPosition(activeTrack.id,{listened:Math.min(Number.isFinite(audio.duration)?audio.duration:86400,old.listened+delta)});}
 }
 lastObservedTime=now;lastObservedWall=wall;
 if(Date.now()-lastPersistedAt>=1800){persistPosition();lastPersistedAt=Date.now();}
 updateAudioUI();
});
audio.addEventListener('seeking',()=>{lastObservedTime=null;lastObservedWall=null});
audio.addEventListener('seeked',()=>{lastObservedTime=audio.currentTime;lastObservedWall=Date.now();persistPosition();updateAudioUI()});
audio.addEventListener('durationchange',()=>{if(activeTrack&&Number.isFinite(audio.duration)&&audio.duration>0){setPosition(activeTrack.id,{duration:audio.duration});saveState();updateAudioUI()}});
audio.addEventListener('ended',()=>{
 if(!activeTrack)return;
 setPosition(activeTrack.id,{position:0,listened:Number.isFinite(audio.duration)?audio.duration:getPosition(activeTrack.id).listened,duration:audio.duration||getPosition(activeTrack.id).duration});
 lastObservedTime=null;saveState();updateAudioUI();$('course-audio-status').textContent='این صوت به پایان رسید؛ پس از شنیدن دو سوم، می‌توانید آن را ثبت کنید.';
});
audio.addEventListener('error',()=>{updateAudioUI()});
$('course-audio-toggle').addEventListener('click',()=>{
 if(!activeTrack)return;
 if(usingNativeAudio()){
   const source=activeTrack.url;
   const status=nativeAudio.status(source);
   if(status.active){
     nativeAudio.toggle(source);
   }else{
     pauseOtherPlayers();
     const startingAt=getPosition(activeTrack.id).position;
     // Native bridge starts ONLY in this physical Play click.
     if(!nativeAudio.start(source,formatTrack(activeTrack),speed,startingAt))
       $('course-audio-status').textContent='پخش برقرار نشد؛ اتصال را بررسی کنید.';
   }
   setTimeout(updateAudioUI,350);
   updateAudioUI();
   return;
 }
 if(!audio.paused){audio.pause();return;}
 pauseOtherPlayers();
 if(!audio.getAttribute('src'))audio.src=encodeURI(activeTrack.url);
 audio.playbackRate=speed;
 courseStream.started();
 const request=audio.play();if(request&&typeof request.catch==='function')request.catch(()=>{$('course-audio-status').textContent='پخش شروع نشد؛ اتصال اینترنت را بررسی کنید و دوباره بزنید.';updateAudioUI()});
});
$('course-seek').addEventListener('input',()=>{
 if(usingNativeAudio()){
   const status=nativeAudio.status(activeTrack.url);
   const total=Number(status.duration)||getPosition(activeTrack.id).duration;
   if(status.active&&total>0){
     const point=Math.min(Math.max(0,total-1),total*Number($('course-seek').value)/100);
     nativeAudio.seek(activeTrack.url,Math.floor(point));
     setPosition(activeTrack.id,{position:point});saveState();
     updateAudioUI();
   }
   return;
 }
 if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=audio.duration*Number($('course-seek').value)/100;lastObservedTime=audio.currentTime;persistPosition();updateAudioUI()}
});
document.querySelectorAll('[data-course-speed]').forEach(button=>{
 const value=Number(button.dataset.courseSpeed);
 const selected=value===speed;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));
 button.addEventListener('click',()=>{
  if(!SPEEDS.includes(value))return;speed=value;audio.playbackRate=value;
  if(usingNativeAudio())nativeAudio.speed(activeTrack.url,value);
  try{localStorage.setItem(SPEED_KEY,String(value));if(typeof nahjAudioSpeed!=='undefined')nahjAudioSpeed=value}catch(_){}
  document.querySelectorAll('[data-course-speed]').forEach(other=>{const active=Number(other.dataset.courseSpeed)===speed;other.classList.toggle('is-selected',active);other.setAttribute('aria-pressed',String(active))});
  $('course-speed-toggle').setAttribute('aria-label','انتخاب سرعت پخش، سرعت فعلی '+String(value).replace('.', '٫').replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)])+' برابر');$('course-speed-options').hidden=true;$('course-speed-toggle').setAttribute('aria-expanded','false');
 });
});
const miniHeard=$('course-mini-heard'),realHeard=$('course-heard');
miniHeard.disabled=realHeard.disabled;
$('course-speed-toggle').setAttribute('aria-label','انتخاب سرعت پخش، سرعت فعلی '+String(speed).replace('.', '٫').replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)])+' برابر');
$('course-mini-heard').addEventListener('click',()=>$('course-heard').click());
$('course-mini-settings').addEventListener('click',()=>$('course-settings-open').click());
$('course-note-toggle').addEventListener('click',()=>{const panel=$('course-notebook');panel.hidden=!panel.hidden;$('course-note-toggle').setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)$('course-note-text').focus();});
$('course-note-close').addEventListener('click',()=>{$('course-notebook').hidden=true;$('course-note-toggle').setAttribute('aria-expanded','false');$('course-note-toggle').focus();});
$('course-speed-toggle').addEventListener('click',()=>{const panel=$('course-speed-options');panel.hidden=!panel.hidden;$('course-speed-toggle').setAttribute('aria-expanded',String(!panel.hidden));});
$('course-heard').addEventListener('click',()=>{
 if(!activeTrack||activeIsRevisit)return;
 const pos=getPosition(activeTrack.id),duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:pos.duration;
 if(!logic.canMarkHeard(pos.listened,duration)){showToast('برای ثبت شنیدن، باید دست‌کم دو سوم صوت را واقعاً گوش کنید.');return;}
 if(usingNativeAudio()){
   const native=nativeAudio.status(activeTrack.url);
   if(native.active&&native.playing)nativeAudio.toggle(activeTrack.url);
 }
 audio.pause();setPosition(activeTrack.id,{position:0});
 state.completedCount=Math.min(tracks.length,state.completedCount+1);state.pendingAdvance=true;saveState();
 if(state.completedCount>=tracks.length)syncNativeCourseReminder();
 activeTrack=null;activeTrackIndex=-1;activeIsRevisit=false;activeTrackId='';
 renderDashboard();
});
$('course-extra').addEventListener('click',()=>{
 if(state.completedCount>=tracks.length)return;
 const key=todayKey();state.extras[key]=Math.max(0,Number(state.extras[key])||0)+1;
 saveState();state.pendingAdvance=false;activeIsRevisit=false;renderDashboard();
});
$('course-notes-open').addEventListener('click',()=>{
 savePlayback(true);audio.pause();
 // Opening the saved list must also close the small icon's editor overlay.
 $('course-notebook').hidden=true;$('course-note-toggle').setAttribute('aria-expanded','false');
 renderNotes();showPanel('notes');
});
$('course-notes-back').addEventListener('click',()=>renderDashboard());
$('course-revisit-back').addEventListener('click',()=>{savePlayback(true);audio.pause();activeIsRevisit=false;activeTrack=null;activeTrackIndex=-1;activeTrackId='';renderDashboard()});
function saveNote(allowDelete=true){
 if(!activeTrack)return;
 const id=activeTrack.id,text=$('course-note-text').value.slice(0,12000);
 if(!text.trim()&&!allowDelete){
  $('course-note-status').textContent='برای حذف یادداشت قبلی، متن را خالی کرده و «ذخیره یادداشت» را لمس کنید.';
  return;
 }
 const prior=state.notes[id];
 if(text.trim())state.notes[id]={text,updatedAt:Date.now()};
 else delete state.notes[id];
 if(!saveState()){
  // Do not claim a note was saved if local storage is full or denied.
  if(prior)state.notes[id]=prior;else delete state.notes[id];
  $('course-note-status').textContent='ذخیره انجام نشد؛ فضای ذخیره‌سازی گوشی را بررسی کنید و دوباره بزنید.';
  return;
 }
 $('course-note-status').textContent=text.trim()
  ?'یادداشت این صوت ذخیره شد و در «فهرست یادداشت‌ها» قابل بازیابی است.'
  :'یادداشت این صوت با درخواست شما حذف شد.';
}
$('course-note-save').addEventListener('click',()=>saveNote(true));
$('course-note-text').addEventListener('input',()=>{
 if(!activeTrack)return;
 saveNote(false);
});
function renderNotes(){
 const entries=Object.entries(state.notes).filter(([id,note])=>trackById.has(id)&&note&&typeof note.text==='string'&&note.text.trim())
  .sort((a,b)=>(Number(b[1].updatedAt)||0)-(Number(a[1].updatedAt)||0));
 const list=$('course-notes-items');
 const heading=$('course-note-list').querySelector('h3');
 if(heading)heading.textContent='یادداشت‌ها ('+logic.fa(entries.length)+')';
 if(!entries.length){list.innerHTML='<div class="course-note-empty">هنوز یادداشتی ذخیره نکرده‌اید. از آیکون کوچک ✎ کنار صوت، اولین یادداشت را بنویسید.</div>';return;}
 list.innerHTML=entries.map(([id,note])=>{
  const found=trackById.get(id);
  const savedAt=Number(note.updatedAt)||Date.now();
  return '<button type="button" class="course-saved-note" data-course-note-id="'+escapeHTML(id)+'" aria-label="بازکردن صوت مرتبط با '+escapeHTML(formatTrack(found.track))+'">'+
   '<strong>صوت مرتبط: '+escapeHTML(formatTrack(found.track))+'</strong>'+
   '<span class="course-saved-note-text">'+escapeHTML(note.text.trim())+'</span>'+
   '<small>ذخیره‌شده در '+escapeHTML(new Date(savedAt).toLocaleDateString('fa-IR'))+'</small>'+
   '<span class="course-note-audio-link">رفتن به همین صوت؛ پخش با لمس Play</span></button>';
 }).join('');
 $('course-notes-items').querySelectorAll('[data-course-note-id]').forEach(button=>button.addEventListener('click',()=>{
  const found=trackById.get(button.dataset.courseNoteId);if(!found)return;
  savePlayback(true);audio.pause();
  activeTrack=null;activeTrackIndex=-1;activeIsRevisit=false;activeTrackId='';
  showPanel('dashboard');updateProgress();
  $('course-after-mark').hidden=true;$('course-no-due').hidden=true;$('course-complete').hidden=true;$('course-track-card').hidden=false;
  showTrack(found.track,found.index,true);
  course.scrollTop=0;requestAnimationFrame(updateCourseScrollbar);
 }));
}
$('course-after-mark-home').addEventListener('click',leaveCourse);
$('course-complete-home').addEventListener('click',leaveCourse);
const courseButton=document.querySelector('[data-open-course]');
if(courseButton)courseButton.addEventListener('click',openCourse);
course.addEventListener('scroll',updateCourseScrollbar,{passive:true});
window.addEventListener('resize',updateCourseScrollbar);
// Poll only locally; no timer ever initiates a network request or starts audio.
setInterval(()=>{
 if(courseOpen&&usingNativeAudio())updateAudioUI();
},950);
window.addEventListener('pagehide',()=>{savePlayback(true)});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')savePlayback(true)});
const previousGoBack=goBack;
function courseBack(){
 // If a visitor declines the initial agreement, the Back icon must
 // always leave immediately without accepting anything or saving consent.
 if(!$('course-welcome').hidden){leaveCourse();return;}
 if(!$('course-notebook').hidden){$('course-notebook').hidden=true;$('course-note-toggle').setAttribute('aria-expanded','false');return;}
 if(!$('course-setup').hidden&&state.plan){renderDashboard();return;}
 if(!$('course-note-list').hidden){renderDashboard();return;}
 leaveCourse();
}
goBack=function(){if(courseOpen){courseBack();return;}return previousGoBack();};
window.PMM_OFFLINE_COURSE=Object.freeze({
 open:openCourse,back:courseBack,
 getStatus:()=>({accepted:state.accepted,plan:state.plan?{...state.plan}:null,
  completed:state.completedCount,total:tracks.length,notes:Object.keys(state.notes).length,
  current:activeTrack?{id:activeTrack.id,title:activeTrack.displayTitle,index:activeTrackIndex}:null}),
 getTrackCount:()=>tracks.length
});
// After app updates/restarts restore the native alarm from the previously user-selected time.
syncNativeCourseReminder();
})();
