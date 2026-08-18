export type SfxKind =
  | "shot"
  | "explode"
  | "hurt"
  | "bomb"
  | "pickup"
  | "wave"
  | "boss"
  | "clear"
  | "die"
  | "select"
  | "start";

let ctx: AudioContext | null = null;
let muted = false;
let bedTimer = 0;
let lastShotAt = 0;
let bedStep = 0;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function unlockAudio(): void {
  const ac = audio();
  if (ac && ac.state === "suspended") void ac.resume();
}

export function setMuted(next: boolean): void {
  muted = next;
  if (next) stopBed();
}

export function isMuted(): boolean {
  return muted;
}

function tone(
  ac: AudioContext,
  type: OscillatorType,
  freq: number,
  duration: number,
  gain = 0.08,
  slide?: number,
) {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), ac.currentTime + duration);
  amp.gain.setValueAtTime(gain, ac.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

function noise(ac: AudioContext, duration: number, gain = 0.12, filterFreq = 1200) {
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * duration), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(gain, ac.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ac.destination);
  src.start();
}

export function playSfx(kind: SfxKind): void {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  switch (kind) {
    case "shot": {
      const now = ac.currentTime;
      if (now - lastShotAt < 0.045) return;
      lastShotAt = now;
      tone(ac, "square", 880, 0.045, 0.035, 420);
      break;
    }
    case "explode":
      noise(ac, 0.28, 0.18, 1100);
      tone(ac, "sawtooth", 210, 0.2, 0.055, 55);
      tone(ac, "triangle", 90, 0.16, 0.04, 40);
      break;
    case "hurt":
      tone(ac, "sawtooth", 220, 0.16, 0.08, 80);
      break;
    case "bomb":
      noise(ac, 0.45, 0.22, 500);
      tone(ac, "sine", 90, 0.4, 0.12, 40);
      break;
    case "pickup":
      tone(ac, "square", 520, 0.08, 0.06);
      tone(ac, "square", 780, 0.1, 0.05);
      break;
    case "wave":
      tone(ac, "triangle", 440, 0.12, 0.06);
      break;
    case "boss":
      tone(ac, "square", 160, 0.22, 0.08, 90);
      tone(ac, "square", 120, 0.28, 0.06, 70);
      break;
    case "clear":
      tone(ac, "triangle", 523, 0.12, 0.06);
      tone(ac, "triangle", 659, 0.14, 0.05);
      break;
    case "die":
      noise(ac, 0.5, 0.18, 400);
      tone(ac, "sawtooth", 140, 0.45, 0.1, 40);
      break;
    case "select":
      tone(ac, "square", 660, 0.05, 0.04);
      break;
    case "start":
      tone(ac, "triangle", 392, 0.1, 0.06);
      tone(ac, "triangle", 523, 0.14, 0.05);
      break;
  }
}

const BED_BASS = [62, 62, 93, 62, 78, 62, 93, 117];
const BED_LEAD = [0, 247, 0, 311, 0, 247, 196, 0];

export function startBed(): void {
  if (muted || bedTimer) return;
  bedStep = 0;
  const pulse = () => {
    if (muted) return;
    const ac = audio();
    if (ac) {
      const bass = BED_BASS[bedStep % BED_BASS.length];
      tone(ac, "sine", bass, 0.22, 0.03);
      const lead = BED_LEAD[bedStep % BED_LEAD.length];
      if (lead) tone(ac, "triangle", lead, 0.12, 0.012);
      if (bedStep % 2 === 0) noise(ac, 0.04, 0.012, 2800);
    }
    bedStep += 1;
    bedTimer = window.setTimeout(pulse, 168);
  };
  pulse();
}

export function stopBed(): void {
  if (bedTimer) {
    window.clearTimeout(bedTimer);
    bedTimer = 0;
  }
}
