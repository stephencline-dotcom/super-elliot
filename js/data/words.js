// Word bank. `sentence` uses {word} as the slot; the visible sentence shows a blank, speech says the word.
// `accepted` lists extra spellings that count as correct. `lessonId` links to data/lessons.js.
// Words without a lessonId are "instruction pending": no explanation has been written for them yet.
import { EXTRA_WORDS } from './extra.js';
export const WORDS = [
  { word: 'running', sentence: 'The batter is {word} toward first base.', accepted: [], lessonId: 'running' },
  { word: 'planned', sentence: 'The coach {word} the practice schedule.', accepted: [], lessonId: 'planned' },
  { word: 'studies', sentence: 'She {word} the scouting report before each game.', accepted: [], lessonId: 'studies' },
  { word: 'hopping', sentence: 'A rabbit was {word} near the dugout.', accepted: [], lessonId: 'hopping' },
  { word: 'clapped', sentence: 'The crowd {word} for the home run.', accepted: [], lessonId: 'clapped' },
  { word: 'carries', sentence: 'Everyone watches as she {word} the trophy.', accepted: [], lessonId: 'carries' },

  { word: 'beautiful', sentence: 'The ballpark looks {word} under the lights.', accepted: [] },
  { word: 'complete', sentence: 'The team played a {word} game.', accepted: [] },
  { word: 'explode', sentence: 'Fireworks {word} over the stadium after a win.', accepted: [] },
  { word: 'athlete', sentence: 'Every {word} on the field warmed up first.', accepted: [] },
  { word: 'storm', sentence: 'A {word} delayed the game for an hour.', accepted: [] },
  { word: 'communication', sentence: 'Good {word} helps the catcher and pitcher.', accepted: [] },
  { word: 'significant', sentence: 'That was a {word} win for the team.', accepted: [] },
  { word: 'organization', sentence: 'The team is a well run {word}.', accepted: ['organisation'] },
  { word: 'approximately', sentence: 'The stadium holds {word} forty thousand fans.', accepted: [] },
  { word: 'achievement', sentence: 'Winning the pennant is a big {word}.', accepted: [] },
  { word: 'season', sentence: 'The baseball {word} starts in spring.', accepted: [] },
  { word: 'carried', sentence: 'She {word} the bat bag to the dugout.', accepted: [] },
  { word: 'admitted', sentence: 'He {word} that he missed the sign.', accepted: [] },
  { word: 'beginning', sentence: 'It is the {word} of the first inning.', accepted: [] },
  { word: 'discover', sentence: 'Players {word} new skills at practice.', accepted: [] },
  { word: 'tomorrow', sentence: 'The next home game is {word}.', accepted: [] },
  { word: 'rewrite', sentence: 'Coach asked us to {word} the lineup card.', accepted: [] },
  { word: 'agreement', sentence: 'The two teams reached an {word} about the schedule.', accepted: [] },
  { word: 'preparation', sentence: 'Good {word} helps players feel ready.', accepted: [] },
  { word: 'necessary', sentence: 'A helmet is {word} when batting.', accepted: [] },
  { word: 'environment', sentence: 'The stadium has a friendly {word}.', accepted: [] },
  { word: 'government', sentence: 'The city {word} helped fix the road to the park.', accepted: [] },
  { word: 'knowledge', sentence: 'A good coach shares {word} about the game.', accepted: [] },
  { word: 'available', sentence: 'Tickets are {word} at the gate.', accepted: [] },
  { word: 'experience', sentence: 'Each game gives players more {word}.', accepted: [] },
  { word: 'successful', sentence: 'It was a {word} road trip.', accepted: [] },
  { word: 'opportunity', sentence: 'Every at-bat is an {word} to score.', accepted: [] },
  {"word": "swimming", "sentence": "The player is {word} after practice.", "accepted": [], "lessonId": "swimming"},
  {"word": "sitting", "sentence": "The catcher is {word} in the dugout.", "accepted": [], "lessonId": "sitting"},
  {"word": "flipping", "sentence": "She is {word} the lineup card over.", "accepted": [], "lessonId": "flipping"},
  {"word": "slipping", "sentence": "The runner is {word} on the wet grass.", "accepted": [], "lessonId": "slipping"},
  {"word": "dropped", "sentence": "He {word} the ball near first base.", "accepted": [], "lessonId": "dropped"},
  {"word": "stopped", "sentence": "The umpire {word} the game for rain.", "accepted": [], "lessonId": "stopped"},
  {"word": "rubbed", "sentence": "She {word} the dirt off the ball.", "accepted": [], "lessonId": "rubbed"},
  {"word": "grabbed", "sentence": "He {word} his glove and ran outside.", "accepted": [], "lessonId": "grabbed"},
  {"word": "helping", "sentence": "She is {word} the team prepare.", "accepted": [], "lessonId": "helping"},
  {"word": "cooled", "sentence": "The water {word} in the dugout.", "accepted": [], "lessonId": "cooled"},
  {"word": "looking", "sentence": "He is {word} for his baseball cap.", "accepted": [], "lessonId": "looking"},
  {"word": "called", "sentence": "The coach {word} the next batter.", "accepted": [], "lessonId": "called"},
  {"word": "jumped", "sentence": "The fans {word} when the team scored.", "accepted": [], "lessonId": "jumped"},
  {"word": "worked", "sentence": "The team {word} together at practice.", "accepted": [], "lessonId": "worked"},
  ...EXTRA_WORDS,
];

export const BLANK = '_____';

export function wordEntry(word) {
  return WORDS.find((w) => w.word === word) ?? null;
}

export function visibleSentence(entry) {
  return entry.sentence.replace('{word}', BLANK);
}

export function spokenSentence(entry) {
  return entry.sentence.replace('{word}', entry.word);
}

export function isCorrect(entry, typed) {
  const t = String(typed).normalize('NFC').trim().toLowerCase();
  return t === entry.word || entry.accepted.includes(t);
}
