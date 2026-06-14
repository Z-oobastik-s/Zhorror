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
} as const;

export type SceneId = (typeof SCENE_IDS)[keyof typeof SCENE_IDS];

export const SCENE_ORDER: SceneId[] = [
  SCENE_IDS.hero,
  SCENE_IDS.archive,
  SCENE_IDS.entity,
  SCENE_IDS.ritual,
  SCENE_IDS.void,
];

export const CHAPTERS = [
  { index: 0, scene: SCENE_IDS.hero, title: 'Порог', objective: 'Нажми «войти в архив»' },
  { index: 1, scene: SCENE_IDS.archive, title: 'Архив', objective: 'Открой записи и собери 4 метки' },
  { index: 2, scene: SCENE_IDS.entity, title: 'Наблюдение', objective: 'Застыть на 4 секунды, пока оно смотрит' },
  { index: 3, scene: SCENE_IDS.ritual, title: 'Ритуал', objective: 'Повтори последовательность символов' },
  { index: 4, scene: SCENE_IDS.void, title: 'Пустота', objective: 'Введи запретный код архива' },
] as const;

export const ARCHIVE_FRAGMENTS: Record<string, string> = {
  'ZH-001': 'ᛟ',
  'ZH-047': 'ᚦ',
  'ZH-112': '◈',
  'ZH-666': '⬡',
};

export const RITUAL_SEQUENCE = ['ᛟ', 'ᚦ', '◈', '⬡'] as const;

export const VOID_CODE = 'ZH-666';

export const ENTITY_HOLD_SECONDS = 4;

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
