/* Owner v121 optional wisdom tools; all text offline, no sound/network/player interaction. */
(function(root){
'use strict';
const KEY='pmm_owner_wisdom_tools_v121';
const RX=/^(?:h\d{3}|g\d{3})$/;
const TOPICS=[
 ['شکیبایی و آرامش',/صبر|شکیبایی|بردبار|آرامش|تحمل/],
 ['عدالت و حق',/عدالت|دادگر|عدل|حقّ|حقوق|ستم/],
 ['دوستی و خانواده',/دوست|مهربان|خانواده|همسر|فرزند|محبت|مردم/],
 ['دانش و اندیشه',/دانش|آموختن|خرد|عقل|علم|اندیشه/],
 ['اخلاص و پرهیزگاری',/اخلاص|خلوص|پرهیزگار|تقوا|نیت/],
 ['خشم و گفتار',/خشم|غضب|زبان|سخن|گفتار/]
];
const $=id=>root.document?.getElementById(id);
function safeJSON(x){try{const v=JSON.parse(x||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(_){return {}}}
function loadKey(k){try{return root.localStorage?.getItem(k)}catch(_){return null}}
function bank(){return Array.isArray(root.PMM_HIKMAT_ALL)?root.PMM_HIKMAT_ALL.filter(w=>w&&RX.test(w.id)):[]}
function valid(id){return typeof id==='string'&&RX.test(id)&&bank().some(w=>w.id===id)}
function item(id){return valid(id)?bank().find(w=>w.id===id):null}
function normalize(v){
 const m=Array.isArray(v?.marks)?v.marks.filter(x=>typeof x==='string'&&RX.test(x)).slice(-240):[];
 const n={};
 if(v?.notes&&typeof v.notes==='object'&&!Array.isArray(v.notes))
  for(const [id,text] of Object.entries(v.notes).slice(-240))
   if(RX.test(id)&&typeof text==='string'&&text.trim())n[id]=text.slice(0,1800);
 return {marks:[...new Set(m)],notes:n,migrated:v?.migrated===true,calm:v?.calm===true};
}
function read(){return normalize(safeJSON(loadKey(KEY)))}
function write(v){const out=normalize(v);try{root.localStorage?.setItem(KEY,JSON.stringify(out))}catch(_){}return out}
function migrate(){
 let s=read();if(s.migrated)return s;
 const old=safeJSON(loadKey('pmm_learning_extras_v1'));
 if(Array.isArray(old.bookmarks))old.bookmarks.forEach(b=>{if(b?.type==='wisdom'&&RX.test(b.id))s.marks.push(b.id)});
 if(old.notes&&typeof old.notes==='object')for(const [key,text] of Object.entries(old.notes)){
  const id=key.startsWith('wisdom:')?key.slice(7):'';
  if(RX.test(id)&&typeof text==='string'&&text.trim()&&!s.notes[id])s.notes[id]=text.slice(0,1800);
 }
 const ux=safeJSON(loadKey('pmm_owner_tools_v108'));
 if(ux.marks&&typeof ux.marks==='object')Object.keys(ux.marks).forEach(key=>{
  const id=key.startsWith('wisdom:')?key.slice(7):'';
  if(RX.test(id))s.marks.push(id);
 });
 s.migrated=true;return write(s);
}
function selected(){const p=safeJSON(loadKey('pmm_learning_progress_v1'));return item(p.wisdom?.id)}
function toggle(id){
 if(!valid(id))return null;
 const s=migrate();const has=s.marks.includes(id);
 s.marks=has?s.marks.filter(x=>x!==id):s.marks.concat(id).slice(-240);
 write(s);return !has;
}
function note(id){return read().notes[id]||''}
function saveNote(id,txt){
 if(!valid(id)||typeof txt!=='string')return false;
 const s=migrate(),v=txt.trim().slice(0,1800);
 if(v)s.notes[id]=v;else delete s.notes[id];
 write(s);return true;
}
function bookmarks(){return read().marks.filter(valid).map(item)}
function topic(i){return Number.isInteger(i)&&TOPICS[i]?bank().filter(w=>TOPICS[i][1].test(w.persian||'')).slice(0,32):[]}
function shorts(){return bank().filter(w=>typeof w.persian==='string'&&w.persian.length>=14&&w.persian.length<=95).slice(0,30)}
function make(tag,cls,text){
 const e=root.document.createElement(tag);if(cls)e.className=cls;
 if(text!==undefined)e.textContent=text;return e;
}
function button(text,cb){const e=make('button','pmm-v121-btn',text);e.type='button';e.addEventListener('click',cb);return e}
function heading(w){return (w.kind==='gharaib'?'غرائب الحدیث ':'حکمت شماره ')+(w.number||'')}
let panel=null,pin=null;
function close(){if(panel)panel.hidden=true}
function open(title){
 if(!panel)return null;
 panel.querySelector('h2').textContent=title;
 panel.querySelector('.pmm-v121-body').replaceChildren();
 panel.querySelector('.pmm-v121-status').textContent='';
 panel.hidden=false;panel.scrollIntoView?.({block:'nearest'});
 return panel.querySelector('.pmm-v121-body');
}
function message(t){if(panel)panel.querySelector('.pmm-v121-status').textContent=t}
function rows(dst,items){
 if(!items.length){dst.appendChild(make('p','','موردی یافت نشد.'));return}
 items.forEach(w=>dst.appendChild(button(heading(w)+' — '+(w.persian||'').slice(0,70),()=>detail(w.id))));
}
function detail(id){
 const w=item(id);if(!w)return;
 const dst=open(heading(w));if(!dst)return;
 const ar=make('p','pmm-v121-ar',w.arabic||'');ar.lang='ar';dst.appendChild(ar);
 dst.appendChild(make('p','',w.persian||''));
 const star=button(read().marks.includes(id)?'★ حذف نشانک':'☆ نشان‌کردن',()=>{
  const active=toggle(id);star.textContent=active?'★ حذف نشانک':'☆ نشان‌کردن';updatePin();
  message(active?'نشانک ذخیره شد.':'نشانک حذف شد.');
 });dst.appendChild(star);
 const label=make('label','','یادداشت شخصی (فقط در گوشی)');label.setAttribute('for','pmm-v121-note');dst.appendChild(label);
 const textarea=make('textarea','pmm-v121-note');textarea.id='pmm-v121-note';textarea.maxLength=1800;textarea.value=note(id);dst.appendChild(textarea);
 dst.appendChild(button('ذخیره یادداشت',()=>{if(saveNote(id,textarea.value))message('یادداشت ذخیره شد.');}));
 dst.appendChild(button('بازگشت به نشانک‌ها',listSaved));
}
function listSaved(){const dst=open('نشان‌شده‌های من');if(dst)rows(dst,bookmarks())}
function topicMenu(){
 const dst=open('موضوعات زندگی');if(!dst)return;
 dst.appendChild(make('p','','موضوعات فقط براساس واژه‌های ترجمه واقعی حکمت‌ها انتخاب می‌شوند، نه تفسیر یا متن ساختگی.'));
 TOPICS.forEach((v,i)=>dst.appendChild(button(v[0],()=>{
  const d=open(v[0]);if(!d)return;rows(d,topic(i));d.appendChild(button('بازگشت به موضوعات',topicMenu));
 })));
}
function calm(){const sc=$('wisdom-scroll');if(sc)sc.classList.toggle('pmm-v121-calm',read().calm)}
function menu(){
 const dst=open('ابزارهای اختیاری حکمت');if(!dst)return;
 dst.appendChild(make('p','','آفلاین و بدون تغییر در پخش، اعلان، دوره یا اطلاعات صوتی.'));
 dst.appendChild(button('نشانک‌های من',listSaved));
 dst.appendChild(button('موضوعات زندگی',topicMenu));
 dst.appendChild(button('برگزیده‌های کوتاه',()=>{const d=open('برگزیده‌های کوتاه');if(d)rows(d,shorts())}));
 const b=button('حالت مطالعه آرام: '+(read().calm?'روشن':'خاموش'),()=>{
  const x=read();x.calm=!x.calm;write(x);calm();b.textContent='حالت مطالعه آرام: '+(x.calm?'روشن':'خاموش');
 });dst.appendChild(b);
}
function updatePin(){
 if(!pin)return;const w=selected();
 pin.disabled=!w;pin.textContent=w&&read().marks.includes(w.id)?'★ نشان‌شده':'☆ نشان‌کردن این حکمت';
}
function init(){
 migrate();
 const sc=$('wisdom-scroll'),intro=$('wisdom-intro'),result=$('wisdom-result');
 if(!sc||!intro||!result||$('pmm-v121-panel'))return;
 const style=make('style');style.textContent=
 '#wisdom-scroll .pmm-v121-controls{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;margin:9px 1%}'+
 '#wisdom-scroll .pmm-v121-btn{min-height:44px;min-width:90px;padding:7px 10px;margin:3px;border:2px solid #bd954e;border-radius:12px;background:#fff2ca;color:#143f60;font-size:clamp(12px,2.5cqw,17px);font-family:Tahoma,sans-serif;cursor:pointer}'+
 '#wisdom-scroll .pmm-v121-btn:focus-visible{outline:3px solid #165487;outline-offset:2px}'+
 '#wisdom-scroll .pmm-v121-btn:disabled{opacity:.45}'+
 '#wisdom-scroll .pmm-v121-panel{border:2px solid #bb934c;border-radius:14px;background:#fff8e7;color:#173c5d;margin:10px 2%;padding:12px;direction:rtl;text-align:right;line-height:1.8}'+
 '#wisdom-scroll .pmm-v121-panel[hidden]{display:none!important}'+
 '#wisdom-scroll .pmm-v121-panel h2{font-size:18px;margin:0 0 8px}'+
 '#wisdom-scroll .pmm-v121-body .pmm-v121-btn{width:100%;text-align:right}'+
 '#wisdom-scroll .pmm-v121-ar{font:20px/2 PMM Amiri,serif}'+
 '#wisdom-scroll .pmm-v121-note{display:block;box-sizing:border-box;width:100%;min-height:90px;border:2px solid #c3a470;border-radius:9px;padding:8px;font-size:16px;direction:rtl}'+
 '#wisdom-scroll.pmm-v121-calm .pmm-v121-panel{background:#f4f0de}';
 root.document.head.appendChild(style);
 panel=make('section','pmm-v121-panel');panel.id='pmm-v121-panel';panel.hidden=true;
 panel.setAttribute('aria-label','ابزارهای اختیاری حکمت');
 panel.appendChild(make('h2'));panel.appendChild(button('بستن',close));
 panel.appendChild(make('div','pmm-v121-body'));
 const status=make('p','pmm-v121-status');status.setAttribute('role','status');panel.appendChild(status);
 sc.querySelector('.wisdom-body').appendChild(panel);
 const ib=make('div','pmm-v121-controls');ib.appendChild(button('☆ نشانک‌ها و یادداشت‌ها',menu));intro.appendChild(ib);
 const rb=make('div','pmm-v121-controls');
 pin=button('☆ نشان‌کردن این حکمت',()=>{const w=selected();if(w){toggle(w.id);updatePin()}});
 rb.appendChild(pin);
 rb.appendChild(button('✎ یادداشت این حکمت',()=>{const w=selected();if(w)detail(w.id)}));
 result.appendChild(rb);
 root.addEventListener('pmm:wisdom-selected',()=>{close();updatePin()});
 if(typeof root.MutationObserver==='function'){
  const watcher=new root.MutationObserver(()=>{if(sc.hidden)close()});
  watcher.observe(sc,{attributes:true,attributeFilter:['hidden']});
 }
 calm();updatePin();
}
root.PMM_OWNER_WISDOM_TOOLS=Object.freeze({read,migrate,selected,toggle,saveNote,note,bookmarks,topic,shorts,init,topics:TOPICS.map(x=>x[0])});
if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
