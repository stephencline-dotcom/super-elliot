import { h } from './dom.js';
// Rewards reflect completed practice, not a claim of spelling mastery.
const CARDS = [
  ['DUGOUT', 'Ready to play', 'Showed up and completed a practice.'],
  ['GLOVE', 'Steady practice', 'Completed three practices.'],
  ['BAT', 'Keep swinging', 'Completed six practices.'],
  ['BALLPARK', 'Growing season', 'Completed ten practices.'],
];
export function baseTrail(completed) {
  const position = completed % 4;
  return h('div', { class: 'base-trail', 'aria-label': `${completed} words completed; ${Math.floor(completed / 4)} practice runs. This measures practice, not mastery.` },
    h('span', { class: 'trail-label' }, 'ROUND THE BASES'),
    ['HOME', '1ST', '2ND', '3RD'].map((label, i) => h('span', { class: `trail-base${i === position ? ' runner' : ''}`, 'aria-current': i === position ? 'step' : null }, label)),
    h('span', { class: 'trail-runs' }, `${Math.floor(completed / 4)} practice runs`));
}
export function cardCollection(progress) {
  const practices = progress.sessions.filter(s => s.endedAt && s.completedWords >= Math.min(4, s.plannedWords) && s.completedWords > 0).length;
  const thresholds = [1, 3, 6, 10];
  const unlocked = thresholds.filter(n => practices >= n).length;
  return h('section', { class: 'practice-collection', 'aria-label': 'Practice card collection' },
    h('div', { class: 'collection-heading' }, h('h2', null, 'Your practice cards'), h('span', null, `${unlocked} / 4 collected`)),
    h('div', { class: 'collectible-grid' }, CARDS.map(([icon, title, description], i) => h('article', { class: `collectible${practices >= thresholds[i] ? ' unlocked' : ''}` },
      h('span', { class: 'card-emblem', 'aria-hidden': true }, icon), h('strong', null, title),
      h('p', null, practices >= thresholds[i] ? description : `Unlock after ${thresholds[i]} completed practices.`)))),
    h('p', { class: 'note' }, 'Cards celebrate practice. Each qualifying session completes at least four words, or all words in a shorter lesson. Spelling mastery is tracked separately.'));
}
export function dugoutWelcome() {
  return h('div', { class: 'dugout-welcome' },
    h('div', { class: 'original-player', 'aria-hidden': true },
      h('span', { class: 'player-cap' }, 'SB'), h('span', { class: 'player-face' }, '●  ●'), h('span', { class: 'player-jersey' }, '01')),
    h('p', null, 'Your seat in the dugout is ready. Learn a play, take a swing, and watch your spelling grow.'));
}
