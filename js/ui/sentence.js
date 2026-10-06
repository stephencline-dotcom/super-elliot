import { replaceContent, h, announce, focusSoon } from './dom.js';
import { checkSentence, recordActivity } from '../activities.js';
import { rewardEntries } from '../scoring.js';
import { actionCue } from './rule.js';
import { chooseSentence } from '../extra.js';
import { courseForWord } from '../data/catalog.js';

export function renderSentence(ctx, course, session, onFinish) {
  const root = h('div', { class: 'card sentence-check' });
  const example = chooseSentence(course.sentences,ctx.progress,course.id);
  let attempts = 0, modelUsed = false;
  function draw() {
    let heard=false,check,hear;
    const cue=actionCue(modelUsed ? 'Type the sentence below.' : ctx.audio.speechAllowed() ? 'First: Hear Sentence.' : 'Use Show sentence, or skip this check.');
    function updateAction() {
      const typed=!!input.value.trim();check.disabled=!typed;
      if(typed) check.removeAttribute('disabled'); else check.setAttribute('disabled','');
      if(hear) hear.className=typed || heard || modelUsed ? 'btn' : 'btn primary';
      cue.replaceChildren(...actionCue(typed ? 'Next: Check Sentence.' : heard || modelUsed ? 'Your turn: type the sentence below.' : 'First: Hear Sentence.').children);
    }
    const input = h('input', { class: 'answer sentence-answer', type: 'text', maxlength: '300',
      onInput:updateAction,'aria-label': 'Type the sentence you hear', autocomplete: 'off', spellcheck: 'false',
      autocorrect: 'off', autocapitalize: 'off', 'data-autofocus': modelUsed || !ctx.audio.speechAllowed() });
    replaceContent(root,
      h('p', { class: 'eyebrow' }, 'Game situation'),
      h('h2', null, 'Use your spelling in a sentence'),
      h('p', { class: 'lead' }, 'Hear it. Type it. Check it. Capitals and punctuation are okay.'),
      cue,
      modelUsed ? h('p', { class: 'sentence-model' }, example.text) : null,
      h('div', { class: 'row' },
        ctx.audio.speechAllowed() ? hear=h('button', { class: modelUsed ? 'btn' : 'btn primary', type: 'button', 'data-autofocus': !modelUsed, onClick: () => {
          ctx.audio.unlock(); ctx.audio.speak(example.text);heard=true;updateAction();focusSoon(input);
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
        const earnedRun = !rewardEntries(ctx.progress.points.ledger).some(e => e.kind === 'sentence-practice' && e.date === ctx.today && e.word === example.targets[0]);
        if (earnedRun) {
          ctx.progress.points.ledger.push({ key, word: example.targets[0], kind: 'sentence-practice', points: 1, date: ctx.today, sessionId: session.id });
          ctx.persist();
        }
        if (result.correct) { ctx.audio.unlock(); ctx.audio.sfx('chime'); }
        replaceContent(root,
          h('p', { class: 'eyebrow' }, 'Sentence feedback'),
          h('h2', null, result.correct ? 'You put it into writing!' : 'Let’s check the sentence'),
          h('p', { class: 'note' }, result.correct
            ? `${modelUsed || attempts > 1 ? 'Supported' : 'Without a model'} sentence practice. Nice work using your spelling in writing.`
            : 'Compare the spellings. Your next attempt will count as supported practice.'),
          h('p', { class: 'note' }, earnedRun ? '+1 practice run for working on a sentence.' : 'This sentence’s practice run is already counted today.'),
          h('p', { class: 'sentence-comparison' }, h('strong', null, 'You wrote: '), typed),
          h('p', { class: 'sentence-comparison' }, h('strong', null, 'Example: '), example.text),
          h('p', { class: 'note' }, result.checks.map((c) => `${c.word}: ${c.correct ? 'spelled correctly in position' : 'needs another look'}`).join(' · ')),
          actionCue(!result.correct && attempts<2 ? 'Try sentence again, or See results.' : 'Next: See results.'),
          h('div', { class: 'row' },
            !result.correct && attempts < 2 ? h('button', { class: 'btn', type: 'button', onClick: () => { modelUsed = true; draw(); } }, 'Try sentence again') : null,
            h('button', { class: 'btn primary', type: 'button', 'data-autofocus': true, onClick: onFinish }, 'See results')));
        focusSoon(root.querySelector('[data-autofocus]'));
      } }, input, check=h('button', { class: 'btn primary', type: 'submit',disabled:true }, 'Check Sentence')),
      h('div', { class: 'row' }, h('button', { class: 'btn ghost', type: 'button', onClick: () => {
        ctx.audio.stopSpeech();
        recordActivity(ctx.progress, ctx, session.id, course.id, {
          kind: 'sentence', word: example.targets[0], prompt: example.text, typed: '', correct: false,
          modelUsed, attemptType: 'skipped', checks: [],
        });
        onFinish();
      } }, 'Skip sentence check')));
    focusSoon(root.querySelector('[data-autofocus]') ?? input);
  }
  draw();
  return root;
}
