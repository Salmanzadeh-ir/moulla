'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../app/src/main/assets/pmm_offline_course.js'),'utf8');
const beginning=source.indexOf('const COURSE_REMINDER_TIME=');
const stateInitialization=source.indexOf('let state=loadState(),courseOpen=false',beginning);
const loadSource=source.slice(source.indexOf('function blankState(){'),source.indexOf('function saveState(){'));
const validator=source.match(/function validCourseReminderTime\(value\)\{[^\n]+\}/)[0];
assert(beginning>=0&&stateInitialization>beginning);
assert(source.includes('if(!validCourseReminderTime(time))'));
assert(source.includes('syncNativeCourseReminder();'));
const data={accepted:true,plan:{mode:'weekly',weekday:4,startDate:'2026-11-19',baseCompleted:12},
 completedCount:15,extras:{},positions:{'sermons|x|1':{position:120,listened:125,duration:350}},
 notes:{'sermons|x|1':{text:'یادداشت خصوصی من',updatedAt:123}},pendingAdvance:false};
const storage={getItem:()=>JSON.stringify(data)};
const ctx={localStorage:storage,KEY:'test',logic:{parseDateKey:v=>v==='2026-11-19'},tracks:{length:1019}};
vm.runInNewContext(source.slice(beginning,stateInitialization)+'\n'+validator+'\n'+loadSource+'\nresult=loadState()',ctx);
assert(ctx.result.accepted===true&&ctx.result.completedCount===15);
assert(ctx.result.notes['sermons|x|1'].text==='یادداشت خصوصی من');
assert(ctx.result.positions['sermons|x|1'].position===120);
assert(ctx.result.plan.reminderTime===null,'Old plan must not receive an invented consent/time');
console.log('PASS: existing 1019-audio progress, notes and plan survive v118 -> v119 migration.');
data.plan.reminderTime='08:45';
const ctx2={...ctx};
vm.runInNewContext(source.slice(beginning,stateInitialization)+'\n'+validator+'\n'+loadSource+'\nresult2=loadState()',ctx2);
assert(ctx2.result2.plan.reminderTime==='08:45');
console.log('PASS: previously saved course reminder time restored after update.');
