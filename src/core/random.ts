/**
 * Mulberry32 32-bit seeded pseudo-random number generator.
 * Produces uniform float in [0, 1).
 */
export function createMulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts any number or string seed into a 32-bit unsigned integer seed.
 */
export function hashSeed(seed: string | number): number {
  if (typeof seed === 'number') {
    return Math.floor(Math.abs(seed)) >>> 0;
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) >>> 0;
}

/**
 * Generates a random number in [min, max) using the given rng.
 */
export function randomRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

/**
 * Picks an item from an array with specified relative weights.
 */
export function weightedPick<T>(items: T[], weights: number[], rng: () => number): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  if (items.length === 1) return items[0];

  let totalWeight = 0;
  for (const w of weights) {
    totalWeight += Math.max(0, w);
  }

  if (totalWeight <= 0) {
    const idx = Math.floor(rng() * items.length);
    return items[idx];
  }

  let threshold = rng() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    const w = Math.max(0, weights[i]);
    if (threshold < w) {
      return items[i];
    }
    threshold -= w;
  }

  return items[items.length - 1];
}
