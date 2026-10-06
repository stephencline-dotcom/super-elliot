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
Finishing early bypasses the sentence check. Each attempted sentence earns one practice run at most once per target word per day;
that reward is separate from mastery.

Guided building choices and sentence records live in the optional activities array.
They survive reload/export/import and are listed in the parent view. Old v1 files without
that array remain valid. Browser-local history is not deleted. The instruction is a
practice curriculum requiring real learner feedback; no effectiveness claim is implied.
Real Chrome/Chromebook rendering and audio still need a device check.


### Expanded dugout examples and original baseball rewards

The three doubling lessons use a short pattern explanation and two worked examples in the Learn stage. Additional comparison and decision content remains authored in warmups.js for future use. Returning sessions skip the opening explanation. Read Aloud stays optional; no teaching screen starts speech automatically.

The practice header shows the lesson path and completed-word count. Each newly rewarded word earns one practice run, as described below. Practice cards unlock after 1, 3, 6, and 10 qualifying completed sessions. A session qualifies by completing four words, or all planned words if fewer than four. These rewards celebrate participation and are separate from mastery. A short synthesized crowd cheer celebrates each group of four completed words; normal effect volume/mute settings apply. All characters, pennants, cards, skyline, and sounds are original; no team logos, player photos, or broadcast recordings are included.

The sentence renderer omits empty optional sections before calling native replaceChildren, preventing literal null text. Correct-answer feedback now uses a clearly labeled practice badge in place of the clipped star animation. Layout and actual audio still require Chrome/Chromebook verification.


### Sound-to-spelling routines

New core words automatically enter sound-to-spelling in the Build stage. If you choose the coach's example instead, **Build with sounds** reopens the routine from Coach's Tip. Authored routines cover the 18 targets in the three doubling lessons. First hear/say the base and tap its speech sounds. Then map each sound to its letter or letter group. Finally choose the base change, inspect the full sound map, blend, and choose **Spell with the model hidden**. Each stage has feedback, optional speech controls, and a route back to coaching. Self-spoken responses are not recorded or scored; no microphone is used. Incorrect mapping reveals the model and identifies boxes needing a change. Correct stage responses have a short chime, respecting effects volume/mute settings.

Consonant blends have separate boxes (swim has s/w/i/m). Digraphs and doubled consonants share a box where they represent one sound (oo, ll, nn, ng). The -ing ending has two boxes i/ng. The -ed examples here sound /t/ or /d/ and have one ending box marked ed; the spelling of the morpheme stays intact. Work uses the common American r-controlled-vowel model w/or/k. Pronunciation differences need adult review. These are authored instructional models, not a phonological diagnosis or a speech recognizer. Adult/specialist review is still needed. We deliberately use speech synthesis for whole words and directions, not for isolated phonemes: ordinary text-to-speech can pronounce isolated letters as letter names or add unwanted vowel sounds.

Counts, maps, ending decisions, completion, and exits are stored as separate sound-count, sound-map, sound-ending, and sound-routine activities. Parent view and JSON export/import retain them. Because the routine is guided instruction and displays models, its activities and the immediate hidden spelling attempt are supported practice. They cannot establish independent mastery. Normal later-session reviews still begin with the answer hidden. No practice runs are awarded by sound checks.

