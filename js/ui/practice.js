import { h, announce, focusSoon } from './dom.js';
import { scoreboard, wordBuilder, letterBuilder, diffView, pointList } from './components.js';
import { wordEntry, visibleSentence, spokenSentence } from '../data/words.js';
import {
  startSession, currentEntry, requeueForRecheck, createRun, submitAttempt, advanceRun, canMoveOn, moveOn, hintFor,
} from '../session.js';
import { awardPoints, POINT_LABELS } from '../scoring.js';
import { updateWordRecord } from '../scheduler.js';
import { sessionSummary } from '../stats.js';
import { CATALOG, courseForWord } from '../data/catalog.js';
import { lessonQueue, recommendedLesson } from '../mastery.js';
import { BUILD_OPTIONS, buildExplanation, recordActivity } from '../activities.js';
import { renderSentence } from './sentence.js';
import { RULES } from '../data/rules.js';
import { lessonFlow, renderLessonIntro } from './flow.js';
import { soundModel } from '../data/sounds.js';
import { renderSoundRoutine } from './sounds.js';
import { actionCue } from './rule.js';
import { extraQueue, extraSentencePool } from '../extra.js';

const TITLES = { try: 'Batting Practice', hint: 'Next Swing', guided: 'Next Swing: Build It', final: 'Next Swing' };
const INTROS = {
  try: 'Hear it. Type it. Check it.',
  hint: 'Use the hint. Try again.',
  guided: 'Build the word with the coach, then type it.',
  final: 'The model is hidden again. Try it from memory.',
};

