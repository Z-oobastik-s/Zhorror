import type { AudioSystem } from '@/systems/AudioSystem';

export class InteractionSystem {
  private mx = 0.5;
  private my = 0.5;

  constructor(_parent: HTMLElement, private audio: AudioSystem) {
    window.addEventListener('mousemove', (e) => {
      this.mx = e.clientX / window.innerWidth;
      this.my = e.clientY / window.innerHeight;
    }, { passive: true });
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
