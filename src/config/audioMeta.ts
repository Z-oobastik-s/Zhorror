/** Сгенерировано scripts/probe-audio.mjs - не редактировать вручную */
export const AUDIO_DURATIONS: Record<string, number> = {
  "Dark Horror Entry.mp3": 8.1,
  "Dark Horror Pulsing Background.mp3": 116.4,
  "Earthquake Rumble & Cracking.mp3": 13.6,
  "Flesh Growing.mp3": 6.1,
  "GLASS Crack.mp3": 1.8,
  "Glass Breaking.mp3": 2.1,
  "Glass Shatter 7.mp3": 2.8,
  "Glass Shattering.mp3": 4,
  "Horror Background Atmosphere for Suspense.mp3": 110.3,
  "Horror Background Atmosphere.mp3": 125.1,
  "Horror Piano 31 sec.mp3": 60.5,
  "Low Frequency Hum.mp3": 30,
  "Low hum Bass Horror Movie Pad.mp3": 53.8,
  "Low hum of footsteps.mp3": 5.1,
  "Low hum, dark horror, recording.mp3": 8.1,
  "Scary Music Box.mp3": 70.3,
  "Scream_creak_gerl.mp3": 6,
  "Sfx6 - Horror Suspense [Hiding - Heartbeat].mp3": 16,
  "Slow Heartbeat 100 BPM.mp3": 18.5,
  "The man is nervous, his heart is beating fast.mp3": 63.3,
  "The sound of surprise.mp3": 6.8,
  "Whisper Nasty Horror .mp3": 10.9,
  "Whispers Creepy Female Ghost .mp3": 16.2,
  "Whispers Forest whisper.mp3": 8.5,
  "Whispers Ghost Horror Sound.mp3": 4,
  "Whispers Just a dream.mp3": 5.7,
  "Whispers chuchottement 2.mp3": 19.2,
  "Whistle of the Haunted Realm.mp3": 18.5,
  "evil-shreik-45560.mp3": 3.9,
  "glass peices dropping sound effect.mp3": 7.1,
  "imitaciya-fisgarmonii-na-zloveshchim-fortepiano_[Pro-Sound.org].mp3": 68.8,
  "mixkit-broken-radio-frequency-signal-2563.mp3": 6.2,
  "mixkit-cinematic-whoosh-deep-impact-1143.mp3": 7.7,
  "mixkit-hard-horror-hit-drum-565.mp3": 4.2,
  "mixkit-horror-deep-drum-heartbeat-559.mp3": 4.4,
  "mixkit-horror-impact-773.mp3": 2.7,
  "mixkit-terror-radio-frequency-2566.mp3": 25.8,
  "scary.mp3": 7.5,
  "sound of doors opening.mp3": 26.4,
  "twelve-clock_man-1976178740.mp3": 23.4,
  "wolfy_sanic-soft-scream-gerl15981.mp3": 4.2,
};

export type AudioSlot = 'ambient' | 'bed' | 'sfx' | 'scare';

export function getDuration(file: string): number {
  return AUDIO_DURATIONS[file] ?? 3;
}

export function isLongTrack(file: string): boolean {
  return getDuration(file) >= 12;
}

export function isMediumTrack(file: string): boolean {
  const d = getDuration(file);
  return d >= 5 && d < 12;
}
