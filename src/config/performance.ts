export type PerfTier = 'high' | 'low';

export function detectPerfTier(): PerfTier {
  const mobile = 'ontouchstart' in window || window.innerWidth < 768;
  const lowCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const lowMemory = typeof memory === 'number' && memory <= 4;

  if (mobile || lowCores || lowMemory) return 'low';
  return 'high';
}

export function getMaxDpr(tier: PerfTier): number {
  return tier === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
}
