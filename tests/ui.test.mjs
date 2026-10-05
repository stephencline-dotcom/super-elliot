// Lightweight DOM integration tests. These do not replace real-browser layout/audio checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress, validateProgress } from '../js/storage.js';
import { CATALOG } from '../js/data/catalog.js';
import { DEFAULT_SETTINGS } from '../js/constants.js';
import { renderPractice } from '../js/ui/practice.js';
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
function practice(c, lessonId) { const root=renderPractice(c,{lessonId}); if(root.querySelector('.warmup')) click(root,'Skip warm-up'); return root; }
test('catalog renders active and coming lessons, and selection routes to the chosen lesson',()=>{
  const c=fixture(),root=renderLessons(c);
  assert.ok(root.textContent.includes('Coming soon'));
  assert.equal(root.all.filter(e=>e.tagName==='article').length,CATALOG.length);
  click(root,'Continue lesson');assert.deepEqual(c.navigation[0],['practice',{lessonId:'doubling-ing'}]);
});
test('lesson flow is silent until a reading button is clicked; build choices and coaching stay supported',()=>{
  const c=fixture(),root=practice(c,'doubling-ing');
  assert.equal(c.speech.length,0);assert.ok(root.querySelector('.coach'));
  click(root,'Read Aloud');assert.equal(c.speech.length,1);
  click(root,'Ready for batting practice');assert.ok(root.querySelector('.coach'),'decision is required');
  click(root,'Keep the base unchanged');assert.equal(c.progress.activities[0].correct,false);
  click(root,'Double the final consonant');assert.equal(c.progress.activities[1].correct,true);
  click(root,'Ready for batting practice');assert.equal(c.speech.length,1);
  assert.ok(!root.textContent.includes('running'));
  assert.ok(root.all.every(e=>!Object.values(e.attrs).some(v=>v.includes('running'))));
  click(root,'Hear Word and Sentence');assert.equal(c.speech.length,2);
  submit(root,'running');assert.equal(c.progress.attempts[0].modelUsed,true);
  assert.equal(c.progress.sessions[0].results[0].outcome,'supported');
  click(root,'Next batter');assert.equal(c.speech.length,2);
  click(root,'Finish for today');assert.equal(c.navigation[0][0],'results');
});
test('miss flows through hint, guided building, hidden retry and no automatic speech',()=>{
  const c=fixture(),root=practice(c,'doubling-ed');
  click(root,'Double the final consonant');click(root,'Ready for batting practice');
  submit(root,'pland');click(root,'Next Swing');
  submit(root,'pland');click(root,'Next Swing');assert.ok(root.querySelector('.phase-guided'));
  submit(root,'planned');click(root,'Next Swing');assert.ok(!root.textContent.includes('planned'));
  submit(root,'planned');assert.equal(c.speech.length,0);
  assert.equal(c.progress.sessions[0].results[0].outcome,'supported');
});
test('full expanded session reaches a silent sentence check; sentence evidence stays separate',()=>{
  const c=fixture(),root=practice(c,'doubling-ing');
  let words=0;
  while(!root.querySelector('.sentence-check')) {
    const before=c.speech.length;
    if(root.querySelector('.coach')) {
      click(root,'Double the final consonant');click(root,'Ready for batting practice');
    }
    assert.equal(c.speech.length,before,'no automatic speech on a screen transition');
    click(root,'Hear Word and Sentence');
    const word=c.speech.at(-1)[0];
    assert.ok(!root.textContent.includes(word));submit(root,word);
    const next=root.all.find(e=>e.tagName==='button'&&['Next batter','Try a game situation'].includes(e.textContent));
    assert.ok(next);next.events.click();assert.equal(c.speech.length,before+1);
    assert.ok(++words<20);
  }
  assert.ok(c.progress.attempts.some(a=>a.lessonContext==='transfer'&&!a.modelUsed));
  const before=c.speech.length;assert.ok(!root.textContent.includes('She is running to first base.'));
  click(root,'Hear Sentence');assert.equal(c.speech.length,before+1);
  submit(root,c.speech.at(-1));
  const a=c.progress.activities.at(-1);assert.equal(a.kind,'sentence');assert.equal(a.correct,true);
  assert.equal(a.checks[0].originLessonId,'doubling-ing');
  assert.equal(c.progress.points.ledger.filter(e=>e.kind==='sentence-practice').length,1);
  click(root,'See results');assert.equal(c.navigation[0][0],'results');
});
test('contrast coaching records a keep decision and targets the reason for no doubling',()=>{
  const c=fixture(),root=practice(c,'doubling-contrast');
  click(root,'Double the final consonant');assert.equal(c.progress.activities[0].correct,false);
  click(root,'Keep the base unchanged');assert.equal(c.progress.activities[1].correct,true);
  click(root,'Ready for batting practice');submit(root,'helpping');
  assert.ok(root.textContent.includes('Keep the base help as it is'));
  assert.equal(c.speech.length,0);
});

