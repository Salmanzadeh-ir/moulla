'use strict';
// Owner-v118 smoke invariants. Historical regression is tested separately.
const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('app/src/main/assets/index.html','utf8');
const course=fs.readFileSync('app/src/main/assets/pmm_offline_course.js','utf8');
for(const name of ['back-top','legacy-back-top','back-button','guest-return']){
  assert(html.includes('id="'+name+'"'), 'Missing back control: '+name);
}
assert(html.includes("button.textContent=isBack?'بازگشت':''"), 'Submenu back must say بازگشت');
assert(html.includes("font-family:'PMM Estedad'"), 'Approved installed font absent');
assert(html.includes('id="course-note-toggle"'), 'Small notebook button missing');
assert(html.includes('id="course-notes-open"'), 'Notes list action missing');
assert(html.includes('<h3>یادداشت‌ها</h3>'), 'Notes list heading missing');
assert(course.includes('class="course-saved-note-text"'), 'Complete saved-note text not shown');
assert(course.includes("escapeHTML(note.text.trim())"), 'Stored note text must be escaped');
assert(course.includes('showTrack(found.track,found.index,true)'), 'Saved note no longer opens matching track');
assert(course.includes("if(!audio.getAttribute('src'))audio.src=encodeURI(activeTrack.url)"),
       'Audio must load URL only after user Play');
assert(course.includes("audio.removeAttribute('src');audio.load(); // Abort buffering when leaving the course."),
       'Course stream must be released when leaving');
assert(html.includes('releaseNahjInlineStream'), 'Nahj stream cleanup removed');
assert(html.includes('preload="none"'), 'Audio must not be preloaded');
assert(course.includes('logic.canMarkHeard'), 'Two-thirds listening rule lost');
assert(course.includes("if(!saveState())"), 'Note persistence failure must be reported');
console.log('PASS: v118 Persian Back; complete audio-linked notes; click-only audio; no changes to listening threshold');
