import { h, confirmDialog, infoDialog } from './dom.js';
import { scoreboard } from './components.js';
import { WORDS } from '../data/words.js';
import { lessonFor } from '../data/lessons.js';
import { OBSERVATIONS } from '../data/observations.js';
import { totals, wordStats } from '../stats.js';
import { CATALOG } from '../data/catalog.js';
import { lessonEvidence } from '../mastery.js';
import { totalPoints } from '../scoring.js';
import { INTERVAL_DAYS } from '../constants.js';
import { SKILLS_STATUS } from '../skills.js';
import { exportProgress, parseImport, summarize, applyImport, resetProgress } from '../storage.js';

const table = (headers, rows, caption) => h('div', { class: 'table-wrap' },
  h('table', null,
    h('caption', { class: 'sr-only' }, caption),
    h('thead', null, h('tr', null, headers.map((x) => h('th', { scope: 'col' }, x)))),
    h('tbody', null, rows.map((r) => h('tr', null, r.map((c) => h('td', null, String(c))))))));

export function renderParent(ctx) {
  const { progress } = ctx;
  const stats = wordStats(progress);
  const t = totals(progress);
  const practiced = WORDS.filter((w) => stats[w.word]);
  const later = progress.attempts.filter((a) => a.reviewKind === 'later-session' && a.attemptType === 'first' && !a.hintUsed && !a.modelUsed && !a.instructionShown && !a.correctionShown);
  const laterOk = later.filter((a) => a.correct).length;

  const instruction = (w) => {
    const rec = progress.words[w.word];
    const base = lessonFor(w) ? 'Lesson available' : 'Instruction pending';
    return rec?.needsInstruction ? `${base} (offered)` : base;
  };

  const targets = Object.entries(progress.words)
    .filter(([, r]) => r.needsInstruction || r.difficultyCount > 0)
    .sort((a, b) => b[1].difficultyCount - a[1].difficultyCount);

  const section = (title, ...content) => h('section', { class: 'block' }, h('h2', null, title), ...content);

  return h('section', { class: 'card parent' },
    h('h1', null, 'My Progress and Parent View'),
    h('div', { class: 'notice', role: 'note' },
      h('strong', null, 'Saved in this browser only. '),
      'Progress is stored on this device and does not sync across devices or browsers. ',
      'Clearing browser data removes it, so export a backup regularly. ',
      'This screen is a convenience view. It is not password-protected.'),
    scoreboard({
      label: 'Totals',
      items: [
        { label: 'RUNS', value: totalPoints(progress.points.ledger) },
        { label: 'SESSIONS', value: progress.sessions.filter((s) => s.results.length).length },
        { label: 'ATTEMPTS', value: t.attempts },
        { label: 'HINTS USED', value: t.hintAttempts },
      ],
    }),
    section('Lesson progress',
      h('p', { class: 'note' }, 'A session is practice, not completion. Required words need independent success on two different days, plus a related-word check. Later difficulties trigger refresher practice.'),
      table(['Lesson', 'Status', 'Required words ready', 'Related check'],
        CATALOG.filter((l) => l.available).map((l) => {
          const e = lessonEvidence(l, progress);
          return [l.title, e.status, `${e.readyWords}/${l.words.length}`, e.transferReady ? 'Passed independently' : 'Still practicing'];
        }), 'Lesson mastery evidence')),
    section('Evidence by word',
      h('p', { class: 'note' }, 'Guided practice = correct with a hint, model, or retry. Independent success = correct first try with no support. Later recall = independent first try in a later session. Same-session retries are counted separately from later review.'),
      practiced.length
        ? table(['Word', 'Attempts', 'Attempts with hint', 'Guided', 'Independent', 'Later recall', 'Immediate recall', 'Next review', 'Instruction'],
          practiced.map((w) => {
            const c = stats[w.word];
            const rec = progress.words[w.word];
            return [w.word, c.attempts, c.hintAttempts, c.guidedPractice, c.independentSuccess, c.laterRecall, c.sameSessionRecall, rec?.dueDate ?? '-', instruction(w)];
          }), 'Practice evidence by word')
        : h('p', null, 'No practice yet. The history starts empty.'),
      h('p', { class: 'note' }, `Delayed independent review: ${laterOk} of ${later.length} first tries correct. Words not yet practiced: ${WORDS.length - practiced.length}.`),
      h('p', { class: 'note' }, `Review spacing steps (days): ${INTERVAL_DAYS.join(', ')}. Missed days do not change them.`)),
    section('Instructional targets',
      targets.length
        ? table(['Word', 'Times needing support', 'Next review', 'Instruction'],
          targets.map(([word, r]) => [word, r.difficultyCount, r.dueDate, instruction(WORDS.find((w) => w.word === word))]),
          'Words that needed support')
        : h('p', null, 'None yet. Words that needed support will be listed here.')),
    section('Building choices and sentence practice',
      h('p', { class: 'note' }, 'These activities are separate from independent word mastery. Sentence work immediately after spelling is practice, not delayed recall.'),
      (progress.activities ?? []).length ? table(['Date', 'Lesson', 'Activity', 'Prompt', 'Response', 'Result', 'Support', 'Attempt'],
        progress.activities.slice(-30).reverse().map((a) => [a.date, a.lessonId, a.kind, a.prompt, a.typed,
          a.attemptType === 'skipped' ? 'Skipped' : a.correct ? 'Correct' : 'Needs practice', a.modelUsed ? 'Model used' : 'No model', a.attemptType]),
        'Sound routines, building decisions and sentence attempts') : h('p', null, 'No sound, building or sentence activities yet.')),
    section('Starting observations (parent-provided, before the app)',
      h('p', { class: 'note' }, 'These are historical notes from a parent. They are not app results. Entries marked "inferred" guess the intended word and need parent confirmation.'),
      table(['Intended word', 'Spelled as', 'Note'],
        OBSERVATIONS.map((o) => [o.target, o.observed, o.inferredTarget ? 'Inferred intended word: parent to confirm' : 'Parent-provided']),
        'Parent-provided historical observations')),
    section('Extra practice',
      h('p',{class:'note'},'Additional words show how she applies a taught pattern. Their results stay separate from required lesson targets; support and sentence practice do not establish mastery.'),
      table(['Lesson','New words without help','New words with help','New words still practicing','Familiar checks'], CATALOG.filter(l=>l.available).map(l=>{
        const results=progress.sessions.filter(s=>s.practiceMode==='extra' && s.lessonId===l.id).flatMap(s=>s.results);
        const fresh=results.filter(a=>a.lessonContext==='extra-new' && a.reviewKind!=='same-session');
        return [l.title,fresh.filter(a=>a.outcome==='independent').length,
          fresh.filter(a=>a.outcome==='supported').length,fresh.filter(a=>a.outcome==='moved-on').length,
          results.filter(a=>['extra-review','connected-review'].includes(a.lessonContext) && a.reviewKind!=='same-session').length];
      }), 'Additional application practice')),
    section('Quick Batting Practice',
      h('p',null,'Only taught patterns enter the game. Same-day play is immediate practice, not delayed recall.'),
      table(['Date','Words completed','New applications','Familiar words'],progress.sessions.filter(s=>s.practiceMode==='quick').slice(-20).reverse().map(s=>[s.date,s.completedWords,s.results.filter(r=>r.lessonContext==='quick-new').length,s.results.filter(r=>r.lessonContext==='quick-review').length]),'Quick practice rounds')),
    section('Recent attempts',
      progress.attempts.length
        ? table(['Date', 'Word', 'Typed', 'Result', 'Stage', 'Hint', 'Model', 'Try', 'Review', 'Original lesson', 'Practiced in', 'Context'],
          progress.attempts.slice(-30).reverse().map((a) => [a.date, a.word, a.typed, a.correct ? 'correct' : 'not yet', a.stage,
            a.hintUsed ? 'yes' : 'no', a.modelUsed ? 'yes' : 'no', a.attemptType, a.reviewKind, a.originLessonId ?? 'Legacy / unknown', a.currentLessonId ?? 'Legacy / unknown', a.lessonContext ?? 'Legacy / unknown']), 'Most recent attempts')
        : h('p', null, 'No attempts recorded.')),
    section('Skill-level insight', h('p', null, SKILLS_STATUS)),
    dataSection(ctx),
    h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onClick: () => ctx.go('home') }, 'Back to home')));
}

