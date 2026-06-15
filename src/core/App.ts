import { engine } from '@/core/Engine';
import { events, EVT } from '@/core/EventBus';
import type { SceneId } from '@/config/constants';
import {
  SCENE_IDS,
  SCENE_ORDER_ACT1,
  SCENE_ORDER_ACT2,
  SCENE_ORDER_ACT3,
  SCENE_ORDER_ACT4,
  SCENE_ORDER_ACT5,
} from '@/config/constants';
import { ACT1_BG, ACT2_BG, ACT3_BG, ACT4_BG, ACT5_BG, mediaUrl } from '@/config/media';
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
import { AudioGate } from '@/components/AudioGate';
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
  private bgAct1!: HTMLElement;
  private bgAct2!: HTMLElement;
  private bgAct3!: HTMLElement;
  private bgAct4!: HTMLElement;
  private bgAct5!: HTMLElement;

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
    this.bgAct1 = document.createElement('div');
    this.bgAct1.className = 'zh-bg-act1';
    this.bgAct1.style.backgroundImage = `url("${mediaUrl(ACT1_BG)}")`;
    this.bgAct2 = document.createElement('div');
    this.bgAct2.className = 'zh-bg-act2';
    this.bgAct2.style.backgroundImage = `url("${mediaUrl(ACT2_BG)}")`;
    this.bgAct3 = document.createElement('div');
    this.bgAct3.className = 'zh-bg-act3';
    this.bgAct3.style.backgroundImage = `url("${mediaUrl(ACT3_BG)}")`;
    this.bgAct4 = document.createElement('div');
    this.bgAct4.className = 'zh-bg-act4';
    this.bgAct4.style.backgroundImage = `url("${mediaUrl(ACT4_BG)}")`;
    this.bgAct5 = document.createElement('div');
    this.bgAct5.className = 'zh-bg-act5';
    this.bgAct5.style.backgroundImage = `url("${mediaUrl(ACT5_BG)}")`;
    const grain = document.createElement('div');
    grain.className = 'zh-bg-grain';
    this.fxLayer.append(bg, this.bgAct1, this.bgAct2, this.bgAct3, this.bgAct4, this.bgAct5, grain);
    this.shell.appendChild(this.fxLayer);

    for (const src of [ACT1_BG, ACT2_BG, ACT3_BG, ACT4_BG, ACT5_BG]) {
      const img = new Image();
      img.src = mediaUrl(src);
    }

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
    new AudioGate(document.body, this.audio);
    this.scroll.setInputLocked(!this.audio.isEnabled());
    this.interaction = new InteractionSystem(this.uiLayer, this.audio);
    this.scare = new ScareSystem(this.uiLayer, this.atmosphere, this.audio, perf);

    this.questHud = new QuestHUD(this.uiLayer, quest);
    this.nav = new HorrorNav(
      this.uiLayer,
      (id) => {
        if (!this.audio.isEnabled()) return;
        this.scroll.recalculate();
        this.scroll.scrollToScene(id, false, 0.95);
        this.nav.setActive(id);
      },
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
        '.zh-archive__card, .zh-hero__sigil, .zh-abyss__sigil, .zh-gate3__sigil, .zh-gate4__sigil, .zh-gate5__sigil, .zh-nav__sigil, .zh-ritual__symbol, .zh-void__submit, .zh-collapse__submit, .zh-terminus__submit, .zh-abattoir__submit, .zh-gibbet__submit, .zh-echo__word, .zh-catacombs__door, .zh-swarm__eye, .zh-hooks__hook, .zh-gallows__rope, .zh-hanged__fig, .zh-pendulum__cut, .zh-trapfloor__tile, .zh-roperite__mark-btn, .zh-butcher__cell, .zh-meatlock__mark-btn',
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
    await this.waitForAudio();
    this.shell.classList.add('zh-app--ready');
    this.restoreScrollPosition();
    events.emit(EVT.BOOT_COMPLETE);
    engine.start();
    engine.onUpdate((dt) => this.update(dt));
  }

  private waitForAudio(): Promise<void> {
    if (this.audio.isEnabled()) return Promise.resolve();
    return new Promise((resolve) => {
      events.once(EVT.AUDIO_TOGGLE, (payload) => {
        if ((payload as { enabled?: boolean }).enabled) resolve();
      });
    });
  }

  private restoreScrollPosition(): void {
    const resumeId = quest.getResumeSceneId();
    if (resumeId === SCENE_IDS.hero) return;
    this.scroll.recalculate();
    const cap = this.scroll.getScrollCapForScene(quest.getMaxUnlockedSceneId());
    this.scroll.applyScrollCap(cap);
    this.scroll.scrollToScene(resumeId, true);
    this.nav.setActive(resumeId);
    this.nav.refreshLocks();
    this.audio.setActProfile(quest.getAct());
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

  private applyActBackground(sceneId: string): void {
    const inAct1 = (SCENE_ORDER_ACT1 as readonly string[]).includes(sceneId)
      && sceneId !== SCENE_IDS.hero;
    const inAct2 = (SCENE_ORDER_ACT2 as readonly string[]).includes(sceneId);
    const inAct3 = (SCENE_ORDER_ACT3 as readonly string[]).includes(sceneId);
    const inAct4 = (SCENE_ORDER_ACT4 as readonly string[]).includes(sceneId);
    const inAct5 = (SCENE_ORDER_ACT5 as readonly string[]).includes(sceneId);

    this.shell.classList.toggle('zh-app--act1', inAct1 && !inAct2 && !inAct3 && !inAct4 && !inAct5);
    this.shell.classList.toggle('zh-app--act2', inAct2 && !inAct3 && !inAct4 && !inAct5);
    this.shell.classList.toggle('zh-app--act3', inAct3 && !inAct4 && !inAct5);
    this.shell.classList.toggle('zh-app--act4', inAct4 && !inAct5);
    this.shell.classList.toggle('zh-app--act5', inAct5);
  }

  private navigateToScene(scene?: string, delay = 380): void {
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
      const active = this.scroll.getActiveSceneId();
      this.scroll.recalculate();
      if (active) this.scroll.scrollToScene(active, true);
      events.emit(EVT.RESIZE);
    });

    events.on(EVT.SCENE_CHANGE, (payload) => {
      const id = (payload as { id: string }).id;
      this.nav.setActive(id);
      this.applyActBackground(id);
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
      this.navigateToScene((payload as { scene?: string }).scene, 650);
    });
    events.on(EVT.QUEST_RESET, () => {
      window.location.reload();
    });

    events.on(EVT.AUDIO_TOGGLE, (payload) => {
      const enabled = (payload as { enabled?: boolean }).enabled ?? false;
      this.scroll.setInputLocked(!enabled);
      this.shell.classList.toggle('zh-app--audio-locked', !enabled);
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
    { Gate4Scene },
    { HooksScene },
    { ButcherScene },
    { CorridorScene },
    { MeatlockScene },
    { AbattoirScene },
    { Gate5Scene },
    { GallowsScene },
    { PendulumScene },
    { HangedScene },
    { NooseholdScene },
    { RoperiteScene },
    { TrapfloorScene },
    { GibbetScene },
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
    import('@/scenes/Gate4Scene'),
    import('@/scenes/HooksScene'),
    import('@/scenes/ButcherScene'),
    import('@/scenes/CorridorScene'),
    import('@/scenes/MeatlockScene'),
    import('@/scenes/AbattoirScene'),
    import('@/scenes/Gate5Scene'),
    import('@/scenes/GallowsScene'),
    import('@/scenes/PendulumScene'),
    import('@/scenes/HangedScene'),
    import('@/scenes/NooseholdScene'),
    import('@/scenes/RoperiteScene'),
    import('@/scenes/TrapfloorScene'),
    import('@/scenes/GibbetScene'),
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
    new Gate4Scene(),
    new HooksScene(),
    new ButcherScene(),
    new CorridorScene(),
    new MeatlockScene(),
    new AbattoirScene(),
    new Gate5Scene(),
    new GallowsScene(),
    new PendulumScene(),
    new HangedScene(),
    new NooseholdScene(),
    new RoperiteScene(),
    new TrapfloorScene(),
    new GibbetScene(),
  ]);
  await app.boot();
  return app;
}
