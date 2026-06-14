import { randRange, randInt } from '@/utils/math';
import { detectPerfTier, getMaxDpr, type PerfTier } from '@/config/performance';
import type { AtmosphereSystem } from '@/systems/AtmosphereSystem';
import type { CursorSystem } from '@/systems/CursorSystem';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
}

interface Silhouette {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  targetAlpha: number;
  type: 'figure' | 'eye';
  life: number;
}

export class CanvasRenderer {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private silhouettes: Silhouette[] = [];
  private width = 0;
  private height = 0;
  private grainCanvas: HTMLCanvasElement;
  private grainCtx: CanvasRenderingContext2D;
  private scanlineCanvas: HTMLCanvasElement | null = null;
  private scanlineCtx: CanvasRenderingContext2D | null = null;
  private noiseOffset = 0;
  private scanLineY = 0;
  private glitchOffset = 0;
  private glitchTimer = 0;
  private frame = 0;
  private grainOffsetX = 0;
  private grainOffsetY = 0;
  private readonly tier: PerfTier;

  constructor(parent: HTMLElement) {
    this.tier = detectPerfTier();
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'zh-fx-canvas';
    this.canvas.dataset.tier = this.tier;
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: true })!;

    this.grainCanvas = document.createElement('canvas');
    this.grainCanvas.width = 128;
    this.grainCanvas.height = 128;
    this.grainCtx = this.grainCanvas.getContext('2d')!;
    this.generateGrain();

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
  }

  private resize(): void {
    const dpr = getMaxDpr(this.tier);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.buildScanlineLayer();
    this.initParticles();
  }

  private buildScanlineLayer(): void {
    if (this.tier === 'low') {
      this.scanlineCanvas = null;
      return;
    }
    this.scanlineCanvas = document.createElement('canvas');
    this.scanlineCanvas.width = this.width;
    this.scanlineCanvas.height = this.height;
    this.scanlineCtx = this.scanlineCanvas.getContext('2d')!;
    const ctx = this.scanlineCtx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let y = 0; y < this.height; y += 4) {
      ctx.fillRect(0, y, this.width, 1);
    }
  }

  private initParticles(): void {
    const max = this.tier === 'low' ? 25 : 45;
    const count = Math.min(max, Math.floor(this.width * this.height / 25000));
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  private createParticle(randomY = false): Particle {
    return {
      x: randRange(0, this.width),
      y: randomY ? randRange(0, this.height) : this.height + 10,
      vx: randRange(-0.1, 0.1),
      vy: randRange(-0.2, -0.05),
      size: randRange(0.5, 1.5),
      alpha: randRange(0.04, 0.15),
      life: randRange(5, 15),
    };
  }

  private generateGrain(): void {
    const img = this.grainCtx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = randInt(100, 155);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = randInt(4, 14);
    }
    this.grainCtx.putImageData(img, 0, 0);
  }

  spawnSilhouette(): void {
    if (this.tier === 'low' || this.silhouettes.length > 2) return;
    this.silhouettes.push({
      x: randRange(this.width * 0.1, this.width * 0.7),
      y: randRange(this.height * 0.2, this.height * 0.6),
      width: randRange(20, 50),
      height: randRange(60, 140),
      alpha: 0,
      targetAlpha: randRange(0.05, 0.12),
      type: Math.random() > 0.75 ? 'eye' : 'figure',
      life: randRange(3, 6),
    });
  }

  update(dt: number, atmosphere: AtmosphereSystem, cursor: CursorSystem): void {
    const level = atmosphere.getLevel();
    this.frame += 1;
    this.noiseOffset += dt * 0.3;
    this.scanLineY = (this.scanLineY + dt * 20) % this.height;

    if (this.frame % 6 === 0) {
      this.grainOffsetX = randRange(-1, 1);
      this.grainOffsetY = randRange(-1, 1);
    }

    this.glitchTimer -= dt;
    if (this.glitchTimer <= 0 && Math.random() < 0.001 * (1 + level)) {
      this.glitchOffset = randRange(-4, 4);
      this.glitchTimer = randRange(0.05, 0.12);
    } else if (this.glitchTimer <= 0) {
      this.glitchOffset = dampGlitch(this.glitchOffset, 0, dt);
    }

    const { nx } = cursor.getNormalized();
    for (const p of this.particles) {
      p.x += p.vx + nx * 0.1;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0 || p.y < -10) {
        Object.assign(p, this.createParticle());
      }
    }

    for (let i = this.silhouettes.length - 1; i >= 0; i--) {
      const s = this.silhouettes[i];
      s.life -= dt;
      s.alpha += (s.targetAlpha - s.alpha) * dt * 0.5;
      if (s.life < 1) s.alpha *= s.life;
      if (s.life <= 0) this.silhouettes.splice(i, 1);
    }

    if (Math.random() < 0.00015 * (1 + level * 2)) {
      this.spawnSilhouette();
    }
  }

  render(atmosphere: AtmosphereSystem): void {
    const level = atmosphere.getLevel();
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.width, this.height);

    this.drawFog(ctx, level);
    this.drawParticles(ctx, level);
    this.drawSilhouettes(ctx);

    if (this.tier === 'high') {
      this.drawScanlines(ctx);
    }

    if (this.frame % 2 === 0) {
      this.drawGrain(ctx, level);
    }

    this.drawVignette(ctx, level);

    if (this.tier === 'high') {
      this.drawGlitch(ctx, level);
    }
  }

  private drawFog(ctx: CanvasRenderingContext2D, level: number): void {
    const grad = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.5, this.width * 0.15,
      this.width * 0.5, this.height * 0.5, this.width * 0.95
    );
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, `rgba(5, 4, 8, ${0.08 + level * 0.06})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.tier === 'high') {
      ctx.globalAlpha = 0.015 + level * 0.02;
      const y = (this.noiseOffset * 15) % (this.height + 80) - 40;
      const fogGrad = ctx.createLinearGradient(0, y, this.width, y + 60);
      fogGrad.addColorStop(0, 'transparent');
      fogGrad.addColorStop(0.5, 'rgba(30, 25, 40, 0.15)');
      fogGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, y, this.width, 60);
      ctx.globalAlpha = 1;
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, level: number): void {
    ctx.fillStyle = `rgba(140, 130, 120, ${0.08 + level * 0.05})`;
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawSilhouettes(ctx: CanvasRenderingContext2D): void {
    for (const s of this.silhouettes) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      if (s.type === 'figure') {
        ctx.fillStyle = '#0a0808';
        ctx.beginPath();
        ctx.ellipse(s.x + s.width / 2, s.y + s.height * 0.15, s.width * 0.35, s.width * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(s.x + s.width * 0.25, s.y + s.height * 0.2, s.width * 0.5, s.height * 0.7);
      } else {
        ctx.fillStyle = '#3a1010';
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawScanlines(ctx: CanvasRenderingContext2D): void {
    if (this.scanlineCanvas) {
      ctx.drawImage(this.scanlineCanvas, 0, 0);
    }
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, this.scanLineY, this.width, 2);
    ctx.globalAlpha = 1;
  }

  private drawGrain(ctx: CanvasRenderingContext2D, level: number): void {
    ctx.globalAlpha = 0.025 + level * 0.025;
    const pat = ctx.createPattern(this.grainCanvas, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.save();
      ctx.translate(this.grainOffsetX, this.grainOffsetY);
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  private drawVignette(ctx: CanvasRenderingContext2D, level: number): void {
    const grad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.width * 0.35,
      this.width / 2, this.height / 2, this.width * 0.95
    );
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.7, 'transparent');
    grad.addColorStop(1, `rgba(0, 0, 0, ${0.18 + level * 0.12})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawGlitch(ctx: CanvasRenderingContext2D, level: number): void {
    if (Math.abs(this.glitchOffset) < 0.5) return;
    ctx.globalAlpha = 0.06 + level * 0.05;
    ctx.fillStyle = '#3a1515';
    ctx.fillRect(0, randRange(0, this.height * 0.8), this.width, randRange(1, 4));
    ctx.globalAlpha = 1;
  }
}

function dampGlitch(current: number, target: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-15 * dt));
}
