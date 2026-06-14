import {
  CHAPTERS_ACT1,
  CHAPTERS_ACT2,
  CHAPTERS_ACT3,
  CHAPTERS_ACT4,
  SCENE_IDS,
  SCENE_ORDER,
  SCENE_ORDER_ACT1,
  SCENE_ORDER_ACT2,
  SCENE_ORDER_ACT3,
  SCENE_ORDER_ACT4,
  TERMINUS_CODE,
} from '@/config/constants';
import type { SceneId } from '@/config/constants';
import { events, EVT } from '@/core/EventBus';
import { audioGate } from '@/systems/AudioGateState';
import {
  collapseHint,
  createRng,
  createSeed,
  generateRunConfig,
  type RunConfig,
} from '@/systems/RunConfig';

const STORAGE_KEY = 'zh-quest-v5';

interface QuestState {
  seed: string;
  act: number;
  chapter: number;
  act2Chapter: number;
  act3Chapter: number;
  act4Chapter: number;
  fragments: string[];
  catacombMarks: string[];
  ritualStep: number;
  finalRiteStep: number;
  entityFails: number;
  echoStep: number;
  swarmFound: number;
  hooksFound: number;
  butcherWon: boolean;
  corridorDone: boolean;
  meatlockStep: number;
  failCount: number;
  voidComplete: boolean;
  act2Complete: boolean;
  act3Complete: boolean;
  act4Complete: boolean;
}

export class QuestSystem {
  private run: RunConfig;
  private act = 1;
  private chapter = 0;
  private act2Chapter = 0;
  private act3Chapter = 0;
  private act4Chapter = 0;
  private unlocked = new Set<SceneId>([SCENE_IDS.hero]);
  private fragments = new Set<string>();
  private catacombMarks = new Set<string>();
  private ritualStep = 0;
  private finalRiteStep = 0;
  private entityFails = 0;
  private echoStep = 0;
  private swarmFound = 0;
  private hooksFound = 0;
  private butcherWon = false;
  private corridorDone = false;
  private meatlockStep = 0;
  private failCount = 0;
  private voidComplete = false;
  private act2Complete = false;
  private act3Complete = false;
  private act4Complete = false;
  private seals: Map<SceneId, HTMLElement> = new Map();

  constructor() {
    const seed = this.loadSeed();
    this.run = generateRunConfig(seed);
    this.load();
    this.syncUnlocks();
  }

  getRun(): Readonly<RunConfig> {
    return this.run;
  }

  getSeed(): string {
    return this.run.seed;
  }

  getFailCount(): number {
    return this.failCount;
  }

  canInteract(): boolean {
    return audioGate.isOpen();
  }

  registerFail(): void {
    this.failCount += 1;
    this.save();
  }

  getRitualSequence(): readonly string[] {
    return this.run.ritualSequence;
  }

  getFinalRiteSequence(): readonly string[] {
    return this.run.finalRiteSequence;
  }

  getEchoPhrase(): readonly string[] {
    return this.run.echoPhrase;
  }

  getEchoWordPool(): string[] {
    const rng = createRng(`${this.run.seed}-echo-ui`);
    const words = [...this.run.echoPhrase, ...this.run.echoDecoys];
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    return words;
  }

  getCatacombMarksTarget(): readonly string[] {
    return this.run.catacombMarks;
  }

  getCatacombDoors(): readonly string[] {
    return this.run.catacombDoors;
  }

  isSwarmReal(index: number): boolean {
    return this.run.swarmRealIndices.includes(index);
  }

  getSwarmRealCount(): number {
    return this.run.swarmRealIndices.length;
  }

  isHookReal(index: number): boolean {
    return this.run.hookRealIndices.includes(index);
  }

  getHookRealCount(): number {
    return this.run.hookRealIndices.length;
  }

  getHooksProgress(): number {
    return this.hooksFound;
  }

  isButcherWon(): boolean {
    return this.butcherWon;
  }

  isCorridorDone(): boolean {
    return this.corridorDone;
  }

  getMeatSequence(): readonly string[] {
    return this.run.meatSequence;
  }

  getMeatlockProgress(): number {
    return this.meatlockStep;
  }

  getCorridorWalls(): readonly boolean[][] {
    return this.run.corridorWalls;
  }

  getAbattoirCode(): string {
    return this.run.abattoirCode;
  }

  getAbattoirHint(): string {
    if (!this.butcherWon) return '';
    return collapseHint(this.run.abattoirCode);
  }

  getMeatlockInputSeconds(): number {
    return Math.max(5, 8 - this.failCount * 0.8);
  }

