# Spelling Ballpark

A personal spelling practice web app with a Philadelphia-Phillies-inspired baseball theme (original CSS/SVG art, no logos, no external images). Plain HTML, CSS, and JavaScript ES modules. No build step and no runtime dependencies.

## Preview locally

ES modules do not load from `file://`, so serve the folder. From the repository root in Windows PowerShell:

```powershell
py -m http.server 8080
```

(or `python -m http.server 8080`, or `npm start`). Then open <http://localhost:8080/> in Chrome. Stop the server with Ctrl+C.

Testing aid: `http://localhost:8080/?today=2026-10-12` pretends it is another date so review scheduling can be previewed.

## Run the checks

```powershell
node --test tests/*.test.mjs
```

These cover word data, the retry flow, scheduling, points, storage, and import validation. They need only Node 20+.

## File structure

```
index.html              Page shell
css/styles.css          All styling, reduced-motion rules
js/main.js              Startup, screen routing, shared context
js/constants.js         Interval ladder, enums, default settings
js/dates.js             Date helpers
js/session.js           Session queue and the Learn/Try/Check/Try Again state machine
js/scheduler.js         Review scheduling rules
js/scoring.js           Point values and no-farming rules
js/stats.js             Evidence counts (guided, independent, later recall)
js/storage.js           localStorage, export, validated import, reset, settings
js/audio.js             Speech synthesis and synthesized sound effects
js/diff.js              Letter-level comparison for feedback
js/skills.js            Placeholder for future skill-level inference
js/data/words.js        Word bank, sentences, accepted spelling variants
js/data/lessons.js      Editable lesson content (tips, steps, hints, feedback)
js/data/observations.js Parent-provided historical observations
js/ui/*.js              Home, practice, results, parent view, settings, scene, helpers
tests/logic.test.mjs    Node tests
```

## Editing content

- Add or edit a word in `js/data/words.js`. Use `{word}` in the sentence. Add alternate correct spellings to `accepted`. Set `lessonId` only when a lesson exists; otherwise the word shows as "instruction pending".
- Add a lesson in `js/data/lessons.js` and link it from the word. Each lesson needs its own accurate explanation; do not reuse the doubling rule for words it does not fit.
- Change review spacing in `js/constants.js` (`INTERVAL_DAYS`) and point values in `js/scoring.js`.

## Data and privacy

Progress is saved in this browser's `localStorage` (keys start with `spelling-ballpark:`). It does not sync across devices or browsers and is lost if browser data is cleared. Use the parent view to export a JSON backup. Import validates the file, shows a summary, and requires confirmation before replacing progress (one backup of the replaced data is kept). Reset requires confirmation. Settings are stored separately and are not part of the export. The parent view is not password-protected.

## Deployment

The site is static. Upload `index.html`, `css/`, and `js/` to any static host (GitHub Pages, Netlify, Cloudflare Pages, a school or personal web server) over HTTPS. The `tests/` folder and `package.json` are not needed on the host. Because storage is per-origin, changing the hostname starts with empty progress; export before moving. Nothing in this repository deploys automatically.

## Lesson catalog and mastery update

Home opens a lesson catalog: three available starter lessons and five planned groups.
Only reviewed starter instruction is active. A session stays within its selected lesson,
with up to two words from connected, previously mastered lessons; due words take priority.
The session-length setting is a maximum, not a requirement to pad small lessons with new words.

Speech never starts on screen entry, on retry, or on changing speech volume/speed.
Press Read Aloud for coaching or Hear Word and Sentence for a spelling prompt.
The narration setting from old saved settings is retained for compatibility but ignored.
Effects remain separately configurable. Chrome voice availability still depends on the device.

Practice CSS uses a compact layout for common laptop/Chromebook viewports. Coaching
paragraphs are replaced by word-building steps, with -ed pronunciation included where
needed. Reports and catalogs scroll. Content is never clipped at small sizes or browser
zoom: accessibility may require scrolling. Real Chromebook/browser layout verification
remains necessary; no rendering or real audio test was possible in the build environment.

