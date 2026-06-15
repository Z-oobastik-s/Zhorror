import { Scene } from './Scene';

import { SCENE_IDS, BRAND, RUNES, HERO_THREATS } from '@/config/constants';

import {
  HERO_BACKGROUND,
  HERO_EYE_FRAMES,
  HERO_EYE_RETINA,
  HERO_HAND_LEFT,
  HERO_HAND_RIGHT,
  mediaUrl,
} from '@/config/media';

import { quest } from '@/systems/QuestSystem';

import { damp, randInt, randPick, randRange } from '@/utils/math';

const HERO_WHISPERS = [
  'они смотрят',
  'не входи',
  'слишком поздно',
  'ты уже здесь',
  'архив не спит',
  'беги',
  'закрой глаза',
  'это ловушка',
] as const;

const HEADLINE_LINES = [
  'архив,',
  'который не',
  'должен существовать',
] as const;

const RETINA_MAX_X = 22;

const RETINA_MAX_Y = 14;

const BLINK_DURATION = 0.34;

export class HeroScene extends Scene {
  readonly id = SCENE_IDS.hero;

  readonly label = 'Вход';

  private labelEl!: HTMLElement;

  private headlineEl!: HTMLElement;

  private headlineLines: HTMLElement[] = [];

  private authorEl!: HTMLElement;

  private loreEl!: HTMLElement;

  private runeRing!: HTMLElement;

  private eyeEl!: HTMLElement;

  private eyeRetinaEl!: HTMLImageElement;

  private eyeLidEl!: HTMLImageElement;

  private threatsEl!: HTMLElement;

  private handsEl!: HTMLElement;

  private introTime = 0;

  private lookTargetX = 0;

  private lookTargetY = 0;

  private retinaX = 0;

  private retinaY = 0;

  private retinaFrame = 0;

  private eyeFrame = 0;

  private blinkSquash = 1;

  private blinkActive = false;

  private blinkTime = 0;

  private blinkTimer = 7;

  private blinkChain = 0;

  private threatTimer = 5;

  private threatStarted = false;

  private handTimer = 6;

  private handsStarted = false;

  private wasActive = false;

