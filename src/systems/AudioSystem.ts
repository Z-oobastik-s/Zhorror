import { events, EVT } from '@/core/EventBus';
import { audioGate } from '@/systems/AudioGateState';
import { chance, randRange } from '@/utils/math';
import { getDuration, isLongTrack, isMediumTrack } from '@/config/audioMeta';
import { AUDIO, mediaUrl, pickRandom, type ScareAudioKind } from '@/config/media';

type SfxKind = 'hover' | 'click' | 'paper' | 'rune' | 'heartbeat' | 'creak';

const MAX_SHORT = 4;
const SCARE_POOL_COPIES = 2;

/** Короткие файлы для мгновенного скримера (без длинных ambient/event) */
const SCARE_PRELOAD: readonly string[] = [
  ...AUDIO.screams,
  ...AUDIO.impacts.slice(0, 6),
  ...AUDIO.static,
  AUDIO.heartbeat,
  ...AUDIO.whispers.slice(0, 4),
];

export class AudioSystem {
  private masterVolume = 0.55;
  private enabled = false;
  private primed = false;
  private actProfile = 1;
  private ambientEl: HTMLAudioElement | null = null;
  private longLockUntil = 0;
  private mediumLockUntil = 0;
  private musicBoxTimer = 0;
  private eventTimer = 0;
  private whisperTimer = 0;
  private bedTimer = 0;
  private activeShort: HTMLAudioElement[] = [];
  private scarePool = new Map<string, HTMLAudioElement[]>();
  private scarePoolReady = false;

