import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../js/data/catalog.js';
import { wordEntry } from '../js/data/words.js';
import { lessonEvidence, lessonQueue, recommendedLesson } from '../js/mastery.js';
import { createRun, submitAttempt } from '../js/session.js';
import { emptyProgress, parseImport, exportProgress, validateProgress } from '../js/storage.js';
import { updateWordRecord } from '../js/scheduler.js';
const lesson = CATALOG[0];
function attempt(p, word, date, patch = {}) {
  const a = { id: `a-${p.attempts.length}`, word, typed: word, date, sessionId: `s-${p.attempts.length}`,
    stage: 'try', correct: true, hintUsed: false, modelUsed: false, instructionShown: false,
    correctionShown: false, attemptType: 'first', reviewKind: 'later-session',
    currentLessonId: lesson.id, originLessonId: lesson.id, lessonContext: lesson.words.includes(word) ? 'core' : 'transfer', ...patch };
  p.attempts.push(a);
  p.words[word] = updateWordRecord(p.words[word], { outcome: a.correct ? 'independent' : 'supported', reviewKind: a.reviewKind, today: date });
  return a;
}
function mastered() {
  const p = emptyProgress();
  for (const word of lesson.words) { attempt(p, word, '2026-10-05'); attempt(p, word, '2026-10-06'); }
  attempt(p, 'flipping', '2026-10-05');
  return p;
}
test('catalog has unique IDs and valid authored active words; every word has one home', () => {
  const ids = CATALOG.map(l => l.id); assert.equal(new Set(ids).size, ids.length);
  const words = CATALOG.flatMap(l => [...l.words, ...l.transfer]); assert.equal(new Set(words).size, words.length);
  for (const l of CATALOG) for (const w of [...l.words, ...l.transfer]) {
    assert.ok(wordEntry(w), w); if(l.available) assert.ok(wordEntry(w).lessonId);
  }
});
test('coaching and same-session rechecks cannot establish mastery; same-day repetition is one day', () => {
  const p = emptyProgress();
  attempt(p, 'running', '2026-10-05', { modelUsed: true, instructionShown: true });
  attempt(p, 'running', '2026-10-06', { reviewKind: 'same-session' });
  attempt(p, 'running', '2026-10-07'); attempt(p, 'running', '2026-10-07');
  for (const word of lesson.words.filter(w=>w!=='running')) { attempt(p,word,'2026-10-07');attempt(p,word,'2026-10-08'); }
  attempt(p, 'flipping', '2026-10-07');
  assert.equal(lessonEvidence(lesson,p).wordDays.running,1);
  assert.equal(lessonEvidence(lesson,p).mastered,false);
  assert.equal(recommendedLesson(p, '2026-10-07').id, lesson.id);
  attempt(p,'running','2026-10-08'); assert.equal(lessonEvidence(lesson,p).mastered,true);
});
test('required words alone are insufficient without an independent related check', () => {
  const p=emptyProgress();attempt(p,'running','2026-10-05');attempt(p,'running','2026-10-06');
  attempt(p,'flipping','2026-10-06',{hintUsed:true});assert.equal(lessonEvidence(lesson,p).mastered,false);
});
test('new connected lesson includes due old words and retains refresher evidence', () => {
  const p=mastered(); assert.equal(lessonEvidence(lesson,p).status,'Mastered');
  const q=lessonQueue(CATALOG[1],p,'2026-10-10');assert.equal(q.filter(w=>[...lesson.words,...lesson.transfer].includes(w)).length,2);
  attempt(p,'running','2026-10-10',{currentLessonId:CATALOG[1].id,lessonContext:'connected-review',correct:false,typed:'runing'});
  assert.equal(lessonEvidence(lesson,p).status,'Refresher needed');
  assert.equal(recommendedLesson(p,'2026-10-10').id,lesson.id);
  attempt(p,'running','2026-10-11');assert.equal(lessonEvidence(lesson,p).mastered,false);
  attempt(p,'running','2026-10-12');assert.equal(lessonEvidence(lesson,p).mastered,true);
});
test('connected review provenance survives export/import and legacy files stay valid', () => {
  const p=mastered();
  attempt(p,'running','2026-10-10',{currentLessonId:'doubling-ed',lessonContext:'connected-review'});
  const x=parseImport(exportProgress(p));assert.ok(x.ok);assert.deepEqual(x.data.attempts,p.attempts);
  assert.equal(lessonEvidence(lesson,x.data).mastered,true);
  const old=structuredClone(p);for(const a of old.attempts) { delete a.originLessonId;delete a.currentLessonId;delete a.lessonContext;delete a.instructionShown; }
  assert.ok(validateProgress(old).ok);assert.equal(lessonEvidence(lesson,validateProgress(old).data).mastered,false);
});
test('first exposure after Coach’s Tip is supported; later uncoached retrieval is independent', () => {
  const p=emptyProgress();const r=createRun({entry:wordEntry('running'),progress:p,sessionId:'s1',recheck:false});
  r.view='input';const a=submitAttempt(r,'running',{id:'a1',sessionId:'s1',date:'2026-10-05'});
  assert.equal(r.outcome,'supported');assert.ok(a.instructionShown&&a.modelUsed);p.attempts.push(a);
  const next=createRun({entry:wordEntry('running'),progress:p,sessionId:'s2',recheck:false});
  assert.equal(next.view,'input');submitAttempt(next,'running',{id:'a2',sessionId:'s2',date:'2026-10-06'});
  assert.equal(next.outcome,'independent');
});
