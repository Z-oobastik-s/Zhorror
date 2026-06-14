export const COLORS = {
  void: '#050505',
  abyss: '#0a0a0a',
  charcoal: '#141414',
  ash: '#1a1a1a',
  smoke: '#2a2a2a',
  bone: '#8a8580',
  faded: '#6b6560',
  blood: '#3a1515',
  crimson: '#5c1a1a',
  rust: '#4a2020',
  plague: '#1a2a1a',
  rot: '#2a3a20',
  curse: '#1a1530',
  violet: '#2a1a3a',
  whisper: '#3a2a4a',
} as const;

export const FONTS = {
  display: '"Cormorant Garamond", "Times New Roman", serif',
  body: '"IBM Plex Mono", "Courier New", monospace',
  rune: '"Segoe UI Symbol", sans-serif',
} as const;

export const BRAND = {
  name: 'Zhorror',
  author: 'Zoobastiks',
  tagline: 'Архив, который не должен существовать',
} as const;

export const SCENE_IDS = {
  hero: 'hero',
  archive: 'archive',
  entity: 'entity',
  ritual: 'ritual',
  void: 'void',
  abyss: 'abyss',
  echo: 'echo',
  mirror: 'mirror',
  collapse: 'collapse',
  gate3: 'gate3',
  catacombs: 'catacombs',
  swarm: 'swarm',
  silence: 'silence',
  finalrite: 'finalrite',
  terminus: 'terminus',
  gate4: 'gate4',
  hooks: 'hooks',
  butcher: 'butcher',
  corridor: 'corridor',
  meatlock: 'meatlock',
  abattoir: 'abattoir',
} as const;

export type SceneId = (typeof SCENE_IDS)[keyof typeof SCENE_IDS];

export const SCENE_ORDER_ACT1: SceneId[] = [
  SCENE_IDS.hero, SCENE_IDS.archive, SCENE_IDS.entity, SCENE_IDS.ritual, SCENE_IDS.void,
];

export const SCENE_ORDER_ACT2: SceneId[] = [
  SCENE_IDS.abyss, SCENE_IDS.echo, SCENE_IDS.mirror, SCENE_IDS.collapse,
];

export const SCENE_ORDER_ACT3: SceneId[] = [
  SCENE_IDS.gate3, SCENE_IDS.catacombs, SCENE_IDS.swarm, SCENE_IDS.silence, SCENE_IDS.finalrite, SCENE_IDS.terminus,
];

export const SCENE_ORDER_ACT4: SceneId[] = [
  SCENE_IDS.gate4, SCENE_IDS.hooks, SCENE_IDS.butcher, SCENE_IDS.corridor, SCENE_IDS.meatlock, SCENE_IDS.abattoir,
];

export const SCENE_ORDER: SceneId[] = [...SCENE_ORDER_ACT1, ...SCENE_ORDER_ACT2, ...SCENE_ORDER_ACT3, ...SCENE_ORDER_ACT4];

export const CHAPTERS_ACT1 = [
  { act: 1 as const, index: 0, scene: SCENE_IDS.hero, title: 'Порог', objective: 'Нажми «войти в архив»' },
  { act: 1 as const, index: 1, scene: SCENE_IDS.archive, title: 'Архив', objective: 'Открой записи и собери 4 метки' },
  { act: 1 as const, index: 2, scene: SCENE_IDS.entity, title: 'Наблюдение', objective: 'Застыть на 4 секунды, пока оно смотрит' },
  { act: 1 as const, index: 3, scene: SCENE_IDS.ritual, title: 'Ритуал', objective: 'Запомни символы и повтори их на время' },
  { act: 1 as const, index: 4, scene: SCENE_IDS.void, title: 'Пустота', objective: 'Введи код запретной записи из архива' },
] as const;

