import {
  ARCHIVE_FRAGMENTS,
  CATACOMB_MARKS,
  CHAPTERS_ACT1,
  CHAPTERS_ACT2,
  CHAPTERS_ACT3,
  COLLAPSE_CODE,
  ECHO_PHRASE,
  FINAL_RITUAL_SEQUENCE,
  RITUAL_SEQUENCE,
  SCENE_IDS,
  SCENE_ORDER,
  SCENE_ORDER_ACT1,
  SCENE_ORDER_ACT2,
  SCENE_ORDER_ACT3,
  SWARM_REAL_INDICES,
  TERMINUS_CODE,
  VOID_CODE,
} from '@/config/constants';
import type { SceneId } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';

const STORAGE_KEY = 'zh-quest-v3';

interface QuestState {
  act: number;
  chapter: number;
  act2Chapter: number;
  act3Chapter: number;
  fragments: string[];
  catacombMarks: string[];
  ritualStep: number;
  finalRiteStep: number;
  entityFails: number;
  echoStep: number;
  swarmFound: number;
  voidComplete: boolean;
  act2Complete: boolean;
  act3Complete: boolean;
}

export class QuestSystem {
  private act = 1;
  private chapter = 0;
  private act2Chapter = 0;
  private act3Chapter = 0;
  private unlocked = new Set<SceneId>([SCENE_IDS.hero]);
  private fragments = new Set<string>();
  private catacombMarks = new Set<string>();
  private ritualStep = 0;
  private finalRiteStep = 0;
  private entityFails = 0;
  private echoStep = 0;
  private swarmFound = 0;
  private voidComplete = false;
  private act2Complete = false;
  private act3Complete = false;
  private seals: Map<SceneId, HTMLElement> = new Map();

  constructor() {
    this.load();
    this.syncUnlocks();
  }

  registerSeal(sceneId: SceneId, el: HTMLElement): void {
    this.seals.set(sceneId, el);
    this.refreshSeals();
  }

  getAct(): number {
    return this.act;
  }

  getDepth(): number {
    if (this.act === 1) return this.chapter;
    if (this.act === 2) return 5 + this.act2Chapter;
    return 9 + this.act3Chapter;
  }

  getChapterInfo() {
    if (this.act === 3) return CHAPTERS_ACT3[Math.min(this.act3Chapter, CHAPTERS_ACT3.length - 1)];
    if (this.act === 2) return CHAPTERS_ACT2[Math.min(this.act2Chapter, CHAPTERS_ACT2.length - 1)];
    return CHAPTERS_ACT1[Math.min(this.chapter, CHAPTERS_ACT1.length - 1)];
  }

  getObjective(): string {
    if (this.act3Complete) return 'Все три акта пройдены. Архив не закрывается.';
    if (this.act === 3) return this.getChapterInfo().objective;
    if (this.act2Complete) return 'Акт II завершён. Ядро архива ждёт.';
    if (this.act === 2) return this.getChapterInfo().objective;
    if (this.voidComplete) return 'Акт I завершён. Спускайся глубже.';
    return this.getChapterInfo().objective;
  }

  getFragments(): readonly string[] { return [...this.fragments]; }
  getCatacombMarks(): readonly string[] { return [...this.catacombMarks]; }
  getRitualProgress(): number { return this.ritualStep; }
  getFinalRiteProgress(): number { return this.finalRiteStep; }
  getEchoProgress(): number { return this.echoStep; }
  getSwarmProgress(): number { return this.swarmFound; }

  isUnlocked(id: SceneId): boolean { return this.unlocked.has(id); }
  isAct1Complete(): boolean { return this.voidComplete; }
  isAct2Complete(): boolean { return this.act2Complete; }
  isComplete(): boolean { return this.act3Complete; }

  getMaxUnlockedSceneId(): SceneId {
    let order = SCENE_ORDER_ACT1;
    if (this.act >= 3) order = SCENE_ORDER;
    else if (this.act >= 2) order = [...SCENE_ORDER_ACT1, ...SCENE_ORDER_ACT2];
    let max: SceneId = order[0];
    for (const id of order) {
      if (this.unlocked.has(id)) max = id;
    }
    return max;
  }

  enterArchive(): void {
    if (this.chapter > 0) return;
    this.chapter = 1;
    this.unlock(SCENE_IDS.archive);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { act: 1, chapter: 1, scene: SCENE_IDS.archive });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  collectFragment(recordId: string): boolean {
    const rune = ARCHIVE_FRAGMENTS[recordId];
    if (!rune || this.fragments.has(rune)) return false;
    this.fragments.add(rune);
    events.emit(EVT.QUEST_FRAGMENT, { rune, total: this.fragments.size });
    if (this.fragments.size >= Object.keys(ARCHIVE_FRAGMENTS).length && this.chapter === 1) {
      this.chapter = 2;
      this.unlock(SCENE_IDS.entity);
      events.emit(EVT.QUEST_CHAPTER, { act: 1, chapter: 2, scene: SCENE_IDS.entity });
    }
    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return true;
  }

