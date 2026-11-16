/* Regression tests for owner-requested optional image/video exports. No file writes. */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const path='app/src/main/assets/index.html';
const html=fs.readFileSync(path,'utf8');
const manifest=fs.readFileSync('app/src/main/AndroidManifest.xml','utf8');
const host=fs.readFileSync('app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java','utf8');
const saver=fs.readFileSync('app/src/main/java/ir/nahj/towhidkarbordi/PmmMediaSaver.java','utf8');
const photoData=fs.readFileSync('app/src/main/assets/photo_quotes_manifest.js','utf8');
const audio=fs.readFileSync('app/src/main/assets/nahj_audio_links.js','utf8');

for(const [label,re] of [
 ['photo save icon',/id="pmm-photo-save".*?ذخیره در گالری/],
 ['clip save icon',/id="pmm-clip-save"/],
 ['photo save handler',/savePhotoToGallery\(photos\[galleryIndex\]\)/],
 ['video save handler',/saveVideoToGallery\(link\)/],
 ['correct centered clip',/activeWheels\.get\('clips'\)\?\.getIndex\(\)/],
 ['no fake MP4 for external pages',/Aparat and Eitaa pages are not playable MP4 files/],
 ['exact photo click propagation',/savePhotoButton\.addEventListener\('click',event=>\{[\s\S]*?event\.stopPropagation\(\)/],
 ['photo viewer stays closable',/fullscreen\.addEventListener\('click',event=>/],
 ['selected wheel media',/pmm-clip-save.*?دریافت/]
])assert(re.test(html),label+' missing');
const photoContext={window:{}};
vm.runInNewContext(photoData,photoContext,{filename:'photo_quotes_manifest.js'});
const originals=photoContext.window.PMM_PHOTO_QUOTES;
assert.equal(originals.length,93,'all 93 exact owner posters remain');
assert.equal(new Set(originals).size,93,'no duplicate posters');
assert(originals.every(s=>/^images\/photo_quotes\/quote_\d{3}\.(?:jpg|png|jpeg|webp)$/.test(s)),'safe offline photo asset names');

assert(manifest.includes('android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28"'),'only legacy Android requires write permission');
assert(!manifest.includes('android.permission.READ_MEDIA_IMAGES'),'must not request broad gallery-reading permission');
assert(!manifest.includes('android.permission.READ_MEDIA_VIDEO'),'must not request video-reading permission');
assert(host.includes('void savePhotoToGallery(final String source)'),'Android native photo bridge');
assert(host.includes('void saveVideoToGallery(final String source)'),'Android native video bridge');
assert(host.includes('requestMediaSave(false, source)')&&host.includes('requestMediaSave(true, source)'),'both follow explicit user action');
assert(host.includes('MEDIA_STORAGE_PERMISSION_REQUEST')&&host.includes('requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}'),'Android 6-9 runtime consent');
assert(saver.includes('activity.getAssets().open(source)'),'original offline image bytes are copied');
assert(saver.includes('MediaStore.Images.Media.EXTERNAL_CONTENT_URI'),'publish images to Gallery');
assert(saver.includes('MediaStore.Video.Media.EXTERNAL_CONTENT_URI'),'publish MP4s to Gallery');
assert(saver.includes('MediaStore.MediaColumns.IS_PENDING, 1')&&saver.includes('MediaStore.MediaColumns.IS_PENDING, 0'),'no partial files shown');
assert(saver.includes('MediaScannerConnection.scanFile'),'legacy gallery indexing');
assert(saver.includes('OWNER_WORKER')&&saver.includes('OWNER_VIDEO_HOST'),'no generic fetch for iframe bridge');
assert(saver.includes('MAX_IMAGE_BYTES')&&saver.includes('MAX_VIDEO_BYTES'),'large response guards');
assert(saver.includes('if (!complete) resolver.delete(inserted, null, null)'),'failed modern exports cleaned up');
assert(saver.includes('if (!complete) target.delete()'),'failed legacy exports cleaned up');

const ac={window:{}};
vm.runInNewContext(audio,ac,{filename:'nahj_audio_links.js'});
assert.equal(Object.values(ac.window.PMM_NAHJ_AUDIO_DATA.parts).reduce((n,v)=>n+v.length,0),1019,'all owner audio links remain');

for(const [i,s] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()) {
 if(s[1].trim())new vm.Script(s[1],{filename:'index_inline_'+i+'.js'});
}
console.log('PASS: 93 unmodified poster references, actual MediaStore/legacy gallery export, clip direct-file restriction, explicit click, safe sources, cleanup, JS syntax and 1019 preserved audio links.');