export const CHAPTERS_ACT2 = [
  { act: 2 as const, index: 0, scene: SCENE_IDS.abyss, title: 'Бездна', objective: 'Спустись в нижний слой архива' },
  { act: 2 as const, index: 1, scene: SCENE_IDS.echo, title: 'Эхо', objective: 'Собери фразу из шёпотов по порядку' },
  { act: 2 as const, index: 2, scene: SCENE_IDS.mirror, title: 'Зеркало', objective: 'Выдержи 6 секунд без движения' },
  { act: 2 as const, index: 3, scene: SCENE_IDS.collapse, title: 'Коллапс', objective: 'Введи слово ARCHIVE' },
] as const;

export const CHAPTERS_ACT3 = [
  { act: 3 as const, index: 0, scene: SCENE_IDS.gate3, title: 'Ядро', objective: 'Войди в третий слой архива' },
  { act: 3 as const, index: 1, scene: SCENE_IDS.catacombs, title: 'Катакомбы', objective: 'Открой 4 верных двери с метками' },
  { act: 3 as const, index: 2, scene: SCENE_IDS.swarm, title: 'Рой', objective: 'Найди 6 настоящих глаз за 25 секунд' },
  { act: 3 as const, index: 3, scene: SCENE_IDS.silence, title: 'Тишина', objective: 'Застыть на 8 секунд в абсолютной тишине' },
  { act: 3 as const, index: 4, scene: SCENE_IDS.finalrite, title: 'Финальный ритуал', objective: 'Повтори 6 символов. Подсказка остаётся на экране' },
  { act: 3 as const, index: 5, scene: SCENE_IDS.terminus, title: 'Терминус', objective: 'Назови автора архива' },
] as const;

export const CHAPTERS_ACT4 = [
  { act: 4 as const, index: 0, scene: SCENE_IDS.gate4, title: 'Тесак', objective: 'Войди в зал мясника' },
  { act: 4 as const, index: 1, scene: SCENE_IDS.hooks, title: 'Крючья', objective: 'Найди 4 крючья с добычей' },
  { act: 4 as const, index: 2, scene: SCENE_IDS.butcher, title: 'Мясник', objective: 'Выиграй у мясника в крестики-нолики' },
  { act: 4 as const, index: 3, scene: SCENE_IDS.corridor, title: 'Коридор', objective: 'Собери 10 кусков. Прогресс сохраняется после столкновения' },
  { act: 4 as const, index: 4, scene: SCENE_IDS.meatlock, title: 'Запечатано', objective: 'Повтори метки мясника за 8 секунд' },
  { act: 4 as const, index: 5, scene: SCENE_IDS.abattoir, title: 'Бойня', objective: 'Введи код, который оставил мясник' },
] as const;

export const CHAPTERS = CHAPTERS_ACT1;

/** Статичная карта для обратной совместимости (логика квеста берёт RunConfig) */
export const ARCHIVE_FRAGMENTS: Record<string, string> = {
  'ZH-001': 'ᛟ', 'ZH-047': 'ᚦ', 'ZH-112': '◈', 'ZH-666': '⬡',
};

export const ARCHIVE_RECORD_META = [
  { id: 'ZH-001', title: 'Первая запись', text: 'Архив был открыт по ошибке. Никто не должен был найти эти файлы.', secret: 'Запись помечена: наблюдение активно.' },
  { id: 'ZH-047', title: 'След наблюдателя', text: 'Каждый, кто читает это, уже отмечен.', secret: 'IP не существует. Существуете вы.' },
  { id: 'ZH-112', title: 'Цифровой культ', text: 'Zhorror не проект. Это ритуал.', secret: 'Zoobastiks не создал архив. Архив создал Zoobastiks.' },
  { id: 'ZH-204', title: 'Ложный след', text: 'Здесь ничего нет. Или ты слишком рано поверил.', secret: 'не каждая метка настоящая.' },
  { id: 'ZH-319', title: 'Обратный отсчёт', text: 'Слои архива ссылаются друг на друга.', secret: 'ключ не там, где кажется.' },
  { id: 'ZH-666', title: 'Запретный фрагмент', text: 'Текст повреждён. Символы стёрты.', secret: 'НЕ ОТКРЫВАЙ. ...слишком поздно.' },
  { id: 'ZH-???', title: 'Пустая запись', text: '...', secret: 'ты здесь один? проверь за спиной.' },
] as const;

