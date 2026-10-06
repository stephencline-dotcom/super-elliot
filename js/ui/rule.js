import { h } from './dom.js';
import { RULES } from '../data/rules.js';

export function ruleSpotlight(course, {example = true, recap = false, onRead = null} = {}) {
  const rule = RULES[course?.id];
  if(!rule) return null;
  return h('section',{class:`rule-spotlight${recap ? ' rule-recap' : ''}`,'aria-label':recap ? 'Rule to remember' : 'Today’s spelling rule'},
    h('p',{class:'rule-label'},recap ? 'TAKE THIS RULE WITH YOU' : 'TODAY’S RULE'),
    h('h2',null,rule.title),h('p',{class:'rule-idea'},rule.idea),
    h('div',{class:'rule-checks'},rule.checks.map(c=>h('span',null,c))),
    example ? h('p',{class:'rule-example'},rule.example.map(part=>h('span',null,part))) : null,
    onRead ? h('button',{class:'btn rule-read',type:'button',onClick:onRead},'Read rule') : null,
    h('details',{class:'rule-details'},h('summary',null,'When does this rule apply?'),h('p',null,rule.boundary)));
}

export function actionCue(text) {
  return h('p',{class:'action-cue',role:'status'},h('span',{'aria-hidden':'true'},'➜'),h('strong',null,text));
}
