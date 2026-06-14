import { events, EVT } from '@/core/EventBus';
import { chance, randRange } from '@/utils/math';

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = false;
  private initialized = false;
  private nodes: AudioNode[] = [];
  private whisperTimer = 0;

  constructor(private toggleBtn: HTMLElement) {
    this.toggleBtn.addEventListener('click', () => this.toggle());
    this.toggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });
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

  private toggle(): void {
    if (!this.initialized) {
      void this.init().then(() => this.enable());
      return;
    }
    if (this.enabled) this.disable();
    else this.enable();
  }

  private enable(): void {
    if (!this.ctx || !this.masterGain) return;
    void this.ctx.resume();
    this.enabled = true;
    this.masterGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 2);
    this.startAmbience();
    this.toggleBtn.classList.add('zh-audio--on');
    this.toggleBtn.setAttribute('aria-label', 'Отключить звук');
    events.emit(EVT.AUDIO_TOGGLE, { enabled: true });
  }

  private disable(): void {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    this.enabled = false;
    this.stopAmbience();
    this.toggleBtn.classList.remove('zh-audio--on');
    this.toggleBtn.setAttribute('aria-label', 'Включить звук');
    events.emit(EVT.AUDIO_TOGGLE, { enabled: false });
  }

  private startAmbience(): void {
    if (!this.ctx || !this.masterGain) return;
    this.stopAmbience();

    const rumble = this.createNoise(0.04, 80, 'lowpass');
    const wind = this.createNoise(0.015, 400, 'bandpass');
    const staticNoise = this.createNoise(0.008, 2000, 'highpass');

    this.nodes = [rumble, wind, staticNoise];
    this.nodes.forEach((n) => n.connect(this.masterGain!));
  }

  private createNoise(volume: number, freq: number, filterType: BiquadFilterType): GainNode {
    const ctx = this.ctx!;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(filter);
    filter.connect(gain);
    source.start();

    return gain;
  }

  private stopAmbience(): void {
    this.nodes.forEach((n) => {
      try { n.disconnect(); } catch { /* ignore */ }
    });
    this.nodes = [];
  }

  update(dt: number, atmosphereLevel: number): void {
    if (!this.enabled || !this.masterGain || !this.ctx) return;

    this.whisperTimer -= dt;
    if (this.whisperTimer <= 0 && chance(0.002 * atmosphereLevel)) {
      this.playWhisper();
      this.whisperTimer = 15 + randRange(0, 30);
    }
  }

  private playWhisper(): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = randRange(200, 400);
    filter.type = 'bandpass';
    filter.frequency.value = randRange(300, 800);
    filter.Q.value = 8;
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 3);
  }

  playScare(type: 'face' | 'static' | 'eyes' | 'text'): void {
    if (!this.ctx || !this.masterGain) return;
    void this.ctx.resume();

    const t = this.ctx.currentTime;
    const burst = this.ctx.createOscillator();
    const burstGain = this.ctx.createGain();
    burst.type = 'sawtooth';
    burst.frequency.setValueAtTime(type === 'face' ? 90 : 140, t);
    burst.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    burstGain.gain.setValueAtTime(0, t);
    burstGain.gain.linearRampToValueAtTime(this.enabled ? 0.25 : 0.12, t + 0.02);
    burstGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    burst.connect(burstGain);
    burstGain.connect(this.masterGain);
    burst.start(t);
    burst.stop(t + 0.4);

    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(this.enabled ? 0.15 : 0.08, t + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