  protected build(): void {
    const atmo = this.createEl('div', 'zh-hero__atmo');
    const bg = this.createEl('div', 'zh-hero__bg');
    bg.style.backgroundImage = `url("${mediaUrl(HERO_BACKGROUND)}")`;
    atmo.appendChild(bg);
    atmo.append(
      this.createEl('div', 'zh-hero__fog zh-hero__fog--a'),
      this.createEl('div', 'zh-hero__fog zh-hero__fog--b'),
      this.createEl('div', 'zh-hero__fog zh-hero__fog--c'),
      this.createEl('div', 'zh-hero__veil'),
      this.createEl('div', 'zh-hero__scratches'),
      this.createEl('div', 'zh-hero__grid'),
    );
    const whispers = this.createEl('div', 'zh-hero__whispers');
    HERO_WHISPERS.forEach((text, i) => {
      const w = this.createEl('span', 'zh-hero__whisper', text);
      w.style.setProperty('--wi', String(i));
      whispers.appendChild(w);
    });
    atmo.appendChild(whispers);
    this.element.appendChild(atmo);

    const corners = this.createEl('div', 'zh-hero__corners');
    for (let i = 0; i < 4; i++) {
      const corner = this.createEl('div', `zh-hero__corner zh-hero__corner--${i}`);
      corner.append(
        this.createEl('span', 'zh-hero__corner-rune', RUNES[i * 3 % RUNES.length]),
        this.createEl('span', 'zh-hero__corner-line'),
      );
      corners.appendChild(corner);
    }
    this.element.appendChild(corners);

    const sides = this.createEl('div', 'zh-hero__side-runes');
    for (const side of ['left', 'right'] as const) {
      const col = this.createEl('div', `zh-hero__side-col zh-hero__side-col--${side}`);
      for (let j = 0; j < 9; j++) {
        col.appendChild(this.createEl('span', 'zh-hero__side-rune', RUNES[(j + (side === 'right' ? 5 : 0)) % RUNES.length]));
      }
      sides.appendChild(col);
    }
    this.element.appendChild(sides);

    this.handsEl = this.createEl('div', 'zh-hero__hands');
    this.element.appendChild(this.handsEl);

    this.threatsEl = this.createEl('div', 'zh-hero__threats');
    this.element.appendChild(this.threatsEl);

    const inner = this.createEl('div', 'zh-scene__inner zh-hero');

    const rings = this.createEl('div', 'zh-hero__rings');
    const core = this.createEl('div', 'zh-hero__core');
    core.append(
      this.createEl('div', 'zh-hero__ring zh-hero__ring--outer'),
      this.createEl('div', 'zh-hero__ring zh-hero__ring--mid'),
      this.createEl('div', 'zh-hero__ring zh-hero__ring--inner'),
      this.createEl('div', 'zh-hero__orbit'),
    );

    this.runeRing = this.createEl('div', 'zh-hero__rune-ring');
    for (let i = 0; i < 12; i++) {
      const rune = this.createEl('span', 'zh-hero__rune', RUNES[i % RUNES.length]);
      rune.style.setProperty('--i', String(i));
      this.runeRing.appendChild(rune);
    }
    core.appendChild(this.runeRing);

    this.eyeEl = this.createEl('div', 'zh-hero__eye');
    const body = this.createEl('div', 'zh-hero__eye-body');
    const slot = this.createEl('div', 'zh-hero__eye-slot');
    this.eyeRetinaEl = document.createElement('img');
    this.eyeRetinaEl.className = 'zh-hero__eye-retina';
    this.eyeRetinaEl.src = mediaUrl(HERO_EYE_RETINA[0]);
    this.eyeRetinaEl.alt = '';
    this.eyeRetinaEl.draggable = false;
    this.eyeRetinaEl.decoding = 'async';
    slot.appendChild(this.eyeRetinaEl);
    body.appendChild(slot);

    this.eyeLidEl = document.createElement('img');
    this.eyeLidEl.className = 'zh-hero__eye-lid';
    this.eyeLidEl.src = mediaUrl(HERO_EYE_FRAMES[0]);
    this.eyeLidEl.alt = '';
    this.eyeLidEl.draggable = false;
    this.eyeLidEl.decoding = 'async';
    body.appendChild(this.eyeLidEl);
    this.eyeEl.appendChild(body);
    core.appendChild(this.eyeEl);

    rings.appendChild(core);
    inner.appendChild(rings);

    const copy = this.createEl('div', 'zh-hero__copy');
    this.labelEl = this.createEl('p', 'zh-hero__label', '◈ порог входа');
    this.headlineEl = this.createEl('div', 'zh-hero__headline');
    HEADLINE_LINES.forEach((line, i) => {
      const el = this.createEl('span', 'zh-hero__headline-line', line);
      el.style.setProperty('--line-i', String(i));
      this.headlineLines.push(el);
      this.headlineEl.appendChild(el);
    });
    this.authorEl = this.createEl('p', 'zh-hero__author', `создано ${BRAND.author}`);
    this.loreEl = this.createEl('p', 'zh-hero__lore', 'архив подписан именем хозяина. терминус примет только его');
    copy.append(this.labelEl, this.headlineEl, this.authorEl, this.loreEl);
    inner.appendChild(copy);

    const sigil = this.createEl('button', 'zh-hero__sigil') as HTMLButtonElement;
    sigil.type = 'button';
    sigil.innerHTML = [
      '<span class="zh-hero__sigil-bracket">⟨</span>',
      '<span class="zh-hero__sigil-body">',
      '<span class="zh-hero__sigil-text">войти в архив</span>',
      '<span class="zh-hero__sigil-rune">ᛟ</span>',
      '</span>',
      '<span class="zh-hero__sigil-bracket">⟩</span>',
    ].join('');
    sigil.addEventListener('click', () => {
      if (!quest.canInteract()) return;
      quest.enterArchive();
      window.dispatchEvent(new CustomEvent('zh-navigate', { detail: { scene: SCENE_IDS.archive } }));
    });
    inner.appendChild(sigil);

    const hint = this.createEl('div', 'zh-hero__scroll-hint');
    hint.innerHTML = '<span></span><span>листай вниз</span>';
    inner.appendChild(hint);

    this.element.appendChild(inner);

    [...HERO_EYE_FRAMES, ...HERO_EYE_RETINA, HERO_HAND_LEFT, HERO_HAND_RIGHT, HERO_BACKGROUND].forEach((src) => {
      const img = new Image();
      img.src = mediaUrl(src);
    });

    window.addEventListener('mousemove', this.trackEye, { passive: true });
    document.documentElement.addEventListener('mouseleave', this.releaseEyeLook, { passive: true });
    document.addEventListener('visibilitychange', this.onPageHidden);
  }

  private releaseEyeLook = (): void => {
    this.lookTargetX = 0;
    this.lookTargetY = 0;
  };

  private onPageHidden = (): void => {
    if (document.visibilityState !== 'visible') this.releaseEyeLook();
  };

