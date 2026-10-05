import { CATALOG } from './data/catalog.js';

// Adjustable instructional policy, not a diagnostic or validated assessment score.
export const MASTERY_DAYS = 2;
export const independentAttempt = (a) => a.correct && a.stage === 'try' && a.attemptType === 'first'
  && !a.hintUsed && !a.modelUsed && !a.correctionShown && !a.instructionShown
  && a.reviewKind !== 'same-session';

export function lessonEvidence(lesson, progress) {
  const words = [...lesson.words, ...lesson.transfer];
  const dates = Object.fromEntries(words.map((w) => [w, new Set()]));
  let everMastered = false;
  let relevantAttempts = 0;
  const ready = () => lesson.words.every((w) => dates[w].size >= MASTERY_DAYS)
    && lesson.transfer.some((w) => dates[w].size > 0);
  // Old records remain visible but cannot establish mastery without lesson provenance.
  const attempts = progress.attempts.filter((a) => words.includes(a.word) && a.originLessonId === lesson.id)
    .map((a, order) => ({ ...a, order }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
  for (const a of attempts) {
    relevantAttempts++;
    if (a.attemptType !== 'first' || a.reviewKind === 'same-session') continue;
    if (!a.correct) dates[a.word].clear();
    else if (independentAttempt(a)) dates[a.word].add(a.date);
    if (ready()) everMastered = true;
  }
  const mastered = ready();
  const readyWords = lesson.words.filter((w) => dates[w].size >= MASTERY_DAYS).length;
  const transferReady = lesson.transfer.some((w) => dates[w].size > 0);
  let status = !lesson.available ? 'Coming soon' : mastered ? 'Mastered'
    : everMastered ? 'Refresher needed' : !relevantAttempts ? 'Available'
    : lesson.words.every((w) => dates[w].size > 0) ? 'Ready for review' : 'In progress';
  return { status, mastered, everMastered, readyWords, transferReady,
    wordDays: Object.fromEntries(words.map((w) => [w, dates[w].size])) };
}

export function recommendedLesson(progress, today) {
  const available = CATALOG.filter((l) => l.available);
  // Active lessons stay the default until the mastery criterion is met.
  return available.find((l) => !lessonEvidence(l, progress).mastered)
    ?? available.find((l) => [...l.words, ...l.transfer].some((w) => progress.words[w]?.dueDate <= today))
    ?? available[0];
}

export function lessonQueue(lesson, progress, today, length = Infinity) {
  const evidence = lessonEvidence(lesson, progress);
  const linked = CATALOG.filter((l) => l.available && lesson.links.includes(l.id)
    && lessonEvidence(l, progress).everMastered);
  const review = linked.flatMap((l) => [...l.words, ...l.transfer])
    .sort((a, b) => (progress.words[a]?.dueDate ?? '').localeCompare(progress.words[b]?.dueDate ?? ''))
    .slice(0, 2);
  const own = [...lesson.words, ...lesson.transfer];
  // Pending targets first; mastered targets remain available for maintenance.
  own.sort((a, b) => {
    const threshold = (w) => lesson.words.includes(w) ? MASTERY_DAYS : 1;
    // Avoid starving later targets in short sessions, or repeating today's successes first.
    const todayScore = (w) => Number(progress.attempts.some((a) => a.word === w && a.date === today && a.correct));
    return todayScore(a) - todayScore(b)
      || Number(evidence.wordDays[a] >= threshold(a)) - Number(evidence.wordDays[b] >= threshold(b))
      || (progress.words[a]?.dueDate ?? '').localeCompare(progress.words[b]?.dueDate ?? '');
  });
  const reserve = Math.min(2, review.length, Math.max(0, length - 2));
  return [...new Set([...own.slice(0, length - reserve), ...review.slice(0, reserve), ...own.slice(length - reserve)])];
}
