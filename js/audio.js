// Speech (browser speech synthesis) and short synthesized effects (Web Audio).
// Nothing starts until unlock() is called from a user gesture.
export function createAudio(getSettings) {
  let ctx = null;
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const speechAvailable = () => !!synth && typeof SpeechSynthesisUtterance !== 'undefined';
  const speechAllowed = () => speechAvailable() && !getSettings().muted && getSettings().speechVolume > 0;

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function stopSpeech() {
    if (speechAvailable()) synth.cancel();
  }

  function speak(parts) {
    if (!speechAllowed()) return false;
    stopSpeech();
    const s = getSettings();
    for (const text of [].concat(parts)) {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = s.speechRate;
      u.volume = s.speechVolume;
      u.lang = 'en-US';
      synth.speak(u);
    }
    return true;
  }

  const volume = () => (getSettings().muted ? 0 : getSettings().effectsVolume);

  function noise(t, dur, freq, gain, out) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = buf;
    f.type = 'bandpass';
    f.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(out);
    src.start(t);
  }

  function tone(t, type, f0, f1, dur, gain, out) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  const effects = {
    // Original short synthesized cheer; no broadcast recordings.
    crowd(t, out) {
      noise(t, 0.65, 1100, 0.25, out);
      [430, 560, 710].forEach((f, i) => tone(t + i * 0.06, 'sine', f, f * 1.3, 0.35, 0.08, out));
    },
    batHit(t, out) {
      noise(t, 0.06, 2200, 0.9, out);
      tone(t, 'sine', 180, 60, 0.18, 0.8, out);
    },
    glovePop(t, out) {
      noise(t, 0.05, 900, 0.6, out);
      tone(t, 'sine', 240, 110, 0.12, 0.5, out);
    },
    chime(t, out) {
      [659.25, 880, 1174.66].forEach((f, i) => tone(t + i * 0.11, 'triangle', f, f, 0.5, 0.35, out));
    },
    tick(t, out) {
      tone(t, 'sine', 700, 500, 0.06, 0.25, out);
    },
  };

  // Plays one or more named effects in order. Silent when muted or volume is 0.
  function sfx(...names) {
    const v = volume();
    if (!ctx || v <= 0) return;
    const master = ctx.createGain();
    master.gain.value = v;
    master.connect(ctx.destination);
    let t = ctx.currentTime + 0.01;
    for (const n of names) {
      effects[n]?.(t, master);
      t += n === 'chime' ? 0.2 : 0.12;
    }
  }

  return { unlock, speak, stopSpeech, sfx, speechAvailable, speechAllowed };
}