  constructor(private toggleBtn: HTMLElement) {
    this.toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.enabled) void this.primeAndEnable();
    });
    this.toggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!this.enabled) void this.primeAndEnable();
      }
    });
  }

  setActProfile(act: number): void {
    if (act === this.actProfile) return;
    this.actProfile = act;
    if (this.enabled) this.startAmbience();
  }

  async primeAndEnable(): Promise<void> {
    if (this.enabled) return;
    this.primed = true;
    this.enabled = true;
    audioGate.setOpen(true);
    await this.preloadScarePool();
    this.startAmbience();
    this.toggleBtn.classList.add('zh-audio--on', 'zh-audio-toggle--locked');
    this.toggleBtn.setAttribute('aria-label', 'Звук архива включён');
    this.toggleBtn.setAttribute('aria-disabled', 'true');
    events.emit(EVT.AUDIO_TOGGLE, { enabled: true });
  }

  /** Предзагрузка и «прогрев» звуков скримера сразу после включения звука */
  private async preloadScarePool(): Promise<void> {
    if (this.scarePoolReady) return;

    for (const src of SCARE_PRELOAD) {
      if (this.scarePool.has(src)) continue;
      const instances: HTMLAudioElement[] = [];
      for (let i = 0; i < SCARE_POOL_COPIES; i++) {
        const el = this.createAudio(src, 1);
        el.preload = 'auto';
        el.load();
        instances.push(el);
      }
      this.scarePool.set(src, instances);
    }

    const warm = this.scarePool.get(AUDIO.screams[0])?.[0];
    if (warm) {
      const prevVol = warm.volume;
      warm.volume = 0.001;
      try {
        await warm.play();
        warm.pause();
        warm.currentTime = 0;
      } catch { /* браузер иногда блокирует - пул всё равно поможет */ }
      warm.volume = prevVol;
    }

    this.scarePoolReady = true;
  }

  private playPooled(src: string, volume: number): void {
    if (!this.enabled) return;

    let pool = this.scarePool.get(src);
    if (!pool) {
      const el = this.createAudio(src, volume);
      void el.play().catch(() => {});
      return;
    }

    const el = pool.find((a) => a.paused || a.ended) ?? pool[0];
    el.volume = volume * this.masterVolume;
    try {
      el.currentTime = 0;
    } catch { /* ignore */ }
    void el.play().catch(() => {});
  }

  private createAudio(src: string, volume: number, loop = false): HTMLAudioElement {
    const el = new Audio(mediaUrl(src));
    el.preload = 'auto';
    el.loop = loop;
    el.volume = volume * this.masterVolume;
    return el;
  }

  private now(): number {
    return performance.now();
  }

  private isLongOneShotBusy(): boolean {
    return this.now() < this.longLockUntil;
  }

  private isMediumBusy(): boolean {
    return this.now() < this.mediumLockUntil;
  }

  private lockDuration(src: string): void {
    const ms = getDuration(src) * 1000;
    if (isLongTrack(src)) {
      this.longLockUntil = Math.max(this.longLockUntil, this.now() + ms + 600);
    } else if (isMediumTrack(src)) {
      this.mediumLockUntil = Math.max(this.mediumLockUntil, this.now() + ms + 350);
    }
  }

  private canPlay(src: string): boolean {
    if (isLongTrack(src) && this.isLongOneShotBusy()) return false;
    if (isMediumTrack(src) && this.isMediumBusy()) return false;
    if (!isLongTrack(src) && !isMediumTrack(src) && this.activeShort.length >= MAX_SHORT) return false;
    return true;
  }

  private trackShort(el: HTMLAudioElement): void {
    this.activeShort.push(el);
    el.addEventListener('ended', () => {
      this.activeShort = this.activeShort.filter((a) => a !== el);
      el.src = '';
    });
  }

  private playFile(src: string, volume: number, loop = false, force = false): HTMLAudioElement | null {
    if (!this.enabled && !force) return null;
    if (!force && !loop && !this.canPlay(src)) return null;

    const el = this.createAudio(src, volume, loop);
    if (!loop) this.lockDuration(src);
    void el.play().catch(() => {});

    if (loop) return el;
    this.trackShort(el);
    return el;
  }

  private startAmbience(): void {
    this.stopAmbience();
    const pool = this.actProfile >= 5
      ? AUDIO.ambientLoopsAct5
      : this.actProfile >= 4
      ? AUDIO.ambientLoopsAct4
      : this.actProfile >= 3
        ? AUDIO.ambientLoopsAct3
        : AUDIO.ambientLoops;
    const track = pickRandom(pool);
    const vol = this.actProfile >= 5 ? 0.52 : this.actProfile >= 4 ? 0.48 : this.actProfile >= 3 ? 0.42 : 0.35;
    this.ambientEl = this.playFile(track, vol, true);
  }

  private stopAmbience(): void {
    if (this.ambientEl) {
      this.ambientEl.pause();
      this.ambientEl.src = '';
      this.ambientEl = null;
    }
  }

  update(dt: number, atmosphereLevel: number): void {
    if (!this.enabled) return;
    const intensity = atmosphereLevel * (1 + (this.actProfile - 1) * 0.15);

    this.bedTimer -= dt;
    if (this.bedTimer <= 0 && !this.isLongOneShotBusy() && chance(0.0025 * (0.3 + intensity))) {
      const bed = pickRandom(AUDIO.beds);
      if (this.playFile(bed, 0.22)) {
        this.bedTimer = getDuration(bed) + randRange(8, 20);
      }
    }

    this.musicBoxTimer -= dt;
    if (this.musicBoxTimer <= 0 && !this.isLongOneShotBusy() && !this.isMediumBusy() && chance(0.003 * (0.25 + intensity))) {
      if (this.playFile(AUDIO.musicBox, 0.24)) {
        this.musicBoxTimer = getDuration(AUDIO.musicBox) + randRange(15, 35);
      }
    }

    this.eventTimer -= dt;
    if (this.eventTimer <= 0 && chance(0.005 * (0.35 + intensity))) {
      const ev = pickRandom(AUDIO.events);
      if (this.playFile(ev, 0.28)) {
        this.eventTimer = getDuration(ev) + randRange(6, 14);
      } else {
        this.eventTimer = 4 + randRange(0, 6);
      }
    }

    this.whisperTimer -= dt;
    if (this.whisperTimer <= 0 && chance(0.004 * (0.2 + intensity))) {
      const w = pickRandom(AUDIO.whispers);
      if (this.playFile(w, 0.2)) {
        this.whisperTimer = getDuration(w) + randRange(8, 18);
      } else {
        this.whisperTimer = 6 + randRange(0, 8);
      }
    }
  }

  playSfx(kind: SfxKind): void {
    if (!this.enabled) return;
    switch (kind) {
      case 'hover':
        this.playFile(pickRandom(AUDIO.static), 0.07);
        break;
      case 'click':
        this.playFile(pickRandom(AUDIO.impacts), 0.22);
        break;
      case 'paper':
        this.playFile(pickRandom([AUDIO.door, ...AUDIO.impacts.slice(0, 3)]), 0.16);
        break;
      case 'rune':
        this.playFile(pickRandom(AUDIO.impacts), 0.14);
        break;
      case 'heartbeat':
        this.playFile(AUDIO.heartbeat, 0.28);
        break;
      case 'creak':
        this.playFile(AUDIO.door, 0.22);
        break;
    }
  }

  playScare(type: ScareAudioKind): void {
    if (!this.enabled) return;
    const vol = 0.95;

    // Крик и удар - сразу, из прогретого пула
    this.playPooled(pickRandom(AUDIO.screams), vol);
    this.playPooled(pickRandom(AUDIO.impacts.slice(0, 4)), vol * 0.72);

    if (type === 'static') {
      this.playPooled(pickRandom(AUDIO.static), 0.55);
    }
    if (type === 'eyes') {
      this.playPooled(AUDIO.heartbeat, 0.45);
    }
    if (type === 'text') {
      this.playPooled(pickRandom(AUDIO.whispers), 0.35);
    }
    if (type === 'gif' && this.actProfile >= 3) {
      this.playPooled(pickRandom(AUDIO.impacts.slice(0, 3)), vol * 0.5);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isPrimed(): boolean {
    return this.primed;
  }
}
