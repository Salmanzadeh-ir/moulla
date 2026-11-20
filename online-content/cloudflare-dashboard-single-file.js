/* Paye Menbare Mola | Cloudflare Workers (KV only, no R2)
   Required bindings: PMM_CONTENT (KV), PMM_ADMIN_PASSWORD (Secret),
   PMM_SESSION_SECRET (Secret, 32+ chars). */
const HTML = `<!doctype html><html lang="fa" dir="rtl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>مدیریت پای منبر مولا</title><style>
*{box-sizing:border-box}body{margin:0;background:#f7f0df;color:#1a3857;font:16px Tahoma,Arial;line-height:1.9}
header{text-align:center;background:linear-gradient(120deg,#072e59,#14547b);color:#ffe5a2;padding:23px;border-bottom:4px solid #c79638}
main{max-width:800px;margin:auto;padding:15px}.card{background:#fffdf7;border:1px solid #ddc89b;padding:19px;margin:15px 0;border-radius:16px}
h1{font-size:24px}h2{font-size:19px}label{display:block;margin-top:12px;font-weight:bold}
input,select,textarea{width:100%;font:inherit;padding:10px;border:1px solid #b6aca0;border-radius:9px}textarea{min-height:100px}
button{border:0;border-radius:10px;padding:11px 17px;margin:9px 3px;font:inherit;font-weight:bold;background:#dcb05b;color:#183954}
.item{padding:10px;border-bottom:1px solid #ded0b2}.item button{background:#ffdfd9;color:#992a24}
#msg{padding:12px;background:#eaf1f4;border-radius:10px;white-space:pre-wrap}[hidden]{display:none!important}
</style></head><body><header><h1>پنل مدیریت پای منبر مولا</h1>انتشار آنلاین مطالب جدید</header><main>
<section class="card" id="login"><h2>ورود مدیر</h2><form id="lf"><label>رمز مدیریت</label>
<input id="pass" type="password" required><button>ورود</button></form></section>
<div id="panel" hidden><section class="card"><h2>وضعیت انتشار</h2><p id="status"></p>
<button type="button" id="reload">تازه‌سازی</button><button type="button" id="logout">خروج</button></section>
<section class="card"><h2>انتشار مطلب جدید</h2><form id="pf"><label>بخش مقصد</label><select id="section">
<option value="nahj_audio">شرح صوتی نهج‌البلاغه</option><option value="towhid">توحید کاربردی</option>
<option value="see_god">دیدن خدا در زندگی</option><option value="kafi">شرح اصول کافی</option>
<option value="videos">کلیپ‌های تصویری</option><option value="photo_quotes">عکس‌نوشته</option>
<option value="guest_sentence_new">یک جمله مهمان مولا</option></select>
<label>عنوان</label><input id="title" maxlength="180" required>
<div id="links"><label>پیوند ایتا یا آپارات</label><input id="url" type="url"></div>
<div id="photos" hidden><label>انتخاب تصویر (حداکثر ۸ مگابایت)</label>
<input type="file" id="photo" accept="image/png,image/jpeg,image/webp"></div>
<div id="wisdom" hidden><label>متن عربی</label><textarea id="ar"></textarea>
<label>ترجمه فارسی</label><textarea id="fa"></textarea></div>
<button id="submit">انتشار مطلب</button></form></section>
<section class="card"><h2>مطالب منتشرشده</h2><div id="items"></div></section></div>
<p id="msg" role="status">برای مدیریت وارد شوید.</p></main>
<script>(function(){'use strict';const $=id=>document.getElementById(id);let state={revision:0,items:[]};
function say(s){$('msg').textContent=s}
async function req(path,options={}){let r=await fetch(path,{credentials:'same-origin',cache:'no-store',...options});
let j=await r.json();if(!r.ok)throw Error(j.error||'خطا در اتصال');return j}
function json(value){return {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value)}}
function choose(){let s=$('section').value;$('links').hidden=s==='photo_quotes'||s==='guest_sentence_new';
$('photos').hidden=s!=='photo_quotes';$('wisdom').hidden=s!=='guest_sentence_new';
$('url').required=!$('links').hidden;$('photo').required=!$('photos').hidden;
$('ar').required=!$('wisdom').hidden;$('fa').required=!$('wisdom').hidden}
function render(){ $('status').textContent='نسخه محتوا: '+state.revision+' | تعداد مطالب: '+state.items.length;
let area=$('items');area.textContent='';if(!state.items.length)area.textContent='هنوز مطلبی منتشر نشده است.';
state.items.slice().reverse().forEach(item=>{let div=document.createElement('div');div.className='item';
let title=document.createElement('strong');title.textContent=item.title+' — '+item.section;
let button=document.createElement('button');button.type='button';button.textContent='حذف';
button.onclick=async()=>{if(!confirm('این مطلب حذف شود؟'))return;try{state=(await req('/api/admin/remove',json({id:item.id}))).manifest;render();say('مطلب حذف شد.')}catch(e){say(e.message)}};
div.append(title,button);area.append(div)})}
async function refresh(){try{state=(await req('/api/admin/state')).manifest;$('login').hidden=true;$('panel').hidden=false;render();say('پنل آماده است.')}catch(e){$('login').hidden=false;$('panel').hidden=true}}
$('lf').onsubmit=async e=>{e.preventDefault();try{await req('/api/login',json({password:$('pass').value}));$('pass').value='';await refresh()}catch(err){say(err.message)}};
$('section').onchange=choose;choose();$('reload').onclick=refresh;
$('logout').onclick=async()=>{await req('/api/admin/logout',{method:'POST'});$('panel').hidden=true;$('login').hidden=false;say('خارج شدید.')};
$('pf').onsubmit=async e=>{e.preventDefault();$('submit').disabled=true;try{
let section=$('section').value,item={section,title:$('title').value.trim()};
if(section==='photo_quotes'){let f=$('photo').files[0];if(!f)throw Error('تصویر انتخاب نشده');
item.url=(await req('/api/admin/upload',{method:'POST',headers:{'content-type':f.type},body:f})).url;
}else if(section==='guest_sentence_new'){item.arabic=$('ar').value.trim();item.persian=$('fa').value.trim()}
else item.url=$('url').value.trim();state=(await req('/api/admin/publish',json(item))).manifest;
render();$('pf').reset();choose();say('مطلب جدید منتشر شد.')
}catch(err){say(err.message)}finally{$('submit').disabled=false}};refresh()})();</script></body></html>`;

