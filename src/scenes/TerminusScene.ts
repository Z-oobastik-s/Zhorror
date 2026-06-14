import { Scene } from './Scene';
import { BRAND, SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class TerminusScene extends Scene {
  readonly id = SCENE_IDS.terminus;
  readonly label = 'Терминус';
  private messageEl!: HTMLElement;
  private feedbackEl!: HTMLElement;
  private formEl!: HTMLElement;
  private inputEl!: HTMLInputElement;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-terminus');
    const header = this.createEl('div', 'zh-terminus__header');
    header.append(
      this.createEl('span', 'zh-terminus__label', '◈ финал акта III'),
      this.createEl('h2', 'zh-terminus__title', 'Терминус'),
      this.createEl('p', 'zh-terminus__hint', 'назови того, кто оставил след в архиве'),
    );

    this.messageEl = this.createEl('p', 'zh-terminus__message',
      'Три слоя пройдены. Архив требует имя. Не название сайта. Имя автора.');

    this.formEl = this.createEl('form', 'zh-terminus__form');
    this.inputEl = document.createElement('input');
    this.inputEl.className = 'zh-terminus__input';
    this.inputEl.type = 'text';
    this.inputEl.placeholder = '...';
    this.inputEl.autocomplete = 'off';

    const submit = this.createEl('button', 'zh-terminus__submit', 'закрыть круг') as HTMLButtonElement;
    submit.type = 'submit';
    this.feedbackEl = this.createEl('p', 'zh-terminus__feedback', '');

    this.formEl.append(this.inputEl, submit);
    this.formEl.addEventListener('submit', (e) => { e.preventDefault(); this.tryCode(); });

    const footer = this.createEl('div', 'zh-terminus__footer');
    footer.append(this.createEl('span', '', BRAND.name), this.createEl('span', '', 'акт III · конец'));

    inner.append(header, this.messageEl, this.formEl, this.feedbackEl, footer);
    this.element.appendChild(inner);

    if (quest.isComplete()) this.showEnding();
  }

  private tryCode(): void {
    if (quest.isComplete()) return;
    if (quest.submitTerminusCode(this.inputEl.value)) {
      this.showEnding();
      events.emit(EVT.SCARE_REQUEST, { type: 'face' });
      return;
    }
    this.feedbackEl.textContent = 'имя отвергнуто. архив знает правду.';
    events.emit(EVT.SCARE_REQUEST, { type: 'static' });
  }

  private showEnding(): void {
    this.messageEl.textContent = 'Круг замкнулся. Три акта. Один архив. Ты - последняя запись.';
    this.feedbackEl.textContent = 'Zhorror не отпускает. и не должен.';
    this.formEl.style.display = 'none';
    this.element.classList.add('zh-terminus--complete');
  }

  protected onUpdate(_dt: number): void {
    if (!this.active) return;
    this.applyReveal(this.messageEl);
  }
}
