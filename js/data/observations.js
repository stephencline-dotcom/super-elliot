// Parent-provided historical observations: how the word was spelled before the app existed.
// These are NOT app assessment results and are never mixed into progress records.
// `inferredTarget` means the intended word was guessed from the misspelling and needs parent confirmation.
const o = (target, observed, extra = {}) => ({
  target,
  observed,
  source: 'parent-provided',
  inferredTarget: false,
  needsParentConfirmation: false,
  ...extra,
});
const inferred = { inferredTarget: true, needsParentConfirmation: true };

export const OBSERVATIONS = [
  o('beautiful', 'beutiful'),
  o('complete', 'compleat'),
  o('explode', 'exsplode'),
  o('athlete', 'athleat'),
  o('storm', 'storme'),
  o('communication', 'comunication'),
  o('significant', 'signifacant'),
  o('organization', 'orginisation', inferred),
  o('approximately', 'aproxamently'),
  o('achievement', 'acheavment'),
  o('season', 'seson'),
  o('running', 'runing'),
  o('planned', 'pland'),
  o('carried', 'caried'),
  o('studies', 'studys'),
  o('admitted', 'admited'),
  o('beginning', 'beging'),
  o('discover', 'descover'),
  o('tomorrow', 'tommorow'),
  o('rewrite', 'reright'),
  o('agreement', 'agrement'),
  o('preparation', 'preperation'),
  o('necessary', 'nessisary'),
  o('environment', 'invierment', inferred),
  o('government', 'govenment'),
  o('knowledge', 'knoledg'),
  o('available', 'availble'),
  o('experience', 'expierence'),
  o('successful', 'sucsesful'),
  o('opportunity', 'opertunity'),
];
