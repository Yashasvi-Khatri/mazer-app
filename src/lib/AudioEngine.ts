type Instrument = 'kick' | 'snare' | 'hihat' | 'percussion';

type PatternMap = {
  [key in Instrument]?: number[];
};

/**
 * AudioEngine — precise Web Audio API lookahead scheduler with synthesized drums.
 * No external samples required. Supports reverb, swing, per-instrument volume.
 */
export class AudioEngine {
  private context: AudioContext | null = null;
  private isPlaying: boolean = false;
  private bpm: number = 90;
  private patterns: PatternMap = {};
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private schedulerIntervalId: ReturnType<typeof setInterval> | null = null;
  private gainNodes: Map<Instrument, GainNode> = new Map();
  private reverbNode: ConvolverNode | null = null;
  private masterGain: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private swing: number = 0;
  private stepCallback: ((step: number) => void) | null = null;

  private readonly LOOKAHEAD_MS = 25;
  private readonly SCHEDULE_AHEAD_TIME = 0.1;

  get instruments(): Instrument[] {
    return ['kick', 'snare', 'hihat', 'percussion'];
  }

  async init() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.85;
    this.analyserNode = this.context.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;
    this.reverbNode = await this.buildReverb(1.5, 2.0);
    for (const inst of this.instruments) {
      const g = this.context.createGain();
      g.gain.value = 1.0;
      g.connect(this.masterGain);
      this.gainNodes.set(inst, g);
    }
    this.masterGain.connect(this.analyserNode);
    this.analyserNode.connect(this.context.destination);
  }

  private async buildReverb(duration: number, decay: number): Promise<ConvolverNode> {
    const ctx = this.context!;
    const length = ctx.sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = impulse;
    conv.connect(this.masterGain!);
    return conv;
  }

  setPatterns(patterns: PatternMap, bpm: number = 90) {
    this.patterns = patterns;
    this.bpm = bpm;
  }

  setVolume(instrument: Instrument, volume: number) {
    this.gainNodes.get(instrument)?.gain.setTargetAtTime(volume, this.context!.currentTime, 0.01);
  }

  setMasterVolume(volume: number) {
    this.masterGain?.gain.setTargetAtTime(volume, this.context!.currentTime, 0.01);
  }

  /** Update BPM live while playing — takes effect on the next scheduled step */
  setBpm(bpm: number) {
    this.bpm = bpm;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  setSwing(swing: number) {
    this.swing = Math.max(0, Math.min(0.5, swing));
  }

  onStep(callback: (step: number) => void) {
    this.stepCallback = callback;
  }

  play() {
    if (this.isPlaying || !this.context) return;
    if (this.context.state === 'suspended') this.context.resume();
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.context.currentTime;
    this.schedulerIntervalId = setInterval(() => this.schedule(), this.LOOKAHEAD_MS);
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.schedulerIntervalId !== null) {
      clearInterval(this.schedulerIntervalId);
      this.schedulerIntervalId = null;
    }
  }

  private schedule() {
    if (!this.context) return;
    while (this.nextStepTime < this.context.currentTime + this.SCHEDULE_AHEAD_TIME) {
      const step = this.currentStep;
      const time = this.nextStepTime;
      const swingOffset = (step % 2 === 1) ? (60 / this.bpm / 4) * this.swing : 0;
      this.playStep(step, time + swingOffset);
      if (this.stepCallback) {
        const delay = (time - this.context.currentTime) * 1000;
        setTimeout(() => this.stepCallback!(step), Math.max(0, delay));
      }
      this.nextStepTime += 60 / this.bpm / 4;
      this.currentStep = (this.currentStep + 1) % 16;
    }
  }

  private playStep(step: number, time: number) {
    for (const inst of this.instruments) {
      if (this.patterns[inst]?.[step]) this.synthesize(inst, time);
    }
  }

  private synthesize(instrument: Instrument, time: number) {
    const ctx = this.context!;
    const gain = this.gainNodes.get(instrument)!;
    switch (instrument) {
      case 'kick': this.synthKick(ctx, gain, time); break;
      case 'snare': this.synthSnare(ctx, gain, time); break;
      case 'hihat': this.synthHihat(ctx, gain, time); break;
      case 'percussion': this.synthPerc(ctx, gain, time); break;
    }
  }

  private synthKick(ctx: AudioContext, out: AudioNode, t: number) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env); env.connect(out);
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(0.001, t + 0.5);
    env.gain.setValueAtTime(1.5, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t); osc.stop(t + 0.5);
  }

  private synthSnare(ctx: AudioContext, out: AudioNode, t: number) {
    const bufLen = Math.floor(ctx.sampleRate * 0.2);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 1000;
    const env = ctx.createGain();
    noise.connect(filter); filter.connect(env); env.connect(out);
    env.gain.setValueAtTime(1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    noise.start(t); noise.stop(t + 0.2);
    const osc = ctx.createOscillator();
    const oscEnv = ctx.createGain();
    osc.connect(oscEnv); oscEnv.connect(out);
    osc.frequency.value = 200;
    oscEnv.gain.setValueAtTime(0.7, t);
    oscEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t); osc.stop(t + 0.1);
  }

  private synthHihat(ctx: AudioContext, out: AudioNode, t: number) {
    const dur = 0.05;
    const bufLen = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 8000; filter.Q.value = 0.7;
    const env = ctx.createGain();
    noise.connect(filter); filter.connect(env); env.connect(out);
    env.gain.setValueAtTime(0.8, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noise.start(t); noise.stop(t + dur);
  }

  private synthPerc(ctx: AudioContext, out: AudioNode, t: number) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 600;
    const env = ctx.createGain();
    osc.connect(filter); filter.connect(env); env.connect(out);
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
    env.gain.setValueAtTime(1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.start(t); osc.stop(t + 0.08);
    if (this.reverbNode) {
      const send = ctx.createGain(); send.gain.value = 0.3;
      filter.connect(send); send.connect(this.reverbNode);
    }
  }

  resume() { this.context?.resume(); }
  destroy() { this.stop(); this.context?.close(); }
}

export default AudioEngine;
