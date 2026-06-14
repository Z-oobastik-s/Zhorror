import { Scene } from './Scene';
import { MEATLOCK_SHOW_SECONDS, SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

type Phase = 'memory' | 'input' | 'done';

export class MeatlockScene extends Scene {
  readonly id = SCENE_IDS.meatlock;
  readonly label = 'Запечатано';
  private sequenceEl!: HTMLElement;
  private hintEl!: HTMLElement;
  private timerBar!: HTMLElement;
  private timerFill!: HTMLElement;
  private timerText!: HTMLElement;
  private symbols: HTMLButtonElement[] = [];
  private phase: Phase = 'memory';
  private phaseTimer = 0;
  private inputLeft = 0;
  private inputSeconds = 0;
  private done = false;

  protected build(): void {
    this.inputSeconds = quest.getMeatlockInputSeconds();
    this.inputLeft = this.inputSeconds;

    const inner = this.createEl('div', 'zh-scene__inner zh-meatlock');
    const header = this.createEl('div', 'zh-meatlock__header');
    header.append(
      this.createEl('span', 'zh-meatlock__label', '◈ акт IV · IV'),
      this.createEl('h2', 'zh-meatlock__title', 'Печать мясника'),
      this.createEl('p', 'zh-meatlock__hint', '4 метки. мало времени. ошибка - сначала'),
    );

    this.sequenceEl = this.createEl('div', 'zh-ritual__sequence');
    this.hintEl = this.createEl('p', 'zh-ritual__sequence-hint', 'смотри...');
    this.timerBar = this.createEl('div', 'zh-ritual__timer');
    this.timerFill = this.createEl('div', 'zh-ritual__timer-fill');
    this.timerText = this.createEl('span', 'zh-ritual__timer-text', String(Math.ceil(this.inputSeconds)));
    this.timerBar.append(this.timerFill, this.timerText);

    const pool = this.createEl('div', 'zh-meatlock__pool');
    const marks = ['☠', '⚒', '⧫', '⌬', '◈', '⬡', '☍', '⟁'];
    for (const m of marks) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'zh-meatlock__mark-btn';
      btn.textContent = m;
      btn.addEventListener('click', () => this.onMark(m, btn));
      this.symbols.push(btn);
      pool.appendChild(btn);
    }

    inner.append(header, this.sequenceEl, this.hintEl, this.timerBar, pool);
    this.element.appendChild(inner);

    if (quest.getMeatlockProgress() >= quest.getMeatSequence().length) {
      this.phase = 'done';
      this.done = true;
      this.hintEl.textContent = 'печать снята';
      this.timerBar.classList.add('zh-ritual__timer--hidden');
    }
  }

  private showSequence(): void {
    this.sequenceEl.innerHTML = quest.getMeatSequence()
      .map((r) => `<span class="zh-ritual__seq-rune">${r}</span>`)
      .join('');
    this.sequenceEl.classList.add('zh-ritual__sequence--visible');
  }

  private startInput(): void {
    this.phase = 'input';
    this.inputSeconds = quest.getMeatlockInputSeconds();
    this.inputLeft = this.inputSeconds;
    this.sequenceEl.classList.remove('zh-ritual__sequence--visible');
    this.timerBar.classList.add('zh-ritual__timer--active');
    this.hintEl.textContent = 'повтори. быстро.';
    this.updateTimer();
  }

  private restart(): void {
    quest.resetMeatlockProgress();
    this.phase = 'memory';
    this.phaseTimer = 0;
    this.timerBar.classList.remove('zh-ritual__timer--active', 'zh-ritual__timer--urgent');
    this.symbols.forEach((s) => s.classList.remove('zh-meatlock__mark-btn--lit', 'zh-meatlock__mark-btn--wrong'));
    this.hintEl.textContent = 'сорвано. смотри снова.';
  }

  private updateTimer(): void {
    const ratio = this.inputLeft / this.inputSeconds;
    this.timerFill.style.width = `${ratio * 100}%`;
    this.timerText.textContent = String(Math.ceil(this.inputLeft));
    this.timerBar.classList.toggle('zh-ritual__timer--urgent', this.inputLeft <= 3);
  }

  private onMark(mark: string, btn: HTMLButtonElement): void {
    if (!quest.canInteract() || this.done || this.phase !== 'input') return;
    const result = quest.advanceMeatlock(mark);
    if (result === 'wrong') {
      btn.classList.add('zh-meatlock__mark-btn--wrong');
      setTimeout(() => btn.classList.remove('zh-meatlock__mark-btn--wrong'), 400);
      events.emit(EVT.SCARE_REQUEST, { type: 'static' });
      this.restart();
      return;
    }
    btn.classList.add('zh-meatlock__mark-btn--lit');
    events.emit(EVT.INTERACT, { type: 'rune' });
    if (result === 'done') {
      this.done = true;
      this.phase = 'done';
      this.hintEl.textContent = 'бойня открыта';
      events.emit(EVT.SCARE_REQUEST, { type: 'face' });
    }
  }

  protected onUpdate(dt: number): void {
    if (!this.active || this.done) return;
    if (this.phase === 'memory') {
      this.phaseTimer += dt;
      if (this.phaseTimer > 0.4 && !this.sequenceEl.classList.contains('zh-ritual__sequence--visible')) {
        this.showSequence();
      }
      if (this.phaseTimer >= MEATLOCK_SHOW_SECONDS + 0.4) this.startInput();
      return;
    }
    if (this.phase === 'input') {
      this.inputLeft -= dt;
      this.updateTimer();
      if (this.inputLeft <= 0) {
        quest.registerFail();
        events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });
        this.restart();
      }
    }
  }
}
