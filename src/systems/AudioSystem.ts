import { events, EVT } from '@/core/EventBus';
import { chance, randRange } from '@/utils/math';
import { AUDIO, mediaUrl, pickRandom, type ScareAudioKind } from '@/config/media';

type SfxKind = 'hover' | 'click' | 'paper' | 'rune' | 'heartbeat' | 'creak';

export class AudioSystem {
  private masterVolume = 0.55;
  private enabled = false;
  private primed = false;
  private ambientEl: HTMLAudioElement | null = null;
  private musicBoxTimer = 0;
  private eventTimer = 0;
  private whisperTimer = 0;
  private activeOneShots: HTMLAudioElement[] = [];

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

    const primeOnce = () => { void this.primeAndEnable(); };
    document.addEventListener('click', primeOnce, { once: true, capture: true });
    document.addEventListener('keydown', primeOnce, { once: true, capture: true });
  }

  async primeAndEnable(): Promise<void> {
    if (this.enabled) return;
    this.primed = true;
    this.enabled = true;
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
    this.enabled = false;
    this.stopAmbience();
    this.stopAllOneShots();
    this.toggleBtn.classList.remove('zh-audio--on');
    this.toggleBtn.setAttribute('aria-label', 'Включить звук');
    events.emit(EVT.AUDIO_TOGGLE, { enabled: false });
  }

  private createAudio(src: string, volume: number, loop = false): HTMLAudioElement {
    const el = new Audio(mediaUrl(src));
    el.preload = 'auto';
    el.loop = loop;
    el.volume = volume * this.masterVolume;
    return el;
  }

  private startAmbience(): void {
    this.stopAmbience();
    const track = pickRandom(AUDIO.ambient);
    this.ambientEl = this.createAudio(track, 0.35, true);
    void this.ambientEl.play().catch(() => { /* autoplay */ });

    setTimeout(() => {
      if (!this.enabled) return;
      const piano = this.createAudio(AUDIO.piano, 0.12, true);
      void piano.play().catch(() => {});
      this.activeOneShots.push(piano);
    }, 3000);
  }

  private stopAmbience(): void {
    if (this.ambientEl) {
      this.ambientEl.pause();
      this.ambientEl.src = '';
      this.ambientEl = null;
    }
  }

  private stopAllOneShots(): void {
    for (const el of this.activeOneShots) {
      el.pause();
      el.src = '';
    }
    this.activeOneShots = [];
  }

  private playFile(src: string, volume: number, loop = false): HTMLAudioElement {
    const el = this.createAudio(src, volume, loop);
    void el.play().catch(() => {});
    if (!loop) {
      el.addEventListener('ended', () => {
        this.activeOneShots = this.activeOneShots.filter((a) => a !== el);
      });
    }
    this.activeOneShots.push(el);
    return el;
  }

  update(dt: number, atmosphereLevel: number): void {
    if (!this.enabled) return;

    this.musicBoxTimer -= dt;
    if (this.musicBoxTimer <= 0 && chance(0.004 * (0.3 + atmosphereLevel))) {
      this.playFile(AUDIO.musicBox, 0.25);
      this.musicBoxTimer = 25 + randRange(0, 40);
    }

    this.eventTimer -= dt;
    if (this.eventTimer <= 0 && chance(0.006 * (0.4 + atmosphereLevel))) {
      this.playRandomAmbientEvent();
      this.eventTimer = 10 + randRange(0, 25);
    }

    this.whisperTimer -= dt;
    if (this.whisperTimer <= 0 && chance(0.005 * atmosphereLevel)) {
      this.playFile(pickRandom(AUDIO.static), 0.15);
      this.whisperTimer = 12 + randRange(0, 30);
    }
  }

  private playRandomAmbientEvent(): void {
    const roll = Math.random();
    if (roll < 0.25) this.playFile(AUDIO.door, 0.35);
    else if (roll < 0.45) this.playFile(AUDIO.heartbeat, 0.2);
    else if (roll < 0.65) this.playFile(AUDIO.nervous, 0.22);
    else if (roll < 0.8) this.playFile(AUDIO.clock, 0.18);
    else this.playFile(pickRandom(AUDIO.static), 0.12);
  }

  playSfx(kind: SfxKind): void {
    if (!this.enabled) return;
    switch (kind) {
      case 'hover':
        this.playFile(pickRandom(AUDIO.static), 0.08);
        break;
      case 'click':
        this.playFile(pickRandom(AUDIO.impacts), 0.2);
        break;
      case 'paper':
        this.playFile(AUDIO.door, 0.15);
        break;
      case 'rune':
        this.playFile(AUDIO.piano, 0.18);
        break;
      case 'heartbeat':
        this.playFile(AUDIO.heartbeat, 0.3);
        break;
      case 'creak':
        this.playFile(AUDIO.door, 0.25);
        break;
    }
  }

  playScare(type: ScareAudioKind): void {
    const vol = this.enabled ? 0.85 : 0.5;
    this.playFile(pickRandom(AUDIO.screams), vol);
    this.playFile(pickRandom(AUDIO.impacts), vol * 0.7);

    if (type === 'static') {
      this.playFile(pickRandom(AUDIO.static), 0.4);
    }
    if (type === 'eyes') {
      this.playFile(AUDIO.heartbeat, 0.35);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isPrimed(): boolean {
    return this.primed;
  }
}
