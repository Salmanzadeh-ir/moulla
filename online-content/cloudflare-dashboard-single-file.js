/* پای منبر مولا — کد یک‌فایلی مخصوص Cloudflare Workers
 * این فایل را فقط در Edit code میزبان pmm-content-updates قرار دهید.
 * برای اجرا به KV binding با نام PMM_CONTENT و دو Secret با نام‌های
 * PMM_ADMIN_PASSWORD و PMM_SESSION_SECRET نیاز دارد.
 * هیچ رمز، کلید خصوصی APK یا اطلاعات پرداخت داخل این کد وجود ندارد.
 * این نسخه از R2 استفاده نمی‌کند.
 */

const ADMIN_HTML = "<!doctype html>\n<html lang=\"fa\" dir=\"rtl\"><head><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>پنل مدیریت مطالب پای منبر مولا</title>\n<style>\n:root{color-scheme:light;font-family:Tahoma,Arial,sans-serif;background:#f7f0df;color:#203653}\n*{box-sizing:border-box}body{margin:0;line-height:1.75}header{background:linear-gradient(130deg,#082958,#0b4974);color:#fff5d6;padding:28px 16px;text-align:center;border-bottom:5px solid #bc8a30}\nh1{font-size:clamp(22px,5vw,32px);margin:0 0 8px}h2{font-size:20px;color:#124165}header p{margin:0;color:#ffe8b6}\nmain{max-width:850px;margin:auto;padding:18px 14px 50px}.card{padding:22px;margin:16px 0;background:#fffdf8;border:1px solid #d9c69d;border-radius:18px;box-shadow:0 4px 18px #56401116}\nlabel{display:block;font-weight:bold;margin:14px 0 4px;color:#174266}input,select,textarea{width:100%;border:1.5px solid #bcb09a;border-radius:11px;padding:12px;background:#fff;font:inherit;color:#102f51}\ntextarea{min-height:120px}input:focus,textarea:focus,select:focus{outline:3px solid #f0d99b;border-color:#a47a25}\nbutton{border:0;border-radius:12px;font:inherit;font-weight:800;padding:12px 18px;cursor:pointer}\n.primary{background:linear-gradient(#ffe8a5,#d89a30);color:#1b3150;border:1px solid #ad771a}.secondary{background:#edf2f4;color:#23405c;border:1px solid #b1bec7}.danger{background:#ffefed;color:#ae2722;border:1px solid #eac1bb}\nbutton:disabled{opacity:.55;cursor:wait}.stack{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px}.message{font-size:14px;color:#53707c}#notice{padding:12px 15px;border-radius:10px;background:#f0f7fb;color:#103b62;white-space:pre-wrap}\n.list{display:grid;gap:10px}.item{border:1px solid #e2d4b7;border-radius:12px;padding:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}\n.item strong{display:block}.item small{display:block;color:#5f717e}#image-preview{max-width:160px;max-height:210px;border-radius:12px;object-fit:contain}\n[hidden]{display:none!important}.chip{display:inline-block;border-radius:999px;background:#f7eacb;color:#75500e;padding:4px 9px;margin-inline:3px;font-size:13px}\n</style></head>\n<body>\n<header><h1>پنل مدیریت پای منبر مولا</h1><p>انتشار مطالب جدید برای مخاطبان اندروید — قابل استفاده در گوشی و ویندوز</p></header>\n<main>\n<section class=\"card\" id=\"login-card\">\n<h2>ورود مدیر</h2><p class=\"message\">این رمز با رمز GitHub یا کلید امضای APK ارتباطی ندارد. رمز مدیریت فقط روی سرور بررسی می‌شود.</p>\n<form id=\"login-form\"><label for=\"password\">رمز مدیریت محتوا</label><input id=\"password\" type=\"password\" required autocomplete=\"current-password\">\n<div class=\"stack\"><button class=\"primary\" type=\"submit\">ورود به مدیریت</button></div></form></section>\n<div id=\"panel\" hidden>\n<section class=\"card\"><h2>وضعیت انتشار</h2><p id=\"summary\">—</p><div class=\"stack\"><button id=\"refresh\" type=\"button\" class=\"secondary\">تازه‌سازی فهرست</button><button id=\"logout\" class=\"secondary\" type=\"button\">خروج از مدیریت</button></div></section>\n<section class=\"card\"><h2>افزودن مطلب تازه</h2>\n<p class=\"message\">فقط مطلب واقعی و تأییدشده منتشر کنید. با انتشار هر مطلب، شماره نسخه محتوایی افزایش می‌یابد و مخاطب هنگام بازکردن برنامه از آن آگاه می‌شود.</p>\n<form id=\"publish-form\">\n<label for=\"section\">بخش مقصد</label><select id=\"section\" required>\n<option value=\"nahj_audio\">شرح جامع صوتی نهج‌البلاغه</option>\n<option value=\"towhid\">توحید کاربردی</option>\n<option value=\"see_god\">دیدن خدا در زندگی</option>\n<option value=\"kafi\">شرح اصول کافی</option>\n<option value=\"videos\">کلیپ‌های تصویری</option>\n<option value=\"photo_quotes\">عکس‌نوشته</option>\n<option value=\"guest_sentence_new\">یک جمله مهمان مولا</option>\n</select>\n<label for=\"title\">عنوان مطلب</label><input id=\"title\" required maxlength=\"180\" placeholder=\"مثلاً جلسه جدید توحید کاربردی\">\n<div id=\"link-field\"><label for=\"url\">لینک معتبر ایتا یا آپارات</label><input id=\"url\" inputmode=\"url\" placeholder=\"https://eitaa.com/... یا https://www.aparat.com/v/...\"></div>\n<div id=\"photo-field\" hidden><label for=\"photo\">تصویر عکس‌نوشته (JPEG، PNG یا WebP؛ حداکثر ۸ مگابایت)</label>\n<input type=\"file\" id=\"photo\" accept=\"image/jpeg,image/png,image/webp\"><p class=\"message\">تصاویر روی سرور قرار می‌گیرند و هنگام مشاهده در برنامه دریافت می‌شوند؛ در برنامه به‌صورت دائمی ذخیره نمی‌شوند.</p><img id=\"image-preview\" hidden alt=\"پیش‌نمایش عکس‌نوشته\"></div>\n<div id=\"wisdom-fields\" hidden>\n<label for=\"arabic\">متن عربی</label><textarea id=\"arabic\" maxlength=\"3500\"></textarea>\n<label for=\"persian\">ترجمه فارسی</label><textarea id=\"persian\" maxlength=\"3500\"></textarea>\n</div>\n<div class=\"stack\"><button type=\"submit\" class=\"primary\" id=\"publish\">انتشار مطلب جدید</button></div>\n</form></section>\n<section class=\"card\"><h2>مطالب منتشرشده</h2><div class=\"list\" id=\"items\"></div></section>\n</div>\n<div id=\"notice\" role=\"status\" aria-live=\"polite\">اطلاعات پنل فقط پس از ورود نمایش داده می‌شود.</div>\n<p class=\"message\">پنل مدیریت محتوا کد برنامه یا APK را تغییر نمی‌دهد. انتشار تصویر یا لینک جدید، نسخه اصلی برنامه را جایگزین نمی‌کند.</p>\n</main>\n<script>\n(function(){\n'use strict';\nvar names={nahj_audio:'شرح جامع صوتی نهج‌البلاغه',towhid:'توحید کاربردی',see_god:'دیدن خدا در زندگی',\n kafi:'شرح اصول کافی',videos:'کلیپ‌های تصویری',photo_quotes:'عکس‌نوشته',guest_sentence_new:'یک جمله مهمان مولا'};\nvar $=function(id){return document.getElementById(id)};\nvar manifest={schema:1,revision:0,items:[]};\nfunction notice(message){$('notice').textContent=message}\nasync function api(path,options){\n var res=await fetch(path,Object.assign({credentials:'same-origin',cache:'no-store'},options||{}));\n var data=await res.json();\n if(!res.ok||!data.ok&&path!=='/api/manifest')throw Error(data.error||'ارتباط با سرور انجام نشد.');\n return data;\n}\nfunction displaySection(){\n var sec=$('section').value;\n $('link-field').hidden=sec==='photo_quotes'||sec==='guest_sentence_new';\n $('photo-field').hidden=sec!=='photo_quotes';\n $('wisdom-fields').hidden=sec!=='guest_sentence_new';\n $('url').required=!$('link-field').hidden;\n $('photo').required=sec==='photo_quotes';\n $('arabic').required=sec==='guest_sentence_new';\n $('persian').required=sec==='guest_sentence_new';\n}\nfunction render(){\n $('summary').textContent='نسخه محتوایی '+manifest.revision+' — تعداد مطالب منتشرشده: '+manifest.items.length+\n  (manifest.updatedAt?' — آخرین انتشار: '+new Date(manifest.updatedAt).toLocaleString('fa-IR'):'');\n var place=$('items');place.textContent='';\n if(!manifest.items.length){place.textContent='هنوز مطلب جدیدی منتشر نشده است.';return}\n manifest.items.slice().reverse().forEach(function(item){\n  var div=document.createElement('div');div.className='item';\n  var info=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small');\n  strong.textContent=item.title;small.textContent=names[item.section]||item.section;\n  info.appendChild(strong);info.appendChild(small);\n  var btn=document.createElement('button');btn.type='button';btn.className='danger';btn.textContent='حذف';\n  btn.addEventListener('click',async function(){\n   if(!confirm('این مطلب از فهرست مخاطبان حذف شود؟'))return;\n   btn.disabled=true;try{var d=await api('/api/admin/remove',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:item.id})});manifest=d.manifest;render();notice('مطلب حذف شد.')}catch(e){notice(e.message)}finally{btn.disabled=false}\n  });\n  div.appendChild(info);div.appendChild(btn);place.appendChild(div);\n });\n}\nasync function refresh(){\n try{var d=await api('/api/admin/state');manifest=d.manifest;$('login-card').hidden=true;$('panel').hidden=false;render();notice('ارتباط امن با پنل مدیریت برقرار است.')}\n catch(e){$('login-card').hidden=false;$('panel').hidden=true;notice('برای ورود، رمز مدیریت را وارد کنید.')}\n}\n$('login-form').addEventListener('submit',async function(e){\n e.preventDefault();var pass=$('password').value;\n try{await api('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:pass})});$('password').value='';await refresh()}\n catch(e){notice(e.message)}\n});\n$('section').addEventListener('change',displaySection);displaySection();\n$('photo').addEventListener('change',function(){\n var f=$('photo').files[0];\n if(!f){$('image-preview').hidden=true;return}\n var preview=$('image-preview');preview.src=URL.createObjectURL(f);preview.hidden=false;\n preview.onload=function(){URL.revokeObjectURL(preview.src)};\n});\n$('publish-form').addEventListener('submit',async function(e){\n e.preventDefault();var btn=$('publish');btn.disabled=true;\n try{\n  var section=$('section').value;\n  var payload={section:section,title:$('title').value.trim()};\n  if(section==='photo_quotes'){\n   var file=$('photo').files[0];\n   if(!file)throw Error('تصویر را انتخاب کنید.');\n   var d=await api('/api/admin/upload',{method:'POST',headers:{'content-type':file.type},body:file});\n   payload.url=d.url;\n  }else if(section==='guest_sentence_new'){\n   payload.arabic=$('arabic').value.trim();payload.persian=$('persian').value.trim();\n  }else payload.url=$('url').value.trim();\n  var pub=await api('/api/admin/publish',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});\n  manifest=pub.manifest;render();$('publish-form').reset();displaySection();$('image-preview').hidden=true;notice('مطلب منتشر شد. از این پس در اعلان به‌روزرسانی مخاطبان دیده می‌شود.');\n }catch(err){notice('انتشار انجام نشد: '+err.message)}\n finally{btn.disabled=false}\n});\n$('refresh').addEventListener('click',refresh);\n$('logout').addEventListener('click',async function(){\n try{await api('/api/admin/logout',{method:'POST'});}catch(_){}\n $('panel').hidden=true;$('login-card').hidden=false;notice('از پنل مدیریت خارج شدید.');\n});\nrefresh();\n})();\n</script>\n</body></html>";

