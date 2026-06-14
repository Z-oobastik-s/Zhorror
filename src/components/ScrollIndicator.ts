import { events, EVT } from '@/core/EventBus';
import type { ScrollSystem } from '@/systems/ScrollSystem';

export class ScrollIndicator {
  private bar: HTMLElement;
  private fill: HTMLElement;
  private label: HTMLElement;

  constructor(parent: HTMLElement, private scroll: ScrollSystem) {
    const wrap = document.createElement('div');
    wrap.className = 'zh-scroll-indicator';

    this.bar = document.createElement('div');
    this.bar.className = 'zh-scroll-indicator__track';

    this.fill = document.createElement('div');
    this.fill.className = 'zh-scroll-indicator__fill';

    this.label = document.createElement('span');
    this.label.className = 'zh-scroll-indicator__depth';

    this.bar.appendChild(this.fill);
    wrap.append(this.bar, this.label);
    parent.appendChild(wrap);

    events.on(EVT.SCENE_CHANGE, (payload) => {
      const { id } = payload as { id: string };
      this.label.textContent = id;
    });
  }

  update(): void {
    const progress = this.scroll.getProgress();
    this.fill.style.height = `${progress * 100}%`;
  }
}
