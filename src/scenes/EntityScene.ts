import { Scene } from './Scene';

import { SCENE_IDS } from '@/config/constants';

import { events, EVT } from '@/core/EventBus';

import { quest } from '@/systems/QuestSystem';



export class EntityScene extends Scene {

  readonly id = SCENE_IDS.entity;

  readonly label = 'Сущность';

  private pupils: HTMLElement[] = [];

  private textBlocks: HTMLElement[] = [];

  private progressBar!: HTMLElement;

  private progressFill!: HTMLElement;

  private statusEl!: HTMLElement;

  private watchAngle = 0;

  private holdTime = 0;

  private completed = false;



  protected build(): void {

    const inner = this.createEl('div', 'zh-scene__inner zh-entity');

    const header = this.createEl('div', 'zh-entity__header');

    header.append(

      this.createEl('span', 'zh-entity__label', '◈ секция II'),

      this.createEl('h2', 'zh-entity__title', 'Оно наблюдает'),

      this.createEl('p', 'zh-entity__hint', `не двигай курсор. выдержи ${Math.ceil(quest.getEntityHoldSeconds())} секунд.`),

    );



    const form = this.createEl('div', 'zh-entity__form');

    for (let i = 0; i < 3; i++) {

      const eye = this.createEl('div', 'zh-entity__eye');

      const pupil = this.createEl('div', 'zh-entity__pupil');

      eye.appendChild(pupil);

      this.pupils.push(pupil);

      form.appendChild(eye);

    }



    this.progressBar = this.createEl('div', 'zh-entity__progress');

    this.progressFill = this.createEl('div', 'zh-entity__progress-fill');

    this.progressBar.appendChild(this.progressFill);



    this.statusEl = this.createEl('p', 'zh-entity__status', 'застыть...');



    const textWrap = this.createEl('div', 'zh-entity__texts');

    for (const t of ['Оно между пикселями.', 'Курсор - сигнал.', 'Не смотри слишком долго.']) {

      const block = this.createEl('p', 'zh-entity__text', t);

      this.textBlocks.push(block);

      textWrap.appendChild(block);

    }



    inner.append(header, form, this.progressBar, this.statusEl, textWrap);

    this.element.appendChild(inner);

    window.addEventListener('mousemove', this.track, { passive: true });

    if (quest.getDepth() >= 3) {
      this.completed = true;
      this.statusEl.textContent = 'оно отступило. путь открыт.';
      this.element.classList.add('zh-entity--cleared');
      this.progressFill.style.width = '100%';
    }

  }



  private track = (): void => {

    if (!this.active || this.completed || !this.isPlayable()) return;

    if (this.holdTime > 0.2) {

      const fails = quest.registerEntityFail();

      if (fails >= 2) {

        events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });

        quest.resetEntityFails();

      }

      this.statusEl.textContent = 'ты пошевелился. снова.';

    }

    this.holdTime = 0;

  };



  protected onUpdate(dt: number): void {

    if (!this.active || this.completed || !this.isPlayable()) return;



    this.holdTime += dt;

    const holdSeconds = quest.getEntityHoldSeconds();
    const progress = Math.min(1, this.holdTime / holdSeconds);

    this.progressFill.style.width = `${progress * 100}%`;



    if (progress >= 1) {

      this.completed = true;

      this.statusEl.textContent = 'оно отступило. путь открыт.';

      this.element.classList.add('zh-entity--cleared');

      quest.completeEntityTrial();

      events.emit(EVT.INTERACT, { type: 'rune' });

      return;

    }



    if (this.holdTime > 0.5) {

      this.statusEl.textContent = 'держись...';

    }



    const intensity = 0.5 + progress * 0.5;

    this.pupils.forEach((pupil, i) => {

      const offset = Math.cos(this.watchAngle + i) * (10 + progress * 8);

      const offsetY = Math.sin(this.watchAngle + i) * (6 + progress * 4);

      pupil.style.transform = `translate(${offset}px, ${offsetY}px) scale(${intensity})`;

    });



    this.textBlocks.forEach((block, i) => {

      block.style.opacity = String(this.reveal(i * 0.08));

    });

  }

}


