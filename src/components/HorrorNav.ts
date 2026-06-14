interface NavItem {

  id: string;

  label: string;

}



export class HorrorNav {

  private container: HTMLElement;

  private items: HTMLElement[] = [];

  private onNavigate: (id: string) => void;

  private isUnlocked: (id: string) => boolean;

  private onLocked: () => void;



  constructor(

    parent: HTMLElement,

    onNavigate: (id: string) => void,

    isUnlocked: (id: string) => boolean,

    onLocked: () => void,

  ) {

    this.onNavigate = onNavigate;

    this.isUnlocked = isUnlocked;

    this.onLocked = onLocked;

    this.container = document.createElement('nav');

    this.container.className = 'zh-nav';

    this.container.setAttribute('aria-label', 'Навигация по архиву');

    parent.appendChild(this.container);



    window.addEventListener('zh-navigate', ((e: CustomEvent) => {

      this.tryNavigate(e.detail.scene);

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



      item.addEventListener('click', () => this.tryNavigate(scene.id));

      item.addEventListener('keydown', (e) => {

        if (e.key === 'Enter' || e.key === ' ') {

          e.preventDefault();

          this.tryNavigate(scene.id);

        }

      });



      this.items.push(item);

      this.container.appendChild(item);

    }



    this.refreshLocks();

  }



  refreshLocks(): void {

    this.items.forEach((item) => {

      const id = item.dataset.scene ?? '';

      const locked = !this.isUnlocked(id);

      item.classList.toggle('zh-nav__sigil--locked', locked);

      item.setAttribute('aria-disabled', locked ? 'true' : 'false');

    });

  }



  setActive(id: string): void {

    this.items.forEach((item) => {

      item.classList.toggle('zh-nav__sigil--active', item.dataset.scene === id);

    });

  }



  private tryNavigate(id: string): void {

    if (!this.isUnlocked(id)) {

      this.onLocked();

      return;

    }

    this.onNavigate(id);

  }

}


