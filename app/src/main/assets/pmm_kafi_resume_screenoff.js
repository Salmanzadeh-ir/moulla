/* Owner v1.0.9: ONLY (1) resume the same Kafi MP3 at the saved second,
 * and (2) keep Kafi playing with the Android screen switched off.
 *
 * The approved player card, speed controls, video sections, Nahj, photo
 * carousel, home artwork, library and all other content are unchanged.
 * The original HTML5 implementation remains a safe fallback in a browser.
 */
(function () {
  'use strict';
  const FALLBACK_KEY='pmm_kafi_seconds_html_v109';
  function seconds(value) {
    const n=Number(value);
    return Number.isFinite(n)?Math.max(0,Math.min(86400,Math.floor(n))):0;
  }
  function getFallback(url) {
    try {
      const map=JSON.parse(localStorage.getItem(FALLBACK_KEY)||'{}');
      return seconds(map[url]);
    } catch(_) {return 0;}
  }
  function putFallback(url,value) {
    try {
      const map=JSON.parse(localStorage.getItem(FALLBACK_KEY)||'{}');
      map[url]=seconds(value);
      localStorage.setItem(FALLBACK_KEY,JSON.stringify(map));
    }catch(_){}
  }
  function nativeAvailable() {
    const api=window.PMMNative;
    return !!(api&&typeof api.kafiPlay==='function'&&
      typeof api.kafiToggle==='function'&&
      typeof api.kafiStatus==='function'&&
      typeof api.kafiSeek==='function'&&
      typeof api.kafiSpeed==='function');
  }
  function nativeState(url) {
    try {return JSON.parse(window.PMMNative.kafiStatus(url)||'{}');}
    catch(_){return {};}
  }

  function attach(card,record) {
    if(!nativeAvailable()||!card||!record||!pmmKafiAudioIsOwnerURL(record.url))return false;
    const url=record.url;
    const audio=card.querySelector('audio.kafi-audio-media');
    const toggle=card.querySelector('[data-kafi-toggle]');
    const seek=card.querySelector('[data-kafi-seek]');
    const current=card.querySelector('[data-kafi-current]');
    const duration=card.querySelector('[data-kafi-duration]');
    const status=card.querySelector('[data-kafi-status]');
    const rates=Array.from(card.querySelectorAll('[data-kafi-speed]'));
    if(!audio||!toggle||!seek||!current||!duration||!status)return false;

    // Never load the duplicate WebView audio while the native foreground
    // engine plays; one audio source at a time avoids double playback.
    audio.pause();
    audio.removeAttribute('src');
    let localBusy=false;
    let lastState=null;
    let stopped=false;
    let pendingError='';
    let lastSeekAt=0;

    function update() {
      if(stopped)return;
      if(!card.isConnected) {
        stopped=true;
        clearInterval(timer);
        return;
      }
      const state=nativeState(url);
      lastState=state;
      if(!state.valid)return;
      const isPlaying=Boolean(state.active&&state.playing);
      const preparing=Boolean(state.active&&state.preparing);
      const point=seconds(state.position);
      const length=seconds(state.duration);
      toggle.innerHTML=isPlaying?NAHJ_SVG_PAUSE:NAHJ_SVG_PLAY;
      toggle.setAttribute('aria-label',isPlaying?'توقف جلسه صوتی':'پخش جلسه صوتی');
      toggle.disabled=false;
      card.classList.toggle('is-playing',isPlaying);
      current.textContent=nahjAudioTime(point);
      duration.textContent=length>0?nahjAudioTime(length):'--:--';
      seek.disabled=!(state.active&&length>0&&!preparing);
      if(Date.now()-lastSeekAt>1400) {
        seek.value=length>0?String(Math.min(100,100*point/length)):'0';
      }
      if(preparing){
        status.textContent='در حال آماده‌سازی صوت…';
      }else if(state.buffering){
        status.textContent='در حال دریافت ادامه صوت؛ اتصال اینترنت کند شده است…';
      }else if(isPlaying){
        status.textContent='پخش ادامه دارد؛ با خاموش‌شدن صفحه هم متوقف نمی‌شود.';
      }else if(state.error){
        status.textContent=state.error;
      }else if(pendingError){
        status.textContent=pendingError;
      }else if(point>0){
        status.textContent='ادامه از '+nahjAudioTime(point);
      }else {
        status.textContent='';
      }
      if(state.active||!preparing)localBusy=false;
    }

    function applySpeed() {
      rates.forEach(button=>{
        const active=Number(button.dataset.kafiSpeed)===pmmKafiSpeed;
        button.classList.toggle('is-active',active);
        button.setAttribute('aria-pressed',String(active));
      });
    }
    rates.forEach(button=>button.addEventListener('click',()=>{
      const selected=Number(button.dataset.kafiSpeed);
      if(!PMM_KAFI_SPEEDS.includes(selected))return;
      pmmKafiSpeed=selected;
      try{localStorage.setItem(PMM_KAFI_SPEED_KEY,String(selected));}catch(_){}
      applySpeed();
      try{window.PMMNative.kafiSpeed(url,selected);}catch(_){}
    }));
    toggle.addEventListener('click',()=>{
      if(localBusy)return;
      const state=nativeState(url);
      pendingError='';
      localBusy=true;
      try {
        if(state.active)window.PMMNative.kafiToggle(url);
        else window.PMMNative.kafiPlay(url,String(record.title||'شرح اصول کافی'),pmmKafiSpeed);
      }catch(_){
        pendingError='پخش صوت برقرار نشد؛ اینترنت را بررسی کنید.';
      }
      update();
      setTimeout(()=>{localBusy=false;update();},600);
    });
    seek.addEventListener('input',()=>{
      const state=nativeState(url);
      const length=seconds(state.duration);
      if(!state.active||length<=0)return;
      const point=Math.min(length-1,Math.max(0,Math.round(length*Number(seek.value)/100)));
      lastSeekAt=Date.now();
      try{window.PMMNative.kafiSeek(url,point);}catch(_){}
      current.textContent=nahjAudioTime(point);
    });
    applySpeed();
    update();
    const timer=setInterval(update,900);
    window.addEventListener('pmm:app-foreground',update);
    return true;
  }
  function attachFallback(card,record) {
    if(!card||!record||!pmmKafiAudioIsOwnerURL(record.url))return;
    const audio=card.querySelector('audio.kafi-audio-media');
    const status=card.querySelector('[data-kafi-status]');
    if(!audio||!status)return;
    const url=record.url;
    const saved=getFallback(url);
    if(saved>0)status.textContent='ادامه از '+nahjAudioTime(saved);
    let last=-1;
    audio.addEventListener('loadedmetadata',()=>{
      if(saved>0&&Number.isFinite(audio.duration)&&audio.duration>0){
        audio.currentTime=Math.min(saved,Math.max(0,audio.duration-1));
      }
    });
    audio.addEventListener('timeupdate',()=>{
      const point=seconds(audio.currentTime);
      if(Math.abs(point-last)>=3){last=point;putFallback(url,point);}
    });
    audio.addEventListener('pause',()=>putFallback(url,audio.ended?0:audio.currentTime));
    audio.addEventListener('ended',()=>putFallback(url,0));
    window.addEventListener('pagehide',()=>putFallback(url,audio.ended?0:audio.currentTime));
  }
  window.PMM_KAFI_ONLY=Object.freeze({attach,attachFallback});
})();