export const CATACOMB_MARKS = ['☍', '⟁', '⧫', '⌬'] as const;
export const CATACOMB_MARK_POOL = ['☍', '⟁', '⧫', '⌬', '⍟', '◈', '⬡', 'ᛟ'] as const;

export const RITUAL_RUNE_POOL = ['ᛟ', 'ᚦ', '◈', '⬡', '☍', '⟁', '⧫', '⌬'] as const;
export const RITUAL_RUNE_COUNT = 4;
export const FINAL_RITUAL_RUNE_COUNT = 6;

export const RITUAL_SEQUENCE = ['ᛟ', 'ᚦ', '◈', '⬡'] as const;
export const FINAL_RITUAL_SEQUENCE = ['ᛟ', 'ᚦ', '◈', '⬡', '☍', '⟁'] as const;

export const COLLAPSE_CODE_POOL = ['ARCHIVE', 'ABYSS', 'HOLLOW', 'STATIC', 'CORRUPT', 'DEEPER', 'SHARD', 'VOIDED'] as const;

export const ECHO_WORD_POOL = [
  'они', 'зовут', 'тебя', 'вниз', 'тень', 'зовёт', 'тьму', 'глубже',
  'архив', 'должны', 'идти', 'сюда', 'слушай', 'ближе', 'тише',
] as const;

export const ECHO_DECOY_POOL = [
  'слушай', 'ближе', 'глубже', 'тише', 'дальше', 'здесь', 'позже', 'снова', 'никогда',
] as const;

export const RITUAL_SHOW_SECONDS = 3;
export const RITUAL_INPUT_SECONDS = 14;
export const FINAL_RITUAL_SHOW_SECONDS = 4;
export const FINAL_RITUAL_INPUT_SECONDS = 18;

export const VOID_CODE = 'ZH-666';
export const COLLAPSE_CODE = 'ARCHIVE';
export const TERMINUS_CODE = 'ZOOBASTIKS';

export const ENTITY_HOLD_SECONDS = 4;
export const MIRROR_HOLD_SECONDS = 6;
export const SILENCE_HOLD_SECONDS = 8;
export const SWARM_TIME_SECONDS = 25;
export const SWARM_EYE_COUNT = 12;
export const SWARM_REAL_COUNT = 6;
export const SWARM_REAL_INDICES = [0, 2, 3, 5, 8, 10] as const;

export const ECHO_PHRASE = ['они', 'зовут', 'тебя', 'вниз'] as const;

export const RITUAL_CIRCLE_RUNES = ['ᛟ', 'ᚦ', '◈', '⬡', '☍', '⟁', '⧫', '⌬', 'ᚨ', 'ᚱ'] as const;

export const RUNES = ['ᛟ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᛞ', 'ᛉ', 'ᛊ', 'ᚹ', '◈', '⬡', '☍', '⟁', '⧫', '⌬', '⍟'] as const;

export const WHISPERS = [
  'он видит', 'не закрывай', 'ты остался', 'они ждут', 'слишком поздно',
  'не оглядывайся', 'архив помнит', 'Zhorror', 'Zoobastiks',
  'мясник близко', 'крючья помнят', 'ты - добыча',
] as const;

export const HOOK_COUNT = 8;
export const HOOK_REAL_COUNT = 4;
export const ABATTOIR_CODE_POOL = ['BUTCHER', 'MEATHOOK', 'ABATTOIR', 'CLEAVER', 'SKINNER', 'CARCASS'] as const;
export const MEAT_MARK_POOL = ['☠', '⚒', '⧫', '⌬', '◈', '⬡', '☍', '⟁'] as const;
export const MEATLOCK_COUNT = 4;
export const MEATLOCK_SHOW_SECONDS = 2;
export const MEATLOCK_INPUT_SECONDS = 8;
export const CORRIDOR_GOAL = 10;
export const CORRIDOR_GRID = 14;
