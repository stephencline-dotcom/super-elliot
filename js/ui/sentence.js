import { replaceContent, h, announce, focusSoon } from './dom.js';
import { checkSentence, recordActivity } from '../activities.js';
import { courseForWord } from '../data/catalog.js';

export function renderSentence(ctx, course, session, onFinish) {
  const root = h('div', { class: 'card sentence-check' });
  const previous = (ctx.progress.activities ?? []).filter((a) => a.kind === 'sentence' && a.lessonId === course.id && a.attemptType === 'first').length;
  const example = course.sentences[previous % course.sentences.length];
  let attempts = 0, modelUsed = false;
  function draw() {
    const input = h('input', { class: 'answer sentence-answer', type: 'text', maxlength: '300',
      'aria-label': 'Type the sentence you hear', autocomplete: 'off', spellcheck: 'false',
      autocorrect: 'off', autocapitalize: 'off', 'data-autofocus': true });
    replaceContent(root,
      h('p', { class: 'eyebrow' }, 'Game situation'),
      h('h2', null, 'Use your spelling in a sentence'),
      h('p', { class: 'lead' }, 'Press Hear Sentence, then type it. Capitals and punctuation are not scored. This checks writing practice separately from word mastery.'),
      modelUsed ? h('p', { class: 'sentence-model' }, example.text) : null,
      h('div', { class: 'row' },
        ctx.audio.speechAllowed() ? h('button', { class: 'btn', type: 'button', onClick: () => {
          ctx.audio.unlock(); ctx.audio.speak(example.text);
        } }, 'Hear Sentence') : null,
        h('button', { class: 'btn', type: 'button', onClick: () => { ctx.audio.stopSpeech(); modelUsed = true; draw(); } }, 'Show sentence (uses support)')),
      !ctx.audio.speechAllowed() ? h('p', { class: 'note' }, 'Speech is muted or unavailable. You can use the sentence model for supported practice, or skip this check.') : null,
      h('form', { class: 'answer-form', onSubmit: (e) => {
        e.preventDefault();
        const typed = input.value.trim();
        if (!typed) { announce('Type the sentence first.'); input.focus(); return; }
        ctx.audio.stopSpeech();
        const result = checkSentence(example, typed);
        recordActivity(ctx.progress, ctx, session.id, course.id, {
          kind: 'sentence', word: example.targets[0], prompt: example.text, typed,
          correct: result.correct, modelUsed, attemptType: attempts ? 'retry' : 'first',
          checks: result.checks.map((c) => ({ ...c, originLessonId: courseForWord(c.word)?.id ?? null })),
        });
        attempts++;
        const key = `${ctx.today}:${example.targets[0]}:sentence-practice`;
        if (!ctx.progress.points.ledger.some((e) => e.key === key)) {
          ctx.progress.points.ledger.push({ key, word: example.targets[0], kind: 'sentence-practice', points: 5, date: ctx.today, sessionId: session.id });
          ctx.persist();
        }
        if (result.correct) { ctx.audio.unlock(); ctx.audio.sfx('chime'); }
        replaceContent(root,
          h('p', { class: 'eyebrow' }, 'Sentence feedback'),
          h('h2', null, result.correct ? 'You put it into writing!' : 'Let’s check the sentence'),
          h('p', { class: 'note' }, result.correct
            ? `${modelUsed || attempts > 1 ? 'Supported' : 'Without a model'} sentence practice. Immediate sentence work is separate from delayed recall.`
            : 'Compare the spellings. Your next attempt will count as supported practice.'),
          h('p', { class: 'sentence-comparison' }, h('strong', null, 'You wrote: '), typed),
          h('p', { class: 'sentence-comparison' }, h('strong', null, 'Example: '), example.text),
          h('p', { class: 'note' }, result.checks.map((c) => `${c.word}: ${c.correct ? 'spelled correctly in position' : 'needs another look'}`).join(' · ')),
          h('div', { class: 'row' },
            !result.correct && attempts < 2 ? h('button', { class: 'btn', type: 'button', onClick: () => { modelUsed = true; draw(); } }, 'Try sentence again') : null,
            h('button', { class: 'btn primary', type: 'button', 'data-autofocus': true, onClick: onFinish }, 'See results')));
        focusSoon(root.querySelector('[data-autofocus]'));
      } }, input, h('button', { class: 'btn primary', type: 'submit' }, 'Check Sentence')),
      h('div', { class: 'row' }, h('button', { class: 'btn ghost', type: 'button', onClick: () => {
        ctx.audio.stopSpeech();
        recordActivity(ctx.progress, ctx, session.id, course.id, {
          kind: 'sentence', word: example.targets[0], prompt: example.text, typed: '', correct: false,
          modelUsed, attemptType: 'skipped', checks: [],
        });
        onFinish();
      } }, 'Skip sentence check')));
    focusSoon(input);
  }
  draw();
  return root;
}
