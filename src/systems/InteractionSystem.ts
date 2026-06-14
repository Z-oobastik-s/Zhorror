import { events, EVT } from '@/core/EventBus';
import type { AudioSystem } from './AudioSystem';

export class InteractionSystem {
  private mx = 0.5;
  private my = 0.5;
  private hintEl: HTMLElement | null = null;

  constructor(parent: HTMLElement, private audio: AudioSystem) {
    window.addEventListener('mousemove', (e) => {
      this.mx = e.clientX / window.innerWidth;
      this.my = e.clientY / window.innerHeight;
    }, { passive: true });

    this.hintEl = document.createElement('div');
    this.hintEl.className = 'zh-audio-hint';
    this.hintEl.innerHTML = '<span>◉</span> нажми где угодно - услышишь архив';
    parent.appendChild(this.hintEl);

    events.once(EVT.AUDIO_TOGGLE, () => {
      this.hintEl?.classList.add('zh-audio-hint--hide');
      setTimeout(() => this.hintEl?.remove(), 800);
    });
  }

  getParallax(): { x: number; y: number } {
    return { x: (this.mx - 0.5) * 2, y: (this.my - 0.5) * 2 };
  }

  bindHover(el: HTMLElement, sfx: 'hover' | 'paper' | 'rune' = 'hover'): void {
    el.addEventListener('mouseenter', () => {
      if (this.audio.isEnabled()) this.audio.playSfx(sfx);
    });
    el.addEventListener('click', () => {
      if (this.audio.isEnabled()) this.audio.playSfx('click');
    });
  }
}
