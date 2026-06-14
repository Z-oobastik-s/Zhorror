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
} as const;

export type SceneId = (typeof SCENE_IDS)[keyof typeof SCENE_IDS];

export const SCENE_ORDER_ACT1: SceneId[] = [
  SCENE_IDS.hero,
  SCENE_IDS.archive,
  SCENE_IDS.entity,
  SCENE_IDS.ritual,
  SCENE_IDS.void,
];

export const SCENE_ORDER_ACT2: SceneId[] = [
  SCENE_IDS.abyss,
  SCENE_IDS.echo,
  SCENE_IDS.mirror,
  SCENE_IDS.collapse,
];

export const SCENE_ORDER: SceneId[] = [...SCENE_ORDER_ACT1, ...SCENE_ORDER_ACT2];

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

export const CHAPTERS = CHAPTERS_ACT1;

export const ARCHIVE_FRAGMENTS: Record<string, string> = {
  'ZH-001': 'ᛟ',
  'ZH-047': 'ᚦ',
  'ZH-112': '◈',
  'ZH-666': '⬡',
};

export const RITUAL_SEQUENCE = ['ᛟ', 'ᚦ', '◈', '⬡'] as const;

export const RITUAL_SHOW_SECONDS = 3;
export const RITUAL_INPUT_SECONDS = 14;

export const VOID_CODE = 'ZH-666';
export const COLLAPSE_CODE = 'ARCHIVE';

export const ENTITY_HOLD_SECONDS = 4;
export const MIRROR_HOLD_SECONDS = 6;

export const ECHO_PHRASE = ['они', 'зовут', 'тебя', 'вниз'] as const;

export const RUNES = ['ᛟ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᛞ', 'ᛉ', 'ᛊ', 'ᚹ', '◈', '⬡', '☍', '⟁', '⧫', '⌬', '⍟'] as const;

export const WHISPERS = [
  'он видит',
  'не закрывай',
  'ты остался',
  'они ждут',
  'слишком поздно',
  'не оглядывайся',
  'архив помнит',
  'Zhorror',
  'Zoobastiks',
] as const;
