/* Owner's exact audio-link catalog, derived ONLY from «لینک نهج‌البلاغه.txt».
   Source SHA256: 1ab3a76933039ed74e56dc8268d27388a6a41ad3eaab5b3aaec3722330f200b1
   357 sermon, 151 letter, 511 wisdom MP3 URLs; five joint titles preserved.
   Nine Gharib al-Hadith placeholders intentionally have no links.
   The special count maps below are lossless encodings of the URL filenames;
   all other numbers have precisely one unnumbered .mp3 in the provided file.
   No URL is inferred outside that source (validated against all 1019 lines). */
(function(){
'use strict';
const ROOT='https://dl.kazeminia110.ir/Audio/nahj-al-balaghe/tartibi/';
const PERSIAN='۰۱۲۳۴۵۶۷۸۹';
const fa=n=>String(n).replace(/[0-9]/g,x=>PERSIAN[Number(x)]);
const multipart={
 khotbe:{1:9,2:2,3:3,16:2,27:2,83:7,86:2,87:3,91:12,93:2,97:2,106:2,108:2,109:4,110:2,111:2,113:2,114:3,128:2,147:2,150:2,151:2,152:2,153:2,156:2,157:2,160:3,165:3,176:5,182:5,183:3,185:3,186:6,190:3,191:3,192:14,193:12,195:2,198:4,199:3,210:2,214:2,216:4,221:4,222:3,223:2,230:2},
 name:{27:2,28:3,31:31,45:8,47:4,53:27,69:4},
 hekmat:{31:7,38:2,147:5,150:4,211:2,224:2,252:5,289:4,333:3,343:2,349:4,367:2,371:2,400:3}
};
const shared={
 khotbe:[{numbers:[13,14],stem:'13 & 14'},{numbers:[52,53],stem:'52 & 53'},{numbers:[58,59,60],stem:'58 & 59 & 60'}],
 name:[],
 hekmat:[{numbers:[40,41],stem:'40 & 41'},{numbers:[111,112],stem:'111& 112'}]
};
const parts=Object.create(null);
function build(folder,kind,label,max){
 const byNumber=Object.create(null);
 for(const pair of shared[folder])for(const n of pair.numbers)byNumber[n]=pair;
 const records=[];
 for(let number=1;number<=max;number++){
   const pair=byNumber[number];
   if(pair && number!==pair.numbers[0])continue;
   const nums=pair?pair.numbers:[number];
   const id=kind+'-'+nums.join('-');
   const title=label+' '+nums.map(fa).join(' و ');
   let filenames;
   if(pair)filenames=[pair.stem];
   else{
     const count=multipart[folder][number]||1;
     filenames=Array.from({length:count},(_,i)=>count===1?String(number):number+'.'+(i+1));
   }
   parts[id]=Object.freeze(filenames.map(stem=>ROOT+folder+'/'+folder+' '+stem+'.mp3'));
   records.push(Object.freeze({id,kind,number,title}));
 }
 return records;
}
const sermons=Object.freeze(build('khotbe','sermon','خطبه',241));
const letters=Object.freeze(build('name','letter','نامه',79));
const allWisdom=build('hekmat','wisdom','حکمت',480);
const gharaib=Array.from({length:9},(_,i)=>{
 const n=i+1,id='gharaib-'+n;
 parts[id]=Object.freeze([]);
 return Object.freeze({id,kind:'gharaib',number:n,title:'غرائب الحدیث '+fa(n)});
});
const wisdoms=Object.freeze([
 ...allWisdom.filter(x=>x.number<=260),...gharaib,...allWisdom.filter(x=>x.number>=261)
]);
const items=Object.freeze({sermons,letters,wisdoms});
if(sermons.length!==237||letters.length!==79||wisdoms.length!==487||
 Object.values(parts).reduce((n,v)=>n+v.length,0)!==1019)throw Error('Nahj link catalog integrity check failed');
window.PMM_NAHJ_AUDIO_DATA=Object.freeze({items,parts:Object.freeze(parts)});
})();
