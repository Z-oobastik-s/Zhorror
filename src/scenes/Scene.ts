export abstract class Scene {
  abstract readonly id: string;
  abstract readonly label: string;
  protected element!: HTMLElement;
  protected progress = 0;
  protected active = false;

  create(): HTMLElement {
    this.element = document.createElement('section');
    this.element.className = `zh-scene zh-scene--${this.id}`;
    this.element.dataset.scene = this.id;
    this.build();
    return this.element;
  }

  protected abstract build(): void;

  update(dt: number, progress: number, active: boolean): void {
    this.progress = progress;
    this.active = active;
    this.onUpdate(dt);
  }

  protected onUpdate(_dt: number): void {
    /* override in subclass */
  }

  protected createEl(tag: string, className: string, text?: string): HTMLElement {
    const el = document.createElement(tag);
    el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  protected setReveal(el: HTMLElement, threshold = 0.2): void {
    const opacity = Math.max(0, Math.min(1, (this.progress - threshold) / (1 - threshold)));
    const translate = (1 - opacity) * 40;
    el.style.opacity = String(opacity);
    el.style.transform = `translateY(${translate}px)`;
  }
}
