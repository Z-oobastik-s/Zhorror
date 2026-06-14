import { engine } from '@/core/Engine';
import { events, EVT } from '@/core/EventBus';
import type { SceneId } from '@/config/constants';
import { SCENE_IDS, SCENE_ORDER_ACT3 } from '@/config/constants';
import { ACT3_BG, mediaUrl } from '@/config/media';
import { perf } from '@/systems/PerformanceManager';
import { ScrollSystem } from '@/systems/ScrollSystem';
import { AtmosphereSystem } from '@/systems/AtmosphereSystem';
import { RandomEventSystem } from '@/systems/RandomEventSystem';
import { AudioSystem } from '@/systems/AudioSystem';
import { InteractionSystem } from '@/systems/InteractionSystem';
import { ProtectionSystem } from '@/systems/ProtectionSystem';
import { ScareSystem } from '@/systems/ScareSystem';
import { quest } from '@/systems/QuestSystem';
import { HorrorNav } from '@/components/HorrorNav';
import { QuestHUD } from '@/components/QuestHUD';
import { BootSequence } from '@/components/BootSequence';
import { ScrollIndicator } from '@/components/ScrollIndicator';
import type { Scene } from '@/scenes/Scene';

export class App {
  private root: HTMLElement;
  private shell!: HTMLElement;
  private fxLayer!: HTMLElement;
  private uiLayer!: HTMLElement;
  private scroll!: ScrollSystem;
  private atmosphere!: AtmosphereSystem;
  private randomEvents!: RandomEventSystem;
  private scare!: ScareSystem;
  private audio!: AudioSystem;
  private interaction!: InteractionSystem;
  private nav!: HorrorNav;
  private questHud!: QuestHUD;
  private scrollIndicator!: ScrollIndicator;
  private scenes: Scene[] = [];
  private bgAct3!: HTMLElement;

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
    const bg = document.createElement('div');
    bg.className = 'zh-bg-static';
    this.bgAct3 = document.createElement('div');
    this.bgAct3.className = 'zh-bg-act3';
    this.bgAct3.style.backgroundImage = `url("${mediaUrl(ACT3_BG)}")`;
    const grain = document.createElement('div');
    grain.className = 'zh-bg-grain';
    this.fxLayer.append(bg, this.bgAct3, grain);
    this.shell.appendChild(this.fxLayer);

    const preloadAct3Bg = new Image();
    preloadAct3Bg.src = mediaUrl(ACT3_BG);

