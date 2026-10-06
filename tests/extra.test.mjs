import test from 'node:test';
import assert from 'node:assert/strict';
import { EXTRA_PRACTICE, EXTRA_WORDS, EXTRA_LESSONS } from '../js/data/extra.js';
import { CATALOG, courseForWord } from '../js/data/catalog.js';
import { wordEntry } from '../js/data/words.js';
import { lessonFor } from '../js/data/lessons.js';
import { extraQueue, extraSentencePool, chooseSentence } from '../js/extra.js';
import { emptyProgress, exportProgress, parseImport } from '../js/storage.js';
import { lessonEvidence } from '../js/mastery.js';
import { checkSentence } from '../js/activities.js';
import { createRun, submitAttempt } from '../js/session.js';
const today='2026-10-06',course=CATALOG[0];
function attempt(p,word,index=0,patch={}) {
 const a={id:`a${p.attempts.length}`,sessionId:`s${index}`,date:today,word,typed:word,stage:'try',correct:true,
  hintUsed:false,modelUsed:false,instructionShown:false,correctionShown:false,attemptType:'first',reviewKind:'later-session',
  currentLessonId:course.id,originLessonId:courseForWord(word).id,lessonContext:'extra-review',...patch};
 p.attempts.push(a);return a;
}
test('36 extra words and sentences have unique homes, valid coaching and complete models',()=>{
 assert.equal(EXTRA_WORDS.length,36);assert.equal(new Set(EXTRA_WORDS.map(w=>w.word)).size,36);
 assert.equal(Object.values(EXTRA_PRACTICE).flatMap(p=>p.sentences).length,36);
 for(const [id,pool] of Object.entries(EXTRA_PRACTICE)) {
  for(const entry of pool.entries) {
   assert.equal(courseForWord(entry.word).id,id);assert.ok(wordEntry(entry.word));
   const lesson=lessonFor(wordEntry(entry.word));assert.equal(lesson,EXTRA_LESSONS[entry.word]);
   assert.equal(lesson.steps.at(-1).pieces.map(p=>p.t).join(''),entry.word);
   assert.ok(lesson.hints[0].toLowerCase().includes(lesson.build?.base ?? entry.word.slice(0,-3)));
  }
  for(const sentence of pool.sentences) {
   assert.ok(checkSentence(sentence,sentence.text).correct);
   assert.ok(sentence.targets.every(w=>wordEntry(w)&&sentence.text.split(/\W+/).includes(w)));
  }
 }
});
test('extra sessions prioritize four unseen applications with two attempted review words and rotate forward',()=>{
 const p=emptyProgress();for(const w of course.words) attempt(p,w);
 const first=extraQueue(course,p,today,6);
 assert.equal(first.filter(w=>!p.attempts.some(a=>a.word===w)).length,4);
 assert.equal(first.filter(w=>course.words.includes(w)).length,2);
 assert.equal(new Set(first).size,6);
 first.forEach((w,i)=>attempt(p,w,i+1));
 const second=extraQueue(course,p,today,6);
 assert.equal(second.filter(w=>!p.attempts.some(a=>a.word===w)).length,4);
 assert.ok(second.filter(w=>EXTRA_WORDS.some(e=>e.word===w)&&!p.attempts.some(a=>a.word===w)).every(w=>!first.includes(w)));
});
test('review can connect to attempted earlier words, prioritizes difficulty, and never pulls unintroduced linked words',()=>{
 const p=emptyProgress();attempt(p,'running',0);attempt(p,'planned',1,{correct:false});
 const q=extraQueue(course,p,today,6);
 assert.ok(q.includes('planned'));assert.ok(q.includes('running'));assert.ok(!q.includes('clapped'));
 const short=extraQueue(course,p,today,2);assert.equal(short.length,2);assert.equal(short[1],'planned');
});
test('finite pools fall back to least recent practice without starving additional words',()=>{
 const p=emptyProgress();course.words.forEach((w,i)=>attempt(p,w,i));
 EXTRA_PRACTICE[course.id].entries.forEach((e,i)=>attempt(p,e.word,i+10));
 const first=extraQueue(course,p,today,6);assert.equal(first.length,6);assert.equal(new Set(first).size,6);
 first.forEach((w,i)=>attempt(p,w,i+30));
 const next=extraQueue(course,p,today,6);assert.ok(next.some(w=>!first.includes(w)));
});
test('extra sentence selection uses completed targets, hides unintroduced targets, and rotates by actual prompt history',()=>{
 const p=emptyProgress();attempt(p,'padding');attempt(p,'dipping');
 p.sessions.push({id:'extra',results:[{word:'padding'},{word:'dipping'}]});
 let pool=extraSentencePool(course,p,'extra');assert.equal(pool.length,2);assert.equal(pool[0].targets[0],'padding');assert.equal(pool[0].targets.length,1);
 attempt(p,'running');pool=extraSentencePool(course,p,'extra');assert.equal(pool.length,2);assert.equal(pool[0].targets.length,2);
 const first=chooseSentence(pool,p,course.id);p.activities.push({kind:'sentence',lessonId:course.id,attemptType:'first',prompt:first.text});
 assert.notEqual(chooseSentence(pool,p,course.id).text,first.text);
});
test('additional application evidence does not replace required words or transfer mastery',()=>{
 const p=emptyProgress();for(const e of EXTRA_PRACTICE[course.id].entries) for(const date of ['2026-10-05',today]) attempt(p,e.word,0,{date,lessonContext:'extra-new'});
 assert.equal(lessonEvidence(course,p).mastered,false);assert.equal(lessonEvidence(course,p).readyWords,0);
 const r=createRun({entry:wordEntry('padding'),progress:emptyProgress(),sessionId:'extra',recheck:false,skipLearn:true});
 assert.equal(r.view,'input');assert.equal(r.modelUsed,false);submitAttempt(r,'padding',{id:'app',sessionId:'extra',date:today});assert.equal(r.outcome,'independent');
});
test('extra provenance and session mode survive exports; legacy sessions default to lesson mode',()=>{
 const p=emptyProgress();attempt(p,'padding',0,{lessonContext:'extra-new'});
 p.sessions.push({id:'s0',date:today,startedAt:new Date().toISOString(),endedAt:null,plannedWords:6,completedWords:1,lessonId:course.id,practiceMode:'extra',results:[{word:'padding',outcome:'independent',reviewKind:'first-exposure',lessonContext:'extra-new',currentLessonId:course.id,originLessonId:course.id}]});
 const x=parseImport(exportProgress(p));assert.ok(x.ok);assert.equal(x.data.sessions[0].practiceMode,'extra');assert.equal(x.data.attempts[0].lessonContext,'extra-new');assert.equal(x.data.sessions[0].results[0].lessonContext,'extra-new');
 delete p.sessions[0].practiceMode;assert.equal(parseImport(exportProgress(p)).data.sessions[0].practiceMode,'lesson');
});
