import { h } from './dom.js';
import { cardCollection } from './baseball.js';
import { scoreboard, pointList } from './components.js';
import { sessionSummary } from '../stats.js';
import { POINT_LABELS } from '../scoring.js';
import { RULES } from '../data/rules.js';
import { ruleSpotlight, actionCue } from './rule.js';
import { lessonFlow } from './flow.js';
import { CATALOG } from '../data/catalog.js';
import { lessonEvidence } from '../mastery.js';

export function renderResults(ctx, { sessionId }) {
  const sum=sessionSummary(ctx.progress,sessionId),results=sum.session?.results??[];
  const alone=[...new Set(results.filter(r=>r.outcome==='independent' && r.reviewKind!=='same-session').map(r=>r.word))];
  const supported=[...new Set(results.filter(r=>r.outcome!=='independent').map(r=>r.word))].filter(w=>!alone.includes(w));
  const course=CATALOG.find(l=>l.id===sum.session?.lessonId);
  const mastered=course && lessonEvidence(course,ctx.progress).mastered;
  return h('section',{class:'card results'},
    lessonFlow('Finish'),
    h('p',{class:'eyebrow'},'Practice finished'),h('h1',null,'You’re done for today!'),
    ruleSpotlight(course,{recap:true,onRead:()=>{const rule=RULES[course.id];ctx.audio.unlock();ctx.audio.speak(`${rule.title}. ${rule.idea} ${rule.checks.join('. ')}. ${rule.boundary}`);}}),
    scoreboard({label:'Your practice',items:[{label:'RUNS',value:sum.points},{label:'WITHOUT HELP',value:alone.length},{label:'WITH HELP',value:supported.length}]}),
        h('p',null,alone.length ? `You spelled ${alone.length} ${alone.length===1?'word':'words'} without help.` : 'You practiced with the coach. Keep growing!'),
    h('div',{class:'next-practice'},h('h2',null,'What happens next?'),h('p',null,mastered
      ? 'Goal reached! Next time, try the next lesson.'
      : 'Come back another day to try the rule from memory.')),
    actionCue('Finished! Press Done for today.'),
    h('div',{class:'row'},
      h('button',{class:'btn primary big',type:'button','data-autofocus':true,onClick:()=>ctx.go('home')},'Done for today'),
      h('button',{class:'btn',type:'button',onClick:()=>ctx.go('practice',{lessonId:sum.session?.lessonId,mode:'extra'})},'Extra practice (optional)'),
      h('button',{class:'btn ghost',type:'button',onClick:()=>ctx.go('parent')},'View progress')),
    h('details',null,h('summary',null,'Your words and rewards'),
      alone.length ? h('p',null,`Without help: ${alone.join(', ')}.`) : null,
      supported.length ? h('p',null,`Keep practicing: ${supported.join(', ')}.`) : null,
      sum.session?.practiceMode==='extra' ? h('p',null,'Extra practice results are saved in My Progress.') : null,
      h('p',{class:'run-guide'},'1 run per completed word and 1 for sentence practice, once per word or sentence each day. Rechecks do not add runs.'),
      cardCollection(ctx.progress)),
    h('details',null,h('summary',null,'Runs earned'),pointList(sum.ledger,POINT_LABELS)??h('p',null,'These words already earned their practice runs today. Your new spelling evidence is still saved.')));
}