  private resetEyePose(): void {
    this.lookTargetX = 0;
    this.lookTargetY = 0;
    this.retinaX = 0;
    this.retinaY = 0;

    if (this.retinaFrame !== 0) {
      this.retinaFrame = 0;
      this.eyeRetinaEl.src = mediaUrl(HERO_EYE_RETINA[0]);
    }
    if (this.eyeFrame !== 0) {
      this.eyeFrame = 0;
      this.eyeLidEl.src = mediaUrl(HERO_EYE_FRAMES[0]);
    }

    this.eyeRetinaEl.style.setProperty('--rx', '0px');
    this.eyeRetinaEl.style.setProperty('--ry', '0px');
    this.eyeEl.style.setProperty('--eye-tilt', '0deg');
    this.eyeLidEl.style.setProperty('--lid-x', '0px');
    this.eyeLidEl.style.setProperty('--lid-y', '0px');
  }

  private trackEye = (e: MouseEvent): void => {
    if (!this.active) return;
    const rect = this.eyeEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / Math.max(rect.width * 0.28, 1);
    const dy = (e.clientY - cy) / Math.max(rect.height * 0.32, 1);
    this.lookTargetX = Math.max(-RETINA_MAX_X, Math.min(RETINA_MAX_X, dx * RETINA_MAX_X));
    this.lookTargetY = Math.max(-RETINA_MAX_Y, Math.min(RETINA_MAX_Y, dy * RETINA_MAX_Y));
  };

  private pickLookFrame(nx: number, ny: number): number {
    if (Math.abs(nx) < 0.22 && Math.abs(ny) < 0.22) return 0;
    if (Math.abs(nx) >= Math.abs(ny)) return nx < 0 ? 1 : 2;
    return 3;
  }

  private squashBlink(t: number): number {
    if (t < 0.38) {
      const p = t / 0.38;
      return 1 - p * p * 0.94;
    }
    const p = (t - 0.38) / 0.62;
    return 0.06 + (1 - (1 - p) * (1 - p)) * 0.94;
  }

  private updateBlink(dt: number): void {
    if (!this.blinkActive) {
      this.blinkTimer -= dt;
      if (this.blinkTimer > 0) return;
      this.blinkActive = true;
      this.blinkTime = 0;
    }

    this.blinkTime += dt;
    const t = Math.min(1, this.blinkTime / BLINK_DURATION);
    this.blinkSquash = this.squashBlink(t);
    this.eyeEl.style.setProperty('--eye-squash', String(this.blinkSquash));

    if (t < 1) return;

    this.blinkActive = false;
    this.blinkSquash = 1;
    this.eyeEl.style.setProperty('--eye-squash', '1');

    if (this.blinkChain > 0) {
      this.blinkChain -= 1;
      this.blinkActive = true;
      this.blinkTime = 0;
      return;
    }

    this.blinkTimer = randRange(5, 10);
    if (Math.random() > 0.78) this.blinkChain = 1;
  }

  private updateEyeMotion(dt: number): void {
    const t = performance.now() * 0.001;
    const breathe = 1 + Math.sin(t * 1.6) * 0.014 + Math.sin(t * 2.9) * 0.006;
    const tilt = (this.retinaX / RETINA_MAX_X) * 2.8;
    const lidShiftX = this.retinaX * 0.12;
    const lidShiftY = this.retinaY * 0.08;

    this.eyeEl.style.setProperty('--eye-breathe', String(breathe));
    this.eyeEl.style.setProperty('--eye-tilt', `${tilt}deg`);
    this.eyeLidEl.style.setProperty('--lid-x', `${lidShiftX}px`);
    this.eyeLidEl.style.setProperty('--lid-y', `${lidShiftY}px`);

    if (this.blinkActive) return;

    this.eyeEl.style.setProperty('--eye-squash', String(damp(this.blinkSquash, 1, 16, dt)));
  }

  private updateRetina(dt: number): void {
    this.retinaX = damp(this.retinaX, this.lookTargetX, 11, dt);
    this.retinaY = damp(this.retinaY, this.lookTargetY, 11, dt);

    const nx = this.retinaX / RETINA_MAX_X;
    const ny = this.retinaY / RETINA_MAX_Y;
    const frame = this.pickLookFrame(nx, ny);
    if (frame !== this.retinaFrame) {
      this.retinaFrame = frame;
      this.eyeRetinaEl.src = mediaUrl(HERO_EYE_RETINA[frame]);
    }
    if (frame !== this.eyeFrame) {
      this.eyeFrame = frame;
      this.eyeLidEl.src = mediaUrl(HERO_EYE_FRAMES[frame]);
    }

    this.eyeRetinaEl.style.setProperty('--rx', `${this.retinaX}px`);
    this.eyeRetinaEl.style.setProperty('--ry', `${this.retinaY}px`);
  }

