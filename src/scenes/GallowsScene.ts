import { Scene } from './Scene';
import { GALLOWS_ROPE_COUNT, SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class GallowsScene extends Scene {
  readonly id = SCENE_IDS.gallows;
  readonly label = 'Верёвки';
  private ropes: HTMLElement[] = [];
  private statusEl!: HTMLElement;
  private done = false;
  private target = 0;

  protected build(): void {
    this.target = quest.getGallowsRealCount();
    const inner = this.createEl('div', 'zh-scene__inner zh-gallows');
    const header = this.createEl('div', 'zh-gallows__header');
    header.append(
      this.createEl('span', 'zh-gallows__label', '◈ акт V · I'),
      this.createEl('h2', 'zh-gallows__title', 'Верёвки'),
      this.createEl('p', 'zh-gallows__hint', `найди ${this.target} петель с грузом. они качаются. пустые душат`),
    );
    this.statusEl = this.createEl('p', 'zh-gallows__status', `0 / ${this.target}`);

    const row = this.createEl('div', 'zh-gallows__row');
    for (let i = 0; i < GALLOWS_ROPE_COUNT; i++) {
      const rope = this.createEl('button', 'zh-gallows__rope') as HTMLButtonElement;
      rope.type = 'button';
      rope.innerHTML = '<span class="zh-gallows__cord"></span><span class="zh-gallows__noose">⌁</span>';
      if (quest.isGallowsReal(i)) rope.classList.add('zh-gallows__rope--weighted');
      rope.addEventListener('click', () => this.onRope(i, rope));
      this.ropes.push(rope);
      row.appendChild(rope);
    }

    inner.append(header, this.statusEl, row);
    this.element.appendChild(inner);

    if (quest.getGallowsProgress() >= this.target) {
      this.done = true;
      this.statusEl.textContent = 'петли собраны';
    }
  }

  private onRope(index: number, rope: HTMLElement): void {
    if (!quest.canInteract() || this.done) return;
    if (rope.classList.contains('zh-gallows__rope--hit')) return;

    const result = quest.registerGallowsHit(index);
    if (result === 'wrong') {
      quest.resetGallowsProgress();
      this.ropes.forEach((r) => r.classList.remove('zh-gallows__rope--hit'));
      rope.classList.add('zh-gallows__rope--wrong');
      setTimeout(() => rope.classList.remove('zh-gallows__rope--wrong'), 500);
      events.emit(EVT.SCARE_REQUEST, { type: 'face' });
      this.statusEl.textContent = 'пустая петля. сначала.';
      return;
    }

    rope.classList.add('zh-gallows__rope--hit');
    events.emit(EVT.INTERACT, { type: 'rune' });
    this.statusEl.textContent = `${quest.getGallowsProgress()} / ${this.target}`;
    if (result === 'done') {
      this.done = true;
      this.statusEl.textContent = 'маятник качается...';
    }
  }

  protected onUpdate(_dt: number): void {
    this.ropes.forEach((r, i) => { r.style.opacity = String(this.reveal(i * 0.03)); });
  }
}
