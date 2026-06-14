import { Scene } from './Scene';
import { SCENE_IDS, BRAND, RUNES } from '@/config/constants';
import { damp } from '@/utils/math';

export class HeroScene extends Scene {
  readonly id = SCENE_IDS.hero;
  readonly label = 'Вход';
  private titleEl!: HTMLElement;
  private subtitleEl!: HTMLElement;
  private authorEl!: HTMLElement;
  private runeRing!: HTMLElement;
  private enterSigil!: HTMLElement;
  private eyeEl!: HTMLElement;
  private glitchTimer = 0;
  private titleScale = 0.96;
  private introTime = 0;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-hero');

    this.runeRing = this.createEl('div', 'zh-hero__rune-ring');
    for (let i = 0; i < 12; i++) {
      const rune = this.createEl('span', 'zh-hero__rune', RUNES[i % RUNES.length]);
      rune.style.setProperty('--i', String(i));
      this.runeRing.appendChild(rune);
    }

    this.eyeEl = this.createEl('div', 'zh-hero__eye');
    this.eyeEl.innerHTML = '<div class="zh-hero__pupil"></div>';

    this.titleEl = this.createEl('h1', 'zh-hero__title', BRAND.name);
    this.subtitleEl = this.createEl('p', 'zh-hero__subtitle', BRAND.tagline);
    this.authorEl = this.createEl('p', 'zh-hero__author', `создано ${BRAND.author}`);

    this.enterSigil = this.createEl('div', 'zh-hero__sigil');
    this.enterSigil.setAttribute('role', 'button');
    this.enterSigil.setAttribute('tabindex', '0');
    this.enterSigil.innerHTML = `
      <span class="zh-hero__sigil-inner">
        <span class="zh-hero__sigil-text">войти</span>
        <span class="zh-hero__sigil-rune">ᛟ</span>
      </span>
    `;

    const scrollHint = this.createEl('div', 'zh-hero__scroll-hint');
    scrollHint.innerHTML = '<span></span><span>спускайся глубже</span>';

    inner.append(this.runeRing, this.eyeEl, this.titleEl, this.subtitleEl, this.authorEl, this.enterSigil, scrollHint);
    this.element.appendChild(inner);

    this.enterSigil.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('zh-navigate', { detail: { scene: SCENE_IDS.archive } }));
    });
    this.enterSigil.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.enterSigil.click();
      }
    });
  }

  protected onUpdate(dt: number): void {
    if (!this.active && this.progress < 0.01) return;

    if (this.active) {
      this.introTime = Math.min(this.introTime + dt, 2);
    }

    this.titleScale = damp(this.titleScale, 1, 2, dt);
    this.titleEl.style.transform = `scale(${this.titleScale})`;

    const intro = Math.min(1, this.introTime / 1.2);
    if (this.active) {
      this.titleEl.style.opacity = String(0.4 + intro * 0.6);
      this.subtitleEl.style.opacity = String(0.35 + intro * 0.55);
      this.authorEl.style.opacity = String(0.3 + intro * 0.45);
    } else {
      const fade = Math.max(0, 1 - this.progress * 2);
      this.titleEl.style.opacity = String(fade);
      this.subtitleEl.style.opacity = String(fade * 0.85);
      this.authorEl.style.opacity = String(fade * 0.7);
    }

    this.glitchTimer -= dt;
    if (this.glitchTimer <= 0 && Math.random() < 0.002) {
      this.titleEl.classList.add('zh-glitch-active');
      this.glitchTimer = 0.1;
      setTimeout(() => this.titleEl.classList.remove('zh-glitch-active'), 100);
    }

    if (this.active) {
      const ringRotation = performance.now() * 0.005;
      this.runeRing.style.transform = `rotate(${ringRotation}deg)`;
    }
  }
}
