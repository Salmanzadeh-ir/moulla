'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const js=fs.readFileSync('app/src/main/assets/pmm_online_updates.js','utf8');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const java=fs.readFileSync('app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java','utf8');
const native=fs.readFileSync('app/src/main/assets/photo_quotes_manifest.js','utf8');

assert(html.includes('<script src="pmm_online_updates.js"></script>'));
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
