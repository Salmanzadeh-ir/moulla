/* Owner-authorized learning experience. No global keyword search, no fabricated course text.
 * Stored locally on the device; original visual Home and approved archives untouched. */
(function(){
'use strict';
const KEY='pmm_learning_extras_v1';
const TYPES=['kafi','nahj','towhid','life','wisdom'];
const TOPICS=[
 ['شکیبایی و آرامش',/صبر|شکیبایی|بردبار|آرامش|تحمل/],
 ['عدالت و حق',/عدالت|دادگر|عدل|حقّ|حقوق|ستم/],
 ['دوستی و خانواده',/دوست|مهربان|خانواده|همسر|فرزند|محبت|مردم/],
 ['دانش و اندیشه',/دانش|آموختن|خرد|عقل|علم|اندیشه/],
 ['اخلاص و پرهیزگاری',/اخلاص|خلوص|پرهیزگار|تقوا|نیت/],
 ['خشم و گفتار',/خشم|غضب|زبان|سخن|گفتار/]
];
const root=document.getElementById('stage'),container=document.getElementById('contents');
const native=()=>window.PMMNative||null;
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(_){return {}}}
function save(change){const s=read();change(s);try{localStorage.setItem(KEY,JSON.stringify(s))}catch(_){}return s}
const faNum=n=>String(n).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const clean=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function bank(){return Array.isArray(window.PMM_HIKMAT_ALL)?window.PMM_HIKMAT_ALL:[]}
function uid(type,id){return type+':'+id}
function savedItems(){const x=read().bookmarks;return Array.isArray(x)?x.filter(v=>v&&TYPES.includes(v.type)&&typeof v.id==='string').slice(0,200):[]}
function hasMark(type,id){return savedItems().some(v=>v.type===type&&v.id===String(id))}
function toggleMark(type,id,title,extra){if(!TYPES.includes(type)||typeof id!=='string'||id.length>110)return false;
 const exists=hasMark(type,id);
 save(s=>{
  const list=Array.isArray(s.bookmarks)?s.bookmarks.filter(v=>v&&TYPES.includes(v.type)):[];
  s.bookmarks=exists?list.filter(v=>!(v.type===type&&v.id===id)):list.concat([{type,id,title:String(title).slice(0,130),extra:extra||null,at:Date.now()}]).slice(-200);
 });
 return !exists;
}
function notes(){const x=read().notes;return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}
function setNote(type,id,value){const key=uid(type,id);save(s=>{if(!s.notes||typeof s.notes!=='object')s.notes={};if(value.trim())s.notes[key]=String(value).slice(0,1800);else delete s.notes[key]})}
function showToast(m){if(typeof toast==='function')toast(m);else alert(m)}
function openHub(page='home',value=''){setState('list','tools',{pmmToolPage:page,value});document.getElementById('pmm-tools-button')?.focus({preventScroll:true})}
function action(text,command,value,klass){return '<button type="button" class="pmm-tool-action '+(klass||'')+'" data-pmm-command="'+clean(command)+'" data-pmm-value="'+clean(value||'')+'">'+clean(text)+'</button>'}
function panelHeader(title,desc){return '<section class="pmm-tool-shell" aria-label="'+clean(title)+'"><h2>'+clean(title)+'</h2>'+(desc?'<p class="pmm-tool-muted">'+clean(desc)+'</p>':'')}
function closePanel(){return '</section>'}
const PAGE_ACTIONS=[
 ['📘 از کجا شروع کنم؟','start','با محتوای موجود آشنا شوید'],
 ['🏷 موضوعات زندگی','topics','حکمت‌های دارای واژه‌های مرتبط'],
 ['✨ برگزیده‌های کوتاه','short','متن‌های کوتاه از بانک معتبر حکمت'],
 ['🔖 نشان‌شده‌های من','saved','حکمت‌ها و صوت‌های مورد علاقه'],
 ['🎧 صوت‌های دریافتی','offline','برای شنیدن بدون اینترنت'],
 ['⏲ زمان‌سنج خواب','sleep','توقف خودکار صوت'],
 ['◐ حالت مطالعه آرام','reading','نمای خواناتر صفحات متنی'],
 ['❔ راهنمای برنامه','help','راهنمای ساده امکانات']
];
function renderToolPage(){
 const page=item?.pmmToolPage||'home',value=item?.value||'';
 if(page==='home'){
  contents.innerHTML=panelHeader('امکانات آموزشی','بدون تغییر در ایوان اصلی برنامه؛ این ابزارها فقط در صفحات داخلی در دسترس‌اند.')+
   '<div class="pmm-tool-grid">'+PAGE_ACTIONS.map(p=>'<button type="button" class="pmm-tool-tile" data-pmm-command="'+p[1]+'"><strong>'+p[0]+'</strong><small>'+p[2]+'</small></button>').join('')+'</div>'+
   '<p class="pmm-tool-muted">جست‌وجوی عمومی و موضوعی طبق درخواست مالک به این نسخه افزوده نشده است. موضوعات زیر فقط پیوند به متن‌های اصلی دارای واژه‌های مربوط هستند.</p>'+closePanel();
 }else if(page==='start'){
  const rows=[
   ['آشنایی با نهج‌البلاغه','گام نخست: ورود به فهرست خطبه‌ها، نامه‌ها و حکمت‌ها؛ سپس شنیدن شرح صوتی مورد انتخاب','nahj'],
   ['خداشناسی در زندگی','گام نخست: فهرست ۱۷ جلسه «دیدن خدا در زندگی»','life'],
   ['شرح اصول کافی','گام نخست: «کافی شناسی»؛ سپس جلسه‌های ۱ تا ۵۴','kafi'],
   ['توحید کاربردی','گام نخست: شروع فهرست ۵۰ جلسه توحید کاربردی','towhid']
  ];
  contents.innerHTML=panelHeader('از کجا شروع کنم؟','این مسیرها صرفاً به درس‌های واقعی و موجود ارجاع می‌دهند؛ توصیه یا خلاصه علمی جدیدی به آن‌ها نسبت داده نشده است.')+
    rows.map(p=>'<div class="pmm-tool-row"><b>'+p[0]+'</b><p>'+p[1]+'</p>'+action('رفتن به درس‌ها','course',p[2])+'</div>').join('')+action('بازگشت به امکانات','home')+closePanel();
 }else if(page==='topics'){
  contents.innerHTML=panelHeader('موضوعات زندگی با کلام مولا','دسته‌بندی خودکار فقط بر اساس حضور واژه در ترجمه فارسی ۴۸۹ حکمت موجود است؛ این فهرست ادعای تفسیر علمی یا ارتباط محتوای صوتی ندارد.')+
   '<div class="pmm-tool-grid">'+TOPICS.map((t,i)=>{
    const count=bank().filter(x=>typeof x.persian==='string'&&t[1].test(x.persian)).length;
    return '<button type="button" class="pmm-tool-tile" data-pmm-command="topic" data-pmm-value="'+i+'"><strong>'+clean(t[0])+'</strong><small>'+faNum(count)+' حکمت دارای واژه مرتبط</small></button>';
   }).join('')+'</div>'+action('بازگشت','home')+closePanel();
 }else if(page==='topic'||page==='short'){
  const ix=Number(value),topic=TOPICS[ix];
  const items=page==='topic'&&topic?bank().filter(x=>topic[1].test(x.persian||'')):
   bank().filter(x=>(x.persian||'').length>=30&&(x.persian||'').length<=130).slice(0,24);
  contents.innerHTML=panelHeader(page==='short'?'برگزیده‌های کوتاه':topic?topic[0]:'موضوعات زندگی','عبارت‌ها عیناً از متن فارسی ثبت‌شده در بانک حکمت برنامه نمایش داده می‌شوند؛ هیچ جمله تازه‌ای ساخته نشده است.')+
   items.slice(0,45).map(x=>{
    const id=String(x.id),marked=hasMark('wisdom',id);
    return '<article class="pmm-tool-wisdom"><b>'+(x.kind==='gharaib'?'غرائب حدیث':'حکمت')+' '+faNum(x.number)+'</b>'+
      '<p>'+clean(x.persian)+'</p>'+action(marked?'★ حذف نشان':'☆ نشان‌کردن','wisdommark',id)+'</article>';
   }).join('')+
   (!items.length?'<p>برای این موضوع متن دارای واژه مشخص یافت نشد.</p>':'')+
   action('بازگشت به موضوعات',page==='short'?'home':'topics')+closePanel();
 }else if(page==='saved'){
  const list=savedItems().slice().reverse();
  contents.innerHTML=panelHeader('نشان‌شده‌های من','علامت‌گذاری به معنی «این جلسه را شنیدم» نیست؛ فقط برای مراجعه دوباره است.')+
  (list.length?list.map((x,i)=>'<div class="pmm-tool-row"><b>'+clean(x.title||x.id)+'</b><small>'+clean(x.type==='wisdom'?'حکمت':x.type==='kafi'?'شرح اصول کافی':x.type==='nahj'?'شرح نهج‌البلاغه':x.type==='life'?'دیدن خدا در زندگی':'توحید کاربردی')+'</small>'+
    action('باز کردن','openmark',String(i))+action('حذف نشان','deletemark',String(i))+'</div>').join(''):'<p>هنوز موردی نشان‌گذاری نشده است.</p>')+
   action('بازگشت','home')+closePanel();
 }else if(page==='offline'){
  const list=read().offline||{};
  const rows=Object.values(list).filter(x=>x&&typeof x.url==='string');
  contents.innerHTML=panelHeader('صوت‌های دریافتی','این فایل‌ها با انتخاب شما دریافت می‌شوند و در فضای خود برنامه ذخیره می‌شوند؛ با حذف برنامه از گوشی احتمال حذفشان وجود دارد.')+
  (rows.length?rows.map((x,i)=>'<div class="pmm-tool-row"><b>'+clean(x.title)+'</b><small>'+clean(x.url.split('/').pop())+'</small>'+
  action('پخش آفلاین','offlineplay',String(i))+action('حذف از گوشی','offlinedelete',String(i))+'</div>').join(''):'<p>هنوز صوتی برای استفاده آفلاین دریافت نشده است.</p>')+action('بازگشت','home')+closePanel();
 }else if(page==='sleep'){
  contents.innerHTML=panelHeader('زمان‌سنج خواب','بعد از زمان انتخاب‌شده، پخش صوت برنامه متوقف می‌شود.')+
   [0,15,30,60].map(n=>action(n?'توقف پس از '+faNum(n)+' دقیقه':'خاموش','sleepfor',String(n))).join('')+
   '<p id="pmm-sleep-status" class="pmm-tool-muted"></p>'+action('بازگشت','home')+closePanel();
 }else if(page==='reading'){
  contents.innerHTML=panelHeader('حالت مطالعه آرام','رنگ زمینه فقط هنگام نمایش متن در صفحات داخلی تنظیم می‌شود؛ طراحی ایوان اصلی تغییر نمی‌کند.')+
   action(document.body.classList.contains('pmm-calm-reading')?'غیرفعال‌کردن حالت آرام':'فعال‌کردن حالت آرام','togglecalm')+
   action('بازگشت','home')+closePanel();
 }else if(page==='help'){
  contents.innerHTML=panelHeader('راهنمای کوتاه','برای استفاده لازم نیست حساب کاربری بسازید.')+
  '<div class="pmm-tool-row"><b>ادامه درس</b><p>آخرین درس بازشده بالای فهرست می‌ماند. در صوت کافی، محل توقف نیز ذخیره می‌شود.</p></div>'+
  '<div class="pmm-tool-row"><b>نشانک</b><p>ستاره کنار درس یا صوت برای بازگشت بعدی است؛ علامت «شنیده‌شد» نیست.</p></div>'+
  '<div class="pmm-tool-row"><b>صوت آفلاین</b><p>فقط برای صوت‌های مستقیم تأییدشده از سرور مالک؛ دانلود انتخابی است.</p></div>'+
  '<div class="pmm-tool-row"><b>پخش پس‌زمینه</b><p>دکمه پخش پس‌زمینه را بزنید تا گوشی بتواند از اعلان و صفحه قفل پخش را کنترل کند.</p></div>'+
  action('متوجه شدم','home')+closePanel();
 }else{contents.innerHTML=panelHeader('امکانات آموزشی','')+action('بازگشت','home')+closePanel()}
 contents.querySelectorAll('[data-pmm-command]').forEach(b=>b.addEventListener('click',()=>handle(b.dataset.pmmCommand,b.dataset.pmmValue||'')));
}
function navigateMark(x){
 if(x.type==='wisdom'){openHub('saved');showToast('این حکمت در فهرست نشان‌شده‌ها ثبت شده است؛ متن اصلی در این فهرست آمده است.');return}
 if(x.type==='kafi'){const n=Number(x.id);if(DATA.kafi.some(r=>r.number===n))openSavedLesson('kafi',n);return}
 if(x.type==='towhid'||x.type==='life'){openSavedLesson(x.type,Number(x.id));return}
 if(x.type==='nahj'&&x.extra){const a=x.extra;setState('list','nahj',{nahjGroup:a.group,nahjEntry:a.entry});requestAnimationFrame(()=>contents.querySelectorAll('.nahj-part-card')[a.part]?.scrollIntoView({block:'center'}))}
}
let sleeping=null;
function setSleep(minutes){
 if(sleeping)clearTimeout(sleeping);
 sleeping=null;
 if(native()?.sleepBackgroundAudio)native().sleepBackgroundAudio(minutes);
 if(minutes>0)sleeping=setTimeout(()=>{
  document.querySelectorAll('audio').forEach(a=>{try{a.pause()}catch(_){}});
  if(native()?.pauseBackgroundAudio)native().pauseBackgroundAudio();
  showToast('زمان‌سنج خواب صوت را متوقف کرد');
 },minutes*60000);
 const el=document.getElementById('pmm-sleep-status');if(el)el.textContent=minutes?'پس از '+faNum(minutes)+' دقیقه توقف انجام می‌شود.':'زمان‌سنج خواب خاموش شد.';
}
function handle(command,value){
 if(['home','start','topics','short','saved','offline','sleep','reading','help'].includes(command)){openHub(command);return}
 if(command==='course'){setState('list',value);return}
 if(command==='topic'){openHub('topic',value);return}
 if(command==='wisdommark'){const b=bank().find(x=>x.id===value);if(b){toggleMark('wisdom',value,(b.kind==='gharaib'?'غرائب حدیث':'حکمت')+' '+faNum(b.number));openHub(item.pmmToolPage,item.value)}return}
 if(command==='openmark'||command==='deletemark'){
  const v=savedItems().slice().reverse()[Number(value)];if(!v)return;
  if(command==='deletemark'){toggleMark(v.type,v.id,v.title,v.extra);openHub('saved')}else navigateMark(v);return;
 }
 if(command==='sleepfor'){setSleep(Number(value));return}
 if(command==='togglecalm'){document.body.classList.toggle('pmm-calm-reading');save(s=>s.calm=document.body.classList.contains('pmm-calm-reading'));openHub('reading');return}
 if(command==='offlineplay'||command==='offlinedelete'){
  const v=Object.values(read().offline||{}).filter(x=>x&&x.url)[Number(value)];if(!v)return;
  if(command==='offlinedelete'){if(native()?.deleteLessonAudio&&native().deleteLessonAudio(v.url)){save(s=>{delete s.offline[v.url]});openHub('offline')}else showToast('حذف فایل ممکن نشد.');return}
  if(native()?.playBackgroundAudio)native().playBackgroundAudio(v.url,v.title,0,1);
  else showToast('پخش آفلاین در نسخه اندروید فعال است.');
 }
}
function styleButton(el){el.classList.add('pmm-tool-control');el.type='button'}
function decorateAudio(card,audio,type,info){
 if(card.dataset.pmmDecorated)return;
 card.dataset.pmmDecorated='yes';
 const holder=document.createElement('div');holder.className='pmm-tool-audio-extras';
 const mark= document.createElement('button');mark.type='button';mark.textContent=hasMark(type,info.id)?'★ نشان‌شده':'☆ نشان‌کردن';
 const back=document.createElement('button');back.type='button';back.textContent='↶ ۱۵ ثانیه';
 const next=document.createElement('button');next.type='button';next.textContent='۳۰ ثانیه ↷';
 const bg=document.createElement('button');bg.type='button';bg.textContent='♫ پخش پس‌زمینه';
 const dl=document.createElement('button');dl.type='button';dl.textContent='↓ دریافت آفلاین';
 const retry=document.createElement('button');retry.type='button';retry.textContent='↻ تلاش دوباره';
 const report=document.createElement('button');report.type='button';report.textContent='گزارش مشکل لینک';
 const note=document.createElement('button');note.type='button';note.textContent='✎ یادداشت من';
 const hint=document.createElement('p');hint.className='pmm-tool-note';
 const preview=document.createElement('p');preview.className='pmm-tool-note';
 preview.textContent='موضوع: '+info.title+' | منبع: '+(type==='kafi'?'شرح اصول کافی':'شرح نهج‌البلاغه')+'. مدت صوت پس از بارگذاری نمایان می‌شود. متن و خلاصه این جلسه هنوز تأیید نشده است.';
 [mark,back,next,bg,dl,retry,report,note].forEach(b=>{styleButton(b);holder.appendChild(b)});
 holder.appendChild(hint);holder.appendChild(preview);
 card.appendChild(holder);
 mark.addEventListener('click',()=>{const ok=toggleMark(type,info.id,info.title,info.extra);mark.textContent=ok?'★ نشان‌شده':'☆ نشان‌کردن';});
 back.addEventListener('click',()=>{if(Number.isFinite(audio.currentTime))audio.currentTime=Math.max(0,audio.currentTime-15)});
 next.addEventListener('click',()=>{if(Number.isFinite(audio.duration))audio.currentTime=Math.min(audio.duration,audio.currentTime+30)});
 bg.addEventListener('click',()=>{
  const api=native();
  if(!api?.playBackgroundAudio){showToast('پخش پس‌زمینه در نسخه اندروید فعال می‌شود.');return}
  const url=decodeURI(audio.dataset.src||audio.src||'');
  if(!url)return;
  const pos=Math.max(0,Math.floor(audio.currentTime||0));
  audio.pause();
  api.playBackgroundAudio(url,info.title,pos,Number(audio.playbackRate)||1);
  hint.textContent='در حال ارسال صوت به پخش‌کننده پس‌زمینه…';
 });
 dl.addEventListener('click',()=>{
  const api=native(),url=decodeURI(audio.dataset.src||audio.src||'');
  if(!api?.downloadLessonAudio){showToast('دریافت آفلاین فقط در نسخه اندروید ممکن است.');return}
  if(api.downloadLessonAudio(url,info.title))hint.textContent='دریافت درخواست شد. پس از پایان، صوت در بخش دریافت‌ها نمایش داده می‌شود.';
  else hint.textContent='نشانی این صوت برای دریافت معتبر نیست.';
 });
 retry.addEventListener('click',()=>{
  const wasPlaying=!audio.paused;audio.pause();
  const source=audio.getAttribute('src')||audio.dataset.src;
  if(!source)return;
  audio.removeAttribute('src');audio.load();audio.src=source;
  if(wasPlaying||audio.dataset.pmmRequested==='yes')audio.play().catch(()=>{hint.textContent='ارتباط با سرور برقرار نشد.'});
 });
 report.addEventListener('click',()=>{
  const link=decodeURI(audio.dataset.src||audio.src||'');
  const text=info.title+'\n'+link+'\n'+'مشکل: فایل پخش نمی‌شود.';
  const el=document.createElement('textarea');el.className='pmm-report-text';el.value=text;el.readOnly=true;
  if(hint.querySelector('textarea'))hint.innerHTML='';
  hint.textContent='این مشخصات را کپی کنید و از راه ارتباطی برنامه بفرستید: ';
  hint.appendChild(el);el.focus();el.select();
  try{document.execCommand('copy');showToast('مشخصات لینک برای گزارش کپی شد')}catch(_){}
 });
 note.addEventListener('click',()=>{
  const old=notes()[uid(type,info.id)]||'';
  const area=document.createElement('textarea');area.className='pmm-report-text';area.maxLength=1800;area.placeholder='یادداشت خصوصی خودم…';area.value=old;
  const store=document.createElement('button');store.type='button';store.className='pmm-tool-control';store.textContent='ذخیره یادداشت';
  hint.replaceChildren(area,store);
  store.addEventListener('click',()=>{setNote(type,info.id,area.value);hint.textContent='یادداشت شما فقط در این دستگاه ذخیره شد.'});
 });
 if(type==='kafi'){
  const key='kafi:'+info.id;
  let lastStore=-1;
  function persist(finish=false){
   const second=finish?0:Math.floor(audio.currentTime||0);
   if(!Number.isFinite(second)||second===lastStore)return;
   lastStore=second;
   save(s=>{if(!s.positions)s.positions={};s.positions[key]=second;
    if(Number.isFinite(audio.duration)&&audio.duration>0){if(!s.lengths)s.lengths={};s.lengths[key]=Math.floor(audio.duration)}
   });
  }
  audio.addEventListener('loadedmetadata',()=>{
   const seconds=Number((read().positions||{})[key]||0);
   if(seconds>0&&audio.duration>seconds+1){audio.currentTime=seconds;hint.textContent='ادامه از '+nahjAudioTime(seconds)}
  });
  audio.addEventListener('timeupdate',()=>{if(audio.currentTime-lastStore>4)persist()});
  audio.addEventListener('pause',()=>persist());
  audio.addEventListener('ended',()=>{persist(true);
   if(read().autoplayNext){
    const index=DATA.kafi.findIndex(r=>String(r.number)===info.id);
    const nextRecord=DATA.kafi[index+1];
    if(nextRecord){openSavedLesson('kafi',nextRecord.number);setTimeout(()=>contents.querySelector('[data-kafi-toggle]')?.click(),300)}
   }
  });
  const nr=document.createElement('button');nr.type='button';nr.className='pmm-tool-control';
  nr.textContent=read().autoplayNext?'پخش خودکار جلسه بعد: روشن':'پخش خودکار جلسه بعد: خاموش';
  nr.addEventListener('click',()=>{const enabled=!read().autoplayNext;save(s=>s.autoplayNext=enabled);nr.textContent='پخش خودکار جلسه بعد: '+(enabled?'روشن':'خاموش')});
  holder.appendChild(nr);
  const ix=DATA.kafi.findIndex(r=>String(r.number)===info.id);
  const prev=DATA.kafi[ix-1],nxt=DATA.kafi[ix+1];
  for(const pair of [[prev,'جلسه قبل'],[nxt,'جلسه بعد']]){
   if(!pair[0])continue;
   const button=document.createElement('button');button.type='button';button.className='pmm-tool-control';
   button.textContent=pair[1];button.addEventListener('click',()=>openSavedLesson('kafi',pair[0].number));holder.appendChild(button);
  }
 }
}
function enhancePage(){
 if(screen==='player'&&section==='kafi'&&item){
  const card=contents.querySelector('.kafi-audio-card'),audio=card?.querySelector('audio');
  if(card&&audio)decorateAudio(card,audio,'kafi',{id:String(item.number),title:item.title});
 }else if(screen==='list'&&section==='nahj'&&item?.nahjGroup&&item?.nahjEntry){
  const cards=contents.querySelectorAll('.nahj-part-card'),group=item.nahjGroup,entry=item.nahjEntry;
  const records=NAHJ_AUDIO_ITEMS[group]||[],record=records.find(x=>x.id===entry);
  cards.forEach((card,i)=>{
   const audio=card.querySelector('audio');
   if(audio)decorateAudio(card,audio,'nahj',{id:group+'/'+entry+'/'+i,title:(record?.title||entry)+' — '+nahjPartName(i+1),extra:{group,entry,part:i}});
  });
 }
 const last=PMM_LEARNING_PROGRESS.getWisdom?.();
 const result=document.getElementById('wisdom-result');
 if(result&&!result.querySelector('#pmm-wisdom-bookmark')){
  const b=document.createElement('button');b.id='pmm-wisdom-bookmark';b.type='button';b.className='pmm-tool-control';b.textContent='☆ نشان‌کردن این حکمت';
  result.appendChild(b);
  b.addEventListener('click',()=>{
   const id=PMM_LEARNING_PROGRESS.getWisdom(),r=bank().find(x=>x.id===id);
   if(!r){showToast('ابتدا یک حکمت انتخاب کنید');return}
   const ok=toggleMark('wisdom',id,(r.kind==='gharaib'?'غرائب حدیث':'حکمت')+' '+faNum(r.number));
   b.textContent=ok?'★ نشان‌شده':'☆ نشان‌کردن این حکمت';
  });
 }
 if(last&&result?.querySelector('#pmm-wisdom-bookmark'))result.querySelector('#pmm-wisdom-bookmark').textContent=hasMark('wisdom',last)?'★ نشان‌شده':'☆ نشان‌کردن این حکمت';
}
const oldRenderList=renderList;
renderList=function(){if(section==='tools'){renderToolPage();return}oldRenderList();enhancePage()};
const oldRenderPlayer=renderPlayer;
renderPlayer=function(){oldRenderPlayer();enhancePage()};
const oldBack=goBack;
goBack=function(){
 if(screen==='list'&&section==='tools'){
  if(item?.pmmToolPage&&item.pmmToolPage!=='home'){openHub('home');return}
  setState('home');return;
 }
 return oldBack();
};
function updateToolbar(){
 const tool=document.getElementById('pmm-tools-button');if(!tool)return;
 const showing=screen==='list'||screen==='player'||screen==='about'||screen==='biography'||screen==='photo';
 tool.hidden=!showing;
 const min=document.getElementById('pmm-native-mini');if(min)min.hidden=!showing;
}
const oldRender=render;
render=function(){oldRender();if(screen==='list'&&section==='tools')titleImg.classList.add('gone');updateToolbar()};
const btn=document.createElement('button');btn.id='pmm-tools-button';btn.type='button';btn.textContent='✦ امکانات آموزشی';btn.setAttribute('aria-label','امکانات آموزشی، نشانک‌ها و تنظیمات');btn.hidden=true;document.body.appendChild(btn);
btn.addEventListener('click',()=>{if(screen==='list'&&section==='tools')setState('home');else openHub()});
const mini=document.createElement('div');mini.id='pmm-native-mini';mini.hidden=true;mini.innerHTML='<span id="pmm-mini-title">♫ پخش پس‌زمینه</span><button type="button" id="pmm-mini-toggle">پخش/توقف</button><button type="button" id="pmm-mini-off">توقف کامل</button>';document.body.appendChild(mini);
document.getElementById('pmm-mini-toggle').addEventListener('click',()=>{const api=native();if(!api?.getBackgroundAudioState)return;try{const s=JSON.parse(api.getBackgroundAudioState());if(s.playing)api.pauseBackgroundAudio();else api.resumeBackgroundAudio()}catch(_){}});
document.getElementById('pmm-mini-off').addEventListener('click',()=>native()?.stopBackgroundAudio?.());
function refreshMini(){const api=native();if(!api?.getBackgroundAudioState){mini.hidden=true;return}
 try{
  const v=JSON.parse(api.getBackgroundAudioState());
  mini.hidden=!v.active||screen==='home';
  document.getElementById('pmm-mini-title').textContent=v.title||'پخش پس‌زمینه';
  document.getElementById('pmm-mini-toggle').textContent=v.playing?'توقف موقت':'ادامه';
 }catch(_){mini.hidden=true}
}
setInterval(refreshMini,1600);
document.body.classList.toggle('pmm-calm-reading',read().calm===true);
window.addEventListener('pmm:audio-download',e=>{const d=e.detail||{};if(d.status==='done'){save(s=>{if(!s.offline)s.offline={};s.offline[d.url]={url:d.url,title:d.title,at:Date.now()}});showToast('صوت برای شنیدن آفلاین دریافت شد');if(screen==='list'&&section==='tools'&&item?.pmmToolPage==='offline')renderToolPage()}else if(d.status==='error')showToast('دریافت صوت موفق نبود: '+(d.message||'خطای ارتباطی'))});
window.PMM_LEARNING_EXTRAS=Object.freeze({openHub,topics:TOPICS.map(x=>x[0]),getBookmarked:()=>savedItems().slice(),getSavedPosition:number=>(read().positions||{})['kafi:'+number]||0});
updateToolbar();enhancePage();
})();