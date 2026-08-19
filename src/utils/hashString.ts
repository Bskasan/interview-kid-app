/**
 * Stable 32-bit unsigned hash (31-multiplier). Not cryptographic — used to map
 * strings to array slots deterministically (same input, same slot, forever).
 */
export function hashString(text: string): number {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}