  getVoidCode(): string {
    return this.run.voidCode;
  }

  getVoidRecordId(): string {
    return this.run.voidRecordId;
  }

  getCollapseCode(): string {
    return this.run.collapseCode;
  }

  getCollapseHint(): string {
    return collapseHint(this.run.collapseCode);
  }

  getTerminusHint(): string {
    return `Z${'○'.repeat(TERMINUS_CODE.length - 2)}S · ${TERMINUS_CODE.length} букв`;
  }

  getRitualInputSeconds(): number {
    return Math.max(8, this.run.ritualInputSeconds - this.failCount * 1.5);
  }

  getFinalRiteInputSeconds(): number {
    return Math.max(6, this.run.finalRiteInputSeconds - this.failCount * 1.2);
  }

  getSwarmTimeSeconds(): number {
    return Math.max(14, this.run.swarmTimeSeconds - this.failCount * 2);
  }

  getSilenceHoldSeconds(): number {
    return this.run.silenceHoldSeconds + this.failCount * 0.4;
  }

  getEntityHoldSeconds(): number {
    return this.run.entityHoldSeconds + this.failCount * 0.35;
  }

  getMirrorHoldSeconds(): number {
    return this.run.mirrorHoldSeconds + this.failCount * 0.45;
  }

  registerSeal(sceneId: SceneId, el: HTMLElement): void {
    this.seals.set(sceneId, el);
    this.refreshSeals();
  }

  getAct(): number {
    return this.act;
  }

  getDepth(): number {
    if (this.act === 4) return 15 + this.act4Chapter;
    if (this.act === 3) return 9 + this.act3Chapter;
    if (this.act === 2) return 5 + this.act2Chapter;
    return this.chapter;
  }

  getChapterInfo() {
    if (this.act === 4) return CHAPTERS_ACT4[Math.min(this.act4Chapter, CHAPTERS_ACT4.length - 1)];
    if (this.act === 3) return CHAPTERS_ACT3[Math.min(this.act3Chapter, CHAPTERS_ACT3.length - 1)];
    if (this.act === 2) return CHAPTERS_ACT2[Math.min(this.act2Chapter, CHAPTERS_ACT2.length - 1)];
    return CHAPTERS_ACT1[Math.min(this.chapter, CHAPTERS_ACT1.length - 1)];
  }

