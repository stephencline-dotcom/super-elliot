import { h } from './dom.js';

export function renderSettings(ctx) {
  const s = ctx.settings;
  const update = (patch, preview) => {
    Object.assign(s, patch);
    ctx.saveSettings();
    if (preview) { ctx.audio.unlock(); preview(); }
  };

  const check = (id, label, key, hint) => h('div', { class: 'field' },
    h('label', { for: id, class: 'check' },
      h('input', { id, type: 'checkbox', checked: s[key] ? true : null, onChange: (e) => update({ [key]: e.target.checked }) }), ` ${label}`),
    hint ? h('p', { class: 'note' }, hint) : null);

  const slider = (id, label, key, min, max, step, preview) => h('div', { class: 'field' },
    h('label', { for: id }, label),
    h('input', {
      id, type: 'range', min, max, step, value: s[key],
      onChange: (e) => update({ [key]: Number(e.target.value) }, preview),
    }));

  const select = (id, label, key, options, parse = (v) => v) => h('div', { class: 'field' },
    h('label', { for: id }, label),
    h('select', { id, onChange: (e) => update({ [key]: parse(e.target.value) }) },
      options.map(([v, text]) => h('option', { value: v, selected: String(s[key]) === String(v) ? true : null }, text))));

  return h('section', { class: 'card settings' },
    h('h1', null, 'Settings'),
    h('h2', null, 'Sound'),
    check('set-muted', 'Mute all sound (speech and effects)', 'muted', 'With sound muted, the word is not read aloud. A grown-up can read it, or you can show it (counts as using the model).'),
    h('p', { class: 'note' }, 'Reading starts only when you press Read Aloud or Hear Word and Sentence. There is no automatic narration.'),
    slider('set-speech-vol', 'Speech volume', 'speechVolume', 0, 1, 0.1),
    slider('set-speech-rate', 'Speech speed', 'speechRate', 0.5, 1.2, 0.1),
    slider('set-fx-vol', 'Effects volume', 'effectsVolume', 0, 1, 0.1, () => ctx.audio.sfx('batHit', 'chime')),
    h('div', { class: 'row' },
      h('button', { class: 'btn', type: 'button', onClick: () => { ctx.audio.unlock(); ctx.audio.sfx('batHit', 'chime'); } }, 'Test effects'),
      h('button', { class: 'btn', type: 'button', onClick: () => { ctx.audio.unlock(); ctx.audio.speak('Batter up'); } }, 'Test speech')),
    ctx.audio.speechAvailable() ? null : h('p', { class: 'note' }, 'This browser does not offer speech synthesis.'),
    h('h2', null, 'Motion'),
    select('set-motion', 'Animation', 'motion', [['system', 'Follow my device setting'], ['reduced', 'Reduce motion'], ['full', 'Full animation']], (v) => { setTimeout(ctx.applyMotion, 0); return v; }),
    check('set-celebrations', 'Show celebration animations', 'celebrations'),
    h('h2', null, 'Practice'),
    select('set-length', 'Words per session', 'sessionLength', [[5, '5 words'], [8, '8 words'], [10, '10 words'], [15, '15 words']], Number),
    h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onClick: () => ctx.go('home') }, 'Back to home')));
}
