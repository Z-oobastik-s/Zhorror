import { damp } from '@/utils/math';
import { events, EVT } from '@/core/EventBus';

export class CursorSystem {
  x = window.innerWidth / 2;
  y = window.innerHeight / 2;
  smoothX = this.x;
  smoothY = this.y;
  private cursor: HTMLElement;
  private trail: HTMLElement;
  private visible = false;

  constructor(parent: HTMLElement) {
    this.cursor = document.createElement('div');
    this.cursor.className = 'zh-cursor';
    this.trail = document.createElement('div');
    this.trail.className = 'zh-cursor-trail';
    parent.appendChild(this.trail);
    parent.appendChild(this.cursor);

    if ('ontouchstart' in window) {
      this.cursor.style.display = 'none';
      this.trail.style.display = 'none';
      return;
    }

    window.addEventListener('mousemove', this.onMove);
    window.addEventListener('mouseenter', () => { this.visible = true; });
    window.addEventListener('mouseleave', () => {
      this.visible = false;
      this.cursor.style.opacity = '0';
    });
  }

  private onMove = (e: MouseEvent): void => {
    this.x = e.clientX;
    this.y = e.clientY;
    this.visible = true;
    events.emit(EVT.CURSOR_MOVE, { x: this.x, y: this.y });
  };

  update(dt: number): void {
    if ('ontouchstart' in window) return;
    this.smoothX = damp(this.smoothX, this.x, 18, dt);
    this.smoothY = damp(this.smoothY, this.y, 18, dt);

    const trailX = damp(parseFloat(this.trail.dataset.x ?? String(this.smoothX)), this.smoothX, 8, dt);
    const trailY = damp(parseFloat(this.trail.dataset.y ?? String(this.smoothY)), this.smoothY, 8, dt);
    this.trail.dataset.x = String(trailX);
    this.trail.dataset.y = String(trailY);

    this.cursor.style.transform = `translate(${this.smoothX}px, ${this.smoothY}px)`;
    this.trail.style.transform = `translate(${trailX}px, ${trailY}px)`;
    this.cursor.style.opacity = this.visible ? '1' : '0';
  }

  getNormalized(): { nx: number; ny: number } {
    return {
      nx: this.smoothX / window.innerWidth,
      ny: this.smoothY / window.innerHeight,
    };
  }
}
