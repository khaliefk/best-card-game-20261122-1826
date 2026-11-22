// A tiny synth: short oscillator blips for plays, hits, heals and the end of a duel. No
// audio files, nothing fetched. It stays silent until the first user gesture creates the
// context, and M toggles it off.

export function createSound() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context !== null) return context;
    try {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (Ctor === undefined) return null;
      context = new Ctor();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, seconds, type, gainValue, when = 0) {
    if (muted) return;
    const ctx = ensure();
    if (ctx === null || ctx.state === 'suspended') {
      if (ctx !== null) ctx.resume().catch(() => {});
      if (ctx === null || ctx.state === 'suspended') return;
    }
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const start = ctx.currentTime + when;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + seconds + 0.05);
    } catch {
      // Sound is decoration: never let it break the game.
    }
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    play() {
      tone(660, 0.09, 'triangle', 0.12);
    },
    hit() {
      tone(150, 0.18, 'sawtooth', 0.14);
    },
    heal() {
      tone(880, 0.14, 'sine', 0.1);
    },
    draw() {
      tone(520, 0.07, 'sine', 0.08);
    },
    turn() {
      tone(440, 0.07, 'triangle', 0.08);
    },
    win() {
      tone(523, 0.16, 'triangle', 0.12);
      tone(659, 0.16, 'triangle', 0.12, 0.14);
      tone(784, 0.3, 'triangle', 0.12, 0.28);
    },
    lose() {
      tone(392, 0.2, 'triangle', 0.12);
      tone(311, 0.2, 'triangle', 0.12, 0.18);
      tone(233, 0.4, 'triangle', 0.12, 0.36);
    },
  };
}
