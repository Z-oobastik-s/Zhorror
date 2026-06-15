import { Scene } from './Scene';
import { HANGED_COUNT, SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class HangedScene extends Scene {
  readonly id = SCENE_IDS.hanged;
  readonly label = 'Повешенные';
  private figures: HTMLElement[] = [];
  private timerEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private timeLeft = 0;
  private hangedSeconds = 0;
  private realCount = 0;
  private done = false;
  private failed = false;

  protected build(): void {
    this.hangedSeconds = quest.getHangedTimeSeconds();
    this.timeLeft = this.hangedSeconds;
    this.realCount = quest.getHangedRealCount();

    const inner = this.createEl('div', 'zh-scene__inner zh-hanged');
    const header = this.createEl('div', 'zh-hanged__header');
    header.append(
      this.createEl('span', 'zh-hanged__label', '◈ акт V · III'),
      this.createEl('h2', 'zh-hanged__title', 'Повешенные'),
      this.createEl('p', 'zh-hanged__hint', `найди ${this.realCount} настоящих силуэтов. они качаются. манекены сбрасывают прогресс`),
    );
    this.timerEl = this.createEl('div', 'zh-hanged__timer', String(Math.ceil(this.hangedSeconds)));
    this.statusEl = this.createEl('p', 'zh-hanged__status', `0 / ${this.realCount}`);

    const grid = this.createEl('div', 'zh-hanged__grid');
    for (let i = 0; i < HANGED_COUNT; i++) {
      const fig = this.createEl('button', 'zh-hanged__fig') as HTMLButtonElement;
      fig.type = 'button';
      fig.innerHTML = '<span class="zh-hanged__rope"></span><span class="zh-hanged__body"></span>';
      if (quest.isHangedReal(i)) fig.classList.add('zh-hanged__fig--real');
      fig.addEventListener('click', () => this.onFigure(i, fig));
      this.figures.push(fig);
      grid.appendChild(fig);
    }

    inner.append(header, this.timerEl, this.statusEl, grid);
    this.element.appendChild(inner);

    if (quest.getHangedProgress() >= this.realCount) {
      this.done = true;
      this.statusEl.textContent = 'силуэты приняты';
    }
  }

  private onFigure(index: number, fig: HTMLElement): void {
    if (!quest.canInteract() || this.done || this.failed) return;
    if (fig.classList.contains('zh-hanged__fig--hit')) return;

    const result = quest.registerHangedHit(index);
    if (result === 'wrong') {
      quest.resetHangedProgress();
      this.figures.forEach((f) => f.classList.remove('zh-hanged__fig--hit'));
      events.emit(EVT.SCARE_REQUEST, { type: 'face' });
      this.statusEl.textContent = 'манекен. сначала.';
      return;
    }

    fig.classList.add('zh-hanged__fig--hit');
    events.emit(EVT.INTERACT, { type: 'rune' });
    this.statusEl.textContent = `${quest.getHangedProgress()} / ${this.realCount}`;
    if (result === 'done') {
      this.done = true;
      this.statusEl.textContent = 'петля сжимается...';
    }
  }

  protected onUpdate(dt: number): void {
    if (!this.active || this.done) return;
    this.timeLeft -= dt;
    this.timerEl.textContent = String(Math.max(0, Math.ceil(this.timeLeft)));
    this.timerEl.classList.toggle('zh-hanged__timer--urgent', this.timeLeft <= 10);

    if (this.timeLeft <= 0 && !this.done) {
      this.failed = true;
      quest.registerFail();
      quest.resetHangedProgress();
      this.figures.forEach((f) => f.classList.remove('zh-hanged__fig--hit'));
      this.hangedSeconds = quest.getHangedTimeSeconds();
      this.timeLeft = this.hangedSeconds;
      this.failed = false;
      this.statusEl.textContent = 'время. снова.';
      events.emit(EVT.SCARE_REQUEST, { type: 'static' });
    }
  }
}
