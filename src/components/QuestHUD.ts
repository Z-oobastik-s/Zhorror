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
  private act4El: HTMLElement;
  private cycleEl: HTMLElement;
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
      <div class="zh-quest-hud__cycle"></div>
      <div class="zh-quest-hud__chapter"></div>
      <div class="zh-quest-hud__objective"></div>
      <div class="zh-quest-hud__fragments"></div>
      <div class="zh-quest-hud__ritual"></div>
      <div class="zh-quest-hud__echo"></div>
      <div class="zh-quest-hud__act3"></div>
      <div class="zh-quest-hud__act4"></div>
      <button type="button" class="zh-quest-hud__reset">новый цикл</button>
    `;
    parent.appendChild(this.root);

    this.actEl = this.root.querySelector('.zh-quest-hud__act')!;
    this.cycleEl = this.root.querySelector('.zh-quest-hud__cycle')!;
    this.chapterEl = this.root.querySelector('.zh-quest-hud__chapter')!;
    this.objectiveEl = this.root.querySelector('.zh-quest-hud__objective')!;
    this.fragmentsEl = this.root.querySelector('.zh-quest-hud__fragments')!;
    this.ritualEl = this.root.querySelector('.zh-quest-hud__ritual')!;
    this.echoEl = this.root.querySelector('.zh-quest-hud__echo')!;
    this.act3El = this.root.querySelector('.zh-quest-hud__act3')!;
    this.act4El = this.root.querySelector('.zh-quest-hud__act4')!;
    this.resetBtn = this.root.querySelector('.zh-quest-hud__reset') as HTMLButtonElement;

    this.resetModal = document.createElement('div');
    this.resetModal.className = 'zh-reset-modal';
    this.resetModal.setAttribute('role', 'dialog');
    this.resetModal.setAttribute('aria-modal', 'true');
    this.resetModal.setAttribute('aria-hidden', 'true');
    this.resetModal.setAttribute('aria-label', 'Подтверждение нового цикла');
    this.resetModal.innerHTML = `
      <div class="zh-reset-modal__backdrop" data-reset-close></div>
      <div class="zh-reset-modal__panel">
        <span class="zh-reset-modal__mark">☍</span>
        <p class="zh-reset-modal__title">новый цикл</p>
        <p class="zh-reset-modal__text">прогресс и раскладка квестов будут стёрты.<br>архив перестроится заново.</p>
        <p class="zh-reset-modal__warn">это нельзя отменить</p>
        <div class="zh-reset-modal__actions">
          <button type="button" class="zh-reset-modal__btn zh-reset-modal__btn--ghost" data-reset-cancel>остаться</button>
          <button type="button" class="zh-reset-modal__btn zh-reset-modal__btn--danger" data-reset-confirm>начать заново</button>
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
    const ritualSeq = this.quest.getRitualSequence();
    const finalSeq = this.quest.getFinalRiteSequence();
    const catacombsTarget = this.quest.getCatacombMarksTarget();

    const actLabel = act === 1 ? 'I' : act === 2 ? 'II' : act === 3 ? 'III' : 'IV';
    this.actEl.textContent = `акт ${actLabel}`;
    this.cycleEl.textContent = `цикл ${this.quest.getSeed().slice(0, 8)} · ошибок ${this.quest.getFailCount()}`;
    this.chapterEl.textContent = `глава ${info.index}: ${info.title}`;
    this.objectiveEl.textContent = this.quest.getObjective();

    const depth = this.quest.getDepth();
    if (act === 1 && depth >= 1 && depth < 2) {
      this.fragmentsEl.style.display = 'flex';
      const collected = new Set(this.quest.getFragments());
      this.fragmentsEl.innerHTML = ritualSeq
        .map((r) => `<span class="zh-quest-hud__rune${collected.has(r) ? ' zh-quest-hud__rune--found' : ''}">${r}</span>`)
        .join('');
    } else {
      this.fragmentsEl.style.display = 'none';
    }

    if (act === 1 && depth >= 3 && depth < 4 && !this.quest.isAct1Complete()) {
      this.ritualEl.style.display = 'flex';
      const step = this.quest.getRitualProgress();
      this.ritualEl.innerHTML = ritualSeq
        .map((r, i) => `<span class="zh-quest-hud__rune${i < step ? ' zh-quest-hud__rune--found' : ''}">${r}</span>`)
        .join('');
    } else {
      this.ritualEl.style.display = 'none';
    }

    const echoPhrase = this.quest.getEchoPhrase();
    if (act === 2 && this.quest.getEchoProgress() < echoPhrase.length && !this.quest.isAct2Complete()) {
      this.echoEl.style.display = 'flex';
      const step = this.quest.getEchoProgress();
      this.echoEl.innerHTML = echoPhrase
        .map((w, i) => `<span class="zh-quest-hud__word${i < step ? ' zh-quest-hud__word--found' : ''}">${w}</span>`)
        .join('');
    } else {
      this.echoEl.style.display = 'none';
    }

    if (act === 3 && !this.quest.isAct3Complete()) {
      this.act3El.style.display = 'flex';
      const parts: string[] = [];
      if (this.quest.getCatacombMarks().length > 0 || this.quest.getChapterInfo().scene === 'catacombs') {
        const marks = new Set(this.quest.getCatacombMarks());
        parts.push(...catacombsTarget.map((m) =>
          `<span class="zh-quest-hud__rune${marks.has(m) ? ' zh-quest-hud__rune--found' : ''}">${m}</span>`));
      }
      const fr = this.quest.getFinalRiteProgress();
      if (fr > 0 || this.quest.getDepth() >= 13) {
        parts.push(...finalSeq.map((r, i) =>
          `<span class="zh-quest-hud__rune${i < fr ? ' zh-quest-hud__rune--found' : ''}">${r}</span>`));
      }
      if (parts.length === 0 && this.quest.getChapterInfo().scene === 'swarm') {
        parts.push(`<span class="zh-quest-hud__rune">${this.quest.getSwarmProgress()} / ${this.quest.getSwarmRealCount()}</span>`);
      }
      this.act3El.innerHTML = parts.join('');
    } else {
      this.act3El.style.display = 'none';
    }

    if (act === 4 && !this.quest.isComplete()) {
      this.act4El.style.display = 'flex';
      const parts: string[] = [];
      const scene = this.quest.getChapterInfo().scene;
      if (scene === 'hooks' || this.quest.getHooksProgress() > 0) {
        parts.push(`<span class="zh-quest-hud__rune">${this.quest.getHooksProgress()} / ${this.quest.getHookRealCount()}</span>`);
      }
      if (this.quest.isButcherWon()) {
        parts.push(`<span class="zh-quest-hud__rune zh-quest-hud__rune--found">☒</span>`);
      }
      if (this.quest.isCorridorDone()) {
        parts.push(`<span class="zh-quest-hud__rune zh-quest-hud__rune--found">⌇</span>`);
      }
      const meatSeq = this.quest.getMeatSequence();
      const meatStep = this.quest.getMeatlockProgress();
      if (meatStep > 0 || scene === 'meatlock') {
        parts.push(...meatSeq.map((r, i) =>
          `<span class="zh-quest-hud__rune${i < meatStep ? ' zh-quest-hud__rune--found' : ''}">${r}</span>`));
      }
      this.act4El.innerHTML = parts.join('');
    } else {
      this.act4El.style.display = 'none';
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
    if (act >= 4) this.showToast('Акт IV. Бойня. Мясник смотрит.');
    else if (act >= 3) this.showToast('Акт III. Ядро архива. Раскладка новая.');
    else this.showToast('Акт II. Архив уходит глубже.');
  }
}
