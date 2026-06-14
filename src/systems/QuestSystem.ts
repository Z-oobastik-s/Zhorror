import { ARCHIVE_FRAGMENTS, CHAPTERS, RITUAL_SEQUENCE, SCENE_IDS, SCENE_ORDER, VOID_CODE } from '@/config/constants';
import type { SceneId } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';

const STORAGE_KEY = 'zh-quest-v1';

interface QuestState {
  chapter: number;
  fragments: string[];
  ritualStep: number;
  entityFails: number;
  voidComplete: boolean;
}

export class QuestSystem {
  private chapter = 0;
  private unlocked = new Set<SceneId>([SCENE_IDS.hero]);
  private fragments = new Set<string>();
  private ritualStep = 0;
  private entityFails = 0;
  private voidComplete = false;
  private seals: Map<SceneId, HTMLElement> = new Map();

  constructor() {
    this.load();
    this.syncUnlocks();
  }

  registerSeal(sceneId: SceneId, el: HTMLElement): void {
    this.seals.set(sceneId, el);
    this.refreshSeals();
  }

  getDepth(): number {
    return this.chapter;
  }

  getChapterInfo() {
    return CHAPTERS[Math.min(this.chapter, CHAPTERS.length - 1)];
  }

  getObjective(): string {
    if (this.voidComplete) return 'Архив пройден. Ты всё ещё здесь.';
    return this.getChapterInfo().objective;
  }

  getFragments(): readonly string[] {
    return [...this.fragments];
  }

  getRitualProgress(): number {
    return this.ritualStep;
  }

  isUnlocked(id: SceneId): boolean {
    return this.unlocked.has(id);
  }

  isComplete(): boolean {
    return this.voidComplete;
  }

  getMaxUnlockedSceneId(): SceneId {
    let max: SceneId = SCENE_IDS.hero;
    for (const id of SCENE_ORDER) {
      if (this.unlocked.has(id)) max = id;
    }
    return max;
  }

  /** Глава 0: вход в архив */
  enterArchive(): void {
    if (this.chapter > 0) return;
    this.chapter = 1;
    this.unlock(SCENE_IDS.archive);
    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  /** Глава I: метка из записи */
  collectFragment(recordId: string): boolean {
    const rune = ARCHIVE_FRAGMENTS[recordId];
    if (!rune || this.fragments.has(rune)) return false;

    this.fragments.add(rune);
    events.emit(EVT.QUEST_FRAGMENT, { rune, total: this.fragments.size });

    if (this.fragments.size >= Object.keys(ARCHIVE_FRAGMENTS).length && this.chapter === 1) {
      this.chapter = 2;
      this.unlock(SCENE_IDS.entity);
      events.emit(EVT.QUEST_CHAPTER, { chapter: 2, scene: SCENE_IDS.entity });
    }

    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return true;
  }

  /** Глава II: застыть перед наблюдателем */
  completeEntityTrial(): void {
    if (this.chapter !== 2) return;
    this.chapter = 3;
    this.unlock(SCENE_IDS.ritual);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { chapter: 3, scene: SCENE_IDS.ritual });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  registerEntityFail(): number {
    this.entityFails += 1;
    this.save();
    return this.entityFails;
  }

  resetEntityFails(): void {
    this.entityFails = 0;
    this.save();
  }

  /** Глава III: символ ритуала */
  advanceRitual(symbol: string): 'ok' | 'wrong' | 'done' {
    const expected = RITUAL_SEQUENCE[this.ritualStep];
    if (symbol !== expected) {
      this.ritualStep = 0;
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'wrong';
    }

    this.ritualStep += 1;
    if (this.ritualStep >= RITUAL_SEQUENCE.length) {
      if (this.chapter === 3) {
        this.chapter = 4;
        this.unlock(SCENE_IDS.void);
        events.emit(EVT.QUEST_CHAPTER, { chapter: 4, scene: SCENE_IDS.void });
      }
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'done';
    }

    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return 'ok';
  }

  /** Глава IV: финальный код */
  submitVoidCode(code: string): boolean {
    const normalized = code.trim().toUpperCase().replace(/\s/g, '');
    if (normalized !== VOID_CODE) return false;

    this.voidComplete = true;
    this.save();
    events.emit(EVT.QUEST_COMPLETE);
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return true;
  }

  tryNavigate(id: SceneId): boolean {
    return this.isUnlocked(id);
  }

  private unlock(id: SceneId): void {
    this.unlocked.add(id);
    this.refreshSeals();
  }

  private refreshSeals(): void {
    for (const [id, seal] of this.seals) {
      const locked = !this.unlocked.has(id);
      seal.classList.toggle('zh-scene-seal--visible', locked);
      seal.setAttribute('aria-hidden', locked ? 'false' : 'true');
    }
  }

  private syncUnlocks(): void {
    for (let i = 0; i <= this.chapter && i < SCENE_ORDER.length; i++) {
      this.unlocked.add(SCENE_ORDER[i]);
    }
    if (this.chapter >= 2) {
      for (const rune of Object.values(ARCHIVE_FRAGMENTS)) {
        this.fragments.add(rune);
      }
    }
    if (this.chapter >= 4) this.ritualStep = RITUAL_SEQUENCE.length;
    this.refreshSeals();
  }

  private snapshot() {
    return {
      chapter: this.chapter,
      objective: this.getObjective(),
      fragments: this.getFragments(),
      ritualStep: this.ritualStep,
      voidComplete: this.voidComplete,
    };
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as QuestState;
      this.chapter = data.chapter ?? 0;
      this.fragments = new Set(data.fragments ?? []);
      this.ritualStep = data.ritualStep ?? 0;
      this.entityFails = data.entityFails ?? 0;
      this.voidComplete = data.voidComplete ?? false;
    } catch {
      /* ignore */
    }
  }

  private save(): void {
    try {
      const data: QuestState = {
        chapter: this.chapter,
        fragments: [...this.fragments],
        ritualStep: this.ritualStep,
        entityFails: this.entityFails,
        voidComplete: this.voidComplete,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }
}

export const quest = new QuestSystem();
