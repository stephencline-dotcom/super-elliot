import { h } from './dom.js';
import { cardCollection, baseTrail } from './baseball.js';
import { scoreboard, pointList } from './components.js';
import { sessionSummary } from '../stats.js';
import { POINT_LABELS } from '../scoring.js';

const OUTCOME_TEXT = {
  independent: 'Independent',
  supported: 'Supported',
  'moved-on': 'Finished with support',
};
const KIND_TEXT = { 'first-exposure': 'new', 'same-session': 'same-session recheck', 'later-session': 'later-session review' };

export function renderResults(ctx, { sessionId }) {
  const sum = sessionSummary(ctx.progress, sessionId);
  const c = sum.counts;
  const results = sum.session?.results ?? [];
  const delayed = results.filter((r) => r.reviewKind === 'later-session');
  const delayedOk = delayed.filter((r) => r.outcome === 'independent').length;

  return h('section', { class: 'card results' },
    h('p', { class: 'eyebrow' }, 'Session results'),
    h('h1', null, 'Nice work at practice today'),
    scoreboard({
      label: 'Session totals',
      items: [
        { label: 'POINTS', value: sum.points },
        { label: 'GUIDED', value: c.guidedPractice },
        { label: 'INDEPENDENT', value: c.independentSuccess },
        { label: 'LATER RECALL', value: c.laterRecall },
      ],
    }),
    h('ul', { class: 'plain' },
      h('li', null, h('strong', null, 'Guided practice: '), `${c.guidedPractice} correct answers with a hint, a model, or a retry.`),
      h('li', null, h('strong', null, 'Independent success: '), `${c.independentSuccess} correct first tries with no support.`),
      h('li', null, h('strong', null, 'Later recall: '),
        delayed.length ? `${delayedOk} of ${delayed.length} words from earlier sessions spelled independently.` : 'No words from earlier sessions came up this time.')),
    baseTrail(sum.session?.completedWords ?? 0),
    cardCollection(ctx.progress),
    h('h2', null, 'Building and game situations'),
    h('p', { class: 'note' }, (() => {
      const activities = (ctx.progress.activities ?? []).filter((a) => a.sessionId === sessionId);
      const build = activities.filter((a) => a.kind === 'build');
      const sentences = activities.filter((a) => a.kind === 'sentence' && a.attemptType !== 'skipped');
      return `${build.filter((a) => a.correct).length}/${build.length} building choices correct; ${sentences.filter((a) => a.correct).length}/${sentences.length} sentence attempts correct. Recorded separately from word mastery.`;
    })()),
    h('h2', null, 'Points earned'),
    pointList(sum.ledger, POINT_LABELS) ?? h('p', null, 'No new points this time. Points are awarded once per word per kind each day.'),
    h('h2', null, 'Words'),
    results.length
      ? h('ul', { class: 'word-results' }, results.map((r) => h('li', null,
        h('strong', null, r.word), ` — ${OUTCOME_TEXT[r.outcome]} (${KIND_TEXT[r.reviewKind]})`)))
      : h('p', null, 'No words were completed in this session.'),
    h('p', { class: 'note' }, 'You can finish for today. Return on another day to check what you remember. Mastery requires independent spelling on different days and a related-word check. Mastered lessons stay available for optional practice.'),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary big', type: 'button', 'data-autofocus': true, onClick: () => ctx.go('home') }, 'Done for today'),
      h('button', { class: 'btn', type: 'button', onClick: () => ctx.go('practice', { lessonId: sum.session?.lessonId }) }, 'Extra practice (optional)')));
}
