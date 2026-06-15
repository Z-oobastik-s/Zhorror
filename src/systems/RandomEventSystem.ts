import { chance, randInt, randPick } from '@/utils/math';
import { RUNES, WHISPERS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { perf } from '@/systems/PerformanceManager';
import { quest } from '@/systems/QuestSystem';
import type { AtmosphereSystem } from './AtmosphereSystem';

type EventType =
  | 'flash'
  | 'ui_vanish'
  | 'rune'
  | 'text_glitch'
  | 'noise_burst'
  | 'whisper'
  | 'invert';

interface RandomEvent {
  type: EventType;
  minInterval: number;
  chance: number;
  minAtmosphere: number;
}

const EVENTS: RandomEvent[] = [
  { type: 'flash', minInterval: 45000, chance: 0.012, minAtmosphere: 0.1 },
  { type: 'ui_vanish', minInterval: 60000, chance: 0.008, minAtmosphere: 0.2 },
  { type: 'rune', minInterval: 30000, chance: 0.015, minAtmosphere: 0.05 },
  { type: 'text_glitch', minInterval: 40000, chance: 0.01, minAtmosphere: 0.15 },
  { type: 'noise_burst', minInterval: 35000, chance: 0.012, minAtmosphere: 0.1 },
  { type: 'whisper', minInterval: 55000, chance: 0.006, minAtmosphere: 0.3 },
  { type: 'invert', minInterval: 90000, chance: 0.004, minAtmosphere: 0.4 },
];

export class RandomEventSystem {
  private lastFired = new Map<EventType, number>();
  private overlay: HTMLElement;
  private active = false;

  constructor(parent: HTMLElement, private atmosphere: AtmosphereSystem) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'zh-random-overlay';
    parent.appendChild(this.overlay);
  }

  update(dt: number): void {
    if (!perf.shouldRunAmbientSystems() || this.active) return;
    if (quest.isOnHeroEntry()) return;
    const elapsed = performance.now();
    const level = this.atmosphere.getLevel();

    for (const ev of EVENTS) {
      if (level < ev.minAtmosphere) continue;
      const last = this.lastFired.get(ev.type) ?? 0;
      if (elapsed - last < ev.minInterval) continue;
      const adjustedChance = ev.chance * (1 + level * 0.5);
      if (!chance(adjustedChance * dt * 60)) continue;

      this.fire(ev.type);
      this.lastFired.set(ev.type, elapsed);
      break;
    }
  }

  private fire(type: EventType): void {
    this.active = true;
    events.emit(EVT.RANDOM_EVENT, { type });

    switch (type) {
      case 'flash':
        this.doFlash();
        break;
      case 'ui_vanish':
        this.doUiVanish();
        break;
      case 'rune':
        this.doRune();
        break;
      case 'text_glitch':
        this.doTextGlitch();
        break;
      case 'noise_burst':
        this.doNoiseBurst();
        break;
      case 'whisper':
        this.doWhisper();
        break;
      case 'invert':
        this.doInvert();
        break;
    }
  }

  private doFlash(): void {
    this.overlay.style.background = 'rgba(180, 20, 20, 0.08)';
    this.overlay.style.opacity = '1';
    setTimeout(() => {
      this.overlay.style.opacity = '0';
      this.active = false;
    }, 80);
  }

  private doUiVanish(): void {
    document.body.classList.add('zh-vanish');
    setTimeout(() => {
      document.body.classList.remove('zh-vanish');
      this.active = false;
    }, 120 + randInt(0, 80));
  }

  private doRune(): void {
    const el = document.createElement('div');
    el.className = 'zh-rune-flash';
    el.textContent = randPick(RUNES);
    el.style.left = `${randInt(5, 90)}%`;
    el.style.top = `${randInt(10, 80)}%`;
    this.overlay.appendChild(el);
    setTimeout(() => {
      el.remove();
      this.active = false;
    }, 800 + randInt(0, 400));
  }

  private doTextGlitch(): void {
    document.body.classList.add('zh-glitch-text');
    setTimeout(() => {
      document.body.classList.remove('zh-glitch-text');
      this.active = false;
    }, 200 + randInt(0, 150));
  }

  private doNoiseBurst(): void {
    document.body.classList.add('zh-noise-burst');
    setTimeout(() => {
      document.body.classList.remove('zh-noise-burst');
      this.active = false;
    }, 300);
  }

  private doWhisper(): void {
    const el = document.createElement('div');
    el.className = 'zh-whisper-flash';
    el.textContent = randPick(WHISPERS);
    this.overlay.appendChild(el);
    setTimeout(() => {
      el.remove();
      this.active = false;
    }, 1500);
  }

  private doInvert(): void {
    document.body.classList.add('zh-invert-flash');
    setTimeout(() => {
      document.body.classList.remove('zh-invert-flash');
      this.active = false;
    }, 60);
  }
}
