import { RITUAL_SEQUENCE } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import type { QuestSystem } from '@/systems/QuestSystem';

export class QuestHUD {
  private root: HTMLElement;
  private chapterEl: HTMLElement;
  private objectiveEl: HTMLElement;
  private fragmentsEl: HTMLElement;
  private ritualEl: HTMLElement;
  private toastEl: HTMLElement;
  private toastTimer = 0;

  constructor(parent: HTMLElement, private quest: QuestSystem) {
    this.root = document.createElement('div');
    this.root.className = 'zh-quest-hud';
    this.root.innerHTML = `
      <div class="zh-quest-hud__chapter"></div>
      <div class="zh-quest-hud__objective"></div>
      <div class="zh-quest-hud__fragments"></div>
      <div class="zh-quest-hud__ritual"></div>
    `;
    parent.appendChild(this.root);

    this.chapterEl = this.root.querySelector('.zh-quest-hud__chapter')!;
    this.objectiveEl = this.root.querySelector('.zh-quest-hud__objective')!;
    this.fragmentsEl = this.root.querySelector('.zh-quest-hud__fragments')!;
    this.ritualEl = this.root.querySelector('.zh-quest-hud__ritual')!;

    this.toastEl = document.createElement('div');
    this.toastEl.className = 'zh-quest-toast';
    parent.appendChild(this.toastEl);

    events.on(EVT.QUEST_UPDATE, () => this.render());
    events.on(EVT.QUEST_CHAPTER, () => this.flashChapter());
    this.render();
  }

  update(dt: number): void {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toastEl.classList.remove('zh-quest-toast--visible');
    }
  }

  showLocked(): void {
    this.showToast('Секция запечатана. Сначала пройди текущую главу.');
  }

  private render(): void {
    const info = this.quest.getChapterInfo();
    this.chapterEl.textContent = `глава ${info.index}: ${info.title}`;
    this.objectiveEl.textContent = this.quest.getObjective();

    const depth = this.quest.getDepth();
    if (depth >= 1 && depth < 2) {
      this.fragmentsEl.style.display = 'flex';
      const collected = new Set(this.quest.getFragments());
      this.fragmentsEl.innerHTML = Object.values(['ᛟ', 'ᚦ', '◈', '⬡'])
        .map((r) => `<span class="zh-quest-hud__rune${collected.has(r) ? ' zh-quest-hud__rune--found' : ''}">${r}</span>`)
        .join('');
    } else {
      this.fragmentsEl.style.display = 'none';
    }

    if (depth >= 3 && depth < 4 && !this.quest.isComplete()) {
      this.ritualEl.style.display = 'flex';
      const step = this.quest.getRitualProgress();
      this.ritualEl.innerHTML = RITUAL_SEQUENCE
        .map((r, i) => `<span class="zh-quest-hud__rune${i < step ? ' zh-quest-hud__rune--found' : ''}">${r}</span>`)
        .join('');
    } else {
      this.ritualEl.style.display = 'none';
    }

    if (this.quest.isComplete()) {
      this.root.classList.add('zh-quest-hud--complete');
    }
  }

  private flashChapter(): void {
    this.root.classList.add('zh-quest-hud--pulse');
    setTimeout(() => this.root.classList.remove('zh-quest-hud--pulse'), 1200);
    this.showToast('Новая секция открыта');
  }

  private showToast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('zh-quest-toast--visible');
    this.toastTimer = 3;
  }
}
