import { Scene } from './Scene';

import { SCENE_IDS, BRAND, RUNES, HERO_THREATS } from '@/config/constants';

import { HERO_BACKGROUND, HERO_HAND_LEFT, HERO_HAND_RIGHT, mediaUrl } from '@/config/media';

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

  private eyePupil!: HTMLElement;

  private threatsEl!: HTMLElement;

  private handsEl!: HTMLElement;

  private introTime = 0;

  private pupilX = 0;

  private pupilY = 0;

  private threatTimer = 5;

  private threatStarted = false;

  private handTimer = 6;

  private handsStarted = false;

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
    const iris = this.createEl('div', 'zh-hero__iris');
    this.eyePupil = this.createEl('div', 'zh-hero__pupil');
    iris.appendChild(this.eyePupil);
    this.eyeEl.appendChild(iris);
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

    const preloadLeft = new Image();
    preloadLeft.src = mediaUrl(HERO_HAND_LEFT);
    const preloadRight = new Image();
    preloadRight.src = mediaUrl(HERO_HAND_RIGHT);
    const preloadBg = new Image();
    preloadBg.src = mediaUrl(HERO_BACKGROUND);

    window.addEventListener('mousemove', this.trackEye, { passive: true });
  }

  private trackEye = (e: MouseEvent): void => {
    if (!this.active && !this.visible) return;
    const rect = this.eyeEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    this.pupilX = damp(this.pupilX, Math.max(-22, Math.min(22, (e.clientX - cx) / 18)), 14, 0.018);
    this.pupilY = damp(this.pupilY, Math.max(-14, Math.min(14, (e.clientY - cy) / 18)), 14, 0.018);
    this.eyePupil.style.transform = `translate(${this.pupilX}px, ${this.pupilY}px)`;
  };

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
    if (!this.active && !this.visible) return;

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

    if (!this.threatStarted && (this.active || this.visible)) {
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
          if (this.active || this.visible) this.showThreat();
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
          if (this.active || this.visible) this.showHand();
        }, randInt(120, 480));
      }
      this.handTimer = randRange(10, 18);
    }
  }
}
