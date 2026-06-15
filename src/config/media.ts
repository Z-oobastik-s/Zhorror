/** Пути к медиа относительно public/assets (пробелы в URL кодируются) */

const BASE = import.meta.env.BASE_URL;
const G = 'gif scream';
const I = 'Image';

/** Фон акта III */
export const ACT3_BG = `${I}/3 glava.png`;

/** Фон акта IV (мясник) */
export const ACT4_BG = `${I}/4 glava.png`;

/** Фон акта V (повешение) */
export const ACT5_BG = `${I}/5 glava.png`;

/** Пентаграмма для финального ритуала */
export const SATAN_CIRCLE = `${I}/satan.png`;

export function mediaUrl(relativePath: string): string {
  const encoded = relativePath.split('/').map((p) => encodeURIComponent(p)).join('/');
  return `${BASE}assets/${encoded}`;
}

export const SCREAM_GIFS = [
  `${G}/3O.gif`,
  `${G}/3YI.gif`,
  `${G}/4FZS.gif`,
  `${G}/4H.gif`,
  `${G}/4Zdy.gif`,
  `${G}/6GuV.gif`,
  `${G}/6Htn.gif`,
  `${G}/6Kn6.gif`,
  `${G}/6PTw.gif`,
  `${G}/6RDr.gif`,
  `${G}/76OA.gif`,
  `${G}/9hw9.gif`,
  `${G}/BbLb.gif`,
  `${G}/BCQz.gif`,
  `${G}/EiWL.gif`,
  `${G}/ENnM.gif`,
  `${G}/GHFp.gif`,
  `${G}/kgU.gif`,
  `${G}/ndT.gif`,
  `${G}/NvL.gif`,
  `${G}/PVnW.gif`,
  `${G}/QhxH.gif`,
  `${G}/RdsN.gif`,
  `${G}/RYsj.gif`,
  `${G}/SNmy.gif`,
  `${G}/TPZa.gif`,
  `${G}/TZcL.gif`,
  `${G}/V0sk.gif`,
  `${G}/VhkF.gif`,
  `${G}/WKL.gif`,
  `${G}/X1UD.gif`,
  `${G}/YWY2.gif`,
] as const;

/** Новые скримеры (21 шт.) */
export const SCREAM_GIFS_EXTRA = [
  `${G}/akari-enshiro-dead-account.gif`,
  `${G}/averageanatomy-tonio.gif`,
  `${G}/clown.gif`,
  `${G}/content-warning-ghost.gif`,
  `${G}/creepy-scary.gif`,
  `${G}/demon-evil.gif`,
  `${G}/fnaf-meme-mushroom.gif`,
  `${G}/foxy.gif`,
  `${G}/fun-house-gunther.gif`,
  `${G}/HfIF.gif`,
  `${G}/ndd.gif`,
  `${G}/nun-evil.gif`,
  `${G}/scary-girls.gif`,
  `${G}/scary-halloween.gif`,
  `${G}/scary-rabbit.gif`,
  `${G}/scary-rooms-low-detailed.gif`,
  `${G}/scary-scary-man.gif`,
  `${G}/screamer-creepy.gif`,
  `${G}/smile-creepy.gif`,
  `${G}/the-exorcist-regan.gif`,
  `${G}/vocaloid-creepy.gif`,
] as const;

/** Более жёсткие скримеры для акта III */
export const SCREAM_GIFS_ACT3 = [
  `${G}/4FZS.gif`,
  `${G}/4H.gif`,
  `${G}/6GuV.gif`,
  `${G}/6PTw.gif`,
  `${G}/PVnW.gif`,
  `${G}/QhxH.gif`,
  `${G}/SNmy.gif`,
  `${G}/TPZa.gif`,
  `${G}/X1UD.gif`,
  `${G}/BCQz.gif`,
  `${G}/ENnM.gif`,
  `${G}/BbLb.gif`,
  `${G}/ndT.gif`,
  `${G}/TZcL.gif`,
  `${G}/WKL.gif`,
  ...SCREAM_GIFS_EXTRA,
] as const;

