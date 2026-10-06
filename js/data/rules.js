// A concise teaching goal for each available lesson, including its limits.
export const RULES = {
  'doubling-ing': {
    title: 'Double before -ing',
    idea: 'For these short bases, double the last consonant. Then add -ing.',
    checks: ['1 syllable', '1 vowel letter', '1 final consonant', 'Not w, x, y'],
    example: ['run', '+ n', '+ ing', '= running'],
    boundary: 'This pattern does not cover every word. Final w, x, and y are not doubled. Longer words need a stress check.',
  },
  'doubling-ed': {
    title: 'Double before -ed',
    idea: 'For these short bases, double the last consonant. Then add -ed.',
    checks: ['1 syllable', '1 vowel letter', '1 final consonant', 'Not w, x, y'],
    example: ['plan', '+ n', '+ ed', '= planned'],
    boundary: 'Keep -ed even when it sounds like /t/ or /d/. Final w, x, and y are not doubled. Longer words need a stress check.',
  },
  'doubling-contrast': {
    title: 'Keep the base',
    idea: 'Two consonants at the end? Two vowel letters together? Keep the base. Add the ending.',
    checks: ['help → helping', 'cool → cooled', 'w, x, y → keep'],
    example: ['help', '+ ing', '= helping'],
    boundary: 'Final w, x, and y also stay as they are. These examples use one-syllable bases.',
  },
  'consonant-y': {
    examples: [
      {base:'copy',ending:'es',result:'copies',why:'Consonant p before y: change y to i, then add es.'},
      {base:'hurry',ending:'es',result:'hurries',why:'Consonant r before y: change y to i, then add es.'},
    ],
    title: 'Change y to i',
    idea: 'Consonant + y: change y to i, then add -es.',
    checks: ['Look before the y', 'Consonant → change y'],
    example: ['study', '− y', '+ i', '+ es', '= studies'],
    boundary: 'A vowel before y keeps the y: play → plays. This lesson practices verbs with -es.',
  },
};
