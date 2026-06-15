import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class NooseholdScene extends Scene {
  readonly id = SCENE_IDS.noosehold;
  readonly label = 'Удавка';
  private progressFill!: HTMLElement;
  private nooseEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private holdTime = 0;
  private completed = false;

  protected build(): void {
    const holdSeconds = quest.getNooseHoldSeconds();
    const inner = this.createEl('div', 'zh-scene__inner zh-noosehold');
    inner.append(
      this.createEl('span', 'zh-noosehold__label', '◈ акт V · IV'),
      this.createEl('h2', 'zh-noosehold__title', 'Удавка'),
      this.createEl('p', 'zh-noosehold__hint', `не двигай курсор ${Math.ceil(holdSeconds)} секунд. петля сжимается`),
    );

    this.nooseEl = this.createEl('div', 'zh-noosehold__noose');
    this.nooseEl.innerHTML = '<span class="zh-noosehold__cord"></span><span class="zh-noosehold__loop"></span>';

    const progress = this.createEl('div', 'zh-noosehold__progress');
    this.progressFill = this.createEl('div', 'zh-noosehold__progress-fill');
    progress.appendChild(this.progressFill);
    this.statusEl = this.createEl('p', 'zh-noosehold__status', 'застыть...');
    inner.append(this.nooseEl, progress, this.statusEl);
    this.element.appendChild(inner);

    window.addEventListener('mousemove', this.onMove, { passive: true });
    window.addEventListener('touchstart', this.onMove, { passive: true });
    window.addEventListener('keydown', this.onKey);

    if (quest.getAct() === 5 && quest.getDepth() >= 25) {
      this.completed = true;
      this.progressFill.style.width = '100%';
      this.statusEl.textContent = 'петля отпустила';
      this.nooseEl.classList.add('zh-noosehold__noose--open');
    }
  }

  private onMove = (): void => {
    if (!this.active || this.completed || !this.isPlayable()) return;
    if (this.holdTime > 0.12) {
      events.emit(EVT.SCARE_REQUEST, { type: 'face' });
      this.statusEl.textContent = 'петля дёрнулась';
      this.nooseEl.classList.add('zh-noosehold__noose--tight');
      setTimeout(() => this.nooseEl.classList.remove('zh-noosehold__noose--tight'), 400);
    }
    this.holdTime = 0;
  };

  private onKey = (): void => {
    this.onMove();
  };

  protected onUpdate(dt: number): void {
    if (!this.active || this.completed || !this.isPlayable()) return;
    this.holdTime += dt;
    const holdSeconds = quest.getNooseHoldSeconds();
    const p = Math.min(1, this.holdTime / holdSeconds);
    this.progressFill.style.width = `${p * 100}%`;
    this.nooseEl.style.setProperty('--noose-tight', String(1 - p * 0.55));

    if (p >= 1) {
      this.completed = true;
      this.statusEl.textContent = 'узел ждёт';
      this.nooseEl.classList.add('zh-noosehold__noose--open');
      quest.completeNoosehold();
      events.emit(EVT.INTERACT, { type: 'rune' });
    } else if (this.holdTime > 0.5) {
      this.statusEl.textContent = 'держись...';
    }
  }
}
