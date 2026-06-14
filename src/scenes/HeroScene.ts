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
  private titleScale = 0.95;

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

    this.titleEl.style.opacity = '0';
    this.subtitleEl.style.opacity = '0';
    this.authorEl.style.opacity = '0';
  }

  protected onUpdate(dt: number): void {
    if (!this.active && this.progress < 0.01) return;

    this.titleScale = damp(this.titleScale, 1, 1.5, dt);
    this.titleEl.style.transform = `scale(${this.titleScale})`;

    const reveal = Math.min(1, this.progress * 3 + (this.active ? 0.3 : 0));
    this.titleEl.style.opacity = String(Math.min(1, reveal));
    this.subtitleEl.style.opacity = String(Math.min(1, reveal * 0.8 - 0.1));
    this.authorEl.style.opacity = String(Math.min(1, reveal * 0.6 - 0.2));

    this.glitchTimer -= dt;
    if (this.glitchTimer <= 0 && Math.random() < 0.003) {
      this.titleEl.classList.add('zh-glitch-active');
      this.glitchTimer = 0.1;
      setTimeout(() => this.titleEl.classList.remove('zh-glitch-active'), 100);
    }

    if (this.active) {
      const ringRotation = performance.now() * 0.008;
      this.runeRing.style.transform = `rotate(${ringRotation}deg)`;
    }
  }
}
