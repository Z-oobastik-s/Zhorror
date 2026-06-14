import { events, EVT } from './EventBus';

type UpdateFn = (dt: number, elapsed: number) => void;
type RenderFn = (dt: number, elapsed: number) => void;

export class Engine {
  private updates = new Set<UpdateFn>();
  private renders = new Set<RenderFn>();
  private rafId = 0;
  private running = false;
  private lastTime = 0;
  private elapsed = 0;
  private fps = 60;
  private frameCount = 0;
  private fpsTimer = 0;

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  onUpdate(fn: UpdateFn): () => void {
    this.updates.add(fn);
    return () => this.updates.delete(fn);
  }

  onRender(fn: RenderFn): () => void {
    this.renders.add(fn);
    return () => this.renders.delete(fn);
  }

  getElapsed(): number {
    return this.elapsed;
  }

  getFps(): number {
    return this.fps;
  }

  private tick = (time: number): void => {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.elapsed += dt * 1000;

    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    for (const fn of this.updates) fn(dt, this.elapsed);
    for (const fn of this.renders) fn(dt, this.elapsed);

    events.emit(EVT.SCROLL);
    this.rafId = requestAnimationFrame(this.tick);
  };
}

export const engine = new Engine();
