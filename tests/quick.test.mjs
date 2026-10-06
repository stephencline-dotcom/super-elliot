import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress, exportProgress, parseImport } from '../js/storage.js';
import { quickQueue, taughtCourses } from '../js/quick.js';
import { courseForWord } from '../js/data/catalog.js';
import { updateWordRecord } from '../js/scheduler.js';
import { lessonEvidence } from '../js/mastery.js';
import { CATALOG } from '../js/data/catalog.js';
import { totals } from '../js/stats.js';
function learned() {
 const p=emptyProgress();for(const word of CATALOG[0].words) {
  p.attempts.push({id:word,sessionId:'lesson',word,typed:word,date:'2026-10-05',stage:'try',correct:true,hintUsed:false,modelUsed:true,instructionShown:true,correctionShown:false,attemptType:'first',reviewKind:'first-exposure',originLessonId:'doubling-ing',currentLessonId:'doubling-ing',lessonContext:'core'});
  p.words[word]=updateWordRecord(null,{outcome:'supported',reviewKind:'first-exposure',today:'2026-10-05'});
 }return p;
}
test('quick review starts empty and uses only attempted words plus one authored application of a taught lesson',()=>{
 assert.deepEqual(quickQueue(emptyProgress(),'2026-10-06'),[]);
 const p=learned(),q=quickQueue(p,'2026-10-06');assert.equal(taughtCourses(p).length,1);assert.equal(q.length,5);
 assert.equal(q.filter(w=>w.fresh).length,1);assert.equal(q.at(-1).word,'padding');
 assert.ok(q.every(e=>courseForWord(e.word).id==='doubling-ing'));assert.ok(!q.some(e=>e.word==='planned'));
});
test('struggling rounds stay familiar and small histories produce short unique rounds',()=>{
 const p=learned();p.attempts[0].correct=false;p.attempts[1].correct=false;
 assert.ok(quickQueue(p,'2026-10-06').every(e=>!e.fresh));
 p.attempts=p.attempts.slice(0,1);assert.equal(quickQueue(p,'2026-10-06').length,1);
});
test('same-day play cannot advance spacing, establish mastery, or inflate later recall; new provenance round-trips',()=>{
 const p=learned(),a={...p.attempts[0],id:'quick1',sessionId:'quick',modelUsed:false,instructionShown:false,reviewKind:'same-day',lessonContext:'quick-review',date:'2026-10-06'};
 p.attempts.push(a);const counts=totals(p);assert.equal(counts.laterRecall,0);assert.equal(counts.sameSessionRecall,1);
 assert.equal(lessonEvidence(CATALOG[0],p).wordDays.running,0);
 const prev=updateWordRecord(null,{outcome:'independent',reviewKind:'later-session',today:'2026-10-06'});
 assert.equal(updateWordRecord(prev,{outcome:'independent',reviewKind:'same-day',today:'2026-10-06'}).intervalIndex,prev.intervalIndex);
 p.sessions.push({id:'quick',date:a.date,startedAt:new Date().toISOString(),lessonId:null,practiceMode:'quick',plannedWords:5,completedWords:1,results:[{word:a.word,outcome:'independent',reviewKind:'same-day',originLessonId:'doubling-ing',currentLessonId:'doubling-ing',lessonContext:'quick-review'}]});
 const x=parseImport(exportProgress(p));assert.ok(x.ok);assert.equal(x.data.sessions[0].practiceMode,'quick');assert.equal(x.data.attempts.at(-1).lessonContext,'quick-review');assert.equal(x.data.attempts.at(-1).reviewKind,'same-day');
});