  completeEntityTrial(): void {
    if (this.chapter !== 2) return;
    this.chapter = 3;
    this.unlock(SCENE_IDS.ritual);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { act: 1, chapter: 3, scene: SCENE_IDS.ritual });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  completeMirrorTrial(): void {
    if (this.act !== 2 || this.act2Chapter !== 2) return;
    this.act2Chapter = 3;
    this.unlock(SCENE_IDS.collapse);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { act: 2, chapter: 3, scene: SCENE_IDS.collapse });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  registerEntityFail(): number {
    this.entityFails += 1;
    this.save();
    return this.entityFails;
  }

  resetEntityFails(): void { this.entityFails = 0; this.save(); }
  resetRitualProgress(): void { this.ritualStep = 0; this.save(); events.emit(EVT.QUEST_UPDATE, this.snapshot()); }
  resetFinalRiteProgress(): void { this.finalRiteStep = 0; this.save(); events.emit(EVT.QUEST_UPDATE, this.snapshot()); }
  resetEchoProgress(): void { this.echoStep = 0; this.save(); events.emit(EVT.QUEST_UPDATE, this.snapshot()); }
  resetSwarmProgress(): void { this.swarmFound = 0; this.save(); events.emit(EVT.QUEST_UPDATE, this.snapshot()); }

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
        events.emit(EVT.QUEST_CHAPTER, { act: 1, chapter: 4, scene: SCENE_IDS.void });
      }
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'done';
    }
    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return 'ok';
  }

  submitVoidCode(code: string): boolean {
    if (code.trim().toUpperCase().replace(/\s/g, '') !== VOID_CODE) return false;
    this.voidComplete = true;
    this.act = 2;
    this.act2Chapter = 0;
    this.unlock(SCENE_IDS.abyss);
    this.save();
    events.emit(EVT.QUEST_COMPLETE, { act: 1 });
    events.emit(EVT.QUEST_ACT_START, { act: 2, scene: SCENE_IDS.abyss });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return true;
  }

  enterAbyss(): void {
    if (this.act !== 2 || this.act2Chapter > 0) return;
    this.act2Chapter = 1;
    this.unlock(SCENE_IDS.echo);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { act: 2, chapter: 1, scene: SCENE_IDS.echo });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  advanceEcho(word: string): 'ok' | 'wrong' | 'done' {
    const expected = ECHO_PHRASE[this.echoStep];
    if (word !== expected) {
      this.echoStep = 0;
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'wrong';
    }
    this.echoStep += 1;
    if (this.echoStep >= ECHO_PHRASE.length) {
      if (this.act2Chapter === 1) {
        this.act2Chapter = 2;
        this.unlock(SCENE_IDS.mirror);
        events.emit(EVT.QUEST_CHAPTER, { act: 2, chapter: 2, scene: SCENE_IDS.mirror });
      }
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'done';
    }
    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return 'ok';
  }

  submitCollapseCode(code: string): boolean {
    if (code.trim().toUpperCase().replace(/\s/g, '') !== COLLAPSE_CODE) return false;
    this.act2Complete = true;
    this.act = 3;
    this.act3Chapter = 0;
    this.unlock(SCENE_IDS.gate3);
    this.save();
    events.emit(EVT.QUEST_COMPLETE, { act: 2 });
    events.emit(EVT.QUEST_ACT_START, { act: 3, scene: SCENE_IDS.gate3 });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return true;
  }

  enterGate3(): void {
    if (this.act !== 3 || this.act3Chapter > 0) return;
    this.act3Chapter = 1;
    this.unlock(SCENE_IDS.catacombs);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { act: 3, chapter: 1, scene: SCENE_IDS.catacombs });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  collectCatacombMark(mark: string): 'ok' | 'wrong' | 'done' {
    if (!CATACOMB_MARKS.includes(mark as typeof CATACOMB_MARKS[number])) return 'wrong';
    if (this.catacombMarks.has(mark)) return 'ok';
    this.catacombMarks.add(mark);
    if (this.catacombMarks.size >= CATACOMB_MARKS.length && this.act3Chapter === 1) {
      this.act3Chapter = 2;
      this.unlock(SCENE_IDS.swarm);
      this.save();
      events.emit(EVT.QUEST_CHAPTER, { act: 3, chapter: 2, scene: SCENE_IDS.swarm });
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'done';
    }
    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return 'ok';
  }

  registerSwarmHit(index: number): 'ok' | 'wrong' | 'done' {
    const isReal = SWARM_REAL_INDICES.includes(index as typeof SWARM_REAL_INDICES[number]);
    if (!isReal) {
      this.swarmFound = 0;
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'wrong';
    }
    this.swarmFound += 1;
    if (this.swarmFound >= SWARM_REAL_INDICES.length && this.act3Chapter === 2) {
      this.act3Chapter = 3;
      this.unlock(SCENE_IDS.silence);
      this.save();
      events.emit(EVT.QUEST_CHAPTER, { act: 3, chapter: 3, scene: SCENE_IDS.silence });
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'done';
    }
    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return 'ok';
  }

  completeSilenceTrial(): void {
    if (this.act !== 3 || this.act3Chapter !== 3) return;
    this.act3Chapter = 4;
    this.unlock(SCENE_IDS.finalrite);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { act: 3, chapter: 4, scene: SCENE_IDS.finalrite });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  advanceFinalRite(symbol: string): 'ok' | 'wrong' | 'done' {
    const expected = FINAL_RITUAL_SEQUENCE[this.finalRiteStep];
    if (symbol !== expected) {
      this.finalRiteStep = 0;
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'wrong';
    }
    this.finalRiteStep += 1;
    if (this.finalRiteStep >= FINAL_RITUAL_SEQUENCE.length) {
      if (this.act3Chapter === 4) {
        this.act3Chapter = 5;
        this.unlock(SCENE_IDS.terminus);
        events.emit(EVT.QUEST_CHAPTER, { act: 3, chapter: 5, scene: SCENE_IDS.terminus });
      }
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'done';
    }
    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return 'ok';
  }

  submitTerminusCode(code: string): boolean {
    if (code.trim().toUpperCase().replace(/\s/g, '') !== TERMINUS_CODE) return false;
    this.act3Complete = true;
    this.save();
    events.emit(EVT.QUEST_COMPLETE, { act: 3 });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return true;
  }

  tryNavigate(id: SceneId): boolean { return this.isUnlocked(id); }

  resetProgress(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('zh-quest-v2');
      localStorage.removeItem('zh-quest-v1');
    } catch { /* ignore */ }
    events.emit(EVT.QUEST_RESET);
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
    for (let i = 0; i <= this.chapter && i < SCENE_ORDER_ACT1.length; i++) {
      this.unlocked.add(SCENE_ORDER_ACT1[i]);
    }
    if (this.chapter >= 2) {
      for (const rune of Object.values(ARCHIVE_FRAGMENTS)) this.fragments.add(rune);
    }
    if (this.chapter >= 4) this.ritualStep = RITUAL_SEQUENCE.length;

    if (this.act >= 2) {
      this.unlocked.add(SCENE_IDS.abyss);
      for (let i = 0; i <= this.act2Chapter && i < SCENE_ORDER_ACT2.length; i++) {
        this.unlocked.add(SCENE_ORDER_ACT2[i]);
      }
      if (this.act2Chapter >= 2) this.echoStep = ECHO_PHRASE.length;
    }

    if (this.act >= 3) {
      this.unlocked.add(SCENE_IDS.gate3);
      for (let i = 0; i <= this.act3Chapter && i < SCENE_ORDER_ACT3.length; i++) {
        this.unlocked.add(SCENE_ORDER_ACT3[i]);
      }
      if (this.act3Chapter >= 2) {
        for (const m of CATACOMB_MARKS) this.catacombMarks.add(m);
      }
      if (this.act3Chapter >= 2) this.swarmFound = SWARM_REAL_INDICES.length;
      if (this.act3Chapter >= 4) this.finalRiteStep = FINAL_RITUAL_SEQUENCE.length;
    }

    this.refreshSeals();
  }

  private snapshot() {
    return {
      act: this.act,
      chapter: this.chapter,
      act2Chapter: this.act2Chapter,
      act3Chapter: this.act3Chapter,
      objective: this.getObjective(),
      voidComplete: this.voidComplete,
      act2Complete: this.act2Complete,
      act3Complete: this.act3Complete,
    };
  }

  private load(): void {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) raw = localStorage.getItem('zh-quest-v2');
      if (!raw) return;
      const data = JSON.parse(raw) as QuestState;
      this.act = data.act ?? 1;
      this.chapter = data.chapter ?? 0;
      this.act2Chapter = data.act2Chapter ?? 0;
      this.act3Chapter = data.act3Chapter ?? 0;
      this.fragments = new Set(data.fragments ?? []);
      this.catacombMarks = new Set(data.catacombMarks ?? []);
      this.ritualStep = data.ritualStep ?? 0;
      this.finalRiteStep = data.finalRiteStep ?? 0;
      this.entityFails = data.entityFails ?? 0;
      this.echoStep = data.echoStep ?? 0;
      this.swarmFound = data.swarmFound ?? 0;
      this.voidComplete = data.voidComplete ?? false;
      this.act2Complete = data.act2Complete ?? false;
      this.act3Complete = data.act3Complete ?? false;
      if (this.voidComplete && this.act < 2) this.act = 2;
      if (this.act2Complete && this.act < 3) this.act = 3;
    } catch { /* ignore */ }
  }

  private save(): void {
    try {
      const data: QuestState = {
        act: this.act,
        chapter: this.chapter,
        act2Chapter: this.act2Chapter,
        act3Chapter: this.act3Chapter,
        fragments: [...this.fragments],
        catacombMarks: [...this.catacombMarks],
        ritualStep: this.ritualStep,
        finalRiteStep: this.finalRiteStep,
        entityFails: this.entityFails,
        echoStep: this.echoStep,
        swarmFound: this.swarmFound,
        voidComplete: this.voidComplete,
        act2Complete: this.act2Complete,
        act3Complete: this.act3Complete,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }
}

export const quest = new QuestSystem();
