import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const soundDir = path.join(root, '..', 'assets', 'sound');

function estimateMp3Duration(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 128) return 0;

  let offset = 0;
  if (buf.toString('ascii', 0, 3) === 'ID3') {
    const size =
      ((buf[6] & 0x7f) << 21) |
      ((buf[7] & 0x7f) << 14) |
      ((buf[8] & 0x7f) << 7) |
      (buf[9] & 0x7f);
    offset = 10 + size;
  }

  let duration = 0;
  let i = offset;
  while (i < buf.length - 4) {
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
      const version = (buf[i + 1] >> 3) & 3;
      const bitrateIndex = (buf[i + 2] >> 4) & 0x0f;
      const sampleRateIndex = (buf[i + 2] >> 2) & 3;
      const padding = (buf[i + 2] >> 1) & 1;
      const sampleRates = version === 3 ? [44100, 48000, 32000, 0] : [22050, 24000, 16000, 0];
      const bitrates =
        version === 3
          ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
          : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
      const sampleRate = sampleRates[sampleRateIndex] || 44100;
      const bitrate = bitrates[bitrateIndex] * 1000;
      if (bitrate > 0 && sampleRate > 0) {
        const frameSize = Math.floor((144 * bitrate) / sampleRate) + padding;
        if (frameSize > 0) {
          duration += (1152 / sampleRate) * (1 + padding);
          i += frameSize;
          continue;
        }
      }
    }
    i += 1;
  }
  return Math.round(duration * 10) / 10;
}

const files = fs.readdirSync(soundDir).filter((f) => f.endsWith('.mp3')).sort();
const entries = [];

for (const file of files) {
  const full = path.join(soundDir, file);
  const duration = estimateMp3Duration(full);
  entries.push({ file, duration });
  console.log(`${String(duration).padStart(7)}s  ${file}`);
}

const outPath = path.join(root, '..', 'src', 'config', 'audioMeta.ts');
const lines = [
  '/** Сгенерировано scripts/probe-audio.mjs - не редактировать вручную */',
  'export const AUDIO_DURATIONS: Record<string, number> = {',
  ...entries.map((e) => `  ${JSON.stringify(e.file)}: ${e.duration},`),
  '};',
  '',
  'export type AudioSlot = \'ambient\' | \'bed\' | \'sfx\' | \'scare\';',
  '',
  'export function getDuration(file: string): number {',
  '  return AUDIO_DURATIONS[file] ?? 3;',
  '}',
  '',
  'export function isLongTrack(file: string): boolean {',
  '  return getDuration(file) >= 12;',
  '}',
  '',
  'export function isMediumTrack(file: string): boolean {',
  '  const d = getDuration(file);',
  '  return d >= 5 && d < 12;',
  '}',
  '',
];

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`\n[probe-audio] wrote ${outPath}`);
