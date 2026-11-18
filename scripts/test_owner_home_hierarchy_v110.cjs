'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const rootMatch=html.match(/<div class="home-menu-grid" id="home-main-menu"[\s\S]*?<\/div>/);
assert(rootMatch,'New six-item root menu exists');
const root=rootMatch[0];
const buttons=[...root.matchAll(/<button\b([^>]*)>/g)].map(m=>m[1]);
assert.equal(buttons.length,6,'Exactly six main-page icons');
const expected=[
 ['data-menu="nahj_audio"','شرح جامع صوتی نهج‌البلاغه'],
 ['data-home-submenu="learning"','نهج‌البلاغه کاربردی'],
 ['data-home-submenu="media"','رسانه پای منبر مولا'],
 ['data-menu="guest_sentence_new"','تفال به نهج‌البلاغه'],
 ['data-home-placeholder="offline-course"','دوره آفلاین نهج‌البلاغه‌خوانی'],
 ['data-menu="kafi"','شرح اصول کافی']
];
expected.forEach(([attribute,label],i)=>{
 assert(buttons[i].includes(attribute),'Root order '+(i+1)+' attribute '+attribute);
 const start=root.indexOf(buttons[i]);
 const next=i===buttons.length-1?root.length:root.indexOf('<button',start+1);
 assert(root.slice(start,next).includes(label),'Root item '+(i+1)+' label '+label);
});
assert(!root.includes('new_ui_menu.png'),'Old seven-row bitmap menu is not rendered');
assert(root.includes('aria-label="بخش‌های اصلی برنامه"'));

