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
  private eyePupil!: HTMLElement;
  private introTime = 0;
  private pupilX = 0;
  private pupilY = 0;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-hero');

    this.runeRing = this.createEl('div', 'zh-hero__rune-ring');
    for (let i = 0; i < 12; i++) {
      const rune = this.createEl('span', 'zh-hero__rune', RUNES[i % RUNES.length]);
      rune.style.setProperty('--i', String(i));
      this.runeRing.appendChild(rune);
    }

    const eye = this.createEl('div', 'zh-hero__eye');
    this.eyePupil = this.createEl('div', 'zh-hero__pupil');
    eye.appendChild(this.eyePupil);

    this.titleEl = this.createEl('h1', 'zh-hero__title', BRAND.name);
    this.subtitleEl = this.createEl('p', 'zh-hero__subtitle', BRAND.tagline);
    this.authorEl = this.createEl('p', 'zh-hero__author', `создано ${BRAND.author}`);
    inner.append(this.runeRing, eye, this.titleEl, this.subtitleEl, this.authorEl);

    const sigil = this.createEl('div', 'zh-hero__sigil');
    sigil.setAttribute('role', 'button');
    sigil.setAttribute('tabindex', '0');
    sigil.innerHTML = '<span class="zh-hero__sigil-inner"><span class="zh-hero__sigil-text">войти в архив</span><span class="zh-hero__sigil-rune">ᛟ</span></span>';
    sigil.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('zh-navigate', { detail: { scene: SCENE_IDS.archive } }));
    });

    inner.appendChild(sigil);
    const hint = this.createEl('div', 'zh-hero__scroll-hint');
    hint.innerHTML = '<span></span><span>листай вниз</span>';
    inner.appendChild(hint);
    this.element.appendChild(inner);

    window.addEventListener('mousemove', this.trackEye, { passive: true });
  }

  private trackEye = (e: MouseEvent): void => {
    if (!this.active) return;
    const rect = this.element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.38;
    this.pupilX = damp(this.pupilX, (e.clientX - cx) / 35, 14, 0.016);
    this.pupilY = damp(this.pupilY, (e.clientY - cy) / 35, 14, 0.016);
    this.eyePupil.style.transform = `translate(${this.pupilX}px, ${this.pupilY}px)`;
  };

  protected onUpdate(dt: number): void {
    if (!this.active) return;
    this.introTime = Math.min(this.introTime + dt, 1.5);
    const v = Math.min(1, this.introTime / 0.6);
    this.titleEl.style.opacity = String(v);
    this.subtitleEl.style.opacity = String(v * 0.9);
    this.authorEl.style.opacity = String(v * 0.75);
    this.runeRing.style.opacity = String(v * 0.55);
    this.runeRing.style.transform = `rotate(${performance.now() * 0.004}deg)`;
  }
}
