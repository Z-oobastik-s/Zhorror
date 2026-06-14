export class PerformanceManager {
  pageVisible = true;
  fxActive = false;
  private sceneInView = new Map<string, boolean>();
  private observer: IntersectionObserver | null = null;
  private renderAccumulator = 0;
  readonly fxFps = 30;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      this.pageVisible = document.visibilityState === 'visible';
      if (!this.pageVisible) {
        this.fxActive = false;
      }
    });
  }

  observeScenes(elements: HTMLElement[]): void {
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.scene;
          if (id) {
            this.sceneInView.set(id, entry.isIntersecting);
          }
        }
        this.fxActive = ['hero', 'entity', 'ritual'].some((id) => this.sceneInView.get(id));
      },
      { threshold: 0.08, rootMargin: '50px 0px' },
    );
    for (const el of elements) {
      this.observer.observe(el);
    }
  }

  isSceneInView(id: string): boolean {
    return this.sceneInView.get(id) ?? false;
  }

  shouldUpdateScene(id: string, active: boolean): boolean {
    if (!this.pageVisible) return false;
    return active || (this.sceneInView.get(id) ?? false);
  }

  shouldRenderFx(): boolean {
    return this.pageVisible && this.fxActive;
  }

  shouldRunAmbientSystems(): boolean {
    return this.pageVisible;
  }

  consumeRenderFrame(dt: number): boolean {
    if (!this.shouldRenderFx()) return false;
    this.renderAccumulator += dt;
    const interval = 1 / this.fxFps;
    if (this.renderAccumulator < interval) return false;
    this.renderAccumulator -= interval;
    return true;
  }

  getMaxDpr(): number {
    return 1;
  }
}

export const perf = new PerformanceManager();
