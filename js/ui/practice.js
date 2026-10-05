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
import { WARMUPS, WARMUP_MODELS, warmupComplete } from '../data/warmups.js';
import { renderWarmup } from './warmup.js';
import { baseTrail } from './baseball.js';

const TITLES = { try: 'Batting Practice', hint: 'Next Swing', guided: 'Next Swing: Build It', final: 'Next Swing' };
const INTROS = {
  try: 'Listen to the word and the sentence, then type the word. Take as long as you like.',
  hint: 'Here is a hint. Listen again and take another swing.',
  guided: 'Build the word with the coach, then type it.',
  final: 'The model is hidden again. Try it from memory.',
};

export function renderPractice(ctx, params = {}) {
  const { progress, audio } = ctx;
  const root = h('section', { class: 'practice' });
  const course = CATALOG.find((l) => l.id === params.lessonId && l.available)
    ?? recommendedLesson(progress, ctx.today);
  const session = startSession({
    words: lessonQueue(course, progress, ctx.today, ctx.settings.sessionLength).map(wordEntry),
    progress, today: ctx.today, length: ctx.settings.sessionLength, id: ctx.newId('s'),
  });
  // Keep the lesson's explicit core/transfer/review ordering.
  session.queue = lessonQueue(course, progress, ctx.today, ctx.settings.sessionLength).slice(0, ctx.settings.sessionLength)
    .map((word) => ({ word, recheck: false }));
  session.planned = session.queue.length;
  const sessionRec = {
    id: session.id, date: ctx.today, startedAt: new Date().toISOString(), endedAt: null,
    plannedWords: session.planned, completedWords: 0, results: [], lessonId: course.id,
  };
  progress.sessions.push(sessionRec);
  ctx.persist();

  let run = null;
  let sentenceStarted = false;
  const warmupModels = new Set();

  function showWarmup(returnToWord = false) {
    if (run) { run.modelUsed = true; run.instructionShown = true; }
    audio.stopSpeech();
    root.replaceChildren(header(), renderWarmup(ctx, course, session.id, () => returnToWord ? draw() : startNextWord(), () => {
      for (const word of WARMUP_MODELS[course.id] ?? []) warmupModels.add(word);
    }));
  }


  function startNextWord() {
    const q = currentEntry(session);
    if (!q) {
      if (course.sentences?.length && !sentenceStarted) {
        sentenceStarted = true;
        audio.stopSpeech();
        root.replaceChildren(header(), renderSentence(ctx, course, session, finish));
        return;
      }
      return finish();
    }
    const context = course.words.includes(q.word) ? 'core'
      : course.transfer.includes(q.word) ? 'transfer' : 'connected-review';
    run = createRun({
      entry: wordEntry(q.word), record: progress.words[q.word], progress, sessionId: session.id, recheck: q.recheck,
      skipLearn: context === 'transfer' && !progress.words[q.word]?.needsInstruction,
    });
    if (warmupModels.has(q.word)) { run.modelUsed = true; run.instructionShown = true; }
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
          { label: 'WORD', value: `${Math.min(session.completed + 1, session.planned)}/${session.planned}` },
          { label: 'POINTS', value: sum.points },
          { label: 'HITS', value: hits },
        ],
      }),
      h('div', { class: 'practice-nav' },
        h('span', { class: 'note' }, course.title),
        WARMUPS[course.id] && run?.view === 'learn' ? h('button', { class: 'btn ghost', type: 'button', onClick: () => showWarmup(true) }, 'More examples') : null,
        h('button', { class: 'btn ghost', type: 'button', onClick: finish }, 'Finish for today')),
      baseTrail(session.completed));
  }

  function draw() {
    const body = run.view === 'learn' ? learnView() : run.view === 'input' ? inputView() : feedbackView();
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
      h('p', { class: 'note' }, l.scope),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onClick: () => { audio.unlock(); audio.speak(text); } }, 'Read Aloud'),
        h('button', { class: 'btn', type: 'button', onClick: draw }, 'Replay animation'),
        h('button', {
          class: 'btn primary practice-ready', type: 'button', 'data-autofocus': !l.build || run.buildAnswered,
          disabled: !!l.build && !run.buildAnswered,
          onClick: () => { if (l.build && !run.buildAnswered) return; audio.stopSpeech(); run.view = 'input'; draw(); },
        }, 'Ready for batting practice')));
  }

  function buildDecision(lesson) {
    return h('section', { class: `build-decision${run.buildAnswered ? ' answered' : run.buildAttempts ? ' retry-choice' : ''}`, 'aria-label': 'Your turn: choose an answer' },
      h('p', { class: 'decision-title' }, run.buildAnswered ? 'CORRECT — READY TO PRACTICE' : run.buildAttempts ? 'TRY AGAIN — PICK ONE' : 'YOUR TURN — PICK ONE'),
      h('p', { class: 'decision-prompt' }, `Before adding -${lesson.build.suffix} to ${lesson.build.base}, what should you do?`),
      h('p', { class: 'decision-instruction' }, run.buildAnswered
        ? 'Nice work! Press Ready for batting practice below.'
        : run.buildAttempts ? 'That choice needs a change. Try the other answer.' : 'Click or tap one answer below to continue.'),
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
          const ready = root.querySelector('.practice-ready');
          ready.disabled = !run.buildAnswered;
          if (run.buildAnswered) ready.removeAttribute('disabled');
          else ready.setAttribute('disabled', '');
          focusSoon(run.buildAnswered ? ready : panel.querySelector('[data-autofocus]'));
          announce(result.correct ? 'Correct. Press Ready for batting practice.' : 'That choice needs a change. Try the other answer.');
        },
      }, option.label))),
      run.buildMessage ? h('p', { class: 'build-message', role: 'status' }, run.buildMessage) : null);
  }

  function inputView() {
    const phase = run.phase;
    const canSpeak = audio.speechAllowed();
    const input = h('input', {
      class: 'answer', id: 'answer', type: 'text', name: 'practice-entry', 'aria-label': 'Type your spelling',
      spellcheck: 'false', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off',
      'data-gramm': 'false', 'data-lpignore': 'true', maxlength: '40', enterkeyhint: 'done', 'data-autofocus': true,
    });
    const form = h('form', { class: 'answer-form', novalidate: true, onSubmit: (e) => onSubmit(e, input) },
      input,
      h('button', { class: 'btn primary big', type: 'submit' }, 'Swing!'));

    return h('div', { class: `card batting phase-${phase}` },
      h('p', { class: 'eyebrow' }, TITLES[phase]),
      h('p', { class: 'lead' }, INTROS[phase]),
      phase === 'hint' ? h('div', { class: 'hint' }, h('strong', null, 'Hint: '), hintFor(run)) : null,
      phase === 'guided' ? (run.lesson ? wordBuilder(run.lesson.steps, { finalWord: run.entry.word }) : letterBuilder(run.entry.word)) : null,
      run.shownWord && phase !== 'guided' ? h('p', { class: 'shown-word' }, run.entry.word) : null,
      h('p', { class: 'sentence' }, visibleSentence(run.entry)),
      h('div', { class: 'row' },
        run.lesson ? h('button', { class: 'btn', type: 'button', onClick: () => {
          audio.stopSpeech(); run.modelUsed = true; run.instructionShown = true; run.view = 'learn'; draw();
        } }, 'Coach’s Tip (uses support)') : null,
        canSpeak ? h('button', { class: 'btn', type: 'button', onClick: speakWord }, 'Hear Word and Sentence') : null,
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
        children.push(h('p', { class: 'lead' }, l?.feedback.correct
          ?? `You put all ${run.entry.word.length} letters in the right order.`));
        if (!independent) children.push(h('p', null, 'You used support this time, so this word will come back for another try.'));
        children.push(pointList(run.awards, POINT_LABELS));
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
        if (l) children.push(h('p', { class: 'note' }, l.scope));
      }
      if (run.done) {
        children.push(h('p', null, 'You worked hard on this one. It will come back soon, and it is flagged for instruction.'));
        children.push(pointList(run.awards, POINT_LABELS));
      } else {
        children.push(h('p', null, {
          hint: 'Next Swing: you will get a hint, with the correct spelling hidden.',
          guided: 'Next Swing: we will build the word together.',
        }[run.nextPhase] ?? 'Next Swing: look at it again and give it another try.'));
      }
    }

    const last_ = !run.done || session.pos + 1 < session.queue.length;
    children.push(h('div', { class: 'row' },
      run.done
        ? h('button', { class: 'btn primary big', type: 'button', 'data-autofocus': true, onClick: nextBatter }, last_ ? 'Next batter' : course.sentences?.length ? 'Try a game situation' : 'See results')
        : h('button', { class: 'btn primary big', type: 'button', 'data-autofocus': true, onClick: () => { advanceRun(run); draw(); } }, 'Next Swing'),
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

  if (WARMUPS[course.id] && !warmupComplete(progress, course.id)) showWarmup();
  else startNextWord();
  return root;
}
