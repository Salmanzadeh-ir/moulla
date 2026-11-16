'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const js=fs.readFileSync('app/src/main/assets/pmm_online_updates.js','utf8');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const java=fs.readFileSync('app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java','utf8');
const native=fs.readFileSync('app/src/main/assets/photo_quotes_manifest.js','utf8');

assert(html.includes('<script src="pmm_online_updates.js"></script>'));

// Estedad must ship offline and style inner lesson/part labels only.
const estedadBytes=fs.readFileSync('app/src/main/assets/fonts/Estedad-VF.woff2');
const estedadLicense=fs.readFileSync('app/src/main/assets/fonts/Estedad-OFL.txt','utf8');
assert.equal(estedadBytes.subarray(0,4).toString('ascii'),'wOF2','Bundle actual WOFF2 font');
assert(estedadBytes.length>100000,'Bundle full variable Estedad');
assert(estedadLicense.includes('SIL OPEN FONT LICENSE Version 1.1'),'Bundle original Estedad license');
const cssFrom=html.indexOf('/* Owner-approved Estedad for the inner navigation');
const estedadCss=html.slice(cssFrom,html.indexOf('</style>',cssFrom));
assert(cssFrom>0&&estedadCss.includes("fonts/Estedad-VF.woff2"));
assert(estedadCss.includes('font-weight:100 900'));
for(const selector of ['#stage .content-view','#stage .content-view .session-label','#stage .content-view button','#stage #legacy-heading']){
 assert(estedadCss.includes(selector),'Estedad scoped to: '+selector);
}
assert(!estedadCss.includes('#wisdom-scroll'),'Do not modify owner-approved Wisdom reading typography');
assert(html.includes('class="session-label" lang="fa">جلسه '),'Legacy section session labels remain');
assert(html.includes('nahjPartName(i+1)'),'Nahj part names remain');
const versionGradle=fs.readFileSync('app/build.gradle','utf8');
assert(/versionCode 20\s+versionName '1.0.3'/.test(versionGradle),'Version must progress monotonically');


// Only owner-approved three-line-or-shorter wisdoms may enter the draw.
// Exercise layout-dependent selection through a mocked layout engine (no guessed char counts).
const entireWisdomBank=fs.readFileSync('app/src/main/assets/hikam_bank.js','utf8');
const bankCtx={window:{}};vm.runInNewContext(entireWisdomBank,bankCtx);
assert.equal(bankCtx.window.PMM_HIKMAT_ALL.length,489,'All 480 wisdoms and 9 gharaib must remain intact');
const shortLogic=html.slice(html.indexOf('let shortWisdoms=[],shortWisdomWidth=-1;'),html.indexOf('function saveBag(){'));
assert(shortLogic.includes("getComputedStyle(element).lineHeight"),'Measure actual rendered lines');
assert(shortLogic.includes('w.arabic)&&fits(persian,w.persian)'),'Check Arabic and Persian separately');
assert(shortLogic.includes("scene.getBoundingClientRect().width"),'Use actual iwan dimensions');
const styleValues=new Map([['--pmm-wisdom-ar-size','31px'],['--pmm-wisdom-fa-size','27px']]);
const savedStyle={
 getPropertyValue:key=>styleValues.get(key)||'',
 setProperty:(key,value)=>styleValues.set(key,value),
 removeProperty:key=>styleValues.delete(key)
};
const makeText=(kind,lineHeight)=>({
 kind,textContent:'original-'+kind,
 getBoundingClientRect(){
   const lines=this.textContent.includes('LONG')?4:3;
   return {height:lines*lineHeight};
 }
});
const arEl=makeText('ar',44),faEl=makeText('fa',34);
const testIntro={hidden:false},testDrawing={hidden:true},testResult={hidden:true,style:{visibility:'visible'}};
const shortCandidates=[
 {id:'ok',arabic:'short',persian:'short'},
 {id:'long-ar',arabic:'LONG Arabic',persian:'short'},
 {id:'long-fa',arabic:'short',persian:'LONG Persian'},
 {id:'long-both',arabic:'LONG Arabic',persian:'LONG Persian'}
];
const threeLineCtx={
 wisdomScroll:{getBoundingClientRect:()=>({width:250}),style:savedStyle},
 wisdomIntro:testIntro,wisdomDrawing:testDrawing,wisdomResult:testResult,
 document:{getElementById:id=>id==='wisdom-arabic'?arEl:faEl},
 scene:{getBoundingClientRect:()=>({width:390})},
 getComputedStyle:el=>({lineHeight:(el.kind==='ar'?44:34)+'px'}),
 wisdoms:shortCandidates,Number,Math
};
const qualifying=vm.runInNewContext(shortLogic+';threeLineWisdomCandidates()',threeLineCtx);
assert.deepEqual(Array.from(qualifying,x=>x.id),['ok'],'Exclude long Arabic or Persian, retain 3-line entries');
assert.equal(testIntro.hidden,false,'Restore existing invitation state after measuring');
assert.equal(testDrawing.hidden,true,'Restore animation state after measuring');
assert.equal(testResult.hidden,true,'Restore selected wisdom state after measuring');
assert.equal(testResult.style.visibility,'visible');
assert.equal(arEl.textContent,'original-ar','Never alter original Arabic panel');
assert.equal(faEl.textContent,'original-fa','Never alter original Persian panel');
assert.equal(savedStyle.getPropertyValue('--pmm-wisdom-ar-size'),'31px','Restore user zoom');
assert.equal(savedStyle.getPropertyValue('--pmm-wisdom-fa-size'),'27px','Restore Persian zoom');
const drawCode=html.slice(html.indexOf('function refillBag(candidates){'),html.indexOf('recoverBag();',html.indexOf('function refillBag(candidates){')));
assert(drawCode.includes('bag=bag.filter(id=>eligibleIds.has(id))'),'Purge old long entries from saved draw bag');
assert(drawCode.includes('bag=candidates.map(w=>w.id)'),'Refill without unapproved long entries');
const drawAction=html.slice(html.indexOf('async function startWisdomDraw(){'),html.indexOf('// V16: independent copy'));
assert(drawAction.includes("document.fonts.load('400 24px"),'Wait for the approved Arabic font');
assert(drawAction.includes("document.fonts.load('600 20px"),'Wait for the approved Persian font');
assert(drawAction.includes('const finalWisdom=pickWisdom(candidates)'));
assert(drawAction.includes('let preview=candidates[randInt(candidates.length)]'));
assert(drawAction.includes("wisdoms.length!==489"),'Keep original complete bank integrity check');

