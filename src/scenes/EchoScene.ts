import { Scene } from './Scene';
import { SCENE_IDS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { quest } from '@/systems/QuestSystem';

export class EchoScene extends Scene {
  readonly id = SCENE_IDS.echo;
  readonly label = 'Эхо';
  private words: HTMLElement[] = [];
  private statusEl!: HTMLElement;
  private done = false;

  protected build(): void {
    const phrase = quest.getEchoPhrase();
    const inner = this.createEl('div', 'zh-scene__inner zh-echo');
    const header = this.createEl('div', 'zh-echo__header');
    header.append(
      this.createEl('span', 'zh-echo__label', '◈ акт II · I'),
      this.createEl('h2', 'zh-echo__title', 'Комната эха'),
      this.createEl('p', 'zh-echo__hint', 'нажми слова в правильном порядке. фраза меняется каждый цикл'),
    );

    this.statusEl = this.createEl('p', 'zh-echo__status', `${phrase[0]}...`);

    const pool = this.createEl('div', 'zh-echo__pool');
    for (const word of quest.getEchoWordPool()) {
      const btn = this.createEl('button', 'zh-echo__word', word) as HTMLButtonElement;
      btn.type = 'button';
      btn.addEventListener('click', () => this.onWord(word, btn));
      this.words.push(btn);
      pool.appendChild(btn);
    }

    inner.append(header, this.statusEl, pool);
    this.element.appendChild(inner);

    if (quest.getEchoProgress() >= phrase.length) {
      this.done = true;
      this.statusEl.textContent = `эхо оставило след: ${quest.getCollapseHint()}`;
      this.words.forEach((w) => w.classList.add('zh-echo__word--done'));
    }
  }

  private onWord(word: string, btn: HTMLElement): void {
    if (!quest.canInteract() || this.done) return;

    const result = quest.advanceEcho(word);
    if (result === 'wrong') {
      btn.classList.add('zh-echo__word--wrong');
      setTimeout(() => btn.classList.remove('zh-echo__word--wrong'), 500);
      events.emit(EVT.SCARE_REQUEST, { type: 'static' });
      this.statusEl.textContent = 'порядок сброшен. сначала.';
      this.words.forEach((w) => w.classList.remove('zh-echo__word--lit'));
      return;
    }

    btn.classList.add('zh-echo__word--lit');
    events.emit(EVT.INTERACT, { type: 'rune' });

    if (result === 'done') {
      this.done = true;
      this.statusEl.textContent = `эхо оставило след: ${quest.getCollapseHint()}`;
      setTimeout(() => events.emit(EVT.SCARE_REQUEST, { type: 'face' }), 400);
    } else {
      const next = quest.getEchoPhrase()[quest.getEchoProgress()];
      this.statusEl.textContent = next ? `${next}...` : '...';
    }
  }

  protected onUpdate(_dt: number): void {
    this.words.forEach((w, i) => {
      w.style.opacity = String(this.reveal(i * 0.04));
    });
  }
}
