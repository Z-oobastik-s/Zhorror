import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class HooksScene extends Scene {
  readonly id = SCENE_IDS.hooks;
  readonly label = 'Крючья';
  private hooks: HTMLElement[] = [];
  private statusEl!: HTMLElement;
  private done = false;
  private target = 0;

  protected build(): void {
    this.target = quest.getHookRealCount();
    const inner = this.createEl('div', 'zh-scene__inner zh-hooks');
    const header = this.createEl('div', 'zh-hooks__header');
    header.append(
      this.createEl('span', 'zh-hooks__label', '◈ акт IV · I'),
      this.createEl('h2', 'zh-hooks__title', 'Крючья'),
      this.createEl('p', 'zh-hooks__hint', `найди ${this.target} крючья с добычей. с кровью капает. пустые режут`),
    );
    this.statusEl = this.createEl('p', 'zh-hooks__status', '0 / 4');

    const row = this.createEl('div', 'zh-hooks__row');
    for (let i = 0; i < 8; i++) {
      const hook = this.createEl('button', 'zh-hooks__hook') as HTMLButtonElement;
      hook.type = 'button';
      const drip = quest.isHookReal(i) ? '<span class="zh-hooks__drip"></span>' : '';
      hook.innerHTML = `<span class="zh-hooks__chain"></span><span class="zh-hooks__blade">⌆</span>${drip}`;
      if (quest.isHookReal(i)) hook.classList.add('zh-hooks__hook--bait');
      hook.addEventListener('click', () => this.onHook(i, hook));
      this.hooks.push(hook);
      row.appendChild(hook);
    }

    inner.append(header, this.statusEl, row);
    this.element.appendChild(inner);

    if (quest.getHooksProgress() >= this.target) {
      this.done = true;
      this.statusEl.textContent = 'добыча собрана';
    }
  }

  private onHook(index: number, hook: HTMLElement): void {
    if (!quest.canInteract() || this.done) return;
    if (hook.classList.contains('zh-hooks__hook--hit')) return;

    const result = quest.registerHookHit(index);
    if (result === 'wrong') {
      quest.resetHooksProgress();
      this.hooks.forEach((h) => h.classList.remove('zh-hooks__hook--hit'));
      hook.classList.add('zh-hooks__hook--wrong');
      setTimeout(() => hook.classList.remove('zh-hooks__hook--wrong'), 500);
      events.emit(EVT.SCARE_REQUEST, { type: 'face' });
      this.statusEl.textContent = 'пустой крюк. сначала.';
      return;
    }

    hook.classList.add('zh-hooks__hook--hit');
    events.emit(EVT.INTERACT, { type: 'rune' });
    this.statusEl.textContent = `${quest.getHooksProgress()} / ${this.target}`;
    if (result === 'done') {
      this.done = true;
      this.statusEl.textContent = 'мясник смотрит...';
    }
  }

  protected onUpdate(_dt: number): void {
    this.hooks.forEach((h, i) => { h.style.opacity = String(this.reveal(i * 0.04)); });
  }
}