// Source-only Nahj MP3 catalog: exact URL count, exact joint filenames and nine blanks.
const audioJs=fs.readFileSync('app/src/main/assets/nahj_audio_links.js','utf8');
assert(html.includes('<script src="nahj_audio_links.js"></script>'));
const audioContext={window:{}};
vm.runInNewContext(audioJs,audioContext);
const nahjCatalog=audioContext.window.PMM_NAHJ_AUDIO_DATA;
const groupItems=nahjCatalog.items,links=nahjCatalog.parts;
assert.equal(groupItems.sermons.length,237,'Original 241 sermon numbers include three shared recordings');
assert.equal(groupItems.letters.length,79);
assert.equal(groupItems.wisdoms.length,487,'480 wisdom numbers, two shared recordings, nine pending gharaib');
assert.equal(Object.values(links).reduce((n,arr)=>n+arr.length,0),1019);
const allLinks=Object.values(links).flat();
assert.equal(new Set(allLinks).size,1019,'Every source MP3 is represented once');
assert(allLinks.every(u=>u.startsWith('https://dl.kazeminia110.ir/Audio/nahj-al-balaghe/tartibi/')));
for(const [group,id,title,filename] of [
 ['sermons','sermon-13-14','خطبه ۱۳ و ۱۴','khotbe/khotbe 13 & 14.mp3'],
 ['sermons','sermon-52-53','خطبه ۵۲ و ۵۳','khotbe/khotbe 52 & 53.mp3'],
 ['sermons','sermon-58-59-60','خطبه ۵۸ و ۵۹ و ۶۰','khotbe/khotbe 58 & 59 & 60.mp3'],
 ['wisdoms','wisdom-40-41','حکمت ۴۰ و ۴۱','hekmat/hekmat 40 & 41.mp3'],
 ['wisdoms','wisdom-111-112','حکمت ۱۱۱ و ۱۱۲','hekmat/hekmat 111& 112.mp3']
]){
 assert.equal(groupItems[group].find(x=>x.id===id).title,title);
 assert.equal(links[id][0],'https://dl.kazeminia110.ir/Audio/nahj-al-balaghe/tartibi/'+filename);
 assert.equal(links[id].length,1);
}
assert.equal(links['sermon-1'].length,9);
assert.equal(links['letter-31'].length,31);
assert.equal(links['letter-53'].length,27);
assert.equal(links['wisdom-192'].length,1);
const wisdomOrder=groupItems.wisdoms;
const beforeGh=wisdomOrder.findIndex(x=>x.id==='wisdom-260');
const afterGh=wisdomOrder.findIndex(x=>x.id==='wisdom-261');
assert.equal(afterGh-beforeGh,10);
for(let i=1;i<=9;i++){
 assert.equal(wisdomOrder[beforeGh+i].id,'gharaib-'+i);
 assert.deepEqual(Array.from(links['gharaib-'+i]),[],'Pending gharaib must not have fabricated audio');
}
const nahjRenderList=html.slice(html.indexOf('function renderList(){'),html.indexOf('function drawRows(){'));
assert(nahjRenderList.includes('renderNahjAudioCatalog()'));
assert(!nahjRenderList.includes('نمایش آرشیو سایت')&&!nahjRenderList.includes('باز کردن آرشیو ایتا'));
const nahjInlineEngine=html.slice(html.indexOf('const NAHJ_AUDIO_SPEEDS='),html.indexOf('function renderNahjAudioCatalog(){'));
const nahjInlinePage=html.slice(html.indexOf('function renderNahjAudioCatalog(){'),html.indexOf('function renderList(){'));
const speedVm=vm.runInNewContext(nahjInlineEngine+
  ';({speeds:NAHJ_AUDIO_SPEEDS,time:nahjAudioTime,allowed:nahjAudioIsOwnerURL})',{
   localStorage:{getItem(){return '1.5'}},contents:null,
   fa:n=>String(n).replace(/[0-9]/g,x=>'۰۱۲۳۴۵۶۷۸۹'[Number(x)])
  });
