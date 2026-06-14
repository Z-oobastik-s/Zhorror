export abstract class Scene {
  abstract readonly id: string;
  abstract readonly label: string;
  protected element!: HTMLElement;
  protected progress = 0;
  protected active = false;
  protected visible = false;

  create(): HTMLElement {
    this.element = document.createElement('section');
    this.element.className = `zh-scene zh-scene--${this.id}`;
    this.element.dataset.scene = this.id;
    this.build();
    return this.element;
  }

  getElement(): HTMLElement {
    return this.element;
  }

  protected abstract build(): void;

  update(dt: number, progress: number, active: boolean, visible: boolean): void {
    this.progress = progress;
    this.active = active;
    this.visible = visible;
    this.element.classList.toggle('zh-scene--active', active);
    this.element.classList.toggle('zh-scene--visible', visible);
    if (!visible && !active) return;
    this.onUpdate(dt);
  }

  protected onUpdate(_dt: number): void {
    /* override */
  }

  /** 1 когда секция активна, иначе плавно по скроллу */
  protected reveal(stagger = 0): number {
    if (this.active) return 1;
    return Math.max(0, Math.min(1, (this.progress - stagger) / 0.35));
  }

  protected applyReveal(el: HTMLElement, stagger = 0): void {
    const v = this.reveal(stagger);
    el.style.opacity = String(v);
    el.style.transform = v >= 1 ? 'none' : `translateY(${(1 - v) * 24}px)`;
  }

  protected createEl(tag: string, className: string, text?: string): HTMLElement {
    const el = document.createElement(tag);
    el.className = className;
    if (text) el.textContent = text;
    return el;
  }
}
