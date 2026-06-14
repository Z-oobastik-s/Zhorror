import { engine } from '@/core/Engine';
import { events, EVT } from '@/core/EventBus';
import { ScrollSystem } from '@/systems/ScrollSystem';
import { AtmosphereSystem } from '@/systems/AtmosphereSystem';
import { RandomEventSystem } from '@/systems/RandomEventSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { ProtectionSystem } from '@/systems/ProtectionSystem';
import { CursorSystem } from '@/systems/CursorSystem';
import { CanvasRenderer } from '@/render/CanvasRenderer';
import { WebGLBackground } from '@/render/WebGLBackground';
import { HorrorNav } from '@/components/HorrorNav';
import { BootSequence } from '@/components/BootSequence';
import { ScrollIndicator } from '@/components/ScrollIndicator';
import type { Scene } from '@/scenes/Scene';

export class App {
  private root: HTMLElement;
  private shell: HTMLElement;
  private fxLayer: HTMLElement;
  private uiLayer: HTMLElement;
  private scroll!: ScrollSystem;
  private atmosphere!: AtmosphereSystem;
  private randomEvents!: RandomEventSystem;
  private audio!: AudioSystem;
  private cursor!: CursorSystem;
  private canvasFx!: CanvasRenderer;
  private webglBg!: WebGLBackground;
  private nav!: HorrorNav;
  private scrollIndicator!: ScrollIndicator;
  private scenes: Scene[] = [];

  constructor(rootEl: HTMLElement) {
    this.root = rootEl;
    new ProtectionSystem();
    this.buildShell();
    this.initSystems();
    this.bindGlobalEvents();
  }

  private buildShell(): void {
    this.root.innerHTML = '';
    this.shell = document.createElement('div');
    this.shell.className = 'zh-app';
    this.root.appendChild(this.shell);

    this.fxLayer = document.createElement('div');
    this.fxLayer.className = 'zh-fx-layer';
    this.shell.appendChild(this.fxLayer);

    this.uiLayer = document.createElement('div');
    this.uiLayer.className = 'zh-ui-layer';
    this.shell.appendChild(this.uiLayer);
  }

  private initSystems(): void {
    this.webglBg = new WebGLBackground(this.fxLayer);
    this.canvasFx = new CanvasRenderer(this.fxLayer);
    this.cursor = new CursorSystem(this.uiLayer);
    this.atmosphere = new AtmosphereSystem();
    this.scroll = new ScrollSystem(this.shell);
    this.randomEvents = new RandomEventSystem(this.uiLayer, this.atmosphere);

    const audioToggle = document.createElement('div');
    audioToggle.className = 'zh-audio-toggle';
    audioToggle.setAttribute('role', 'button');
    audioToggle.setAttribute('tabindex', '0');
    audioToggle.setAttribute('aria-label', 'Включить звук');
    this.uiLayer.appendChild(audioToggle);
    this.audio = new AudioSystem(audioToggle);

    this.nav = new HorrorNav(this.uiLayer, (id) => {
      this.scroll.scrollToScene(id);
    });
    this.scrollIndicator = new ScrollIndicator(this.uiLayer, this.scroll);
  }

  async registerScenes(scenes: Scene[]): Promise<void> {
    this.scenes = scenes;
    for (const scene of scenes) {
      const el = scene.create();
      this.scroll.registerSection(scene.id, el);
    }
    this.scroll.recalculate();
    this.nav.setScenes(scenes.map((s) => ({ id: s.id, label: s.label })));
  }

  async boot(): Promise<void> {
    const boot = new BootSequence(this.uiLayer);
    await boot.run();
    this.shell.classList.add('zh-app--ready');
    events.emit(EVT.BOOT_COMPLETE);
    engine.start();

    engine.onUpdate((dt) => this.update(dt));
    engine.onRender((dt) => this.render(dt));
  }

  private update(dt: number): void {
    this.atmosphere.update(dt);
    this.atmosphere.tickIdle(dt);
    this.scroll.update(dt);
    this.scrollIndicator.update();
    this.cursor.update(dt);
    this.webglBg.update(dt);
    this.canvasFx.update(dt, this.atmosphere, this.cursor);
    this.randomEvents.update(dt);
    this.audio.update(dt, this.atmosphere.getLevel());

    for (const scene of this.scenes) {
      const progress = this.scroll.getSceneProgress(scene.id);
      const active = this.scroll.getActiveSceneId() === scene.id;
      scene.update(dt, progress, active);
    }
  }

  private render(_dt: number): void {
    this.webglBg.render(this.atmosphere, this.cursor);
    this.canvasFx.render(this.atmosphere);
  }

  private bindGlobalEvents(): void {
    const onActivity = () => this.atmosphere.onActivity();
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('touchstart', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('wheel', onActivity);

    window.addEventListener('resize', () => {
      this.scroll.recalculate();
      events.emit(EVT.RESIZE);
    });

    events.on(EVT.RANDOM_EVENT, (payload) => {
      const { type } = payload as { type: string };
      if (type === 'silhouette_render') {
        this.canvasFx.spawnSilhouette();
      }
    });

    events.on(EVT.SCENE_CHANGE, (payload) => {
      const { id } = payload as { id: string };
      this.nav.setActive(id);
    });
  }
}

export async function createApp(root: HTMLElement): Promise<App> {
  const app = new App(root);

  const [
    { HeroScene },
    { ArchiveScene },
    { EntityScene },
    { RitualScene },
    { VoidScene },
  ] = await Promise.all([
    import('@/scenes/HeroScene'),
    import('@/scenes/ArchiveScene'),
    import('@/scenes/EntityScene'),
    import('@/scenes/RitualScene'),
    import('@/scenes/VoidScene'),
  ]);

  await app.registerScenes([
    new HeroScene(),
    new ArchiveScene(),
    new EntityScene(),
    new RitualScene(),
    new VoidScene(),
  ]);

  await app.boot();
  return app;
}
