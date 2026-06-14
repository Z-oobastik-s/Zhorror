import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
export class EntityScene extends Scene {
  readonly id = SCENE_IDS.entity;
  readonly label = 'Сущность';
  private entity!: HTMLElement;
  private pupils: HTMLElement[] = [];
  private textBlocks: HTMLElement[] = [];
  private watchAngle = 0;
  private boundTrackCursor = (e: MouseEvent) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    this.watchAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
  };

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-entity');

    const header = this.createEl('div', 'zh-entity__header');
    header.appendChild(this.createEl('span', 'zh-entity__label', '◈ секция II'));
    header.appendChild(this.createEl('h2', 'zh-entity__title', 'Оно наблюдает'));

    this.entity = this.createEl('div', 'zh-entity__form');
    for (let i = 0; i < 3; i++) {
      const eye = this.createEl('div', 'zh-entity__eye');
      const pupil = this.createEl('div', 'zh-entity__pupil');
      eye.appendChild(pupil);
      this.pupils.push(pupil);
      this.entity.appendChild(eye);
    }

    const texts = [
      'Оно существует между пикселями.',
      'Каждое движение курсора - сигнал.',
      'Не смотри слишком долго.',
    ];

    const textWrap = this.createEl('div', 'zh-entity__texts');
    for (const t of texts) {
      const block = this.createEl('p', 'zh-entity__text', t);
      this.textBlocks.push(block);
      textWrap.appendChild(block);
    }

    inner.append(header, this.entity, textWrap);
    this.element.appendChild(inner);
    window.addEventListener('mousemove', this.boundTrackCursor);
  }

  protected onUpdate(_dt: number): void {
    this.setReveal(this.entity, 0.15);

    this.pupils.forEach((pupil, i) => {
      const offset = Math.cos(this.watchAngle + i) * 8;
      const offsetY = Math.sin(this.watchAngle + i) * 5;
      pupil.style.transform = `translate(${offset}px, ${offsetY}px)`;
    });

    this.textBlocks.forEach((block, i) => {
      const threshold = 0.2 + i * 0.15;
      const opacity = Math.max(0, Math.min(1, (this.progress - threshold) / 0.25));
      block.style.opacity = String(opacity);
    });
  }
}
