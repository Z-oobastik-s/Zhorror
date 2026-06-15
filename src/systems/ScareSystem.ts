import { chance, randPick, randRange } from '@/utils/math';
import { WHISPERS } from '@/config/constants';
import { SCREAM_GIFS_ALL, mediaUrl, pickScareGif, type ScareAudioKind } from '@/config/media';
import { events, EVT } from '@/core/EventBus';
import type { AtmosphereSystem } from './AtmosphereSystem';
import type { AudioSystem } from './AudioSystem';
import type { PerformanceManager } from './PerformanceManager';
import { quest } from './QuestSystem';
import { isAmbientScareBlocked } from './MinigameFocus';

type ScareType = 'gif' | 'face' | 'static' | 'eyes' | 'text';

export class ScareSystem {
  private overlay: HTMLElement;
  private flash: HTMLElement;
  private gifEl: HTMLImageElement;
  private textEl: HTMLElement;
  private active = false;
  private lastScare = 0;
  private readonly minCooldown = 18000;
  private preloaded = false;
  private lastGifPath = '';
  private recentGifs: string[] = [];
  private readonly recentGifLimit = 6;

  constructor(
    parent: HTMLElement,
    private atmosphere: AtmosphereSystem,
    private audio: AudioSystem,
    private performance: PerformanceManager,
  ) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'zh-scare';
    this.overlay.setAttribute('aria-hidden', 'true');

    this.flash = document.createElement('div');
    this.flash.className = 'zh-scare__flash';

    this.gifEl = document.createElement('img');
    this.gifEl.className = 'zh-scare__gif';
    this.gifEl.alt = '';
    this.gifEl.draggable = false;

    this.textEl = document.createElement('div');
    this.textEl.className = 'zh-scare__text';

    this.overlay.append(this.flash, this.gifEl, this.textEl);
    parent.appendChild(this.overlay);

    events.on(EVT.SCARE_REQUEST, (payload) => {
      const type = (payload as { type?: ScareType }).type ?? 'gif';
      this.trigger(type, true);
    });
  }

  private toAudioKind(type: ScareType): ScareAudioKind {
    if (type === 'text') return 'text';
    if (type === 'static') return 'static';
    if (type === 'eyes') return 'eyes';
    return 'gif';
  }

  private normalizeVisual(type: ScareType): 'gif' | 'text' {
    if (type === 'text') return 'text';
    return 'gif';
  }

  private preloadGifs(): void {
    if (this.preloaded) return;
    for (const gif of SCREAM_GIFS_ALL) {
      const img = new Image();
      img.src = mediaUrl(gif);
    }
    this.preloaded = true;
  }

  private pickGif(): string {
    const act = quest.getAct();
    let path = pickScareGif(act, this.lastGifPath);
    for (let i = 0; i < 12 && this.recentGifs.includes(path); i++) {
      path = pickScareGif(act, path);
    }
    this.lastGifPath = path;
    this.recentGifs.push(path);
    if (this.recentGifs.length > this.recentGifLimit) {
      this.recentGifs.shift();
    }
    return path;
  }

  update(_dt: number): void {
    if (!this.performance.shouldRunAmbientSystems() || this.active) return;
    if (isAmbientScareBlocked()) return;

    const elapsed = performance.now();
    if (elapsed - this.lastScare < this.minCooldown) return;

    const level = this.atmosphere.getLevel();
    const idle = this.atmosphere.isIdle();
    const act = quest.getAct();
    const actBoost = act >= 5 ? 2.8 : act >= 4 ? 2.2 : act >= 3 ? 1.5 : 1;

    if (idle && chance(0.002 * (1 + level * actBoost))) {
      this.trigger('gif');
      return;
    }

    if (level > 0.25 && chance(0.0008 * (0.5 + level) * actBoost)) {
      this.trigger(randPick(['gif', 'gif', 'text'] as const));
    }
  }

  isScareActive(): boolean {
    return this.active;
  }

  trigger(type: ScareType, force = false): void {
    if (this.active) return;
    if (!force && performance.now() - this.lastScare < this.minCooldown) return;

    this.preloadGifs();
    this.active = true;
    this.lastScare = performance.now();
    events.emit(EVT.SCARE, { type });

    const audioKind = this.toAudioKind(type);
    document.body.classList.add('zh-scare-shake');

    if (this.normalizeVisual(type) === 'text') {
      this.playTextScare(audioKind);
    } else {
      this.playGifScare(audioKind);
    }
  }

  private playGifScare(audioKind: ScareAudioKind): void {
    this.audio.playScare(audioKind);

    const gifPath = this.pickGif();
    this.gifEl.src = mediaUrl(gifPath);
    this.textEl.textContent = '';
    this.overlay.classList.add('zh-scare--active', 'zh-scare--gif');
    this.flash.classList.add('zh-scare__flash--on');

    const act = quest.getAct();
    const duration = act >= 5 ? 1300 + randRange(0, 600) : act >= 4 ? 1100 + randRange(0, 500) : 900 + randRange(0, 400);
    setTimeout(() => {
      this.overlay.classList.remove('zh-scare--active', 'zh-scare--gif');
      this.flash.classList.remove('zh-scare__flash--on');
      this.gifEl.src = '';
      this.finish();
    }, duration);
  }

  private playTextScare(audioKind: ScareAudioKind): void {
    this.audio.playScare(audioKind);
    this.overlay.classList.add('zh-scare--active', 'zh-scare--text');
    this.textEl.textContent = randPick(WHISPERS).toUpperCase();
    this.gifEl.src = '';

    setTimeout(() => {
      this.overlay.classList.remove('zh-scare--active', 'zh-scare--text');
      this.textEl.textContent = '';
      this.finish();
    }, 1100);
  }

  private finish(): void {
    document.body.classList.remove('zh-scare-shake');
    this.active = false;
    events.emit(EVT.SCARE_END);
  }
}
