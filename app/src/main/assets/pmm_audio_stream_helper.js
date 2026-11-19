/* Owner v113: diagnostics for a user-initiated online stream.
 * Attaching a listener DOES NOT load a URL, preconnect, prefetch or play.
 * The player supplies its URL only inside the explicit Play click handler.
 */
(function(){
 'use strict';
 function attach(audio,status){
  if(!audio)return {started(){},getLastStartMs(){return null}};
  let requested=false, startedAt=0, lastStartMs=null, slowTimer=null;
  function report(value){if(status&&status.isConnected)status.textContent=value;}
  function clearSlow(){if(slowTimer!==null){clearTimeout(slowTimer);slowTimer=null;}}
  function pending(){
   if(!requested)return;
   report('در حال دریافت صوت از اینترنت…');
   clearSlow();slowTimer=setTimeout(()=>{
    if(requested&&!audio.paused&&audio.readyState<3)
     report('دریافت صوت کند شده است؛ لطفاً اتصال اینترنت را بررسی کنید.');
   },9000);
  }
  audio.addEventListener('waiting',pending);
  audio.addEventListener('stalled',pending);
  audio.addEventListener('playing',()=>{
   if(!requested)return;
   lastStartMs=Math.max(0,Math.round(performance.now()-startedAt));
   clearSlow();report('در حال پخش');
  });
  audio.addEventListener('canplay',()=>{if(requested)clearSlow()});
  audio.addEventListener('pause',()=>{clearSlow()});
  audio.addEventListener('ended',()=>{clearSlow();requested=false});
  audio.addEventListener('error',()=>{
   if(!requested)return;
   clearSlow();
   const code=audio.error&&audio.error.code;
   if(code===1)return;
   report(code===2?'ارتباط اینترنت هنگام دریافت صوت قطع شد؛ دوباره پخش را بزنید.':
     code===3?'این فایل صوتی در دستگاه قابل رمزگشایی نیست.':
     code===4?'فایل صوتی از سرور دریافت نشد یا پشتیبانی نمی‌شود.':
     'دریافت صوت با خطا مواجه شد؛ دوباره پخش را بزنید.');
  });
  return {
   started(){requested=true;startedAt=performance.now();lastStartMs=null;report('در حال اتصال به صوت…')},
   getLastStartMs(){return lastStartMs}
  };
 }
 window.PMM_STREAM_HELPER=Object.freeze({attach});
})();
