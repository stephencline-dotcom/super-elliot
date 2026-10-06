// A practice run has one clear meaning: a completed word or an attempted sentence.
// Evidence of spelling without help is tracked separately. Mistakes never subtract runs.
export const POINT_VALUES = { practiceRun: 1, 'sentence-practice': 1 };
export const POINT_LABELS = { practiceRun: 'Practice run — word completed', 'sentence-practice': 'Practice run — sentence practiced' };
const OLD_WORD_KINDS = ['independent', 'laterRecallBonus', 'supported', 'effort'];

// Display old scores on the new scale without rewriting the saved evidence or ledger.
// Multiple old bonuses for one word/day become one run, credited to the first session.
export function rewardEntries(ledger) {
  const seen = new Set(), entries = [];
  for (const e of ledger) {
    const kind = e.kind === 'sentence-practice' ? 'sentence-practice'
      : e.kind === 'practiceRun' || OLD_WORD_KINDS.includes(e.kind) ? 'practiceRun' : null;
    if (!kind) continue;
    const key = `${e.date}|${e.word}|${kind}`;
    if (seen.has(key)) continue;
    seen.add(key);entries.push({...e, key, kind, points:1});
  }
  return entries;
}
export function kindsForOutcome({ reviewKind }) {
  return reviewKind === 'same-session' ? [] : ['practiceRun'];
}
export function awardPoints(ledger, {date, sessionId, word, reviewKind}) {
  if (reviewKind === 'same-session') return [];
  const key = `${date}|${word}|practiceRun`;
  if (rewardEntries(ledger).some(e=>e.key===key)) return [];
  return [{key,date,sessionId,word,kind:'practiceRun',points:1}];
}
export const totalPoints = ledger => rewardEntries(ledger).length;