assert.deepEqual(Array.from(speedVm.speeds),[0.75,1,1.25,1.5,2]);
assert.equal(speedVm.time(65),'۱:۰۵','Persian duration labels');
assert(speedVm.allowed(links['sermon-1'][0]),'Only owner-provided URL roots can play');
assert(!speedVm.allowed('https://evil.example/fake.mp3'),'Reject unapproved hosts');
assert(nahjInlinePage.includes('attachNahjInlineAudio()'),'Inline player mounted within the selected entry');
assert(nahjInlinePage.includes('class="nahj-part-media" preload="none" playsinline'));
assert(nahjInlinePage.includes("safe(encodeURI(url))"),'Exact provided MP3 URL, encoded safely');
assert(!nahjInlinePage.includes("setState('player','nahj'"),'No fourth navigation step for Nahj audio');
assert(nahjInlineEngine.includes('other.pause()'),'One playing audio at a time');
assert(nahjInlineEngine.includes("localStorage.setItem(NAHJ_AUDIO_SPEED_KEY"),'Selected speed persists');
assert(nahjInlineEngine.includes('audio.playbackRate=nahjAudioSpeed'));
assert(nahjInlineEngine.includes('if(!audio.getAttribute('),'Audio URL loaded only after pressing Play');
const nahjNav=html.slice(html.indexOf('function setState(mode,s=null,v=null){'),html.indexOf('function render(){'));
assert(nahjNav.includes('stopNahjInlineAudio()'),'Leaving inner Nahj page pauses audio');
const nahjBack=html.slice(html.indexOf('function goBack(){'),html.indexOf('// V10.0:',html.indexOf('function goBack(){')));
assert(nahjBack.includes('item?.nahjReturn')&&nahjBack.includes('item.nahjEntry'));

assert(html.includes('pmm_online_updates.css'));
const aboutBlock=html.slice(html.indexOf('function renderAbout(){'),html.indexOf('function renderBiography(){'));
assert(aboutBlock.includes('window.PMMNative.getAppVersion()'),'About must read installed APK versionName');
assert(aboutBlock.indexOf('class="about-version"')>aboutBlock.indexOf('class="gallery-viewport"'),
  'Version must come after the gallery inside About scroll');
assert(java.includes('getPackageInfo(MainActivity.this.getPackageName(), 0).versionName'),
  'Native getter must use APK metadata');