/** Ещё жёстче для акта IV */
export const SCREAM_GIFS_ACT4 = [
  `${G}/4FZS.gif`,
  `${G}/6GuV.gif`,
  `${G}/6PTw.gif`,
  `${G}/PVnW.gif`,
  `${G}/QhxH.gif`,
  `${G}/SNmy.gif`,
  `${G}/X1UD.gif`,
  `${G}/BCQz.gif`,
  `${G}/ENnM.gif`,
  `${G}/BbLb.gif`,
  `${G}/ndT.gif`,
  `${G}/6Kn6.gif`,
  `${G}/9hw9.gif`,
  `${G}/VhkF.gif`,
  `${G}/GHFp.gif`,
  ...SCREAM_GIFS_EXTRA,
] as const;

/** Максимум для акта V */
export const SCREAM_GIFS_ACT5 = [
  `${G}/4FZS.gif`,
  `${G}/6GuV.gif`,
  `${G}/6PTw.gif`,
  `${G}/PVnW.gif`,
  `${G}/QhxH.gif`,
  `${G}/SNmy.gif`,
  `${G}/X1UD.gif`,
  `${G}/BCQz.gif`,
  `${G}/ENnM.gif`,
  `${G}/the-exorcist-regan.gif`,
  `${G}/screamer-creepy.gif`,
  `${G}/scary-scary-man.gif`,
  `${G}/nun-evil.gif`,
  `${G}/demon-evil.gif`,
  `${G}/creepy-scary.gif`,
  ...SCREAM_GIFS_EXTRA,
] as const;

/** Все уникальные GIF для прелоада */
export const SCREAM_GIFS_ALL: readonly string[] = [
  ...new Set([
    ...SCREAM_GIFS,
    ...SCREAM_GIFS_EXTRA,
    ...SCREAM_GIFS_ACT3,
    ...SCREAM_GIFS_ACT4,
    ...SCREAM_GIFS_ACT5,
  ]),
];

const S = 'sound';

