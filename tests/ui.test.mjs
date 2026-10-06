// Lightweight DOM integration tests. These do not replace real-browser layout/audio checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress, validateProgress } from '../js/storage.js';
import { CATALOG } from '../js/data/catalog.js';
import { DEFAULT_SETTINGS } from '../js/constants.js';
import { renderPractice } from '../js/ui/practice.js';
import { soundModel } from '../js/data/sounds.js';
import { LESSONS } from '../js/data/lessons.js';
import { renderResults } from '../js/ui/results.js';
import { renderLessons } from '../js/ui/lessons.js';
class Element {
  constructor(tag = '') { this.tagName=tag;this.attrs={};this.children=[];this.events={};this.value=''; }
  setAttribute(k,v) { this.attrs[k]=String(v); }
  getAttribute(k) { return this.attrs[k]??null; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(k,v) { this.events[k]=v; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children=items.map(c=>c instanceof Element ? c : String(c)); }
  focus() {}
  get textContent() { return this.children.map(c=>c instanceof Element ? c.textContent : String(c)).join(' '); }
  set textContent(v) { this.children=[String(v)]; }
  get all() { return [this,...this.children.filter(c=>c instanceof Element).flatMap(c=>c.all)]; }
  querySelector(s) {
    return this.all.find(e=>s==='[data-autofocus]' ? 'data-autofocus' in e.attrs
      : s.startsWith('.') ? (e.className??'').split(' ').includes(s.slice(1)) : e.tagName===s)??null;
  }
}
globalThis.Node=Element;
globalThis.document={createElement:t=>new Element(t),createTextNode:t=>String(t),getElementById:()=>null};
function fixture() {
  let id=0;const speech=[];const navigation=[];
  return {progress:emptyProgress(),today:'2026-10-05',settings:{...DEFAULT_SETTINGS,narration:true},
    newId:p=>`${p}${id++}`,persist(){assert.ok(validateProgress(this.progress).ok);},
    audio:{speak:t=>speech.push(t),unlock(){},stopSpeech(){},speechAllowed:()=>true,sfx(){}},
    go:(...x)=>navigation.push(x),speech,navigation};
}
function button(root,text) {
  const b=root.all.find(e=>e.tagName==='button'&&e.textContent===text);assert.ok(b,text);return b;
}
function click(root,text) {button(root,text).events.click();}
function submit(root,value) {root.querySelector('input').value=value;root.querySelector('form').events.submit({preventDefault(){}});}
function intro(root) { click(root,'See examples');click(root,'Next example');click(root,'Build with the coach'); }
function practice(c,lessonId) {const root=renderPractice(c,{lessonId});if(root.querySelector('.lesson-intro')) intro(root);return root;}
function fillMap(root,values) {root.all.filter(e=>e.tagName==='input').forEach((input,i)=>input.value=values[i]);root.querySelector('form').events.submit({preventDefault(){}});}
function build(root,c) {
 click(root,'Hear base word');const base=c.speech.at(-1);
 const model=soundModel(Object.values(LESSONS).find(l=>l.build?.base===base));
 for(let i=0;i<model.groups.length;i++) click(root,'Tap one sound');
 click(root,'Check sound count');click(root,'Map the sounds');fillMap(root,model.groups);
 click(root,'Build the ending');click(root,model.operation==='double'?'Double the final consonant':'Keep the base unchanged');click(root,'Spell with the model hidden');
}
function finishWords(root,c) {
 let guard=0;
 while(!root.querySelector('.sentence-check')) {
  if(root.querySelector('.sound-routine')) build(root,c);
  if(root.querySelector('.coach')) {click(root,'Keep the base unchanged');click(root,'Try spelling');}
  const before=c.speech.length;click(root,'Hear Word and Sentence');const word=c.speech.at(-1)[0];
  assert.ok(!root.textContent.includes(word));submit(root,word);
  const next=root.all.find(e=>e.tagName==='button'&&['Next word','Use it in a sentence'].includes(e.textContent));assert.ok(next);next.events.click();
  assert.equal(c.speech.length,before+1,'transitions do not narrate');assert.ok(++guard<20);
 }
}

test('catalog renders active/coming lessons and opens the selected lesson',()=>{
 const c=fixture(),root=renderLessons(c);assert.ok(root.textContent.includes('Coming soon'));
 assert.equal(root.all.filter(e=>e.tagName==='article').length,CATALOG.length);click(root,'Continue lesson');assert.deepEqual(c.navigation[0],['practice',{lessonId:'doubling-ing'}]);
});

test('new lesson flows from pattern and two examples into sounds without automatic speech',()=>{
 for(const lessonId of ['doubling-ing','doubling-ed','doubling-contrast']) {
  const c=fixture(),root=renderPractice(c,{lessonId});assert.ok(root.querySelector('.lesson-intro'));
  assert.ok(root.querySelector('.lesson-flow').textContent.includes('Learn'));assert.equal(c.speech.length,0);
  click(root,'See examples');assert.ok(root.textContent.includes('Worked example 1 of 2'));
  click(root,'Next example');assert.ok(root.textContent.includes('Worked example 2 of 2'));
  click(root,'Build with the coach');assert.ok(root.querySelector('.sound-routine'));assert.equal(c.speech.length,0);
  assert.equal(c.progress.attempts.length,0);assert.ok(!root.textContent.includes('null'));
 }
});

test('sound flow updates Build and Try stages and hides the model before spelling',()=>{
 const c=fixture(),root=practice(c,'doubling-ing');
 const stage=()=>root.querySelector('.lesson-flow').all.find(e=>e.attrs['aria-current']==='step').textContent;
 assert.ok(stage().includes('Build'));click(root,'Hear base word');assert.equal(c.speech.at(-1),'run');
 click(root,'Tap one sound');click(root,'Check sound count');assert.equal(c.progress.activities.at(-1).correct,false);
 click(root,'Reset taps');for(let i=0;i<3;i++) click(root,'Tap one sound');click(root,'Check sound count');click(root,'Map the sounds');
 fillMap(root,['r','o','n']);assert.ok(root.textContent.includes('box 2'));assert.ok(root.textContent.includes('Model: u'));
 fillMap(root,['r','u','n']);click(root,'Build the ending');assert.ok(stage().includes('Try'));
 click(root,'Keep the base unchanged');assert.equal(c.progress.activities.at(-1).correct,false);
 click(root,'Double the final consonant');assert.ok(root.textContent.includes('ONE consonant sound'));
 assert.ok(root.textContent.includes('ng spells one sound'));assert.ok(root.textContent.includes('Together: running'));
 const before=c.speech.length;click(root,'Spell with the model hidden');assert.equal(c.speech.length,before);
 assert.ok(!root.textContent.includes('running'));assert.ok(root.all.every(e=>!Object.values(e.attrs).some(v=>v.includes('running'))));
 submit(root,'running');assert.equal(c.progress.attempts.at(-1).modelUsed,true);
 assert.equal(c.progress.sessions[0].results.at(-1).outcome,'supported');assert.ok(validateProgress(c.progress).ok);
});

test('full first session automatically teaches new core words, keeps transfer checks independent, then offers one sentence',()=>{
 const c=fixture(),root=practice(c,'doubling-ing');finishWords(root,c);
 assert.ok(c.progress.attempts.some(a=>a.lessonContext==='transfer'&&!a.modelUsed));
 assert.ok(c.progress.attempts.filter(a=>a.lessonContext==='core'&&a.reviewKind==='first-exposure'&&a.attemptType==='first').every(a=>a.modelUsed));
 const stage=root.querySelector('.lesson-flow').all.find(e=>e.attrs['aria-current']==='step');assert.ok(stage.textContent.includes('Use'));
 assert.ok(!root.textContent.includes('She is running to first base.'));assert.ok(!root.textContent.includes('null'));
 click(root,'Hear Sentence');submit(root,c.speech.at(-1));assert.equal(c.progress.activities.at(-1).kind,'sentence');
 assert.equal(c.progress.activities.at(-1).checks[0].originLessonId,'doubling-ing');
 click(root,'See results');assert.equal(c.navigation[0][0],'results');
 assert.equal(c.progress.points.ledger.filter(e=>e.kind==='sentence-practice').length,1);
 assert.equal(c.progress.points.ledger.find(e=>e.kind==='sentence-practice').points,1);
});

test('returning lesson starts with a previously attempted word, hidden and without coaching',()=>{
 const c=fixture(),first=practice(c,'doubling-ing');build(first,c);submit(first,'running');click(first,'Finish for today');
 c.today='2026-10-06';const root=renderPractice(c,{lessonId:'doubling-ing'});
 assert.ok(root.querySelector('.batting'));assert.ok(!root.querySelector('.lesson-intro'));assert.ok(!root.textContent.includes('running'));
 click(root,'Hear Word and Sentence');assert.equal(c.speech.at(-1)[0],'running');submit(root,'running');
 const a=c.progress.attempts.at(-1);assert.equal(a.reviewKind,'later-session');assert.equal(a.modelUsed,false);
 click(root,'Next word');assert.ok(root.querySelector('.sound-routine'),'unseen core word gets teaching');
});

test('miss automatically routes through hint and sound building to a bounded hidden retry',()=>{
 const c=fixture(),first=practice(c,'doubling-ing');build(first,c);submit(first,'running');click(first,'Finish for today');
 c.today='2026-10-06';const root=renderPractice(c,{lessonId:'doubling-ing'});
 submit(root,'runing');click(root,'Try with a hint');assert.ok(root.querySelector('.phase-hint'));assert.ok(!root.textContent.includes('running'));
 submit(root,'runing');click(root,'Build with the coach');assert.ok(root.querySelector('.sound-routine'));
 build(root,c);assert.ok(root.querySelector('.phase-final'));assert.ok(!root.textContent.includes('running'));
 submit(root,'runing');assert.equal(c.progress.sessions.at(-1).results.at(-1).outcome,'moved-on');
 assert.ok(button(root,'Next word'));assert.ok(validateProgress(c.progress).ok);
});

test('coaching fallback offers specific choice feedback without replaying the model',()=>{
 const c=fixture(),root=practice(c,'doubling-ing');click(root,'Use the coach’s example instead');
 const builder=root.querySelector('.builder'),coach=root.querySelector('.coach');click(root,'Keep the base unchanged');
 assert.equal(root.querySelector('.builder'),builder);assert.equal(root.querySelector('.coach'),coach);
 assert.ok(root.textContent.includes('TRY AGAIN — PICK ONE'));assert.ok(root.textContent.includes('miss the extra n'));
 click(root,'Double the final consonant');assert.ok(root.textContent.includes('CORRECT — TRY SPELLING'));
 assert.equal(root.querySelector('.practice-ready').getAttribute('disabled'),null);click(root,'Try spelling');
 assert.ok(!root.textContent.includes('running'));assert.equal(c.speech.length,0);
});

test('contrast routine teaches the keep decision',()=>{
 const c=fixture(),root=practice(c,'doubling-contrast');build(root,c);submit(root,'helping');
 const a=c.progress.activities.find(x=>x.kind==='sound-ending');assert.equal(a.typed,'keep');assert.equal(a.correct,true);
 assert.equal(c.progress.attempts.at(-1).modelUsed,true);
});

test('reviewing the pattern returns to the current coach and does not restart the session',()=>{
 const c=fixture(),root=practice(c,'doubling-ing');click(root,'Use the coach’s example instead');
 const id=c.progress.sessions[0].id;click(root,'Review the pattern');assert.ok(root.querySelector('.lesson-intro'));intro(root);
 assert.ok(root.querySelector('.coach'));assert.equal(c.progress.sessions.length,1);assert.equal(c.progress.sessions[0].id,id);
 assert.equal(c.speech.length,0);
});

test('results give a plain summary and Done for today, keeping reporting in the progress view',()=>{
 const c=fixture(),root=practice(c,'doubling-ing');finishWords(root,c);click(root,'Skip sentence check');
 const sessionId=c.navigation[0][1].sessionId,results=renderResults(c,{sessionId});
 assert.ok(results.textContent.includes('You’re done for today!'));assert.ok(results.textContent.includes('What happens next?'));
 assert.ok(!results.textContent.includes('later-session review'));assert.ok(!results.textContent.includes('same-session recheck'));
 click(results,'Done for today');assert.deepEqual(c.navigation.at(-1),['home']);
 click(results,'View progress');assert.deepEqual(c.navigation.at(-1),['parent']);
});

test('finish remains available during teaching and does not invent completed spelling evidence',()=>{
 const c=fixture(),root=renderPractice(c,{lessonId:'doubling-ed'});click(root,'Finish for today');
 assert.equal(c.progress.attempts.length,0);assert.equal(c.progress.sessions[0].completedWords,0);assert.equal(c.navigation[0][0],'home');
});


test('short returning sessions move beyond today’s correct words without replaying the introduction',()=>{
 const c=fixture();c.settings.sessionLength=2;
 const first=practice(c,'doubling-ing');build(first,c);submit(first,'running');click(first,'Finish for today');
 const next=renderPractice(c,{lessonId:'doubling-ing'});assert.ok(!next.querySelector('.lesson-intro'));
 click(next,'Hear base word');assert.equal(c.speech.at(-1),'hop');
});


test('six new words plus one sentence earn seven clear practice runs, including supported words',()=>{
 const c=fixture(),root=practice(c,'doubling-ing');finishWords(root,c);click(root,'Hear Sentence');submit(root,c.speech.at(-1));click(root,'See results');
 const sessionId=c.navigation[0][1].sessionId,results=renderResults(c,{sessionId});
 assert.equal(c.progress.points.ledger.length,7);assert.ok(c.progress.points.ledger.every(e=>e.points===1));
 assert.ok(results.textContent.includes('RUNS'));assert.ok(results.textContent.includes('1 run per completed word'));
 assert.ok(!results.textContent.includes('POINTS'));
});

test('Extra practice opens a separate silent session with new applications and familiar words, then a related sentence',()=>{
 const c=fixture(),regular=practice(c,'doubling-ing');finishWords(regular,c);click(regular,'Skip sentence check');
 const results=renderResults(c,{sessionId:c.navigation.at(-1)[1].sessionId});click(results,'Extra practice (optional)');
 assert.deepEqual(c.navigation.at(-1),['practice',{lessonId:'doubling-ing',mode:'extra'}]);
 const spoken=c.speech.length,extra=renderPractice(c,c.navigation.at(-1)[1]);
 assert.equal(c.speech.length,spoken);assert.ok(!extra.querySelector('.lesson-intro'));assert.ok(!extra.querySelector('.coach'));
 assert.ok(extra.textContent.includes('New word challenge'));assert.ok(extra.textContent.includes('Extra practice'));
 assert.ok(!extra.textContent.includes('padding'));finishWords(extra,c);
 const session=c.progress.sessions.at(-1);assert.equal(session.practiceMode,'extra');
 assert.equal(session.results.filter(r=>r.lessonContext==='extra-new').length,4);
 assert.equal(session.results.filter(r=>r.lessonContext==='extra-review').length,2);
 assert.ok(c.progress.attempts.filter(a=>a.sessionId===session.id).every(a=>!a.modelUsed));
 click(extra,'Hear Sentence');assert.ok(c.speech.at(-1).includes('padding'));assert.ok(c.speech.at(-1).includes('running'));
 submit(extra,c.speech.at(-1));click(extra,'See results');
 assert.ok(validateProgress(c.progress).ok);
 const more=renderPractice(c,{lessonId:'doubling-ing',mode:'extra'});click(more,'Hear Word and Sentence');
 assert.equal(c.speech.at(-1)[0],'shopping');
});

test('a new application can request authored coaching; shown models mark it supported and do not auto-narrate',()=>{
 const c=fixture(),extra=renderPractice(c,{lessonId:'doubling-ing',mode:'extra'});
 assert.equal(c.speech.length,0);click(extra,'Help me build this word');
 assert.ok(extra.querySelector('.coach'));assert.ok(extra.textContent.includes('pad + ing = padding'));assert.equal(c.speech.length,0);
 click(extra,'Double the final consonant');click(extra,'Try spelling');assert.ok(!extra.textContent.includes('padding'));
 submit(extra,'padding');const attempt=c.progress.attempts.at(-1),result=c.progress.sessions[0].results.at(-1);
 assert.equal(attempt.lessonContext,'extra-new');assert.equal(attempt.modelUsed,true);assert.equal(result.outcome,'supported');
 assert.equal(c.speech.length,0);assert.ok(validateProgress(c.progress).ok);
});

test('consonant-y extra practice has new words and a sentence stage even though its original lesson has no sentence',()=>{
 const c=fixture();c.settings.sessionLength=1;
 const extra=renderPractice(c,{lessonId:'consonant-y',mode:'extra'});
 click(extra,'Hear Word and Sentence');assert.equal(c.speech.at(-1)[0],'tries');submit(extra,'tries');
 // A single-word sentence is used until the older mixed target has been introduced.
 click(extra,'Use it in a sentence');click(extra,'Hear Sentence');assert.equal(c.speech.at(-1),'She tries to catch the ball.');
 click(extra,'Skip sentence check');assert.equal(c.navigation.at(-1)[0],'results');
 const next=renderPractice(c,{lessonId:'consonant-y',mode:'extra'});
 click(next,'Hear Word and Sentence');assert.equal(c.speech.at(-1)[0],'cries');submit(next,'cries');
 click(next,'Use it in a sentence');assert.ok(next.querySelector('.sentence-check'));
 click(next,'Hear Sentence');assert.equal(c.speech.at(-1),'The baby cries when the game ends.');
});

test('a missed extra word receives its own hint and building example, with a bounded supported hidden retry',()=>{
 const c=fixture(),extra=renderPractice(c,{lessonId:'doubling-ed',mode:'extra'});
 submit(extra,'bated');click(extra,'Try with a hint');assert.ok(extra.textContent.toLowerCase().includes('bat'));assert.ok(extra.textContent.includes('/id/'));
 submit(extra,'bated');click(extra,'Build with the coach');assert.ok(extra.querySelector('.coach'));
 click(extra,'Double the final consonant');click(extra,'Try spelling');assert.ok(!extra.textContent.includes('batted'));
 submit(extra,'batted');assert.equal(c.progress.sessions[0].results[0].outcome,'supported');
 assert.equal(c.progress.attempts.at(-1).originLessonId,'doubling-ed');assert.equal(c.progress.attempts.at(-1).stage,'final-try');
 assert.equal(c.speech.length,0);assert.ok(validateProgress(c.progress).ok);
});

test('all four lessons finish with a prominent scoped rule, before scores and optional details',()=>{
 for(const course of CATALOG.filter(l=>l.available)) {
  const c=fixture();c.progress.sessions.push({id:'end',date:c.today,lessonId:course.id,practiceMode:'lesson',results:[],plannedWords:1,completedWords:0});
  const root=renderResults(c,{sessionId:'end'}),recap=root.querySelector('.rule-recap');
  assert.ok(recap,course.id);assert.ok(recap.textContent.includes('TAKE THIS RULE WITH YOU'));assert.ok(recap.querySelector('h2'));
  assert.ok(recap.querySelector('.rule-example'));assert.ok(recap.querySelector('details'));
  assert.ok(root.children.indexOf(recap)<root.children.indexOf(root.querySelector('.scoreboard')));
  assert.ok(root.textContent.includes('Finished! Press Done for today.'));assert.equal(c.speech.length,0);
 }
});

test('spelling actions highlight optional hearing, then typing, then checking, without revealing an answer',()=>{
 const c=fixture(),root=renderPractice(c,{lessonId:'doubling-ing',mode:'extra'});
 const hear=button(root,'Hear Word and Sentence'),check=button(root,'Check my spelling'),input=root.querySelector('input');
 assert.ok(hear.className.includes('primary'));assert.equal(check.getAttribute('disabled'),'');
 assert.ok(root.querySelector('.action-cue').textContent.includes('First:'));
 click(root,'Hear Word and Sentence');assert.equal(c.speech.length,1);assert.ok(root.querySelector('.action-cue').textContent.includes('type the word'));
 assert.ok(!root.textContent.includes('padding'));input.value='padding';input.events.input({target:input});
 assert.equal(check.getAttribute('disabled'),null);assert.ok(!hear.className.includes('primary'));
 assert.ok(root.querySelector('.action-cue').textContent.includes('Check my spelling'));
 submit(root,'padding');assert.ok(root.querySelector('.action-cue').textContent.includes('Next word'));assert.equal(c.speech.length,1);
});

test('sentence actions advance from optional hearing to typing and checking',()=>{
 const c=fixture();c.settings.sessionLength=1;const root=renderPractice(c,{lessonId:'doubling-ed',mode:'extra'});
 submit(root,'batted');click(root,'Use it in a sentence');const check=button(root,'Check Sentence');
 assert.equal(check.getAttribute('disabled'),'');assert.ok(button(root,'Hear Sentence').className.includes('primary'));
 click(root,'Hear Sentence');assert.ok(root.querySelector('.action-cue').textContent.includes('type the sentence'));
 const input=root.querySelector('input');input.value=c.speech.at(-1);input.events.input({target:input});
 assert.equal(check.getAttribute('disabled'),null);assert.ok(root.querySelector('.action-cue').textContent.includes('Check Sentence'));
 submit(root,input.value);assert.ok(root.querySelector('.action-cue').textContent.includes('See results'));
});

test('consonant-y introduces its rule using examples that do not reveal the transfer target',()=>{
 const c=fixture(),root=renderPractice(c,{lessonId:'consonant-y'});assert.ok(root.querySelector('.rule-spotlight'));
 click(root,'See examples');assert.ok(root.textContent.includes('copy − y + i + es = copies'));
 click(root,'Next example');assert.ok(root.textContent.includes('hurry − y + i + es = hurries'));
 assert.ok(!root.textContent.includes('carries'));click(root,'Build with the coach');assert.ok(root.querySelector('.coach'));
 assert.equal(c.speech.length,0);assert.equal(c.progress.attempts.length,0);
});

test('the final rule can be read on request and never narrates automatically',()=>{
 const c=fixture();c.progress.sessions.push({id:'end',lessonId:'doubling-ed',results:[]});
 const root=renderResults(c,{sessionId:'end'});assert.equal(c.speech.length,0);
 click(root,'Read rule');assert.equal(c.speech.length,1);assert.ok(c.speech[0].includes('Double before -ed'));assert.ok(c.speech[0].includes('w, x, y'));
});
