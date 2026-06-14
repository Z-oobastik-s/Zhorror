/** Пути к медиа относительно public/assets (пробелы в URL кодируются) */

const BASE = import.meta.env.BASE_URL;

export function mediaUrl(relativePath: string): string {
  const encoded = relativePath.split('/').map((p) => encodeURIComponent(p)).join('/');
  return `${BASE}assets/${encoded}`;
}

export const SCREAM_GIFS = [
  'gif scream/6Htn.gif',
  'gif scream/6RDr.gif',
  'gif scream/EiWL.gif',
  'gif scream/GHFp.gif',
  'gif scream/RdsN.gif',
] as const;

export const AUDIO = {
  ambient: [
    'sound/Horror Background Atmosphere for Suspense.mp3',
    'sound/Dark Horror Pulsing Background.mp3',
  ],
  musicBox: 'sound/Scary Music Box.mp3',
  piano: 'sound/imitaciya-fisgarmonii-na-zloveshchim-fortepiano_[Pro-Sound.org].mp3',

  screams: [
    'sound/evil-shreik-45560.mp3',
    'sound/Scream_creak_gerl.mp3',
    'sound/wolfy_sanic-soft-scream-gerl15981.mp3',
    'sound/scary.mp3',
    'sound/The sound of surprise.mp3',
  ],

  impacts: [
    'sound/mixkit-horror-impact-773.mp3',
    'sound/mixkit-hard-horror-hit-drum-565.mp3',
    'sound/mixkit-cinematic-whoosh-deep-impact-1143.mp3',
  ],

  static: [
    'sound/mixkit-broken-radio-frequency-signal-2563.mp3',
    'sound/mixkit-terror-radio-frequency-2566.mp3',
  ],

  heartbeat: 'sound/mixkit-horror-deep-drum-heartbeat-559.mp3',
  nervous: 'sound/The man is nervous, his heart is beating fast.mp3',
  door: 'sound/sound of doors opening.mp3',
  clock: 'sound/twelve-clock_man-1976178740.mp3',
} as const;

export type ScareAudioKind = 'gif' | 'static' | 'eyes' | 'text';

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
