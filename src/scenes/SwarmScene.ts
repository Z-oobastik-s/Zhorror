import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class SwarmScene extends Scene {
  readonly id = SCENE_IDS.swarm;
  readonly label = 'Рой';
  private eyes: HTMLElement[] = [];
  private timerEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private timeLeft = 0;
  private swarmSeconds = 0;
  private realCount = 0;
  private done = false;
  private failed = false;

  protected build(): void {
    this.swarmSeconds = quest.getSwarmTimeSeconds();
    this.timeLeft = this.swarmSeconds;
    this.realCount = quest.getSwarmRealCount();

    const inner = this.createEl('div', 'zh-scene__inner zh-swarm');
    const header = this.createEl('div', 'zh-swarm__header');
    header.append(
      this.createEl('span', 'zh-swarm__label', '◈ акт III · II'),
      this.createEl('h2', 'zh-swarm__title', 'Рой глаз'),
      this.createEl('p', 'zh-swarm__hint', `найди ${this.realCount} настоящих. они моргают. ложные сбрасывают прогресс`),
    );
    this.timerEl = this.createEl('div', 'zh-swarm__timer', String(Math.ceil(this.swarmSeconds)));
    this.statusEl = this.createEl('p', 'zh-swarm__status', `0 / ${this.realCount}`);

    const grid = this.createEl('div', 'zh-swarm__grid');
    for (let i = 0; i < 12; i++) {
      const eye = this.createEl('button', 'zh-swarm__eye') as HTMLButtonElement;
      eye.type = 'button';
      eye.dataset.index = String(i);
      eye.innerHTML = '<span class="zh-swarm__pupil"></span>';
      if (quest.isSwarmReal(i)) eye.classList.add('zh-swarm__eye--real');
      eye.addEventListener('click', () => this.onEye(i, eye));
      this.eyes.push(eye);
      grid.appendChild(eye);
    }

    inner.append(header, this.timerEl, this.statusEl, grid);
    this.element.appendChild(inner);

    if (quest.getSwarmProgress() >= this.realCount) {
      this.done = true;
      this.statusEl.textContent = 'рой рассеян';
    }
  }

  private onEye(index: number, eye: HTMLElement): void {
    if (!quest.canInteract() || this.done || this.failed) return;
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
    this.statusEl.textContent = `${quest.getSwarmProgress()} / ${this.realCount}`;
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
      quest.registerFail();
      quest.resetSwarmProgress();
      this.eyes.forEach((e) => e.classList.remove('zh-swarm__eye--hit'));
      this.swarmSeconds = quest.getSwarmTimeSeconds();
      this.timeLeft = this.swarmSeconds;
      this.failed = false;
      this.statusEl.textContent = 'время. снова.';
      events.emit(EVT.SCARE_REQUEST, { type: 'static' });
    }
  }
}
