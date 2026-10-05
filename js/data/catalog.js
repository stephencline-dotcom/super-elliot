// Three connected lessons in the first full unit. Preserve stable IDs for existing history.
export const CATALOG = [
  { id: 'doubling-ing', unit: 'Doubling and endings', number: 1, title: '1. Build short words with -ing',
    summary: 'Five dugout activities, four coached words, and two related spelling checks without a model.',
    words: ['running', 'hopping', 'swimming', 'sitting'], transfer: ['flipping', 'slipping'],
    links: ['doubling-ed', 'doubling-contrast'], available: true,
    sentences: [
      { text: 'She is running to first base.', targets: ['running'] },
      { text: 'He is sitting near the dugout.', targets: ['sitting'] },
      { text: 'She is flipping the card over.', targets: ['flipping'] },
    ] },
  { id: 'doubling-ed', unit: 'Doubling and endings', number: 2, title: '2. Build short words with -ed',
    summary: 'Five dugout activities compare -ed spellings; then practice four coached words and two related checks.',
    words: ['planned', 'clapped', 'dropped', 'stopped'], transfer: ['rubbed', 'grabbed'],
    links: ['doubling-ing', 'doubling-contrast'], available: true,
    sentences: [
      { text: 'He dropped the ball.', targets: ['dropped'] },
      { text: 'The crowd clapped for the team.', targets: ['clapped'] },
      { text: 'She grabbed her glove.', targets: ['grabbed'] },
    ] },
  { id: 'doubling-contrast', unit: 'Doubling and endings', number: 3, title: '3. Decide when to keep the base',
    summary: 'Five dugout activities explain when to keep the base. Earlier words return in mixed review.',
    words: ['helping', 'cooled', 'looking', 'called'], transfer: ['jumped', 'worked'],
    links: ['doubling-ing', 'doubling-ed'], available: true,
    sentences: [
      { text: 'The coach called the team.', targets: ['called'] },
      { text: 'She is helping while he is running.', targets: ['helping', 'running'] },
      { text: 'He dropped the ball and she jumped.', targets: ['dropped', 'jumped'] },
    ] },
  { id: 'consonant-y', unit: 'Next units', title: 'Change consonant + y', summary: 'Change y to i when forming these verbs with -es.', words: ['studies'], transfer: ['carries'], links: [], available: true },
  { id: 'vowel-spellings', title: 'Vowel spelling choices', words: ['complete', 'athlete', 'season'], transfer: [], links: [], available: false },
  { id: 'longer-endings', title: 'Endings in longer words', words: ['carried', 'admitted', 'beginning'], transfer: [], links: ['doubling-ing', 'doubling-ed', 'consonant-y'], available: false },
  { id: 'meaningful-parts', title: 'Meaningful word parts', words: ['rewrite', 'agreement', 'achievement', 'successful'], transfer: [], links: [], available: false },
  { id: 'long-word-structure', title: 'Build longer words', words: ['communication', 'significant', 'organization', 'approximately', 'preparation', 'environment', 'government', 'available', 'experience', 'opportunity'], transfer: [], links: [], available: false },
  { id: 'individual-features', title: 'Individual spelling features', words: ['beautiful', 'explode', 'storm', 'discover', 'tomorrow', 'necessary', 'knowledge'], transfer: [], links: [], available: false },
];
export const courseForWord = (word) => CATALOG.find((l) => [...l.words, ...l.transfer].includes(word)) ?? null;
