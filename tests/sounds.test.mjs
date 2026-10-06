import test from 'node:test';
import assert from 'node:assert/strict';
import { soundModel, checkSoundMap } from '../js/data/sounds.js';
import { LESSONS } from '../js/data/lessons.js';
import { CATALOG } from '../js/data/catalog.js';
import { emptyProgress, validateProgress } from '../js/storage.js';
import { lessonEvidence } from '../js/mastery.js';

test('all 18 doubling targets have authored maps; blends and digraphs retain the right number of boxes',()=>{
 const words=CATALOG.slice(0,3).flatMap(c=>[...c.words,...c.transfer]);assert.equal(words.length,18);
 for(const word of words) {
  const model=soundModel(LESSONS[word]);assert.ok(model,word);
  assert.equal(model.groups.join(''),model.base);assert.equal(model.fullGroups.join(''),word);
  assert.equal(model.cues.length,model.groups.length);assert.ok(model.cues.every(Boolean));
  assert.equal(model.fullGroups.length,model.groups.length+(model.suffix==='ing'?2:1));
 }
 assert.equal(soundModel(LESSONS.swimming).groups.length,4);
 assert.deepEqual(soundModel(LESSONS.cooled).groups,['c','oo','l']);
 assert.deepEqual(soundModel(LESSONS.called).groups,['c','a','ll']);
 assert.deepEqual(soundModel(LESSONS.running).fullGroups,['r','u','nn','i','ng']);
 assert.equal(soundModel(LESSONS.dropped).endingSound,'one sound: /t/');
 assert.equal(soundModel(LESSONS.planned).endingSound,'one sound: /d/');
});

test('mapping checks groups, allowing case/whitespace and requiring digraphs in one box',()=>{
 assert.deepEqual(checkSoundMap(['c','oo','l'],[' C ','OO','l']),[true,true,true]);
 assert.deepEqual(checkSoundMap(['c','oo','l'],['c','o','ol']),[true,false,false]);
 assert.deepEqual(checkSoundMap(['r','u','n'],['r','u']),[true,true,false]);
});

test('sound evidence survives export/import and cannot establish word mastery',()=>{
 const p=emptyProgress();
 for(const [i,kind] of ['sound-count','sound-map','sound-ending','sound-routine'].entries()) p.activities.push({
  id:`s${i}`,date:'2026-10-05',sessionId:'s',lessonId:'doubling-ing',kind,word:'running',prompt:'run + ing',typed:'r|u|n',correct:true,modelUsed:true,attemptType:'first',checks:[],
 });
 const loaded=validateProgress(JSON.parse(JSON.stringify(p)));assert.ok(loaded.ok);assert.deepEqual(loaded.data.activities,p.activities);
 assert.equal(lessonEvidence(CATALOG[0],loaded.data).mastered,false);
 p.activities[0].kind='made-up';assert.equal(validateProgress(p).ok,false);
});
