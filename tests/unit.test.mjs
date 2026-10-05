import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, courseForWord } from '../js/data/catalog.js';
import { LESSONS } from '../js/data/lessons.js';
import { WORDS, wordEntry } from '../js/data/words.js';
import { buildExplanation, checkSentence } from '../js/activities.js';
import { emptyProgress, parseImport, exportProgress, validateProgress } from '../js/storage.js';
import { lessonQueue, lessonEvidence } from '../js/mastery.js';

test('first full unit has three lessons, 18 unique targets, valid examples and correct word-building pieces',()=>{
 const unit=CATALOG.filter(l=>l.unit==='Doubling and endings');assert.equal(unit.length,3);
 assert.equal(unit.flatMap(l=>[...l.words,...l.transfer]).length,18);
 assert.equal(new Set(WORDS.map(w=>w.word)).size,WORDS.length);
 for(const l of unit) {
  assert.equal(l.words.length,4);assert.equal(l.transfer.length,2);
  for(const w of [...l.words,...l.transfer]) {
   const lesson=LESSONS[wordEntry(w).lessonId];assert.ok(lesson.build);
   assert.equal(lesson.steps.at(-1).pieces.map(p=>p.t).join(''),w);
   assert.equal(buildExplanation(lesson,lesson.build.operation).correct,true);
   assert.equal(buildExplanation(lesson,lesson.build.operation==='double'?'keep':'double').correct,false);
  }
  for(const s of l.sentences) for(const w of s.targets) {
   assert.ok(courseForWord(w));assert.ok(s.text.toLowerCase().split(/\W+/).includes(w));
  }
 }
});
test('sentence checks ignore capitals/punctuation but reject spelling errors and report target evidence',()=>{
 const s={text:'He dropped the ball.',targets:['dropped']};
 assert.equal(checkSentence(s,'he dropped the ball!').correct,true);
 assert.equal(checkSentence(s,'He dropt the ball.').correct,false);
 assert.equal(checkSentence(s,'He dropt the ball.').checks[0].correct,false);
 assert.equal(checkSentence(s,'He dropped the bal.').checks[0].correct,true);
 assert.equal(checkSentence(s,'He dropped the bal.').correct,false);
});
test('activities roundtrip, old files without activities load, malformed activities are rejected',()=>{
 const p=emptyProgress();p.activities.push({id:'ac1',date:'2026-10-05',sessionId:'s1',lessonId:'doubling-ing',
 kind:'sentence',word:'running',prompt:'She is running.',typed:'She is runing.',correct:false,modelUsed:false,
 attemptType:'first',checks:[{word:'running',correct:false,originLessonId:'doubling-ing'}]});
 const x=parseImport(exportProgress(p));assert.ok(x.ok);assert.deepEqual(x.data.activities,p.activities);
 assert.equal(lessonEvidence(CATALOG[0],x.data).mastered,false);
 const old=structuredClone(p);delete old.activities;assert.ok(validateProgress(old).ok);
 for(const activities of [[null],{},[{...p.activities[0],correct:'yes'}]]) {
  assert.equal(validateProgress({...p,activities}).ok,false);
 }
});
test('short sessions rotate beyond the first targets and reserve connected review slots',()=>{
 const p=emptyProgress(),lesson=CATALOG[0];
 for(const w of lesson.words) p.attempts.push({word:w,date:'2026-10-05',correct:true});
 const q=lessonQueue(lesson,p,'2026-10-05',5);
 assert.ok(lesson.transfer.every(w=>q.slice(0,5).includes(w)));
 for(const l of CATALOG.slice(0,2)) {
  for(const w of l.words) for(const date of ['2026-10-05','2026-10-06']) p.attempts.push({
   word:w,date,originLessonId:l.id,correct:true,stage:'try',attemptType:'first',reviewKind:'later-session'});
  p.attempts.push({word:l.transfer[0],date:'2026-10-06',originLessonId:l.id,correct:true,stage:'try',attemptType:'first',reviewKind:'later-session'});
 }
 const mixed=lessonQueue(CATALOG[2],p,'2026-10-07',5).slice(0,5);
 assert.equal(mixed.filter(w=>courseForWord(w).id!==CATALOG[2].id).length,2);
 assert.equal(mixed.filter(w=>courseForWord(w).id===CATALOG[2].id).length,3);
});
