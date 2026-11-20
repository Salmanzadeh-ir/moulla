'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync('app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java','utf8');
const manifest=fs.readFileSync('app/src/main/AndroidManifest.xml','utf8');
const js=fs.readFileSync('app/src/main/assets/pmm_online_updates.js','utf8');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
assert(manifest.includes('android.permission.INTERNET'));
assert(manifest.includes('android.permission.POST_NOTIFICATIONS'));
assert(manifest.includes('android.permission.RECEIVE_BOOT_COMPLETED'));
assert(app.includes('private void checkContentUpdates()'));
assert(app.includes('private void maybeStartContentUpdates()'));
assert(app.includes('private boolean contentCheckStarted = false;'));
assert(app.includes('private boolean notificationPermissionFlowOpen = false;'));
assert(app.includes('contentConsentDeclinedThisLaunch'));
assert(app.includes('getSharedPreferences(CONTENT_OPT_IN_PREFS, MODE_PRIVATE)'));
assert(app.includes('.getBoolean(CONTENT_ALLOWED, false)'));
assert(app.includes('.putBoolean(CONTENT_ALLOWED, true)'));
assert(app.includes('contentCheckStarted = true;\n            checkContentUpdates();'));
assert(app.includes('contentPageReady = true;'));
assert(app.includes('maybeStartContentUpdates();'));
assert(app.includes('initializeReminderPermissionIfNeeded();'));
assert(app.includes('notificationPermissionFlowOpen = false;\n                    maybeStartContentUpdates();'));
assert(app.includes('notificationPermissionFlowOpen = false;\n            maybeStartContentUpdates();'));
assert(app.includes('connection.setInstanceFollowRedirects(false)'));
assert(app.includes('PMM_MAX_MANIFEST_BYTES = 1024 * 1024'));
assert(app.includes('JSONObject.quote(body)'));
assert(app.includes('settings.setAllowUniversalAccessFromFileURLs(false)'));
assert(app.includes('settings.setMediaPlaybackRequiresUserGesture(true)'));
assert(html.includes('<script src="pmm_online_updates.js"></script>'));
assert(html.includes('<link rel="stylesheet" href="pmm_online_updates.css">'));
assert(!/fetch\s*\([^)]*\)\s*;\s*eval\s*\(/.test(js));
class Node {
  constructor(id){this.id=id;this.hidden=true;this.textContent='';this.children=[];this.events={};this.attributes={};this.disabled=false;this.isConnected=true}
  setAttribute(k,v){this.attributes[k]=v}
  appendChild(child){this.children.push(child);return child}
  replaceChildren(...children){this.children=children}
  addEventListener(k,fn){this.events[k]=fn}
  focus(){}
  click(){if(this.events.click)this.events.click()}
}
const storage=new Map();
const elements=new Map();
for(const name of ['scene','pmm-update-summary','pmm-update-accept','pmm-update-later','wisdom-scroll'])elements.set(name,new Node(name));
elements.get('scene').hidden=false;
const document={
  activeElement:null,createElement(tag){return new Node(tag)},
  getElementById(id){return elements.get(id)||null},
  querySelector(){return null},
};
const photos=[];
const window={
  PMM_UPDATE_ORIGIN:'https://owner-content.example',
  PMM_PHOTO_QUOTES_VIEW:{addOnlinePhotos:(urls)=>photos.push(...urls)},
  PMM_NEW_UI:{showToast:()=>{}},
};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
const globals={document,window,localStorage,Set,URL,console,
  renderList:()=>{},renderClips:()=>{},setState:()=>{},openEitaa:()=>{},
  contents:new Node('contents'),section:'',screen:'home',VIDEO_CLIPS:[],
  goBack:()=>{},render:()=>{},
};
vm.runInNewContext(js,globals);
assert(window.PMM_CONTENT_UPDATES);
const id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const photo='https://owner-content.example/media/bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const good={schema:1,revision:1,items:[{id,revision:1,section:'photo_quotes',title:'عکس تایید مالک',url:photo}]};
window.PMM_CONTENT_UPDATES.receiveManifest(good);
assert.equal(window.PMM_CONTENT_UPDATES.isVisible(),true,'Fresh update should offer choice');
assert.deepEqual(photos,[],'No media before click');
elements.get('pmm-update-later').click();
assert.equal(storage.size,0,'Later must not record acceptance');
window.PMM_CONTENT_UPDATES.receiveManifest(good);
assert.equal(window.PMM_CONTENT_UPDATES.isVisible(),true,'Later must allow a new offer');
elements.get('pmm-update-accept').click();
assert.equal(window.PMM_CONTENT_UPDATES.isVisible(),false);
assert.equal(storage.get('pmm_content_accepted_revision_v1'),'1');
assert.deepEqual(photos,[photo],'Exactly one approved online photo');
window.PMM_CONTENT_UPDATES.receiveManifest(good);
assert.equal(window.PMM_CONTENT_UPDATES.isVisible(),false,'Never re-prompt accepted revision');
assert.deepEqual(photos,[photo],'Do not duplicate content');
window.PMM_CONTENT_UPDATES.receiveManifest({schema:1,revision:2,items:[{id,revision:2,section:'photo_quotes',title:'invalid',url:'javascript:alert(1)'}]});
assert.equal(window.PMM_CONTENT_UPDATES.isVisible(),false,'Reject malicious URLs');
assert.equal(storage.get('pmm_content_accepted_revision_v1'),'1');
console.log('PASS: owner public-manifest integration; no network before consent; notification consent independent; online content offered and applied only by user; no autoplay or untrusted URLs.');
