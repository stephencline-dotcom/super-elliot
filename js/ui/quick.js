import { h, replaceContent, focusSoon } from './dom.js';
import { scoreboard, diffView } from './components.js';
import { actionCue } from './rule.js';
import { quickQueue } from '../quick.js';
import { wordEntry, spokenSentence } from '../data/words.js';
import { courseForWord } from '../data/catalog.js';
import { createRun, submitAttempt } from '../session.js';
import { awardPoints } from '../scoring.js';
import { updateWordRecord } from '../scheduler.js';

function field(hit,motion) {
  const el=h('div',{class:`quick-playfield${hit ? ' hit' : ''}`,'aria-hidden':'true'});
  el.innerHTML='<svg viewBox="0 0 600 190" xmlns="http://www.w3.org/2000/svg"><path d="M30 170 Q300 -100 570 170" fill="#164f3b" stroke="#92c7a1" stroke-width="3"/><path d="M230 130 L300 60 L370 130 L300 175 Z" fill="#ba8b54" stroke="#fff2cf" stroke-width="3"/><path d="M300 175 L100 50 M300 175 L500 50" stroke="#fff2cf" stroke-width="2"/><circle class="quick-ball" cx="300" cy="175" r="8" fill="white" stroke="#e81828" stroke-width="3"/><text x="300" y="28" text-anchor="middle" fill="#fff3c4" font-size="20">'+(hit ? 'BASE HIT!' : 'READY FOR YOUR SWING')+'</text></svg>';
  el.setAttribute('style',`--hit-x:${[-130,0,130][motion%3]}px;--hit-y:-120px`);
  return el;
}
export function renderQuick(ctx) {
  const root=h('section',{class:'quick-game'}),queue=quickQueue(ctx.progress,ctx.today);
  if(!queue.length) return h('section',{class:'card'},h('h1',null,'Quick Batting Practice'),h('p',null,'Practice a lesson first. Then your words can join the game.'),h('button',{class:'btn primary',type:'button',onClick:()=>ctx.go('lessons')},'Choose a Lesson'),h('button',{class:'btn',type:'button',onClick:()=>ctx.go('home')},'Home'));
  const session={id:ctx.newId('quick'),date:ctx.today,startedAt:new Date().toISOString(),endedAt:null,lessonId:null,practiceMode:'quick',plannedWords:queue.length,completedWords:0,results:[]};
  ctx.progress.sessions.push(session);ctx.persist();
  let pos=0,run,awards=[],heard=false;
  const runs=()=>ctx.progress.points.ledger.filter(e=>e.sessionId===session.id).reduce((n,e)=>n+e.points,0);
  function top() {return h('div',{class:'practice-top'},scoreboard({label:'Quick practice',items:[{label:'WORDS DONE',value:`${session.completedWords}/${queue.length}`},{label:'RUNS',value:runs()}]}),h('button',{class:'btn ghost',type:'button',onClick:finish},'Finish for today'));}
  function next() {
    if(pos>=queue.length) return finish();
    const q=queue[pos],course=courseForWord(q.word);
    run=createRun({entry:wordEntry(q.word),progress:ctx.progress,sessionId:session.id,recheck:false,skipLearn:true});
    if(!q.fresh && ctx.progress.attempts.some(a=>a.word===q.word && a.date===ctx.today)) run.reviewKind='same-day';
    run.currentLessonId=course.id;run.originLessonId=course.id;run.lessonContext=q.fresh?'quick-new':'quick-review';
    heard=false;awards=[];draw();
  }
  function complete() {
    awards=awardPoints(ctx.progress.points.ledger,{date:ctx.today,sessionId:session.id,word:run.entry.word,reviewKind:run.reviewKind});ctx.progress.points.ledger.push(...awards);
    ctx.progress.words[run.entry.word]=updateWordRecord(ctx.progress.words[run.entry.word],{outcome:run.outcome,reviewKind:run.reviewKind,today:ctx.today});
    session.results.push({word:run.entry.word,outcome:run.outcome,reviewKind:run.reviewKind,currentLessonId:run.currentLessonId,originLessonId:run.originLessonId,lessonContext:run.lessonContext});
    session.completedWords++;ctx.persist();
  }
  function finish() {
    ctx.audio.stopSpeech();session.endedAt=new Date().toISOString();ctx.persist();
    const alone=session.results.filter(r=>r.outcome==='independent').length;
    replaceContent(root,h('div',{class:'card quick-finish'},h('h1',null,'Round complete!'),
      field(session.completedWords>0 && ctx.settings.celebrations!==false,0),h('p',{class:'lead'},`You practiced ${session.completedWords} ${session.completedWords===1?'word':'words'}!`),
      h('p',null,`${alone} without help · ${session.completedWords-alone} with support · ${runs()} new runs`),
      actionCue('Play another round, or finish for today.'),h('div',{class:'row'},
        h('button',{class:'btn primary big',type:'button',onClick:()=>ctx.go('quick')},'Play another round'),
        h('button',{class:'btn',type:'button',onClick:()=>ctx.go('home')},'Done'),
        h('button',{class:'btn ghost',type:'button',onClick:()=>ctx.go('parent')},'My Progress'))));
    focusSoon(root.querySelector('button'));
  }
  function draw() {
    replaceContent(root,top(),h('div',{class:'card quick-round'},h('p',{class:'eyebrow'},'Quick Batting Practice'),field(run.last?.correct && ctx.settings.celebrations!==false,pos),
      run.view==='feedback' ? feedback() : inputView()));focusSoon(root.querySelector('[data-autofocus]'));
  }
  function inputView() {
    let check,hear;const canSpeak=ctx.audio.speechAllowed();
    const cue=actionCue(canSpeak&&!heard?'First: Hear word.':'Type the word. Then Swing!');
    const input=h('input',{class:'answer',type:'text','aria-label':'Type your spelling',spellcheck:'false',autocomplete:'off',autocorrect:'off',autocapitalize:'off',maxlength:40,'data-autofocus':!canSpeak||heard,
      onInput:()=>{const typed=!!input.value.trim();check.disabled=!typed;if(typed)check.removeAttribute('disabled');else check.setAttribute('disabled','');if(hear)hear.className=typed||heard?'btn':'btn primary';cue.replaceChildren(...actionCue(typed?'Next: Swing!':'Your turn: type the word.').children);}});
    return h('div',null,h('h2',null,run.lessonContext==='quick-new'?'New word, familiar rule':'Your turn'),
      run.phase==='final' ? h('p',{class:'note'},'The spelling is hidden. Try it once more.') : null,cue,
      canSpeak ? hear=h('button',{class:heard?'btn':'btn primary',type:'button','data-autofocus':!heard,onClick:()=>{ctx.audio.unlock();ctx.audio.speak([run.entry.word,spokenSentence(run.entry)]);heard=true;hear.className='btn';cue.replaceChildren(...actionCue('Your turn: type the word.').children);focusSoon(input);}},'Hear word') : h('p',{class:'note'},'Speech is off. Turn it on in Settings, or ask someone to read the word.'),
      h('form',{class:'answer-form',onSubmit:e=>{e.preventDefault();if(!input.value.trim())return;ctx.audio.stopSpeech();
        const a=submitAttempt(run,input.value,{id:ctx.newId('a'),sessionId:session.id,date:ctx.today});ctx.progress.attempts.push(a);
        // One supported hidden retry keeps this game brief and bounded.
        if(!a.correct && run.attemptCount===1) {run.nextPhase='final';run.hintUsed=true;}
        if(run.done) complete();ctx.persist();if(a.correct){ctx.audio.unlock();ctx.audio.sfx('batHit','chime');}draw();}},input,check=h('button',{class:'btn primary big',type:'submit',disabled:true},'Swing!')),
      run.phase==='try' ? h('button',{class:'btn ghost',type:'button',onClick:()=>{run.modelUsed=true;run.instructionShown=true;run.view='feedback';run.last={correct:false,typed:'',help:true};draw();}},'Show me a hint') : null);
  }
  function feedback() {
    return h('div',null,h('h2',null,run.last.correct?'Base hit!':run.done?'Keep practicing this one':'Let’s build it'),
      !run.last.correct ? h('div',null,diffView(run.entry.word,run.last.typed),h('p',{class:'quick-hint'},run.lesson?.build ? `${run.lesson.build.operation==='double' ? `Double the final ${run.lesson.build.letter}` : 'Keep the base unchanged'}, then add -${run.lesson.build.suffix}.` : run.originLessonId==='consonant-y' ? 'Change y to i, then add -es.' : `Look carefully at ${run.entry.word}.`)) : null,
      run.done ? h('p',{class:'note'},awards.length?'+1 practice run.': 'Your run for this word was already counted today.') : null,
      actionCue(run.done ? pos+1<queue.length?'Next word.':'See your round.' : 'Read the spelling. Then try it with the answer hidden.'),
      h('button',{class:'btn primary big',type:'button','data-autofocus':true,onClick:()=>{ctx.audio.stopSpeech();if(run.done){pos++;next();}else{run.phase='final';run.nextPhase=null;run.view='input';run.modelUsed=true;run.correctionShown=true;draw();}}},run.done?pos+1<queue.length?'Next word':'See my round':'Try with the answer hidden'),
      !run.done ? h('button',{class:'btn ghost',type:'button',onClick:()=>{run.done=true;run.outcome='moved-on';complete();pos++;next();}},'Move on with support') : null);
  }
  next();return root;
}
