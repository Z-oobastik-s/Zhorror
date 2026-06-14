import {

  ARCHIVE_FRAGMENTS,

  CHAPTERS_ACT1,

  CHAPTERS_ACT2,

  COLLAPSE_CODE,

  ECHO_PHRASE,

  RITUAL_SEQUENCE,

  SCENE_IDS,

  SCENE_ORDER,

  SCENE_ORDER_ACT1,

  SCENE_ORDER_ACT2,

  VOID_CODE,

} from '@/config/constants';

import type { SceneId } from '@/config/constants';

import { events, EVT } from '@/core/EventBus';



const STORAGE_KEY = 'zh-quest-v2';



interface QuestState {

  act: number;

  chapter: number;

  act2Chapter: number;

  fragments: string[];

  ritualStep: number;

  entityFails: number;

  echoStep: number;

  voidComplete: boolean;

  act2Complete: boolean;

}



export class QuestSystem {

  private act = 1;

  private chapter = 0;

  private act2Chapter = 0;

  private unlocked = new Set<SceneId>([SCENE_IDS.hero]);

  private fragments = new Set<string>();

  private ritualStep = 0;

  private entityFails = 0;

  private echoStep = 0;

  private voidComplete = false;

  private act2Complete = false;

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

    return 5 + this.act2Chapter;

  }



  getChapterInfo() {

    if (this.act === 2) {

      return CHAPTERS_ACT2[Math.min(this.act2Chapter, CHAPTERS_ACT2.length - 1)];

    }

    return CHAPTERS_ACT1[Math.min(this.chapter, CHAPTERS_ACT1.length - 1)];

  }



  getObjective(): string {

    if (this.act2Complete) return 'Оба акта пройдены. Архив всё ещё открыт.';

    if (this.act === 2) return this.getChapterInfo().objective;

    if (this.voidComplete) return 'Акт I завершён. Спускайся глубже.';

    return this.getChapterInfo().objective;

  }



  getFragments(): readonly string[] {

    return [...this.fragments];

  }



  getRitualProgress(): number {

    return this.ritualStep;

  }



  getEchoProgress(): number {

    return this.echoStep;

  }



  isUnlocked(id: SceneId): boolean {

    return this.unlocked.has(id);

  }



  isAct1Complete(): boolean {

    return this.voidComplete;

  }



  isComplete(): boolean {

    return this.act2Complete;

  }



  getMaxUnlockedSceneId(): SceneId {

    const order = this.act >= 2 ? SCENE_ORDER : SCENE_ORDER_ACT1;

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



  resetEntityFails(): void {

    this.entityFails = 0;

    this.save();

  }



  resetRitualProgress(): void {

    this.ritualStep = 0;

    this.save();

    events.emit(EVT.QUEST_UPDATE, this.snapshot());

  }



  resetEchoProgress(): void {

    this.echoStep = 0;

    this.save();

    events.emit(EVT.QUEST_UPDATE, this.snapshot());

  }



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

    const normalized = code.trim().toUpperCase().replace(/\s/g, '');

    if (normalized !== VOID_CODE) return false;



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

    const normalized = code.trim().toUpperCase().replace(/\s/g, '');

    if (normalized !== COLLAPSE_CODE) return false;



    this.act2Complete = true;

    this.save();

    events.emit(EVT.QUEST_COMPLETE, { act: 2 });

    events.emit(EVT.QUEST_UPDATE, this.snapshot());

    return true;

  }



  tryNavigate(id: SceneId): boolean {

    return this.isUnlocked(id);

  }



  resetProgress(): void {

    try {

      localStorage.removeItem(STORAGE_KEY);

      localStorage.removeItem('zh-quest-v1');

    } catch {

      /* ignore */

    }

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

      for (const rune of Object.values(ARCHIVE_FRAGMENTS)) {

        this.fragments.add(rune);

      }

    }

    if (this.chapter >= 4) this.ritualStep = RITUAL_SEQUENCE.length;



    if (this.act >= 2) {

      this.unlocked.add(SCENE_IDS.abyss);

      for (let i = 0; i <= this.act2Chapter && i < SCENE_ORDER_ACT2.length; i++) {

        this.unlocked.add(SCENE_ORDER_ACT2[i]);

      }

      if (this.act2Chapter >= 2) this.echoStep = ECHO_PHRASE.length;

    }



    this.refreshSeals();

  }



  private snapshot() {

    return {

      act: this.act,

      chapter: this.chapter,

      act2Chapter: this.act2Chapter,

      objective: this.getObjective(),

      fragments: this.getFragments(),

      ritualStep: this.ritualStep,

      echoStep: this.echoStep,

      voidComplete: this.voidComplete,

      act2Complete: this.act2Complete,

    };

  }



  private load(): void {

    try {

      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return;

      const data = JSON.parse(raw) as QuestState;

      this.act = data.act ?? 1;

      this.chapter = data.chapter ?? 0;

      this.act2Chapter = data.act2Chapter ?? 0;

      this.fragments = new Set(data.fragments ?? []);

      this.ritualStep = data.ritualStep ?? 0;

      this.entityFails = data.entityFails ?? 0;

      this.echoStep = data.echoStep ?? 0;

      this.voidComplete = data.voidComplete ?? false;

      this.act2Complete = data.act2Complete ?? false;

      if (this.voidComplete && this.act < 2) this.act = 2;

    } catch {

      /* ignore */

    }

  }



  private save(): void {

    try {

      const data: QuestState = {

        act: this.act,

        chapter: this.chapter,

        act2Chapter: this.act2Chapter,

        fragments: [...this.fragments],

        ritualStep: this.ritualStep,

        entityFails: this.entityFails,

        echoStep: this.echoStep,

        voidComplete: this.voidComplete,

        act2Complete: this.act2Complete,

      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    } catch {

      /* ignore */

    }

  }

}



export const quest = new QuestSystem();


