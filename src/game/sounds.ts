// Lightweight synthesized SFX via Web Audio API — no assets needed.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type ToneOpts = {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  sweepTo?: number;
  delay?: number;
};

function tone({ freq, duration, type = "sine", gain = 0.15, sweepTo, delay = 0 }: ToneOpts) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function noise(duration: number, gain = 0.18, filterFreq = 1200) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime;
  const bufferSize = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t0);
  src.stop(t0 + duration);
}

export const sfx = {
  buy() {
    // Coin chime
    tone({ freq: 880, duration: 0.09, type: "triangle", gain: 0.2 });
    tone({ freq: 1320, duration: 0.14, type: "triangle", gain: 0.18, delay: 0.08 });
  },
  plant() {
    // Soft dig thud + rising sprout
    noise(0.15, 0.12, 600);
    tone({ freq: 300, duration: 0.25, type: "sine", gain: 0.18, sweepTo: 520, delay: 0.05 });
  },
  ready() {
    // Cheerful arpeggio
    tone({ freq: 660, duration: 0.12, type: "triangle", gain: 0.18 });
    tone({ freq: 880, duration: 0.12, type: "triangle", gain: 0.18, delay: 0.1 });
    tone({ freq: 1320, duration: 0.22, type: "triangle", gain: 0.2, delay: 0.2 });
  },
  cataclysm() {
    // Alarm: descending noise + siren
    noise(0.5, 0.22, 400);
    tone({ freq: 220, duration: 0.35, type: "sawtooth", gain: 0.22, sweepTo: 80 });
    tone({ freq: 180, duration: 0.35, type: "sawtooth", gain: 0.22, sweepTo: 70, delay: 0.35 });
  },
  harvest() {
    tone({ freq: 520, duration: 0.1, type: "triangle", gain: 0.18 });
    tone({ freq: 780, duration: 0.14, type: "triangle", gain: 0.18, delay: 0.08 });
  },
};
