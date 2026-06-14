import { Scene } from './Scene';
import { CORRIDOR_GOAL, CORRIDOR_GRID, SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { setAmbientScareBlocked } from '@/systems/MinigameFocus';
import { quest } from '@/systems/QuestSystem';
import { pickReachableFood, type GridPoint } from '@/utils/corridor';

type GameState = 'ready' | 'playing' | 'crashed' | 'done';

export class CorridorScene extends Scene {
  readonly id = SCENE_IDS.corridor;
  readonly label = 'Коридор';
  private gridEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private gateEl!: HTMLElement;
  private gateTextEl!: HTMLElement;
  private snake: GridPoint = { x: 1, y: 1 };
  private dir: GridPoint = { x: 1, y: 0 };
  private nextDir: GridPoint = { x: 1, y: 0 };
  private food: GridPoint = { x: 5, y: 5 };
  private tick = 0;
  private speed = 0.17;
  private gameState: GameState = 'ready';
  private scareActive = false;
  private walls: boolean[][] = [];
  private keyHandler = (e: KeyboardEvent) => this.onKey(e);

  protected build(): void {
    this.walls = quest.getCorridorWalls().map((row) => [...row]);
    const inner = this.createEl('div', 'zh-scene__inner zh-corridor');
    const header = this.createEl('div', 'zh-corridor__header');
    header.append(
      this.createEl('span', 'zh-corridor__label', '◈ акт IV · III'),
      this.createEl('h2', 'zh-corridor__title', 'Кровавый коридор'),
      this.createEl('p', 'zh-corridor__hint', 'пробел - старт. прогресс сохраняется. стрелки ← ↑ → ↓'),
    );
    this.statusEl = this.createEl('p', 'zh-corridor__status', this.progressText());

    const playWrap = this.createEl('div', 'zh-corridor__play');
    this.gridEl = this.createEl('div', 'zh-corridor__grid');
    this.gridEl.style.setProperty('--corridor-size', String(CORRIDOR_GRID));
    this.gateEl = this.createEl('div', 'zh-corridor__gate');
    this.gateTextEl = this.createEl('span', 'zh-corridor__gate-text', 'пробел · начать');
    this.gateEl.appendChild(this.gateTextEl);
    playWrap.append(this.gridEl, this.gateEl);

    inner.append(header, this.statusEl, playWrap);
    this.element.appendChild(inner);
    this.spawnFood();
    this.render();
    window.addEventListener('keydown', this.keyHandler);
    events.on(EVT.SCARE, () => { this.scareActive = true; });
    events.on(EVT.SCARE_END, () => { this.scareActive = false; });

    if (quest.isCorridorDone()) {
      this.gameState = 'done';
      this.gateEl.classList.add('zh-corridor__gate--hidden');
      this.statusEl.textContent = 'коридор пройден';
    }
  }

  private progressText(): string {
    return `${quest.getCorridorProgress()} / ${CORRIDOR_GOAL}`;
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.active || this.gameState === 'done') return;

    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (this.gameState === 'ready' || this.gameState === 'crashed') {
        if (this.scareActive) return;
        this.beginRun();
      }
      return;
    }

    if (this.gameState !== 'playing' || this.scareActive) return;

    const map: Record<string, GridPoint> = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    };
    const nd = map[e.key];
    if (!nd) return;
    e.preventDefault();
    if (nd.x === -this.dir.x && nd.y === -this.dir.y) return;
    this.nextDir = nd;
  }

  private beginRun(): void {
    this.snake = { x: 1, y: 1 };
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.tick = 0;
    const progress = quest.getCorridorProgress();
    this.speed = Math.max(0.11, 0.17 - progress * 0.004);
    this.gameState = 'playing';
    this.gateEl.classList.add('zh-corridor__gate--hidden');
    this.gateTextEl.textContent = 'пробел · сначала';
    this.statusEl.textContent = this.progressText();
    setAmbientScareBlocked(true);
    this.spawnFood();
    this.render();
  }

  private spawnFood(): void {
    const next = pickReachableFood(this.walls, this.snake, this.food);
    if (next) {
      this.food = next;
      return;
    }
    this.food = { x: -1, y: -1 };
  }

  private crash(): void {
    if (this.gameState !== 'playing') return;
    this.gameState = 'crashed';
    setAmbientScareBlocked(false);
    quest.registerFail();
    events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });
    this.snake = { x: 1, y: 1 };
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.statusEl.textContent = `${this.progressText()} · стена. пробел после скримера.`;
    this.gateEl.classList.remove('zh-corridor__gate--hidden');
    this.render();
  }

  private render(): void {
    const size = CORRIDOR_GRID;
    let html = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let cls = 'zh-corridor__cell';
        if (this.walls[y][x]) cls += ' zh-corridor__cell--wall';
        else if (x === this.snake.x && y === this.snake.y) cls += ' zh-corridor__cell--snake';
        else if (x === this.food.x && y === this.food.y) cls += ' zh-corridor__cell--food';
        html += `<span class="${cls}"></span>`;
      }
    }
    this.gridEl.innerHTML = html;
  }

  protected onUpdate(dt: number): void {
    if (!this.active) {
      if (this.gameState === 'playing') {
        this.gameState = 'ready';
        setAmbientScareBlocked(false);
        this.gateEl.classList.remove('zh-corridor__gate--hidden');
        this.gateTextEl.textContent = 'пробел · начать';
      }
      return;
    }

    if (this.gameState !== 'playing' || this.scareActive) return;

    this.tick += dt;
    if (this.tick < this.speed) return;
    this.tick = 0;
    this.dir = this.nextDir;
    const nx = this.snake.x + this.dir.x;
    const ny = this.snake.y + this.dir.y;
    if (this.walls[ny]?.[nx]) {
      this.crash();
      return;
    }
    this.snake = { x: nx, y: ny };
    if (nx === this.food.x && ny === this.food.y) {
      const total = quest.registerCorridorPiece();
      this.statusEl.textContent = this.progressText();
      events.emit(EVT.INTERACT, { type: 'rune' });
      if (total >= CORRIDOR_GOAL) {
        this.gameState = 'done';
        setAmbientScareBlocked(false);
        this.statusEl.textContent = 'выход близко';
        quest.completeCorridorTrial();
        return;
      }
      this.spawnFood();
      this.speed = Math.max(0.1, this.speed - 0.003);
    }
    this.render();
  }
}
