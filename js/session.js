import { isCorrect } from './data/words.js';
import { lessonFor } from './data/lessons.js';

const STAGE_BY_PHASE = { try: 'try', hint: 'try-again', guided: 'guided-building', final: 'final-try' };

// Practice order: due reviews, then new words (starter-lesson words come first in the bank),
// then not-yet-due words only if the session still has room.
export function buildQueue({ words, progress, today, length }) {
  const due = [];
  const fresh = [];
  const later = [];
  for (const w of words) {
    const rec = progress.words[w.word];
    if (!rec) fresh.push(w);
    else if (rec.dueDate <= today) due.push(w);
    else later.push(w);
  }
  due.sort((a, b) => progress.words[a.word].dueDate.localeCompare(progress.words[b.word].dueDate));
  later.sort((a, b) => progress.words[a.word].lastPracticed.localeCompare(progress.words[b.word].lastPracticed));

  const reserveForNew = Math.min(2, fresh.length);
  const dueFirst = due.slice(0, Math.max(0, length - reserveForNew));
  const picked = [...dueFirst, ...fresh, ...due.slice(dueFirst.length), ...later];
  return picked.slice(0, length);
}

export function startSession({ words, progress, today, length, id }) {
  const queue = buildQueue({ words, progress, today, length }).map((w) => ({ word: w.word, recheck: false }));
  return { id, date: today, planned: queue.length, queue, pos: 0, completed: 0, results: [] };
}

export const currentEntry = (s) => s.queue[s.pos] ?? null;

// Supported words come back once later in the same session as an independent recheck.
export function requeueForRecheck(s, word) {
  if (s.queue.some((q) => q.recheck && q.word === word)) return;
  s.queue.splice(Math.min(s.pos + 4, s.queue.length), 0, { word, recheck: true });
}

export function createRun({ entry, record, progress, sessionId, recheck, skipLearn = false }) {
  const lesson = lessonFor(entry);
  const seenBefore = progress.attempts.some((a) => a.word === entry.word && a.sessionId !== sessionId);
  const reviewKind = recheck ? 'same-session' : seenBefore ? 'later-session' : 'first-exposure';
  const showLearn = !!lesson && !recheck && !skipLearn && reviewKind === 'first-exposure';
  return {
    entry,
    lesson,
    reviewKind,
    phase: 'try', // try | hint | guided | final
    view: showLearn ? 'learn' : 'input', // learn | input | feedback
    nextPhase: null,
    attemptCount: 0,
    hintUsed: false,
    modelUsed: showLearn,
    instructionShown: showLearn,
    correctionShown: false,
    done: false,
    outcome: null, // independent | supported | moved-on
    last: null,
  };
}

export function submitAttempt(run, typed, { id, sessionId, date }) {
  const clean = String(typed).trim().slice(0, 60);
  const correct = isCorrect(run.entry, clean);
  const record = {
    id,
    currentLessonId: run.currentLessonId ?? null,
    originLessonId: run.originLessonId ?? null,
    lessonContext: run.lessonContext ?? null,
    word: run.entry.word,
    typed: clean,
    date,
    sessionId,
    stage: STAGE_BY_PHASE[run.phase],
    correct,
    hintUsed: run.hintUsed,
    modelUsed: run.modelUsed,
    correctionShown: run.correctionShown,
    instructionShown: run.instructionShown,
    attemptType: run.attemptCount === 0 ? 'first' : 'retry',
    reviewKind: run.reviewKind,
  };
  run.attemptCount += 1;
  run.view = 'feedback';
  run.last = { correct, typed: clean };

  if (correct) {
    if (run.phase === 'guided') run.nextPhase = 'final';
    else {
      run.done = true;
      run.outcome = run.phase === 'try' && !run.modelUsed ? 'independent' : 'supported';
    }
  } else {
    run.correctionShown = true;
    if (run.phase === 'try') run.nextPhase = 'hint';
    else if (run.phase === 'hint') run.nextPhase = 'guided';
    else if (run.phase === 'guided') run.nextPhase = 'guided';
    else {
      run.done = true;
      run.outcome = 'moved-on';
    }
  }
  return record;
}

export function advanceRun(run) {
  if (run.done || !run.nextPhase) return;
  run.phase = run.nextPhase;
  if (run.phase === 'hint') run.hintUsed = true;
  if (run.phase === 'guided') run.modelUsed = true;
  run.view = 'input';
}

export function canMoveOn(run) {
  return !run.done && run.phase === 'guided';
}

export function moveOn(run) {
  run.done = true;
  run.outcome = 'moved-on';
  run.view = 'feedback';
  run.last = { correct: false, typed: null, movedOn: true };
}

export function hintFor(run) {
  const h = run.lesson?.hints?.[0];
  if (h) return h;
  const w = run.entry.word;
  return `The word has ${w.length} letters and starts with "${w[0]}". Say it slowly and listen for each part.`;
}
