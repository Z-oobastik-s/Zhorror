import { damp, clamp } from '@/utils/math';
import { easeOutCubic } from '@/utils/easing';
import { events, EVT } from '@/core/EventBus';

interface ScrollTarget {
  id: string;
  element: HTMLElement;
  offset: number;
  height: number;
}

export class ScrollSystem {
  readonly container: HTMLElement;
  readonly viewport: HTMLElement;
  readonly content: HTMLElement;

  private targets: ScrollTarget[] = [];
  private scrollY = 0;
  private targetScrollY = 0;
  private velocity = 0;
  private maxScroll = 0;
  private isDragging = false;
  private dragStartY = 0;
  private dragStartScroll = 0;
  private touchStartY = 0;
  private touchStartScroll = 0;
  private wheelAccumulator = 0;
  private activeSceneId = '';
  private transitioning = false;
  private transitionProgress = 0;
  private transitionFrom = 0;
  private transitionTo = 0;
  private transitionDuration = 1.8;
  private inputLocked = true;

  setInputLocked(locked: boolean): void {
    this.inputLocked = locked;
  }

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'zh-scroll';

    this.viewport = document.createElement('div');
    this.viewport.className = 'zh-scroll__viewport';

    this.content = document.createElement('div');
    this.content.className = 'zh-scroll__content';

    this.viewport.appendChild(this.content);
    this.container.appendChild(this.viewport);
    parent.appendChild(this.container);

