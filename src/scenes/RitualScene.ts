import { Scene } from './Scene';
import { SCENE_IDS, RUNES } from '@/config/constants';

export class RitualScene extends Scene {
  readonly id = SCENE_IDS.ritual;
  readonly label = 'Ритуал';
  private circle!: HTMLElement;
  private symbols: HTMLElement[] = [];
  private rotation = 0;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-ritual');

    const header = this.createEl('div', 'zh-ritual__header');
    header.appendChild(this.createEl('span', 'zh-ritual__label', '◈ секция III'));
    header.appendChild(this.createEl('h2', 'zh-ritual__title', 'Цифровой ритуал'));

    this.circle = this.createEl('div', 'zh-ritual__circle');

    const symbolCount = 8;
    for (let i = 0; i < symbolCount; i++) {
      const sym = this.createEl('span', 'zh-ritual__symbol', RUNES[i % RUNES.length]);
      sym.style.setProperty('--angle', `${(360 / symbolCount) * i}deg`);
      this.symbols.push(sym);
      this.circle.appendChild(sym);
    }

    const center = this.createEl('div', 'zh-ritual__center');
    center.innerHTML = '<span>Z</span><small>horror</small>';
    this.circle.appendChild(center);

    const desc = this.createEl('p', 'zh-ritual__desc',
      'Каждый визит усиливает связь. Zoobastiks начертил символы. Вы завершили круг.');

    inner.append(header, this.circle, desc);
    this.element.appendChild(inner);
  }

  protected onUpdate(dt: number): void {
    this.setReveal(this.circle, 0.1);

    if (this.active) {
      this.rotation += dt * 5 * (1 + this.progress);
      this.circle.style.transform = `rotate(${this.rotation}deg)`;
    }

    this.symbols.forEach((sym, i) => {
      sym.style.opacity = String(0.3 + Math.sin(performance.now() * 0.002 + i) * 0.3);
    });
  }
}
