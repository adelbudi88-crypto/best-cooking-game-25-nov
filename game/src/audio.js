// Warung Kilat — sound. One job: every sound effect, synthesized live with
// WebAudio. No audio files, no network. Silent until the first player gesture.

let ctx = null;
let master = null;
let sizzleNodes = null;
let muted = false;

function ensureContext() {
  if (ctx) return ctx;
  const AudioContext = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContext) return null;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

export function unlockAudio() {
  const c = ensureContext();
  if (c && c.state === 'suspended') void c.resume();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

function tone(freq, duration, type, volume, slideTo) {
  if (muted) return;
  const c = ensureContext();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noiseBurst(duration, volume, filterFreq) {
  if (muted) return;
  const c = ensureContext();
  if (!c) return;
  const length = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.value = volume;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start();
}

// A short wooden chop tick when an ingredient lands in a station.
export function playChop() {
  noiseBurst(0.07, 0.5, 2400);
  tone(190, 0.06, 'triangle', 0.25, 120);
}

export function playClick() {
  tone(660, 0.05, 'square', 0.12);
}

// Two-note ding when a dish is served.
export function playDing() {
  tone(880, 0.12, 'sine', 0.3);
  setTimeout(() => tone(1318, 0.22, 'sine', 0.3), 90);
}

// Rising chime for a combo serve; higher with the combo count.
export function playCombo(combo) {
  const base = 660 + Math.min(combo, 8) * 60;
  tone(base, 0.1, 'sine', 0.25);
  setTimeout(() => tone(base * 1.5, 0.18, 'sine', 0.25), 70);
}

// Low buzz for a mistake: wrong ingredient, burnt dish, lost order.
export function playBuzz() {
  tone(140, 0.22, 'sawtooth', 0.22, 90);
}

// A bright pop when cooking finishes.
export function playDone() {
  tone(523, 0.1, 'sine', 0.28);
  setTimeout(() => tone(784, 0.16, 'sine', 0.28), 80);
}

// Short tick when a ticket is about to expire or the shift clock runs low.
export function playTick() {
  tone(1100, 0.04, 'square', 0.12);
}

export function playLevelUp() {
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle', 0.25), i * 90));
}

// Continuous pan sizzle while anything is cooking. Start/stop are cheap to call.
export function setSizzle(on) {
  if (!on) {
    if (sizzleNodes) {
      try {
        sizzleNodes.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        const nodes = sizzleNodes;
        setTimeout(() => {
          try { nodes.src.stop(); } catch { /* already stopped */ }
          nodes.src.disconnect();
        }, 300);
      } catch { /* context gone */ }
      sizzleNodes = null;
    }
    return;
  }
  if (sizzleNodes || muted) return;
  const c = ensureContext();
  if (!c) return;
  const length = c.sampleRate * 1;
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 4000;
  const gain = c.createGain();
  gain.gain.value = 0.05;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start();
  sizzleNodes = { src, gain };
}
