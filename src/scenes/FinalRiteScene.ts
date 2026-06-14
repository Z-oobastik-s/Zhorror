import { Scene } from './Scene';
import {
  FINAL_RITUAL_INPUT_SECONDS,
  FINAL_RITUAL_SEQUENCE,
  FINAL_RITUAL_SHOW_SECONDS,
  SCENE_IDS,
} from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

type Phase = 'memory' | 'input' | 'done';

export class FinalRiteScene extends Scene {
  readonly id = SCENE_IDS.finalrite;
  readonly label = 'Финал';
  private sequenceEl!: HTMLElement;
  private hintEl!: HTMLElement;
  private timerBar!: HTMLElement;
  private timerFill!: HTMLElement;
  private timerText!: HTMLElement;
  private circleInner!: HTMLElement;
  private symbols: HTMLElement[] = [];
  private phase: Phase = 'memory';
  private phaseTimer = 0;
  private inputLeft = FINAL_RITUAL_INPUT_SECONDS;
  private rotation = 0;
  private ritualDone = false;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-finalrite');
    const header = this.createEl('div', 'zh-finalrite__header');
    header.append(
      this.createEl('span', 'zh-finalrite__label', '◈ акт III · IV'),
      this.createEl('h2', 'zh-finalrite__title', 'Финальный ритуал'),
      this.createEl('p', 'zh-finalrite__hint', '6 символов. 10 секунд. ошибка - сначала'),
    );

    this.sequenceEl = this.createEl('div', 'zh-ritual__sequence');
    this.hintEl = this.createEl('p', 'zh-ritual__sequence-hint', 'готовься...');
    this.timerBar = this.createEl('div', 'zh-ritual__timer');
    this.timerFill = this.createEl('div', 'zh-ritual__timer-fill');
    this.timerText = this.createEl('span', 'zh-ritual__timer-text', String(FINAL_RITUAL_INPUT_SECONDS));
    this.timerBar.append(this.timerFill, this.timerText);

    const circleWrap = this.createEl('div', 'zh-ritual__circle-wrap');
    this.circleInner = this.createEl('div', 'zh-ritual__circle');
    const circleSymbols = ['ᛟ', 'ᚦ', '◈', '⬡', '☍', '⟁', 'ᚨ', 'ᚱ'] as const;
    for (let i = 0; i < 8; i++) {
      const sym = document.createElement('button');
      sym.className = 'zh-ritual__symbol';
      sym.type = 'button';
      sym.textContent = circleSymbols[i];
      sym.dataset.rune = circleSymbols[i];
      sym.style.setProperty('--angle', `${(360 / 8) * i}deg`);
      sym.addEventListener('click', () => this.onSymbolClick(sym));
      this.symbols.push(sym);
      this.circleInner.appendChild(sym);
    }
    circleWrap.appendChild(this.circleInner);
    inner.append(header, this.sequenceEl, this.hintEl, this.timerBar, circleWrap);
    this.element.appendChild(inner);

    if (quest.getFinalRiteProgress() >= FINAL_RITUAL_SEQUENCE.length) {
      this.phase = 'done';
      this.ritualDone = true;
      this.hintEl.textContent = 'ритуал завершён';
      this.timerBar.classList.add('zh-ritual__timer--hidden');
    }
  }

  private showSequence(): void {
    this.sequenceEl.innerHTML = FINAL_RITUAL_SEQUENCE.map((r) => `<span class="zh-ritual__seq-rune">${r}</span>`).join('');
    this.sequenceEl.classList.add('zh-ritual__sequence--visible');
  }

  private startInput(): void {
    this.phase = 'input';
    this.sequenceEl.classList.remove('zh-ritual__sequence--visible');
    this.inputLeft = FINAL_RITUAL_INPUT_SECONDS;
    this.timerBar.classList.add('zh-ritual__timer--active');
    this.hintEl.textContent = 'повтори. время идёт.';
    this.updateTimer();
  }

  private restart(): void {
    quest.resetFinalRiteProgress();
    this.phase = 'memory';
    this.phaseTimer = 0;
    this.timerBar.classList.remove('zh-ritual__timer--active', 'zh-ritual__timer--urgent');
    this.symbols.forEach((s) => s.classList.remove('zh-ritual__symbol--lit', 'zh-ritual__symbol--wrong'));
    this.hintEl.textContent = 'сорвано. смотри снова.';
  }

  private updateTimer(): void {
    const ratio = this.inputLeft / FINAL_RITUAL_INPUT_SECONDS;
    this.timerFill.style.width = `${ratio * 100}%`;
    this.timerText.textContent = String(Math.ceil(this.inputLeft));
    this.timerBar.classList.toggle('zh-ritual__timer--urgent', this.inputLeft <= 3);
  }

  private onSymbolClick(sym: HTMLElement): void {
    if (this.ritualDone || this.phase !== 'input') return;
    const rune = sym.dataset.rune ?? '';
    const result = quest.advanceFinalRite(rune);
    if (result === 'wrong') {
      sym.classList.add('zh-ritual__symbol--wrong');
      setTimeout(() => sym.classList.remove('zh-ritual__symbol--wrong'), 500);
      events.emit(EVT.SCARE_REQUEST, { type: 'static' });
      this.restart();
      return;
    }
    sym.classList.add('zh-ritual__symbol--lit');
    events.emit(EVT.INTERACT, { type: 'rune' });
    if (result === 'done') {
      this.ritualDone = true;
      this.phase = 'done';
      this.hintEl.textContent = 'терминус открыт';
      setTimeout(() => events.emit(EVT.SCARE_REQUEST, { type: 'face' }), 400);
    } else {
      this.hintEl.textContent = `${quest.getFinalRiteProgress()} / ${FINAL_RITUAL_SEQUENCE.length}`;
    }
  }

  protected onUpdate(dt: number): void {
    if (!this.active || this.ritualDone) return;
    if (this.phase === 'memory') {
      this.phaseTimer += dt;
      if (this.phaseTimer > 0.5 && !this.sequenceEl.classList.contains('zh-ritual__sequence--visible')) this.showSequence();
      if (this.phaseTimer >= FINAL_RITUAL_SHOW_SECONDS + 0.5) this.startInput();
      return;
    }
    if (this.phase === 'input') {
      this.inputLeft -= dt;
      this.updateTimer();
      if (this.inputLeft <= 0) {
        events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });
        this.restart();
        return;
      }
      this.rotation += dt * 5;
      this.circleInner.style.transform = `rotate(${this.rotation}deg)`;
    }
  }
}
