import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class SilenceScene extends Scene {
  readonly id = SCENE_IDS.silence;
  readonly label = 'Тишина';
  private progressFill!: HTMLElement;
  private statusEl!: HTMLElement;
  private holdTime = 0;
  private completed = false;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-silence');
    const holdSeconds = quest.getSilenceHoldSeconds();
    inner.append(
      this.createEl('span', 'zh-silence__label', '◈ акт III · III'),
      this.createEl('h2', 'zh-silence__title', 'Абсолютная тишина'),
      this.createEl('p', 'zh-silence__hint', `не двигай курсор ${Math.ceil(holdSeconds)} секунд. архив слушает.`),
    );
    const progress = this.createEl('div', 'zh-silence__progress');
    this.progressFill = this.createEl('div', 'zh-silence__progress-fill');
    progress.appendChild(this.progressFill);
    this.statusEl = this.createEl('p', 'zh-silence__status', 'застыть...');
    inner.append(progress, this.statusEl);
    this.element.appendChild(inner);
    window.addEventListener('mousemove', this.onMove, { passive: true });

    if (quest.getAct() === 3 && quest.getDepth() >= 13) {
      this.completed = true;
      this.progressFill.style.width = '100%';
      this.statusEl.textContent = 'тишина принята';
    }
  }

  private onMove = (): void => {
    if (!this.active || this.completed) return;
    if (this.holdTime > 0.12) {
      events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });
      this.statusEl.textContent = 'ты нарушил тишину';
    }
    this.holdTime = 0;
  };

  protected onUpdate(dt: number): void {
    if (!this.active || this.completed) return;
    this.holdTime += dt;
    const holdSeconds = quest.getSilenceHoldSeconds();
    const p = Math.min(1, this.holdTime / holdSeconds);
    this.progressFill.style.width = `${p * 100}%`;
    if (p >= 1) {
      this.completed = true;
      this.statusEl.textContent = 'ритуал ждёт';
      quest.completeSilenceTrial();
      events.emit(EVT.INTERACT, { type: 'rune' });
    } else if (this.holdTime > 0.5) {
      this.statusEl.textContent = 'держись...';
    }
  }
}
