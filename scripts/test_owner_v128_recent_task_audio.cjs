// v128 regression guard: Android task removal stops all native audio;
// leaving the app normally, pressing Back, or backgrounding must not.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const service=fs.readFileSync(path.join(root,'app/src/main/java/ir/nahj/towhidkarbordi/PmmKafiAudioService.java'),'utf8');
const activity=fs.readFileSync(path.join(root,'app/src/main/java/ir/nahj/towhidkarbordi/MainActivity.java'),'utf8');
const manifest=fs.readFileSync(path.join(root,'app/src/main/AndroidManifest.xml'),'utf8');
const stopBlock=service.match(/@Override\s+public\s+void\s+onTaskRemoved\(Intent rootIntent\)\s*\{([\s\S]*?)\n    \}/);
assert(stopBlock,'onTaskRemoved must be overridden on native audio service');
const body=stopBlock[1];
const order=['captureListening();','saveSecond(true);','discardPlayer();','stopForeground(true);','stopSelf();','super.onTaskRemoved(rootIntent);'];
let previous=-1;
for(const snippet of order){const at=body.indexOf(snippet);assert(at>previous,'task-removal missing/order: '+snippet);previous=at;}
assert.match(body,/if\(active\)/,'save active playback progress only');
assert.match(body,/player\.getCurrentPosition\(\)\/1000/,'read real position before release');
assert.match(service,/if\(synchronous\)edit\.commit\(\);else edit\.apply\(\);/,'task removal must commit listening credit');
assert.match(service,/return START_NOT_STICKY;/,'service must not restart playback automatically');
assert(!/android:stopWithTask=["']true["']/.test(manifest),'stopWithTask skips onTaskRemoved and progress save');
assert.match(manifest,/foregroundServiceType=["']mediaPlayback["']/);
const pause=activity.match(/@Override protected void onPause\(\)\s*\{([\s\S]*?)\n    \}/);
assert(pause && !/stopService|ACTION_STOP|onTaskRemoved/.test(pause[1]),'Home/backgrounding keeps playing');
const destroy=activity.match(/@Override protected void onDestroy\(\)\s*\{([\s\S]*?)\n    \}/);
assert(destroy && !/stopService|ACTION_STOP|onTaskRemoved/.test(destroy[1]),'normal Back/Exit keeps playing');
assert(!/onTaskRemoved\s*\(/.test(activity),'task removal belongs in service, not UI lifecycle');
console.log('PASS: Recents swipe stops native audio; Home, Back/Exit and screen-off untouched; progress synced');