    this.bindEvents();
  }

  registerSection(id: string, element: HTMLElement): void {
    this.targets.push({ id, element, offset: 0, height: 0 });
    this.content.appendChild(element);
    this.recalculate();
  }

  recalculate(): void {
    let offset = 0;
    const vh = window.innerHeight;
    for (const t of this.targets) {
      t.offset = offset;
      t.height = Math.max(t.element.offsetHeight, vh);
      t.element.style.minHeight = `${t.height}px`;
      offset += t.height;
    }
    this.maxScroll = Math.max(0, offset - vh);
    this.targetScrollY = clamp(this.targetScrollY, 0, this.maxScroll);
    this.scrollY = clamp(this.scrollY, 0, this.maxScroll);
  }

  /** Позиция скролла, чтобы секция была по центру экрана */
  private resolveSceneScrollY(target: ScrollTarget): number {
    const vh = window.innerHeight;
    const extra = target.height - vh;
    if (extra <= 0) return target.offset;
    return target.offset + extra * 0.5;
  }

  scrollToScene(id: string, instant = false, duration = 1.35): void {
    this.recalculate();
    const target = this.targets.find((t) => t.id === id);
    if (!target) return;
    const y = clamp(this.resolveSceneScrollY(target), 0, this.maxScroll);
    if (instant) {
      this.scrollY = y;
      this.targetScrollY = y;
      this.velocity = 0;
      this.transitioning = false;
      this.applyTransform();
    } else {
      this.startTransition(this.scrollY, y, duration);
    }
    this.activeSceneId = id;
    events.emit(EVT.SCENE_CHANGE, { id, progress: this.getSceneProgress(id) });
  }

  private applyTransform(): void {
    this.content.style.transform = `translate3d(0, ${-this.scrollY}px, 0)`;
  }

  startTransition(from: number, to: number, duration = 1.8): void {
    this.transitioning = true;
    this.transitionProgress = 0;
    this.transitionFrom = from;
    this.transitionTo = to;
    this.transitionDuration = duration;
    this.targetScrollY = to;
    events.emit(EVT.TRANSITION_START, { from, to });
  }

  getScrollY(): number {
    return this.scrollY;
  }

  getProgress(): number {
    return this.maxScroll > 0 ? this.scrollY / this.maxScroll : 0;
  }

  getActiveSceneId(): string {
    return this.activeSceneId;
  }

  getSceneProgress(id: string): number {
    const t = this.targets.find((s) => s.id === id);
    if (!t) return 0;
    const rel = this.scrollY - t.offset;
    return clamp(rel / t.height, 0, 1);
  }

  getScrollCapForScene(maxUnlockedId: string): number {
    const idx = this.targets.findIndex((t) => t.id === maxUnlockedId);
    if (idx < 0 || idx >= this.targets.length - 1) return this.maxScroll;
    const next = this.targets[idx + 1];
    return Math.max(0, next.offset - window.innerHeight * 0.12);
  }

  applyScrollCap(cap: number): void {
    const limit = clamp(cap, 0, this.maxScroll);
    if (this.targetScrollY > limit) this.targetScrollY = limit;
    if (this.scrollY > limit && !this.transitioning) {
      this.scrollY = limit;
    }
  }

  getSceneAtScroll(y: number): string {
    const vh = window.innerHeight;
    const center = y + vh * 0.5;
    for (const t of this.targets) {
      if (center >= t.offset && center < t.offset + t.height) {
        return t.id;
      }
    }
    if (center < (this.targets[0]?.offset ?? 0)) {
      return this.targets[0]?.id ?? '';
    }
    return this.targets[this.targets.length - 1]?.id ?? '';
  }

  private bindEvents(): void {
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    events.on(EVT.RESIZE, () => this.recalculate());
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    if (this.inputLocked || this.transitioning) return;
    this.wheelAccumulator += e.deltaY * 0.8;
    this.targetScrollY = clamp(this.targetScrollY + this.wheelAccumulator, 0, this.maxScroll);
    this.wheelAccumulator *= 0.85;
    this.velocity += e.deltaY * 0.003;
  };

  private onTouchStart = (e: TouchEvent): void => {
    this.touchStartY = e.touches[0].clientY;
    this.touchStartScroll = this.targetScrollY;
    this.velocity = 0;
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (this.inputLocked) return;
    const dy = this.touchStartY - e.touches[0].clientY;
    this.targetScrollY = clamp(this.touchStartScroll + dy * 1.2, 0, this.maxScroll);
  };

  private onTouchEnd = (): void => {
    /* inertia handled in update */
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0 || this.inputLocked) return;
    this.isDragging = true;
    this.dragStartY = e.clientY;
    this.dragStartScroll = this.targetScrollY;
    this.velocity = 0;
    document.body.classList.add('zh-dragging');
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;
    const dy = this.dragStartY - e.clientY;
    this.targetScrollY = clamp(this.dragStartScroll + dy, 0, this.maxScroll);
  };

  private onMouseUp = (): void => {
    if (!this.isDragging) return;
    this.isDragging = false;
    document.body.classList.remove('zh-dragging');
  };

  update(dt: number): void {
    if (this.transitioning) {
      this.transitionProgress += dt / this.transitionDuration;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.transitioning = false;
        this.scrollY = this.transitionTo;
        this.targetScrollY = this.transitionTo;
        events.emit(EVT.TRANSITION_END);
        const sceneId = this.getSceneAtScroll(this.scrollY);
        if (sceneId && sceneId !== this.activeSceneId) {
          this.activeSceneId = sceneId;
          events.emit(EVT.SCENE_CHANGE, { id: sceneId, progress: this.getSceneProgress(sceneId) });
        }
      } else {
        const eased = easeOutCubic(this.transitionProgress);
        this.scrollY = this.transitionFrom + (this.transitionTo - this.transitionFrom) * eased;
      }
    } else {
      if (!this.isDragging) {
        this.targetScrollY = clamp(this.targetScrollY + this.velocity * dt * 60, 0, this.maxScroll);
        this.velocity *= Math.pow(0.92, dt * 60);
      }
      this.scrollY = damp(this.scrollY, this.targetScrollY, 6, dt);
    }

    this.applyTransform();

    if (this.transitioning) return;

    const sceneId = this.getSceneAtScroll(this.scrollY);
    if (sceneId !== this.activeSceneId) {
      this.activeSceneId = sceneId;
      events.emit(EVT.SCENE_CHANGE, { id: sceneId, progress: this.getSceneProgress(sceneId) });
    }

    events.emit(EVT.SCROLL);
  }

  destroy(): void {
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }
}
