import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class CatacombsScene extends Scene {
  readonly id = SCENE_IDS.catacombs;
  readonly label = 'Катакомбы';
  private doors: HTMLElement[] = [];
  private statusEl!: HTMLElement;
  private done = false;
  private targetCount = 0;

  protected build(): void {
    this.targetCount = quest.getCatacombMarksTarget().length;
    const inner = this.createEl('div', 'zh-scene__inner zh-catacombs');
    const header = this.createEl('div', 'zh-catacombs__header');
    header.append(
      this.createEl('span', 'zh-catacombs__label', '◈ акт III · I'),
      this.createEl('h2', 'zh-catacombs__title', 'Зал дверей'),
      this.createEl('p', 'zh-catacombs__hint', `найди ${this.targetCount} двери. метки слева в HUD. раскладка меняется`),
    );
    this.statusEl = this.createEl('p', 'zh-catacombs__status', '0 / 4');

    const grid = this.createEl('div', 'zh-catacombs__grid');
    quest.getCatacombDoors().forEach((rune, i) => {
      const door = this.createEl('button', 'zh-catacombs__door') as HTMLButtonElement;
      door.type = 'button';
      door.innerHTML = `<span class="zh-catacombs__door-id">${i + 1}</span><span class="zh-catacombs__door-rune">${rune}</span>`;
      door.addEventListener('click', () => this.onDoor(rune, door));
      this.doors.push(door);
      grid.appendChild(door);
    });

    inner.append(header, this.statusEl, grid);
    this.element.appendChild(inner);

    if (quest.getCatacombMarks().length >= this.targetCount) {
      this.done = true;
      this.statusEl.textContent = 'зал пройден';
      this.doors.forEach((d) => d.classList.add('zh-catacombs__door--done'));
    }
  }

  private onDoor(rune: string, door: HTMLElement): void {
    if (!quest.canInteract() || this.done) return;
    const result = quest.collectCatacombMark(rune);
    if (result === 'wrong') {
      door.classList.add('zh-catacombs__door--wrong');
      setTimeout(() => door.classList.remove('zh-catacombs__door--wrong'), 500);
      events.emit(EVT.SCARE_REQUEST, { type: 'face' });
      this.statusEl.textContent = 'не та дверь';
      return;
    }
    door.classList.add('zh-catacombs__door--found');
    events.emit(EVT.INTERACT, { type: 'rune' });
    this.statusEl.textContent = `${quest.getCatacombMarks().length} / ${this.targetCount}`;
    if (result === 'done') {
      this.done = true;
      this.statusEl.textContent = 'рой пробуждается...';
    }
  }

  protected onUpdate(_dt: number): void {
    this.doors.forEach((d, i) => { d.style.opacity = String(this.reveal(i * 0.03)); });
  }
}
