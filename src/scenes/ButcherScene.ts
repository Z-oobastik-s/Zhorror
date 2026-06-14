import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';
import { butcherMove, checkWinner, type Board } from '@/utils/tictactoe';

export class ButcherScene extends Scene {
  readonly id = SCENE_IDS.butcher;
  readonly label = 'Мясник';
  private board: Board = Array(9).fill('');
  private cells: HTMLButtonElement[] = [];
  private statusEl!: HTMLElement;
  private hintEl!: HTMLElement;
  private done = false;
  private locked = false;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-butcher');
    const header = this.createEl('div', 'zh-butcher__header');
    header.append(
      this.createEl('span', 'zh-butcher__label', '◈ акт IV · II'),
      this.createEl('h2', 'zh-butcher__title', 'Мясник'),
      this.createEl('p', 'zh-butcher__hint', 'крестики-нолики. ты - O, ходишь первым. мясник иногда ошибается'),
    );
    this.statusEl = this.createEl('p', 'zh-butcher__status', 'твой ход');
    this.hintEl = this.createEl('p', 'zh-butcher__code-hint', '');

    const grid = this.createEl('div', 'zh-butcher__grid');
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'zh-butcher__cell';
      cell.addEventListener('click', () => this.onCell(i, cell));
      this.cells.push(cell);
      grid.appendChild(cell);
    }

    inner.append(header, this.statusEl, grid, this.hintEl);
    this.element.appendChild(inner);

    if (quest.isButcherWon()) {
      this.done = true;
      this.statusEl.textContent = 'мясник отступил';
      this.hintEl.textContent = `он оставил след: ${quest.getAbattoirHint()}`;
    }
  }

  private resetBoard(): void {
    this.board = Array(9).fill('');
    this.cells.forEach((c) => {
      c.textContent = '';
      c.classList.remove('zh-butcher__cell--x', 'zh-butcher__cell--o', 'zh-butcher__cell--win');
      c.disabled = false;
    });
    this.locked = false;
    this.statusEl.textContent = 'снова. твой ход';
  }

  private onCell(index: number, cell: HTMLButtonElement): void {
    if (!quest.canInteract() || this.done || this.locked || this.board[index]) return;

    this.board[index] = 'O';
    cell.textContent = 'O';
    cell.classList.add('zh-butcher__cell--o');
    cell.disabled = true;

    const w = checkWinner(this.board);
    if (w === 'O') {
      this.winGame();
      return;
    }
    if (w === 'draw') {
      this.drawGame();
      return;
    }

    this.locked = true;
    this.statusEl.textContent = 'мясник думает...';
    window.setTimeout(() => {
      const move = butcherMove(this.board, quest.getFailCount());
      if (move < 0) return;
      this.board[move] = 'X';
      const butcherCell = this.cells[move];
      butcherCell.textContent = 'X';
      butcherCell.classList.add('zh-butcher__cell--x');
      butcherCell.disabled = true;

      const bw = checkWinner(this.board);
      if (bw === 'X') {
        this.loseGame('мясник выиграл.');
        return;
      }
      if (bw === 'draw') {
        this.drawGame();
        return;
      }
      this.locked = false;
      this.statusEl.textContent = 'твой ход';
    }, 600 + Math.random() * 400);
  }

  private winGame(): void {
    this.done = true;
    this.statusEl.textContent = 'ты выжил. пока.';
    this.hintEl.textContent = `мясник оставил код: ${quest.getAbattoirHint()}`;
    this.cells.forEach((c) => { c.disabled = true; });
    quest.completeButcherTrial();
    events.emit(EVT.INTERACT, { type: 'rune' });
    window.setTimeout(() => events.emit(EVT.SCARE_REQUEST, { type: 'static' }), 500);
  }

  private drawGame(): void {
    this.locked = false;
    this.statusEl.textContent = 'ничья. мясник скрипит. ещё раз.';
    window.setTimeout(() => this.resetBoard(), 900);
  }

  private loseGame(msg: string): void {
    quest.registerFail();
    events.emit(EVT.SCARE_REQUEST, { type: 'face' });
    this.statusEl.textContent = msg;
    window.setTimeout(() => this.resetBoard(), 1200);
  }
}
