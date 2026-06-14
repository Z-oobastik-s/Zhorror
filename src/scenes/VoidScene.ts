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
    header.append(
      this.createEl('span', 'zh-void__label', '◈ финал'),
      this.createEl('h2', 'zh-void__title', 'Конец архива'),
    );

    this.timerEl = this.createEl('div', 'zh-void__timer', '00:00');
    this.messageEl = this.createEl('p', 'zh-void__message',
      `Вы дошли до конца ${BRAND.name}. Но архив не отпускает.`);

    const footer = this.createEl('div', 'zh-void__footer');
    footer.append(
      this.createEl('span', 'zh-void__brand', BRAND.name),
      this.createEl('span', 'zh-void__author', BRAND.author),
      this.createEl('span', 'zh-void__year', '2026'),
    );

    inner.append(header, this.timerEl, this.messageEl, footer);
    this.element.appendChild(inner);
  }

  protected onUpdate(_dt: number): void {
    if (!this.active) return;
    this.applyReveal(this.messageEl);
    this.timerEl.textContent = formatTime(performance.now() - this.startTime);
    this.timerEl.style.opacity = '1';
  }
}
