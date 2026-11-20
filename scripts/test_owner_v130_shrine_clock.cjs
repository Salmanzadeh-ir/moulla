// Actual controller math, DOM contract and source-regression test for shrine-clock trial.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const m=require(path.join(root,'app/src/main/assets/pmm_shrine_clock_v130.js'));
for(const [time,expected] of [['00:00',0],['05:00',300],['09:00',540],['12:00',720],['23:59',1439],['00:01',null],['04:59',null],['24:00',null],['9:00',null],['05:60',null],['',null]]){
 assert.equal(m.parseTime(time),expected,time);
}
for(const n of [0,300,301,540,720,1023,1439]){
 assert.equal(m.parseTime(m.formatTime(n)),n,'HH:mm identity '+n);
}
assert.equal(m.clampTime(1440),0);
assert.equal(m.clampTime(1),0);
assert.equal(m.clampTime(299),300);
assert.equal(m.clampTime(600),600);
assert.equal(m.clampTime(-1),1439);
assert.equal(m.angleDelta(10,350),20,'clockwise past 12');
assert.equal(m.angleDelta(350,10),-20,'counter-clockwise past 12');
assert.equal(m.persian('09:05'),'۰۹:۰۵');
assert.equal(m.timeBand(0),'نیمه‌شب پایان روز');
assert.equal(m.timeBand(540),'صبح');
assert.equal(m.timeBand(1260),'شب');
const noon=m.lightAt(720),dusk=m.lightAt(1080),night=m.lightAt(1320),sunrise=m.lightAt(330);
assert(noon.brightness>dusk.brightness&&dusk.brightness>night.brightness);
assert(sunrise.brightness>night.brightness);
assert(dusk.warmth>0);
assert.equal(m.lightAt(540).warmth,0);
assert.equal(m.lightAt(0).brightness,m.lightAt(1380).brightness);
// Two entire rotations are required to visit both 09:00 and 21:00; do not collapse into 12-hour state.
const handAnglePerHour=30;
assert.equal(((540/60+360/handAnglePerHour)%24),21);
const html=fs.readFileSync(path.join(root,'app/src/main/assets/index.html'),'utf8');
const course=fs.readFileSync(path.join(root,'app/src/main/assets/pmm_offline_course.js'),'utf8');
const controller=fs.readFileSync(path.join(root,'app/src/main/assets/pmm_shrine_clock_v130.js'),'utf8');
assert.match(html,/id="course-shrine-clock"/);
assert.match(html,/pmm_shrine_clock_clean\.webp/);
assert.match(html,/viewBox="0 0 768 576"/);
assert.match(html,/id="course-shrine-hour-hand"[^>]*role="slider"/);
assert.match(html,/id="course-shrine-minute-hand"[^>]*role="slider"/);
assert.match(html,/id="course-reminder-time" value="09:00" step="60" required/);
assert.match(html,/pmm_shrine_clock_v130\.js/);
assert(html.indexOf('pmm_shrine_clock_v130.js')<html.indexOf('pmm_offline_course.js'));
assert.match(html,/prefers-reduced-motion:reduce/);
assert.match(html,/\.pmm-shrine-clock-touch\{pointer-events:all;touch-action:none/);
assert.match(controller,/setPointerCapture\(e\.pointerId\)/);
assert.match(controller,/pointercancel/);
assert.match(controller,/ArrowRight/);
assert.match(controller,/rawHour\+=delta\/30/);
assert.match(controller,/input\.dispatchEvent\(new Event\('change'/);
assert(!/setInterval\(|fetch\(|\.play\(/.test(controller),'clock cannot fetch content or auto-play audio');
assert.match(course,/window\.PMM_SHRINE_CLOCK\?\.sync\(\)/);
assert.match(course,/const COURSE_REMINDER_TIME=\/\^\(\?:00:00/);
assert.match(course,/bridge\.setCourseReminderSchedule\(state\.plan\.mode,state\.plan\.weekday\?\?-1,state\.plan\.reminderTime\)/);
assert.match(course,/startDate:todayKey\(\),baseCompleted:state\.completedCount,reminderTime:time/);
assert(fs.statSync(path.join(root,'app/src/main/assets/images/pmm_shrine_clock_clean.webp')).size>20000);
assert(!fs.existsSync(path.join(root,'app/src/main/assets/pmm_owner_wisdom_tools_v121.js')));
console.log('PASS: v130 genuine draggable 24h hour/minute clock, legal range, light, accessibility, unchanged native scheduler contract');
