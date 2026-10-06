import { h, replaceContent, focusSoon } from './dom.js';
import { RULES } from '../data/rules.js';
import { ruleSpotlight, actionCue } from './rule.js';
import { WARMUPS } from '../data/warmups.js';
export function lessonFlow(active) {
  const stages=['Learn','Build','Try','Use','Finish'];
  return h('nav',{class:'lesson-flow','aria-label':'Lesson steps'},
    h('ol',null,stages.map((stage,i)=>h('li',{class:stage===active?'current':'','aria-current':stage===active?'step':null},
      h('span',{class:'flow-number','aria-hidden':'true'},i+1),stage))));
}
export function renderLessonIntro(ctx, course, done) {
  const examples=WARMUPS[course.id]?.filter(s=>s.kind==='example') ?? RULES[course.id].examples;
  const root=h('div',{class:'card lesson-intro'});let step=0;
  const pattern=RULES[course.id].idea;
  function draw() {
    const example=examples[step-1];
    replaceContent(root,
      h('p',{class:'eyebrow'},'Learn the pattern'),
      h('h2',null,step===0?'Here is today’s spelling play':`Worked example ${step} of ${examples.length}`),
      step===0 ? ruleSpotlight(course,{example:false})
      : h('div',{class:'worked-example'},h('p',{class:'example-equation'},course.id==='consonant-y' ? `${example.base} − y + i + es = ${example.result}` : `${example.base}${example.result === example.base + example.ending ? '' : ` + ${example.base.slice(-1)}`} + ${example.ending} = ${example.result}`),h('p',{class:'lead'},example.why)),
      actionCue(step===0?'Start with two examples.':step===examples.length?'Your turn: build with the coach.':'Next: see one more example.'),
      h('div',{class:'row'},
        h('button',{class:'btn',type:'button',onClick:()=>{ctx.audio.unlock();ctx.audio.speak(example ? `${example.base}, ${example.result}. ${example.why}` : pattern);}},'Read Aloud'),
        h('button',{class:'btn primary',type:'button','data-autofocus':true,onClick:()=>{
          ctx.audio.stopSpeech();if(step===examples.length) return done();step++;draw();
        }},step===0?'See examples':step===examples.length?'Build with the coach':'Next example')));
    focusSoon(root.querySelector('[data-autofocus]'));
  }
  draw();return root;
}
