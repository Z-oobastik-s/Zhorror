import { CATACOMB_MARKS, ECHO_PHRASE, FINAL_RITUAL_SEQUENCE, RITUAL_SEQUENCE } from '@/config/constants';
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
  private act3El: HTMLElement;
  private resetBtn!: HTMLButtonElement;
  private resetModal!: HTMLElement;
  private resetConfirmBtn!: HTMLButtonElement;
  private resetCancelBtn!: HTMLButtonElement;
  private toastEl: HTMLElement;
  private toastTimer = 0;
  private resetOpen = false;

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
      <div class="zh-quest-hud__act3"></div>
      <button type="button" class="zh-quest-hud__reset">сбросить прогресс</button>
    `;
    parent.appendChild(this.root);

    this.actEl = this.root.querySelector('.zh-quest-hud__act')!;
    this.chapterEl = this.root.querySelector('.zh-quest-hud__chapter')!;
    this.objectiveEl = this.root.querySelector('.zh-quest-hud__objective')!;
    this.fragmentsEl = this.root.querySelector('.zh-quest-hud__fragments')!;
    this.ritualEl = this.root.querySelector('.zh-quest-hud__ritual')!;
    this.echoEl = this.root.querySelector('.zh-quest-hud__echo')!;
    this.act3El = this.root.querySelector('.zh-quest-hud__act3')!;
    this.resetBtn = this.root.querySelector('.zh-quest-hud__reset') as HTMLButtonElement;

    this.resetModal = document.createElement('div');
    this.resetModal.className = 'zh-reset-modal';
    this.resetModal.setAttribute('role', 'dialog');
    this.resetModal.setAttribute('aria-modal', 'true');
    this.resetModal.setAttribute('aria-hidden', 'true');
    this.resetModal.setAttribute('aria-label', 'Подтверждение сброса прогресса');
    this.resetModal.innerHTML = `
      <div class="zh-reset-modal__backdrop" data-reset-close></div>
      <div class="zh-reset-modal__panel">
        <span class="zh-reset-modal__mark">☍</span>
        <p class="zh-reset-modal__title">сброс памяти</p>
        <p class="zh-reset-modal__text">прогресс будет стёрт.<br>архив начнётся с порога.</p>
        <p class="zh-reset-modal__warn">это нельзя отменить</p>
        <div class="zh-reset-modal__actions">
          <button type="button" class="zh-reset-modal__btn zh-reset-modal__btn--ghost" data-reset-cancel>остаться</button>
          <button type="button" class="zh-reset-modal__btn zh-reset-modal__btn--danger" data-reset-confirm>стереть всё</button>
        </div>
      </div>
    `;
    parent.appendChild(this.resetModal);

    this.resetConfirmBtn = this.resetModal.querySelector('[data-reset-confirm]') as HTMLButtonElement;
    this.resetCancelBtn = this.resetModal.querySelector('[data-reset-cancel]') as HTMLButtonElement;

    this.toastEl = document.createElement('div');
    this.toastEl.className = 'zh-quest-toast';
    parent.appendChild(this.toastEl);

    this.resetBtn.addEventListener('click', () => this.openResetModal());
    this.resetConfirmBtn.addEventListener('click', () => this.confirmReset());
    this.resetCancelBtn.addEventListener('click', () => this.closeResetModal());
    this.resetModal.querySelector('[data-reset-close]')?.addEventListener('click', () => this.closeResetModal());
    window.addEventListener('keydown', this.onKeyDown);

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

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.resetOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closeResetModal();
    }
  };

  private openResetModal(): void {
    this.resetOpen = true;
    this.resetModal.classList.add('zh-reset-modal--visible');
    this.resetModal.setAttribute('aria-hidden', 'false');
    this.resetCancelBtn.focus();
  }

  private closeResetModal(): void {
    this.resetOpen = false;
    this.resetModal.classList.remove('zh-reset-modal--visible');
    this.resetModal.setAttribute('aria-hidden', 'true');
    this.resetBtn.focus();
  }

  private confirmReset(): void {
    this.closeResetModal();
    this.quest.resetProgress();
  }

  private render(): void {
    const act = this.quest.getAct();
    const info = this.quest.getChapterInfo();

    this.actEl.textContent = `акт ${act === 1 ? 'I' : act === 2 ? 'II' : 'III'}`;
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

    if (act === 2 && this.quest.getEchoProgress() < ECHO_PHRASE.length && !this.quest.isAct2Complete()) {
      this.echoEl.style.display = 'flex';
      const step = this.quest.getEchoProgress();
      this.echoEl.innerHTML = ECHO_PHRASE
        .map((w, i) => `<span class="zh-quest-hud__word${i < step ? ' zh-quest-hud__word--found' : ''}">${w}</span>`)
        .join('');
    } else {
      this.echoEl.style.display = 'none';
    }

    if (act === 3 && !this.quest.isComplete()) {
      this.act3El.style.display = 'flex';
      const parts: string[] = [];
      if ((this.quest.getAct() === 3 && this.quest.getChapterInfo().scene === 'catacombs') || this.quest.getCatacombMarks().length > 0) {
        const marks = new Set(this.quest.getCatacombMarks());
        parts.push(...CATACOMB_MARKS.map((m) =>
          `<span class="zh-quest-hud__rune${marks.has(m) ? ' zh-quest-hud__rune--found' : ''}">${m}</span>`));
      }
      const fr = this.quest.getFinalRiteProgress();
      if (fr > 0 || this.quest.getDepth() >= 13) {
        parts.push(...FINAL_RITUAL_SEQUENCE.map((r, i) =>
          `<span class="zh-quest-hud__rune${i < fr ? ' zh-quest-hud__rune--found' : ''}">${r}</span>`));
      }
      this.act3El.innerHTML = parts.join('') || `<span class="zh-quest-hud__rune">${this.quest.getSwarmProgress()}/6</span>`;
    } else {
      this.act3El.style.display = 'none';
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
    const act = this.quest.getAct();
    if (act >= 3) this.showToast('Акт III. Ядро архива.');
    else this.showToast('Акт II. Архив уходит глубже.');
  }
}
