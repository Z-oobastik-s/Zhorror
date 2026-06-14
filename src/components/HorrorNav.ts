interface NavItem {
  id: string;
  label: string;
}

export class HorrorNav {
  private container: HTMLElement;
  private items: HTMLElement[] = [];
  private activeId = '';
  private onNavigate: (id: string) => void;

  constructor(parent: HTMLElement, onNavigate: (id: string) => void) {
    this.onNavigate = onNavigate;
    this.container = document.createElement('nav');
    this.container.className = 'zh-nav';
    this.container.setAttribute('aria-label', 'Навигация по архиву');
    parent.appendChild(this.container);

    window.addEventListener('zh-navigate', ((e: CustomEvent) => {
      this.onNavigate(e.detail.scene);
    }) as EventListener);
  }

  setScenes(scenes: NavItem[]): void {
    this.container.innerHTML = '';
    this.items = [];

    for (const scene of scenes) {
      const item = document.createElement('div');
      item.className = 'zh-nav__sigil';
      item.dataset.scene = scene.id;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', scene.label);

      item.innerHTML = `
        <span class="zh-nav__sigil-mark">⬡</span>
        <span class="zh-nav__sigil-label">${scene.label}</span>
        <span class="zh-nav__sigil-glow"></span>
      `;

      item.addEventListener('click', () => this.onNavigate(scene.id));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.onNavigate(scene.id);
        }
      });

      this.items.push(item);
      this.container.appendChild(item);
    }
  }

  setActive(id: string): void {
    this.activeId = id;
    this.items.forEach((item) => {
      item.classList.toggle('zh-nav__sigil--active', item.dataset.scene === id);
    });
  }
}
