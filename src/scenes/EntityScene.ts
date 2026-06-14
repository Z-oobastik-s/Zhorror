import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';

export class EntityScene extends Scene {
  readonly id = SCENE_IDS.entity;
  readonly label = 'Сущность';
  private pupils: HTMLElement[] = [];
  private textBlocks: HTMLElement[] = [];
  private watchAngle = 0;
  private stareTime = 0;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-entity');
    const header = this.createEl('div', 'zh-entity__header');
    header.append(
      this.createEl('span', 'zh-entity__label', '◈ секция II'),
      this.createEl('h2', 'zh-entity__title', 'Оно наблюдает'),
      this.createEl('p', 'zh-entity__hint', 'веди курсор - глаза следят. Остановись - оно приблизится.'),
    );

    const form = this.createEl('div', 'zh-entity__form');
    for (let i = 0; i < 3; i++) {
      const eye = this.createEl('div', 'zh-entity__eye');
      const pupil = this.createEl('div', 'zh-entity__pupil');
      eye.appendChild(pupil);
      this.pupils.push(pupil);
      form.appendChild(eye);
    }

    const textWrap = this.createEl('div', 'zh-entity__texts');
    for (const t of ['Оно между пикселями.', 'Курсор - сигнал.', 'Не смотри слишком долго.']) {
      const block = this.createEl('p', 'zh-entity__text', t);
      this.textBlocks.push(block);
      textWrap.appendChild(block);
    }

    inner.append(header, form, textWrap);
    this.element.appendChild(inner);
    window.addEventListener('mousemove', this.track, { passive: true });
  }

  private track = (e: MouseEvent): void => {
    if (!this.active) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    this.watchAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    this.stareTime = 0;
  };

  protected onUpdate(dt: number): void {
    if (!this.active) return;

    this.stareTime += dt;
    if (this.stareTime > 5) {
      events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });
      this.stareTime = 0;
    }

    this.pupils.forEach((pupil, i) => {
      const offset = Math.cos(this.watchAngle + i) * 10;
      const offsetY = Math.sin(this.watchAngle + i) * 6;
      pupil.style.transform = `translate(${offset}px, ${offsetY}px)`;
    });

    this.textBlocks.forEach((block, i) => {
      block.style.opacity = String(this.reveal(i * 0.08));
    });
  }
}
