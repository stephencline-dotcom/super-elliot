import { h } from './dom.js';
import { EXTRA_PRACTICE } from '../data/extra.js';
import { CATALOG } from '../data/catalog.js';
import { lessonEvidence, recommendedLesson, MASTERY_DAYS } from '../mastery.js';

export function renderLessons(ctx) {
  const recommended = recommendedLesson(ctx.progress, ctx.today);
  return h('section', { class: 'card lesson-catalog' },
    h('p', { class: 'eyebrow' }, 'Your training season'),
    h('h1', null, 'Lessons'),
    h('p', { class: 'lead' }, 'A lesson stays active until you can remember its words independently.'),
    h('p', { class: 'note' }, `Mastery: required words spelled independently on ${MASTERY_DAYS} different days, plus a related-word check. Immediate coaching and same-session rechecks do not count. This is an adjustable practice goal.`),
    h('div', { class: 'lesson-list' }, CATALOG.map((l) => {
      const e = lessonEvidence(l, ctx.progress);
      const next = l.id === recommended.id;
      return h('article', { class: `lesson-item${next ? ' recommended' : ''}` },
        h('div', null,
          h('span', { class: 'lesson-status' }, `${l.unit ? l.unit + ' · ' : ''}${e.status}`),
          h('h2', null, l.title),
          h('p', null, l.summary ?? 'Coaching and practice are being prepared.'),
          h('p', { class: 'note' }, `Words: ${[...l.words, ...l.transfer].join(', ')}`),
          EXTRA_PRACTICE[l.id] ? h('p',{class:'note'},`Extra practice pool: ${EXTRA_PRACTICE[l.id].entries.length} additional words and ${EXTRA_PRACTICE[l.id].sentences.length} sentences, mixed with familiar review.`) : null,
          l.available ? h('p', { class: 'note' }, `${e.readyWords}/${l.words.length} required words ready · Related check: ${e.transferReady ? 'passed' : 'still practicing'}`) : null),
        l.available ? h('div', {class:'row'}, h('button', {
          class: `btn${next ? ' primary' : ''}`, type: 'button', 'data-autofocus': next,
          onClick: () => ctx.go('practice', { lessonId: l.id }),
        }, next ? 'Continue lesson' : e.mastered ? 'Review lesson' : 'Practice lesson'),
          EXTRA_PRACTICE[l.id] && ctx.progress.attempts.some(a=>a.currentLessonId===l.id || a.originLessonId===l.id) ? h('button',{class:'btn',type:'button',onClick:()=>ctx.go('practice',{lessonId:l.id,mode:'extra'})},'Extra practice') : null)
          : h('span', { class: 'note' }, 'Coming soon'));
    })),
    h('p', { class: 'note' }, 'More lessons will be added. Mastered words return in connected lessons with due reviews prioritized. New difficulties flag a refresher.'),
    h('div', { class: 'row' },
      h('button', { class: 'btn', type: 'button', onClick: () => ctx.go('home') }, 'Home'),
      h('button', { class: 'btn', type: 'button', onClick: () => ctx.go('parent') }, 'My Progress')));
}
