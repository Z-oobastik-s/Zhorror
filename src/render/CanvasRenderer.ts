import { randRange, randInt } from '@/utils/math';
import { perf } from '@/systems/PerformanceManager';
import type { AtmosphereSystem } from '@/systems/AtmosphereSystem';

interface Particle {
  x: number;
  y: number;
  vy: number;
  size: number;
  alpha: number;
}

export class CanvasRenderer {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private width = 0;
  private height = 0;
  private grainPattern: CanvasPattern | null = null;
  private scanlineLayer: HTMLCanvasElement | null = null;
  private enabled = false;
  private frame = 0;

  constructor(parent: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'zh-fx-canvas';
    this.canvas.style.display = 'none';
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: true })!;

    const grain = document.createElement('canvas');
    grain.width = 128;
    grain.height = 128;
    const gctx = grain.getContext('2d')!;
    const img = gctx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = randInt(100, 155);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = randInt(4, 12);
    }
    gctx.putImageData(img, 0, 0);

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setEnabled(on: boolean): void {
    if (this.enabled === on) return;
    this.enabled = on;
    this.canvas.style.display = on ? 'block' : 'none';
    if (on) {
      this.initParticles();
    } else {
      this.particles = [];
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  private resize(): void {
    const dpr = perf.getMaxDpr();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const grain = document.createElement('canvas');
    grain.width = 128;
    grain.height = 128;
    const gctx = grain.getContext('2d')!;
    const img = gctx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = randInt(100, 155);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = randInt(4, 12);
    }
    gctx.putImageData(img, 0, 0);
    this.grainPattern = this.ctx.createPattern(grain, 'repeat');

    this.scanlineLayer = document.createElement('canvas');
    this.scanlineLayer.width = this.width;
    this.scanlineLayer.height = this.height;
    const sctx = this.scanlineLayer.getContext('2d')!;
    sctx.fillStyle = 'rgba(0,0,0,0.035)';
    for (let y = 0; y < this.height; y += 5) {
      sctx.fillRect(0, y, this.width, 1);
    }

    if (this.enabled) this.initParticles();
  }

  private initParticles(): void {
    const count = Math.min(30, Math.floor(this.width * this.height / 40000));
    this.particles = Array.from({ length: count }, () => this.createParticle(true));
  }

  private createParticle(randomY = false): Particle {
    return {
      x: randRange(0, this.width),
      y: randomY ? randRange(0, this.height) : this.height + 5,
      vy: randRange(-0.15, -0.04),
      size: randRange(0.4, 1.2),
      alpha: randRange(0.04, 0.12),
    };
  }

  spawnSilhouette(): void {
    /* силуэты отключены ради производительности */
  }

  update(_dt: number, _atmosphere: AtmosphereSystem): void {
    if (!this.enabled) return;

    for (const p of this.particles) {
      p.y += p.vy;
      if (p.y < -5) {
        Object.assign(p, this.createParticle());
      }
    }
  }

  render(atmosphere: AtmosphereSystem): void {
    if (!this.enabled) return;

    const level = atmosphere.getLevel();
    const ctx = this.ctx;
    this.frame += 1;

    ctx.clearRect(0, 0, this.width, this.height);

    this.drawVignette(ctx, level);

    ctx.fillStyle = `rgba(130, 120, 110, ${0.06 + level * 0.04})`;
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    if (this.scanlineLayer) {
      ctx.drawImage(this.scanlineLayer, 0, 0);
    }

    if (this.frame % 3 === 0 && this.grainPattern) {
      ctx.globalAlpha = 0.02 + level * 0.02;
      ctx.fillStyle = this.grainPattern;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalAlpha = 1;
    }
  }

  private drawVignette(ctx: CanvasRenderingContext2D, level: number): void {
    const grad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.width * 0.4,
      this.width / 2, this.height / 2, this.width * 0.95,
    );
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, `rgba(0, 0, 0, ${0.12 + level * 0.1})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
