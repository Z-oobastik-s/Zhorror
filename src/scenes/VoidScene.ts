import { Scene } from './Scene';
import { SCENE_IDS, BRAND } from '@/config/constants';
import { formatTime } from '@/utils/math';

export class VoidScene extends Scene {
  readonly id = SCENE_IDS.void;
  readonly label = 'Пустота';
  private timerEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private startTime = performance.now();

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-void');

    const header = this.createEl('div', 'zh-void__header');
    header.appendChild(this.createEl('span', 'zh-void__label', '◈ финал'));
    header.appendChild(this.createEl('h2', 'zh-void__title', 'Конец архива'));

    this.timerEl = this.createEl('div', 'zh-void__timer', '00:00');
    this.messageEl = this.createEl('p', 'zh-void__message',
      `Вы дошли до конца ${BRAND.name}. Но архив не отпускает.`);

    const footer = this.createEl('div', 'zh-void__footer');
    footer.appendChild(this.createEl('span', 'zh-void__brand', BRAND.name));
    footer.appendChild(this.createEl('span', 'zh-void__author', BRAND.author));
    footer.appendChild(this.createEl('span', 'zh-void__year', '2026'));

    inner.append(header, this.timerEl, this.messageEl, footer);
    this.element.appendChild(inner);
  }

  protected onUpdate(_dt: number): void {
    this.setReveal(this.messageEl, 0.1);
    this.timerEl.textContent = formatTime(performance.now() - this.startTime);

    const opacity = Math.max(0, Math.min(1, this.progress));
    this.timerEl.style.opacity = String(opacity);
    this.timerEl.style.letterSpacing = `${opacity * 8}px`;
  }
}
