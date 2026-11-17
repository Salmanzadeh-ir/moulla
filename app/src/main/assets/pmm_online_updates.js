/* PMM owner-requested online CONTENT updates only; no executable code updates.
   Source-of-truth is HTTPS manifest loaded by the restricted Android bridge.
   No remote content is stored in localStorage, IndexedDB, or files.
   The only persisted value is the acknowledged numeric revision. */
(function(){
'use strict';
var REVISION_KEY='pmm_content_accepted_revision_v1';
var sections={
  nahj_audio:{legacy:'nahj',name:'شرح جامع صوتی نهج‌البلاغه'},
  towhid:{legacy:'towhid',name:'توحید کاربردی'},
  see_god:{legacy:'life',name:'دیدن خدا در زندگی'},
  kafi:{legacy:'kafi',name:'شرح اصول کافی'},
  videos:{legacy:'clips',name:'کلیپ‌های تصویری'},
  photo_quotes:{legacy:'gallery',name:'عکس‌نوشته'},
  guest_sentence_new:{legacy:'wisdom',name:'یک جمله مهمان مولا'}
};
var current=null,shown=false,accepted=0;
var inMemoryIds=new Set();
var onlineBySection={};
Object.keys(sections).forEach(function(k){onlineBySection[k]=[]});
try{accepted=Math.max(0,parseInt(localStorage.getItem(REVISION_KEY)||'0',10)||0)}catch(_){}
var scene=document.getElementById('scene');
if(!scene)return;

var modal=document.createElement('section');
modal.id='pmm-update-dialog';modal.className='pmm-update-overlay';modal.hidden=true;
modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','pmm-update-heading');
modal.innerHTML=
  '<div class="pmm-update-card" dir="rtl">'+
  '<div class="pmm-update-emblem" aria-hidden="true">✦</div>'+
  '<h2 id="pmm-update-heading">مطالب جدید پای منبر مولا</h2>'+
  '<p class="pmm-update-subtitle">مطالب تازه برای شما آماده شده است</p>'+
  '<div id="pmm-update-summary" class="pmm-update-summary" aria-live="polite"></div>'+
  '<p class="pmm-update-footnote">مطالب جدید به‌صورت آنلاین نمایش داده می‌شوند و فضای ذخیره‌سازی گوشی را اشغال نمی‌کنند. برای مشاهده آن‌ها اینترنت لازم است.</p>'+
  '<div class="pmm-update-actions">'+
  '<button type="button" id="pmm-update-accept" class="pmm-update-confirm">دریافت مطالب جدید</button>'+
  '<button type="button" id="pmm-update-later" class="pmm-update-later">بعداً</button>'+
  '</div></div>';
scene.appendChild(modal);
var summary=document.getElementById('pmm-update-summary');
var acceptButton=document.getElementById('pmm-update-accept');
var laterButton=document.getElementById('pmm-update-later');
var focusBefore=null;

function allowedLink(value) {
  try {
    var u=new URL(value);
    return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&
      ((u.hostname==='eitaa.com'&&/^\/(?:joinchat\/[a-zA-Z0-9]+|[a-zA-Z0-9_]+\/[0-9]+)\/?$/.test(u.pathname))||
       ((u.hostname==='aparat.com'||u.hostname==='www.aparat.com')&&/^\/v\/[a-zA-Z0-9_-]+\/?$/.test(u.pathname)));
  }catch(_){return false;}
}
function safePhotoUrl(value){
  try {
    var host=String(window.PMM_UPDATE_ORIGIN||'');
    if(!host)return false;
    var u=new URL(value);
    return u.protocol==='https:'&&u.origin===host&&/^\/media\/[a-f0-9-]{36}$/.test(u.pathname)&&!u.search&&!u.hash;
  }catch(_){return false;}
}
function validManifest(value) {
  if(!value||value.schema!==1||!Number.isSafeInteger(value.revision)||value.revision<0||!Array.isArray(value.items)||value.items.length>3000)return false;
  var ids=new Set();
  return value.items.every(function(item){
    if(!item||!sections[item.section]||typeof item.id!=='string'||!(/^[0-9a-f-]{36}$/.test(item.id))||
      ids.has(item.id)||typeof item.title!=='string'||item.title.trim().length<2||item.title.length>180)return false;
    ids.add(item.id);
    if(item.section==='guest_sentence_new'){
      return typeof item.arabic==='string'&&item.arabic.trim().length>=3&&item.arabic.length<=3500&&
             typeof item.persian==='string'&&item.persian.trim().length>=3&&item.persian.length<=3500;
    }
    if(item.section==='photo_quotes')return safePhotoUrl(item.url);
    return allowedLink(item.url);
  });
}
function faNum(n){return Number(n).toLocaleString('fa-IR')}
function titleCounts(manifest){
  var counts={};
  manifest.items.forEach(function(item){
    if(Number(item.revision||0)>accepted)counts[item.section]=(counts[item.section]||0)+1;
  });
  var descriptions=Object.keys(counts).filter(function(k){return counts[k]>0}).map(function(k){
    return faNum(counts[k])+' مورد در «'+sections[k].name+'»';
  });
  return descriptions.length?descriptions:['فهرست مطالب به‌روزرسانی شده است.'];
}
function showModal(manifest){
  if(shown)return;
  var descriptions=titleCounts(manifest);
  summary.textContent='';
  descriptions.forEach(function(line){
    var p=document.createElement('p');p.textContent='✦ '+line;summary.appendChild(p);
  });
  shown=true;focusBefore=document.activeElement;
  modal.hidden=false;acceptButton.focus({preventScroll:true});
}
function closeModal(){
  shown=false;modal.hidden=true;
  if(focusBefore&&focusBefore.isConnected)focusBefore.focus({preventScroll:true});
}
function onlineLink(item,legacySection,number){
  if(/^https:\/\/eitaa\.com\//.test(item.url)){openEitaa(item.url);return;}
  setState('player',legacySection,{title:item.title,number:number,url:item.url});
}
function addPanel(container,group,legacySection){
  if(!container||!group.length)return;
  var panel=document.createElement('div');panel.className='pmm-fresh-content';
  var heading=document.createElement('h3');heading.textContent='✦ مطالب تازه';panel.appendChild(heading);
  group.forEach(function(item,i){
    var button=document.createElement('button');
    button.type='button';button.className='pmm-fresh-link';button.textContent=item.title;
    var base=(legacySection==='nahj'?0:Array.isArray(DATA[legacySection])?DATA[legacySection].length:0);
    button.addEventListener('click',function(){onlineLink(item,legacySection,base+i+1)});
    panel.appendChild(button);
  });
  container.appendChild(panel);
}
var initialRenderList=renderList;
renderList=function(){
  initialRenderList();
  var source=Object.keys(sections).find(function(k){return sections[k].legacy===section});
  if(source&&source!=='videos')addPanel(contents,onlineBySection[source],section);
};
var initialRenderClips=renderClips;
renderClips=function(){
  initialRenderClips();
  if(VIDEO_CLIPS.length){
    var note=contents.querySelector('.pmm-clips-note');
    if(note)note.textContent='برای تماشای کلیپ، قاب مربوط را لمس کنید.';
  }
};
function updateWisdomExtras(){
  var sectionEl=document.getElementById('pmm-fresh-wisdom');
  if(!sectionEl){
    sectionEl=document.createElement('section');sectionEl.id='pmm-fresh-wisdom';
    sectionEl.className='pmm-fresh-wisdom';
    var body=document.querySelector('#wisdom-scroll .wisdom-body');
    if(!body)return;body.appendChild(sectionEl);
  }
  var items=onlineBySection.guest_sentence_new;
  sectionEl.textContent='';sectionEl.hidden=!items.length;
  if(!items.length)return;
  var heading=document.createElement('h2');heading.textContent='✦ جمله‌های تازه';sectionEl.appendChild(heading);
  items.forEach(function(item){
    var row=document.createElement('div');row.className='pmm-fresh-wisdom-item';
    var title=document.createElement('h3');title.textContent=item.title;
    var arabic=document.createElement('p');arabic.lang='ar';arabic.dir='rtl';arabic.className='pmm-fresh-ar';arabic.textContent=item.arabic;
    var persian=document.createElement('p');persian.lang='fa';persian.dir='rtl';persian.textContent=item.persian;
    row.appendChild(title);row.appendChild(arabic);row.appendChild(persian);sectionEl.appendChild(row);
  });
}
function applyManifest(manifest){
  if(!validManifest(manifest))throw Error('فهرست محتوای نامعتبر دریافت شد.');
  manifest.items.forEach(function(item){
    if(inMemoryIds.has(item.id))return;
    if(item.section==='photo_quotes'){
      if(!window.PMM_PHOTO_QUOTES_VIEW||typeof window.PMM_PHOTO_QUOTES_VIEW.addOnlinePhotos!=='function')
        throw Error('گالری آماده نیست.');
      window.PMM_PHOTO_QUOTES_VIEW.addOnlinePhotos([item.url]);
    }else if(item.section==='videos'){
      if(!VIDEO_CLIPS.some(function(v){return v.pmmOnlineId===item.id})){
        VIDEO_CLIPS.push({title:item.title,url:item.url,pmmOnlineId:item.id});
      }
    }else onlineBySection[item.section].push(item);
    inMemoryIds.add(item.id);
  });
  updateWisdomExtras();
  // Refresh only the active content page; no home layout or Back/Exit handler changes.
  if(screen==='list'&&['nahj','towhid','life','kafi','clips'].includes(section))render();
  if(screen==='gallery'&&typeof galleryRenderGrid==='function')galleryRenderGrid();
}
function receiveManifest(raw){
  var manifest;
  try{manifest=typeof raw==='string'?JSON.parse(raw):raw}catch(_){return;}
  if(!validManifest(manifest))return;
  current=manifest;
  if(manifest.revision>accepted){showModal(manifest);return;}
  try{applyManifest(manifest)}catch(err){console.warn('PMM content integration:',err.message)}
}
acceptButton.addEventListener('click',function(){
  if(!current)return;
  acceptButton.disabled=true;
  try{
    applyManifest(current);
    accepted=current.revision;
    try{localStorage.setItem(REVISION_KEY,String(accepted))}catch(_){}
    closeModal();
    if(window.PMM_NEW_UI&&window.PMM_NEW_UI.showToast)window.PMM_NEW_UI.showToast('مطالب جدید در بخش‌های مربوط در دسترس است.');
  }catch(err){
    console.warn('Could not activate online content',err);
    var p=document.createElement('p');p.textContent='نمایش مطالب جدید انجام نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.';summary.appendChild(p);
  }finally{acceptButton.disabled=false;}
});
laterButton.addEventListener('click',closeModal);
// Physical Android Back while the dialog is open behaves as "بعداً"; never exits.
var previousBack=goBack;
goBack=function(){if(shown){closeModal();return}return previousBack()};
modal.addEventListener('keydown',function(e){
  if(e.key==='Tab'){
    if(e.shiftKey&&document.activeElement===acceptButton){e.preventDefault();laterButton.focus()}
    else if(!e.shiftKey&&document.activeElement===laterButton){e.preventDefault();acceptButton.focus()}
  }
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeModal()}
});
window.PMM_CONTENT_UPDATES=Object.freeze({
  receiveManifest:receiveManifest,
  isVisible:function(){return shown},
  acceptedRevision:function(){return accepted},
  getOnlineCounts:function(){return Object.keys(onlineBySection).reduce(function(out,k){out[k]=onlineBySection[k].length;return out},{})}
});
// The Android host calls checkContentUpdates() on each fresh application load.
// No permission for remote server to inject scripts, HTML, Android intents, or arbitrary native actions.
})();