import { Scene } from './Scene';
import { SCENE_IDS, SWARM_REAL_INDICES, SWARM_TIME_SECONDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class SwarmScene extends Scene {
  readonly id = SCENE_IDS.swarm;
  readonly label = 'Рой';
  private eyes: HTMLElement[] = [];
  private timerEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private timeLeft = SWARM_TIME_SECONDS;
  private done = false;
  private failed = false;

  protected build(): void {
    const inner = this.createEl('div', 'zh-scene__inner zh-swarm');
    const header = this.createEl('div', 'zh-swarm__header');
    header.append(
      this.createEl('span', 'zh-swarm__label', '◈ акт III · II'),
      this.createEl('h2', 'zh-swarm__title', 'Рой глаз'),
      this.createEl('p', 'zh-swarm__hint', 'найди 6 настоящих. ложные сбрасывают прогресс'),
    );
    this.timerEl = this.createEl('div', 'zh-swarm__timer', String(SWARM_TIME_SECONDS));
    this.statusEl = this.createEl('p', 'zh-swarm__status', '0 / 6');

    const grid = this.createEl('div', 'zh-swarm__grid');
    for (let i = 0; i < 12; i++) {
      const eye = this.createEl('button', 'zh-swarm__eye') as HTMLButtonElement;
      eye.type = 'button';
      eye.dataset.index = String(i);
      eye.innerHTML = '<span class="zh-swarm__pupil"></span>';
      if (SWARM_REAL_INDICES.includes(i as typeof SWARM_REAL_INDICES[number])) {
        eye.classList.add('zh-swarm__eye--real');
      }
      eye.addEventListener('click', () => this.onEye(i, eye));
      this.eyes.push(eye);
      grid.appendChild(eye);
    }

    inner.append(header, this.timerEl, this.statusEl, grid);
    this.element.appendChild(inner);

    if (quest.getSwarmProgress() >= SWARM_REAL_INDICES.length) {
      this.done = true;
      this.statusEl.textContent = 'рой рассеян';
    }
  }

  private onEye(index: number, eye: HTMLElement): void {
    if (this.done || this.failed) return;
    if (eye.classList.contains('zh-swarm__eye--hit')) return;

    const result = quest.registerSwarmHit(index);
    if (result === 'wrong') {
      quest.resetSwarmProgress();
      this.eyes.forEach((e) => e.classList.remove('zh-swarm__eye--hit'));
      events.emit(EVT.SCARE_REQUEST, { type: 'eyes' });
      this.statusEl.textContent = 'ложный глаз. сначала.';
      return;
    }

    eye.classList.add('zh-swarm__eye--hit');
    events.emit(EVT.INTERACT, { type: 'rune' });
    this.statusEl.textContent = `${quest.getSwarmProgress()} / 6`;
    if (result === 'done') {
      this.done = true;
      this.statusEl.textContent = 'тишина перед тишиной...';
    }
  }

  protected onUpdate(dt: number): void {
    if (!this.active || this.done) return;
    this.timeLeft -= dt;
    this.timerEl.textContent = String(Math.max(0, Math.ceil(this.timeLeft)));
    this.timerEl.classList.toggle('zh-swarm__timer--urgent', this.timeLeft <= 8);

    if (this.timeLeft <= 0 && !this.done) {
      this.failed = true;
      quest.resetSwarmProgress();
      this.eyes.forEach((e) => e.classList.remove('zh-swarm__eye--hit'));
      this.timeLeft = SWARM_TIME_SECONDS;
      this.failed = false;
      this.statusEl.textContent = 'время. снова.';
      events.emit(EVT.SCARE_REQUEST, { type: 'static' });
    }
  }
}