    this.uiLayer = document.createElement('div');
    this.uiLayer.className = 'zh-ui-layer';
    this.shell.appendChild(this.uiLayer);
  }

  private initSystems(): void {
    this.atmosphere = new AtmosphereSystem();
    this.scroll = new ScrollSystem(this.shell);
    this.randomEvents = new RandomEventSystem(this.uiLayer, this.atmosphere);

    const audioToggle = document.createElement('div');
    audioToggle.className = 'zh-audio-toggle';
    audioToggle.setAttribute('role', 'button');
    audioToggle.setAttribute('tabindex', '0');
    audioToggle.setAttribute('aria-label', 'Включить звук');
    audioToggle.title = 'Звук архива';
    this.uiLayer.appendChild(audioToggle);

    this.audio = new AudioSystem(audioToggle);
    this.interaction = new InteractionSystem(this.uiLayer, this.audio);
    this.scare = new ScareSystem(this.uiLayer, this.atmosphere, this.audio, perf);

    this.questHud = new QuestHUD(this.uiLayer, quest);
    this.nav = new HorrorNav(
      this.uiLayer,
      (id) => this.scroll.scrollToScene(id),
      (id) => quest.tryNavigate(id as SceneId),
      () => this.questHud.showLocked(),
    );
    this.scrollIndicator = new ScrollIndicator(this.uiLayer, this.scroll);
  }

  async registerScenes(scenes: Scene[]): Promise<void> {
    this.scenes = scenes;
    for (const scene of scenes) {
      const el = scene.create();
      this.scroll.registerSection(scene.id, el);

      if (scene.id !== SCENE_IDS.hero) {
        const seal = document.createElement('div');
        seal.className = 'zh-scene-seal';
        seal.innerHTML = '<div class="zh-scene-seal__inner"><span class="zh-scene-seal__mark">☍</span><p>секция запечатана</p><small>пройди текущую главу</small></div>';
        el.appendChild(seal);
        quest.registerSeal(scene.id as SceneId, seal);
      }

      el.querySelectorAll(
        '.zh-archive__card, .zh-hero__sigil, .zh-abyss__sigil, .zh-gate3__sigil, .zh-nav__sigil, .zh-ritual__symbol, .zh-void__submit, .zh-collapse__submit, .zh-terminus__submit, .zh-echo__word, .zh-catacombs__door, .zh-swarm__eye',
      ).forEach((node) => {
        const elNode = node as HTMLElement;
        const kind = elNode.classList.contains('zh-archive__card') ? 'paper' : 'rune';
        this.interaction.bindHover(elNode, kind);
      });
    }
    this.scroll.recalculate();
    perf.observeScenes(this.scenes.map((s) => s.getElement()));
    this.nav.setScenes(scenes.map((s) => ({ id: s.id, label: s.label })));
  }

  async boot(): Promise<void> {
    const boot = new BootSequence(this.uiLayer);
    await boot.run();
    this.shell.classList.add('zh-app--ready');
    events.emit(EVT.BOOT_COMPLETE);
    engine.start();
    engine.onUpdate((dt) => this.update(dt));
  }

  private update(dt: number): void {
    this.atmosphere.setQuestDepth(quest.getDepth());
    const cap = this.scroll.getScrollCapForScene(quest.getMaxUnlockedSceneId());
    this.scroll.applyScrollCap(cap);

    this.scroll.update(dt);
    this.scrollIndicator.update();
    this.questHud.update(dt);

    if (!perf.shouldRunAmbientSystems()) return;

    this.atmosphere.update(dt);
    this.atmosphere.tickIdle(dt);
    this.randomEvents.update(dt);
    this.scare.update(dt);
    this.audio.update(dt, this.atmosphere.getLevel());

    for (const scene of this.scenes) {
      const progress = this.scroll.getSceneProgress(scene.id);
      const active = this.scroll.getActiveSceneId() === scene.id;
      const visible = perf.shouldUpdateScene(scene.id, active);
      scene.update(dt, progress, active, visible);
    }
  }

  private navigateToScene(scene?: string, delay = 900): void {
    if (!scene) return;
    window.setTimeout(() => this.scroll.scrollToScene(scene), delay);
  }

  private bindGlobalEvents(): void {
    const onActivity = () => this.atmosphere.onActivity();
    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity);
    window.addEventListener('wheel', onActivity, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) engine.stop();
      else engine.start();
    });

    window.addEventListener('resize', () => {
      this.scroll.recalculate();
      events.emit(EVT.RESIZE);
    });

    events.on(EVT.SCENE_CHANGE, (payload) => {
      const id = (payload as { id: string }).id;
      this.nav.setActive(id);
      this.shell.classList.toggle('zh-app--act3', (SCENE_ORDER_ACT3 as readonly string[]).includes(id));
    });

    events.on(EVT.QUEST_UPDATE, () => {
      this.nav.refreshLocks();
      this.audio.setActProfile(quest.getAct());
    });
    events.on(EVT.QUEST_CHAPTER, (payload) => {
      this.nav.refreshLocks();
      this.navigateToScene((payload as { scene?: string }).scene);
    });
    events.on(EVT.QUEST_ACT_START, (payload) => {
      this.nav.refreshLocks();
      this.navigateToScene((payload as { scene?: string }).scene, 1400);
    });
    events.on(EVT.QUEST_RESET, () => {
      window.location.reload();
    });

    events.on(EVT.INTERACT, (payload) => {
      const { type } = payload as { type: string };
      if (type === 'rune' && this.audio.isEnabled()) this.audio.playSfx('rune');
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
    { AbyssScene },
    { EchoScene },
    { MirrorScene },
    { CollapseScene },
    { Gate3Scene },
    { CatacombsScene },
    { SwarmScene },
    { SilenceScene },
    { FinalRiteScene },
    { TerminusScene },
  ] = await Promise.all([
    import('@/scenes/HeroScene'),
    import('@/scenes/ArchiveScene'),
    import('@/scenes/EntityScene'),
    import('@/scenes/RitualScene'),
    import('@/scenes/VoidScene'),
    import('@/scenes/AbyssScene'),
    import('@/scenes/EchoScene'),
    import('@/scenes/MirrorScene'),
    import('@/scenes/CollapseScene'),
    import('@/scenes/Gate3Scene'),
    import('@/scenes/CatacombsScene'),
    import('@/scenes/SwarmScene'),
    import('@/scenes/SilenceScene'),
    import('@/scenes/FinalRiteScene'),
    import('@/scenes/TerminusScene'),
  ]);
  await app.registerScenes([
    new HeroScene(),
    new ArchiveScene(),
    new EntityScene(),
    new RitualScene(),
    new VoidScene(),
    new AbyssScene(),
    new EchoScene(),
    new MirrorScene(),
    new CollapseScene(),
    new Gate3Scene(),
    new CatacombsScene(),
    new SwarmScene(),
    new SilenceScene(),
    new FinalRiteScene(),
    new TerminusScene(),
  ]);
  await app.boot();
  return app;
}
