// Evidence summaries. Nothing here says a word is "mastered"; it only counts what happened.
const unsupported = (a) => a.correct && a.attemptType === 'first' && !a.hintUsed && !a.modelUsed && !a.instructionShown && !a.correctionShown && a.reviewKind !== 'same-session';

export function emptyCounts() {
  return { attempts: 0, hintAttempts: 0, modelAttempts: 0, guidedPractice: 0, independentSuccess: 0, laterRecall: 0, sameSessionRecall: 0, misses: 0 };
}

export function countAttempt(c, a) {
  c.attempts += 1;
  if (a.hintUsed) c.hintAttempts += 1;
  if (a.modelUsed) c.modelAttempts += 1;
  if (!a.correct) c.misses += 1;
  else if (a.reviewKind === 'same-session' && a.attemptType === 'first' && !a.hintUsed && !a.modelUsed && !a.instructionShown && !a.correctionShown) c.sameSessionRecall += 1;
  else if (unsupported(a) && a.reviewKind === 'later-session') c.laterRecall += 1;
  else if (unsupported(a)) c.independentSuccess += 1;
  else c.guidedPractice += 1;
  return c;
}

export function wordStats(progress) {
  const out = {};
  for (const a of progress.attempts) countAttempt((out[a.word] ??= emptyCounts()), a);
  return out;
}

export function totals(progress) {
  const c = emptyCounts();
  for (const a of progress.attempts) countAttempt(c, a);
  return c;
}

export function sessionSummary(progress, sessionId) {
  const attempts = progress.attempts.filter((a) => a.sessionId === sessionId);
  const counts = emptyCounts();
  attempts.forEach((a) => countAttempt(counts, a));
  const ledger = progress.points.ledger.filter((e) => e.sessionId === sessionId);
  const session = progress.sessions.find((s) => s.id === sessionId) ?? null;
  return { session, attempts, counts, ledger, points: ledger.reduce((s, e) => s + e.points, 0) };
}