  getObjective(): string {
    if (this.act4Complete) return 'Архив замкнут. Мясник доволен. Ты - последняя запись.';
    if (this.act === 4) {
      if (this.act4Chapter === 2 && !this.butcherWon) return 'Выиграй у мясника. Проигрыш = скример.';
      if (this.act4Chapter === 3 && !this.corridorDone) return 'Стрелки на клавиатуре. 10 кусков. Стена = смерть.';
      if (this.act4Chapter === 5 && this.butcherWon) return `Код мясника: ${this.getAbattoirHint()}`;
      return this.getChapterInfo().objective;
    }
    if (this.act3Complete && this.act < 4) return 'Терминус пройден. Мясник ждёт за дверью.';
    if (this.act === 3) {
      if (this.act3Chapter === 4) return 'Повтори 6 символов. Время сокращается с каждой ошибкой.';
      if (this.act3Chapter === 5 && this.finalRiteStep >= this.run.finalRiteSequence.length) {
        return 'Назови автора. Подсказка открыта после ритуала.';
      }
      return this.getChapterInfo().objective;
    }
    if (this.act2Complete) return 'Акт II завершён. Ядро архива ждёт.';
    if (this.act === 2) {
      if (this.act2Chapter === 3) return 'Введи код, который эхо прошептало.';
      return this.getChapterInfo().objective;
    }
    if (this.voidComplete) return 'Акт I завершён. Спускайся глубже.';
    if (this.chapter === 4) return 'Введи id записи-печати из архива.';
    if (this.chapter === 1) return 'Открой записи и собери 4 метки. Не все метки настоящие.';
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
  isAct3Complete(): boolean { return this.act3Complete; }
  isComplete(): boolean { return this.act4Complete; }

  getMaxUnlockedSceneId(): SceneId {
    let order: SceneId[] = SCENE_ORDER_ACT1;
    if (this.act >= 4) order = SCENE_ORDER;
    else if (this.act >= 3) order = [...SCENE_ORDER_ACT1, ...SCENE_ORDER_ACT2, ...SCENE_ORDER_ACT3];
    else if (this.act >= 2) order = [...SCENE_ORDER_ACT1, ...SCENE_ORDER_ACT2];
    let max: SceneId = order[0];
    for (const id of order) {
      if (this.unlocked.has(id)) max = id;
    }
    return max;
  }

  enterArchive(): void {
    if (!this.canInteract() || this.chapter > 0) return;
    this.chapter = 1;
    this.unlock(SCENE_IDS.archive);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { act: 1, chapter: 1, scene: SCENE_IDS.archive });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  collectFragment(recordId: string): boolean {
    if (!this.canInteract()) return false;
    const rune = this.run.archiveMap[recordId];
    if (!rune || this.fragments.has(rune)) return false;
    this.fragments.add(rune);
    events.emit(EVT.QUEST_FRAGMENT, { rune, total: this.fragments.size });
    if (this.fragments.size >= this.run.ritualSequence.length && this.chapter === 1) {
      this.chapter = 2;
      this.unlock(SCENE_IDS.entity);
      events.emit(EVT.QUEST_CHAPTER, { act: 1, chapter: 2, scene: SCENE_IDS.entity });
    }
    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return true;
  }

  isDecoyRecord(recordId: string): boolean {
    return this.run.decoyRecordIds.includes(recordId);
  }

  hasArchiveMark(recordId: string): boolean {
    return recordId in this.run.archiveMap || this.run.decoyRecordIds.includes(recordId);
  }

  getArchiveRune(recordId: string): string {
    return this.run.archiveMap[recordId] ?? '';
  }

  getArchiveSecret(recordId: string, baseSecret: string): string {
    if (recordId === this.run.voidRecordId) {
      return `${baseSecret} ключ печати: ${this.run.voidCode}`;
    }
    if (this.run.decoyRecordIds.includes(recordId)) {
      return `${baseSecret} метка ложная.`;
    }
    return baseSecret;
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
    const expected = this.run.ritualSequence[this.ritualStep];
    if (symbol !== expected) {
      this.registerFail();
      this.ritualStep = 0;
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'wrong';
    }
    this.ritualStep += 1;
    if (this.ritualStep >= this.run.ritualSequence.length) {
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
    const norm = code.trim().toUpperCase().replace(/\s/g, '');
    if (norm !== this.run.voidCode.toUpperCase()) {
      this.registerFail();
      return false;
    }
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
    if (!this.canInteract() || this.act !== 2 || this.act2Chapter > 0) return;
    this.act2Chapter = 1;
    this.unlock(SCENE_IDS.echo);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { act: 2, chapter: 1, scene: SCENE_IDS.echo });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  advanceEcho(word: string): 'ok' | 'wrong' | 'done' {
    const expected = this.run.echoPhrase[this.echoStep];
    if (word !== expected) {
      this.registerFail();
      this.echoStep = 0;
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'wrong';
    }
    this.echoStep += 1;
    if (this.echoStep >= this.run.echoPhrase.length) {
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
    const norm = code.trim().toUpperCase().replace(/\s/g, '');
    if (norm !== this.run.collapseCode) {
      this.registerFail();
      return false;
    }
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
    if (!this.canInteract() || this.act !== 3 || this.act3Chapter > 0) return;
    this.act3Chapter = 1;
    this.unlock(SCENE_IDS.catacombs);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { act: 3, chapter: 1, scene: SCENE_IDS.catacombs });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  collectCatacombMark(mark: string): 'ok' | 'wrong' | 'done' {
    if (!this.run.catacombMarks.includes(mark)) {
      this.registerFail();
      return 'wrong';
    }
    if (this.catacombMarks.has(mark)) return 'ok';
    this.catacombMarks.add(mark);
    if (this.catacombMarks.size >= this.run.catacombMarks.length && this.act3Chapter === 1) {
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
    if (!this.isSwarmReal(index)) {
      this.registerFail();
      this.swarmFound = 0;
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'wrong';
    }
    this.swarmFound += 1;
    if (this.swarmFound >= this.run.swarmRealIndices.length && this.act3Chapter === 2) {
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
    const expected = this.run.finalRiteSequence[this.finalRiteStep];
    if (symbol !== expected) {
      this.registerFail();
      this.finalRiteStep = 0;
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'wrong';
    }
    this.finalRiteStep += 1;
    if (this.finalRiteStep >= this.run.finalRiteSequence.length) {
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
    const norm = code.trim().toUpperCase().replace(/\s/g, '');
    if (norm !== TERMINUS_CODE) {
      this.registerFail();
      return false;
    }
    this.act3Complete = true;
    this.act = 4;
    this.act4Chapter = 0;
    this.unlock(SCENE_IDS.gate4);
    this.save();
    events.emit(EVT.QUEST_COMPLETE, { act: 3 });
    events.emit(EVT.QUEST_ACT_START, { act: 4, scene: SCENE_IDS.gate4 });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return true;
  }

  enterGate4(): void {
    if (!this.canInteract() || this.act !== 4 || this.act4Chapter > 0) return;
    this.act4Chapter = 1;
    this.unlock(SCENE_IDS.hooks);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { act: 4, chapter: 1, scene: SCENE_IDS.hooks });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  registerHookHit(index: number): 'ok' | 'wrong' | 'done' {
    if (!this.isHookReal(index)) {
      this.registerFail();
      this.hooksFound = 0;
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'wrong';
    }
    this.hooksFound += 1;
    if (this.hooksFound >= this.run.hookRealIndices.length && this.act4Chapter === 1) {
      this.act4Chapter = 2;
      this.unlock(SCENE_IDS.butcher);
      this.save();
      events.emit(EVT.QUEST_CHAPTER, { act: 4, chapter: 2, scene: SCENE_IDS.butcher });
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'done';
    }
    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return 'ok';
  }

  resetHooksProgress(): void {
    this.hooksFound = 0;
    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  completeButcherTrial(): void {
    if (this.act !== 4 || this.act4Chapter !== 2) return;
    this.butcherWon = true;
    this.act4Chapter = 3;
    this.unlock(SCENE_IDS.corridor);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { act: 4, chapter: 3, scene: SCENE_IDS.corridor });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  completeCorridorTrial(): void {
    if (this.act !== 4 || this.act4Chapter !== 3) return;
    this.corridorDone = true;
    this.act4Chapter = 4;
    this.unlock(SCENE_IDS.meatlock);
    this.save();
    events.emit(EVT.QUEST_CHAPTER, { act: 4, chapter: 4, scene: SCENE_IDS.meatlock });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  advanceMeatlock(symbol: string): 'ok' | 'wrong' | 'done' {
    const expected = this.run.meatSequence[this.meatlockStep];
    if (symbol !== expected) {
      this.registerFail();
      this.meatlockStep = 0;
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'wrong';
    }
    this.meatlockStep += 1;
    if (this.meatlockStep >= this.run.meatSequence.length) {
      if (this.act4Chapter === 4) {
        this.act4Chapter = 5;
        this.unlock(SCENE_IDS.abattoir);
        events.emit(EVT.QUEST_CHAPTER, { act: 4, chapter: 5, scene: SCENE_IDS.abattoir });
      }
      this.save();
      events.emit(EVT.QUEST_UPDATE, this.snapshot());
      return 'done';
    }
    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return 'ok';
  }

  resetMeatlockProgress(): void {
    this.meatlockStep = 0;
    this.save();
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
  }

  submitAbattoirCode(code: string): boolean {
    const norm = code.trim().toUpperCase().replace(/\s/g, '');
    if (norm !== this.run.abattoirCode) {
      this.registerFail();
      return false;
    }
    this.act4Complete = true;
    this.save();
    events.emit(EVT.QUEST_COMPLETE, { act: 4 });
    events.emit(EVT.QUEST_UPDATE, this.snapshot());
    return true;
  }

  tryNavigate(id: SceneId): boolean {
    if (!this.canInteract()) return false;
    return this.isUnlocked(id);
  }

  resetProgress(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('zh-quest-v4');
      localStorage.removeItem('zh-quest-v3');
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
      for (const rune of Object.values(this.run.archiveMap)) this.fragments.add(rune);
    }
    if (this.chapter >= 4) this.ritualStep = this.run.ritualSequence.length;

    if (this.act >= 2) {
      this.unlocked.add(SCENE_IDS.abyss);
      for (let i = 0; i <= this.act2Chapter && i < SCENE_ORDER_ACT2.length; i++) {
        this.unlocked.add(SCENE_ORDER_ACT2[i]);
      }
      if (this.act2Chapter >= 2) this.echoStep = this.run.echoPhrase.length;
    }

    if (this.act >= 3) {
      this.unlocked.add(SCENE_IDS.gate3);
      for (let i = 0; i <= this.act3Chapter && i < SCENE_ORDER_ACT3.length; i++) {
        this.unlocked.add(SCENE_ORDER_ACT3[i]);
      }
      if (this.act3Chapter >= 2) {
        for (const m of this.run.catacombMarks) this.catacombMarks.add(m);
      }
      if (this.act3Chapter >= 2) this.swarmFound = this.run.swarmRealIndices.length;
      if (this.act3Chapter >= 4) this.finalRiteStep = this.run.finalRiteSequence.length;
    }

    if (this.act >= 4) {
      this.unlocked.add(SCENE_IDS.gate4);
      for (let i = 0; i <= this.act4Chapter && i < SCENE_ORDER_ACT4.length; i++) {
        this.unlocked.add(SCENE_ORDER_ACT4[i]);
      }
      if (this.act4Chapter >= 2) this.hooksFound = this.run.hookRealIndices.length;
      if (this.act4Chapter >= 3) this.butcherWon = true;
      if (this.act4Chapter >= 4) this.corridorDone = true;
      if (this.act4Chapter >= 5) this.meatlockStep = this.run.meatSequence.length;
    }

    this.refreshSeals();
  }

  private snapshot() {
    return {
      act: this.act,
      chapter: this.chapter,
      act2Chapter: this.act2Chapter,
      act3Chapter: this.act3Chapter,
      act4Chapter: this.act4Chapter,
      objective: this.getObjective(),
      voidComplete: this.voidComplete,
      act2Complete: this.act2Complete,
      act3Complete: this.act3Complete,
      act4Complete: this.act4Complete,
      seed: this.run.seed,
      failCount: this.failCount,
    };
  }

  private loadSeed(): string {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) raw = localStorage.getItem('zh-quest-v5');
      if (!raw) raw = localStorage.getItem('zh-quest-v4');
      if (raw) {
        const data = JSON.parse(raw) as QuestState;
        if (data.seed) return data.seed;
      }
    } catch { /* ignore */ }
    return createSeed();
  }

  private load(): void {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) raw = localStorage.getItem('zh-quest-v5');
      if (!raw) raw = localStorage.getItem('zh-quest-v4');
      if (!raw) return;
      const data = JSON.parse(raw) as QuestState;
      if (data.seed) {
        this.run = generateRunConfig(data.seed);
      } else {
        this.fragments.clear();
        this.catacombMarks.clear();
        this.ritualStep = 0;
        this.finalRiteStep = 0;
        this.echoStep = 0;
        this.swarmFound = 0;
        this.failCount = 0;
      }
      this.act = data.act ?? 1;
      this.chapter = data.chapter ?? 0;
      this.act2Chapter = data.act2Chapter ?? 0;
      this.act3Chapter = data.act3Chapter ?? 0;
      this.act4Chapter = data.act4Chapter ?? 0;
      this.fragments = new Set(data.fragments ?? []);
      this.catacombMarks = new Set(data.catacombMarks ?? []);
      this.ritualStep = data.ritualStep ?? 0;
      this.finalRiteStep = data.finalRiteStep ?? 0;
      this.entityFails = data.entityFails ?? 0;
      this.echoStep = data.echoStep ?? 0;
      this.swarmFound = data.swarmFound ?? 0;
      this.hooksFound = data.hooksFound ?? 0;
      this.butcherWon = data.butcherWon ?? false;
      this.corridorDone = data.corridorDone ?? false;
      this.meatlockStep = data.meatlockStep ?? 0;
      this.failCount = data.failCount ?? 0;
      this.voidComplete = data.voidComplete ?? false;
      this.act2Complete = data.act2Complete ?? false;
      this.act3Complete = data.act3Complete ?? false;
      this.act4Complete = data.act4Complete ?? false;
      if (this.voidComplete && this.act < 2) this.act = 2;
      if (this.act2Complete && this.act < 3) this.act = 3;
      if (this.act3Complete && this.act < 4 && !this.act4Complete) this.act = 4;
    } catch { /* ignore */ }
  }

  private save(): void {
    try {
      const data: QuestState = {
        seed: this.run.seed,
        act: this.act,
        chapter: this.chapter,
        act2Chapter: this.act2Chapter,
        act3Chapter: this.act3Chapter,
        act4Chapter: this.act4Chapter,
        fragments: [...this.fragments],
        catacombMarks: [...this.catacombMarks],
        ritualStep: this.ritualStep,
        finalRiteStep: this.finalRiteStep,
        entityFails: this.entityFails,
        echoStep: this.echoStep,
        swarmFound: this.swarmFound,
        hooksFound: this.hooksFound,
        butcherWon: this.butcherWon,
        corridorDone: this.corridorDone,
        meatlockStep: this.meatlockStep,
        failCount: this.failCount,
        voidComplete: this.voidComplete,
        act2Complete: this.act2Complete,
        act3Complete: this.act3Complete,
        act4Complete: this.act4Complete,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }
}

export const quest = new QuestSystem();
