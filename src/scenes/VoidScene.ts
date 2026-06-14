import { Scene } from './Scene';

import { BRAND, SCENE_IDS } from '@/config/constants';

import { events, EVT } from '@/core/EventBus';

import { quest } from '@/systems/QuestSystem';

import { formatTime } from '@/utils/math';



export class VoidScene extends Scene {

  readonly id = SCENE_IDS.void;

  readonly label = 'Пустота';

  private timerEl!: HTMLElement;

  private messageEl!: HTMLElement;

  private formEl!: HTMLElement;

  private inputEl!: HTMLInputElement;

  private feedbackEl!: HTMLElement;

  private startTime = performance.now();



  protected build(): void {

    const inner = this.createEl('div', 'zh-scene__inner zh-void');

    const header = this.createEl('div', 'zh-void__header');

    header.append(

      this.createEl('span', 'zh-void__label', '◈ финал'),

      this.createEl('h2', 'zh-void__title', 'Конец архива'),

      this.createEl('p', 'zh-void__hint', 'введи код запретной записи из архива'),

    );



    this.timerEl = this.createEl('div', 'zh-void__timer', '00:00');

    this.messageEl = this.createEl('p', 'zh-void__message',

      'Ты дошёл до края. Архив требует последний ключ.');



    this.formEl = this.createEl('form', 'zh-void__form');

    this.inputEl = document.createElement('input');

    this.inputEl.className = 'zh-void__input';

    this.inputEl.type = 'text';

    this.inputEl.placeholder = 'ZH-...';

    this.inputEl.autocomplete = 'off';

    this.inputEl.spellcheck = false;



    const submit = this.createEl('button', 'zh-void__submit', 'разорвать печать') as HTMLButtonElement;
    submit.type = 'submit';



    this.feedbackEl = this.createEl('p', 'zh-void__feedback', '');



    this.formEl.append(this.inputEl, submit);

    this.formEl.addEventListener('submit', (e) => {

      e.preventDefault();

      this.tryCode();

    });



    const footer = this.createEl('div', 'zh-void__footer');

    footer.append(

      this.createEl('span', 'zh-void__brand', BRAND.name),

      this.createEl('span', 'zh-void__author', BRAND.author),

      this.createEl('span', 'zh-void__year', '2026'),

    );



    inner.append(header, this.timerEl, this.messageEl, this.formEl, this.feedbackEl, footer);

    this.element.appendChild(inner);



    if (quest.isComplete()) {

      this.showEnding();

    }

  }



  private tryCode(): void {

    if (quest.isComplete()) return;



    if (quest.submitVoidCode(this.inputEl.value)) {

      this.showEnding();

      events.emit(EVT.SCARE_REQUEST, { type: 'face' });

      return;

    }



    this.feedbackEl.textContent = 'код отвергнут. архив не отпускает.';

    this.formEl.classList.add('zh-void__form--reject');

    setTimeout(() => this.formEl.classList.remove('zh-void__form--reject'), 800);

    events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });

  }



  private showEnding(): void {

    this.messageEl.textContent = 'Печать снята. Но выхода нет. Архив помнит каждого, кто дошёл до конца.';

    this.feedbackEl.textContent = 'ты прошёл все главы. или они прошли через тебя.';

    this.formEl.style.display = 'none';

    this.element.classList.add('zh-void--complete');

  }



  protected onUpdate(_dt: number): void {

    if (!this.active) return;

    this.applyReveal(this.messageEl);

    this.timerEl.textContent = formatTime(performance.now() - this.startTime);

    this.timerEl.style.opacity = '1';

  }

}


