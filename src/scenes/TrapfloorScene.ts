import { Scene } from './Scene';
import { SCENE_IDS, TRAPFLOOR_LENGTH, TRAPFLOOR_TILES } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class TrapfloorScene extends Scene {
  readonly id = SCENE_IDS.trapfloor;
  readonly label = 'Ловушка';
  private tiles: HTMLElement[] = [];
  private statusEl!: HTMLElement;
  private done = false;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-trapfloor');
    const header = this.createEl('div', 'zh-trapfloor__header');
    header.append(
      this.createEl('span', 'zh-trapfloor__label', '◈ акт V · VI'),
      this.createEl('h2', 'zh-trapfloor__title', 'Ловушка'),
      this.createEl('p', 'zh-trapfloor__hint', `пройди ${TRAPFLOOR_LENGTH} плит. неверная - провал`),
    );
    this.statusEl = this.createEl('p', 'zh-trapfloor__status',
      `${quest.getTrapfloorProgress()} / ${TRAPFLOOR_LENGTH}`);

    const grid = this.createEl('div', 'zh-trapfloor__grid');
    for (let i = 0; i < TRAPFLOOR_TILES; i++) {
      const tile = this.createEl('button', 'zh-trapfloor__tile') as HTMLButtonElement;
      tile.type = 'button';
      tile.dataset.index = String(i);
      tile.addEventListener('click', () => this.onTile(i, tile));
      this.tiles.push(tile);
      grid.appendChild(tile);
    }

    inner.append(header, this.statusEl, grid);
    this.element.appendChild(inner);

    if (quest.getTrapfloorProgress() >= TRAPFLOOR_LENGTH) {
      this.done = true;
      this.statusEl.textContent = 'путь найден';
    }
  }

  private onTile(index: number, tile: HTMLElement): void {
    if (!quest.canInteract() || this.done) return;

    const result = quest.advanceTrapfloor(index);
    if (result === 'wrong') {
      this.tiles.forEach((t) => t.classList.remove('zh-trapfloor__tile--lit'));
      tile.classList.add('zh-trapfloor__tile--wrong');
      setTimeout(() => tile.classList.remove('zh-trapfloor__tile--wrong'), 500);
      events.emit(EVT.SCARE_REQUEST, { type: 'static' });
      this.statusEl.textContent = 'провал. сначала.';
      return;
    }

    tile.classList.add('zh-trapfloor__tile--lit');
    events.emit(EVT.INTERACT, { type: 'rune' });
    this.statusEl.textContent = `${quest.getTrapfloorProgress()} / ${TRAPFLOOR_LENGTH}`;
    if (result === 'done') {
      this.done = true;
      this.statusEl.textContent = 'виселица близко';
      events.emit(EVT.SCARE_REQUEST, { type: 'face' });
    }
  }

  protected onUpdate(_dt: number): void {
    this.tiles.forEach((t, i) => { t.style.opacity = String(this.reveal(i * 0.02)); });
  }
}
