/* Owner-authorized optional UX additions, v1.0.8 trial. Does not modify the approved iwan,
   media catalogs or numbered Nahj search. All user history stays on this device. */
(function(){
'use strict';
const KEY='pmm_owner_tools_v108';
const TOPICS=[
 {id:'patience',title:'صبر و شکیبایی',tokens:['صبر','شکیبایی','بردباری']},
 {id:'trust',title:'توکل و امید',tokens:['توکل','امید','اعتماد به خدا']},
 {id:'ethics',title:'اخلاق و رفتار',tokens:['اخلاق','خوش‌رفتاری','نیکی','پرهیزکاری']},
 {id:'justice',title:'عدالت و انصاف',tokens:['عدالت','انصاف','ستم']},
 {id:'family',title:'دوستی و خانواده',tokens:['دوست','برادر','خانواده','فرزند']},
 {id:'knowledge',title:'علم و آگاهی',tokens:['دانش','علم','آموختن','نادانی']}
];
const farsi=n=>String(n).replace(/[0-9]/g,x=>'۰۱۲۳۴۵۶۷۸۹'[Number(x)]);
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data=load();
let priorSection='kafi', interval=null, timer=null, timerEnd=0, activeAudio=null;
function load(){try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch(_){return {}}}
function store(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(_){}}
function bookmarkKey(type,a,b,c){return [type,a,b,c].filter(x=>x!==undefined).join(':')}
function mark(id,title,route,source){
 const marks=data.marks&&typeof data.marks==='object'?data.marks:{};
 if(Object.prototype.hasOwnProperty.call(marks,id)){delete marks[id]}else{
  const keys=Object.keys(marks);if(keys.length>=150)delete marks[keys[0]];
  marks[id]={id,title,route,source,at:Date.now()};
 }
 data.marks=marks;store();
}
function isMarked(id){return Boolean(data.marks?.[id])}
function native(){return window.PMMNative&&typeof window.PMMNative.startAudioDownload==='function'?window.PMMNative:null}
function vetted(url){
 try{
  const parsed=new URL(url);
  return parsed.protocol==='https:'&&parsed.hostname==='dl.kazeminia110.ir'&&
    (/^\/Audio\/kafi\/(?:kafi kotobe arbae|kafi (?:[1-9]|[1-4][0-9]|5[0-4]))\.mp3$/.test(decodeURI(parsed.pathname))||
    /^\/Audio\/nahj-al-balaghe\/tartibi\/(?:khotbe\/khotbe|name\/name|hekmat\/hekmat) [A-Za-z0-9. &]+\.mp3$/.test(decodeURI(parsed.pathname)))&&
    !parsed.search&&!parsed.hash;
 }catch(_){return false}
}
function getAudioState(){
 try{if(typeof window.PMMNative?.getAudioState==='function')return JSON.parse(window.PMMNative.getAudioState())}catch(_){}
 return null;
}
function time(seconds){
 const total=Math.max(0,Math.floor(Number(seconds)||0));
 return farsi(Math.floor(total/60))+':'+farsi(String(total%60).padStart(2,'0'));
}
function toastHelp(message){
 const toastEl=document.getElementById('toast');if(toastEl){toastEl.textContent=message;toastEl.classList.remove('gone');setTimeout(()=>toastEl.classList.add('gone'),3900)}
}
function audioProgress(number){return Number(data.kafiSeconds?.[number]||0)}
function progressSave(number,seconds){if(!data.kafiSeconds)data.kafiSeconds={};data.kafiSeconds[number]=Math.max(0,Math.floor(Number(seconds)||0));store()}
function toolButton(label,action,title=''){
 return '<button type="button" class="pmm-v108-button" data-pmm-tool="'+escapeHTML(action)+'" aria-label="'+escapeHTML(title||label)+'">'+escapeHTML(label)+'</button>';
}
function audioWidget(card,audio,id,title,url,route,number){
 if(!card||!audio||card.querySelector('.pmm-v108-audio-tools'))return;
 const box=document.createElement('div');
 box.className='pmm-v108-audio-tools';
 box.innerHTML='<div class="pmm-v108-mini-heading">ابزارهای شنیدن</div>'+
 '<div class="pmm-v108-toolrow">'+
 toolButton('۱۵ ثانیه عقب','back')+toolButton('۳۰ ثانیه جلو','forward')+
 toolButton('☆ نشانک','bookmark')+
 toolButton('ذخیره صوت','download')+
 toolButton('پخش پس‌زمینه','background')+toolButton('کپی گزارش لینک','report')+'</div>'+
 '<div class="pmm-v108-toolrow">'+
 toolButton('۱۵ دقیقه','sleep15')+toolButton('۳۰ دقیقه','sleep30')+
 toolButton('۶۰ دقیقه','sleep60')+toolButton('لغو تایمر','sleep0')+'</div>'+
 '<output class="pmm-v108-status" aria-live="polite"></output>';
 if(number!==undefined){
  box.querySelector('.pmm-v108-toolrow').insertAdjacentHTML('beforeend',toolButton('جلسه قبل','previous')+toolButton('جلسه بعد','next')+
   toolButton(data.autoplay?'پخش متوالی: روشن':'پخش متوالی: خاموش','autoplay'));
 }
 if(route.kind==='nahj'){
  box.querySelector('.pmm-v108-toolrow').insertAdjacentHTML('beforeend',
   toolButton('بخش قبل','part-previous')+toolButton('بخش بعد','part-next'));
 }
 const status=box.querySelector('.pmm-v108-status');
 card.appendChild(box);
 const bookmark=box.querySelector('[data-pmm-tool="bookmark"]');
 function updateMark(){bookmark.textContent=isMarked(id)?'★ نشان‌شده':'☆ نشانک'}
 updateMark();
 let lastSave=-1;
 if(number!==undefined){
  const saved=audioProgress(number);
  if(saved>0)status.textContent='ادامه از '+time(saved);
  audio.addEventListener('loadedmetadata',()=>{
   if(saved>0&&audio.currentTime<2&&Number.isFinite(audio.duration)&&saved<audio.duration-2)audio.currentTime=saved;
   if(Number.isFinite(audio.duration)&&audio.duration>0){
    if(!data.kafiDurations)data.kafiDurations={};
    data.kafiDurations[number]=Math.round(audio.duration);store();
   }
  });
  audio.addEventListener('timeupdate',()=>{
   const second=Math.floor(audio.currentTime||0);if(Math.abs(second-lastSave)>=4){lastSave=second;progressSave(number,second)}
  });
  audio.addEventListener('pause',()=>progressSave(number,audio.ended?0:audio.currentTime));
  audio.addEventListener('ended',()=>{
   progressSave(number,0);
   if(data.autoplay&&number<DATA.kafi.length){
    const next=number+1;openSavedLesson('kafi',next);
    // Playback requires the user's prior opt-in. Browser autoplay policies may block this.
    setTimeout(()=>contents.querySelector('[data-kafi-toggle]')?.click(),70);
   }
  });
 }
 box.addEventListener('click',event=>{
  const button=event.target.closest('[data-pmm-tool]');if(!button)return;
  const action=button.dataset.pmmTool;
  if(action==='back'||action==='forward'){
   if(!audio.getAttribute('src')){status.textContent='ابتدا صوت را پخش کنید.';return}
   const value=audio.currentTime+(action==='back'?-15:30);
   if(Number.isFinite(value))audio.currentTime=Math.max(0,Math.min(Number.isFinite(audio.duration)?audio.duration:value,value));
  }else if(action==='bookmark'){
   const at=Number.isFinite(audio.currentTime)?Math.floor(audio.currentTime):0;
   mark(id,title+' — '+time(at),{...route,seconds:at},url);updateMark();
  }else if(action==='download'){
   if(!vetted(url)){status.textContent='دانلود فقط برای فایل‌های معتبر سرور اصلی فعال است.';return}
   if(!native()){status.textContent='این قابلیت فقط در نسخه اندرویدی جدید فعال می‌شود.';return}
   try{const details=JSON.parse(native().getAudioDownloadInfo(url));
    if(details?.downloaded){
      if(window.confirm('فایل صوتی دانلودشده حذف شود؟')){native().deleteAudioDownload(url);status.textContent='فایل آفلاین حذف شد.'}
    }else{native().startAudioDownload(url);status.textContent='دریافت آغاز شد؛ تا پایان دانلود، برنامه را باز نگه دارید.'}
   }catch(_){status.textContent='دانلود شروع نشد.'}
  }else if(action==='background'){
   if(!vetted(url)||!window.PMMNative?.playAudioInBackground){status.textContent='پخش پس‌زمینه فقط در برنامه اندرویدی و برای صوت مستقیم فعال است.';return}
   const position=Math.max(0,Math.floor(audio.currentTime||0));
   const rate=Number(audio.playbackRate)||1;
   audio.pause();
   try{window.PMMNative.playAudioInBackground(url,title,position,rate);status.textContent='پخش در پس‌زمینه فعال شد؛ کنترل در اعلان گوشی است.'}
   catch(_){status.textContent='پخش پس‌زمینه برقرار نشد.'}
  }else if(action==='autoplay'){
   data.autoplay=!data.autoplay;store();
   button.textContent=data.autoplay?'پخش متوالی: روشن':'پخش متوالی: خاموش';
   status.textContent=data.autoplay?'جلسه بعد پس از پایان صوت به‌صورت خودکار پیشنهاد می‌شود.':'پخش متوالی خاموش شد.';
  }else if(action==='report'){
   const report='گزارش لینک صوت پای منبر مولا\n'+title+'\n'+url+'\nزمان گزارش: '+new Date().toISOString();
   try{window.PMMNative?.copyAudioReport?.(report)}catch(_){}
   status.textContent=typeof window.PMMNative?.copyAudioReport==='function'?
    'گزارش در کلیپ‌بورد کپی شد؛ آن را برای پشتیبانی ارسال کنید.':'نشانی فایل: '+url;
  }else if(action.startsWith('sleep')){
   const minutes=Number(action.slice(5))||0;
   if(timer)clearTimeout(timer);
   timer=null;timerEnd=0;
   try{window.PMMNative?.setAudioSleepTimer?.(minutes)}catch(_){}
   if(minutes){
    timerEnd=Date.now()+minutes*60000;
    timer=setTimeout(()=>{
     if(activeAudio)activeAudio.pause();
     try{window.PMMNative?.stopAudioInBackground?.()}catch(_){}
     timer=null;timerEnd=0;toastHelp('تایمر خواب؛ پخش متوقف شد.');
    },minutes*60000);
    status.textContent='توقف خودکار بعد از '+farsi(minutes)+' دقیقه';
   }else status.textContent='تایمر خواب لغو شد.';
  }else if(action==='previous'||action==='next'){
   const next=number+(action==='previous'?-1:1);
   if(next>=1&&next<=DATA.kafi.length)openSavedLesson('kafi',next);
  }else if(action==='part-previous'||action==='part-next'){
   if(route.kind!=='nahj')return;
   const next=route.part+(action==='part-previous'?-1:1);
   const cards=Array.from(contents.querySelectorAll('.nahj-part-card'));
   if(next>=0&&next<cards.length){
    audio.pause();
    cards[next].querySelector('[data-nahj-toggle]')?.click();
    cards[next].scrollIntoView({behavior:'smooth',block:'center'});
   }
  }
 });
 audio.addEventListener('play',()=>{
  if(activeAudio&&activeAudio!==audio)activeAudio.pause();
  activeAudio=audio;
 });
}
function decorateAudio(){
 if(screen==='player'&&section==='kafi'&&item?.url){
  const card=contents.querySelector('.kafi-audio-card');
  const audio=card?.querySelector('audio');
  const x=item;
  if(audio&&vetted(x.url)){
   const title=x.title;
   audioWidget(card,audio,bookmarkKey('kafi',x.number),title,x.url,{kind:'kafi',number:x.number},x.number);
   if(!card.querySelector('.pmm-v108-overview'))card.insertAdjacentHTML('afterbegin',
    '<div class="pmm-v108-overview"><strong>این جلسه در یک نگاه</strong><p>عنوان: '+escapeHTML(title)+
    '</p><p>منبع: صوت اصلی دوره شرح اصول کافی. مدت جلسه هنگام بارگذاری صوت مشخص می‌شود. نکات محتوایی بدون متن تأییدشده افزوده نشده‌اند.</p></div>');
  }
 }
 if(screen==='list'&&section==='nahj'&&item?.nahjEntry){
  const group=item.nahjGroup,entry=item.nahjEntry;
  const record=NAHJ_AUDIO_ITEMS[group]?.find(x=>x.id===entry);
  const cards=Array.from(contents.querySelectorAll('.nahj-part-card'));
  cards.forEach((card,i)=>{
   const url=NAHJ_AUDIO_PARTS[entry]?.[i],audio=card.querySelector('audio.nahj-part-media');
   if(url&&audio&&vetted(url))audioWidget(card,audio,bookmarkKey('nahj',group,entry,i),
    record?.title+'، بخش '+farsi(i+1),url,{kind:'nahj',group,entry,part:i});
  });
 }
}
function decorateDurations(){
 if(screen!=='list'||section!=='kafi')return;
 contents.querySelectorAll('.session[data-n]').forEach(button=>{
  const n=Number(button.dataset.n),seconds=Number(data.kafiDurations?.[n]);
  const label=button.querySelector('.session-label');
  if(label&&Number.isFinite(seconds)&&seconds>0&&!label.querySelector('.pmm-v108-duration')){
   const small=document.createElement('small');
   small.className='pmm-v108-duration';
   small.textContent=' — '+time(seconds);
   label.appendChild(small);
  }
 });
}
function ribbon(){
 if(screen!=='list'||!['kafi','towhid','life','nahj'].includes(section))return;
 if(contents.querySelector('.pmm-v108-ribbon'))return;
 const r=document.createElement('div');r.className='pmm-v108-ribbon';
 const entries=[
 ['از کجا شروع کنم؟','guide'],['موضوعات زندگی','topics'],
 ['برگزیده‌های کوتاه','featured'],['نشان‌شده‌ها','bookmarks'],['صوت‌های دریافتی','offline']
 ];
 r.innerHTML=entries.map(([name,feature])=>toolButton(name,'view-'+feature)).join('');
 r.addEventListener('click',e=>{
  const target=e.target.closest('[data-pmm-tool]');if(!target)return;
  priorSection=section;setState('owner-extras',section,{feature:target.dataset.pmmTool.slice(5)});
 });
 contents.prepend(r);
 // Last-opened bookmark for externally hosted lessons, without changing existing row controls.
 if(section==='towhid'||section==='life'){
  const last=PMM_LEARNING_PROGRESS.getLesson(section);
  const record=DATA[section]?.find(x=>x.number===last?.number);
  if(record){
   const id=bookmarkKey('lesson',section,record.number),btn=document.createElement('button');
   btn.type='button';btn.className='pmm-v108-button pmm-v108-lastmark';
   btn.textContent=isMarked(id)?'★ آخرین جلسه نشان‌شده':'☆ نشان کردن آخرین جلسه';
   btn.addEventListener('click',()=>{
    mark(id,sectionNames[section]+' — جلسه '+farsi(record.number),
      {kind:'lesson',section,number:record.number},record.url);
    btn.textContent=isMarked(id)?'★ آخرین جلسه نشان‌شده':'☆ نشان کردن آخرین جلسه';
   });
   r.after(btn);
  }
 }
 if(!data.guideSeen){
  const first=document.createElement('div');first.className='pmm-v108-first';
  first.innerHTML='<span>تازه وارد شده‌اید؟ از دکمه «از کجا شروع کنم؟» راهنمای مسیر درس‌ها را ببینید.</span>'+
    '<button type="button" aria-label="بستن راهنمای اولیه">×</button>';
  first.querySelector('button').addEventListener('click',()=>{data.guideSeen=true;store();first.remove()});
  r.after(first);
 }
}
function line(label,action){return '<button class="pmm-v108-listitem" type="button" data-pmm-open="'+escapeHTML(action)+'">'+escapeHTML(label)+'</button>'}
function wisdomBank(){return Array.isArray(window.PMM_HIKMAT_ALL)?window.PMM_HIKMAT_ALL.filter(x=>x.kind==='hikmat'):[]}
function wisdomEntry(id){return wisdomBank().find(x=>x.id===id)}
function renderExtras(){
 if(screen!=='owner-extras')return;
 const feature=item?.feature||'guide';
 const titles={guide:'از کجا شروع کنم؟',topics:'موضوعات زندگی',featured:'برگزیده‌های کوتاه',bookmarks:'نشان‌شده‌های من',offline:'صوت‌های دریافتی'};
 let html='<div class="pmm-v108-view"><h2>'+escapeHTML(titles[feature]||'راهنمای برنامه')+'</h2>';
 if(feature==='guide'){
  html+='<p>این راهنما فقط به محتوای موجود در برنامه ارجاع می‌دهد؛ ترتیب یادگیری اختیاری است.</p>'+
  line('۱. آشنایی با شرح نهج‌البلاغه','nahj-home')+
  line('۲. توحید کاربردی — از جلسه اول','lesson-towhid-1')+
  line('۳. دیدن خدا در زندگی — از جلسه اول','lesson-life-1')+
  line('۴. کافی شناسی — معرفی دوره','lesson-kafi-1');
 }else if(feature==='topics'){
  html+='<p>نمایه واژگانی بر اساس <strong>عبارات واقعی ترجمه فارسی حکمت‌ها</strong>؛ دسته‌بندی علمی/موضوعی قطعی نیست و به صوت‌ها تعمیم داده نشده است.</p>';
  html+=TOPICS.map(x=>line(x.title,'topic-'+x.id)).join('');
 }else if(feature.startsWith('topic:')){
  const topic=TOPICS.find(x=>x.id===feature.slice(6));
  const items=topic?wisdomBank().filter(x=>topic.tokens.some(token=>x.persian.includes(token))).slice(0,35):[];
  html+='<p>متن حکمت‌های دارای واژه‌های مرتبط؛ برای آگاهی از بافت کامل، متن اصلی را بخوانید.</p>';
  html+=items.map(x=>'<div class="pmm-v108-wisdom"><strong>حکمت '+farsi(x.number)+'</strong><p lang="ar">'+escapeHTML(x.arabic)+'</p><p>'+escapeHTML(x.persian)+'</p>'+
    '<button type="button" data-pmm-mark-wisdom="'+escapeHTML(x.id)+'">'+(isMarked('wisdom:'+x.id)?'★ نشان‌شده':'☆ نشانک')+'</button></div>').join('');
  if(!items.length)html+='<p>در متن فعلی حکمت‌ها عبارتی با این واژه‌ها پیدا نشد.</p>';
 }else if(feature==='featured'){
  const items=wisdomBank().filter(x=>x.arabic.length<155&&x.persian.length<210).slice(0,16);
  html+='<p>منتخبی کوتاه از متن دقیق حکمت‌های موجود؛ هیچ بخشی از متن اصلی کوتاه یا بازنویسی نشده است.</p>'+
  items.map(x=>'<div class="pmm-v108-wisdom"><strong>حکمت '+farsi(x.number)+'</strong><p lang="ar">'+escapeHTML(x.arabic)+'</p><p>'+escapeHTML(x.persian)+'</p>'+
    '<button type="button" data-pmm-mark-wisdom="'+escapeHTML(x.id)+'">'+(isMarked('wisdom:'+x.id)?'★ نشان‌شده':'☆ نشانک')+'</button></div>').join('');
 }else if(feature==='bookmarks'){
  const marks=Object.values(data.marks||{}).sort((a,b)=>b.at-a.at);
  html+='<p>نشانک‌ها فقط روی همین دستگاه ذخیره می‌شوند. پاک‌کردن داده‌های برنامه آن‌ها را حذف می‌کند.</p>'+
   (marks.length?marks.map(x=>line(x.title,'bookmark-'+x.id)).join(''):'<p>هنوز موردی نشان نکرده‌اید؛ هنگام پخش صوت یا مطالعه حکمت، ☆ را لمس کنید.</p>');
 }else if(feature==='offline'){
  html+='<p>دریافت صوت فقط با درخواست شما انجام می‌شود و حجم اولیه نصب را افزایش نمی‌دهد. برای حذف فایل‌ها از دکمه کنار همان صوت استفاده کنید.</p>'+
    line('⟳ به‌روزرسانی وضعیت دریافت‌ها','offline-refresh');
  if(native()){
   let items=[];try{items=JSON.parse(native().getAudioDownloads())||[]}catch(_){}
   html+=(items.length?items.map(x=>line((x.complete?'✅ ':'⬇️ ')+(x.title||x.url.split('/').pop())+(x.complete?'':' — '+farsi(x.percent||0)+'٪'),'offline-'+encodeURIComponent(x.url))).join(''):'<p>هنوز صوتی دریافت نشده است.</p>');
  }else html+='<p>مدیریت دانلود فقط در نسخه اندرویدی در دسترس است.</p>';
 }
 html+='<button type="button" class="pmm-v108-button pmm-v108-return" id="pmm-v108-return">بازگشت به درس‌ها</button></div>';
 contents.innerHTML=html;
 document.getElementById('pmm-v108-return').addEventListener('click',()=>setState('list',priorSection));
 contents.querySelectorAll('[data-pmm-mark-wisdom]').forEach(button=>button.addEventListener('click',()=>{
  const id=button.dataset.pmmMarkWisdom,x=wisdomEntry(id);
  if(!x)return;mark('wisdom:'+id,'حکمت '+farsi(x.number),{kind:'wisdom',id});
  button.textContent=isMarked('wisdom:'+id)?'★ نشان‌شده':'☆ نشانک';
 }));
 contents.querySelectorAll('[data-pmm-open]').forEach(button=>button.addEventListener('click',()=>{
  const action=button.dataset.pmmOpen;
  if(action==='nahj-home'){setState('list','nahj');return}
  if(action.startsWith('lesson-')){
   const parts=action.split('-');openSavedLesson(parts[1],Number(parts[2]));return;
  }
  if(action.startsWith('topic-')){setState('owner-extras',null,{feature:'topic:'+action.slice(6)});return}
  if(action.startsWith('bookmark-')){
   const b=data.marks?.[action.slice(9)];
   if(!b)return;
   if(b.route.kind==='kafi'){
    if(!data.kafiSeconds)data.kafiSeconds={};
    data.kafiSeconds[b.route.number]=Math.max(0,Math.floor(b.route.seconds||0));store();
    openSavedLesson('kafi',b.route.number);return;
   }
   if(b.route.kind==='nahj'){
    PMM_LEARNING_PROGRESS.setNahj(b.route.group,b.route.entry,b.route.part,b.route.seconds||0,false);
    setState('list','nahj',{nahjGroup:b.route.group,nahjEntry:b.route.entry});return;
   }
   if(b.route.kind==='lesson'){openSavedLesson(b.route.section,b.route.number);return;}
   if(b.route.kind==='wisdom'){
    const x=wisdomEntry(b.route.id);if(x){
     contents.innerHTML='<div class="pmm-v108-view"><h2>حکمت '+farsi(x.number)+'</h2><p lang="ar">'+escapeHTML(x.arabic)+'</p><p>'+escapeHTML(x.persian)+'</p>'+toolButton('بازگشت به نشانک‌ها','return-marks')+'</div>';
     contents.querySelector('[data-pmm-tool="return-marks"]').addEventListener('click',()=>setState('owner-extras',null,{feature:'bookmarks'}));
    }return;
   }
  }
  if(action==='offline-refresh'){setState('owner-extras',null,{feature:'offline'});return;}
  if(action.startsWith('offline-')){
   const url=decodeURIComponent(action.slice(8));
   if(window.PMMNative?.playAudioInBackground)window.PMMNative.playAudioInBackground(url,'صوت دریافتی',0,1);
  }
 }));
}
function wisdomBookmark(){
 const host=document.querySelector('#wisdom-result .wisdom-heading-actions');
 if(!host||host.querySelector('#pmm-v108-wisdom-mark'))return;
 const b=document.createElement('button');
 b.type='button';b.id='pmm-v108-wisdom-mark';b.className='wisdom-utility-button';
 b.setAttribute('aria-label','نشان کردن این حکمت');b.textContent='☆';
 b.addEventListener('click',()=>{
  const id=PMM_LEARNING_PROGRESS.getWisdom();const x=wisdomEntry(id);if(!x)return;
  mark('wisdom:'+id,'حکمت '+farsi(x.number),{kind:'wisdom',id});
  b.textContent=isMarked('wisdom:'+id)?'★':'☆';
 });
 host.appendChild(b);
 const quiet=document.createElement('button');
 quiet.type='button';quiet.id='pmm-v108-quiet';quiet.className='wisdom-utility-button';
 quiet.setAttribute('aria-label','حالت مطالعه آرام');
 quiet.textContent='☾';
 quiet.setAttribute('aria-pressed',String(Boolean(data.quiet)));
 const scroll=document.getElementById('wisdom-scroll');
 scroll?.classList.toggle('pmm-v108-quiet',Boolean(data.quiet));
 quiet.addEventListener('click',()=>{
  data.quiet=!data.quiet;store();
  scroll?.classList.toggle('pmm-v108-quiet',Boolean(data.quiet));
  quiet.setAttribute('aria-pressed',String(Boolean(data.quiet)));
 });
 host.appendChild(quiet);
 window.addEventListener('pmm:app-foreground',()=>{const id=PMM_LEARNING_PROGRESS.getWisdom();b.textContent=isMarked('wisdom:'+id)?'★':'☆'});
}
function miniPlayer(){
 let box=document.getElementById('pmm-v108-mini');
 if(!box){
  box=document.createElement('div');box.id='pmm-v108-mini';box.className='pmm-v108-mini';box.hidden=true;
  box.innerHTML='<span id="pmm-v108-mini-label">صوت پس‌زمینه</span>'+
   '<button type="button" data-mini="pause" aria-label="مکث یا ادامه صوت">⏯</button>'+
   '<button type="button" data-mini="stop" aria-label="توقف صوت پس‌زمینه">■</button>';
  document.body.appendChild(box);
  box.addEventListener('click',e=>{
   const btn=e.target.closest('[data-mini]');if(!btn)return;
   try{if(btn.dataset.mini==='pause')window.PMMNative?.toggleAudioInBackground?.();
    else window.PMMNative?.stopAudioInBackground?.()}catch(_){}
   refreshMini();
  });
 }
 function refreshMini(){
  const s=getAudioState();
  box.hidden=!s||!s.active;
  if(s?.active)document.getElementById('pmm-v108-mini-label').textContent=s.title+' — '+time(s.position);
 }
 refreshMini();if(interval===null)interval=setInterval(refreshMini,2500);
}
const originalRender=render;
render=function(){
 originalRender();
 if(screen==='owner-extras'){renderExtras();return}
 if(screen==='list'){ribbon();decorateDurations();}
 decorateAudio();
};
const originalGoBack=goBack;
goBack=function(){if(screen==='owner-extras'){setState('list',priorSection);return}return originalGoBack()};
wisdomBookmark();
miniPlayer();
if(screen==='list')ribbon();
window.PMM_V108_TOOLS=Object.freeze({topics:TOPICS.map(x=>x.id),getMarks:()=>Object.keys(data.marks||{}),vettedURL:vetted});
})();
