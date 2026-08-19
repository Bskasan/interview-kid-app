import { paramNumber, paramString } from '../../src/utils/routeParams';

describe('routeParams — coercing untrusted route params', () => {
  it('passes strings through and defaults everything else to empty', () => {
    expect(paramString('42')).toBe('42');
    expect(paramString(undefined)).toBe('');
    expect(paramString(['a', 'b'])).toBe('');
  });

  it('parses numeric strings and defaults garbage to zero', () => {
    expect(paramNumber('3')).toBe(3);
    expect(paramNumber('garbage')).toBe(0);
    expect(paramNumber(undefined)).toBe(0);
    // Arrays are ambiguous (Number(['2']) would coerce) — rejected on purpose.
    expect(paramNumber(['2'])).toBe(0);
  });
});