Mastery is an adjustable practice criterion in js/mastery.js, not a diagnostic score:
required core words need independent first-try successes on two different calendar days,
plus one independent related-word success. Seeing Coach's Tip counts as model support.
Same-session rechecks and retries do not satisfy mastery. A later first-try error resets
evidence for that word and can flag the original lesson as Refresher needed, including
when the error happens in a connected lesson. Missed days do not erase evidence.

Attempts include currentLessonId, originLessonId, lessonContext, and instructionShown.
The parent view shows lesson status and cross-lesson evidence in recent attempts.
Export/import and refresh preserve these fields with the existing v1 storage key.
Older files stay valid and visible, but records without lesson provenance cannot establish
new lesson mastery. No browser-local progress is deleted by the source update.

Run `npm test` for logic and lightweight DOM-flow tests. DOM tests do not verify browser
layout, focus appearance, real audio, or file picker behavior.

## Full first unit: Doubling and endings

The initial doubling unit now contains three lessons with four core words and two
related-word checks each (18 distinct targets):
1. -ing: running, hopping, swimming, sitting; related checks flipping and slipping.
2. -ed: planned, clapped, dropped, stopped; related checks rubbed and grabbed.
3. Keep the base: helping, cooled, looking, called; related checks jumped and worked.

Existing lesson IDs are preserved. Existing evidence stays, but an expanded lesson
needs evidence on its additional core words to satisfy mastery. The small consonant-y
starter remains available, and other units remain marked Coming soon.

First-exposure coaching includes an interactive doubling/keep decision. The spelling
model is present, so those choices are guided activities, not independent mastery.
The reason is visible on screen; narration remains strictly button-initiated.
Short sessions rotate unpracticed targets forward and reserve up to two connected
review slots once a linked lesson has prior mastery evidence.

A naturally completed session in this unit offers a short sentence check. Hear Sentence
is opt-in; Show sentence records model support. Capitals/punctuation are ignored, but
other spelling/word-order differences prevent a full sentence match. Target-word results
are checked at their expected positions, recorded separately, and are not a diagnostic
error classification. A correction permits one supported retry; skipping is available.
Finishing early bypasses the sentence check. Each attempted sentence earns five practice
points at most once per target word per day; those are not independent mastery points.

Guided building choices and sentence records live in the optional activities array.
They survive reload/export/import and are listed in the parent view. Old v1 files without
that array remain valid. Browser-local history is not deleted. The instruction is a
practice curriculum requiring real learner feedback; no effectiveness claim is implied.
Real Chrome/Chromebook rendering and audio still need a device check.


### Expanded dugout examples and original baseball rewards

The three doubling lessons each begin with five compact warm-up screens: two worked examples, one comparison, and two student decisions. Read Aloud stays optional. Completing both decisions makes future warm-ups optional; More examples is available from a word's Coach's Tip. Worked-example order alternates across sessions. Skip warm-up remains available. Decisions are stored as build activities with Warm-up prompts; they do not establish word mastery or award word points. A comparison that reveals a practiced target flags that target as supported for the rest of that session. The lesson's transfer targets are not shown by its warm-up.

Round the bases tracks completed words, including supported practice: four words complete a practice run. Practice cards unlock after 1, 3, 6, and 10 qualifying completed sessions. A session qualifies by completing four words, or all planned words if fewer than four. These rewards celebrate participation and are separate from mastery. A short synthesized crowd cheer accompanies each practice run; normal effect volume/mute settings apply. All characters, pennants, cards, skyline, and sounds are original; no team logos, player photos, or broadcast recordings are included.

The sentence renderer omits empty optional sections before calling native replaceChildren, preventing literal null text. Correct-answer feedback now uses a clearly labeled practice badge in place of the clipped star animation. Layout and actual audio still require Chrome/Chromebook verification.
