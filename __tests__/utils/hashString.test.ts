import { hashString } from '../../src/utils/hashString';

describe('hashString', () => {
  it('is deterministic', () => {
    for (const input of ['', '10', 'abc', '🦊']) {
      expect(hashString(input)).toBe(hashString(input));
    }
  });

  it('stays a 32-bit unsigned integer even for long input', () => {
    const hash = hashString('very-long-id-with-dashes-123456789'.repeat(10));
    expect(Number.isInteger(hash)).toBe(true);
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(0xffffffff);
  });

  it('spreads nearby inputs to different slots', () => {
    const slots = new Set(Array.from({ length: 30 }, (_, i) => hashString(String(i)) % 5));
    expect(slots.size).toBe(5);
  });
});
