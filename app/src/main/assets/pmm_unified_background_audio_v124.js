/* Owner v124: one native foreground audio for ALL first-party approved Kafi/Nahj MP3.
 * Playback starts ONLY after an actual user Play action; no prefetch, timer autoplay,
 * playlist, WebView duplicate audio or generic URL player. */
(function(root){
'use strict';
const rawPattern=/^https:\/\/dl\.kazeminia110\.ir\/Audio\/(?:kafi\/(?:kafi kotobe arbae|kafi (?:[1-9]|[1-4][0-9]|5[0-4]))|nahj-al-balaghe\/tartibi\/(?:khotbe\/khotbe|name\/name|hekmat\/hekmat) [A-Za-z0-9. &]+)\.mp3$/;
function ownerUrl(value){
 if(typeof value!=='string'||value.length>260)return '';
 let candidate=value;
 try{candidate=decodeURI(value)}catch(_){return ''}
 return rawPattern.test(candidate)?candidate:'';
}
function api(){return root.PMMNative}
function available(){
 const a=api();
 return !!(a&&typeof a.pmmAudioStart==='function'&&typeof a.kafiStatus==='function'&&
  typeof a.kafiToggle==='function'&&typeof a.kafiSeek==='function'&&
  typeof a.kafiSpeed==='function');
}
function status(raw){
 const url=ownerUrl(raw);
 if(!url||!available())return {valid:false,active:false};
 try{
  const result=JSON.parse(api().kafiStatus(url)||'{}');
  return result&&typeof result==='object'?result:{valid:false,active:false};
 }catch(_){return {valid:false,active:false}}
}
function start(raw,title,rate,resumeAt=0){
 const url=ownerUrl(raw);
 if(!url||!available())return false;
 const second=Math.max(0,Math.min(86400,Math.floor(Number(resumeAt)||0)));
 const speed=[0.75,1,1.25,1.5,2].includes(Number(rate))?Number(rate):1;
 try{api().pmmAudioStart(url,String(title||'پخش صوت').slice(0,100),speed,second);return true}catch(_){return false}
}
function toggle(raw){
 const url=ownerUrl(raw);if(!url||!available())return false;
 const s=status(url);if(!s.active)return false;
 try{api().kafiToggle(url);return true}catch(_){return false}
}
function seek(raw,seconds){
 const url=ownerUrl(raw);if(!url||!available()||!status(url).active)return false;
 const value=Math.floor(Number(seconds));
 if(!Number.isFinite(value)||value<0||value>86400)return false;
 try{api().kafiSeek(url,value);return true}catch(_){return false}
}
function speed(raw,rate){
 const url=ownerUrl(raw);if(!url||!available()||!status(url).active)return false;
 const value=Number(rate);
 if(![0.75,1,1.25,1.5,2].includes(value))return false;
 try{api().kafiSpeed(url,value);return true}catch(_){return false}
}
const secs=n=>Math.max(0,Number(n)||0);
const fa=(n)=>{
 const m=Math.floor(secs(n));return (Math.floor(m/60)+':'+String(m%60).padStart(2,'0')).replace(/\d/g,v=>'۰۱۲۳۴۵۶۷۸۹'[+v]);
};
function attachNahjCards(cards,groupId,entryId,opts){
 if(!available()||!Array.isArray(cards)||!opts)return false;
 const data=cards.map((card,index)=>{
  const player=card.querySelector('audio.nahj-part-media');
  const url=ownerUrl(player?.dataset?.src||'');
  if(!url)return null;
  const toggleButton=card.querySelector('[data-nahj-toggle]');
  const seekInput=card.querySelector('[data-nahj-seek]');
  const statusLine=card.querySelector('[data-nahj-status]');
  const current=card.querySelector('[data-nahj-current]');
  const duration=card.querySelector('[data-nahj-duration]');
  const rates=Array.from(card.querySelectorAll('[data-nahj-speed]'));
  if(!toggleButton||!seekInput||!statusLine||!current||!duration)return null;
  // Never assign a WebView audio src when the native engine is available.
  player.pause();player.removeAttribute('src');
  player.hidden=true;
  let lastSaved=-1,lastTouch=0,lastActive=false,hadPlay=false;
  const persist=s=>{
   const stored=opts.getProgress(groupId);
   if(!stored||stored.entryId!==entryId||stored.part!==index)return;
   const n=Math.floor(secs(s.position));
   if(!s.active||!(s.playing||s.position>0))return;
   if(n!==lastSaved&&Math.abs(n-lastSaved)>=2){
    lastSaved=n;opts.setProgress(groupId,entryId,index,n,false);
   }
  };
  function update(){
   const s=status(url);
   if(!s.valid)return;
   const playing=!!(s.active&&s.playing);
   const waiting=!!(s.active&&s.preparing);
   const position=secs(s.position),length=secs(s.duration);
   if(s.active){hadPlay=true;persist(s)}
   else if(hadPlay&&lastActive&&s.finished===true){
    opts.setProgress(groupId,entryId,index,0,true);
    hadPlay=false;
   }
   lastActive=!!s.active;
   toggleButton.innerHTML=playing?opts.pauseIcon:opts.playIcon;
   toggleButton.setAttribute('aria-label',(playing?'توقف ':'پخش ')+card.dataset.partTitle);
   card.classList.toggle('is-playing',playing);
   current.textContent=opts.format(position);
   duration.textContent=length>0?opts.format(length):'--:--';
   seekInput.disabled=!(s.active&&length>0&&!waiting);
   if(Date.now()-lastTouch>1250)seekInput.value=length>0?String(Math.min(100,100*position/length)):'0';
   statusLine.textContent=waiting?'در حال آماده‌سازی صوت…':
     playing?'پخش در پس‌زمینه هم ادامه می‌یابد.':
     s.error||((position>0||s.saved>0)?'ادامه از '+opts.format(position||s.saved):'');
   rates.forEach(b=>{
    const selected=Number(b.dataset.nahjSpeed)===opts.getSpeed();
    b.classList.toggle('is-active',selected);b.setAttribute('aria-pressed',String(selected));
   });
  }
  toggleButton.addEventListener('click',()=>{
   const s=status(url);
   if(s.active)toggle(url);
   else{
    const old=opts.getProgress(groupId);
    const startAt=old&&old.entryId===entryId&&old.part===index&&!old.finished?old.seconds:0;
    opts.setProgress(groupId,entryId,index,Math.floor(secs(startAt)),false);
    start(url,card.dataset.partTitle,opts.getSpeed(),startAt);
   }
   update();
   root.setTimeout(update,500);
  });
  seekInput.addEventListener('input',()=>{
   const s=status(url),length=secs(s.duration);
   if(!s.active||length<1)return;
   const point=Math.min(length-1,Math.max(0,Math.round(length*Number(seekInput.value)/100)));
   lastTouch=Date.now();
   seek(url,point);
   current.textContent=opts.format(point);
   // Seeking is position-only. Listening-credit is tracked by the native
   // service's playing clock, never by the jump in seconds.
   opts.setProgress(groupId,entryId,index,point,false);
  });
  rates.forEach(b=>b.addEventListener('click',()=>{
   const chosen=Number(b.dataset.nahjSpeed);
   if(![0.75,1,1.25,1.5,2].includes(chosen))return;
   opts.setSpeed(chosen);speed(url,chosen);update();
  }));
  update();
  return {card,update};
 });
 if(data.some(x=>!x))return false;
 const pulse=root.setInterval(()=>{
  const connected=data.some(x=>x.card.isConnected);
  if(!connected){root.clearInterval(pulse);return}
  data.forEach(x=>{if(x.card.isConnected)x.update()});
 },850);
 root.addEventListener('pmm:app-foreground',()=>data.forEach(x=>x.update()));
 return true;
}
function attachDirect(player,startButton,statusLine,raw,title){
 const url=ownerUrl(raw);
 if(!available()||!url||!startButton||!player)return false;
 player.pause();player.removeAttribute('src');player.hidden=true;
 const row=root.document.createElement('div');
 row.className='pmm-native-direct-controls';
 const seekBar=root.document.createElement('input');
 seekBar.type='range';seekBar.min='0';seekBar.max='100';seekBar.step='.5';seekBar.value='0';seekBar.disabled=true;
 seekBar.setAttribute('aria-label','موقعیت صوت');
 const times=root.document.createElement('span');times.setAttribute('aria-live','polite');times.textContent='۰۰:۰۰';
 row.append(seekBar,times);
 startButton.parentNode.insertBefore(row,startButton.nextSibling);
 function update(){
  const s=status(url),pos=secs(s.position),duration=secs(s.duration);
  startButton.textContent=s.active&&s.playing?'❚❚ مکث صوت':'▶ پخش صوت';
  seekBar.disabled=!(s.active&&duration>0&&!s.preparing);
  if(!seekBar.matches(':active')&&duration>0)seekBar.value=String(Math.min(100,100*pos/duration));
  times.textContent=fa(pos)+' / '+(duration?fa(duration):'--:--');
  if(statusLine)statusLine.textContent=s.preparing?'در حال آماده‌سازی…':
    s.playing?'پخش صوت هنگام خروج از صفحه و برنامه ادامه دارد.':
    (s.error||'');
 }
 startButton.addEventListener('click',()=>{
  const s=status(url);
  if(s.active)toggle(url);
  else start(url,title,1,s.saved||0);
  update();root.setTimeout(update,450);
 });
 seekBar.addEventListener('change',()=>{
  const s=status(url);
  if(s.active&&s.duration>0)seek(url,Math.max(0,Math.floor(s.duration*Number(seekBar.value)/100)));
 });
 update();
 const t=root.setInterval(()=>{if(!startButton.isConnected){root.clearInterval(t);return}update()},850);
 return true;
}
let wisdomTimer=null,wisdomControls=null;
function startWisdom(options){
 const url=ownerUrl(options?.url);
 if(!available()||!url||!options?.container)return false;
 const box=options.container;
 const player=box.querySelector('audio#audio-player');
 if(player){player.pause();player.removeAttribute('src');player.hidden=true}
 if(wisdomTimer)root.clearInterval(wisdomTimer);
 if(wisdomControls)wisdomControls.remove();
 const row=root.document.createElement('div');
 row.className='pmm-native-wisdom-controls';
 const toggleButton=root.document.createElement('button');
 toggleButton.type='button';toggleButton.className='navy-button';toggleButton.textContent='❚❚ مکث';
 toggleButton.setAttribute('aria-label','مکث یا ادامه شرح صوتی');
 const seekInput=root.document.createElement('input');
 seekInput.type='range';seekInput.min='0';seekInput.max='100';seekInput.value='0';seekInput.step='.5';
 seekInput.setAttribute('aria-label','پیشرفت صوت');seekInput.disabled=true;
 const statusLine=root.document.createElement('p');statusLine.setAttribute('aria-live','polite');
 row.append(toggleButton,seekInput,statusLine);
 box.appendChild(row);wisdomControls=row;
 function update(){
  if(!row.isConnected){root.clearInterval(wisdomTimer);return}
  const s=status(url),pos=secs(s.position),length=secs(s.duration);
  toggleButton.textContent=s.active&&s.playing?'❚❚ مکث':'▶ ادامه پخش';
  seekInput.disabled=!(s.active&&length>0&&!s.preparing);
  if(length>0&&!seekInput.matches(':active'))seekInput.value=String(Math.min(100,100*pos/length));
  statusLine.textContent=s.preparing?'در حال آماده‌سازی صوت…':
   s.error||(fa(pos)+' / '+(length?fa(length):'--:--')+
      (s.playing?' — پخش حتی بیرون از برنامه ادامه دارد.':''));
  if(s.active&&typeof options.onProgress==='function')options.onProgress(s);
 }
 toggleButton.addEventListener('click',()=>{
  const s=status(url);
  if(s.active)toggle(url);else start(url,options.title||'شرح حکمت',1,s.saved||options.resume||0);
  update();root.setTimeout(update,400);
 });
 seekInput.addEventListener('change',()=>{
  const s=status(url);
  if(s.active&&s.duration>0)seek(url,Math.floor(s.duration*Number(seekInput.value)/100));
 });
 box.hidden=false;
 const ok=start(url,options.title||'شرح حکمت',1,options.resume||0);
 update();
 wisdomTimer=root.setInterval(update,900);
 return ok;
}
root.PMM_GLOBAL_AUDIO=Object.freeze({
 available,approved:url=>!!ownerUrl(url),status,start,toggle,seek,speed,
 attachNahjCards,attachDirect,startWisdom
});
})(window);