function dataSection(ctx) {
  const file = h('input', {
    id: 'import-file', type: 'file', accept: 'application/json,.json', class: 'sr-only',
    onChange: async (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      if (f.size > 10_000_000) return infoDialog({ title: 'Import failed', message: 'That file is too large.' });
      const parsed = parseImport(await f.text());
      if (!parsed.ok) {
        return infoDialog({ title: 'Import failed', message: h('div', null, h('p', null, 'Nothing was changed.'), h('ul', null, parsed.errors.map((m) => h('li', null, m)))) });
      }
      const cur = summarize(ctx.progress);
      const inc = summarize(parsed.data);
      const ok = await confirmDialog({
        title: 'Replace progress with this file?',
        message: h('div', null,
          h('p', null, `This browser now has ${cur.attempts} spelling attempts, ${cur.activities} activities, ${cur.sessions} sessions, ${cur.points} practice runs.`),
          h('p', null, `The file has ${inc.attempts} spelling attempts, ${inc.activities} activities, ${inc.sessions} sessions, ${inc.points} practice runs.`),
          h('p', null, 'Importing replaces the current progress. A single backup of the current progress is kept in this browser. Export first if unsure.')),
        confirmLabel: 'Replace progress',
      });
      if (!ok) return;
      if (applyImport(ctx.storage, ctx.progress, parsed.data)) {
        ctx.replaceProgress(parsed.data);
        ctx.go('parent');
      } else infoDialog({ title: 'Import failed', message: 'The browser could not save the data. Nothing was changed.' });
    },
  });

  return h('section', { class: 'block' },
    h('h2', null, 'Backup and data'),
    h('p', { class: 'note' }, 'Export saves a JSON file you can keep. Import checks the file before anything is replaced.'),
    h('div', { class: 'row' },
      h('button', {
        class: 'btn', type: 'button',
        onClick: () => ctx.download(exportProgress(ctx.progress), `spelling-ballpark-progress-${ctx.today}.json`),
      }, 'Export progress (JSON)'),
      file,
      h('label', { for: 'import-file', class: 'btn', tabindex: '0', role: 'button', onKeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } } }, 'Import progress…'),
      h('button', {
        class: 'btn danger', type: 'button',
        onClick: async () => {
          const ok = await confirmDialog({
            title: 'Reset all progress?',
            message: 'This permanently deletes all attempts, practice rewards, and review schedules from this browser. Export a backup first if you may want them. Settings are kept.',
            confirmLabel: 'Yes, reset progress',
          });
          if (ok) { ctx.replaceProgress(resetProgress(ctx.storage)); ctx.go('parent'); }
        },
      }, 'Reset progress…')));
}
