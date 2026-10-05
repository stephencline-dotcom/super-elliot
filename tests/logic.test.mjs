// Run with: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS, visibleSentence, spokenSentence, isCorrect, wordEntry } from '../js/data/words.js';
import { LESSONS, lessonFor } from '../js/data/lessons.js';
import { OBSERVATIONS } from '../js/data/observations.js';
import { updateWordRecord } from '../js/scheduler.js';
import { awardPoints, totalPoints } from '../js/scoring.js';
import { emptyProgress, validateProgress, parseImport, exportProgress, loadProgress, saveProgress, applyImport, PROGRESS_KEY, BACKUP_KEY } from '../js/storage.js';
import { startSession, createRun, submitAttempt, advanceRun, moveOn, canMoveOn, requeueForRecheck } from '../js/session.js';
import { wordStats } from '../js/stats.js';
import { addDays } from '../js/dates.js';

const fakeStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
};
const ctxArgs = (n = 1) => ({ id: `a${n}`, sessionId: 's1', date: '2026-10-05' });
const newRun = (word, progress = emptyProgress(), recheck = false) =>
  createRun({ entry: wordEntry(word), record: progress.words[word], progress, sessionId: 's1', recheck });

test('word data: sentence hides target, speech includes it', () => {
  for (const w of WORDS) {
    assert.ok(w.sentence.includes('{word}'), w.word);
    assert.ok(!visibleSentence(w).toLowerCase().includes(w.word), w.word);
    assert.ok(spokenSentence(w).includes(w.word));
  }
});

test('word data: every observation target is in the bank; lessons are linked', () => {
  for (const o of OBSERVATIONS) assert.ok(wordEntry(o.target), o.target);
  assert.equal(OBSERVATIONS.length, 30);
  for (const w of ['environment', 'organization']) {
    const o = OBSERVATIONS.find((x) => x.target === w);
    assert.ok(o.inferredTarget && o.needsParentConfirmation);
  }
  for (const id of ['running', 'planned', 'studies', 'hopping', 'clapped', 'carries']) assert.ok(lessonFor(wordEntry(id)));
  assert.equal(Object.keys(LESSONS).length, 20);
  assert.ok(isCorrect(wordEntry('organization'), ' Organisation '));
});

test('full retry ladder: miss, hint, miss, guided, copy, hidden retry', () => {
  const run = newRun('running');
  assert.equal(run.view, 'learn');
  run.view = 'input';
  submitAttempt(run, 'runing', ctxArgs(1));
  assert.equal(run.nextPhase, 'hint');
  advanceRun(run);
  assert.ok(run.hintUsed && run.modelUsed && run.instructionShown);
  submitAttempt(run, 'runnin', ctxArgs(2));
  assert.equal(run.nextPhase, 'guided');
  advanceRun(run);
  assert.ok(run.modelUsed && canMoveOn(run));
  const r3 = submitAttempt(run, 'running', ctxArgs(3));
  assert.equal(r3.stage, 'guided-building');
  assert.equal(run.done, false);
  advanceRun(run);
  assert.equal(run.phase, 'final');
  const r4 = submitAttempt(run, 'running', ctxArgs(4));
  assert.equal(r4.attemptType, 'retry');
  assert.equal(run.outcome, 'supported');
});

test('retry loop is bounded: final miss ends the word; move-on works from guided', () => {
  const run = newRun('planned');
  run.view = 'input';
  submitAttempt(run, 'x', ctxArgs(1)); advanceRun(run);
  submitAttempt(run, 'x', ctxArgs(2)); advanceRun(run);
  submitAttempt(run, 'x', ctxArgs(3));
  assert.equal(run.done, false);
  advanceRun(run);
  assert.equal(run.phase, 'guided');
  moveOn(run);
  assert.equal(run.outcome, 'moved-on');

  const r2 = newRun('storm');
  r2.view = 'input';
  submitAttempt(r2, 'x', ctxArgs(1)); advanceRun(r2);
  submitAttempt(r2, 'x', ctxArgs(2)); advanceRun(r2);
  submitAttempt(r2, 'storm', ctxArgs(3)); advanceRun(r2);
  submitAttempt(r2, 'x', ctxArgs(4));
  assert.ok(r2.done);
  assert.equal(r2.outcome, 'moved-on');
});

test('first-try success is independent; hint success is supported', () => {
  const a = newRun('storm');
  const rec = submitAttempt(a, 'Storm', ctxArgs());
  assert.equal(a.outcome, 'independent');
  assert.ok(rec.correct && !rec.hintUsed && !rec.modelUsed && rec.attemptType === 'first');
  const b = newRun('storm');
  submitAttempt(b, 'stor', ctxArgs()); advanceRun(b);
  const rb = submitAttempt(b, 'storm', ctxArgs(2));
  assert.equal(b.outcome, 'supported');
  assert.ok(rb.hintUsed);
});

test('review kind: later-session vs same-session', () => {
  const p = emptyProgress();
  p.attempts.push({ word: 'storm', sessionId: 'old' });
  assert.equal(newRun('storm', p).reviewKind, 'later-session');
  assert.equal(newRun('storm', p, true).reviewKind, 'same-session');
  assert.equal(newRun('season', p).reviewKind, 'first-exposure');
});

