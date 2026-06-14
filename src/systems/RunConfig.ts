import {
  ARCHIVE_RECORD_META,
  CATACOMB_MARK_POOL,
  COLLAPSE_CODE_POOL,
  ECHO_DECOY_POOL,
  ECHO_WORD_POOL,
  ENTITY_HOLD_SECONDS,
  FINAL_RITUAL_INPUT_SECONDS,
  FINAL_RITUAL_RUNE_COUNT,
  MIRROR_HOLD_SECONDS,
  RITUAL_INPUT_SECONDS,
  RITUAL_RUNE_COUNT,
  RITUAL_RUNE_POOL,
  RUNES,
  SILENCE_HOLD_SECONDS,
  SWARM_EYE_COUNT,
  SWARM_REAL_COUNT,
  SWARM_TIME_SECONDS,
  HOOK_COUNT,
  HOOK_REAL_COUNT,
  ABATTOIR_CODE_POOL,
  MEAT_MARK_POOL,
  MEATLOCK_COUNT,
} from '@/config/constants';

export interface RunConfig {
  seed: string;
  archiveMap: Record<string, string>;
  archiveOrder: string[];
  decoyRecordIds: string[];
  voidRecordId: string;
  voidCode: string;
  ritualSequence: string[];
  finalRiteSequence: string[];
  echoPhrase: string[];
  echoDecoys: string[];
  collapseCode: string;
  catacombMarks: string[];
  catacombDoors: string[];
  swarmRealIndices: number[];
  hookRealIndices: number[];
  abattoirCode: string;
  meatSequence: string[];
  corridorWalls: boolean[][];
  ritualInputSeconds: number;
  finalRiteInputSeconds: number;
  swarmTimeSeconds: number;
  silenceHoldSeconds: number;
  entityHoldSeconds: number;
  mirrorHoldSeconds: number;
}

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function pickN<T>(rng: () => number, arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(rng() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateRunConfig(seed: string): RunConfig {
  const rng = createRng(seed);
  const allIds = ARCHIVE_RECORD_META.map((r) => r.id);
  const fragmentIds = pickN(rng, allIds.filter((id) => id !== 'ZH-???'), RITUAL_RUNE_COUNT);
  const runes: string[] = pickN(rng, RITUAL_RUNE_POOL, RITUAL_RUNE_COUNT);

  const archiveMap: Record<string, string> = {};
  fragmentIds.forEach((id, i) => {
    archiveMap[id] = runes[i];
  });

  const unusedIds = allIds.filter((id) => !(id in archiveMap));
  const decoyRecordIds = pickN(rng, unusedIds.filter((id) => id !== 'ZH-???'), Math.min(2, unusedIds.length));

  const archiveOrder = shuffle(rng, allIds);

  const voidCandidates = fragmentIds.filter((id) => id.startsWith('ZH-6') || id.includes('666'));
  const voidRecordId = voidCandidates.length > 0
    ? voidCandidates[Math.floor(rng() * voidCandidates.length)]
    : fragmentIds[Math.floor(rng() * fragmentIds.length)];
  const voidCode = voidRecordId;

  const ritualSequence = shuffle(rng, [...runes]);
  const extraMarks = pickN(
    rng,
    [...CATACOMB_MARK_POOL].filter((m) => !runes.includes(m)),
    FINAL_RITUAL_RUNE_COUNT - RITUAL_RUNE_COUNT,
  );
  const finalRiteSequence = shuffle(rng, [...runes, ...extraMarks]);

  const echoPhrase: string[] = pickN(rng, ECHO_WORD_POOL, 4);
  const echoDecoys = pickN(
    rng,
    [...ECHO_DECOY_POOL].filter((w) => !echoPhrase.includes(w)),
    5,
  );

  const collapseCode = pickN(rng, COLLAPSE_CODE_POOL, 1)[0];

  const catacombMarks: string[] = pickN(rng, CATACOMB_MARK_POOL, 4);
  const doorDecoys = pickN(
    rng,
    [...RUNES].filter((r) => !catacombMarks.includes(r)),
    12 - catacombMarks.length,
  );
  const catacombDoors = shuffle(rng, [...catacombMarks, ...doorDecoys]);

  const eyeIndices = Array.from({ length: SWARM_EYE_COUNT }, (_, i) => i);
  const swarmRealIndices = pickN(rng, eyeIndices, SWARM_REAL_COUNT).sort((a, b) => a - b);

  const hookIndices = Array.from({ length: HOOK_COUNT }, (_, i) => i);
  const hookRealIndices = pickN(rng, hookIndices, HOOK_REAL_COUNT).sort((a, b) => a - b);

  const abattoirCode = pickN(rng, ABATTOIR_CODE_POOL, 1)[0];
  const meatSequence: string[] = shuffle(rng, pickN(rng, MEAT_MARK_POOL, MEATLOCK_COUNT));
  const corridorWalls = generateCorridorWalls(rng);

  return {
    seed,
    archiveMap,
    archiveOrder,
    decoyRecordIds,
    voidRecordId,
    voidCode,
    ritualSequence,
    finalRiteSequence,
    echoPhrase,
    echoDecoys,
    collapseCode,
    catacombMarks,
    catacombDoors,
    swarmRealIndices,
    hookRealIndices,
    abattoirCode,
    meatSequence,
    corridorWalls,
    ritualInputSeconds: RITUAL_INPUT_SECONDS,
    finalRiteInputSeconds: FINAL_RITUAL_INPUT_SECONDS,
    swarmTimeSeconds: SWARM_TIME_SECONDS,
    silenceHoldSeconds: SILENCE_HOLD_SECONDS,
    entityHoldSeconds: ENTITY_HOLD_SECONDS,
    mirrorHoldSeconds: MIRROR_HOLD_SECONDS,
  };
}

export function collapseHint(code: string): string {
  return code.split('').join(' · ');
}

/** Стены для змейки: true = стена */
function generateCorridorWalls(rng: () => number): boolean[][] {
  const size = 14;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) grid[y][x] = true;
      else if (rng() < 0.14) grid[y][x] = true;
    }
  }
  grid[1][1] = false;
  grid[1][2] = false;
  grid[2][1] = false;
  grid[size - 2][size - 2] = false;
  grid[size - 2][size - 3] = false;
  grid[size - 3][size - 2] = false;
  return grid;
}
