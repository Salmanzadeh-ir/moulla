/* Owner-approved Kafi MP3 catalog 1-60, preserving every supplied link and excluding progress clip. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const album=html.match(/const DATA = ([^\n]+)\nconst APPROVED_IMAGE_01/);
assert(album,'original inline DATA JSON must be present');
const DATA=JSON.parse(album[1]);
const kafi=DATA.kafi;
assert.equal(kafi.length,60,'60 owner-approved Kafi sessions');
assert.equal(Object.keys(DATA).sort().join(','),'kafi,life,nahj,towhid','other original sections still present');
const base='https://dl.kazeminia110.ir/Audio/kafi/';
const intro=base+'kafi kotobe arbae.mp3';
const forbidden=base+'ravande edame dare kar.mp3';
assert.equal(kafi[0].url,intro,'Kotobe Arbae is exactly session 1');
for(let n=1;n<=60;n++){
 const item=kafi[n-1];
 const expected=n===1?intro:base+'kafi '+(n-1)+'.mp3';
 assert.equal(item.number,n,'session number '+n);
 assert.equal(item.url,expected,'exact uploaded link for session '+n);
 assert.equal(item.title,'شرح اصول کافی '+String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[+d])+(n===1?' — کتب اربعه':''),'title '+n);
 assert.equal(item.source,'فایل صوتی','direct audio type '+n);
 assert(!item.url.includes('eitaa.com')&&!item.url.includes('aparat.com'),'old linked media removed');
}
assert.equal(new Set(kafi.map(v=>v.url)).size,60,'no URL duplicates');
assert(!html.includes(forbidden),'end-of-file progress clip is completely absent');
assert(!html.includes('hadis_kafi/'),'old Kafi Eitaa links removed, not merely hidden');
assert(!kafi.some(v=>v.url.includes('ravande')),'progress clip not in catalog');

const re=html.match(/function pmmKafiAudioIsOwnerURL\(url\)\{([\s\S]*?)\n\}\nfunction pmmStopKafiAudio/);
assert(re,'independent Kafi URL allowlist exists');
const context={};
vm.runInNewContext('function pmmKafiAudioIsOwnerURL(url){'+re[1]+'\n}',context);
for(const item of kafi)assert(context.pmmKafiAudioIsOwnerURL(item.url),'Kafi player must accept '+item.url);
for(const u of [forbidden,'https://eitaa.com/hadis_kafi/393',
 'https://evil.test/Audio/kafi/kafi 1.mp3',base+'kafi 0.mp3',base+'kafi 60.mp3',
 base+'kafi 59.mp4',base+'kafi 1.mp3?x=1',base+'kafi 1.mp3#fragment'])
 assert(!context.pmmKafiAudioIsOwnerURL(u),'deny off-catalog '+u);
for(const [name,re] of [
 ['dedicated Kafi source',/if\(section==='kafi'\)\{\s*\/\/ Only approved direct Kafi MP3s/],
 ['reuse Nahj-style card',/class="nahj-part-card kafi-audio-card"/],
 ['play and pause controls',/data-kafi-toggle/],
 ['seek control',/data-kafi-seek/],
 ['elapsed and duration',/data-kafi-current[\s\S]*?data-kafi-duration/],
 ['speed choices',/const PMM_KAFI_SPEEDS=NAHJ_AUDIO_SPEEDS/],
 ['speed persistence',/PMM_KAFI_SPEED_KEY='pmm_kafi_mp3_speed_v1'/],
 ['restore speed',/PMM_KAFI_SPEEDS\.includes\(stored\)/],
 ['lazy audio source',/if\(!audio\.getAttribute\('src'\)\)audio\.src=audio\.dataset\.src/],
 ['encoded spaces',/safe\(encodeURI\(url\)\)/],
 ['native HTML media',/class="nahj-part-media kafi-audio-media"/],
 ['rate update',/audio\.playbackRate=pmmKafiSpeed/],
 ['speed selected visually',/aria-pressed/],
 ['change Kafi only',/if\(screen==='player'&&section==='kafi'\)pmmStopKafiAudio\(\)/],
 ['mark listened manually preserved',/if\(\['towhid','life','kafi'\]\.includes\(section\)\)/],
 ['lesson Back preserved',/document\.getElementById\('player-back'\)\.addEventListener\('click',\(\)=>goBack\(\)\)/],
 ['audio source errors',/این فایل صوتی در حال حاضر بارگذاری نمی‌شود/]
])assert(re.test(html),'Missing Kafi control: '+name);

for(const [i,chunk] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
 if(chunk[1].trim())new vm.Script(chunk[1],{filename:'index inline #'+i});
}
const links=fs.readFileSync('app/src/main/assets/nahj_audio_links.js','utf8');
const contextNahj={window:{}};
vm.runInNewContext(links,contextNahj);
const num=Object.values(contextNahj.window.PMM_NAHJ_AUDIO_DATA.parts).reduce((n,p)=>n+p.length,0);
assert.equal(num,1019,'all owner protected Nahj media URLs remain');
console.log('PASS: 60 exact Kafi URLs from owner list, 1 intro + 59 shifted, forbidden progress excluded, all old Eitaa links removed, same Nahj-style speed controls, inline JS syntax, 1019 protected Nahj links.');
