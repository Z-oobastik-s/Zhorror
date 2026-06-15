import { Scene } from './Scene';
import {
  SCENE_IDS,
  TRAPFLOOR_LENGTH,
  TRAPFLOOR_SHOW_PAUSE_MS,
  TRAPFLOOR_SHOW_STEP_MS,
  TRAPFLOOR_TILES,
} from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

type Phase = 'memory' | 'input' | 'done';

export class TrapfloorScene extends Scene {
  readonly id = SCENE_IDS.trapfloor;
  readonly label = 'Ловушка';
  private tiles: HTMLElement[] = [];
  private statusEl!: HTMLElement;
  private hintEl!: HTMLElement;
  private done = false;
  private phase: Phase = 'memory';
  private showStep = 0;
  private showTimer = 0;
  private showPause = 0;
  private inputLocked = false;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-trapfloor');
    const header = this.createEl('div', 'zh-trapfloor__header');
    header.append(
      this.createEl('span', 'zh-trapfloor__label', '◈ акт V · VI'),
      this.createEl('h2', 'zh-trapfloor__title', 'Ловушка'),
      this.createEl('p', 'zh-trapfloor__hint', `запомни путь из ${TRAPFLOOR_LENGTH} плит. неверная - сначала`),
    );
    this.statusEl = this.createEl('p', 'zh-trapfloor__status', 'смотри...');
    this.hintEl = this.createEl('p', 'zh-trapfloor__path-hint', '');

    const grid = this.createEl('div', 'zh-trapfloor__grid');
    for (let i = 0; i < TRAPFLOOR_TILES; i++) {
      const tile = this.createEl('button', 'zh-trapfloor__tile') as HTMLButtonElement;
      tile.type = 'button';
      tile.dataset.index = String(i);
      tile.textContent = String(i + 1);
      tile.setAttribute('aria-label', `плита ${i + 1}`);
      tile.addEventListener('click', () => this.onTile(i, tile));
      this.tiles.push(tile);
      grid.appendChild(tile);
    }

    inner.append(header, this.statusEl, this.hintEl, grid);
    this.element.appendChild(inner);

    if (quest.getTrapfloorProgress() >= TRAPFLOOR_LENGTH) {
      this.phase = 'done';
      this.done = true;
      this.statusEl.textContent = 'путь найден';
    } else if (quest.getTrapfloorProgress() > 0) {
      this.phase = 'input';
      this.statusEl.textContent = `${quest.getTrapfloorProgress()} / ${TRAPFLOOR_LENGTH}`;
      this.hintEl.textContent = 'повтори путь';
      this.markProgress();
    }
  }

  private markProgress(): void {
    const seq = quest.getTrapFloorSequence();
    for (let i = 0; i < quest.getTrapfloorProgress(); i++) {
      this.tiles[seq[i]]?.classList.add('zh-trapfloor__tile--lit');
    }
  }

  private clearHighlights(): void {
    this.tiles.forEach((t) => {
      t.classList.remove('zh-trapfloor__tile--showing', 'zh-trapfloor__tile--lit', 'zh-trapfloor__tile--wrong');
    });
  }

  private restartMemory(): void {
    quest.resetTrapfloorProgress();
    this.phase = 'memory';
    this.showStep = 0;
    this.showTimer = 0;
    this.showPause = 0;
    this.inputLocked = false;
    this.clearHighlights();
    this.statusEl.textContent = 'смотри снова...';
    this.hintEl.textContent = '';
  }

  private startInput(): void {
    this.phase = 'input';
    this.clearHighlights();
    this.markProgress();
    this.statusEl.textContent = `${quest.getTrapfloorProgress()} / ${TRAPFLOOR_LENGTH}`;
    this.hintEl.textContent = 'повтори путь';
  }

  private onTile(index: number, tile: HTMLElement): void {
    if (!quest.canInteract() || this.done || this.phase !== 'input' || this.inputLocked) return;

    const result = quest.advanceTrapfloor(index);
    if (result === 'wrong') {
      this.inputLocked = true;
      tile.classList.add('zh-trapfloor__tile--wrong');
      events.emit(EVT.SCARE_REQUEST, { type: 'static' });
      this.statusEl.textContent = 'провал. смотри снова.';
      setTimeout(() => {
        this.inputLocked = false;
        this.restartMemory();
      }, 700);
      return;
    }

    tile.classList.add('zh-trapfloor__tile--lit');
    events.emit(EVT.INTERACT, { type: 'rune' });
    this.statusEl.textContent = `${quest.getTrapfloorProgress()} / ${TRAPFLOOR_LENGTH}`;
    if (result === 'done') {
      this.done = true;
      this.phase = 'done';
      this.statusEl.textContent = 'виселица близко';
      this.hintEl.textContent = '';
      events.emit(EVT.SCARE_REQUEST, { type: 'face' });
    }
  }

  protected onUpdate(dt: number): void {
    if (!this.active) {
      this.tiles.forEach((t, i) => { t.style.opacity = String(this.reveal(i * 0.02)); });
      return;
    }

    this.tiles.forEach((t) => { t.style.opacity = '1'; });

    if (this.done || this.phase !== 'memory') return;

    const seq = quest.getTrapFloorSequence();
    if (seq.length === 0) return;

    if (this.showPause > 0) {
      this.showPause -= dt;
      if (this.showPause <= 0) this.startInput();
      return;
    }

    this.showTimer += dt;
    const stepMs = TRAPFLOOR_SHOW_STEP_MS / 1000;
    if (this.showTimer < stepMs) return;

    this.showTimer = 0;
    this.tiles.forEach((t) => t.classList.remove('zh-trapfloor__tile--showing'));

    if (this.showStep < seq.length) {
      const tileIndex = seq[this.showStep];
      this.tiles[tileIndex]?.classList.add('zh-trapfloor__tile--showing');
      this.statusEl.textContent = `шаг ${this.showStep + 1} / ${seq.length}`;
      this.showStep += 1;
      return;
    }

    this.showPause = TRAPFLOOR_SHOW_PAUSE_MS / 1000;
    this.statusEl.textContent = 'повтори';
  }
}
