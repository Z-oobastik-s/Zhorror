import { Scene } from './Scene';

import { SCENE_IDS, BRAND, RUNES, HERO_THREATS } from '@/config/constants';

import { quest } from '@/systems/QuestSystem';

import { damp, randInt, randPick, randRange } from '@/utils/math';

export class HeroScene extends Scene {
  readonly id = SCENE_IDS.hero;

  readonly label = 'Вход';

  private titleEl!: HTMLElement;

  private subtitleEl!: HTMLElement;

  private authorEl!: HTMLElement;

  private loreEl!: HTMLElement;

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

    const frame = this.createEl('div', 'zh-hero__frame');

    const runeRing = this.createEl('div', 'zh-hero__rune-ring');
    for (let i = 0; i < 8; i++) {
      const rune = this.createEl('span', 'zh-hero__rune', RUNES[i % RUNES.length]);
      rune.style.setProperty('--i', String(i));
      runeRing.appendChild(rune);
    }
    frame.appendChild(runeRing);

    this.eyeEl = this.createEl('div', 'zh-hero__eye');
    this.eyePupil = this.createEl('div', 'zh-hero__pupil');
    this.eyeEl.appendChild(this.eyePupil);

    this.titleEl = this.createEl('h1', 'zh-hero__title', BRAND.name);
    this.subtitleEl = this.createEl('p', 'zh-hero__subtitle', BRAND.tagline);
    this.authorEl = this.createEl('p', 'zh-hero__author', `создано ${BRAND.author}`);
    this.loreEl = this.createEl('p', 'zh-hero__lore', 'архив подписан именем хозяина. терминус примет только его');

    frame.append(this.eyeEl, this.titleEl, this.subtitleEl, this.authorEl, this.loreEl);
    inner.appendChild(frame);

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
    const dx = (e.clientX - cx) / 16;
    const dy = (e.clientY - cy) / 16;
    const lim = (v: number, m: number) => Math.max(-m, Math.min(m, v));
    this.pupilX = damp(this.pupilX, lim(dx, 28), 14, 0.02);
    this.pupilY = damp(this.pupilY, lim(dy, 16), 14, 0.02);
    this.eyePupil.style.transform = `translate(${this.pupilX}px, ${this.pupilY}px)`;
  };

  private showThreat(): void {
    const el = this.createEl('span', 'zh-hero__threat', randPick(HERO_THREATS));
    const side = randInt(0, 3);
    if (side === 0) {
      el.style.left = `${randInt(4, 22)}%`;
      el.style.top = `${randInt(12, 78)}%`;
    } else if (side === 1) {
      el.style.right = `${randInt(4, 22)}%`;
      el.style.left = 'auto';
      el.style.top = `${randInt(12, 78)}%`;
    } else if (side === 2) {
      el.style.left = `${randInt(20, 72)}%`;
      el.style.top = `${randInt(6, 18)}%`;
    } else {
      el.style.left = `${randInt(20, 72)}%`;
      el.style.bottom = `${randInt(10, 22)}%`;
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

    this.introTime = Math.min(this.introTime + dt, 1.4);
    const v = Math.min(1, this.introTime / 0.6);

    this.titleEl.style.opacity = String(v);
    this.subtitleEl.style.opacity = String(v * 0.9);
    this.authorEl.style.opacity = String(v * 0.75);
    this.loreEl.style.opacity = String(v * 0.65);

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
