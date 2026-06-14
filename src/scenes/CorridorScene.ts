import { Scene } from './Scene';
import { CORRIDOR_GOAL, CORRIDOR_GRID, SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

type Point = { x: number; y: number };

export class CorridorScene extends Scene {
  readonly id = SCENE_IDS.corridor;
  readonly label = 'Коридор';
  private gridEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private snake: Point = { x: 1, y: 1 };
  private dir: Point = { x: 1, y: 0 };
  private nextDir: Point = { x: 1, y: 0 };
  private food: Point = { x: 5, y: 5 };
  private collected = 0;
  private tick = 0;
  private speed = 0.14;
  private done = false;
  private walls: boolean[][] = [];
  private keyHandler = (e: KeyboardEvent) => this.onKey(e);

  protected build(): void {
    this.walls = quest.getCorridorWalls().map((row) => [...row]);
    const inner = this.createEl('div', 'zh-scene__inner zh-corridor');
    const header = this.createEl('div', 'zh-corridor__header');
    header.append(
      this.createEl('span', 'zh-corridor__label', '◈ акт IV · III'),
      this.createEl('h2', 'zh-corridor__title', 'Кровавый коридор'),
      this.createEl('p', 'zh-corridor__hint', 'стрелки ← ↑ → ↓. собери 10 кусков. стена = скример'),
    );
    this.statusEl = this.createEl('p', 'zh-corridor__status', `0 / ${CORRIDOR_GOAL}`);
    this.gridEl = this.createEl('div', 'zh-corridor__grid');
    this.gridEl.style.setProperty('--corridor-size', String(CORRIDOR_GRID));
    inner.append(header, this.statusEl, this.gridEl);
    this.element.appendChild(inner);
    this.spawnFood();
    this.render();
    window.addEventListener('keydown', this.keyHandler);

    if (quest.isCorridorDone()) {
      this.done = true;
      this.statusEl.textContent = 'коридор пройден';
    }
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.active || this.done) return;
    const map: Record<string, Point> = {
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

  private spawnFood(): void {
    const size = CORRIDOR_GRID;
    for (let n = 0; n < 80; n++) {
      const x = 1 + Math.floor(Math.random() * (size - 2));
      const y = 1 + Math.floor(Math.random() * (size - 2));
      if (!this.walls[y][x] && (x !== this.snake.x || y !== this.snake.y)) {
        this.food = { x, y };
        return;
      }
    }
  }

  private crash(): void {
    quest.registerFail();
    events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });
    this.snake = { x: 1, y: 1 };
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.collected = 0;
    this.statusEl.textContent = 'стена. сначала.';
    this.spawnFood();
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
    if (!this.active || this.done) return;
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
      this.collected += 1;
      this.statusEl.textContent = `${this.collected} / ${CORRIDOR_GOAL}`;
      events.emit(EVT.INTERACT, { type: 'rune' });
      if (this.collected >= CORRIDOR_GOAL) {
        this.done = true;
        this.statusEl.textContent = 'выход близко';
        quest.completeCorridorTrial();
        return;
      }
      this.spawnFood();
      this.speed = Math.max(0.07, this.speed - 0.005);
    }
    this.render();
  }
}