export function renderPractice(ctx, params = {}) {
  const { progress, audio } = ctx;
  const root = h('section', { class: 'practice' });
  const course = CATALOG.find((l) => l.id === params.lessonId && l.available)
    ?? recommendedLesson(progress, ctx.today);
  const returning = progress.attempts.some(a => a.currentLessonId === course.id || a.originLessonId === course.id || [...course.words,...course.transfer].includes(a.word));
  const extra = params.mode === 'extra';
  const length = extra ? Math.min(6,ctx.settings.sessionLength) : ctx.settings.sessionLength;
  const words = extra ? extraQueue(course, progress, ctx.today, length) : lessonQueue(course, progress, ctx.today, length);
  if (returning && !extra) words.sort((a,b) => {
    const priority = word => progress.attempts.some(x=>x.word===word && x.date===ctx.today && x.correct) ? 2
      : progress.attempts.some(x=>x.word===word) ? 0 : 1;
    return priority(a)-priority(b);
  });
  const session = startSession({words:words.map(wordEntry), progress,today:ctx.today,length,id:ctx.newId('s')});
  session.queue=words.slice(0,length).map(word=>({word,recheck:false}));
  session.planned = session.queue.length;
  const sessionRec = {
    id: session.id, date: ctx.today, startedAt: new Date().toISOString(), endedAt: null,
    plannedWords: session.planned, completedWords: 0, results: [], lessonId: course.id, practiceMode: extra ? 'extra' : 'lesson',
  };
  progress.sessions.push(sessionRec);
  ctx.persist();

  let run = null;
  let sentenceStarted = false;
  let flowStage = 'Learn';
  function setStage(stage) {
    flowStage=stage;
    const nav=root.querySelector('.lesson-flow');
    if(nav) { const updated=lessonFlow(stage);nav.replaceChildren(...Array.from(updated.children)); }
  }
  function showIntro(returnToWord = false) {
    if(run) {run.modelUsed=true;run.instructionShown=true;}
    audio.stopSpeech();setStage('Learn');
    root.replaceChildren(header(),renderLessonIntro(ctx,course,()=>returnToWord ? draw() : startNextWord()));
  }

  function startNextWord() {
    const q = currentEntry(session);
    if (!q) {
      const sentenceCourse = extra ? {...course,sentences:extraSentencePool(course,progress,session.id)} : course;
      if (sentenceCourse.sentences?.length && !sentenceStarted) {
        sentenceStarted = true;
        audio.stopSpeech();
        setStage('Use');
        root.replaceChildren(header(), renderSentence(ctx, sentenceCourse, session, finish));
        return;
      }
      return finish();
    }
    const context = extra ? (courseForWord(q.word)?.id !== course.id ? 'connected-review'
      : progress.attempts.some(a=>a.word===q.word) ? 'extra-review' : 'extra-new') : course.words.includes(q.word) ? 'core'
      : course.transfer.includes(q.word) ? 'transfer' : 'connected-review';
    run = createRun({
      entry: wordEntry(q.word), record: progress.words[q.word], progress, sessionId: session.id, recheck: q.recheck,
      skipLearn: extra || context === 'transfer' && !progress.words[q.word]?.needsInstruction,
    });
    if (run.view === 'learn' && soundModel(run.lesson)) run.view = 'sounds';
    run.currentLessonId = course.id;
    run.originLessonId = courseForWord(q.word)?.id ?? null;
    run.lessonContext = context;
    draw();
  }

  function finish() {
    sessionRec.endedAt = new Date().toISOString();
    ctx.persist();
    audio.stopSpeech();
    ctx.go(progress.attempts.some((a) => a.sessionId === session.id) ? 'results' : 'home', { sessionId: session.id });
  }

  function finalizeRun() {
    const { entry, outcome, reviewKind } = run;
    run.awards = awardPoints(progress.points.ledger, {
      date: ctx.today, sessionId: session.id, word: entry.word, outcome, reviewKind,
    });
    progress.points.ledger.push(...run.awards);
    progress.words[entry.word] = updateWordRecord(progress.words[entry.word], { outcome, reviewKind, today: ctx.today });
    sessionRec.results.push({ word: entry.word, outcome, reviewKind, currentLessonId: course.id, originLessonId: run.originLessonId, lessonContext: run.lessonContext });
    if (!currentEntry(session).recheck) {
      session.completed += 1;
      sessionRec.completedWords = session.completed;
      if (outcome === 'supported') requeueForRecheck(session, entry.word);
    }
  }

  function header() {
    const sum = sessionSummary(progress, session.id);
    const hits = sum.counts.independentSuccess + sum.counts.laterRecall;
    return h('div', { class: 'practice-top' },
      scoreboard({
        label: 'Scoreboard',
        items: [
          { label: 'WORDS DONE', value: `${session.completed}/${session.planned}` },
          { label: 'RUNS', value: sum.points },
          { label: 'WITHOUT HELP', value: hits },
        ],
      }),
      h('div', { class: 'practice-nav' },
        h('span', { class: 'note' }, `${extra ? 'Extra practice · ' : ''}${course.title}`),

        h('button', { class: 'btn ghost', type: 'button', onClick: finish }, 'Finish for today')),
      lessonFlow(flowStage));
  }

  function draw() {
    setStage(run.view === 'sounds' ? 'Build' : run.view === 'learn' || run.phase === 'guided' && run.view === 'input' ? 'Build' : 'Try');
    const body = run.view === 'sounds' ? renderSoundRoutine(ctx, run.lesson, course, session.id, () => {
      run.buildAnswered = true;
      if(run.phase === 'guided') {run.phase='final';run.nextPhase=null;}
      run.view = 'input'; draw();
    }, () => { run.view = 'learn'; draw(); }, step => setStage(step===2 ? 'Try' : 'Build')) : run.view === 'learn' ? learnView() : run.view === 'input' ? inputView() : feedbackView();
    root.replaceChildren(h('h1', { class: 'sr-only' }, 'Spelling practice'), header(), body);
    focusSoon(root.querySelector('[data-autofocus]'));
  }

  function speakWord() {
    audio.unlock();
    audio.speak([run.entry.word, spokenSentence(run.entry)]);
  }

  function learnView() {
    const l = run.lesson;
    const text = l.narration ?? l.tip;
    return h('div', { class: 'card coach' },
      h('p', { class: 'eyebrow' }, "Coach's Tip"),
      h('h2', null, l.title),
      h('p', { class: 'lead coach-summary' }, l.reason ?? 'Follow the steps. Read them yourself, or press Read Aloud.'),
      wordBuilder(l.steps, { finalWord: run.entry.word }),
      l.build ? buildDecision(l) : null,
      actionCue(l.build && !run.buildAnswered ? 'Choose an answer above.' : 'Next: press Try spelling.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onClick: () => { audio.unlock(); audio.speak(text); } }, 'Read Aloud'),
        h('button', {
          class: 'btn primary practice-ready', type: 'button', 'data-autofocus': !l.build || run.buildAnswered,
          disabled: !!l.build && !run.buildAnswered,
          onClick: () => { if (l.build && !run.buildAnswered) return; audio.stopSpeech(); if(run.phase === 'guided') {run.phase='final';run.nextPhase=null;} run.view = 'input'; draw(); },
        }, 'Try spelling')),
      h('details',{class:'optional-help'},h('summary',null,'More help'),h('p',{class:'note'},l.scope),
        h('div',{class:'row'},
          soundModel(l) ? h('button',{class:'btn sound-start',type:'button',onClick:()=>{
            audio.stopSpeech();run.modelUsed=true;run.instructionShown=true;run.view='sounds';draw();
          }},'Build with sounds') : null,
          RULES[course.id] ? h('button',{class:'btn',type:'button',onClick:()=>showIntro(true)},'Review the pattern') : null,
          h('button',{class:'btn',type:'button',onClick:draw},'Replay animation'))));
  }

  function buildDecision(lesson) {
    return h('section', { class: `build-decision${run.buildAnswered ? ' answered' : run.buildAttempts ? ' retry-choice' : ''}`, 'aria-label': 'Your turn: choose an answer' },
      h('p', { class: 'decision-title' }, run.buildAnswered ? 'CORRECT — TRY SPELLING' : run.buildAttempts ? 'TRY AGAIN — PICK ONE' : 'YOUR TURN — PICK ONE'),
      h('p', { class: 'decision-prompt' }, `Before adding -${lesson.build.suffix} to ${lesson.build.base}, what should you do?`),
      h('p', { class: 'decision-instruction' }, run.buildAnswered
        ? 'Next: Try spelling.' : run.buildAttempts ? 'Choose the other answer.' : 'Pick one answer.'),
      h('div', { class: 'row decision-options' }, BUILD_OPTIONS.map((option, i) => h('button', {
        class: `btn decision-option${run.buildChoice === option.id ? ' chosen' : ''}`, 'aria-pressed': String(run.buildChoice === option.id), type: 'button', 'data-autofocus': !run.buildAnswered && i === 0,
        disabled: run.buildAnswered,
        onClick: () => {
          if (run.buildAnswered) return;
          audio.stopSpeech();
          const result = buildExplanation(lesson, option.id);
          recordActivity(progress, ctx, session.id, course.id, {
            kind: 'build', word: run.entry.word, prompt: `Choose the change for ${lesson.build.base} + ${lesson.build.suffix}`,
            typed: option.id, correct: result.correct, modelUsed: true,
            attemptType: run.buildAttempts ? 'retry' : 'first', checks: [],
          });
          run.buildAttempts = (run.buildAttempts ?? 0) + 1;
          run.buildAnswered = result.correct;
          run.buildMessage = result.text;
          run.buildChoice = option.id;
          if (result.correct) { audio.unlock(); audio.sfx('chime'); }
          // Update feedback in place: keep the tip and its animation intact.
          const panel = root.querySelector('.build-decision');
          const updated = buildDecision(lesson);
          panel.className = updated.className;
          panel.replaceChildren(...Array.from(updated.children));
          const cue = root.querySelector('.action-cue');
          if(cue) cue.replaceChildren(...actionCue(run.buildAnswered ? 'Next: press Try spelling.' : 'Try the other answer above.').children);
          const ready = root.querySelector('.practice-ready');
          ready.disabled = !run.buildAnswered;
          if (run.buildAnswered) ready.removeAttribute('disabled');
          else ready.setAttribute('disabled', '');
          focusSoon(run.buildAnswered ? ready : panel.querySelector('[data-autofocus]'));
          announce(result.correct ? 'Correct. Press Try spelling.' : 'That choice needs a change. Try the other answer.');
        },
      }, option.label))),
      run.buildMessage ? h('p', { class: 'build-message', role: 'status' }, run.buildMessage) : null);
  }

  function inputView() {
    const phase = run.phase;
    const canSpeak = audio.speechAllowed();
    let heard=false;
    const cue=actionCue(canSpeak ? 'First: press Hear Word and Sentence.' : 'Type the word, then press Check my spelling.');
    let check,hear;
    function updateAction() {
      const typed=!!input.value.trim();
      check.disabled=!typed;
      if(typed) check.removeAttribute('disabled'); else check.setAttribute('disabled','');
      if(hear) hear.className=typed || heard ? 'btn' : 'btn primary';
      cue.replaceChildren(...actionCue(typed ? 'Next: press Check my spelling.' : heard || !canSpeak ? 'Your turn: type the word below.' : 'First: press Hear Word and Sentence.').children);
    }
    const input = h('input', {
      class: 'answer', id: 'answer', type: 'text', name: 'practice-entry', onInput:updateAction, 'aria-label': 'Type your spelling',
      spellcheck: 'false', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off',
      'data-gramm': 'false', 'data-lpignore': 'true', maxlength: '40', enterkeyhint: 'done', 'data-autofocus': !canSpeak,
    });
    const form = h('form', { class: 'answer-form', novalidate: true, onSubmit: (e) => onSubmit(e, input) },
      input,
      check=h('button', { class: 'btn primary big', type: 'submit',disabled:true }, 'Check my spelling'));

    return h('div', { class: `card batting phase-${phase}` },
      h('p', { class: 'eyebrow' }, TITLES[phase]),
      h('h2',null,phase==='try'?'Your turn to spell':'Try this spelling'),
      h('p', { class: 'lead' }, INTROS[phase]),
      extra && phase === 'try' ? h('p',{class:'note'},run.lessonContext==='extra-new' ? 'New word challenge' : 'Familiar word review') : null,
      phase === 'hint' ? h('div', { class: 'hint' }, h('strong', null, 'Hint: '), hintFor(run)) : null,
      phase === 'guided' ? (run.lesson ? wordBuilder(run.lesson.steps, { finalWord: run.entry.word }) : letterBuilder(run.entry.word)) : null,
      run.shownWord && phase !== 'guided' ? h('p', { class: 'shown-word' }, run.entry.word) : null,
      h('p', { class: 'sentence' }, visibleSentence(run.entry)),
      cue,
      h('div', { class: 'row' },
        run.lesson ? h('button', { class: 'btn', type: 'button', onClick: () => {
          audio.stopSpeech(); run.modelUsed = true; run.instructionShown = true; run.view = 'learn'; draw();
        } }, 'Help me build this word') : null,
        canSpeak ? hear=h('button', { class: 'btn primary', type: 'button', 'data-autofocus': true, onClick: ()=>{speakWord();heard=true;updateAction();focusSoon(input);} }, 'Hear Word and Sentence') : null,
        !canSpeak && !run.shownWord && phase !== 'guided'
          ? h('button', {
            class: 'btn', type: 'button',
            onClick: () => { run.shownWord = true; run.modelUsed = true; draw(); },
          }, 'Show the word (counts as using the model)') : null),
      !canSpeak ? h('p', { class: 'note' }, 'Speech is off or unavailable. Turn on speech in Settings, or have a grown-up read the word aloud.') : null,
      form,
      canMoveOn(run) ? h('div', { class: 'row support' },
        h('p', { class: 'note' }, 'Need a break from this one? That is okay.'),
        h('button', { class: 'btn', type: 'button', onClick: onMoveOn }, 'Finish with support and move on')) : null);
  }

  function onSubmit(e, input) {
    e.preventDefault();
    const typed = input.value.trim();
    if (!typed) {
      announce('Type your spelling first.');
      input.focus();
      return;
    }
    audio.unlock();
    audio.stopSpeech();
    const rec = submitAttempt(run, typed, { id: ctx.newId('a'), sessionId: session.id, date: ctx.today });
    Object.assign(rec, { currentLessonId: run.currentLessonId, originLessonId: run.originLessonId, lessonContext: run.lessonContext });
    progress.attempts.push(rec);
    if (run.done) finalizeRun();
    ctx.persist();
    reactTo(rec.correct);
    draw();
  }

  function onMoveOn() {
    audio.stopSpeech();
    moveOn(run);
    finalizeRun();
    ctx.persist();
    announce('Finishing with support. This word will come back for more practice.');
    draw();
  }

  function reactTo(correct) {
    if (correct && run.done) {
      audio.sfx(...(run.outcome === 'independent' ? ['batHit', 'chime'] : ['glovePop', 'chime']));
      if (session.completed > 0 && session.completed % 4 === 0 && !currentEntry(session).recheck) audio.sfx('crowd');
      announce('Correct. Nice work.');
    } else if (correct) {
      audio.sfx('chime');
      announce('That matches. Next, try it from memory.');
    } else {
      announce(run.done ? 'Finishing with support on this one.' : "Not quite yet. Let's look at it together.");
    }
  }

  function feedbackView() {
    const l = run.lesson;
    const last = run.last;
    const children = [h('p', { class: 'eyebrow' }, "Coach's Feedback")];
    let cardClass = 'card feedback';

    if (last.correct) {
      cardClass += ' good';
      const independent = run.outcome === 'independent';
      children.push(h('h2', null, run.done ? (independent ? 'Base hit!' : 'Nice swing!') : 'That matches!'));
      if (!run.done) children.push(h('p', { class: 'lead' }, 'You built it. Now try it again from memory.'));
      else {
        children.push(h('p', { class: 'lead' }, l?.build
          ? `${l.build.base}${l.build.operation==='double' ? ` + ${l.build.letter}` : ''} + ${l.build.suffix} = ${run.entry.word}`
          : `You spelled ${run.entry.word}.`));
        if (!independent) children.push(h('p', null, 'We’ll try this word again later.'));
        children.push(pointList(run.awards, POINT_LABELS) ?? h('p', { class: 'note' }, run.reviewKind === 'same-session'
          ? 'This is a memory recheck. Your practice run for this word is already counted.'
          : 'Your practice run for this word is already counted today.'));
        if (ctx.settings.celebrations) children.push(celebration());
      }
    } else {
      children.push(h('h2', null, last.movedOn ? 'Finishing with support' : "Not quite yet. That's okay."));
      children.push(last.movedOn
        ? h('p', { class: 'shown-word' }, run.entry.word)
        : diffView(run.entry.word, last.typed));
      if (!last.movedOn) {
        children.push(h('p', { class: 'lead' }, l
          ? (l.feedback.byAttempt?.[last.typed.toLowerCase()] ?? l.feedback.incorrect)
          : 'This word does not have a Coach\'s Tip yet (instruction pending). Compare the two spellings above.'));
        if (l) children.push(h('details',null,h('summary',null,'More about this word'),h('p',{class:'note'},l.scope)));
      }
      if (run.done) {
        children.push(h('p', null, 'You worked hard on this one. It will come back soon, and it is flagged for instruction.'));
        children.push(pointList(run.awards, POINT_LABELS) ?? h('p', { class: 'note' }, 'Your practice run for this word is already counted today.'));
      } else {
        children.push(h('p', null, {
          hint: 'Next Swing: you will get a hint, with the correct spelling hidden.',
          guided: 'Next Swing: we will build the word together.',
        }[run.nextPhase] ?? 'Next Swing: look at it again and give it another try.'));
      }
    }

    const last_ = !run.done || session.pos + 1 < session.queue.length;
    const nextLabel=last_ ? 'Next word' : (extra ? extraSentencePool(course,progress,session.id).length : course.sentences?.length) ? 'Use it in a sentence' : 'Finish practice';
    const retryLabel=run.nextPhase==='hint' ? 'Try with a hint' : run.nextPhase==='guided' ? 'Build with the coach' : 'Try with the model hidden';
    children.push(actionCue(`Next: ${run.done ? nextLabel : retryLabel}.`));
    children.push(h('div', { class: 'row' },
      run.done
        ? h('button', { class: 'btn primary big', type: 'button', 'data-autofocus': true, onClick: nextBatter }, nextLabel)
        : h('button', { class: 'btn primary big', type: 'button', 'data-autofocus': true, onClick: () => {
          advanceRun(run);
          if(run.phase === 'guided' && run.lesson) {run.instructionShown=true;run.view=soundModel(run.lesson) ? 'sounds' : 'learn';}
          draw();
        } }, retryLabel),
      !run.done && canMoveOn({ ...run, phase: run.nextPhase })
        ? h('button', { class: 'btn', type: 'button', onClick: onMoveOn }, 'Finish with support and move on') : null));
    return h('div', { class: cardClass }, children);
  }

  function nextBatter() {
    session.pos += 1;
    startNextWord();
  }

  function celebration() {
    return h('div', { class: 'celebration-play' },
      h('span', { class: 'celebration-ball', 'aria-hidden': 'true' }),
      h('strong', null, 'Practice play complete'));
  }

  if (RULES[course.id] && !returning && !extra) showIntro();
  else startNextWord();
  return root;
}
