// Extra teaching examples are not mastery targets. Transfer words remain unseen.
const worked = (base, ending, result, why) => ({ kind: 'example', base, ending, result, why });
const choice = (base, ending, result, operation, why) => ({ kind: 'choice', base, ending, result, operation, why });
export const WARMUPS = {
  'doubling-ing': [
    worked('bat', 'ing', 'batting', 'Bat has one syllable and ends in one vowel letter and one consonant letter. Double t before -ing.'),
    worked('tap', 'ing', 'tapping', 'Tap ends in a single vowel letter followed by a single consonant letter. Add another p, then -ing.'),
    { kind: 'compare', title: 'Hopping or hoping?', pairs: ['hop + p + ing = hopping', 'hope − e + ing = hoping'], why: 'Hop has a short vowel: double p. Hope ends in silent e: drop that e before -ing. The spelling tells us which word we mean.' },
    choice('pack', 'ing', 'packing', 'keep', 'Pack already ends in two consonant letters, c and k. Keep pack and add -ing.'),
    choice('jog', 'ing', 'jogging', 'double', 'Jog has one syllable and ends in one vowel letter and one consonant letter. Double g before -ing.'),
  ],
  'doubling-ed': [
    worked('pat', 'ed', 'patted', 'Pat has one syllable and ends in one vowel letter and one consonant letter. Double t before -ed.'),
    worked('nod', 'ed', 'nodded', 'Double d, then add -ed. Both patted and nodded have an extra spoken syllable, but their spelling still ends in -ed.'),
    { kind: 'compare', title: 'Double or keep?', pairs: ['stop + p + ed = stopped', 'help + ed = helped'], why: 'Stop ends in one vowel letter and one consonant letter: double p. Help already ends in two consonant letters, l and p: keep the base. Both endings sound like /t/, but we write -ed.' },
    choice('lift', 'ed', 'lifted', 'keep', 'Lift ends in two consonant letters, f and t. Keep lift, then add -ed.'),
    choice('mop', 'ed', 'mopped', 'double', 'Mop has one syllable and ends in one vowel letter and one consonant letter. Double p, then add -ed, even though the ending sounds like /t/.'),
  ],
  'doubling-contrast': [
    worked('rain', 'ed', 'rained', 'Rain has two vowel letters together, a and i. Keep rain unchanged, then add -ed.'),
    worked('pick', 'ed', 'picked', 'Pick ends in two consonant letters, c and k. Keep pick unchanged, then add -ed.'),
    { kind: 'compare', title: 'Look at the letters before the ending', pairs: ['rub + b + ed = rubbed', 'need + ed = needed'], why: 'Rub ends in one vowel letter and one consonant letter: double b. Need has two vowel letters together, e and e: keep the base.' },
    choice('pass', 'ed', 'passed', 'keep', 'Pass already ends in ss. Keep both letters; do not add a third s.'),
    choice('kick', 'ing', 'kicking', 'keep', 'Kick ends in two consonant letters, c and k. Keep kick unchanged before -ing.'),
  ],
};
export const warmupComplete = (progress, lessonId) => (progress.activities ?? []).some(a =>
  a.lessonId === lessonId && a.prompt.startsWith('Warm-up 2:') && a.correct);

export const WARMUP_MODELS = { 'doubling-ing': ['hopping'], 'doubling-ed': ['stopped'], 'doubling-contrast': ['rubbed'] };
