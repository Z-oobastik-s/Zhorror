import { events, EVT } from '@/core/EventBus';
import { chance, randRange } from '@/utils/math';

type SfxKind = 'hover' | 'click' | 'paper' | 'rune' | 'heartbeat' | 'creak';

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = false;
  private initialized = false;
  private nodes: AudioNode[] = [];
  private whisperTimer = 0;
  private ambientTimer = 0;
  private primed = false;

  constructor(private toggleBtn: HTMLElement) {
    this.toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      void this.primeAndEnable();
    });
    this.toggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        void this.primeAndEnable();
      }
    });

    const primeOnce = () => {
      void this.primeAndEnable();
    };
    document.addEventListener('click', primeOnce, { once: true, capture: true });
    document.addEventListener('keydown', primeOnce, { once: true, capture: true });
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch {
      this.toggleBtn.style.display = 'none';
    }
  }

  async primeAndEnable(): Promise<void> {
    if (!this.initialized) await this.init();
    if (!this.ctx || !this.masterGain || this.enabled) return;
    this.primed = true;
    void this.ctx.resume();
    this.enabled = true;
    this.masterGain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 1.5);
    this.startAmbience();
    this.toggleBtn.classList.add('zh-audio--on');
    this.toggleBtn.setAttribute('aria-label', 'Отключить звук');
    events.emit(EVT.AUDIO_TOGGLE, { enabled: true });
  }

  toggle(): void {
    if (this.enabled) this.disable();
    else void this.primeAndEnable();
  }

  private disable(): void {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
    this.enabled = false;
    this.stopAmbience();
    this.toggleBtn.classList.remove('zh-audio--on');
    this.toggleBtn.setAttribute('aria-label', 'Включить звук');
    events.emit(EVT.AUDIO_TOGGLE, { enabled: false });
  }

  private startAmbience(): void {
    if (!this.ctx || !this.masterGain) return;
    this.stopAmbience();

    const rumble = this.createNoise(0.06, 60, 'lowpass');
    const wind = this.createNoise(0.025, 350, 'bandpass');
    const staticNoise = this.createNoise(0.012, 1800, 'highpass');
    const drone = this.createDrone();

    this.nodes = [rumble, wind, staticNoise, drone];
    this.nodes.forEach((n) => n.connect(this.masterGain!));
  }

  private createDrone(): GainNode {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 55;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    const gain = ctx.createGain();
    gain.gain.value = 0.04;
    osc.connect(gain);
    osc.start();
    lfo.start();
    return gain;
  }

  private createNoise(volume: number, freq: number, filterType: BiquadFilterType): GainNode {
    const ctx = this.ctx!;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    source.start();
    return gain;
  }

  private stopAmbience(): void {
    this.nodes.forEach((n) => { try { n.disconnect(); } catch { /* ok */ } });
    this.nodes = [];
  }

  update(dt: number, atmosphereLevel: number): void {
    if (!this.enabled || !this.masterGain || !this.ctx) return;

    this.whisperTimer -= dt;
    if (this.whisperTimer <= 0 && chance(0.008 * (0.5 + atmosphereLevel))) {
      this.playWhisper();
      this.whisperTimer = 8 + randRange(0, 20);
    }

    this.ambientTimer -= dt;
    if (this.ambientTimer <= 0 && chance(0.006 * atmosphereLevel)) {
      this.playSfx('creak');
      this.ambientTimer = 12 + randRange(0, 25);
    }
  }

  playSfx(kind: SfxKind): void {
    if (!this.ctx || !this.masterGain) return;
    void this.ctx.resume();
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.connect(this.masterGain);

    switch (kind) {
      case 'hover':
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.04, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        this.tone(g, 180 + randRange(0, 80), 'sine', 0.08, t);
        break;
      case 'click':
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.08, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        this.tone(g, 90, 'square', 0.06, t);
        this.noiseBurst(g, 0.05, t, 0.05);
        break;
      case 'paper':
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.06, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        this.noiseBurst(g, 0.04, t, 0.15, 800);
        break;
      case 'rune':
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.07, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        this.tone(g, 220, 'triangle', 0.4, t);
        this.tone(g, 110, 'sine', 0.4, t + 0.1);
        break;
      case 'heartbeat':
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.1, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        this.tone(g, 48, 'sine', 0.1, t);
        this.tone(g, 48, 'sine', 0.08, t + 0.22);
        break;
      case 'creak':
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.05, t + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        this.tone(g, randRange(300, 500), 'sawtooth', 0.6, t);
        break;
    }
  }

  private tone(dest: GainNode, freq: number, type: OscillatorType, dur: number, t: number): void {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(dest);
    o.start(t);
    o.stop(t + dur);
  }

  private noiseBurst(dest: GainNode, vol: number, t: number, dur: number, freq = 2000): void {
    if (!this.ctx) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t);
  }

  private playWhisper(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    g.connect(this.masterGain);
    this.tone(g, randRange(150, 350), 'sine', 2, t);
    this.noiseBurst(g, 0.03, t + 0.2, 1.5, 600);
  }

  playScare(type: 'face' | 'static' | 'eyes' | 'text'): void {
    if (!this.ctx || !this.masterGain) return;
    void this.ctx.resume();
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.connect(this.masterGain);

    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(this.enabled ? 0.45 : 0.2, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    const freq = type === 'face' ? 70 : 120;
    this.tone(g, freq, 'sawtooth', 0.2, t);
    this.tone(g, freq * 0.5, 'square', 0.15, t);
    this.noiseBurst(g, this.enabled ? 0.25 : 0.12, t, 0.35, 1500);
    this.playSfx('heartbeat');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isPrimed(): boolean {
    return this.primed;
  }
}
