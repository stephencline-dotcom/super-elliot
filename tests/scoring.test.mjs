import test from 'node:test';
import assert from 'node:assert/strict';
import { awardPoints, totalPoints, rewardEntries } from '../js/scoring.js';
import { emptyProgress, validateProgress, summarize } from '../js/storage.js';
import { sessionSummary } from '../js/stats.js';

test('one word earns one run regardless of support, with no same-day upgrades or recheck bonus',()=>{
 const args={date:'2026-10-05',sessionId:'s1',word:'running',reviewKind:'first-exposure'};
 for(const outcome of ['independent','supported','moved-on']) {
  const ledger=awardPoints([],{...args,outcome});assert.equal(totalPoints(ledger),1);
  assert.deepEqual(awardPoints(ledger,{...args,outcome:'independent',reviewKind:'later-session',sessionId:'s2'}),[]);
  assert.deepEqual(awardPoints(ledger,{...args,outcome:'independent',reviewKind:'same-session'}),[]);
  assert.equal(awardPoints(ledger,{...args,outcome,date:'2026-10-06'})[0].points,1);
 }
});

test('old bonuses collapse into runs without altering stored history and stay credited to the first session',()=>{
 const p=emptyProgress();
 const old=(word,kind,points,sessionId='s1')=>({key:`${word}-${kind}-${sessionId}`,date:'2026-10-05',word,kind,points,sessionId});
 p.points.ledger=[old('running','independent',10),old('running','laterRecallBonus',5),old('hopping','supported',4),old('hopping','recheck',5),old('hopping','independent',10,'s2'),old('running','sentence-practice',5,'s2')];
 const original=JSON.stringify(p.points.ledger);
 assert.equal(totalPoints(p.points.ledger),3);assert.equal(rewardEntries(p.points.ledger).length,3);
 assert.equal(sessionSummary(p,'s1').points,2);assert.equal(sessionSummary(p,'s2').points,1);
 assert.equal(summarize(p).points,3);assert.equal(JSON.stringify(p.points.ledger),original);
 assert.deepEqual(awardPoints(p.points.ledger,{date:'2026-10-05',sessionId:'s3',word:'hopping',outcome:'independent',reviewKind:'later-session'}),[]);
 const loaded=validateProgress(JSON.parse(JSON.stringify(p)));assert.ok(loaded.ok);assert.equal(totalPoints(loaded.data.points.ledger),3);
 assert.equal(loaded.data.points.ledger[0].points,10,'historical numbers remain preserved');
});
