import { CATALOG, courseForWord } from './data/catalog.js';
import { EXTRA_PRACTICE } from './data/extra.js';

export function taughtCourses(progress) {
  return CATALOG.filter(l=>l.available && progress.attempts.some(a=>
    l.words.includes(a.word) && (a.originLessonId===l.id || a.currentLessonId===l.id || a.modelUsed)));
}
export function quickQueue(progress,today) {
  const courses=taughtCourses(progress),allowed=new Set(courses.map(l=>l.id));
  const last=new Map();progress.attempts.forEach((a,index)=>last.set(a.word,{...a,index}));
  const known=[...last.keys()].filter(w=>allowed.has(courseForWord(w)?.id));
  const priority=w=>progress.words[w]?.needsInstruction || !last.get(w).correct ? 0 : progress.words[w]?.dueDate<=today ? 1 : 2;
  const ordered=[...known].sort((a,b)=>priority(a)-priority(b)||last.get(a).index-last.get(b).index);
  const picked=ordered.slice(0,Math.min(2,ordered.length));
  const confidence=[...known].filter(w=>last.get(w).correct).sort((a,b)=>last.get(a).index-last.get(b).index).find(w=>!picked.includes(w));
  if(confidence) picked.push(confidence);
  for(const w of ordered) if(picked.length<4 && !picked.includes(w)) picked.push(w);
  const recent=progress.attempts.filter(a=>a.attemptType==='first' && known.includes(a.word)).slice(-5);
  const struggling=recent.filter(a=>!a.correct).length>=2;
  // Add only an authored application of a taught rule; never invent an unrelated word.
  const applications=courses.flatMap(l=>(EXTRA_PRACTICE[l.id]?.entries ?? []).map(e=>e.word)).filter(w=>!last.has(w));
  if(picked.length===4 && !struggling && applications.length) picked.push(applications[0]);
  else for(const w of ordered) if(picked.length<5 && !picked.includes(w)) picked.push(w);
  return picked.map(word=>({word,fresh:!last.has(word)}));
}