test('scheduler: spacing grows, difficulty shortens, lateness is not penalized', () => {
  let r = updateWordRecord(null, { outcome: 'independent', reviewKind: 'first-exposure', today: '2026-10-05' });
  assert.equal(r.dueDate, '2026-10-06');
  r = updateWordRecord(r, { outcome: 'independent', reviewKind: 'later-session', today: '2026-10-06' });
  assert.equal(r.dueDate, addDays('2026-10-06', 2));
  r = updateWordRecord(r, { outcome: 'independent', reviewKind: 'later-session', today: '2026-10-20' }); // very late
  assert.equal(r.intervalIndex, 2);
  const same = updateWordRecord(r, { outcome: 'independent', reviewKind: 'same-session', today: '2026-10-20' });
  assert.equal(same.intervalIndex, 2);
  const hard = updateWordRecord(r, { outcome: 'supported', reviewKind: 'later-session', today: '2026-10-20' });
  assert.equal(hard.intervalIndex, 1);
  assert.ok(hard.needsInstruction);
  assert.equal(hard.dueDate, '2026-10-21');
  const moved = updateWordRecord(r, { outcome: 'moved-on', reviewKind: 'later-session', today: '2026-10-20' });
  assert.equal(moved.intervalIndex, -1);
});

test('points cannot be farmed', () => {
  const ledger = [];
  const args = { date: '2026-10-05', sessionId: 's1', word: 'storm', outcome: 'independent', reviewKind: 'first-exposure' };
  ledger.push(...awardPoints(ledger, args));
  assert.equal(totalPoints(ledger), 10);
  assert.deepEqual(awardPoints(ledger, args), []);
  assert.deepEqual(awardPoints(ledger, { ...args, sessionId: 's2' }), []);
  const later = awardPoints(ledger, { ...args, date: '2026-10-09', reviewKind: 'later-session' });
  assert.equal(later.reduce((s, e) => s + e.points, 0), 15);
  assert.ok(awardPoints([], { ...args, outcome: 'supported' })[0].points < 10);
});

test('session queue: starts empty, due words first, supported words requeue once', () => {
  const p = emptyProgress();
  const s = startSession({ words: WORDS, progress: p, today: '2026-10-05', length: 8, id: 's1' });
  assert.equal(s.queue.length, 8);
  assert.equal(s.queue[0].word, 'running');
  p.words.season = updateWordRecord(null, { outcome: 'supported', reviewKind: 'first-exposure', today: '2026-10-01' });
  const s2 = startSession({ words: WORDS, progress: p, today: '2026-10-05', length: 5, id: 's2' });
  assert.equal(s2.queue[0].word, 'season');
  requeueForRecheck(s2, 'season'); requeueForRecheck(s2, 'season');
  assert.equal(s2.queue.filter((q) => q.recheck).length, 1);
});

test('storage: starts empty, persists, round-trips export/import, rejects bad data', () => {
  const st = fakeStorage();
  const loaded = loadProgress(st);
  assert.equal(loaded.status, 'empty');
  assert.equal(loaded.progress.attempts.length, 0);

  const p = loaded.progress;
  const run = newRun('storm', p);
  p.attempts.push(submitAttempt(run, 'storm', ctxArgs()));
  p.words.storm = updateWordRecord(null, { outcome: 'independent', reviewKind: 'first-exposure', today: '2026-10-05' });
  p.points.ledger.push(...awardPoints([], { date: '2026-10-05', sessionId: 's1', word: 'storm', outcome: 'independent', reviewKind: 'first-exposure' }));
  assert.ok(saveProgress(st, p));
  assert.equal(loadProgress(st).progress.attempts.length, 1); // "refresh"
  assert.equal(wordStats(p).storm.independentSuccess, 1);

  const imp = parseImport(exportProgress(p));
  assert.ok(imp.ok);
  assert.deepEqual(imp.data.attempts, p.attempts);

  assert.ok(!parseImport('not json').ok);
  assert.ok(!parseImport('{"app":"x"}').ok);
  const evil = JSON.parse(exportProgress(p));
  evil.words.__proto__ = { intervalIndex: 0 };
  evil.attempts[0].stage = 'nope';
  assert.ok(!validateProgress(evil).ok);

  const other = emptyProgress();
  assert.ok(applyImport(st, p, other));
  assert.ok(st._m.has(BACKUP_KEY));
  assert.equal(JSON.parse(st._m.get(PROGRESS_KEY)).attempts.length, 0);
  assert.equal(JSON.parse(st._m.get(BACKUP_KEY)).attempts.length, 1);
});

test('unreadable stored progress is kept, not overwritten silently', () => {
  const st = fakeStorage();
  st.setItem(PROGRESS_KEY, '{broken');
  const r = loadProgress(st);
  assert.equal(r.status, 'unreadable');
  assert.equal(st.getItem('spelling-ballpark:progress-unreadable:v1'), '{broken');
});