export const AUDIO = {
  /** Фоновые лупы (>= 50 сек), только один одновременно */
  ambientLoops: [
    `${S}/Horror Background Atmosphere for Suspense.mp3`,
    `${S}/Dark Horror Pulsing Background.mp3`,
    `${S}/Horror Background Atmosphere.mp3`,
    `${S}/Low hum Bass Horror Movie Pad.mp3`,
  ],
  ambientLoopsAct3: [
    `${S}/Low Frequency Hum.mp3`,
    `${S}/Dark Horror Pulsing Background.mp3`,
    `${S}/Horror Background Atmosphere.mp3`,
  ],
  ambientLoopsAct4: [
    `${S}/Low Frequency Hum.mp3`,
    `${S}/Flesh Growing.mp3`,
    `${S}/Low hum, dark horror, recording.mp3`,
    `${S}/Sfx6 - Horror Suspense [Hiding - Heartbeat].mp3`,
  ],
  ambientLoopsAct5: [
    `${S}/Low Frequency Hum.mp3`,
    `${S}/Slow Heartbeat 100 BPM.mp3`,
    `${S}/The man is nervous, his heart is beating fast.mp3`,
    `${S}/Sfx6 - Horror Suspense [Hiding - Heartbeat].mp3`,
    `${S}/Whispers Ghost Horror Sound.mp3`,
  ],
  /** Длинные one-shot (> 12 сек), не накладываются */
  beds: [
    `${S}/Horror Piano 31 sec.mp3`,
    `${S}/imitaciya-fisgarmonii-na-zloveshchim-fortepiano_[Pro-Sound.org].mp3`,
    `${S}/Scary Music Box.mp3`,
    `${S}/The man is nervous, his heart is beating fast.mp3`,
    `${S}/twelve-clock_man-1976178740.mp3`,
  ],
  whispers: [
    `${S}/Whisper Nasty Horror .mp3`,
    `${S}/Whispers chuchottement 2.mp3`,
    `${S}/Whispers Creepy Female Ghost .mp3`,
    `${S}/Whispers Forest whisper.mp3`,
    `${S}/Whispers Ghost Horror Sound.mp3`,
    `${S}/Whispers Just a dream.mp3`,
    `${S}/Whistle of the Haunted Realm.mp3`,
  ],
  screams: [
    `${S}/evil-shreik-45560.mp3`,
    `${S}/Scream_creak_gerl.mp3`,
    `${S}/wolfy_sanic-soft-scream-gerl15981.mp3`,
    `${S}/scary.mp3`,
    `${S}/The sound of surprise.mp3`,
  ],
  impacts: [
    `${S}/mixkit-horror-impact-773.mp3`,
    `${S}/mixkit-hard-horror-hit-drum-565.mp3`,
    `${S}/mixkit-cinematic-whoosh-deep-impact-1143.mp3`,
    `${S}/GLASS Crack.mp3`,
    `${S}/Glass Breaking.mp3`,
    `${S}/Glass Shatter 7.mp3`,
    `${S}/Glass Shattering.mp3`,
    `${S}/glass peices dropping sound effect.mp3`,
  ],
  static: [
    `${S}/mixkit-broken-radio-frequency-signal-2563.mp3`,
    `${S}/mixkit-terror-radio-frequency-2566.mp3`,
  ],
  /** Средние события (5-20 сек), по одному */
  events: [
    `${S}/Dark Horror Entry.mp3`,
    `${S}/Earthquake Rumble & Cracking.mp3`,
    `${S}/Flesh Growing.mp3`,
    `${S}/Low hum of footsteps.mp3`,
    `${S}/Low hum, dark horror, recording.mp3`,
    `${S}/Sfx6 - Horror Suspense [Hiding - Heartbeat].mp3`,
    `${S}/Slow Heartbeat 100 BPM.mp3`,
    `${S}/sound of doors opening.mp3`,
  ],
  heartbeat: `${S}/mixkit-horror-deep-drum-heartbeat-559.mp3`,
  nervous: `${S}/The man is nervous, his heart is beating fast.mp3`,
  door: `${S}/sound of doors opening.mp3`,
  clock: `${S}/twelve-clock_man-1976178740.mp3`,
  piano: `${S}/imitaciya-fisgarmonii-na-zloveshchim-fortepiano_[Pro-Sound.org].mp3`,
  musicBox: `${S}/Scary Music Box.mp3`,
} as const;

export type ScareAudioKind = 'gif' | 'static' | 'eyes' | 'text';

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickScareGif(act: number, avoid?: string): string {
  let pool: readonly string[];
  if (act >= 5) {
    pool = Math.random() > 0.1
      ? [...SCREAM_GIFS_ACT5, ...SCREAM_GIFS_EXTRA]
      : [...SCREAM_GIFS_ACT4, ...SCREAM_GIFS_ACT3, ...SCREAM_GIFS_EXTRA];
  } else if (act >= 4) {
    pool = Math.random() > 0.15
      ? [...SCREAM_GIFS_ACT4, ...SCREAM_GIFS_EXTRA]
      : [...SCREAM_GIFS_ACT3, ...SCREAM_GIFS, ...SCREAM_GIFS_EXTRA];
  } else if (act >= 3) {
    pool = Math.random() > 0.25
      ? [...SCREAM_GIFS_ACT3, ...SCREAM_GIFS_EXTRA]
      : [...SCREAM_GIFS, ...SCREAM_GIFS_EXTRA];
  } else {
    pool = [...SCREAM_GIFS, ...SCREAM_GIFS_EXTRA];
  }

  if (pool.length === 0) return SCREAM_GIFS[0];
  if (!avoid || pool.length < 3) return pickRandom(pool);

  let pick = pickRandom(pool);
  for (let i = 0; i < 10 && pick === avoid; i++) {
    pick = pickRandom(pool);
  }
  return pick;
}
