import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class MirrorScene extends Scene {
  readonly id = SCENE_IDS.mirror;
  readonly label = 'Зеркало';
  private pupils: HTMLElement[] = [];
  private progressFill!: HTMLElement;
  private statusEl!: HTMLElement;
  private holdTime = 0;
  private completed = false;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-mirror');
    const header = this.createEl('div', 'zh-mirror__header');
    header.append(
      this.createEl('span', 'zh-mirror__label', '◈ акт II · II'),
      this.createEl('h2', 'zh-mirror__title', 'Зеркальный зал'),
      this.createEl('p', 'zh-mirror__hint', `не двигай курсор. ${Math.ceil(quest.getMirrorHoldSeconds())} секунд. отражение смотрит в ответ.`),
    );

    const row = this.createEl('div', 'zh-mirror__eyes');
    for (let i = 0; i < 5; i++) {
      const eye = this.createEl('div', 'zh-mirror__eye');
      const pupil = this.createEl('div', 'zh-mirror__pupil');
      eye.appendChild(pupil);
      this.pupils.push(pupil);
      row.appendChild(eye);
    }

    const progress = this.createEl('div', 'zh-mirror__progress');
    this.progressFill = this.createEl('div', 'zh-mirror__progress-fill');
    progress.appendChild(this.progressFill);

    this.statusEl = this.createEl('p', 'zh-mirror__status', 'застыть перед зеркалом...');

    inner.append(header, row, progress, this.statusEl);
    this.element.appendChild(inner);
    window.addEventListener('mousemove', this.onMove, { passive: true });

    if (quest.getAct() === 2 && quest.getDepth() >= 8) {
      this.completed = true;
      this.progressFill.style.width = '100%';
      this.statusEl.textContent = 'отражение отступило.';
      this.element.classList.add('zh-mirror--cleared');
    }
  }

  private onMove = (): void => {
    if (!this.active || this.completed) return;
    if (this.holdTime > 0.15) {
      events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });
      this.statusEl.textContent = 'отражение дёрнулось. снова.';
    }
    this.holdTime = 0;
  };

  protected onUpdate(dt: number): void {
    if (!this.active || this.completed) return;

    this.holdTime += dt;
    const holdSeconds = quest.getMirrorHoldSeconds();
    const progress = Math.min(1, this.holdTime / holdSeconds);
    this.progressFill.style.width = `${progress * 100}%`;

    if (progress >= 1) {
      this.completed = true;
      this.statusEl.textContent = 'зеркало треснуло. коллапс близко.';
      this.element.classList.add('zh-mirror--cleared');
      quest.completeMirrorTrial();
      events.emit(EVT.INTERACT, { type: 'rune' });
      return;
    }

    if (this.holdTime > 0.4) this.statusEl.textContent = 'держись...';

    this.pupils.forEach((pupil, i) => {
      const scale = 0.8 + progress * 0.5;
      pupil.style.transform = `scale(${scale}) translate(${Math.sin(performance.now() * 0.002 + i) * 4}px, 0)`;
    });
  }
}