Instructional basis: International Dyslexia Association, [Spelling](https://dyslexiaida.org/spelling-2/) and [Structured Literacy](https://dyslexiaida.org/structured-literacy-effective-instruction-for-students-with-dyslexia-and-related-reading-difficulties/). These sources support explicit instruction connecting speech sounds, spellings, and word endings; they do not validate this app or its particular activities and thresholds.


### Guided lesson path

The student follows Learn → Build → Try → Use → Finish. The strip marks the current stage with text, color, and aria-current. Build and Try repeat as needed for each word. There is no automatic narration or automatic submission.

A new doubling lesson starts with one pattern explanation and two worked examples, then automatically opens sound-to-spelling for each new core word. The ending decision is the Your turn activity. Completing it leads directly to a spelling attempt with the model hidden. Transfer checks start hidden without instruction. An optional coach-example fallback provides the existing animated builder and targeted doubling/keep decision. Review the pattern returns to that same word without starting another session.

A returning lesson skips the introduction. Previously attempted words without a correct response today come first; new words come next; words already answered correctly today come later, preserving rotation in short sessions. New core words still receive teaching. A miss routes to a hint, then automatically to guided sound building if necessary, then a final hidden retry. Completing guided sound building records activity evidence and moves to the final spelling phase without manufacturing a copied word attempt. A final miss ends that word with support. Existing legacy lessons without sound models retain the original guided-copy path.

After the word queue and its supported rechecks, one sentence activity leads to Finish. Finishing early is always available and bypasses the sentence. Results show unique words spelled without help and words practiced with help, plus a clear return plan and Done for today. Detailed attempt provenance and activity evidence remain in My Progress / Parent view and JSON exports. Mastery criteria and storage keys are unchanged. Existing progress is retained.

Validation covers the default first lesson path, later recall, unseen core teaching, transfer checks, help transitions, bounded final retry, model hiding, optional speech, sentence evidence, coaching fallback, and plain results. Real Chrome/Chromebook layout and actual audio still require a device check.


### Simple practice runs

The scoreboard uses RUNS: one completed word earns one practice run, whether finished independently, with help, or moved on after supported effort. One attempted sentence earns one run. Each word/day and sentence-target/day can earn its run once. Same-session rechecks and sound/build decisions add no runs. There are no bonus multipliers, deductions, or run-based mastery requirements. Spelling without help and lesson mastery are reported separately. A six-word session with one sentence can earn seven runs if none were already earned that day.

Legacy score records remain intact in storage and JSON exports. Display functions normalize known old word rewards to one run per word/day and old sentence rewards to one per sentence target/day. Old recall bonuses are folded into the original word run; recheck bonuses no longer add rewards. Runs belong to the earliest recorded award session, so a repeated same-day session does not receive a second displayed run. This conversion changes the visible reward scale without deleting attempts, activity evidence, cards, or review schedules. Import previews use the same run scale.


### Extra practice pool

Extra practice is a separate mode, opened from results or the lesson catalog after practice. The four available lessons have 36 additional words and 36 authored sentences (10 each for the doubling/contrast lessons, 6 for consonant + y). Extra sessions cap at six words, or a shorter session-length setting. A six-word extra session aims for four unseen application words and two familiar words from the current or linked lessons. Only previously attempted words qualify for familiar review. Due words and words needing support are prioritized; successfully completed words today are deprioritized. Once new words are exhausted, least recently practiced pool words return; the pool is finite. Short sessions reserve a familiar slot where possible.

Extra words start with the answer hidden, so the student can apply the taught pattern. Optional coaching and the existing bounded retry flow remain available, and any shown model marks the word supported. Additional coaching is marked starter and needs adult review. Sentence selection favors unused prompts with a word completed this session, avoids targets never attempted, and mixes older words where eligible. One sentence per session keeps the activity brief.

Session mode and extra-new / extra-review / connected-review attempt context survive refresh and JSON export/import. Word-level success, support, later recall, sentence evidence, and original/current lesson provenance remain visible in the parent view. Additional targets do not replace the original required words or original transfer requirement for lesson mastery. Practice runs follow the same once-per-word/day rules; repeated practice never subtracts runs.


### Rule-focused student screens

Each available lesson starts with a concise rule and two worked examples, and finishes with a prominent “Take this rule with you” recap before the score. Consonant + y examples (copy/copies and hurry/hurries) do not reveal its transfer target, carries. The recap includes a short example and a collapsible boundary explanation; Read rule is optional and never starts automatically. Doubling checks visibly include one syllable, one vowel letter, one final consonant, and the w/x/y exclusion. Mastery remains an adjustable practice goal based on independent word evidence, not a claim about rule knowledge.

Action banners name the next control. Optional hearing is highlighted first; typing enables the Check button and changes the banner to the next action. Students may type directly when an adult dictates. Sound steps have shorter directions, a highlighted next action, and optional help. Word-specific explanations and existing retry support remain available. On results, word lists, scoring explanations, and reward cards are tucked into optional details so the rule and Done for today stand out. Saved evidence, scoring, and mastery policies are unchanged. Real-browser layout and audio still need device verification.


### Quick Batting Practice

Play & Review on Home starts a round of up to five unique words. Eligibility comes from actual practice on a lesson’s core words, not parent observations or the mere presence of a lesson in the catalog. Familiar words must have recorded attempts and belong to a taught course. A round aims for four familiar words (prioritizing support/due reviews, plus a confidence word) and one unattempted word from that taught course’s authored extra pool. Two misses among the last five first attempts suppress the new word. Fewer familiar words produce a shorter round; no unrelated words are added. New words join the familiar pool after an attempt, and the finite application pool rotates forward as words are attempted.

Reading starts only on Hear word. The hidden answer is submitted with Swing! A miss or requested hint shows a concise rule cue and correction, then offers one hidden supported retry or move-on. A final miss completes the word with support. No timers, lives, or lost points. Hit animations are cosmetic, respect reduced motion and the celebration setting, and never block navigation. Round results offer another round, Done, and My Progress.

Quick mode, quick-new/quick-review contexts, original/current lesson IDs, support flags, and results persist and round-trip through JSON. A same-day familiar attempt uses the same-day review kind: counted as immediate recall, excluded from mastery and later-recall counts, and does not advance spacing. Later-day independent familiar attempts can supply normal word-level evidence. Runs keep the once-per-word/day rule. The Parent view lists recent rounds and retains individual attempts. Existing v1 files remain importable. Browser layout, real speech and animation need device testing.
