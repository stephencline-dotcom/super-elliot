import { replaceContent, h, focusSoon, announce } from './dom.js';
import { BUILD_OPTIONS, recordActivity } from '../activities.js';
import { WARMUPS } from '../data/warmups.js';

export function renderWarmup(ctx, course, sessionId, done, onComparison = () => {}) {
  const slides = [...WARMUPS[course.id]];
  if (ctx.progress.sessions.filter(s => s.lessonId === course.id).length % 2 === 0) [slides[0], slides[1]] = [slides[1], slides[0]];
  const root = h('div', { class: 'card warmup' });
  let index = 0, attempts = 0, answered = false, message = '', choiceNumber = 0;
  function draw() {
    const slide = slides[index];
    const decision = slide.kind === 'choice';
    if (slide.kind === 'compare') onComparison();
    replaceContent(root,
      h('p', { class: 'eyebrow' }, `Coach’s dugout • ${index + 1} of ${slides.length}`),
      h('h2', null, decision ? 'Your turn: choose the change' : slide.title ?? 'Watch how this word grows'),
      decision ? h('section', { class: `build-decision${answered ? ' answered' : attempts ? ' retry-choice' : ''}` },
        h('p', { class: 'decision-title' }, answered ? 'CORRECT — NEXT PLAY' : attempts ? 'TRY AGAIN — PICK ONE' : 'YOUR TURN — PICK ONE'),
        h('p', { class: 'decision-prompt' }, `What should you do to ${slide.base} before adding -${slide.ending}?`),
        h('p', { class: 'decision-instruction' }, answered ? 'Press Next play below.' : 'Click or tap one answer to continue.'),
        h('div', { class: 'row decision-options' }, BUILD_OPTIONS.map((o, i) => h('button', {
          class: 'btn decision-option', type: 'button', disabled: answered, 'data-autofocus': !answered && i === 0,
          onClick: () => {
            if (answered) return;
            const correct = o.id === slide.operation;
            recordActivity(ctx.progress, ctx, sessionId, course.id, {
              kind: 'build', word: slide.result, prompt: `Warm-up ${choiceNumber + 1}: ${slide.base} + ${slide.ending}`,
              typed: o.id, correct, modelUsed: attempts > 0, attemptType: attempts ? 'retry' : 'first', checks: [],
            });
            attempts++; answered = correct;
            message = `${correct ? 'Correct!' : 'Try another choice.'} ${slide.why}${correct ? ` ${slide.result}` : ''}`;
            if (correct) { ctx.audio.unlock(); ctx.audio.sfx('chime'); }
            draw(); announce(message);
          },
        }, o.label))),
        message ? h('p', { class: 'build-message', role: 'status' }, message) : null)
      : h('div', { class: 'worked-example' },
        (slide.pairs ?? [`${slide.base} + ${slide.ending} → ${slide.result}`]).map(pair => h('p', { class: 'example-equation' }, pair)),
        h('p', { class: 'lead' }, slide.why)),
      h('p', { class: 'note' }, 'These examples teach the pattern. Word mastery is checked separately, without a model.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onClick: () => {
          ctx.audio.unlock(); ctx.audio.speak(decision ? (answered || attempts ? message : `What should you do to ${slide.base} before adding ${slide.ending}?`) : `${slide.pairs?.join('. ') ?? `${slide.base}, ${slide.result}`}. ${slide.why}`);
        } }, 'Read Aloud'),
        h('button', { class: 'btn primary', type: 'button', disabled: decision && !answered, 'data-autofocus': !decision || answered,
          onClick: () => {
            if (decision && !answered) return;
            ctx.audio.stopSpeech();
            if (decision) choiceNumber++;
            if (++index === slides.length) return done();
            attempts = 0; answered = false; message = ''; draw();
          },
        }, index === slides.length - 1 ? 'Start batting practice' : 'Next play'),
        h('button', { class: 'btn ghost', type: 'button', onClick: () => { ctx.audio.stopSpeech(); done(); } }, 'Skip warm-up')));
    focusSoon(root.querySelector('[data-autofocus]'));
  }
  draw(); return root;
}
