import { EXTRA_PRACTICE } from './data/extra.js';
import { CATALOG } from './data/catalog.js';

// Keep additional application practice separate from the required lesson queue.
export function extraQueue(course, progress, today, length = 6) {
  const pool = EXTRA_PRACTICE[course.id]?.entries.map(e => e.word) ?? [];
  const history = new Map();
  progress.attempts.forEach((a,index) => history.set(a.word,{...a,index}));
  const fresh = pool.filter(word => !history.has(word));
  const familiar = [...new Set([
    ...course.words,...course.transfer,...pool,
    ...CATALOG.filter(l => course.links.includes(l.id)).flatMap(l => [
      ...l.words,...l.transfer,...(EXTRA_PRACTICE[l.id]?.entries.map(e=>e.word) ?? []),
    ]),
  ])].filter(word => history.has(word));
  familiar.sort((a,b) => {
    const priority = word => {
      const last = history.get(word), record = progress.words[word];
      if(last.date === today && last.correct) return 3;
      if(record?.needsInstruction || !last.correct) return 0;
      if(record?.dueDate <= today) return 1;
      return 2;
    };
    return priority(a)-priority(b) || history.get(a).index-history.get(b).index;
  });
  const reserve = Math.min(familiar.length, Math.max(0,length-1), Math.max(1,Math.floor(length/3)));
  const picked = [...fresh.slice(0,length-reserve),...familiar.slice(0,reserve)];
  return [...new Set([...picked,...fresh.slice(length-reserve),...familiar.slice(reserve)])].slice(0,length);
}

export function extraSentencePool(course, progress, sessionId) {
  const completed = new Set(progress.sessions.find(s=>s.id===sessionId)?.results.map(r=>r.word) ?? []);
  const known = new Set(progress.attempts.map(a=>a.word));
  const pool = EXTRA_PRACTICE[course.id];
  const sentences = (pool?.sentences ?? []).map(s => {
    if(s.targets.every(w=>known.has(w))) return s;
    // Use the authored single-word sentence until the older mixed target is introduced.
    const entry=pool.entries.find(e=>e.word===s.targets[0]);
    return {text:entry.sentence.replace('{word}',entry.word),targets:[entry.word]};
  });
  return [...sentences,...(course.sentences ?? [])].filter(s =>
    s.targets.some(w=>completed.has(w)) && s.targets.every(w=>known.has(w))); 
}

export function chooseSentence(sentences, progress, lessonId) {
  const history = (progress.activities ?? []).filter(a=>a.kind==='sentence' && a.lessonId===lessonId && a.attemptType==='first');
  // Unused prompts first; then least recently attempted. Stable authored order breaks ties.
  return [...sentences].sort((a,b) => {
    const last = s => history.findLastIndex(h=>h.prompt===s.text);
    return last(a)-last(b);
  })[0];
}
