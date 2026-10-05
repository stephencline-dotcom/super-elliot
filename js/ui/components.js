import { h } from './dom.js';
import { alignDiff } from '../diff.js';

export function scoreboard({ label, items }) {
  return h('div', { class: 'scoreboard', role: 'group', 'aria-label': label },
    items.map((i) => h('div', { class: 'sb-cell' },
      h('span', { class: 'sb-label' }, i.label),
      h('span', { class: 'sb-value' }, String(i.value)))));
}

// Animated word-building. Each step fades in; reduced motion shows every step at once.
export function wordBuilder(steps, { finalWord } = {}) {
  return h('ol', { class: 'builder' },
    steps.map((s, i) => h('li', { class: 'build-step', style: `--i:${i}` },
      h('span', { class: 'build-text' }, s.text),
      h('span', { class: 'build-pieces', 'aria-label': s.pieces.map((p) => p.t).join(' plus ') },
        s.pieces.map((p) => h('span', { class: `piece ${p.kind}`, 'aria-hidden': 'true' }, p.t))))),
    finalWord ? h('li', { class: 'build-step final', style: `--i:${steps.length}` },
      h('span', { class: 'build-text' }, 'Together:'),
      h('span', { class: 'piece whole' }, finalWord)) : null);
}

// Plain letter tiles for words without an authored lesson.
export function letterBuilder(word) {
  return wordBuilder([{ text: 'Say it slowly, then look at each letter.', pieces: [...word].map((t) => ({ t, kind: 'base' })) }], { finalWord: word });
}

export function diffView(target, typed) {
  const d = alignDiff(target, typed);
  const row = (marks, cls) => h('span', { class: `diff-word ${cls}` },
    marks.map((m) => h('span', { class: m.match ? 'ok' : 'off' }, m.ch)));
  return h('div', { class: 'diff' },
    h('div', null, h('span', { class: 'tag' }, 'You wrote'), row(d.typed, 'typed')),
    h('div', null, h('span', { class: 'tag' }, 'Correct spelling'), row(d.target, 'target')));
}

export function pointList(entries, labels) {
  if (!entries.length) return null;
  return h('ul', { class: 'points-list' },
    entries.map((e) => h('li', null, h('strong', null, `+${e.points}`), ` ${labels[e.kind]}`)));
}
