import { events, EVT } from '@/core/EventBus';
import type { AudioSystem } from '@/systems/AudioSystem';

export class AudioGate {
  private root: HTMLElement;

  constructor(parent: HTMLElement, private audio: AudioSystem) {
    this.root = document.createElement('div');
    this.root.className = 'zh-audio-gate';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', 'Включите звук');
    this.root.innerHTML = `
      <div class="zh-audio-gate__panel">
        <span class="zh-audio-gate__mark">◉</span>
        <p class="zh-audio-gate__title">архив молчит</p>
        <p class="zh-audio-gate__text">без звука прохождение заблокировано.<br>скримеры, шёпоты и подсказки - только через динамики.</p>
        <button type="button" class="zh-audio-gate__btn">включить звук</button>
        <p class="zh-audio-gate__warn">отключить звук нельзя</p>
      </div>
    `;
    parent.appendChild(this.root);

    const btn = this.root.querySelector('.zh-audio-gate__btn') as HTMLButtonElement;
    btn.addEventListener('click', () => void this.audio.primeAndEnable());

    events.on(EVT.AUDIO_TOGGLE, (payload) => {
      if ((payload as { enabled?: boolean }).enabled) this.hide();
    });

    if (this.audio.isEnabled()) this.hide();
  }

  private hide(): void {
    this.root.classList.add('zh-audio-gate--hidden');
    setTimeout(() => this.root.remove(), 900);
  }
}