  private showThreat(): void {
    const el = this.createEl('span', 'zh-hero__threat', randPick(HERO_THREATS));
    const side = randInt(0, 3);
    if (side === 0) {
      el.style.left = `${randInt(3, 22)}%`;
      el.style.top = `${randInt(8, 82)}%`;
    } else if (side === 1) {
      el.style.right = `${randInt(3, 22)}%`;
      el.style.left = 'auto';
      el.style.top = `${randInt(8, 82)}%`;
    } else if (side === 2) {
      el.style.left = `${randInt(12, 76)}%`;
      el.style.top = `${randInt(4, 14)}%`;
    } else {
      el.style.left = `${randInt(12, 76)}%`;
      el.style.bottom = `${randInt(6, 18)}%`;
      el.style.top = 'auto';
    }
    this.threatsEl.appendChild(el);
    requestAnimationFrame(() => el.classList.add('zh-hero__threat--visible'));
    window.setTimeout(() => {
      el.classList.remove('zh-hero__threat--visible');
      window.setTimeout(() => el.remove(), 900);
    }, 2800 + randInt(0, 900));
  }

  private showHand(forceSide?: 'left' | 'right'): void {
    const isLeft = forceSide ? forceSide === 'left' : Math.random() > 0.5;
    const img = document.createElement('img');
    img.className = `zh-hero__hand zh-hero__hand--${isLeft ? 'left' : 'right'}`;
    img.src = mediaUrl(isLeft ? HERO_HAND_LEFT : HERO_HAND_RIGHT);
    img.alt = '';
    img.draggable = false;
    img.loading = 'eager';
    img.decoding = 'async';

    img.style.top = `${randInt(6, 68)}%`;
    if (isLeft) {
      img.style.left = `${randInt(-16, 4)}%`;
    } else {
      img.style.right = `${randInt(-16, 4)}%`;
    }
    img.style.setProperty('--hand-rot', `${randInt(-22, 22)}deg`);
    img.style.setProperty('--hand-scale', String(randRange(0.9, 1.12)));

    this.handsEl.appendChild(img);
    requestAnimationFrame(() => img.classList.add('zh-hero__hand--visible'));

    const hold = 1400 + randInt(0, 1600);
    window.setTimeout(() => {
      img.classList.remove('zh-hero__hand--visible');
      window.setTimeout(() => img.remove(), 1500);
    }, hold);
  }

  protected onUpdate(dt: number): void {
    if (!this.active) {
      if (this.wasActive) {
        this.resetEyePose();
        this.wasActive = false;
      }
      return;
    }

    this.wasActive = true;

    this.updateRetina(dt);
    this.updateBlink(dt);
    this.updateEyeMotion(dt);

    this.introTime = Math.min(this.introTime + dt, 2.2);
    const v = Math.min(1, this.introTime / 0.7);

    this.labelEl.style.opacity = String(v * 0.9);
    this.headlineLines.forEach((el, i) => {
      const lv = Math.max(0, Math.min(1, (this.introTime - i * 0.14) / 0.6));
      el.style.opacity = String(lv);
      if (this.introTime >= 2.2 && i === this.headlineLines.length - 1) {
        this.headlineEl.classList.add('zh-hero__headline--live');
      }
    });
    this.authorEl.style.opacity = String(Math.max(0, Math.min(1, (this.introTime - 0.45) / 0.55)) * 0.8);
    this.loreEl.style.opacity = String(Math.max(0, Math.min(1, (this.introTime - 0.65) / 0.55)) * 0.65);
    this.runeRing.style.setProperty('--rune-o', String(v * 0.55));
    this.runeRing.style.transform = `rotate(${performance.now() * 0.022}deg)`;
    this.eyeEl.style.opacity = String(Math.max(0.35, v));

    if (!this.threatStarted && this.active) {
      this.threatStarted = true;
      this.threatTimer = 3;
      this.handsStarted = true;
      this.handTimer = randRange(4, 7);
    }

    if (!this.threatStarted) return;

    this.threatTimer -= dt;
    if (this.threatTimer <= 0) {
      this.showThreat();
      if (Math.random() > 0.55) {
        window.setTimeout(() => {
          if (this.active) this.showThreat();
        }, randInt(400, 900));
      }
      this.threatTimer = randRange(5, 10);
    }

    if (!this.handsStarted) return;

    this.handTimer -= dt;
    if (this.handTimer <= 0) {
      this.showHand();
      if (Math.random() > 0.6) {
        window.setTimeout(() => {
          if (this.active) this.showHand();
        }, randInt(120, 480));
      }
      this.handTimer = randRange(10, 18);
    }
  }
}
