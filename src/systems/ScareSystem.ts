import { chance, randPick, randRange } from '@/utils/math';
import { WHISPERS } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import type { AtmosphereSystem } from './AtmosphereSystem';
import type { AudioSystem } from './AudioSystem';
import type { PerformanceManager } from './PerformanceManager';

type ScareType = 'face' | 'static' | 'eyes' | 'text';

export class ScareSystem {
  private overlay: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private textEl: HTMLElement;
  private active = false;
  private lastScare = 0;
  private readonly minCooldown = 22000;

  constructor(
    parent: HTMLElement,
    private atmosphere: AtmosphereSystem,
    private audio: AudioSystem,
    private performance: PerformanceManager,
  ) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'zh-scare';
    this.overlay.setAttribute('aria-hidden', 'true');

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'zh-scare__canvas';

    this.textEl = document.createElement('div');
    this.textEl.className = 'zh-scare__text';

    this.overlay.append(this.canvas, this.textEl);
    parent.appendChild(this.overlay);

    window.addEventListener('resize', () => this.resizeCanvas());
    this.ctx = this.canvas.getContext('2d')!;
    this.resizeCanvas();

    events.on(EVT.SCARE_REQUEST, (payload) => {
      const type = (payload as { type?: ScareType }).type ?? 'face';
      this.trigger(type, true);
    });
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  update(_dt: number): void {
    if (!this.performance.shouldRunAmbientSystems() || this.active) return;

    const elapsed = performance.now();
    if (elapsed - this.lastScare < this.minCooldown) return;

    const level = this.atmosphere.getLevel();
    const idle = this.atmosphere.isIdle();

    if (idle && chance(0.0012 * (1 + level))) {
      this.trigger(randPick(['face', 'eyes', 'static'] as const));
      return;
    }

    if (level > 0.35 && chance(0.0004 * level)) {
      this.trigger(randPick(['face', 'static'] as const));
      return;
    }

    if (level > 0.55 && chance(0.0006)) {
      this.trigger('text');
    }
  }

  trigger(type: ScareType, force = false): void {
    if (this.active) return;
    if (!force && performance.now() - this.lastScare < this.minCooldown) return;

    this.active = true;
    this.lastScare = performance.now();
    events.emit(EVT.SCARE, { type });

    document.body.classList.add('zh-scare-shake');

    switch (type) {
      case 'face':
        this.playFaceScare();
        break;
      case 'eyes':
        this.playEyesScare();
        break;
      case 'static':
        this.playStaticScare();
        break;
      case 'text':
        this.playTextScare();
        break;
    }

    this.audio.playScare(type);
  }

  private playFaceScare(): void {
    this.overlay.classList.add('zh-scare--active');
    this.textEl.textContent = '';
    this.drawFace(1);
    setTimeout(() => {
      this.overlay.classList.remove('zh-scare--active');
      this.finish();
    }, 280);
  }

  private playEyesScare(): void {
    this.overlay.classList.add('zh-scare--active', 'zh-scare--eyes');
    this.textEl.textContent = '';
    this.drawEyesOnly();
    setTimeout(() => {
      this.overlay.classList.remove('zh-scare--active', 'zh-scare--eyes');
      this.finish();
    }, 420);
  }

  private playStaticScare(): void {
    this.overlay.classList.add('zh-scare--active', 'zh-scare--static');
    this.textEl.textContent = '';
    this.drawStatic();
    setTimeout(() => {
      this.overlay.classList.remove('zh-scare--active', 'zh-scare--static');
      this.finish();
    }, 350);
  }

  private playTextScare(): void {
    this.overlay.classList.add('zh-scare--active', 'zh-scare--text');
    this.textEl.textContent = randPick(WHISPERS).toUpperCase();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    setTimeout(() => {
      this.overlay.classList.remove('zh-scare--active', 'zh-scare--text');
      this.textEl.textContent = '';
      this.finish();
    }, 900);
  }

  private drawFace(intensity: number): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = `rgba(0, 0, 0, ${0.85 * intensity})`;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.22;

    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + scale * 0.3, scale * 0.9, scale * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    const eyeY = cy - scale * 0.15;
    const eyeGap = scale * 0.45;
    for (const ex of [cx - eyeGap, cx + eyeGap]) {
      ctx.fillStyle = '#e8e0d8';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, scale * 0.22, scale * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a0505';
      ctx.beginPath();
      ctx.arc(ex, eyeY, scale * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5c1010';
      ctx.beginPath();
      ctx.arc(ex + scale * 0.03, eyeY - scale * 0.02, scale * 0.04, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.ellipse(cx, cy + scale * 0.55, scale * 0.35, scale * 0.12, 0, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = '#1a1010';
    ctx.beginPath();
    ctx.ellipse(cx, cy + scale * 0.7, scale * 0.55, scale * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const tx = cx - scale * 0.4 + i * scale * 0.11;
      ctx.fillStyle = '#c8c0b8';
      ctx.beginPath();
      ctx.moveTo(tx, cy + scale * 0.55);
      ctx.lineTo(tx + scale * 0.04, cy + scale * 0.85);
      ctx.lineTo(tx + scale * 0.08, cy + scale * 0.55);
      ctx.fill();
    }

    ctx.fillStyle = `rgba(90, 15, 15, ${0.4 * intensity})`;
    ctx.fillRect(0, 0, w, h);
  }

  private drawEyesOnly(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const gap = w * 0.08;
    for (const ex of [cx - gap - 40, cx + gap + 40]) {
      ctx.fillStyle = '#ddd5cc';
      ctx.beginPath();
      ctx.ellipse(ex, cy, 36, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a0000';
      ctx.beginPath();
      ctx.arc(ex, cy, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawStatic(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = randRange(80, 200);
    }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = 'rgba(60, 10, 10, 0.35)';
    ctx.fillRect(0, 0, w, h);
  }

  private finish(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    document.body.classList.remove('zh-scare-shake');
    this.active = false;
  }
}
