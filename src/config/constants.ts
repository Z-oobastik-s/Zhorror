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
