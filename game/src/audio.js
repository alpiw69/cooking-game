// audio.js — every sound is synthesized with WebAudio, no audio files.
// The context only starts after the player's first gesture, so the game
// never asks for anything on load.

export function makeSfx() {
  let ctx = null;
  let muted = false;

  function ac() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch (e) {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when) {
    const c = ac();
    if (!c || muted) return;
    const t0 = c.currentTime + (when || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, gain, filterFreq) {
    const c = ac();
    if (!c || muted) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = filterFreq || 3000;
    const g = c.createGain();
    g.gain.value = gain || 0.08;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  }

  return {
    unlock() { ac(); },
    toggleMute() { muted = !muted; return muted; },
    click() { tone(660, 0.06, 'triangle', 0.08); },
    pop() { tone(520, 0.07, 'sine', 0.12); tone(780, 0.09, 'sine', 0.1, 0.04); },
    sizzle() { noise(0.5, 0.1, 4200); tone(180, 0.4, 'sawtooth', 0.03); },
    serve() { tone(523, 0.1, 'sine', 0.12); tone(659, 0.1, 'sine', 0.12, 0.08); tone(784, 0.16, 'sine', 0.14, 0.16); },
    thud() { tone(140, 0.12, 'square', 0.07); },
    start() { tone(392, 0.1, 'triangle', 0.1); tone(523, 0.12, 'triangle', 0.1, 0.09); tone(659, 0.18, 'triangle', 0.12, 0.18); },
  };
}
