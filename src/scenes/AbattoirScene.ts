import { Scene } from './Scene';
import { BRAND, SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class AbattoirScene extends Scene {
  readonly id = SCENE_IDS.abattoir;
  readonly label = 'Бойня';
  private messageEl!: HTMLElement;
  private feedbackEl!: HTMLElement;
  private formEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private hintEl!: HTMLElement;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-abattoir');
    const header = this.createEl('div', 'zh-abattoir__header');
    header.append(
      this.createEl('span', 'zh-abattoir__label', '◈ финал акта IV'),
      this.createEl('h2', 'zh-abattoir__title', 'Бойня'),
      this.createEl('p', 'zh-abattoir__hint', 'назови слово, которое мясник оставил после игры'),
    );

    this.messageEl = this.createEl('p', 'zh-abattoir__message',
      'Четыре слоя пройдены. Мясник стоит в конце коридора. Архив требует последнее слово.');

    this.hintEl = this.createEl('p', 'zh-abattoir__code-hint', '');
    if (quest.isButcherWon()) {
      this.hintEl.textContent = `код: ${quest.getAbattoirHint()}`;
    }

    this.formEl = this.createEl('form', 'zh-abattoir__form');
    this.inputEl = document.createElement('input');
    this.inputEl.className = 'zh-abattoir__input';
    this.inputEl.type = 'text';
    this.inputEl.placeholder = '...';
    this.inputEl.autocomplete = 'off';

    const submit = this.createEl('button', 'zh-abattoir__submit', 'закрыть бойню') as HTMLButtonElement;
    submit.type = 'submit';
    this.feedbackEl = this.createEl('p', 'zh-abattoir__feedback', '');

    this.formEl.append(this.inputEl, submit);
    this.formEl.addEventListener('submit', (e) => { e.preventDefault(); this.tryCode(); });

    const footer = this.createEl('div', 'zh-abattoir__footer');
    footer.append(this.createEl('span', '', BRAND.name), this.createEl('span', '', 'акт IV · конец'));

    inner.append(header, this.messageEl, this.hintEl, this.formEl, this.feedbackEl, footer);
    this.element.appendChild(inner);

    if (quest.isComplete()) this.showEnding();
  }

  private tryCode(): void {
    if (!quest.canInteract() || quest.isComplete()) return;
    if (quest.submitAbattoirCode(this.inputEl.value)) {
      this.showEnding();
      events.emit(EVT.SCARE_REQUEST, { type: 'face' });
      return;
    }
    this.feedbackEl.textContent = 'слово отвергнуто. мясник смеётся.';
    events.emit(EVT.SCARE_REQUEST, { type: 'static' });
  }

  private showEnding(): void {
    this.messageEl.textContent = 'Бойня замолкла. Четыре акта. Один архив. Мясник запомнил твоё имя.';
    this.feedbackEl.textContent = 'Zhorror не отпускает. и не должен.';
    this.formEl.style.display = 'none';
    this.hintEl.style.display = 'none';
    this.element.classList.add('zh-abattoir--complete');
  }

  protected onUpdate(_dt: number): void {
    if (!this.active) return;
    this.applyReveal(this.messageEl);
  }
}
