import { ADMIN_HTML } from './admin-page.js';

const KEY = 'manifest-v1';
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
      if(!env.PMM_MEDIA)return deny(503,'فضای تصاویر هنوز تنظیم نشده است.');
      const id=path.slice(7);
      if(!/^[a-f0-9-]{36}$/.test(id))return deny(404,'تصویر یافت نشد');
      const obj=await env.PMM_MEDIA.get(id);
      if(!obj)return deny(404,'تصویر یافت نشد');
      const type=obj.httpMetadata?.contentType||'application/octet-stream';
      return new Response(obj.body,{headers:mediaHeaders(type)});
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
        if(!env.PMM_MEDIA)return deny(503,'فضای تصاویر تنظیم نشده است.');
        const type=(req.headers.get('content-type')||'').split(';')[0].toLowerCase();
        const reported=Number(req.headers.get('content-length')||0);
        if(!ALLOWED_MEDIA_TYPES.has(type)||reported>MAX_IMAGE_BYTES)return deny(413,'فقط تصویر JPEG/PNG/WebP تا ۸ مگابایت مجاز است.');
        const buf=await req.arrayBuffer();
        if(buf.byteLength>MAX_IMAGE_BYTES||!validImageMagic(new Uint8Array(buf),type))return deny(400,'فایل تصویر معتبر نیست.');
        const key=crypto.randomUUID();
        await env.PMM_MEDIA.put(key,buf,{httpMetadata:{contentType:type}});
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
        return response({ok:true,manifest:next});
      }
    }
    return deny(404,'مسیر یافت نشد.');
  }
};
