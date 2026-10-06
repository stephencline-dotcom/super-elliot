// Editable instructional content. Each lesson explains ONE specific word change.
// Do not copy a lesson to another word unless the same change really applies to it.
//
// Fields:
//   tip / narration  Coach's Tip text and what is read aloud.
//   steps            Word-building animation. Each step lists pieces; kind: base | change | suffix.
//   hints            Targeted hint shown on the "Next Swing" retry (index 0 is used first).
//   feedback         correct: shown on success. incorrect: shown after a miss.
//                    byAttempt: optional exact-misspelling messages, keyed by lowercase typed text.
//   scope            Reminder that limits the rule so it is not over-generalized.
//   status           'starter' = written for the first version and should be reviewed by an adult.
import { EXTRA_LESSONS } from './extra.js';
const p = (t, kind = 'base') => ({ t, kind });

export const LESSONS = {
  ...EXTRA_LESSONS,
  running: {
    word: 'running',
    role: 'demo',
    title: 'run + ing = running',
    tip: 'The word run is one short syllable that ends with a single vowel and a single consonant (u, n). When ing starts, that last letter n is doubled: run, n, ing.',
    steps: [
      { text: 'Start with the base word.', pieces: [p('run')] },
      { text: 'Double the last letter, n.', pieces: [p('run'), p('n', 'change')] },
      { text: 'Add ing.', pieces: [p('run'), p('n', 'change'), p('ing', 'suffix')] },
    ],
    hints: ['Start with run. Because run is one short syllable ending in one vowel and one consonant, double its last letter before adding ing.'],
    feedback: {
      correct: 'You doubled the n before ing. That is exactly what a short one-syllable word like run needs.',
      incorrect: 'Look at the middle: run ends in one vowel and one consonant, so the n is doubled before ing: run + n + ing.',
      byAttempt: {
        runing: 'You wrote run + ing. The n needs to be doubled first: run + n + ing.',
      },
    },
    scope: 'Doubling fits short, one-syllable words like run. It is not a rule for every word that gets ing.',
    related: ['hopping'],
    status: 'starter',
  },
  planned: {
    word: 'planned',
    role: 'demo',
    title: 'plan + ed = planned',
    tip: 'The word plan is one short syllable that ends with a single vowel and a single consonant (a, n). When ed is added, the last letter n is doubled: plan, n, ed. The ending sounds like a d, but it is still spelled ed.',
    steps: [
      { text: 'Start with the base word.', pieces: [p('plan')] },
      { text: 'Double the last letter, n.', pieces: [p('plan'), p('n', 'change')] },
      { text: 'Add -ed. It sounds like /d/, but keep both letters.', pieces: [p('plan'), p('n', 'change'), p('ed', 'suffix')] },
    ],
    hints: ['Start with plan. Double the last letter before adding ed. The ending sounds like d, but it is spelled ed.'],
    feedback: {
      correct: 'You doubled the n and kept the ed ending. Nice work.',
      incorrect: 'Two things to check: the n is doubled (plan + n), and the ending is spelled ed even though it sounds like d.',
      byAttempt: {
        pland: 'The ending sounds like d, but it is spelled ed. Also, the n is doubled: plan + n + ed.',
      },
    },
    scope: 'Doubling fits short, one-syllable words like plan. Other words with ed can change differently.',
    related: ['clapped'],
    status: 'starter',
  },
  studies: {
    word: 'studies',
    role: 'demo',
    title: 'study + s = studies',
    tip: 'The word study ends with a consonant (d) followed by y. To add s, change the y to i and add es: stud, i, es. There is no doubling in this word.',
    steps: [
      { text: 'Start with the base word.', pieces: [p('study')] },
      { text: 'Change the y to i.', pieces: [p('stud'), p('i', 'change')] },
      { text: 'Add es.', pieces: [p('stud'), p('i', 'change'), p('es', 'suffix')] },
    ],
    hints: ['Start with study. It ends with a consonant and then y. Change the y to i, then add es.'],
    feedback: {
      correct: 'You changed the y to i and added es. That is the right move for consonant + y.',
      incorrect: 'Study ends with a consonant and then y, so the y changes to i before es: stud + i + es.',
      byAttempt: {
        studys: 'Just adding s leaves the y in place. After a consonant + y, change the y to i and add es.',
      },
    },
    scope: 'This change is for words ending in a consonant plus y. It is different from doubling.',
    related: ['carries'],
    status: 'starter',
  },
  hopping: {
    word: 'hopping',
    role: 'related',
    title: 'hop + ing = hopping',
    tip: 'The word hop is one short syllable ending in one vowel and one consonant (o, p). Before ing, the last letter p is doubled: hop, p, ing.',
    steps: [
      { text: 'Start with the base word.', pieces: [p('hop')] },
      { text: 'Double the last letter, p.', pieces: [p('hop'), p('p', 'change')] },
      { text: 'Add ing.', pieces: [p('hop'), p('p', 'change'), p('ing', 'suffix')] },
    ],
    hints: ['Start with hop. It is one short syllable ending in one vowel and one consonant, so double the last letter before ing.'],
    feedback: {
      correct: 'You doubled the p before ing, just like hop needs.',
      incorrect: 'Hop ends in one vowel and one consonant, so the p is doubled before ing: hop + p + ing.',
      byAttempt: { hoping: 'Hoping is a different word. For hopping, double the p: hop + p + ing.' },
    },
    scope: 'Doubling fits short, one-syllable words like hop. It does not apply to every ing word.',
    related: ['running'],
    status: 'starter',
  },
  clapped: {
    word: 'clapped',
    role: 'related',
    title: 'clap + ed = clapped',
    tip: 'The word clap is one short syllable ending in one vowel and one consonant (a, p). Before ed, the last letter p is doubled: clap, p, ed.',
    steps: [
      { text: 'Start with the base word.', pieces: [p('clap')] },
      { text: 'Double the last letter, p.', pieces: [p('clap'), p('p', 'change')] },
      { text: 'Add -ed. It sounds like /t/, but keep both letters.', pieces: [p('clap'), p('p', 'change'), p('ed', 'suffix')] },
    ],
    hints: ['Start with clap. Double the last letter p before adding ed. The ending sounds like t, but it is spelled ed.'],
    feedback: {
      correct: 'You doubled the p and kept the ed ending.',
      incorrect: 'Clap ends in one vowel and one consonant, so the p is doubled before ed: clap + p + ed. The ending sounds like t but is spelled ed.',
      byAttempt: { claped: 'The p needs to be doubled: clap + p + ed.', clapt: 'The ending sounds like t, but it is spelled ed: clap + p + ed.' },
    },
    scope: 'Doubling fits short, one-syllable words like clap. Other words with ed can change differently.',
    related: ['planned'],
    status: 'starter',
  },
  carries: {
    word: 'carries',
    role: 'related',
    title: 'carry + s = carries',
    tip: 'The word carry ends with a consonant (r) followed by y. To add s, change the y to i and add es: carr, i, es. The r stays as it is.',
    steps: [
      { text: 'Start with the base word.', pieces: [p('carry')] },
      { text: 'Change the y to i.', pieces: [p('carr'), p('i', 'change')] },
      { text: 'Add es.', pieces: [p('carr'), p('i', 'change'), p('es', 'suffix')] },
    ],
    hints: ['Start with carry. It ends with a consonant and then y. Change the y to i, then add es.'],
    feedback: {
      correct: 'You changed the y to i and added es. Same move as study, new word.',
      incorrect: 'Carry ends with a consonant and then y, so the y changes to i before es: carr + i + es.',
      byAttempt: { carrys: 'After a consonant + y, change the y to i and add es.', caries: 'Keep both r letters from carry: carr + i + es.' },
    },
    scope: 'This change is for words ending in a consonant plus y. It is different from doubling.',
    related: ['studies'],
    status: 'starter',
  },
};