const KEY = 'manifest-v1';
// One free-tier Workers KV namespace holds both the manifest and image objects.
// This deliberately avoids activating the optional recurring R2 subscription.
const MEDIA_PREFIX = 'media:';
const SECTIONS = new Set([
  'nahj_audio', 'towhid', 'see_god', 'kafi', 'videos', 'photo_quotes', 'guest_sentence_new'
]);
const ALLOWED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_ITEMS = 3000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 1024 * 1024;
const jsonHeaders = {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const textHeaders = {'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer',
  'content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"};

function response(data, status=200) {return new Response(JSON.stringify(data), {status,headers:jsonHeaders});}
function deny(status=403, error='دسترسی مجاز نیست') {return response({ok:false,error},status);}
function encode(input) {return btoa(String.fromCharCode(...new TextEncoder().encode(input))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(input) {return new TextDecoder().decode(Uint8Array.from(atob(input.replace(/-/g,'+').replace(/_/g,'/')), c=>c.charCodeAt(0)));}
function equal(a,b) {
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
async function hash(input) {return new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input)));}
async function sign(data, secret){
  const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return encode(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(data)))));
}
async function authorized(req,env) {
  if(!env.PMM_SESSION_SECRET)return false;
  const cookie=(req.headers.get('cookie')||'').match(/(?:^|;\s*)pmm_admin=([^;]+)/);
  if(!cookie)return false;
  const value=cookie[1].split('.');
  if(value.length!==2)return false;
  try{
    const payload=JSON.parse(decode(value[0]));
    if(!Number.isInteger(payload.exp)||payload.exp<Date.now()||payload.exp>Date.now()+43200000)return false;
    const expected=await sign(value[0],env.PMM_SESSION_SECRET);
    return equal(new TextEncoder().encode(expected),new TextEncoder().encode(value[1]));
  }catch(_){return false;}
}
function sameOrigin(req,url) {
  const origin=req.headers.get('origin');
  return origin===url.origin;
}
function httpsMedia(value) {
  try{
    const url=new URL(value);
    return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&
      ((url.hostname==='eitaa.com'&&/^\/(?:[a-zA-Z0-9_]+\/[0-9]+|joinchat\/[A-Za-z0-9]+)\/?$/.test(url.pathname))||
       ((url.hostname==='aparat.com'||url.hostname==='www.aparat.com')&&/^\/v\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname)));
  }catch(_){return false}
}
function validText(value,min,max){return typeof value==='string'&&value.trim().length>=min&&value.length<=max}
function normalizeItem(item,origin){
  if(!item||typeof item!=='object'||!SECTIONS.has(item.section)||!validText(item.title,2,180))throw Error('عنوان یا بخش معتبر نیست.');
  const section=item.section;
  const result={id:crypto.randomUUID(),section,title:item.title.trim()};
  if(section==='guest_sentence_new'){
    if(!validText(item.arabic,3,3500)||!validText(item.persian,3,3500))throw Error('متن عربی و ترجمه فارسی الزامی است.');
    result.arabic=item.arabic.trim();result.persian=item.persian.trim();
  } else if(section==='photo_quotes'){
    let image;try{image=new URL(item.url)}catch(_){throw Error('آدرس تصویر معتبر نیست.')}
    if(image.origin!==origin||!/^\/media\/[a-f0-9-]{36}$/.test(image.pathname))throw Error('تصویر باید از پنل مدیریت بارگذاری شود.');
    result.url=image.href;
  }else{
    if(!httpsMedia(item.url))throw Error('فقط پیوندهای معتبر ایتا یا آپارات پذیرفته می‌شوند.');
    result.url=item.url;
  }
  return result;
}
async function getManifest(env){
  let content=await env.PMM_CONTENT.get(KEY,'json');
  if(!content)content={schema:1,revision:0,updatedAt:null,items:[]};
  if(!Array.isArray(content.items)||!Number.isSafeInteger(content.revision)||content.schema!==1)throw Error('Invalid manifest format');
  return content;
}
function mediaHeaders(type) {
  return {'content-type':type,'cache-control':'private, no-store, max-age=0','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
}
function validImageMagic(bytes,type) {
  if(type==='image/jpeg')return bytes.length>3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  if(type==='image/png')return bytes.length>8&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10;
  if(type==='image/webp')return bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  return false;
}

export default {
  async fetch(req,env){
    const u=new URL(req.url),path=u.pathname,method=req.method;
    if(path==='/admin'&&method==='GET'){
      return new Response(ADMIN_HTML,{headers:textHeaders});
    }
    if(path==='/api/manifest'&&method==='GET'){
      if(!env.PMM_CONTENT)return deny(503,'پایگاه داده هنوز تنظیم نشده است.');
      return response(await getManifest(env));
    }
    if(path.startsWith('/media/')&&method==='GET'){
      if(!env.PMM_CONTENT)return deny(503,'فضای محتوا هنوز تنظیم نشده است.');
      const id=path.slice(7);
      if(!/^[a-f0-9-]{36}$/.test(id))return deny(404,'تصویر یافت نشد');
      const obj=await env.PMM_CONTENT.getWithMetadata(MEDIA_PREFIX+id,'arrayBuffer');
      if(!obj||!obj.value)return deny(404,'تصویر یافت نشد');
      const type=obj.metadata?.contentType;
      if(!ALLOWED_MEDIA_TYPES.has(type))return deny(404,'تصویر معتبر نیست');
      return new Response(obj.value,{headers:mediaHeaders(type)});
    }
    if(path==='/api/login'&&method==='POST'){
      if(!sameOrigin(req,u))return deny();
      if(!env.PMM_ADMIN_PASSWORD||!env.PMM_SESSION_SECRET||
         env.PMM_ADMIN_PASSWORD.length<16||env.PMM_SESSION_SECRET.length<32)return deny(503,'مدیریت هنوز ایمن پیکربندی نشده است.');
      let data;try{data=await req.json()}catch(_){return deny(400,'درخواست نامعتبر است')}
      const candidate=typeof data.password==='string'?data.password:'';
      if(candidate.length>500)return deny(400);
      if(!equal(await hash(candidate),await hash(env.PMM_ADMIN_PASSWORD)))return deny(401,'رمز مدیریت اشتباه است.');
      const payload=encode(JSON.stringify({exp:Date.now()+12*60*60*1000,nonce:crypto.randomUUID()}));
      const token=payload+'.'+await sign(payload,env.PMM_SESSION_SECRET);
      const res=response({ok:true});
      res.headers.append('set-cookie','pmm_admin='+token+'; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=43200');
      return res;
    }
    if(path.startsWith('/api/admin/')){
      if(!await authorized(req,env))return deny(401,'ابتدا وارد پنل مدیریت شوید.');
      if(method!=='GET'&&!sameOrigin(req,u))return deny();
      if(!env.PMM_CONTENT)return deny(503,'پایگاه داده تنظیم نشده است.');
      if(path==='/api/admin/state'&&method==='GET')return response({ok:true,manifest:await getManifest(env)});
      if(path==='/api/admin/logout'&&method==='POST'){
        const res=response({ok:true});res.headers.append('set-cookie','pmm_admin=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0');return res;
      }
      if(path==='/api/admin/upload'&&method==='POST'){
        const type=(req.headers.get('content-type')||'').split(';')[0].toLowerCase();
        const reported=Number(req.headers.get('content-length')||0);
        if(!ALLOWED_MEDIA_TYPES.has(type)||reported>MAX_IMAGE_BYTES)return deny(413,'فقط تصویر JPEG/PNG/WebP تا ۸ مگابایت مجاز است.');
        const buf=await req.arrayBuffer();
        if(buf.byteLength>MAX_IMAGE_BYTES||!validImageMagic(new Uint8Array(buf),type))return deny(400,'فایل تصویر معتبر نیست.');
        const key=crypto.randomUUID();
        await env.PMM_CONTENT.put(MEDIA_PREFIX+key,buf,{metadata:{contentType:type}});
        return response({ok:true,url:u.origin+'/media/'+key});
      }
      if(path==='/api/admin/publish'&&method==='POST'){
        const old=await getManifest(env);
        if(old.items.length>=MAX_ITEMS)return deny(409,'حداکثر تعداد مطالب ثبت شده است.');
        let data;try{data=await req.json()}catch(_){return deny(400,'داده نامعتبر است.')}
        let item;try{item=normalizeItem(data,u.origin)}catch(e){return deny(400,e.message)}
        item.revision=old.revision+1;
        const next={schema:1,revision:old.revision+1,updatedAt:new Date().toISOString(),
          items:[...old.items,item]};
        if(JSON.stringify(next).length>MAX_MANIFEST_BYTES)return deny(413,'حجم فهرست بیش از حد است.');
        await env.PMM_CONTENT.put(KEY,JSON.stringify(next));
        return response({ok:true,manifest:next});
      }
      if(path==='/api/admin/remove'&&method==='POST'){
        let body;try{body=await req.json()}catch(_){return deny(400)}
        if(typeof body.id!=='string')return deny(400);
        const old=await getManifest(env),nextItems=old.items.filter(item=>item.id!==body.id);
        if(nextItems.length===old.items.length)return deny(404,'مطلب پیدا نشد.');
        const next={schema:1,revision:old.revision+1,updatedAt:new Date().toISOString(),items:nextItems};
        await env.PMM_CONTENT.put(KEY,JSON.stringify(next));
        // A deleted photo should not consume the owner's limited free KV storage.
        const removed=old.items.find(item=>item.id===body.id);
        if(removed?.section==='photo_quotes'){
          try{
            const uri=new URL(removed.url);
            if(uri.origin===u.origin && /^\/media\/[a-f0-9-]{36}$/.test(uri.pathname)){
              await env.PMM_CONTENT.delete(MEDIA_PREFIX+uri.pathname.slice(7));
            }
          }catch(_){/* The manifest removal itself has succeeded. */}
        }
        return response({ok:true,manifest:next});
      }
    }
    return deny(404,'مسیر یافت نشد.');
  }
};
