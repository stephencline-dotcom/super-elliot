// Authored sound-to-spelling models. Blends keep separate sounds; digraphs share one box.
// Common US pronunciations; review models with an adult, particularly regional vowels.
const bases = {
  run: ['r','u','n'], hop: ['h','o','p'], swim: ['s','w','i','m'], sit: ['s','i','t'],
  flip: ['f','l','i','p'], slip: ['s','l','i','p'], plan: ['p','l','a','n'],
  clap: ['c','l','a','p'], drop: ['d','r','o','p'], stop: ['s','t','o','p'],
  rub: ['r','u','b'], grab: ['g','r','a','b'], help: ['h','e','l','p'],
  cool: ['c','oo','l'], look: ['l','oo','k'], call: ['c','a','ll'],
  jump: ['j','u','m','p'], work: ['w','or','k'],
};
const cues = {
  r: 'the first sound in red', h: 'the first sound in hat', n: 'the first sound in net',
  p: 'the first sound in pen', s: 'the first sound in sun', w: 'the first sound in wet',
  m: 'the first sound in man', t: 'the first sound in top', f: 'the first sound in fan',
  l: 'the first sound in lip', c: 'the first sound in cat', d: 'the first sound in dog',
  b: 'the first sound in bat', g: 'the first sound in gum', j: 'the first sound in jet',
  k: 'the first sound in kit', ll: 'the first sound in lip',
  u: 'the middle sound in cup', o: 'the middle sound in hop', i: 'the middle sound in pin',
  a: 'the middle sound in cat', e: 'the middle sound in bed', or: 'the middle sound in bird',
};
export function soundModel(lesson) {
  const b = lesson?.build, groups = bases[b?.base];
  if (!groups) return null;
  const suffixGroups = b.suffix === 'ing' ? ['i','ng'] : ['ed'];
  const endingSound = b.suffix === 'ing' ? 'two sounds: the vowel in pin, then the final sound in sing'
    : ['clap','drop','stop','jump','work'].includes(b.base) ? 'one sound: /t/' : 'one sound: /d/';
  const fullGroups = [...groups];
  if (b.operation === 'double') fullGroups[fullGroups.length - 1] += b.letter;
  return { ...b, groups: [...groups], cues: groups.map(group => group === 'oo' ? `the middle sound in ${b.base === 'cool' ? 'moon' : 'book'}` : b.base === 'call' && group === 'a' ? 'the vowel sound in your pronunciation of call' : cues[group]), suffixGroups, fullGroups: [...fullGroups,...suffixGroups], endingSound,
    note: b.base === 'work' ? 'In this American English model, or represents the r-controlled vowel sound.'
      : ['cool','look'].includes(b.base) ? `The two letters oo spell one vowel sound in ${b.base}. Oo sounds different in cool and look.`
      : b.base === 'call' ? 'The two letters ll spell one /l/ sound. Keep both letters when adding -ed.'
      : 'Count speech sounds, not letters. A consonant blend keeps its separate sounds.' };
}
export function checkSoundMap(expected, typed) {
  return expected.map((group, i) => String(typed[i] ?? '').trim().toLowerCase() === group);
}
