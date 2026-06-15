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

  private runeRing!: HTMLElement;

  private eyeEl!: HTMLElement;

  private eyePupil!: HTMLElement;

  private threatsEl!: HTMLElement;

  private introTime = 0;

  private pupilX = 0;

  private pupilY = 0;

  private threatTimer = 10;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-hero');

    this.threatsEl = this.createEl('div', 'zh-hero__threats');
    inner.appendChild(this.threatsEl);

    const scratches = this.createEl('div', 'zh-hero__scratches');
    scratches.setAttribute('aria-hidden', 'true');

    const panel = this.createEl('div', 'zh-hero__panel');
    const tearOuter = this.createEl('div', 'zh-hero__tear zh-hero__tear--outer');
    const tearInner = this.createEl('div', 'zh-hero__tear zh-hero__tear--inner');

    this.runeRing = this.createEl('div', 'zh-hero__rune-ring');
    for (let i = 0; i < 12; i++) {
      const rune = this.createEl('span', 'zh-hero__rune', RUNES[i % RUNES.length]);
      rune.style.setProperty('--i', String(i));
      this.runeRing.appendChild(rune);
    }

    this.eyeEl = this.createEl('div', 'zh-hero__eye');
    const iris = this.createEl('div', 'zh-hero__iris');
    this.eyePupil = this.createEl('div', 'zh-hero__pupil');
    iris.appendChild(this.eyePupil);
    this.eyeEl.appendChild(iris);

    this.titleEl = this.createEl('h1', 'zh-hero__title', BRAND.name);
    this.subtitleEl = this.createEl('p', 'zh-hero__subtitle', BRAND.tagline);
    this.authorEl = this.createEl('p', 'zh-hero__author', `создано ${BRAND.author}`);
    this.loreEl = this.createEl('p', 'zh-hero__lore', 'архив подписан именем хозяина. терминус примет только его');

    tearInner.append(this.runeRing, this.eyeEl, this.titleEl, this.subtitleEl, this.authorEl, this.loreEl);
    tearOuter.appendChild(tearInner);
    panel.append(scratches, tearOuter);
    inner.appendChild(panel);

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
    if (!this.active) return;
    const rect = this.eyeEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / 18;
    const dy = (e.clientY - cy) / 18;
    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
    this.pupilX = damp(this.pupilX, clamp(dx, 22), 16, 0.018);
    this.pupilY = damp(this.pupilY, clamp(dy, 14), 16, 0.018);
    this.eyePupil.style.transform = `translate(${this.pupilX}px, ${this.pupilY}px)`;
  };

  private showThreat(): void {
    const el = this.createEl('span', 'zh-hero__threat', randPick(HERO_THREATS));
    el.style.left = `${randInt(6, 88)}%`;
    el.style.top = `${randInt(10, 82)}%`;
    el.style.setProperty('--drift', `${randInt(-12, 12)}px`);
    this.threatsEl.appendChild(el);
    requestAnimationFrame(() => el.classList.add('zh-hero__threat--visible'));
    const hideAfter = 2600 + randInt(0, 1400);
    window.setTimeout(() => {
      el.classList.remove('zh-hero__threat--visible');
      window.setTimeout(() => el.remove(), 2200);
    }, hideAfter);
  }

  protected onUpdate(dt: number): void {
    if (!this.active) return;

    this.introTime = Math.min(this.introTime + dt, 1.8);
    const v = Math.min(1, this.introTime / 0.75);

    this.titleEl.style.opacity = String(v * 0.95);
    this.subtitleEl.style.opacity = String(v * 0.88);
    this.authorEl.style.opacity = String(v * 0.72);
    this.loreEl.style.opacity = String(v * 0.62);
    this.runeRing.style.opacity = String(v * 0.42);
    this.runeRing.style.transform = `rotate(${performance.now() * 0.003}deg)`;

    this.threatTimer -= dt;
    if (this.threatTimer <= 0) {
      this.showThreat();
      this.threatTimer = randRange(16, 32);
    }
  }
}
