import { BRAND } from '@/config/constants';

export class BootSequence {
  private overlay: HTMLElement;
  private resolve!: () => void;

  constructor(parent: HTMLElement) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'zh-boot';
    this.overlay.innerHTML = `
      <div class="zh-boot__scanlines"></div>
      <div class="zh-boot__content">
        <div class="zh-boot__lines">
          <p class="zh-boot__line" data-delay="0">инициализация архива...</p>
          <p class="zh-boot__line" data-delay="400">проверка целостности ████░░░░ 47%</p>
          <p class="zh-boot__line" data-delay="800">обнаружена аномалия в секторе Z</p>
          <p class="zh-boot__line" data-delay="1200">доступ разрешен: ${BRAND.name}</p>
          <p class="zh-boot__line" data-delay="1600">автор записи: ${BRAND.author}</p>
          <p class="zh-boot__line zh-boot__line--warn" data-delay="2200">⚠ вы не должны были здесь оказаться</p>
        </div>
        <div class="zh-boot__title">${BRAND.name}</div>
      </div>
    `;
    parent.appendChild(this.overlay);
  }

  run(): Promise<void> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      const lines = this.overlay.querySelectorAll('.zh-boot__line');

      lines.forEach((line) => {
        const delay = parseInt((line as HTMLElement).dataset.delay ?? '0', 10);
        setTimeout(() => line.classList.add('zh-boot__line--visible'), delay);
      });

      setTimeout(() => {
        this.overlay.classList.add('zh-boot--fade');
        setTimeout(() => {
          this.overlay.remove();
          this.resolve();
        }, 1200);
      }, 3200);
    });
  }
}
