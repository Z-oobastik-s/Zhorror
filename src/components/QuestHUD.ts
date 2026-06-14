import { ECHO_PHRASE, RITUAL_SEQUENCE } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import type { QuestSystem } from '@/systems/QuestSystem';

export class QuestHUD {
  private root: HTMLElement;
  private actEl: HTMLElement;
  private chapterEl: HTMLElement;
  private objectiveEl: HTMLElement;
  private fragmentsEl: HTMLElement;
  private ritualEl: HTMLElement;
  private echoEl: HTMLElement;
  private resetBtn!: HTMLButtonElement;
  private toastEl: HTMLElement;
  private toastTimer = 0;

  constructor(parent: HTMLElement, private quest: QuestSystem) {
    this.root = document.createElement('div');
    this.root.className = 'zh-quest-hud';
    this.root.innerHTML = `
      <div class="zh-quest-hud__act"></div>
      <div class="zh-quest-hud__chapter"></div>
      <div class="zh-quest-hud__objective"></div>
      <div class="zh-quest-hud__fragments"></div>
      <div class="zh-quest-hud__ritual"></div>
      <div class="zh-quest-hud__echo"></div>
      <button type="button" class="zh-quest-hud__reset">сбросить прогресс</button>
    `;
    parent.appendChild(this.root);

    this.actEl = this.root.querySelector('.zh-quest-hud__act')!;
    this.chapterEl = this.root.querySelector('.zh-quest-hud__chapter')!;
    this.objectiveEl = this.root.querySelector('.zh-quest-hud__objective')!;
    this.fragmentsEl = this.root.querySelector('.zh-quest-hud__fragments')!;
    this.ritualEl = this.root.querySelector('.zh-quest-hud__ritual')!;
    this.echoEl = this.root.querySelector('.zh-quest-hud__echo')!;
    this.resetBtn = this.root.querySelector('.zh-quest-hud__reset') as HTMLButtonElement;

    this.toastEl = document.createElement('div');
    this.toastEl.className = 'zh-quest-toast';
    parent.appendChild(this.toastEl);

    this.resetBtn.addEventListener('click', () => this.onReset());

    events.on(EVT.QUEST_UPDATE, () => this.render());
    events.on(EVT.QUEST_CHAPTER, () => this.flashChapter());
    events.on(EVT.QUEST_ACT_START, () => this.flashAct());
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

  showToast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('zh-quest-toast--visible');
    this.toastTimer = 3;
  }

  private onReset(): void {
    const ok = window.confirm('Прогресс будет удалён. Архив начнётся сначала. Продолжить?');
    if (!ok) return;
    this.quest.resetProgress();
  }

  private render(): void {
    const act = this.quest.getAct();
    const info = this.quest.getChapterInfo();

    this.actEl.textContent = `акт ${act === 1 ? 'I' : 'II'}`;
    this.chapterEl.textContent = `глава ${info.index}: ${info.title}`;
    this.objectiveEl.textContent = this.quest.getObjective();

    const depth = this.quest.getDepth();
    if (act === 1 && depth >= 1 && depth < 2) {
      this.fragmentsEl.style.display = 'flex';
      const collected = new Set(this.quest.getFragments());
      this.fragmentsEl.innerHTML = ['ᛟ', 'ᚦ', '◈', '⬡']
        .map((r) => `<span class="zh-quest-hud__rune${collected.has(r) ? ' zh-quest-hud__rune--found' : ''}">${r}</span>`)
        .join('');
    } else {
      this.fragmentsEl.style.display = 'none';
    }

    if (act === 1 && depth >= 3 && depth < 4 && !this.quest.isAct1Complete()) {
      this.ritualEl.style.display = 'flex';
      const step = this.quest.getRitualProgress();
      this.ritualEl.innerHTML = RITUAL_SEQUENCE
        .map((r, i) => `<span class="zh-quest-hud__rune${i < step ? ' zh-quest-hud__rune--found' : ''}">${r}</span>`)
        .join('');
    } else {
      this.ritualEl.style.display = 'none';
    }

    if (act === 2 && this.quest.getEchoProgress() < ECHO_PHRASE.length && !this.quest.isComplete()) {
      this.echoEl.style.display = 'flex';
      const step = this.quest.getEchoProgress();
      this.echoEl.innerHTML = ECHO_PHRASE
        .map((w, i) => `<span class="zh-quest-hud__word${i < step ? ' zh-quest-hud__word--found' : ''}">${w}</span>`)
        .join('');
    } else {
      this.echoEl.style.display = 'none';
    }

    this.root.classList.toggle('zh-quest-hud--complete', this.quest.isComplete());
  }

  private flashChapter(): void {
    this.root.classList.add('zh-quest-hud--pulse');
    setTimeout(() => this.root.classList.remove('zh-quest-hud--pulse'), 1200);
    this.showToast('Новая секция открыта');
  }

  private flashAct(): void {
    this.root.classList.add('zh-quest-hud--pulse');
    setTimeout(() => this.root.classList.remove('zh-quest-hud--pulse'), 1600);
    this.showToast('Акт II. Архив уходит глубже.');
  }
}
