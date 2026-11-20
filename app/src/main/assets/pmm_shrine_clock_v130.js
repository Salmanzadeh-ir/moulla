/* Owner v130 trial: interactive Najaf shrine clock, strictly limited to the existing
 * offline course reminder control. Does not own storage or notification scheduling. */
(function(root){
 'use strict';
 const DAY=24*60, START=5*60, CX=404, CY=256;
 const VALID=/^(?:00:00|(?:0[5-9]|1\d|2[0-3]):[0-5]\d)$/;
 const mod=(n,m)=>((n%m)+m)%m;
 const pad=n=>String(n).padStart(2,'0');
 const persian=s=>String(s).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
 const parseTime=value=>VALID.test(value)?Number(value.slice(0,2))*60+Number(value.slice(3)):null;
 const formatTime=total=>{
  const n=mod(Math.round(total),DAY);
  return pad(Math.floor(n/60))+':'+pad(n%60);
 };
 const clampTime=total=>{
  const n=mod(Math.round(total),DAY);
  // Hours 00:01..04:59 cannot be stored in the existing course scheduler.
  return n===0||n>=START?n:n<=150?0:START;
 };
 const angleDelta=(next,prior)=>mod(next-prior+180,360)-180;
 const blend=(a,b,t)=>a+(b-a)*Math.min(1,Math.max(0,t));
 function lightAt(total){
  const hour=mod(total,DAY)/60;
  if(hour<5)return {brightness:.43,saturation:.72,warmth:0};
  if(hour<7)return {brightness:blend(.6,1,(hour-5)/2),saturation:blend(.79,1,(hour-5)/2),warmth:0};
  if(hour<16.5)return {brightness:1,saturation:1,warmth:0};
  if(hour<19.5){
   const d=(hour-16.5)/3;
   return {brightness:blend(1,.43,d),saturation:blend(1,.74,d),warmth:Math.sin(Math.PI*d)*.22};
  }
  return {brightness:.43,saturation:.72,warmth:0};
 }
 const timeBand=total=>total===0?'نیمه‌شب پایان روز':total<720?'صبح':total<1020?'روز':total<1200?'غروب':'شب';
 const api=Object.freeze({parseTime,formatTime,clampTime,angleDelta,lightAt,persian,timeBand});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 const doc=root.document;
 if(!doc)return;
 const input=doc.getElementById('course-reminder-time');
 const clock=doc.getElementById('course-shrine-clock');
 if(!input||!clock)return;
 const svg=doc.getElementById('course-shrine-clock-svg');
 const label=doc.getElementById('course-shrine-clock-display');
 const phase=doc.getElementById('course-shrine-clock-phase');
 const hoursHand=doc.getElementById('course-shrine-hour-hand');
 const minutesHand=doc.getElementById('course-shrine-minute-hand');
 if(!svg||!label||!phase||!hoursHand||!minutesHand)return;
 let selected=parseTime(input.value)??540;
 let tracking=null;
 const clockAngle=(x,y)=>mod(Math.atan2(y-CY,x-CX)*180/Math.PI+90,360);
 function point(e){
  const rect=svg.getBoundingClientRect();
  if(!rect.width||!rect.height)return null;
  return {x:(e.clientX-rect.left)*768/rect.width,y:(e.clientY-rect.top)*576/rect.height};
 }
 function draw(time,changeInput){
  selected=clampTime(time);
  const value=formatTime(selected);
  if(changeInput&&input.value!==value){
   input.value=value;
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  label.textContent=persian(value);
  phase.textContent=timeBand(selected);
  const hours=Math.floor(selected/60),minutes=selected%60;
  hoursHand.setAttribute('transform','rotate('+((hours%12+minutes/60)*30)+' '+CX+' '+CY+')');
  minutesHand.setAttribute('transform','rotate('+(minutes*6)+' '+CX+' '+CY+')');
  hoursHand.setAttribute('aria-valuenow',String(hours));
  hoursHand.setAttribute('aria-valuetext',persian(value));
  minutesHand.setAttribute('aria-valuenow',String(minutes));
  minutesHand.setAttribute('aria-valuetext',persian(value));
  const lighting=lightAt(selected);
  clock.style.setProperty('--pmm-clock-brightness',lighting.brightness.toFixed(3));
  clock.style.setProperty('--pmm-clock-saturation',lighting.saturation.toFixed(3));
  clock.style.setProperty('--pmm-clock-warmth',lighting.warmth.toFixed(3));
 }
 function isOnDial(pt){
  return !!pt&&Math.hypot(pt.x-CX,pt.y-CY)<=83;
 }
 function kindFor(e,pt){
  const hand=e.target.closest?.('[data-shrine-hand]');
  if(hand)return hand.getAttribute('data-shrine-hand');
  // Short tap on center selects hour; outer ring selects minute.
  return Math.hypot(pt.x-CX,pt.y-CY)<52?'hour':'minute';
 }
 function tap(kind,angle){
  const oldHour=Math.floor(selected/60),oldMinute=selected%60;
  if(kind==='minute')draw(oldHour*60+Math.round(angle/6)%60,true);
  else {
   // A tap preserves AM/PM. To cross 12 hours, turn the hand one full revolution.
   const hour12=Math.round(angle/30)%12;
   const cycle=oldHour>=12?12:0;
   draw((cycle+hour12)*60+oldMinute,true);
  }
 }
 function press(e){
  if(tracking||e.button!==undefined&&e.button!==0)return;
  const pt=point(e);if(!isOnDial(pt))return;
  const angle=clockAngle(pt.x,pt.y),kind=kindFor(e,pt);
  tracking={id:e.pointerId,kind,lastAngle:angle,rawHour:selected/60,
   rawMinute:selected%60,baseHour:Math.floor(selected/60),startX:pt.x,startY:pt.y,moved:false};
  try{svg.setPointerCapture(e.pointerId)}catch(_){}
  clock.classList.add('pmm-shrine-clock-adjusting');
  e.preventDefault();
 }
 function move(e){
  if(!tracking||e.pointerId!==tracking.id)return;
  const pt=point(e);if(!pt)return;
  if(Math.hypot(pt.x-tracking.startX,pt.y-tracking.startY)>3)tracking.moved=true;
  if(!tracking.moved)return;
  const angle=clockAngle(pt.x,pt.y);
  const delta=angleDelta(angle,tracking.lastAngle);
  tracking.lastAngle=angle;
  if(tracking.kind==='hour'){
   // Unwrapped delta allows two revolutions: 09:00 -> 21:00, and back to morning.
   tracking.rawHour+=delta/30;
   draw(mod(Math.round(tracking.rawHour),24)*60+(selected%60),true);
  }else{
   tracking.rawMinute+=delta/6;
   const n=Math.round(tracking.rawMinute);
   const hour=mod(tracking.baseHour+Math.floor(n/60),24);
   draw(hour*60+mod(n,60),true);
  }
  e.preventDefault();
 }
 function release(e){
  if(!tracking||e.pointerId!==tracking.id)return;
  const item=tracking;
  const pt=point(e);
  tracking=null;
  clock.classList.remove('pmm-shrine-clock-adjusting');
  try{if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId)}catch(_){}
  if(!item.moved&&e.type!=='pointercancel'&&isOnDial(pt))tap(item.kind,clockAngle(pt.x,pt.y));
  e.preventDefault();
 }
 svg.addEventListener('pointerdown',press);
 svg.addEventListener('pointermove',move);
 svg.addEventListener('pointerup',release);
 svg.addEventListener('pointercancel',release);
 svg.addEventListener('lostpointercapture',()=>{tracking=null;clock.classList.remove('pmm-shrine-clock-adjusting')});
 // Full accessibility: the same contract can be edited by a native time input,
 // or via keyboard sliders without needing touch and without changing the scheduler.
 [hoursHand,minutesHand].forEach(hand=>hand.addEventListener('keydown',e=>{
  const unit=hand===hoursHand?60:1;
  let next=null;
  if(e.key==='ArrowUp'||e.key==='ArrowRight')next=selected+unit;
  if(e.key==='ArrowDown'||e.key==='ArrowLeft')next=selected-unit;
  if(e.key==='PageUp')next=selected+720;
  if(e.key==='PageDown')next=selected-720;
  if(e.key==='Home')next=START;
  if(e.key==='End')next=0;
  if(next===null)return;
  e.preventDefault();draw(next,true);
 }));
 function sync(){
  const restored=parseTime(input.value);
  if(restored!==null)draw(restored,false);
 }
 input.addEventListener('input',sync);
 input.addEventListener('change',sync);
 root.PMM_SHRINE_CLOCK=Object.freeze({...api,sync});
 draw(selected,false);
})(typeof window!=='undefined'?window:globalThis);
