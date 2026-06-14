import { chance, randPick, randRange } from '@/utils/math';
import { WHISPERS } from '@/config/constants';
import { SCREAM_GIFS, mediaUrl, pickRandom } from '@/config/media';
import { events, EVT } from '@/core/EventBus';
import type { AtmosphereSystem } from './AtmosphereSystem';
import type { AudioSystem } from './AudioSystem';
import type { PerformanceManager } from './PerformanceManager';

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
      this.trigger(this.normalizeType(type), true);
    });
  }

  private normalizeType(type: ScareType): ScareType {
    if (type === 'face' || type === 'static' || type === 'eyes') return 'gif';
    return type;
  }

  private preloadGifs(): void {
    if (this.preloaded) return;
    for (const gif of SCREAM_GIFS) {
      const img = new Image();
      img.src = mediaUrl(gif);
    }
    this.preloaded = true;
  }

  update(_dt: number): void {
    if (!this.performance.shouldRunAmbientSystems() || this.active) return;

    const elapsed = performance.now();
    if (elapsed - this.lastScare < this.minCooldown) return;

    const level = this.atmosphere.getLevel();
    const idle = this.atmosphere.isIdle();

    if (idle && chance(0.002 * (1 + level * 1.5))) {
      this.trigger('gif');
      return;
    }

    if (level > 0.25 && chance(0.0008 * (0.5 + level))) {
      this.trigger(randPick(['gif', 'gif', 'text'] as const));
    }
  }

  trigger(type: ScareType, force = false): void {
    if (this.active) return;
    if (!force && performance.now() - this.lastScare < this.minCooldown) return;

    this.preloadGifs();
    this.active = true;
    this.lastScare = performance.now();
    events.emit(EVT.SCARE, { type });

    document.body.classList.add('zh-scare-shake');

    if (type === 'text') {
      this.playTextScare();
    } else {
      this.playGifScare();
    }
  }

  private playGifScare(): void {
    const gifPath = pickRandom(SCREAM_GIFS);
    this.gifEl.src = mediaUrl(gifPath);
    this.textEl.textContent = '';
    this.overlay.classList.add('zh-scare--active', 'zh-scare--gif');
    this.flash.classList.add('zh-scare__flash--on');

    this.audio.playScare('gif');

    const duration = 900 + randRange(0, 400);
    setTimeout(() => {
      this.overlay.classList.remove('zh-scare--active', 'zh-scare--gif');
      this.flash.classList.remove('zh-scare__flash--on');
      this.gifEl.src = '';
      this.finish();
    }, duration);
  }

  private playTextScare(): void {
    this.overlay.classList.add('zh-scare--active', 'zh-scare--text');
    this.textEl.textContent = randPick(WHISPERS).toUpperCase();
    this.gifEl.src = '';
    this.audio.playScare('text');

    setTimeout(() => {
      this.overlay.classList.remove('zh-scare--active', 'zh-scare--text');
      this.textEl.textContent = '';
      this.finish();
    }, 1100);
  }

  private finish(): void {
    document.body.classList.remove('zh-scare-shake');
    this.active = false;
  }
}