const KEY='manifest-v1',PREFIX='media:',MAX=8*1024*1024;
const SECTIONS=new Set(['nahj_audio','towhid','see_god','kafi','videos','photo_quotes','guest_sentence_new']);
const TYPES=new Set(['image/jpeg','image/png','image/webp']);
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const out=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:HEAD});
const fail=(message,status=400)=>out({ok:false,error:message},status);
const enc=s=>new TextEncoder().encode(s);
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function sig(value,secret){const key=await crypto.subtle.importKey('raw',enc(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
return b64(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc(value))))}
function equal(a,b){if(a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0}
async function authed(request,env){const c=(request.headers.get('cookie')||'').match(/(?:^|;\s*)pmm_admin=([^;]+)/);
if(!c||!env.PMM_SESSION_SECRET)return false;let [payload,signature]=c[1].split('.');if(!signature)return false;
try{let decoded=Uint8Array.from(atob(payload.replace(/-/g,'+').replace(/_/g,'/')),x=>x.charCodeAt(0));
let data=JSON.parse(new TextDecoder().decode(decoded));return Number.isInteger(data.exp)&&data.exp>Date.now()&&
data.exp<=Date.now()+43200000&&equal(signature,await sig(payload,env.PMM_SESSION_SECRET))}catch{return false}}
function media(url){try{let u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.port)return false;
if(u.hostname==='eitaa.com')return /^\/(?:[a-zA-Z0-9_]+\/[0-9]+|joinchat\/[a-zA-Z0-9]+)\/?$/.test(u.pathname);
return (u.hostname==='aparat.com'||u.hostname==='www.aparat.com')&&/^\/v\/[a-zA-Z0-9_-]+\/?$/.test(u.pathname)}catch{return false}}
async function list(env){return await env.PMM_CONTENT.get(KEY,'json')||{schema:1,revision:0,updatedAt:null,items:[]}}
function picture(bytes,type){return type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:
 type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10:
 type==='image/webp'?String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP':false}
export default {async fetch(request,env){const u=new URL(request.url),p=u.pathname,m=request.method;
if(p==='/admin'&&m==='GET')return new Response(HTML,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',
 'content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"}});
if(p==='/api/manifest'&&m==='GET'){if(!env.PMM_CONTENT)return fail('فضای KV تنظیم نشده',503);return out(await list(env))}
if(p.startsWith('/media/')&&m==='GET'){if(!env.PMM_CONTENT)return fail('KV تنظیم نشده',503);
let id=p.slice(7);if(!/^[a-f0-9-]{36}$/.test(id))return fail('تصویر یافت نشد',404);
let obj=await env.PMM_CONTENT.getWithMetadata(PREFIX+id,'arrayBuffer');if(!obj?.value||!TYPES.has(obj.metadata?.contentType))return fail('تصویر یافت نشد',404);
return new Response(obj.value,{headers:{'content-type':obj.metadata.contentType,'cache-control':'private, no-store','x-content-type-options':'nosniff'}})}
if(p==='/api/login'&&m==='POST'){if(request.headers.get('origin')!==u.origin)return fail('دسترسی غیرمجاز',403);
if(!env.PMM_ADMIN_PASSWORD||!env.PMM_SESSION_SECRET||env.PMM_ADMIN_PASSWORD.length<16||env.PMM_SESSION_SECRET.length<32)return fail('رمز مدیریت تنظیم نشده',503);
let body;try{body=await request.json()}catch{return fail('اطلاعات نامعتبر')}
if(typeof body.password!=='string'||body.password.length>500)return fail('رمز نامعتبر');
let h=async v=>new Uint8Array(await crypto.subtle.digest('SHA-256',enc(v))),a=await h(body.password),b=await h(env.PMM_ADMIN_PASSWORD);
let d=0;for(let i=0;i<a.length;i++)d|=a[i]^b[i];if(d)return fail('رمز اشتباه است',401);
let payload=b64(enc(JSON.stringify({exp:Date.now()+43200000,nonce:crypto.randomUUID()})));
let res=out({ok:true});res.headers.set('set-cookie','pmm_admin='+payload+'.'+await sig(payload,env.PMM_SESSION_SECRET)+'; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=43200');return res}
if(p.startsWith('/api/admin/')){
if(!await authed(request,env))return fail('ابتدا وارد شوید',401);
if(m!=='GET'&&request.headers.get('origin')!==u.origin)return fail('دسترسی غیرمجاز',403);
if(!env.PMM_CONTENT)return fail('KV تنظیم نشده',503);
if(p==='/api/admin/state'&&m==='GET')return out({ok:true,manifest:await list(env)});
if(p==='/api/admin/logout'&&m==='POST'){let res=out({ok:true});res.headers.set('set-cookie','pmm_admin=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0');return res}
if(p==='/api/admin/upload'&&m==='POST'){
let type=(request.headers.get('content-type')||'').split(';')[0],size=Number(request.headers.get('content-length')||0);
if(!TYPES.has(type)||size>MAX)return fail('فقط تصویر JPEG، PNG یا WebP تا ۸ مگابایت',413);
let bytes=await request.arrayBuffer();if(bytes.byteLength>MAX||!picture(new Uint8Array(bytes),type))return fail('تصویر نامعتبر');
let id=crypto.randomUUID();await env.PMM_CONTENT.put(PREFIX+id,bytes,{metadata:{contentType:type}});return out({ok:true,url:u.origin+'/media/'+id})}
if(p==='/api/admin/publish'&&m==='POST'){
let body;try{body=await request.json()}catch{return fail('اطلاعات نامعتبر')}
if(!SECTIONS.has(body.section)||typeof body.title!=='string'||body.title.trim().length<2||body.title.length>180)return fail('عنوان یا بخش نامعتبر');
let item={id:crypto.randomUUID(),section:body.section,title:body.title.trim()};
if(item.section==='guest_sentence_new'){
if(typeof body.arabic!=='string'||typeof body.persian!=='string'||body.arabic.trim().length<3||body.persian.trim().length<3||body.arabic.length>3500||body.persian.length>3500)return fail('متن عربی یا فارسی نامعتبر');
item.arabic=body.arabic.trim();item.persian=body.persian.trim();
}else if(item.section==='photo_quotes'){
try{let image=new URL(body.url);if(image.origin!==u.origin||!/^\/media\/[a-f0-9-]{36}$/.test(image.pathname))return fail('آدرس عکس نامعتبر');item.url=image.href}catch{return fail('آدرس عکس نامعتبر')}
}else{if(!media(body.url))return fail('لینک ایتا یا آپارات نامعتبر');item.url=body.url}
let old=await list(env);if(old.items.length>=3000)return fail('فهرست پر شده',409);
item.revision=old.revision+1;let next={schema:1,revision:item.revision,updatedAt:new Date().toISOString(),items:[...old.items,item]};
if(JSON.stringify(next).length>1024*1024)return fail('فهرست بزرگ است',413);
await env.PMM_CONTENT.put(KEY,JSON.stringify(next));return out({ok:true,manifest:next})}
if(p==='/api/admin/remove'&&m==='POST'){
let body;try{body=await request.json()}catch{return fail('اطلاعات نامعتبر')}
let old=await list(env),item=old.items.find(x=>x.id===body.id);if(!item)return fail('مطلب پیدا نشد',404);
let next={schema:1,revision:old.revision+1,updatedAt:new Date().toISOString(),items:old.items.filter(x=>x.id!==body.id)};
await env.PMM_CONTENT.put(KEY,JSON.stringify(next));if(item.section==='photo_quotes'){
try{let image=new URL(item.url);if(image.origin===u.origin&&/^\/media\/[a-f0-9-]{36}$/.test(image.pathname))await env.PMM_CONTENT.delete(PREFIX+image.pathname.slice(7))}catch{}}
return out({ok:true,manifest:next})}
}
return fail('مسیر یافت نشد',404)
}};
