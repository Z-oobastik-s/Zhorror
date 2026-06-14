export class PerformanceManager {
  pageVisible = true;
  private sceneInView = new Map<string, boolean>();
  private observer: IntersectionObserver | null = null;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      this.pageVisible = document.visibilityState === 'visible';
    });
  }

  observeScenes(elements: HTMLElement[]): void {
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.scene;
          if (id) this.sceneInView.set(id, entry.isIntersecting);
        }
      },
      { threshold: 0.05, rootMargin: '80px 0px' },
    );
    for (const el of elements) this.observer.observe(el);
  }

  shouldUpdateScene(id: string, active: boolean): boolean {
    if (!this.pageVisible) return false;
    return active || (this.sceneInView.get(id) ?? false);
  }

  shouldRunAmbientSystems(): boolean {
    return this.pageVisible;
  }
}

export const perf = new PerformanceManager();
