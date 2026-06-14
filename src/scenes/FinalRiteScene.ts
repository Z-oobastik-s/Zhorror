import { Scene } from './Scene';
import {
  FINAL_RITUAL_SHOW_SECONDS,
  RITUAL_CIRCLE_RUNES,
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
  private inputLeft = 0;
  private inputSeconds = 0;
  private ritualDone = false;

  protected build(): void {
    this.inputSeconds = quest.getFinalRiteInputSeconds();
    this.inputLeft = this.inputSeconds;

    const inner = this.createEl('div', 'zh-scene__inner zh-finalrite');
    const header = this.createEl('div', 'zh-finalrite__header');
    header.append(
      this.createEl('span', 'zh-finalrite__label', '◈ акт III · IV'),
      this.createEl('h2', 'zh-finalrite__title', 'Финальный ритуал'),
      this.createEl('p', 'zh-finalrite__hint', '6 символов. последовательность не исчезает'),
    );

    this.sequenceEl = this.createEl('div', 'zh-ritual__sequence');
    this.hintEl = this.createEl('p', 'zh-ritual__sequence-hint', 'готовься...');
    this.timerBar = this.createEl('div', 'zh-ritual__timer');
    this.timerFill = this.createEl('div', 'zh-ritual__timer-fill');
    this.timerText = this.createEl('span', 'zh-ritual__timer-text', String(Math.ceil(this.inputSeconds)));
    this.timerBar.append(this.timerFill, this.timerText);

    const circleWrap = this.createEl('div', 'zh-ritual__circle-wrap');
    this.circleInner = this.createEl('div', 'zh-ritual__circle');
    for (let i = 0; i < RITUAL_CIRCLE_RUNES.length; i++) {
      const sym = document.createElement('button');
      sym.className = 'zh-ritual__symbol';
      sym.type = 'button';
      sym.textContent = RITUAL_CIRCLE_RUNES[i];
      sym.dataset.rune = RITUAL_CIRCLE_RUNES[i];
      sym.style.setProperty('--angle', `${(360 / RITUAL_CIRCLE_RUNES.length) * i}deg`);
      sym.addEventListener('click', () => this.onSymbolClick(sym));
      this.symbols.push(sym);
      this.circleInner.appendChild(sym);
    }
    circleWrap.appendChild(this.circleInner);
    inner.append(header, this.sequenceEl, this.hintEl, this.timerBar, circleWrap);
    this.element.appendChild(inner);

    if (quest.getFinalRiteProgress() >= quest.getFinalRiteSequence().length) {
      this.phase = 'done';
      this.ritualDone = true;
      this.hintEl.textContent = 'ритуал завершён';
      this.timerBar.classList.add('zh-ritual__timer--hidden');
    }
  }

  private updateSequenceDisplay(): void {
    const seq = quest.getFinalRiteSequence();
    const step = quest.getFinalRiteProgress();
    this.sequenceEl.innerHTML = seq.map((r, i) => {
      let cls = 'zh-ritual__seq-rune';
      if (i < step) cls += ' zh-ritual__seq-rune--done';
      else if (i === step && this.phase === 'input') cls += ' zh-ritual__seq-rune--current';
      return `<span class="${cls}">${r}</span>`;
    }).join('');
    this.sequenceEl.classList.add('zh-ritual__sequence--visible');
    const expected = seq[step];
    this.symbols.forEach((s) => {
      s.classList.toggle('zh-ritual__symbol--next', this.phase === 'input' && s.dataset.rune === expected);
    });
  }

  private showSequence(): void {
    this.updateSequenceDisplay();
  }

  private startInput(): void {
    this.phase = 'input';
    this.inputSeconds = quest.getFinalRiteInputSeconds();
    this.inputLeft = this.inputSeconds;
    this.updateSequenceDisplay();
    this.timerBar.classList.add('zh-ritual__timer--active');
    this.hintEl.textContent = 'повтори по порядку. подсказка сверху.';
    this.updateTimer();
  }

  private restart(): void {
    quest.resetFinalRiteProgress();
    this.phase = 'memory';
    this.phaseTimer = 0;
    this.inputSeconds = quest.getFinalRiteInputSeconds();
    this.timerBar.classList.remove('zh-ritual__timer--active', 'zh-ritual__timer--urgent');
    this.symbols.forEach((s) => s.classList.remove(
      'zh-ritual__symbol--lit', 'zh-ritual__symbol--wrong', 'zh-ritual__symbol--next',
    ));
    this.hintEl.textContent = 'сорвано. смотри снова.';
  }

  private updateTimer(): void {
    const ratio = this.inputLeft / this.inputSeconds;
    this.timerFill.style.width = `${ratio * 100}%`;
    this.timerText.textContent = String(Math.ceil(this.inputLeft));
    this.timerBar.classList.toggle('zh-ritual__timer--urgent', this.inputLeft <= 3);
  }

  private onSymbolClick(sym: HTMLElement): void {
    if (!quest.canInteract() || this.ritualDone || this.phase !== 'input') return;
    const rune = sym.dataset.rune ?? '';
    const result = quest.advanceFinalRite(rune);
    if (result === 'wrong') {
      sym.classList.add('zh-ritual__symbol--wrong');
      setTimeout(() => sym.classList.remove('zh-ritual__symbol--wrong'), 500);
      events.emit(EVT.SCARE_REQUEST, { type: 'static' });
      this.restart();
      return;
    }
    sym.classList.remove('zh-ritual__symbol--next');
    sym.classList.add('zh-ritual__symbol--lit');
    events.emit(EVT.INTERACT, { type: 'rune' });
    if (result === 'done') {
      this.ritualDone = true;
      this.phase = 'done';
      this.hintEl.textContent = 'терминус открыт';
      setTimeout(() => events.emit(EVT.SCARE_REQUEST, { type: 'face' }), 400);
    } else {
      this.updateSequenceDisplay();
      this.hintEl.textContent = `${quest.getFinalRiteProgress()} / ${quest.getFinalRiteSequence().length}`;
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
        quest.registerFail();
        events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });
        this.restart();
        return;
      }
    }
  }
}