test('wrong and correct choices update only the action panel; the coaching builder is not replayed',()=>{
  const c=fixture(),root=practice(c,'doubling-ing');
  const builder=root.querySelector('.builder'),coach=root.querySelector('.coach');
  click(root,'Keep the base unchanged');
  assert.equal(root.querySelector('.builder'),builder);
  assert.equal(root.querySelector('.coach'),coach);
  assert.ok(root.textContent.includes('TRY AGAIN — PICK ONE'));
  assert.ok(root.querySelector('.build-decision').className.includes('retry-choice'));
  assert.ok(root.querySelector('.practice-ready').disabled);
  assert.ok(root.textContent.includes('Keeping the base unchanged would miss the extra n'));
  click(root,'Double the final consonant');
  assert.equal(root.querySelector('.builder'),builder);
  assert.ok(root.textContent.includes('CORRECT — READY TO PRACTICE'));
  assert.equal(root.querySelector('.practice-ready').disabled,false);
  assert.equal(root.querySelector('.practice-ready').getAttribute('disabled'),null);
  click(root,'Ready for batting practice');
  assert.ok(root.querySelector('.batting'));assert.equal(c.speech.length,0);
});


test('new dugout warm-up is silent, records decisions separately, and keeps transfer targets hidden',()=>{
  for (const lessonId of ['doubling-ing','doubling-ed','doubling-contrast']) {
    const c=fixture(), root=renderPractice(c,{lessonId});
    assert.ok(root.querySelector('.warmup')); assert.ok(!root.textContent.includes('null'));
    click(root,'Next play'); click(root,'Next play'); click(root,'Next play');
    const opposite='Double the final consonant';
    click(root,opposite); assert.ok(root.textContent.includes('TRY AGAIN — PICK ONE'));
    const first=c.progress.activities.at(-1);assert.equal(first.correct,false);assert.equal(first.modelUsed,false);
    click(root,'Keep the base unchanged'); click(root,'Next play');
    click(root,lessonId==='doubling-contrast'?'Keep the base unchanged':'Double the final consonant');
    click(root,'Start batting practice');
    assert.ok(root.querySelector('.coach')); assert.equal(c.progress.attempts.length,0);
    assert.equal(c.speech.length,0); assert.ok(!root.textContent.includes('null'));
    assert.equal(c.progress.points.ledger.length,0,'decision practice does not award mastery or word points');
    const exported=validateProgress(JSON.parse(JSON.stringify(c.progress)));assert.ok(exported.ok);
  }
});

test('completed warm-up stays optional in later sessions; word recall starts hidden and unsupported',()=>{
  const c=fixture();
  c.progress.activities.push({id:'warm',date:c.today,sessionId:'old',lessonId:'doubling-ing',kind:'build',word:'jogging',prompt:'Warm-up 2: jog + ing',typed:'double',correct:true,modelUsed:false,attemptType:'first',checks:[]});
  const first=renderPractice(c,{lessonId:'doubling-ing'});
  assert.ok(!first.querySelector('.warmup'));click(first,'Double the final consonant');click(first,'Ready for batting practice');submit(first,'running');
  click(first,'Finish for today');c.today='2026-10-06';
  const later=renderPractice(c,{lessonId:'doubling-ing'});
  // Newly unpracticed words can precede running. Complete them until running returns.
  let guard=0;
  while(true) {
    if(later.querySelector('.coach')) { click(later,'Double the final consonant');click(later,'Ready for batting practice'); }
    click(later,'Hear Word and Sentence'); const word=c.speech.at(-1)[0];
    assert.ok(!later.textContent.includes(word));submit(later,word);
    if(word==='running') break;
    click(later,'Next batter'); assert.ok(++guard<10);
  }
  const attempt=c.progress.attempts.at(-1);assert.equal(attempt.modelUsed,false);assert.equal(attempt.reviewKind,'later-session');
});

test('sentence screen omits empty sections instead of rendering null, and celebration has a clear label',()=>{
  const c=fixture(), root=practice(c,'doubling-ing');
  let guard=0;
  while(!root.querySelector('.sentence-check')) {
    if(root.querySelector('.coach')) {click(root,'Double the final consonant');click(root,'Ready for batting practice');}
    click(root,'Hear Word and Sentence');submit(root,c.speech.at(-1)[0]);
    assert.ok(root.textContent.includes('Practice play complete'));assert.ok(!root.querySelector('.star'));
    const next=root.all.find(e=>e.tagName==='button'&&['Next batter','Try a game situation'].includes(e.textContent));next.events.click();assert.ok(++guard<20);
  }
  assert.ok(!root.textContent.includes('null'));click(root,'Show sentence (uses support)');assert.ok(!root.textContent.includes('null'));
});

test('a viewed comparison marks its target supported, while unrelated later recall stays independent',()=>{
  const c=fixture(), initial=practice(c,'doubling-ing');
  for(const word of ['running','hopping']) {
    click(initial,'Double the final consonant');click(initial,'Ready for batting practice');submit(initial,word);click(initial,'Next batter');
  }
  click(initial,'Finish for today');c.today='2026-10-06';
  const root=renderPractice(c,{lessonId:'doubling-ing'});
  click(root,'Next play');click(root,'Next play');click(root,'Skip warm-up');
  let guard=0, checkedRun=false, checkedHop=false;
  while(!checkedRun || !checkedHop) {
    if(root.querySelector('.coach')) {click(root,'Double the final consonant');click(root,'Ready for batting practice');}
    click(root,'Hear Word and Sentence');const word=c.speech.at(-1)[0];submit(root,word);
    if(word==='running') {assert.equal(c.progress.attempts.at(-1).modelUsed,false);checkedRun=true;}
    if(word==='hopping') {assert.equal(c.progress.attempts.at(-1).modelUsed,true);checkedHop=true;}
    if(!checkedRun || !checkedHop) click(root,'Next batter');
    assert.ok(++guard<12);
  }
});
