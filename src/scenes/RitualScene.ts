import { Scene } from './Scene';
import { SCENE_IDS, RUNES } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';

export class RitualScene extends Scene {
  readonly id = SCENE_IDS.ritual;
  readonly label = 'Ритуал';
  private circleInner!: HTMLElement;
  private symbols: HTMLElement[] = [];
  private rotation = 0;
  private activated = 0;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-ritual');
    const header = this.createEl('div', 'zh-ritual__header');
    header.append(
      this.createEl('span', 'zh-ritual__label', '◈ секция III'),
      this.createEl('h2', 'zh-ritual__title', 'Цифровой ритуал'),
      this.createEl('p', 'zh-ritual__hint', 'активируй все 8 символов'),
    );

    const circleWrap = this.createEl('div', 'zh-ritual__circle-wrap');
    this.circleInner = this.createEl('div', 'zh-ritual__circle');

    for (let i = 0; i < 8; i++) {
      const sym = document.createElement('button');
      sym.className = 'zh-ritual__symbol';
      sym.type = 'button';
      sym.textContent = RUNES[i % RUNES.length];
      sym.style.setProperty('--angle', `${(360 / 8) * i}deg`);
      sym.addEventListener('click', () => {
        if (sym.classList.contains('zh-ritual__symbol--lit')) return;
        sym.classList.add('zh-ritual__symbol--lit');
        this.activated += 1;
        events.emit(EVT.INTERACT, { type: 'rune' });
        if (this.activated >= 8) {
          setTimeout(() => events.emit(EVT.SCARE_REQUEST, { type: 'static' }), 400);
        }
      });
      this.symbols.push(sym);
      this.circleInner.appendChild(sym);
    }

    const center = this.createEl('div', 'zh-ritual__center');
    center.innerHTML = '<span>Z</span><small>horror</small>';
    this.circleInner.appendChild(center);
    circleWrap.appendChild(this.circleInner);

    inner.append(
      header,
      circleWrap,
      this.createEl('p', 'zh-ritual__desc', 'Каждый символ усиливает связь. Zoobastiks начертил круг. Ты внутри.'),
    );
    this.element.appendChild(inner);
  }

  protected onUpdate(dt: number): void {
    if (!this.active) return;
    this.rotation += dt * 4;
    this.circleInner.style.transform = `rotate(${this.rotation}deg)`;
    this.symbols.forEach((sym, i) => {
      if (!sym.classList.contains('zh-ritual__symbol--lit')) {
        sym.style.opacity = String(0.5 + Math.sin(performance.now() * 0.003 + i) * 0.3);
      }
    });
  }
}