// Expanded first unit: authored examples with explicit contrast explanations.
Object.assign(LESSONS, {
  "swimming": {
    "word": "swimming",
    "role": "unit",
    "title": "swim + ing = swimming",
    "tip": "Swim is one syllable and ends with one vowel letter followed by one consonant letter. Double the m before -ing.",
    "steps": [
      {
        "text": "Start with swim.",
        "pieces": [
          {
            "t": "swim",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Double the final m.",
        "pieces": [
          {
            "t": "swim",
            "kind": "base"
          },
          {
            "t": "m",
            "kind": "change"
          }
        ]
      },
      {
        "text": "Add -ing.",
        "pieces": [
          {
            "t": "swim",
            "kind": "base"
          },
          {
            "t": "m",
            "kind": "change"
          },
          {
            "t": "ing",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Swim is one syllable and ends with one vowel letter followed by one consonant letter. Double the m before -ing."
    ],
    "feedback": {
      "correct": "You doubled the final m and added -ing.",
      "incorrect": "Swim is one syllable and ends with one vowel letter followed by one consonant letter. Double the m before -ing.",
      "byAttempt": {
        "swiming": "You kept swim and the ending. Add another m before -ing: swim + m + ing."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "swim",
      "suffix": "ing",
      "operation": "double",
      "letter": "m"
    }
  },
  "sitting": {
    "word": "sitting",
    "role": "unit",
    "title": "sit + ing = sitting",
    "tip": "Sit is one syllable and ends with one vowel letter followed by one consonant letter. Double the t before -ing.",
    "steps": [
      {
        "text": "Start with sit.",
        "pieces": [
          {
            "t": "sit",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Double the final t.",
        "pieces": [
          {
            "t": "sit",
            "kind": "base"
          },
          {
            "t": "t",
            "kind": "change"
          }
        ]
      },
      {
        "text": "Add -ing.",
        "pieces": [
          {
            "t": "sit",
            "kind": "base"
          },
          {
            "t": "t",
            "kind": "change"
          },
          {
            "t": "ing",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Sit is one syllable and ends with one vowel letter followed by one consonant letter. Double the t before -ing."
    ],
    "feedback": {
      "correct": "You doubled the final t and added -ing.",
      "incorrect": "Sit is one syllable and ends with one vowel letter followed by one consonant letter. Double the t before -ing.",
      "byAttempt": {
        "siting": "You kept sit and the ending. Add another t before -ing: sit + t + ing."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "sit",
      "suffix": "ing",
      "operation": "double",
      "letter": "t"
    }
  },
  "flipping": {
    "word": "flipping",
    "role": "unit",
    "title": "flip + ing = flipping",
    "tip": "Flip is one syllable and ends with one vowel letter followed by one consonant letter. Double the p before -ing.",
    "steps": [
      {
        "text": "Start with flip.",
        "pieces": [
          {
            "t": "flip",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Double the final p.",
        "pieces": [
          {
            "t": "flip",
            "kind": "base"
          },
          {
            "t": "p",
            "kind": "change"
          }
        ]
      },
      {
        "text": "Add -ing.",
        "pieces": [
          {
            "t": "flip",
            "kind": "base"
          },
          {
            "t": "p",
            "kind": "change"
          },
          {
            "t": "ing",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Flip is one syllable and ends with one vowel letter followed by one consonant letter. Double the p before -ing."
    ],
    "feedback": {
      "correct": "You doubled the final p and added -ing.",
      "incorrect": "Flip is one syllable and ends with one vowel letter followed by one consonant letter. Double the p before -ing.",
      "byAttempt": {
        "fliping": "You kept flip and the ending. Add another p before -ing: flip + p + ing."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "flip",
      "suffix": "ing",
      "operation": "double",
      "letter": "p"
    }
  },
  "slipping": {
    "word": "slipping",
    "role": "unit",
    "title": "slip + ing = slipping",
    "tip": "Slip is one syllable and ends with one vowel letter followed by one consonant letter. Double the p before -ing.",
    "steps": [
      {
        "text": "Start with slip.",
        "pieces": [
          {
            "t": "slip",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Double the final p.",
        "pieces": [
          {
            "t": "slip",
            "kind": "base"
          },
          {
            "t": "p",
            "kind": "change"
          }
        ]
      },
      {
        "text": "Add -ing.",
        "pieces": [
          {
            "t": "slip",
            "kind": "base"
          },
          {
            "t": "p",
            "kind": "change"
          },
          {
            "t": "ing",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Slip is one syllable and ends with one vowel letter followed by one consonant letter. Double the p before -ing."
    ],
    "feedback": {
      "correct": "You doubled the final p and added -ing.",
      "incorrect": "Slip is one syllable and ends with one vowel letter followed by one consonant letter. Double the p before -ing.",
      "byAttempt": {
        "sliping": "You kept slip and the ending. Add another p before -ing: slip + p + ing."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "slip",
      "suffix": "ing",
      "operation": "double",
      "letter": "p"
    }
  },
  "dropped": {
    "word": "dropped",
    "role": "unit",
    "title": "drop + ed = dropped",
    "tip": "Drop is one syllable and ends with one vowel letter followed by one consonant letter. Double the p before -ed. The ending sounds like /t/, but it is spelled -ed.",
    "steps": [
      {
        "text": "Start with drop.",
        "pieces": [
          {
            "t": "drop",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Double the final p.",
        "pieces": [
          {
            "t": "drop",
            "kind": "base"
          },
          {
            "t": "p",
            "kind": "change"
          }
        ]
      },
      {
        "text": "Add -ed. Keep -ed even when it sounds like /t/.",
        "pieces": [
          {
            "t": "drop",
            "kind": "base"
          },
          {
            "t": "p",
            "kind": "change"
          },
          {
            "t": "ed",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Drop is one syllable and ends with one vowel letter followed by one consonant letter. Double the p before -ed."
    ],
    "feedback": {
      "correct": "You doubled the final p and added -ed.",
      "incorrect": "Drop is one syllable and ends with one vowel letter followed by one consonant letter. Double the p before -ed. The ending sounds like /t/, but it is spelled -ed.",
      "byAttempt": {
        "droped": "You kept drop and the ending. Add another p before -ed: drop + p + ed.",
        "dropt": "The ending sounds like /t/, but use -ed. Double the final p too."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "drop",
      "suffix": "ed",
      "operation": "double",
      "letter": "p"
    }
  },
  "stopped": {
    "word": "stopped",
    "role": "unit",
    "title": "stop + ed = stopped",
    "tip": "Stop is one syllable and ends with one vowel letter followed by one consonant letter. Double the p before -ed. The ending sounds like /t/, but it is spelled -ed.",
    "steps": [
      {
        "text": "Start with stop.",
        "pieces": [
          {
            "t": "stop",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Double the final p.",
        "pieces": [
          {
            "t": "stop",
            "kind": "base"
          },
          {
            "t": "p",
            "kind": "change"
          }
        ]
      },
      {
        "text": "Add -ed. Keep -ed even when it sounds like /t/.",
        "pieces": [
          {
            "t": "stop",
            "kind": "base"
          },
          {
            "t": "p",
            "kind": "change"
          },
          {
            "t": "ed",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Stop is one syllable and ends with one vowel letter followed by one consonant letter. Double the p before -ed."
    ],
    "feedback": {
      "correct": "You doubled the final p and added -ed.",
      "incorrect": "Stop is one syllable and ends with one vowel letter followed by one consonant letter. Double the p before -ed. The ending sounds like /t/, but it is spelled -ed.",
      "byAttempt": {
        "stoped": "You kept stop and the ending. Add another p before -ed: stop + p + ed.",
        "stopt": "The ending sounds like /t/, but use -ed. Double the final p too."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "stop",
      "suffix": "ed",
      "operation": "double",
      "letter": "p"
    }
  },
  "rubbed": {
    "word": "rubbed",
    "role": "unit",
    "title": "rub + ed = rubbed",
    "tip": "Rub is one syllable and ends with one vowel letter followed by one consonant letter. Double the b before -ed. The ending sounds like /d/, but it is spelled -ed.",
    "steps": [
      {
        "text": "Start with rub.",
        "pieces": [
          {
            "t": "rub",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Double the final b.",
        "pieces": [
          {
            "t": "rub",
            "kind": "base"
          },
          {
            "t": "b",
            "kind": "change"
          }
        ]
      },
      {
        "text": "Add -ed. Keep -ed even when it sounds like /d/.",
        "pieces": [
          {
            "t": "rub",
            "kind": "base"
          },
          {
            "t": "b",
            "kind": "change"
          },
          {
            "t": "ed",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Rub is one syllable and ends with one vowel letter followed by one consonant letter. Double the b before -ed."
    ],
    "feedback": {
      "correct": "You doubled the final b and added -ed.",
      "incorrect": "Rub is one syllable and ends with one vowel letter followed by one consonant letter. Double the b before -ed. The ending sounds like /d/, but it is spelled -ed.",
      "byAttempt": {
        "rubed": "You kept rub and the ending. Add another b before -ed: rub + b + ed.",
        "rubd": "The ending sounds like /d/, but use -ed. Double the final b too."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "rub",
      "suffix": "ed",
      "operation": "double",
      "letter": "b"
    }
  },
  "grabbed": {
    "word": "grabbed",
    "role": "unit",
    "title": "grab + ed = grabbed",
    "tip": "Grab is one syllable and ends with one vowel letter followed by one consonant letter. Double the b before -ed. The ending sounds like /d/, but it is spelled -ed.",
    "steps": [
      {
        "text": "Start with grab.",
        "pieces": [
          {
            "t": "grab",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Double the final b.",
        "pieces": [
          {
            "t": "grab",
            "kind": "base"
          },
          {
            "t": "b",
            "kind": "change"
          }
        ]
      },
      {
        "text": "Add -ed. Keep -ed even when it sounds like /d/.",
        "pieces": [
          {
            "t": "grab",
            "kind": "base"
          },
          {
            "t": "b",
            "kind": "change"
          },
          {
            "t": "ed",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Grab is one syllable and ends with one vowel letter followed by one consonant letter. Double the b before -ed."
    ],
    "feedback": {
      "correct": "You doubled the final b and added -ed.",
      "incorrect": "Grab is one syllable and ends with one vowel letter followed by one consonant letter. Double the b before -ed. The ending sounds like /d/, but it is spelled -ed.",
      "byAttempt": {
        "grabed": "You kept grab and the ending. Add another b before -ed: grab + b + ed.",
        "grabd": "The ending sounds like /d/, but use -ed. Double the final b too."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "grab",
      "suffix": "ed",
      "operation": "double",
      "letter": "b"
    }
  },
  "helping": {
    "word": "helping",
    "role": "unit",
    "title": "help + ing = helping",
    "tip": "Help ends with two consonant letters, l and p. Keep help unchanged before -ing.",
    "steps": [
      {
        "text": "Start with help.",
        "pieces": [
          {
            "t": "help",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Keep the base unchanged.",
        "pieces": [
          {
            "t": "help",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Add -ing.",
        "pieces": [
          {
            "t": "help",
            "kind": "base"
          },
          {
            "t": "ing",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Help ends with two consonant letters, l and p. Keep help unchanged before -ing."
    ],
    "feedback": {
      "correct": "You kept help unchanged and added -ing.",
      "incorrect": "Help ends with two consonant letters, l and p. Keep help unchanged before -ing.",
      "byAttempt": {
        "helpping": "Keep the base help as it is. This word does not need an extra p."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "help",
      "suffix": "ing",
      "operation": "keep",
      "letter": null
    }
  },
  "cooled": {
    "word": "cooled",
    "role": "unit",
    "title": "cool + ed = cooled",
    "tip": "Cool has two vowel letters, oo. Keep cool unchanged before -ed. The ending sounds like /d/, but it is spelled -ed.",
    "steps": [
      {
        "text": "Start with cool.",
        "pieces": [
          {
            "t": "cool",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Keep the base unchanged.",
        "pieces": [
          {
            "t": "cool",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Add -ed. Keep -ed even when it sounds like /d/.",
        "pieces": [
          {
            "t": "cool",
            "kind": "base"
          },
          {
            "t": "ed",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Cool has two vowel letters, oo. Keep cool unchanged before -ed."
    ],
    "feedback": {
      "correct": "You kept cool unchanged and added -ed.",
      "incorrect": "Cool has two vowel letters, oo. Keep cool unchanged before -ed. The ending sounds like /d/, but it is spelled -ed.",
      "byAttempt": {
        "coolled": "Keep the base cool as it is. This word does not need an extra l."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "cool",
      "suffix": "ed",
      "operation": "keep",
      "letter": null
    }
  },
  "looking": {
    "word": "looking",
    "role": "unit",
    "title": "look + ing = looking",
    "tip": "Look has two vowel letters, oo. Keep look unchanged before -ing.",
    "steps": [
      {
        "text": "Start with look.",
        "pieces": [
          {
            "t": "look",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Keep the base unchanged.",
        "pieces": [
          {
            "t": "look",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Add -ing.",
        "pieces": [
          {
            "t": "look",
            "kind": "base"
          },
          {
            "t": "ing",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Look has two vowel letters, oo. Keep look unchanged before -ing."
    ],
    "feedback": {
      "correct": "You kept look unchanged and added -ing.",
      "incorrect": "Look has two vowel letters, oo. Keep look unchanged before -ing.",
      "byAttempt": {
        "lookking": "Keep the base look as it is. This word does not need an extra k."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "look",
      "suffix": "ing",
      "operation": "keep",
      "letter": null
    }
  },
  "called": {
    "word": "called",
    "role": "unit",
    "title": "call + ed = called",
    "tip": "Call already ends with two l letters. Keep call unchanged before -ed. The ending sounds like /d/, but it is spelled -ed.",
    "steps": [
      {
        "text": "Start with call.",
        "pieces": [
          {
            "t": "call",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Keep the base unchanged.",
        "pieces": [
          {
            "t": "call",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Add -ed. Keep -ed even when it sounds like /d/.",
        "pieces": [
          {
            "t": "call",
            "kind": "base"
          },
          {
            "t": "ed",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Call already ends with two l letters. Keep call unchanged before -ed."
    ],
    "feedback": {
      "correct": "You kept call unchanged and added -ed.",
      "incorrect": "Call already ends with two l letters. Keep call unchanged before -ed. The ending sounds like /d/, but it is spelled -ed.",
      "byAttempt": {
        "callled": "Keep the base call as it is. This word does not need an extra l."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "call",
      "suffix": "ed",
      "operation": "keep",
      "letter": null
    }
  },
  "jumped": {
    "word": "jumped",
    "role": "unit",
    "title": "jump + ed = jumped",
    "tip": "Jump ends with two consonant letters, m and p. Keep jump unchanged before -ed. The ending sounds like /t/, but it is spelled -ed.",
    "steps": [
      {
        "text": "Start with jump.",
        "pieces": [
          {
            "t": "jump",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Keep the base unchanged.",
        "pieces": [
          {
            "t": "jump",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Add -ed. Keep -ed even when it sounds like /t/.",
        "pieces": [
          {
            "t": "jump",
            "kind": "base"
          },
          {
            "t": "ed",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Jump ends with two consonant letters, m and p. Keep jump unchanged before -ed."
    ],
    "feedback": {
      "correct": "You kept jump unchanged and added -ed.",
      "incorrect": "Jump ends with two consonant letters, m and p. Keep jump unchanged before -ed. The ending sounds like /t/, but it is spelled -ed.",
      "byAttempt": {
        "jumpped": "Keep the base jump as it is. This word does not need an extra p."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "jump",
      "suffix": "ed",
      "operation": "keep",
      "letter": null
    }
  },
  "worked": {
    "word": "worked",
    "role": "unit",
    "title": "work + ed = worked",
    "tip": "Work ends with two consonant letters, r and k. Keep work unchanged before -ed. The ending sounds like /t/, but it is spelled -ed.",
    "steps": [
      {
        "text": "Start with work.",
        "pieces": [
          {
            "t": "work",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Keep the base unchanged.",
        "pieces": [
          {
            "t": "work",
            "kind": "base"
          }
        ]
      },
      {
        "text": "Add -ed. Keep -ed even when it sounds like /t/.",
        "pieces": [
          {
            "t": "work",
            "kind": "base"
          },
          {
            "t": "ed",
            "kind": "suffix"
          }
        ]
      }
    ],
    "hints": [
      "Work ends with two consonant letters, r and k. Keep work unchanged before -ed."
    ],
    "feedback": {
      "correct": "You kept work unchanged and added -ed.",
      "incorrect": "Work ends with two consonant letters, r and k. Keep work unchanged before -ed. The ending sounds like /t/, but it is spelled -ed.",
      "byAttempt": {
        "workked": "Keep the base work as it is. This word does not need an extra k."
      }
    },
    "scope": "This lesson covers these one-syllable examples. Longer words need a separate stress check; words ending in w, x, or y follow other conventions.",
    "related": [],
    "status": "reviewed-example",
    "build": {
      "base": "work",
      "suffix": "ed",
      "operation": "keep",
      "letter": null
    }
  }
});

export function lessonFor(entry) {
  return entry.lessonId ? LESSONS[entry.lessonId] ?? null : null;
}

// Interactive coaching decisions for the original examples.
for (const [word, base, suffix, letter] of [
  ['running', 'run', 'ing', 'n'], ['hopping', 'hop', 'ing', 'p'],
  ['planned', 'plan', 'ed', 'n'], ['clapped', 'clap', 'ed', 'p'],
]) LESSONS[word].build = { base, suffix, letter, operation: 'double' };

// The reason stays visible even when reading aloud is not used.
for (const lesson of Object.values(LESSONS)) {
  if (!lesson.build) continue;
  const { base, suffix, operation, letter } = lesson.build;
  lesson.reason = operation === 'double'
    ? `One syllable, ending in one vowel letter and one consonant letter. Before -${suffix}, double ${letter}.`
    : lesson.tip.split('. ')[0] + '. Keep the base unchanged.';
}
