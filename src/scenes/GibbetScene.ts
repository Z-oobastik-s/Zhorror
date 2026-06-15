import { Scene } from './Scene';
import { BRAND, SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class GibbetScene extends Scene {
  readonly id = SCENE_IDS.gibbet;
  readonly label = 'Виселица';
  private messageEl!: HTMLElement;
  private feedbackEl!: HTMLElement;
  private formEl!: HTMLElement;
  private inputEl!: HTMLInputElement;
  private hintEl!: HTMLElement;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-gibbet');
    const header = this.createEl('div', 'zh-gibbet__header');
    header.append(
      this.createEl('span', 'zh-gibbet__label', '◈ финал акта V'),
      this.createEl('h2', 'zh-gibbet__title', 'Виселица'),
      this.createEl('p', 'zh-gibbet__hint', 'назови слово, которое петля оставила после узла'),
    );

    this.messageEl = this.createEl('p', 'zh-gibbet__message',
      'Пять слоёв пройдены. Коридор качается. Архив требует последнее слово петли.');

    this.hintEl = this.createEl('p', 'zh-gibbet__code-hint', '');
    const hint = quest.getGibbetHint();
    if (hint) this.hintEl.textContent = `код: ${hint}`;

    this.formEl = this.createEl('form', 'zh-gibbet__form');
    this.inputEl = document.createElement('input');
    this.inputEl.className = 'zh-gibbet__input';
    this.inputEl.type = 'text';
    this.inputEl.placeholder = '...';
    this.inputEl.autocomplete = 'off';

    const submit = this.createEl('button', 'zh-gibbet__submit', 'закрыть петлю') as HTMLButtonElement;
    submit.type = 'submit';
    this.feedbackEl = this.createEl('p', 'zh-gibbet__feedback', '');

    this.formEl.append(this.inputEl, submit);
    this.formEl.addEventListener('submit', (e) => { e.preventDefault(); this.tryCode(); });

    const footer = this.createEl('div', 'zh-gibbet__footer');
    footer.append(this.createEl('span', '', BRAND.name), this.createEl('span', '', 'акт V · конец'));

    inner.append(header, this.messageEl, this.hintEl, this.formEl, this.feedbackEl, footer);
    this.element.appendChild(inner);

    if (quest.isComplete()) this.showEnding();
  }

  private tryCode(): void {
    if (!quest.canInteract() || quest.isComplete()) return;
    if (quest.submitGibbetCode(this.inputEl.value)) {
      this.showEnding();
      events.emit(EVT.SCARE_REQUEST, { type: 'face' });
      return;
    }
    this.feedbackEl.textContent = 'слово отвергнуто. петля смеётся.';
    events.emit(EVT.SCARE_REQUEST, { type: 'static' });
  }

  private showEnding(): void {
    this.messageEl.textContent = 'Петля замолкла. Пять актов. Один архив. Коридор запомнил твоё имя.';
    this.feedbackEl.textContent = 'Zhorror не отпускает. и не должен.';
    this.formEl.style.display = 'none';
    this.hintEl.style.display = 'none';
    this.element.classList.add('zh-gibbet--complete');
  }

  protected onUpdate(_dt: number): void {
    if (!this.active) return;
    this.applyReveal(this.messageEl);
  }
}
