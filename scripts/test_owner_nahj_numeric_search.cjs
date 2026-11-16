// Read-only regression checks for the independent owner-requested Nahj search trial.
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const catalogSource=fs.readFileSync('app/src/main/assets/nahj_audio_links.js','utf8');
const catalogContext={window:{}};
vm.runInNewContext(catalogSource,catalogContext,{filename:'nahj_audio_links.js'});
const data=catalogContext.window.PMM_NAHJ_AUDIO_DATA;
assert(data,'original audio catalog must load');
assert.equal(Object.values(data.parts).reduce((sum,parts)=>sum+parts.length,0),1019,'all owner URLs preserved');
const start=html.indexOf('function pmmParseNahjNumber(raw){');
const end=html.indexOf('\n// Stable per-entry IDs',start);
assert(start>=0 && end>start,'find exact isolated search helpers in app');
const context={NAHJ_AUDIO_ITEMS:data.items};
vm.runInNewContext(html.slice(start,end),context,{filename:'nahj_search_trial.js'});
const parse=context.pmmParseNahjNumber,find=context.pmmFindNahjRecord;
const farsi=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const arabic=n=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[Number(d)]);
for(const [group,max] of [['sermons',241],['letters',79],['wisdoms',480]]){
  for(let n=1;n<=max;n++){
    const original=data.items[group].find(r=>r.kind!=='gharaib' && r.id.split('-').slice(1).some(p=>Number(p)===n));
    assert(original,group+' record '+n+' missing in approved catalog');
    for(const input of [String(n),farsi(n),arabic(n)]){
      const match=find(group,input);
      assert(match&&match.id===original.id,group+' '+input+' must go to actual catalog record');
    }
  }
}
for(const [group,a,b] of [['sermons',13,14],['sermons',52,53],['sermons',58,59],['sermons',59,60],['wisdoms',40,41],['wisdoms',111,112]]){
 assert.equal(find(group,a).id,find(group,farsi(b)).id,'shared audio item mapping');
}
for(const n of ['', '۱۲.۵','40abc','۴۰ ۴۱','۰','-1','١٢/٣', '1e2']){
 assert.equal(parse(n),null,'reject non-exact numeral: '+n);
}
assert.equal(find('wisdoms','۴۸۱'),null,'nine Gharib are not fabricated wisdom records');
assert.equal(find('letters','۸۰'),null,'out-of-range letter not fabricated');
assert.equal(find('wisdoms','۵۰۰۰'),null,'out-of-range numerical input yields no catalog record');
assert.equal(find('sermons','۲۴۲'),null,'out-of-range sermon not fabricated');
assert.equal(find('missing','۱'),null,'unknown group must be rejected');
assert(html.includes('id="about-biography"><span class="about-entry-icon">❖</span><span>معرفی‌نامه</span>'),'inner about entry renamed');
assert(html.includes('id="home-about" aria-label="درباره ما">درباره ما</button>'),'home about entry remains');
assert(html.includes('id="nahj-find-button"') && html.includes('id="nahj-find-panel"') && html.includes("pmmSyncNahjFinder()"),'search UI wired');
for(const [index,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
 if(match[1].trim())new vm.Script(match[1],{filename:'index_inline_'+index+'.js'});
}
// Display regression: the legacy pane's .top-action is intentionally invisible.
// Search MUST be placed alongside the real, visible legacy Back, not in the hidden pane.
const realBack='<button type="button" id="legacy-back-top" class="legacy-back"';
const visibleSearch='<button type="button" id="nahj-find-button" class="legacy-back"';
const backAt=html.indexOf(realBack),buttonAt=html.indexOf(visibleSearch);
assert(backAt>=0 && buttonAt>backAt && buttonAt-backAt<400,'finder mirrors real visible back button');
assert(!html.includes('class="top-action" id="nahj-find-button"'),'finder must not inherit hidden .top-action');
assert(html.includes('#stage #list-pane .top-action{display:none!important}'),'regression reproduces legacy hidden top-actions');
assert(html.includes('left:9.6%;top:33.54%;width:11.75%;height:5.1%;z-index:56'),'search mirrors Back button geometry');
assert(html.includes('#stage #nahj-find-button[hidden]'),'finder hidden only outside chosen Nahj categories');

// Behavioral regression: visibility changes when entering/exiting each Nahj subcategory.
const syncStart=html.indexOf('function pmmSyncNahjFinder(){');
const syncEnd=html.indexOf('function renderNahjAudioCatalog(){',syncStart);
assert(syncStart>=0 && syncEnd>syncStart,'search display helper present');
const elements={
 'nahj-find-button':{hidden:true,attrs:{},setAttribute(name,value){this.attrs[name]=value;}},
 'nahj-find-panel':{hidden:true},
 'nahj-find-input':{value:'old'},
 'nahj-find-status':{textContent:'old'},
 'nahj-find-label':{textContent:''}
};
const state={
 screen:'list',section:'nahj',item:{nahjGroup:'sermons'},
 NAHJ_AUDIO_GROUPS:[{id:'sermons',singular:'خطبه'},{id:'letters',singular:'نامه'},{id:'wisdoms',singular:'حکمت'}],
 document:{getElementById:id=>elements[id]}
};
vm.runInNewContext(html.slice(syncStart,syncEnd),state,{filename:'nahj_search_visibility.js'});
for(const group of ['sermons','letters','wisdoms']){
 state.screen='list';state.section='nahj';state.item={nahjGroup:group};
 state.pmmSyncNahjFinder();
 assert.equal(elements['nahj-find-button'].hidden,false,'search visible on '+group);
 assert.equal(elements['nahj-find-panel'].hidden,true,'search panel initially closed');
}
state.screen='about';state.pmmSyncNahjFinder();
assert.equal(elements['nahj-find-button'].hidden,true,'search hidden outside Nahj');
state.screen='list';state.section='nahj';state.item=null;state.pmmSyncNahjFinder();
assert.equal(elements['nahj-find-button'].hidden,true,'search hidden on Nahj category selection');

console.log('PASS: 241 sermons, 79 letters, 480 wisdoms (Farsi/Arabic/English digits), shared entries, missing cases, navigation hooks, inline JS syntax, 1019 audio URLs.');
