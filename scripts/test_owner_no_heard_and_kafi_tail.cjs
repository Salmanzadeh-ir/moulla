/* Regression: owner retired "این جلسه را شنیدم" throughout ALL lesson players and resume cards. */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const match=html.match(/const DATA = ([^\n]+)\nconst APPROVED_IMAGE_01/);
assert(match,'owner data catalog exists');
const catalog=JSON.parse(match[1]);
const base='https://dl.kazeminia110.ir/Audio/kafi/kafi ';
assert.equal(catalog.kafi.length,55,'one Kafi introduction plus 54 numbered sessions remain');
assert.equal(catalog.kafi[0].title,'کافی شناسی','standalone intro preserved');
for(let displayed=51;displayed<=55;displayed++){
 const track=displayed-1;
 assert.equal(catalog.kafi[displayed-1].url,base+track+'.mp3',
  'last playable item '+displayed+' must point to track '+track);
 assert.equal(catalog.kafi[displayed-1].title,'جلسه '+String(track).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[+d]),
  'visible label must be shifted by one item');
}
for(let broken=55;broken<=59;broken++){
 assert(!catalog.kafi.some(x=>x.url===base+broken+'.mp3'),'404 file excluded: '+broken);
}
assert.equal(new Set(catalog.kafi.map(x=>x.url)).size,55,'each retained URL unique');
for(const forbidden of [
 'این جلسه را شنیدم','هنوز کامل نشنیدم','شنیده شد — لغو',
 ' — ✓ شنیده شد','player-mark-heard','data-mark-last',
 'markHeard(','last.heard','played.heard'
]) assert(!html.includes(forbidden),'obsolete listened control remains: '+forbidden);
assert(html.includes("['towhid','life','kafi']"),'original lesson progress groups still intact');
assert(html.includes('data-open-last'),'resume existing lesson still available');
assert(html.includes('data-resume-dismiss-lesson'),'dismiss reminder still available');
assert(html.includes("document.getElementById('player-back').addEventListener('click',()=>goBack());"),
 'original Back preserved');
assert(html.includes("if(section==='kafi'&&pmmKafiAudioIsOwnerURL(link))pmmAttachKafiAudio();"),
 'Kafi speed player preserved');
assert(html.includes('function attachNahjInlineAudio(groupId,entryId)'),'Nahj audio remains');
assert(html.includes('function pmmStopKafiAudio()'),'Kafi audio cleanup preserved');
assert(html.includes('pmmPhotoWheelOrder=order.slice()'),'photo download carousel remains');
assert(html.includes("document.getElementById('pmm-clip-save')"),'video download remains');
for(const [i,script] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries())
 if(script[1].trim())new vm.Script(script[1],{filename:'app/index inline '+i});
console.log('PASS: no obsolete listened buttons, labels or handlers across lesson sections; Kafi Shenasi and exactly 54 playable lessons, 404 tail excluded; resume and Nahj/gallery remain intact; valid inline JavaScript.');
