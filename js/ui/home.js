import { h } from './dom.js';
import { cardCollection, dugoutWelcome } from './baseball.js';
import { scoreboard } from './components.js';
import { totals } from '../stats.js';
import { totalPoints } from '../scoring.js';

export function renderHome(ctx) {
  const t = totals(ctx.progress);
  const points = totalPoints(ctx.progress.points.ledger);
  const hasHistory = ctx.progress.attempts.length > 0;
  return h('section', { class: 'home' },
    h('div', { class: 'hero' },
      h('p', { class: 'eyebrow' }, 'Today at the ballpark'),
      h('h1', null, 'Spelling Ballpark'),
      h('p', { class: 'lead' }, hasHistory
        ? 'Welcome back. Pick up where you left off, one word at a time.'
        : 'Warm up with some batting practice. No timers, no pressure.')),
    dugoutWelcome(),
    scoreboard({
      label: 'Season totals',
      items: [
        { label: 'RUNS', value: points },
        { label: 'INDEPENDENT', value: t.independentSuccess },
        { label: 'LATER RECALL', value: t.laterRecall },
      ],
    }),
    h('p', { class: 'run-guide' }, '1 practice run for each word completed, plus 1 for sentence practice. Each word and sentence earns its run once a day. Spelling without help is tracked separately.'),
    h('div', { class: 'menu' },
      h('button', { class: 'btn primary big', type: 'button', 'data-autofocus': true, onClick: () => ctx.go('lessons') }, 'Choose a Lesson'),
      h('button', { class: 'btn big', type: 'button', onClick: () => ctx.go('parent') }, 'My Progress'),
      h('button', { class: 'btn big', type: 'button', onClick: () => ctx.go('settings') }, 'Settings')),
    cardCollection(ctx.progress));
}