function submenu(id,items){
 const m=html.match(new RegExp('<section class="home-submenu" id="'+id+'"[\\s\\S]*?<\\/section>'));
 assert(m,'submenu '+id+' exists');
 const block=m[0];
 assert(block.includes('hidden'),'submenu initially hidden');
 const found=[...block.matchAll(/data-menu="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(found,items,'submenu items and order '+id);
 assert(block.includes('data-home-back'),'submenu has Back control');
 return block;
}
const learning=submenu('home-submenu-learning',['tawhid','see_god']);
assert(learning.includes('توحید کاربردی'));
assert(learning.includes('دیدن خدا در زندگی'));
const media=submenu('home-submenu-media',['videos','photo_quotes']);
assert(media.includes('کلیپ‌های تصویری'));
assert(media.includes('عکس‌نوشته'));
assert(html.includes('aria-label="یک جمله مهمان مولا"'),'Wisdom inner title/content remains unchanged');
assert(html.includes('class="guest-heading">یک جمله مهمان مولا</div>'),'Wisdom internal heading remains unchanged');
assert(html.includes('id="wisdom-arabic"')&&html.includes('id="wisdom-persian"'),'Wisdom Arabic/Persian panels remain');

for(const term of [
 'function openHomeSubmenu(key,trigger)',
 'function closeHomeSubmenu()',
 "document.querySelectorAll('[data-home-back]')",
 "document.querySelectorAll('[data-home-placeholder]')",
 'closeSubmenu:closeHomeSubmenu',
 "window.PMM_NEW_UI.closeSubmenu()"
]) assert(html.includes(term),'Home hierarchy behavior: '+term);
assert(/showHome:\(\)=>\{[\s\S]*?resetHomeMenu\(false\)/.test(html),'Returning from legacy pages resets to root');
assert(/closeGallery:\(\)=>\{[\s\S]*?resetHomeMenu\(false\)/.test(html),'Returning from gallery resets to root');
assert(/function leaveWisdom\(\)\{[\s\S]*?resetHomeMenu\(false\)/.test(html),'Returning from Wisdom resets to root');

const css=html.slice(html.indexOf('/* Owner-approved 1.0.10 trial'),html.indexOf('</style>'));
for(const selector of ['.home-menu-grid','.home-menu-card','.home-menu-icon-wrap','.home-submenu','.home-submenu-grid'])
 assert(css.includes(selector),'Style exists: '+selector);
assert(css.includes('PMM Estedad')&&css.includes('#073b78'),'Uses bundled Persian font and existing gold/navy palette');

const online=fs.readFileSync('app/src/main/assets/pmm_online_updates.js','utf8');
for(const key of ['nahj_audio','towhid','see_god','kafi','videos','photo_quotes','guest_sentence_new'])
 assert(online.includes(key),'Existing online section mapping retained: '+key);
const gradle=fs.readFileSync('app/build.gradle','utf8');
assert(gradle.includes("versionCode 26")&&gradle.includes("versionName '10.5.1'"),
 'Official source version/signing configuration not changed');
const manifest=fs.readFileSync('app/src/main/AndroidManifest.xml','utf8');
assert(manifest.includes('PmmKafiAudioService'),'Existing Kafi foreground service manifest retained');
const addon=fs.readFileSync('app/src/main/assets/pmm_kafi_resume_screenoff.js','utf8');
for(const term of ['kafiPlay(','kafiToggle(','kafiStatus(','kafiSeek(','kafiSpeed('])
 assert(addon.includes(term),'Existing Kafi screen-off/resume feature retained: '+term);

// Parse every inline script for syntax errors.
for(const [i,m] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries())
 if(m[1].trim())new vm.Script(m[1],{filename:'inline-'+i+'.js'});

// Exercise the actual submenu open/close functions with a tiny deterministic DOM.
function fakeButton(dataset={}){
 const handlers={},attrs={};
 return {dataset,hidden:false,isConnected:true,attrs,handlers,focused:false,
  addEventListener:(name,fn)=>{handlers[name]=fn;},
  setAttribute:(name,value)=>{attrs[name]=value;},
  focus(){this.focused=true;}
 };
}
const rootPanel={hidden:false};
const learningPanel={hidden:true},mediaPanel={hidden:true};
const learningTrigger=fakeButton({homeSubmenu:'learning'});
const mediaTrigger=fakeButton({homeSubmenu:'media'});
const learningBack=fakeButton(),mediaBack=fakeButton(),placeholder=fakeButton();
const mainScroll={scrollTop:15,scrollHeight:100,clientHeight:100};
const thumb={style:{}};
const scene={dataset:{screen:'home'}},wisdomScroll={scrollHeight:100,clientHeight:100};
const galleryScroll={scrollHeight:100,clientHeight:100};
const notices=[];
const doc={
 getElementById:id=>id==='home-main-menu'?rootPanel:id==='home-submenu-learning'?learningPanel:
  id==='home-submenu-media'?mediaPanel:id==='gallery-scroll'?galleryScroll:null,
 querySelectorAll:q=>q==='.home-submenu'?[learningPanel,mediaPanel]:
  q==='[data-home-submenu]'?[learningTrigger,mediaTrigger]:
  q==='[data-home-back]'?[learningBack,mediaBack]:
  q==='[data-home-placeholder]'?[placeholder]:[]
};
const navContext={document:doc,scene,mainScroll,wisdomScroll,thumb,requestAnimationFrame:fn=>fn(),
 showToast:m=>notices.push(m)};
const navSource=html.slice(html.indexOf('function updateScrollbar(){'),html.indexOf('function stopSound(){'));
const navApi=vm.runInNewContext(navSource+';({closeHomeSubmenu})',navContext);
learningTrigger.handlers.click();
assert.equal(rootPanel.hidden,true,'Learning category hides root menu');
assert.equal(learningPanel.hidden,false,'Learning submenu opens');
assert.equal(mediaPanel.hidden,true,'Media submenu stays hidden');
assert.equal(learningTrigger.attrs['aria-expanded'],'true');
assert.equal(mainScroll.scrollTop,0,'Submenu starts at top');
assert.equal(navApi.closeHomeSubmenu(),true,'Android Back close hook returns handled');
assert.equal(rootPanel.hidden,false,'Close returns to root');
assert.equal(learningPanel.hidden,true);
assert.equal(learningTrigger.attrs['aria-expanded'],'false');
assert.equal(learningTrigger.focused,true,'Focus returns to opening category');
mediaTrigger.handlers.click();
assert.equal(mediaPanel.hidden,false,'Media submenu opens independently');
mediaBack.handlers.click();
assert.equal(rootPanel.hidden,false,'Visible submenu Back button returns to root');
placeholder.handlers.click();
assert.equal(notices.length,1,'Offline course icon has a clear non-destructive placeholder action');
assert(notices[0].includes('مرحله بعدی'));

console.log('PASS: six ordered home items; two correct two-item submenus; Tefal content unchanged; home/Android Back; old media/course/audio mappings and version config preserved; all inline JavaScript parses.');
