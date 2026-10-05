// Practice points. Points are awarded once per word, per kind, per day, so repeated
// submissions or repeated sessions cannot farm them. Mistakes never subtract points.
export const POINT_VALUES = {
  independent: 10,
  laterRecallBonus: 5,
  recheck: 5,
  supported: 4,
  effort: 2,
};

export const POINT_LABELS = {
  'sentence-practice': 'Sentence practice',
  independent: 'Independent recall',
  laterRecallBonus: 'Later-session recall bonus',
  recheck: 'Same-session recheck',
  supported: 'Supported practice',
  effort: 'Practice effort',
};

export function kindsForOutcome({ outcome, reviewKind }) {
  if (outcome === 'independent') {
    if (reviewKind === 'same-session') return ['recheck'];
    return reviewKind === 'later-session' ? ['independent', 'laterRecallBonus'] : ['independent'];
  }
  return [outcome === 'supported' ? 'supported' : 'effort'];
}

export function awardPoints(ledger, { date, sessionId, word, outcome, reviewKind }) {
  const taken = new Set(ledger.map((e) => e.key));
  const entries = [];
  for (const kind of kindsForOutcome({ outcome, reviewKind })) {
    const key = `${date}|${word}|${kind}`;
    if (taken.has(key)) continue;
    entries.push({ key, sessionId, word, kind, points: POINT_VALUES[kind], date });
  }
  return entries;
}

export const totalPoints = (ledger) => ledger.reduce((sum, e) => sum + e.points, 0);
