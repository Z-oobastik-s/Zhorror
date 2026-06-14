import { Scene } from './Scene';
import {
  RITUAL_INPUT_SECONDS,
  RITUAL_SEQUENCE,
  RITUAL_SHOW_SECONDS,
  SCENE_IDS,
} from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

type RitualPhase = 'memory' | 'input' | 'done';

export class RitualScene extends Scene {
  readonly id = SCENE_IDS.ritual;
  readonly label = 'Ритуал';
  private circleInner!: HTMLElement;
  private sequenceEl!: HTMLElement;
  private hintEl!: HTMLElement;
  private timerBar!: HTMLElement;
  private timerFill!: HTMLElement;
  private timerText!: HTMLElement;
  private symbols: HTMLElement[] = [];
  private rotation = 0;
  private phase: RitualPhase = 'memory';
  private phaseTimer = 0;
  private inputLeft = RITUAL_INPUT_SECONDS;
  private ritualDone = false;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-ritual');
    const header = this.createEl('div', 'zh-ritual__header');
    header.append(
      this.createEl('span', 'zh-ritual__label', '◈ секция III'),
      this.createEl('h2', 'zh-ritual__title', 'Цифровой ритуал'),
      this.createEl('p', 'zh-ritual__hint', 'запомни символы. затем повтори их до истечения таймера'),
    );

    this.sequenceEl = this.createEl('div', 'zh-ritual__sequence');
    this.hintEl = this.createEl('p', 'zh-ritual__sequence-hint', 'готовься...');

    this.timerBar = this.createEl('div', 'zh-ritual__timer');
    this.timerFill = this.createEl('div', 'zh-ritual__timer-fill');
    this.timerText = this.createEl('span', 'zh-ritual__timer-text', String(RITUAL_INPUT_SECONDS));
    this.timerBar.append(this.timerFill, this.timerText);

    const circleWrap = this.createEl('div', 'zh-ritual__circle-wrap');
    this.circleInner = this.createEl('div', 'zh-ritual__circle');

    const circleSymbols = ['ᛟ', 'ᚦ', '◈', '⬡', 'ᚨ', 'ᚱ', 'ᛞ', 'ᛉ'] as const;
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

    const center = this.createEl('div', 'zh-ritual__center');
    center.innerHTML = '<span>?</span><small>круг</small>';
    this.circleInner.appendChild(center);
    circleWrap.appendChild(this.circleInner);

    inner.append(
      header,
      this.sequenceEl,
      this.hintEl,
      this.timerBar,
      circleWrap,
      this.createEl('p', 'zh-ritual__desc', 'Ошибка или время - ритуал начинается сначала.'),
    );
    this.element.appendChild(inner);

    if (quest.getRitualProgress() >= RITUAL_SEQUENCE.length || quest.getDepth() >= 4) {
      this.phase = 'done';
      this.ritualDone = true;
      this.hintEl.textContent = 'круг уже разорван.';
      this.timerBar.classList.add('zh-ritual__timer--hidden');
    }
  }

  private showSequence(): void {
    this.sequenceEl.innerHTML = RITUAL_SEQUENCE
      .map((r) => `<span class="zh-ritual__seq-rune">${r}</span>`)
      .join('');
    this.sequenceEl.classList.add('zh-ritual__sequence--visible');
    this.hintEl.textContent = 'запоминай...';
  }

  private startInputPhase(): void {
    this.phase = 'input';
    this.sequenceEl.classList.remove('zh-ritual__sequence--visible');
    this.inputLeft = RITUAL_INPUT_SECONDS;
    this.timerBar.classList.add('zh-ritual__timer--active');
    this.hintEl.textContent = 'повтори последовательность. время идёт.';
    this.updateTimerUi();
  }

  private restartRitual(): void {
    quest.resetRitualProgress();
    this.phase = 'memory';
    this.phaseTimer = 0;
    this.inputLeft = RITUAL_INPUT_SECONDS;
    this.timerBar.classList.remove('zh-ritual__timer--active');
    this.symbols.forEach((s) => s.classList.remove('zh-ritual__symbol--lit', 'zh-ritual__symbol--wrong'));
    this.hintEl.textContent = 'ритуал сорван. смотри снова.';
  }

  private updateTimerUi(): void {
    const ratio = this.inputLeft / RITUAL_INPUT_SECONDS;
    this.timerFill.style.width = `${ratio * 100}%`;
    this.timerText.textContent = String(Math.ceil(this.inputLeft));
    this.timerBar.classList.toggle('zh-ritual__timer--urgent', this.inputLeft <= 4);
  }

  private onSymbolClick(sym: HTMLElement): void {
    if (this.ritualDone || this.phase !== 'input') return;

    const rune = sym.dataset.rune ?? sym.textContent ?? '';
    const result = quest.advanceRitual(rune);

    if (result === 'wrong') {
      sym.classList.add('zh-ritual__symbol--wrong');
      setTimeout(() => sym.classList.remove('zh-ritual__symbol--wrong'), 600);
      events.emit(EVT.SCARE_REQUEST, { type: 'static' });
      this.restartRitual();
      return;
    }

    sym.classList.add('zh-ritual__symbol--lit');
    events.emit(EVT.INTERACT, { type: 'rune' });

    if (result === 'done') {
      this.ritualDone = true;
      this.phase = 'done';
      this.timerBar.classList.remove('zh-ritual__timer--active', 'zh-ritual__timer--urgent');
      this.hintEl.textContent = 'круг разорван. пустота ждёт.';
      setTimeout(() => events.emit(EVT.SCARE_REQUEST, { type: 'static' }), 500);
    } else {
      this.hintEl.textContent = `${quest.getRitualProgress()} / ${RITUAL_SEQUENCE.length}`;
    }
  }

  protected onUpdate(dt: number): void {
    if (!this.active || this.ritualDone) return;

    if (this.phase === 'memory') {
      this.phaseTimer += dt;
      if (this.phaseTimer > 0.6 && !this.sequenceEl.classList.contains('zh-ritual__sequence--visible')) {
        this.showSequence();
      }
      if (this.phaseTimer >= RITUAL_SHOW_SECONDS + 0.6) {
        this.startInputPhase();
      }
      return;
    }

    if (this.phase === 'input') {
      this.inputLeft -= dt;
      this.updateTimerUi();

      if (this.inputLeft <= 0) {
        events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });
        this.restartRitual();
        return;
      }

      this.rotation += dt * (4 + quest.getDepth() * 0.6);
      this.circleInner.style.transform = `rotate(${this.rotation}deg)`;
      this.symbols.forEach((sym, i) => {
        if (!sym.classList.contains('zh-ritual__symbol--lit')) {
          sym.style.opacity = String(0.4 + Math.sin(performance.now() * 0.004 + i) * 0.35);
        }
      });
    }
  }
}
