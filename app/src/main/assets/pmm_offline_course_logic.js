/* Offline Nahj course: pure schedule/catalog helpers. All course state stays on-device. */
(function(root){
'use strict';
const GROUPS=[
  {id:'sermons',label:'خطبه‌ها'},
  {id:'letters',label:'نامه‌ها'},
  {id:'wisdoms',label:'حکمت‌ها'}
];
const VALID_URL=/^https:\/\/dl\.kazeminia110\.ir\/Audio\/nahj-al-balaghe\/tartibi\/(?:khotbe\/khotbe|name\/name|hekmat\/hekmat) [A-Za-z0-9. &]+\.mp3$/i;
const DIGITS='۰۱۲۳۴۵۶۷۸۹';
function fa(value){return String(value).replace(/[0-9]/g,d=>DIGITS[Number(d)])}
function ordinal(value){
 const words=['','اول','دوم','سوم','چهارم','پنجم','ششم','هفتم','هشتم','نهم','دهم','یازدهم','دوازدهم','سیزدهم','چهاردهم','پانزدهم','شانزدهم','هفدهم','هجدهم','نوزدهم','بیستم'];
 return words[value]||fa(value);
}
function buildTracks(catalog){
 if(!catalog||!catalog.items||!catalog.parts)return [];
 const tracks=[];
 GROUPS.forEach(group=>{
  const records=Array.isArray(catalog.items[group.id])?catalog.items[group.id]:[];
  records.forEach(record=>{
   const urls=Array.isArray(catalog.parts[record.id])?catalog.parts[record.id]:[];
   urls.forEach((url,index)=>{
    if(typeof url!=='string'||!VALID_URL.test(url))return;
    const part=index+1,partCount=urls.length;
    tracks.push(Object.freeze({
      id:group.id+'|'+record.id+'|'+part,
      groupId:group.id,groupLabel:group.label,recordId:record.id,
      title:String(record.title||''),number:Number(record.number)||0,
      part,partCount,url,
      displayTitle:String(record.title||'')+(partCount>1?' — بخش '+ordinal(part):'')
    }));
   });
  });
 });
 return Object.freeze(tracks);
}
function validDateKey(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)}
function parseDateKey(value){
 if(!validDateKey(value))return null;
 const parts=value.split('-').map(Number);
 const date=new Date(parts[0],parts[1]-1,parts[2],12,0,0,0);
 return Number.isNaN(date.getTime())?null:date;
}
function dateKey(date){
 const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
 return y+'-'+m+'-'+d;
}
function dayDifference(fromKey,toKey){
 const from=parseDateKey(fromKey),to=parseDateKey(toKey);
 if(!from||!to)return 0;
 return Math.max(0,Math.floor((Date.UTC(to.getFullYear(),to.getMonth(),to.getDate())-
   Date.UTC(from.getFullYear(),from.getMonth(),from.getDate()))/86400000));
}
function countWeeklyOccurrences(startKey,todayKey,weekday){
 const start=parseDateKey(startKey),today=parseDateKey(todayKey);
 if(!start||!today||!Number.isInteger(weekday)||weekday<0||weekday>6)return 0;
 const days=dayDifference(startKey,todayKey);
 const first=(weekday-start.getDay()+7)%7;
 return days<first?0:1+Math.floor((days-first)/7);
}
function extrasThrough(extras,todayKey){
 if(!extras||typeof extras!=='object')return 0;
 return Object.keys(extras).filter(key=>validDateKey(key)&&key<=todayKey)
  .reduce((sum,key)=>sum+(Number.isInteger(extras[key])&&extras[key]>0?extras[key]:0),0);
}
function entitlement(state,todayKey){
 const plan=state&&state.plan;
 if(!plan||!validDateKey(plan.startDate)||!validDateKey(todayKey))return 0;
 const base=Number.isInteger(plan.baseCompleted)&&plan.baseCompleted>=0?plan.baseCompleted:0;
 let scheduled=0;
 if(plan.mode==='daily1'||plan.mode==='daily2'){
  scheduled=(dayDifference(plan.startDate,todayKey)+1)*(plan.mode==='daily2'?2:1);
 }else if(plan.mode==='weekly'&&Number.isInteger(plan.weekday)){
  scheduled=countWeeklyOccurrences(plan.startDate,todayKey,plan.weekday);
 }
 return base+scheduled+extrasThrough(state.extras,todayKey);
}
function nextEligibleDate(plan,todayKey){
 const today=parseDateKey(todayKey);
 if(!today)return null;
 const next=new Date(today.getFullYear(),today.getMonth(),today.getDate(),12,0,0,0);
 if(plan&&plan.mode==='weekly'&&Number.isInteger(plan.weekday)){
  for(let i=1;i<=7;i++){
   const candidate=new Date(next.getFullYear(),next.getMonth(),next.getDate()+i,12,0,0,0);
   if(candidate.getDay()===plan.weekday)return dateKey(candidate);
  }
 }
 next.setDate(next.getDate()+1);
 return dateKey(next);
}
function canMarkHeard(listenedSeconds,durationSeconds){
 const listened=Number(listenedSeconds),duration=Number(durationSeconds);
 return Number.isFinite(listened)&&Number.isFinite(duration)&&duration>0&&listened+0.05>=duration*(2/3);
}
function progress(completed,total){
 const max=Math.max(0,Number(total)||0),done=Math.max(0,Math.min(max,Number(completed)||0));
 return {completed:done,total:max,percent:max?Math.round(done/max*10000)/100:0};
}
root.PMM_OFFLINE_COURSE_LOGIC=Object.freeze({
 groups:Object.freeze(GROUPS.map(x=>Object.freeze(x))),
 validUrl:url=>typeof url==='string'&&VALID_URL.test(url),
 buildTracks,
 fa,ordinal,dateKey,parseDateKey,dayDifference,countWeeklyOccurrences,
 entitlement,nextEligibleDate,canMarkHeard,progress
});
})(window);
