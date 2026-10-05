// Guided decisions and sentence spelling are recorded separately from isolated word mastery.
export const BUILD_OPTIONS = [
  { id: 'double', label: 'Double the final consonant' },
  { id: 'keep', label: 'Keep the base unchanged' },
];
export function buildExplanation(lesson, choice) {
  const b = lesson.build;
  const correct = choice === b.operation;
  const action = b.operation === 'double'
    ? `Double the ${b.letter}: ${b.base} + ${b.letter} + ${b.suffix}.`
    : `Keep ${b.base} unchanged, then add -${b.suffix}.`;
  const why = b.operation === 'double'
    ? `Keeping the base unchanged would miss the extra ${b.letter}. `
    : `This base stays as it is; do not add another final consonant. `;
  return { correct, text: correct ? `Correct! ${action}` : `Not this choice. ${why}${action}` };
}
const tokens = (text) => String(text).normalize('NFC').toLowerCase().match(/[a-z]+(?:['’][a-z]+)?/g) ?? [];
export function checkSentence(example, typed) {
  const expected = tokens(example.text), actual = tokens(typed);
  const checks = example.targets.map((word) => {
    const position = expected.indexOf(word);
    return { word, correct: actual[position] === word };
  });
  return { correct: expected.length === actual.length && expected.every((w,i) => w === actual[i]), checks };
}
export function recordActivity(progress, ctx, sessionId, lessonId, activity) {
  const rec = { id: ctx.newId('activity'), date: ctx.today, sessionId, lessonId, ...activity };
  (progress.activities ??= []).push(rec);
  ctx.persist();
  return rec;
}
