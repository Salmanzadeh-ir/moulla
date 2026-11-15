import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const {default:app}=await import('../online-content/worker.js');
const memory=new Map();
const objects=new Map();
const env={
 PMM_ADMIN_PASSWORD:'VERY-LONG-UNIQUE-ADMIN-PASSWORD-TEST-ONLY',
 PMM_SESSION_SECRET:'VERY-LONG-SESSION-HMAC-SECRET-TEST-ONLY-1234',
 PMM_CONTENT:{
   async get(k,fmt){const value=memory.get(k);return fmt==='json'&&value?JSON.parse(value):value??null;},
   async put(k,v){memory.set(k,v);}
 },
 PMM_MEDIA:{
   async put(id,bytes,{httpMetadata}){objects.set(id,{body:bytes,httpMetadata});},
   async get(id){return objects.get(id)||null;}
 }
};
const origin='https://owner-content.test';
const call=(path,{method='GET',body,headers={},cookie}={})=>{
 const h=new Headers(headers);
 if(method!=='GET')h.set('origin',origin);
 if(cookie)h.set('cookie',cookie);
 return app.fetch(new Request(origin+path,{method,headers:h,body}),env);
};
let res=await call('/api/manifest'),data=await res.json();
assert.equal(res.status,200);assert.equal(data.revision,0);
res=await call('/api/admin/state');
assert.equal(res.status,401,'No anonymous access to admin state');
res=await call('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:'wrong'})});
assert.equal(res.status,401);
res=await call('/api/login',{method:'POST',headers:{'content-type':'application/json'},
 body:JSON.stringify({password:env.PMM_ADMIN_PASSWORD})});
assert.equal(res.status,200);
const cookie=res.headers.get('set-cookie').split(';')[0];
assert(cookie.startsWith('pmm_admin='));
assert(res.headers.get('set-cookie').includes('HttpOnly'));
let item={section:'towhid',title:'جلسه واقعی تست فقط در حافظه',url:'https://eitaa.com/nahjolbalagheh_media/4602'};
res=await call('/api/admin/publish',{method:'POST',headers:{'content-type':'application/json'},cookie,body:JSON.stringify(item)});
data=await res.json();assert.equal(res.status,200);assert.equal(data.manifest.revision,1);assert.equal(data.manifest.items[0].revision,1);
res=await call('/api/manifest');data=await res.json();
assert.equal(data.items.length,1);
res=await call('/api/admin/publish',{method:'POST',headers:{'content-type':'application/json'},cookie,
 body:JSON.stringify({...item,url:'javascript:alert(1)'})});
assert.equal(res.status,400,'Reject untrusted media URL');
const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
res=await call('/api/admin/upload',{method:'POST',headers:{'content-type':'image/png'},cookie,body:png});
data=await res.json();assert.equal(res.status,200);assert(data.url.includes('/media/'));
res=await call(new URL(data.url).pathname);assert.equal(res.status,200);
assert.equal(res.headers.get('cache-control'),'private, no-store, max-age=0');
const id=(await (await call('/api/manifest')).json()).items[0].id;
res=await call('/api/admin/remove',{method:'POST',headers:{'content-type':'application/json'},cookie,body:JSON.stringify({id})});
data=await res.json();assert.equal(data.manifest.revision,2);assert.equal(data.manifest.items.length,0);
res=await call('/admin');assert.equal(res.status,200);assert((await res.text()).includes('پنل مدیریت'));
console.log('PASS: private login, cookie, publish, revision, URL filtering, image upload, no-store streaming, deletion');
