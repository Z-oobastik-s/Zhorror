import { randRange, randInt, clamp } from '@/utils/math';
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
  speed: number;
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
  private noiseOffset = 0;
  private scanLineY = 0;
  private glitchOffset = 0;
  private glitchTimer = 0;
  private vignettePulse = 0;

  constructor(parent: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'zh-fx-canvas';
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;

    this.grainCanvas = document.createElement('canvas');
    this.grainCanvas.width = 256;
    this.grainCanvas.height = 256;
    this.grainCtx = this.grainCanvas.getContext('2d')!;
    this.generateGrain();

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private initParticles(): void {
    const count = Math.min(120, Math.floor(this.width * this.height / 12000));
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  private createParticle(randomY = false): Particle {
    return {
      x: randRange(0, this.width),
      y: randomY ? randRange(0, this.height) : this.height + 10,
      vx: randRange(-0.15, 0.15),
      vy: randRange(-0.3, -0.05),
      size: randRange(0.5, 2),
      alpha: randRange(0.05, 0.25),
      life: randRange(5, 15),
    };
  }

  private generateGrain(): void {
    const img = this.grainCtx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = randInt(0, 255);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = randInt(8, 30);
    }
    this.grainCtx.putImageData(img, 0, 0);
  }

  spawnSilhouette(): void {
    if (this.silhouettes.length > 3) return;
    this.silhouettes.push({
      x: randRange(this.width * 0.1, this.width * 0.7),
      y: randRange(this.height * 0.2, this.height * 0.6),
      width: randRange(20, 60),
      height: randRange(80, 180),
      alpha: 0,
      targetAlpha: randRange(0.08, 0.2),
      speed: randRange(0.02, 0.08),
      type: Math.random() > 0.7 ? 'eye' : 'figure',
      life: randRange(3, 8),
    });
  }

  update(dt: number, atmosphere: AtmosphereSystem, cursor: CursorSystem): void {
    const level = atmosphere.getLevel();
    this.noiseOffset += dt * 0.5;
    this.scanLineY = (this.scanLineY + dt * 30) % this.height;
    this.vignettePulse = atmosphere.getBreathScale();

    this.glitchTimer -= dt;
    if (this.glitchTimer <= 0 && Math.random() < 0.002 * (1 + level * 2)) {
      this.glitchOffset = randRange(-8, 8);
      this.glitchTimer = randRange(0.05, 0.15);
    } else if (this.glitchTimer <= 0) {
      this.glitchOffset = dampGlitch(this.glitchOffset, 0, dt);
    }

    const { nx, ny } = cursor.getNormalized();
    for (const p of this.particles) {
      p.x += p.vx + nx * 0.2;
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

    if (Math.random() < 0.0003 * (1 + level * 3)) {
      this.spawnSilhouette();
    }
  }

  render(atmosphere: AtmosphereSystem): void {
    const level = atmosphere.getLevel();
    const flicker = atmosphere.getLightFlicker();
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.width, this.height);

    this.drawFog(ctx, level, flicker);
    this.drawParticles(ctx, level);
    this.drawSilhouettes(ctx);
    this.drawScanlines(ctx, level);
    this.drawGrain(ctx, level);
    this.drawVignette(ctx, level);
    this.drawGlitch(ctx, level);
    this.drawBreathing(ctx, atmosphere);
  }

  private drawFog(ctx: CanvasRenderingContext2D, level: number, flicker: number): void {
    const grad = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.6, 0,
      this.width * 0.5, this.height * 0.5, this.width * 0.8
    );
    grad.addColorStop(0, `rgba(20, 15, 25, ${0.02 + level * 0.04})`);
    grad.addColorStop(0.5, `rgba(10, 8, 15, ${0.05 + level * 0.06})`);
    grad.addColorStop(1, `rgba(5, 5, 8, ${0.1 * flicker})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.globalAlpha = 0.03 + level * 0.04;
    for (let i = 0; i < 3; i++) {
      const y = (this.noiseOffset * 20 + i * this.height / 3) % (this.height + 100) - 50;
      const fogGrad = ctx.createLinearGradient(0, y, this.width, y + 80);
      fogGrad.addColorStop(0, 'transparent');
      fogGrad.addColorStop(0.5, 'rgba(40, 30, 50, 0.3)');
      fogGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, y, this.width, 80);
    }
    ctx.globalAlpha = 1;
  }

  private drawParticles(ctx: CanvasRenderingContext2D, level: number): void {
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(140, 130, 120, ${p.alpha * (0.5 + level * 0.5)})`;
      ctx.fill();
    }
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
        ctx.ellipse(s.x, s.y, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawScanlines(ctx: CanvasRenderingContext2D, level: number): void {
    ctx.globalAlpha = 0.03 + level * 0.02;
    ctx.fillStyle = '#000';
    for (let y = 0; y < this.height; y += 3) {
      ctx.fillRect(0, y, this.width, 1);
    }
    ctx.globalAlpha = 0.05 + level * 0.03;
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, this.scanLineY, this.width, 2);
    ctx.globalAlpha = 1;
  }

  private drawGrain(ctx: CanvasRenderingContext2D, level: number): void {
    ctx.globalAlpha = 0.04 + level * 0.06;
    const pat = ctx.createPattern(this.grainCanvas, 'repeat');
    if (pat) {
      ctx.fillStyle = pat;
      ctx.save();
      ctx.translate(randRange(-2, 2), randRange(-2, 2));
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  private drawVignette(ctx: CanvasRenderingContext2D, level: number): void {
    const pulse = this.vignettePulse;
    const grad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.width * 0.2 * pulse,
      this.width / 2, this.height / 2, this.width * 0.75 * pulse
    );
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, `rgba(0, 0, 0, ${0.5 + level * 0.3})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawGlitch(ctx: CanvasRenderingContext2D, level: number): void {
    if (Math.abs(this.glitchOffset) < 0.5) return;
    ctx.globalAlpha = 0.1 + level * 0.1;
    ctx.fillStyle = '#3a1515';
    ctx.fillRect(0, randRange(0, this.height * 0.8), this.width, randRange(2, 8));
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.glitchOffset, 0, this.width, this.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  private drawBreathing(ctx: CanvasRenderingContext2D, atmosphere: AtmosphereSystem): void {
    const scale = atmosphere.getBreathScale();
    if (Math.abs(scale - 1) < 0.001) return;
    ctx.globalAlpha = 0.02;
    ctx.fillStyle = '#1a1020';
    const margin = (1 - scale) * this.width * 0.5;
    ctx.fillRect(0, 0, this.width, margin);
    ctx.fillRect(0, this.height - margin, this.width, margin);
    ctx.globalAlpha = 1;
  }
}

function dampGlitch(current: number, target: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-15 * dt));
}
