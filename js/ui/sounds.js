import { h, replaceContent, announce, focusSoon } from './dom.js';
import { soundModel, checkSoundMap } from '../data/sounds.js';
import { actionCue } from './rule.js';
import { recordActivity, BUILD_OPTIONS } from '../activities.js';

export function renderSoundRoutine(ctx, lesson, course, sessionId, done, back, onStage = () => {}) {
  const model = soundModel(lesson);
  const root = h('div', { class: 'card sound-routine' });
  let heard=false;
  let stage = 0, taps = 0, countOk = false, countMessage = '', countAttempts = 0;
  let mapping = model.groups.map(() => ''), mapOk = false, mapMessage = '', mapAttempts = 0, showMap = false;
  let endingOk = false, endingMessage = '', endingAttempts = 0;
  function record(kind, typed, correct, attempt, skipped = false) {
    recordActivity(ctx.progress, ctx, sessionId, course.id, {
      kind, word: lesson.word, prompt: `${kind}: ${model.base} + ${model.suffix}${kind === 'sound-map' ? `; expected ${model.groups.join('|')}` : ''}`,
      typed, correct, modelUsed: true, attemptType: skipped ? 'skipped' : attempt ? 'retry' : 'first', checks: [],
    });
  }
  function speak(text) { ctx.audio.unlock(); ctx.audio.speak(text); }
  function chime() { ctx.audio.unlock(); ctx.audio.sfx('chime'); }
  function next() { ctx.audio.stopSpeech(); stage++; draw(); }
  function draw() {
    onStage(stage);
    const heading = ['Hear it. Tap it.', 'Give each sound its letters', 'Choose the ending'][stage];
    const body = stage === 0 ? countView() : stage === 1 ? mapView() : endingView();
    replaceContent(root,
      h('p', { class: 'eyebrow' }, `Sound-to-spelling • ${stage + 1} of 3`),
      h('h2', null, heading),
      actionCue(stage===0 ? countOk ? 'Next: Map the sounds.' : taps ? 'Tap every sound. Then Check sound count.' : heard || !ctx.audio.speechAllowed() ? 'Say the word. Tap one sound at a time.' : 'First: Hear base word.'
        : stage===1 ? mapOk ? 'Next: Build the ending.' : 'Fill the boxes. Then Check sound map.'
        : endingOk ? 'Next: Spell with the model hidden.' : 'Your turn: pick one answer below.'),body,
      h('details',{class:'optional-help'},h('summary',null,'More help'),
      h('p', { class: 'note' }, 'Guided practice. The app does not listen to your voice. Count speech sounds, not letters. Do not add “uh” to consonants.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', disabled: !ctx.audio.speechAllowed(), onClick: () => speak([
          'Hear the base word, say it aloud, then stretch it. Tap once for each speech sound. Count sounds, not letters.',
          'Say the base word slowly. Put the letter or letters spelling each sound in one box. A box can hold two letters for one sound.',
          `Add the ending ${model.suffix}. In this word it has ${model.endingSound}. Choose the change, then blend the whole word.`,
        ][stage]) }, 'Read directions'),
        h('button', { class: 'btn ghost', type: 'button', onClick: () => {
        ctx.audio.stopSpeech(); record('sound-routine', `left at step ${stage + 1}`, false, 0, true); back();
      } }, 'Use the coach’s example instead'))));
    focusSoon(root.querySelector('[data-autofocus]'));
  }
  function countView() {
    return h('section', null,
      h('p', { class: 'lead' }, 'Say it slowly. Tap once for each sound.'),
      ctx.audio.speechAllowed() ? h('button', { class: !heard && !taps && !countOk ? 'btn primary' : 'btn', type: 'button', 'data-autofocus': !heard && !taps && !countOk, onClick: () => {speak(model.base);heard=true;draw();} }, 'Hear base word') : null,
      !ctx.audio.speechAllowed() ? h('p', { class: 'note' }, 'Ask someone to say the base word from Coach’s Tip without showing its spelling. You can also return to the coach.') : null,
      h('div', { class: 'sound-action' },
        h('p', { class: 'decision-title' }, 'YOUR TURN — SAY IT, THEN TAP'),
        h('p', { class: 'sound-count', role: 'status' }, `${taps} sounds tapped`),
        h('div', { class: 'row' },
          h('button', { class: heard && taps===0 && !countOk ? 'btn primary' : 'btn', type: 'button', 'data-autofocus': !countOk, disabled: countOk, onClick: () => { if(countOk) return; if(taps < 8) taps++; countMessage=''; draw(); } }, 'Tap one sound'),
          h('button', { class: 'btn', type: 'button', disabled: countOk, onClick: () => { if(countOk) return; taps=0; countMessage=''; draw(); } }, 'Reset taps'),
          h('button', { class: taps>0 && !countOk ? 'btn primary' : 'btn', type: 'button', disabled: countOk, onClick: () => {
            if(countOk) return;
            if(!taps) { announce('Tap the sounds before checking.'); return; }
            countOk=taps===model.groups.length;
            record('sound-count', String(taps), countOk, countAttempts++);
            if(countOk) chime();
            countMessage=countOk ? `Yes — ${model.groups.length} sounds!` : `Try ${model.groups.length} sounds. Reset, then tap again.`;
            draw(); announce(countMessage);
          } }, 'Check sound count')),
        countMessage ? h('p', { class: 'sound-feedback', role: 'status' }, countMessage) : null,
        countMessage && !countOk ? h('p', { class: 'note' }, `Sound guide: ${model.cues.join('; ')}. Say each sound, not the letter name.`) : null),
      h('button', { class: countOk ? 'btn primary' : 'btn', type: 'button', disabled: !countOk, 'data-autofocus': countOk, onClick: () => { if(countOk) next(); } }, 'Map the sounds'));
  }
  function mapView() {
    const inputs = [];
    return h('section', null,
      h('p', { class: 'lead' }, 'One box = one sound. Type its letter or letters.'),
      h('details',null,h('summary',null,'Sound tip'),h('p',{class:'note'},model.note)),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', disabled: !ctx.audio.speechAllowed(), onClick: () => speak(model.base) }, 'Hear base word'),
        h('button', { class: 'btn', type: 'button', onClick: () => { showMap=true; draw(); } }, 'Show sound map (uses support)')),
      h('form', { class: 'sound-map-form', onSubmit: e => {
        e.preventDefault(); if(mapOk) return;
        mapping=inputs.map(input=>input.value);
        const checks=checkSoundMap(model.groups,mapping); mapOk=checks.every(Boolean);
        record('sound-map',mapping.join('|'),mapOk,mapAttempts++);
        if(mapOk) chime();
        mapMessage=mapOk ? 'Yes! Say the sounds together.'
          : `Check ${checks.map((ok,i)=>ok ? null : `box ${i+1}`).filter(Boolean).join(', ')}. Compare with the model, then try mapping again.`;
        if(!mapOk) showMap=true;
        draw();announce(mapMessage);
      } },
        h('p', { class: 'decision-title' }, 'YOUR TURN — SPELL EACH SOUND'),
        h('div', { class: 'sound-boxes' }, model.groups.map((group,i) => {
          const input=h('input', { class: 'sound-input', type: 'text', value:mapping[i], maxlength:'3',
            'aria-label': `Spelling for sound ${i+1}`, spellcheck:'false', autocomplete:'off', autocorrect:'off', autocapitalize:'off',
            disabled:mapOk, 'data-autofocus': !mapOk && i===0,
            onInput: e => { mapping[i]=e.target.value; },
          });input.value=mapping[i];inputs.push(input);
          return h('label', { class: 'sound-box' }, h('span', null, `Sound ${i+1}`), input,
            showMap ? h('span', { class: 'sound-model' }, `Model: ${group}`) : null,
            showMap ? h('span', { class: 'sound-cue' }, model.cues[i]) : null);
        })),
        h('button', { class: 'btn primary', type:'submit', disabled:mapOk }, 'Check sound map')),
      mapMessage ? h('p', { class:'sound-feedback', role:'status' },mapMessage) : null,
      h('button', { class:'btn primary', type:'button', disabled:!mapOk, 'data-autofocus':mapOk, onClick:()=>{if(mapOk) next();} },'Build the ending'));
  }
  function endingView() {
    const why = model.operation === 'double'
      ? `Double the final ${model.letter} before -${model.suffix}. The two ${model.letter}s still spell ONE consonant sound; we do not say it twice.`
      : `Keep the base spelling unchanged before -${model.suffix}. ${model.note}`;
    return h('section', null,
      h('p', { class:'lead' }, `Base: ${model.base}. Ending: -${model.suffix}. In this word, the ending has ${model.endingSound}.`),
      h('p', { class:'note' }, model.suffix==='ed' ? 'Past-tense -ed keeps its spelling even when you hear /t/ or /d/.' : 'In -ing, ng spells one sound, like the final sound in sing. Do not split it into n and g sounds.'),
      h('section', { class:`build-decision${endingOk ? ' answered' : endingAttempts ? ' retry-choice' : ''}` },
        h('p', { class:'decision-title' },endingOk ? 'CORRECT — BLEND AND SPELL' : 'YOUR TURN — CHOOSE THE CHANGE'),
        h('p', null, `What change does ${model.base} need before -${model.suffix}?`),
        !endingOk ? h('div', { class:'row decision-options' }, BUILD_OPTIONS.map(o=>h('button', {
          class:'btn decision-option',type:'button',disabled:endingOk,
          onClick:()=>{if(endingOk) return; endingOk=o.id===model.operation;record('sound-ending',o.id,endingOk,endingAttempts++);if(endingOk) chime();
            endingMessage=`${endingOk ? 'Correct!' : 'Try the other choice.'} ${why}`;draw();announce(endingMessage);
          },
        },o.label))) : null,
        endingMessage ? h('p', {class:'build-message',role:'status'},endingMessage) : null),
      endingOk ? h('div', {class:'sound-boxes final-sound-map','aria-label':`Sound spellings: ${model.fullGroups.join(', ')}`},
        model.fullGroups.map(group=>h('span',{class:'sound-model-tile'},group))) : null,
      endingOk ? h('p', {class:'lead'},`Together: ${lesson.word}. Say each sound, then blend and say the whole word.`) : null,
      endingOk ? h('button', {class:'btn',type:'button',onClick:()=>speak(lesson.word)}, 'Hear whole word') : null,
      h('button', {class:'btn primary',type:'button',disabled:!endingOk,'data-autofocus':endingOk,onClick:()=>{
        if(!endingOk) return;ctx.audio.stopSpeech();record('sound-routine','completed',true,0);done();
      }},'Spell with the model hidden'));
  }
  draw();return root;
}