assert(native.includes('Object.freeze(['),'The original photo source remains immutable');
assert(html.includes('window.PMM_IMAGE_ALBUM=Array.isArray(window.PMM_PHOTO_QUOTES)?window.PMM_PHOTO_QUOTES.slice():[];'));
assert(html.includes('addOnlinePhotos:function(urls)'));
assert(java.includes('settings.setCacheMode(WebSettings.LOAD_NO_CACHE)'));
assert(java.includes('settings.setAllowUniversalAccessFromFileURLs(false)'));
assert(java.includes('checkContentUpdates();'));
assert(java.includes('PMM_CONTENT_MANIFEST_URL = "https://pmm-content-updates.kazeminia-mohamad110.workers.dev/api/manifest"'),'Use only owner-confirmed HTTPS content endpoint');
assert(!/localStorage\.setItem\([^,]+,\s*JSON\.stringify\(manifest\)/.test(js));

class Elem {
 constructor(id){this.id=id;this.hidden=true;this.disabled=false;this.isConnected=true;this.children=[];this.events={};this.className='';this.textContent='';}
 setAttribute(){}
 appendChild(x){this.children.push(x);return x}
 addEventListener(k,handler){(this.events[k]??=[]).push(handler)}
 focus(){this.focused=true}
 querySelector(){return null}
 click(){for(const handler of this.events.click||[])handler({preventDefault(){}})}
}
const store=new Map(),storage={
 getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))
};
function start(){
 const ids=new Map();for(const id of ['scene','pmm-update-summary','pmm-update-accept','pmm-update-later','wisdom-scroll'])ids.set(id,new Elem(id));
 ids.get('scene').hidden=false;
 const body=new Elem('wisdom-body');
 let nav=0,photoCalls=[],renderCalls=0;
 const document={
  activeElement:null,getElementById:id=>ids.get(id)||null,
  createElement:name=>new Elem(name),
  querySelector:selector=>selector==='#wisdom-scroll .wisdom-body'?body:null
 };
 const window={PMM_UPDATE_ORIGIN:'https://pmm-content.example',
  PMM_PHOTO_QUOTES_VIEW:{addOnlinePhotos:urls=>photoCalls.push(...urls)},
  PMM_NEW_UI:{showToast(){}}
 };
 const VIDEO_CLIPS=[];
 const ctx={document,window,localStorage:storage,Set,URL,console,
  Object,Array,Number,String,Math,parseInt,
  DATA:{towhid:[{number:1}],life:[],kafi:[]},VIDEO_CLIPS,
  contents:new Elem('contents'),screen:'home',section:'',
  renderList(){},renderClips(){},render(){renderCalls++},galleryRenderGrid(){},
  openEitaa(){},setState(){},goBack(){nav++}
 };
 vm.runInNewContext(js,ctx);
 return {ctx,ids,window,store,VIDEO_CLIPS,photoCalls,nav:()=>nav};
}
const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const photo='https://pmm-content.example/media/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const content={schema:1,revision:1,items:[
 {id,revision:1,section:'photo_quotes',title:'عکس‌نوشته معتبر',url:photo}
]};
const a=start();
a.window.PMM_CONTENT_UPDATES.receiveManifest(content);
assert.equal(a.window.PMM_CONTENT_UPDATES.isVisible(),true);
assert.equal(a.photoCalls.length,0,'no media before user approval');
a.ids.get('pmm-update-later').click();
assert.equal(a.window.PMM_CONTENT_UPDATES.isVisible(),false);
assert.equal(store.size,0,'Later must not persist the content revision');
a.window.PMM_CONTENT_UPDATES.receiveManifest(content);
assert.equal(a.window.PMM_CONTENT_UPDATES.isVisible(),true,'Later must prompt again');
a.ctx.goBack();
assert.equal(a.window.PMM_CONTENT_UPDATES.isVisible(),false,'Back dismisses prompt');
assert.equal(a.nav(),0,'Back must not exit/navigate when dialog shown');
a.window.PMM_CONTENT_UPDATES.receiveManifest(content);
a.ids.get('pmm-update-accept').click();
assert.equal(a.window.PMM_CONTENT_UPDATES.isVisible(),false);
assert.equal(store.get('pmm_content_accepted_revision_v1'),'1');
assert.deepEqual(a.photoCalls,[photo]);
a.window.PMM_CONTENT_UPDATES.receiveManifest(content);
assert.equal(a.photoCalls.length,1,'No duplicates after accepting');
assert.equal(a.window.PMM_CONTENT_UPDATES.isVisible(),false,'Accepted version must not re-prompt');
assert.equal(store.size,1,'Only accepted metadata is persisted');
const b=start();
b.window.PMM_CONTENT_UPDATES.receiveManifest(content);
assert.equal(b.window.PMM_CONTENT_UPDATES.isVisible(),false,'Same version on next app launch');
assert.deepEqual(b.photoCalls,[photo],'Fresh session rehydrates online entries into RAM only');
const invalid={schema:1,revision:2,items:[
 {id,revision:2,section:'photo_quotes',title:'نامعتبر',url:'javascript:alert(1)'}
]};
b.window.PMM_CONTENT_UPDATES.receiveManifest(invalid);
assert.equal(b.window.PMM_CONTENT_UPDATES.isVisible(),false,'Reject malicious URLs');
const next={schema:1,revision:2,items:[
 ...content.items,
 {id:'cccccccc-cccc-4ccc-cccc-cccccccccccc',revision:2,section:'videos',title:'کلیپ جدید',url:'https://www.aparat.com/v/test123'}
]};
b.window.PMM_CONTENT_UPDATES.receiveManifest(next);
assert.equal(b.window.PMM_CONTENT_UPDATES.isVisible(),true);
b.ids.get('pmm-update-accept').click();
assert.equal(b.VIDEO_CLIPS.length,1);
assert.equal(store.get('pmm_content_accepted_revision_v1'),'2');
console.log('PASS: update modal, Later, Back, acceptance, no media storage, rehydration, validation, video links');
