'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const java=fs.readFileSync('app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java','utf8');
const manifest=fs.readFileSync('app/src/main/AndroidManifest.xml','utf8');
const start=html.indexOf('// One Back click handler for both new and legacy inner-page routes.');
const end=html.indexOf("window.addEventListener('focus',resumed);",start);
assert(start>=0&&end>start,'Single Back/Exit controller present');
const code=html.slice(start,end);
class Element{
 constructor(id){this.id=id;this.hidden=false;this.disabled=false;}
 closest(q){return q.split(',').some(x=>x.trim()==='#'+this.id)?this:null;}
}
for(const route of ['gallery','wisdom','list','about','biography','photo','player']){
 const listeners={},back=new Element('back-top'),oldBack=new Element('legacy-back-top'),
       exit=new Element('exit'),oldExit=new Element('home-exit');
 const stage={hidden:['gallery','wisdom'].includes(route)};
 const scene={hidden:!stage.hidden,dataset:{screen:route,navMode:'inner'}};
 back.hidden=!stage.hidden;oldBack.hidden=stage.hidden;exit.hidden=true;
 const menu=new Element('home-main-menu');menu.hidden=true;
 const elements={'back-top':back,'legacy-back-top':oldBack,'exit':exit,'home-exit':oldExit,'home-main-menu':menu};
 let t=10000,nav=0,exits=0;
 const timers=[];
 const window={PMM_EXIT_AUTHORIZED_AT:0,PMM_LAST_BACK_NAV_AT:0,
   PMMNative:{exitApp(){exits++}},PMM_NEW_UI:{showToast(){}}};
 const document={activeElement:null,addEventListener(k,fn){(listeners[k]??=[]).push(fn)},
   getElementById(id){return elements[id]}};
 const ctx={Element,scene,stage,window,document,screen:route,
   performance:{now:()=>t},Date:{now:()=>t},toast(){},
   goBack(){nav++;window.PMM_LAST_BACK_NAV_AT=t;window.PMM_EXIT_AUTHORIZED_AT=0;
     exit.disabled=true;oldExit.disabled=true;
     timers.push({at:t+1000,fn(){exit.disabled=false;oldExit.disabled=false}});
     ctx.screen='home';scene.hidden=false;stage.hidden=true;scene.dataset.screen='home';scene.dataset.navMode='home-root';menu.hidden=false;
     back.hidden=true;oldBack.hidden=true;exit.hidden=false;}};
 vm.runInNewContext(code,ctx);
 function emit(type,target,detail=1,trusted=true){
   const e={type,target,detail,isTrusted:trusted,preventDefault(){this.prevented=true},
     stopImmediatePropagation(){this.stopped=true}};
   for(const fn of listeners[type]||[]){fn(e);if(e.stopped)break;}
   return e;
 }
 function advance(ms){t+=ms;for(const task of timers.slice()){if(task.at<=t){task.fn();timers.splice(timers.indexOf(task),1)}}}
 const original=stage.hidden?back:oldBack;
 emit('pointerdown',exit);emit('click',exit,1,true);
 assert.equal(exits,0,route+': Exit MUST NOT work while any inner page is active');
 emit('pointerdown',original);emit('touchstart',original);
 assert.equal(nav,0,route+': Back must not route on pointerdown');
 emit('click',original);
 assert.equal(nav,1,route+': one click -> one navigation');
 assert.equal(exits,0,route+': Back must not exit');
 emit('click',exit,0,true);
 assert.equal(exits,0,route+': immediate re-targeted click blocked');
 advance(1200);
 emit('click',exit,0,true);
 assert.equal(exits,0,route+': delayed ghost click without focus blocked');
 emit('pointerdown',exit);emit('touchstart',exit);emit('click',exit,1,true);
 if(exits!==1){
   const debug=vm.runInNewContext("({screen,stageHidden:stage.hidden,sceneHidden:scene.hidden,sceneNavMode:scene.dataset.navMode,sceneScreen:scene.dataset.screen,menuHidden:document.getElementById('home-main-menu').hidden,exitHidden:document.getElementById('exit').hidden,exitDisabled:document.getElementById('exit').disabled,hasExitGesture:exitStart===document.getElementById('exit'),exitStartAt,now:Date.now(),lastBackAt:window.PMM_LAST_BACK_NAV_AT,exitOnHome:exitOnHome(document.getElementById('exit'))})",ctx);
   console.log('HOME_EXIT_DIAGNOSTIC',route,debug);
 }
 assert.equal(exits,1,route+': deliberate NEW Exit gesture allowed');
}
assert(!html.includes("document.getElementById('exit').addEventListener('click'"),
 'No unguarded Exit listener');
assert(!html.includes("document.addEventListener('touchend',handleOnScreenBack"),
 'Back must not run before click completes');
assert(java.includes('OnBackInvokedCallback')&&java.includes('registerOnBackInvokedCallback'),
 'Android 13+ back callback registered');
assert(manifest.includes('android:enableOnBackInvokedCallback="true"'),
 'Predictive Android Back opted in');
const navigation=java.match(/private void handleBackNavigation\(\)\s*\{[\s\S]*?\n    \}/);
assert(navigation&&!navigation[0].includes('finish('),'Hardware Back must never exit Activity');
assert((java.match(/finish\(\)/g)||[]).length===1,'Only the approved Exit bridge may finish');
assert(java.includes('PMM_EXIT_AUTHORIZED_AT'),'Native Exit requires a deliberate gesture authorization');
console.log('PASS: 7 routes; no ghost Exit; Android back cannot finish; explicit Exit only');
