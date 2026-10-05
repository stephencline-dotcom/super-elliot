import { INTERVAL_DAYS } from './constants.js';
import { addDays } from './dates.js';

// Review rules (intentionally simple and visible):
//  - Independent success on a first exposure or later-session review: move one step up INTERVAL_DAYS.
//  - Independent success on a same-session recheck: interval unchanged (it is not delayed evidence).
//  - Supported success: one step down, review again tomorrow, offer instruction.
//  - Moved on with support: restart at tomorrow, offer instruction.
//  - Overdue words are never penalized: only the outcome changes the interval, not how late it was.
export function updateWordRecord(prev, { outcome, reviewKind, today }) {
  const p = prev ?? { intervalIndex: -1, needsInstruction: false, difficultyCount: 0 };
  let idx = p.intervalIndex;
  let needs = p.needsInstruction;
  let difficulty = p.difficultyCount;

  if (outcome === 'independent') {
    if (reviewKind !== 'same-session') idx = Math.min(idx + 1, INTERVAL_DAYS.length - 1);
    if (reviewKind === 'later-session') needs = false;
  } else if (outcome === 'supported') {
    idx = Math.max(-1, idx - 1);
    needs = true;
    difficulty += 1;
  } else {
    idx = -1;
    needs = true;
    difficulty += 1;
  }

  const days = outcome === 'independent' && idx >= 0 ? INTERVAL_DAYS[idx] : 1;
  return {
    intervalIndex: idx,
    dueDate: addDays(today, days),
    lastOutcome: outcome,
    lastPracticed: today,
    needsInstruction: needs,
    difficultyCount: difficulty,
  };
}

export function isDue(record, today) {
  return !record || record.dueDate <= today;
}
