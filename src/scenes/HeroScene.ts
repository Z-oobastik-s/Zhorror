import { Scene } from './Scene';

import { SCENE_IDS, BRAND, RUNES, HERO_THREATS } from '@/config/constants';

import { quest } from '@/systems/QuestSystem';

import { damp, randInt, randPick, randRange } from '@/utils/math';

export class HeroScene extends Scene {
  readonly id = SCENE_IDS.hero;

  readonly label = 'Вход';

  private labelEl!: HTMLElement;

  private headlineEl!: HTMLElement;

  private authorEl!: HTMLElement;

  private loreEl!: HTMLElement;

  private runeRing!: HTMLElement;

  private eyeEl!: HTMLElement;

  private eyePupil!: HTMLElement;

  private threatsEl!: HTMLElement;

  private introTime = 0;

  private pupilX = 0;

  private pupilY = 0;

  private threatTimer = 5;

  private threatStarted = false;

  protected build(): void {
    this.threatsEl = this.createEl('div', 'zh-hero__threats');
    this.element.appendChild(this.threatsEl);

    const inner = this.createEl('div', 'zh-scene__inner zh-hero');
    const stage = this.createEl('div', 'zh-hero__stage');

    this.runeRing = this.createEl('div', 'zh-hero__rune-ring');
    for (let i = 0; i < 12; i++) {
      const rune = this.createEl('span', 'zh-hero__rune', RUNES[i % RUNES.length]);
      rune.style.setProperty('--i', String(i));
      this.runeRing.appendChild(rune);
    }
    stage.appendChild(this.runeRing);

    this.eyeEl = this.createEl('div', 'zh-hero__eye');
    const iris = this.createEl('div', 'zh-hero__iris');
    this.eyePupil = this.createEl('div', 'zh-hero__pupil');
    iris.appendChild(this.eyePupil);
    this.eyeEl.appendChild(iris);
    stage.appendChild(this.eyeEl);

    this.labelEl = this.createEl('p', 'zh-hero__label', '◈ порог входа');
    this.headlineEl = this.createEl('p', 'zh-hero__headline', BRAND.tagline);
    this.authorEl = this.createEl('p', 'zh-hero__author', `создано ${BRAND.author}`);
    this.loreEl = this.createEl('p', 'zh-hero__lore', 'архив подписан именем хозяина. терминус примет только его');

    stage.append(this.labelEl, this.headlineEl, this.authorEl, this.loreEl);
    inner.appendChild(stage);

    const sigil = this.createEl('div', 'zh-hero__sigil');
    sigil.setAttribute('role', 'button');
    sigil.setAttribute('tabindex', '0');
    sigil.innerHTML = '<span class="zh-hero__sigil-inner"><span class="zh-hero__sigil-text">войти в архив</span><span class="zh-hero__sigil-rune">ᛟ</span></span>';
    sigil.addEventListener('click', () => {
      if (!quest.canInteract()) return;
      quest.enterArchive();
      window.dispatchEvent(new CustomEvent('zh-navigate', { detail: { scene: SCENE_IDS.archive } }));
    });
    sigil.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sigil.click();
      }
    });

    inner.appendChild(sigil);

    const hint = this.createEl('div', 'zh-hero__scroll-hint');
    hint.innerHTML = '<span></span><span>листай вниз</span>';
    inner.appendChild(hint);

    this.element.appendChild(inner);

    window.addEventListener('mousemove', this.trackEye, { passive: true });
  }

  private trackEye = (e: MouseEvent): void => {
    if (!this.active && !this.visible) return;
    const rect = this.eyeEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    this.pupilX = damp(this.pupilX, Math.max(-18, Math.min(18, (e.clientX - cx) / 20)), 14, 0.018);
    this.pupilY = damp(this.pupilY, Math.max(-12, Math.min(12, (e.clientY - cy) / 20)), 14, 0.018);
    this.eyePupil.style.transform = `translate(${this.pupilX}px, ${this.pupilY}px)`;
  };

  private showThreat(): void {
    const el = this.createEl('span', 'zh-hero__threat', randPick(HERO_THREATS));
    const side = randInt(0, 3);
    if (side === 0) {
      el.style.left = `${randInt(4, 20)}%`;
      el.style.top = `${randInt(12, 78)}%`;
    } else if (side === 1) {
      el.style.right = `${randInt(4, 20)}%`;
      el.style.left = 'auto';
      el.style.top = `${randInt(12, 78)}%`;
    } else if (side === 2) {
      el.style.left = `${randInt(18, 70)}%`;
      el.style.top = `${randInt(6, 16)}%`;
    } else {
      el.style.left = `${randInt(18, 70)}%`;
      el.style.bottom = `${randInt(8, 20)}%`;
      el.style.top = 'auto';
    }
    this.threatsEl.appendChild(el);
    requestAnimationFrame(() => el.classList.add('zh-hero__threat--visible'));
    window.setTimeout(() => {
      el.classList.remove('zh-hero__threat--visible');
      window.setTimeout(() => el.remove(), 900);
    }, 3200 + randInt(0, 800));
  }

  protected onUpdate(dt: number): void {
    if (!this.active && !this.visible) return;

    this.introTime = Math.min(this.introTime + dt, 1.6);
    const v = Math.min(1, this.introTime / 0.65);

    this.labelEl.style.opacity = String(v * 0.85);
    this.headlineEl.style.opacity = String(v);
    this.authorEl.style.opacity = String(v * 0.75);
    this.loreEl.style.opacity = String(v * 0.6);
    this.runeRing.style.opacity = String(v * 0.5);
    this.runeRing.style.transform = `rotate(${performance.now() * 0.004}deg)`;

    if (!this.threatStarted && (this.active || this.visible)) {
      this.threatStarted = true;
      this.threatTimer = 4;
    }

    if (!this.threatStarted) return;

    this.threatTimer -= dt;
    if (this.threatTimer <= 0) {
      this.showThreat();
      this.threatTimer = randRange(7, 13);
    }
  }
}
