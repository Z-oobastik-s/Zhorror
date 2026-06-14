import { Scene } from './Scene';
import { BRAND, SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class CollapseScene extends Scene {
  readonly id = SCENE_IDS.collapse;
  readonly label = 'Коллапс';
  private messageEl!: HTMLElement;
  private feedbackEl!: HTMLElement;
  private formEl!: HTMLElement;
  private inputEl!: HTMLInputElement;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-collapse');
    const header = this.createEl('div', 'zh-collapse__header');
    header.append(
      this.createEl('span', 'zh-collapse__label', '◈ финал акта II'),
      this.createEl('h2', 'zh-collapse__title', 'Коллапс архива'),
      this.createEl('p', 'zh-collapse__hint', 'введи слово, которым всё началось'),
    );

    this.messageEl = this.createEl('p', 'zh-collapse__message',
      'Нижний слой рушится. Чтобы выжить внутри архива, назови его.');

    this.formEl = this.createEl('form', 'zh-collapse__form');
    this.inputEl = document.createElement('input');
    this.inputEl.className = 'zh-collapse__input';
    this.inputEl.type = 'text';
    this.inputEl.placeholder = '...';
    this.inputEl.autocomplete = 'off';
    this.inputEl.spellcheck = false;

    const submit = this.createEl('button', 'zh-collapse__submit', 'удержать реальность') as HTMLButtonElement;
    submit.type = 'submit';

    this.feedbackEl = this.createEl('p', 'zh-collapse__feedback', '');

    this.formEl.append(this.inputEl, submit);
    this.formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      this.tryCode();
    });

    const footer = this.createEl('div', 'zh-collapse__footer');
    footer.append(
      this.createEl('span', '', BRAND.author),
      this.createEl('span', '', 'акт II'),
    );

    inner.append(header, this.messageEl, this.formEl, this.feedbackEl, footer);
    this.element.appendChild(inner);

    if (quest.isAct2Complete()) this.showEnding();
  }

  private tryCode(): void {
    if (quest.isAct2Complete()) return;

    if (quest.submitCollapseCode(this.inputEl.value)) {
      this.showEnding();
      events.emit(EVT.SCARE_REQUEST, { type: 'face' });
      return;
    }

    this.feedbackEl.textContent = 'слово не принято. архив смеётся.';
    this.formEl.classList.add('zh-collapse__form--reject');
    setTimeout(() => this.formEl.classList.remove('zh-collapse__form--reject'), 800);
    events.emit(EVT.SCARE_REQUEST, { type: 'static' });
  }

  private showEnding(): void {
    this.messageEl.textContent = 'Ты назвал архив. За коллапсом - ядро. Третий слой уже открыт.';
    this.feedbackEl.textContent = 'акт II завершён. ядро ждёт.';
    this.formEl.style.display = 'none';
    this.element.classList.add('zh-collapse--complete');
  }

  protected onUpdate(_dt: number): void {
    if (!this.active) return;
    this.applyReveal(this.messageEl);
  }
}
