import { clamp, damp } from '@/utils/math';
import { events, EVT } from '@/core/EventBus';

export class AtmosphereSystem {
  private level = 0;
  private targetLevel = 0;
  private sessionTime = 0;
  private idleTime = 0;
  private idleState = false;
  private breathPhase = 0;
  private lightFlicker = 1;
  private flickerTarget = 1;
  private flickerTimer = 0;

  private questDepth = 0;

  constructor() {
    events.on(EVT.IDLE, (payload) => {
      this.idleState = (payload as { idle: boolean }).idle;
    });
  }

  update(dt: number): void {
    this.sessionTime += dt * 1000;
    this.breathPhase += dt * 0.4;

    const timeFactor = clamp(this.sessionTime / 120000, 0, 1);
    const idleFactor = this.idleState ? 0.15 : 0;
    const questFactor = clamp(this.questDepth * 0.11, 0, 0.55);
    this.targetLevel = clamp(timeFactor + idleFactor + questFactor, 0, 1);

    this.level = damp(this.level, this.targetLevel, 0.8, dt);

    this.flickerTimer -= dt;
    if (this.flickerTimer <= 0) {
      this.flickerTarget = 0.85 + Math.random() * 0.15 + this.level * 0.1 * (Math.random() - 0.5);
      this.flickerTimer = 0.05 + Math.random() * (0.3 - this.level * 0.15);
    }
    this.lightFlicker = damp(this.lightFlicker, this.flickerTarget, 12, dt);

    if (Math.floor(this.sessionTime / 5000) !== Math.floor((this.sessionTime - dt * 1000) / 5000)) {
      events.emit(EVT.ATMOSPHERE, { level: this.level });
    }
  }

  getLevel(): number {
    return this.level;
  }

  getBreathPhase(): number {
    return this.breathPhase;
  }

  getBreathScale(): number {
    return 1 + Math.sin(this.breathPhase) * 0.008 * (1 + this.level);
  }

  getLightFlicker(): number {
    return this.lightFlicker;
  }

  isIdle(): boolean {
    return this.idleState;
  }

  getSessionTime(): number {
    return this.sessionTime;
  }

  boost(amount: number): void {
    this.targetLevel = clamp(this.targetLevel + amount, 0, 1);
  }

  setQuestDepth(depth: number): void {
    this.questDepth = depth;
  }

  resetIdle(): void {
    this.idleTime = 0;
  }

  tickIdle(dt: number): void {
    this.idleTime += dt;
    if (this.idleTime > 8 && !this.idleState) {
      events.emit(EVT.IDLE, { idle: true });
    }
  }

  onActivity(): void {
    this.idleTime = 0;
    if (this.idleState) {
      this.idleState = false;
      events.emit(EVT.IDLE, { idle: false });
    }
  }
}
