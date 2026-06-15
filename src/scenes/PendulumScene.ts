import { Scene } from './Scene';
import { PENDULUM_GOAL, SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class PendulumScene extends Scene {
  readonly id = SCENE_IDS.pendulum;
  readonly label = 'Маятник';
  private phase = 0;
  private speed = 1.8;
  private statusEl!: HTMLElement;
  private bobEl!: HTMLElement;
  private zoneEl!: HTMLElement;
  private done = false;
  private hits = 0;

  protected build(): void {
    this.speed = quest.getPendulumSpeed();
    this.hits = quest.getPendulumProgress();

    const inner = this.createEl('div', 'zh-scene__inner zh-pendulum');
    const header = this.createEl('div', 'zh-pendulum__header');
    header.append(
      this.createEl('span', 'zh-pendulum__label', '◈ акт V · II'),
      this.createEl('h2', 'zh-pendulum__title', 'Маятник'),
      this.createEl('p', 'zh-pendulum__hint', `отпусти верёвку в зелёной зоне ${PENDULUM_GOAL} раз. промах - сначала`),
    );
    this.statusEl = this.createEl('p', 'zh-pendulum__status', `${this.hits} / ${PENDULUM_GOAL}`);

    const arena = this.createEl('div', 'zh-pendulum__arena');
    const track = this.createEl('div', 'zh-pendulum__track');
    this.zoneEl = this.createEl('div', 'zh-pendulum__zone');
    this.bobEl = this.createEl('div', 'zh-pendulum__bob');
    this.bobEl.innerHTML = '<span class="zh-pendulum__rope"></span><span class="zh-pendulum__weight">⌁</span>';
    track.append(this.zoneEl, this.bobEl);
    arena.appendChild(track);

    const btn = this.createEl('button', 'zh-pendulum__cut', 'отпустить') as HTMLButtonElement;
    btn.type = 'button';
    btn.addEventListener('click', () => this.onCut());

    inner.append(header, this.statusEl, arena, btn);
    this.element.appendChild(inner);

    if (this.hits >= PENDULUM_GOAL) {
      this.done = true;
      this.statusEl.textContent = 'верёвка оборвана';
    }
  }

  private onCut(): void {
    if (!quest.canInteract() || this.done) return;
    const pos = Math.sin(this.phase);
    const inZone = Math.abs(pos) < 0.22;

    if (!inZone) {
      quest.resetPendulumProgress();
      this.hits = 0;
      this.statusEl.textContent = 'промах. сначала.';
      this.bobEl.classList.add('zh-pendulum__bob--wrong');
      setTimeout(() => this.bobEl.classList.remove('zh-pendulum__bob--wrong'), 400);
      events.emit(EVT.SCARE_REQUEST, { type: 'static' });
      return;
    }

    const result = quest.registerPendulumHit();
    this.hits = quest.getPendulumProgress();
    this.statusEl.textContent = `${this.hits} / ${PENDULUM_GOAL}`;
    this.bobEl.classList.add('zh-pendulum__bob--hit');
    setTimeout(() => this.bobEl.classList.remove('zh-pendulum__bob--hit'), 300);
    events.emit(EVT.INTERACT, { type: 'rune' });

    if (result === 'done') {
      this.done = true;
      this.statusEl.textContent = 'они смотрят с потолка...';
      events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });
    }
  }

  protected onUpdate(dt: number): void {
    if (!this.active || this.done) return;
    this.phase += dt * this.speed;
    const pos = Math.sin(this.phase);
    const pct = 50 + pos * 42;
    this.bobEl.style.left = `${pct}%`;
    this.zoneEl.classList.toggle('zh-pendulum__zone--pulse', Math.abs(pos) < 0.22);
  }
}
