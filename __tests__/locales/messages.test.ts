import i18n from '../../src/i18n';
import en from '../../src/locales/en.json';
import tr from '../../src/locales/tr.json';

/** Flattens a nested resource object into "ns.dot.path" → value entries. */
function flatten(node: unknown, prefix: string, into: Map<string, string>): Map<string, string> {
  if (typeof node === 'string') {
    into.set(prefix, node);
    return into;
  }
  if (typeof node === 'object' && node !== null) {
    for (const [key, value] of Object.entries(node)) {
      flatten(value, prefix === '' ? key : `${prefix}.${key}`, into);
    }
    return into;
  }
  throw new Error(`Unexpected non-string leaf at "${prefix}"`);
}

const placeholdersOf = (value: string): string[] =>
  [...value.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]!).sort();

const trFlat = flatten(tr, '', new Map());
const enFlat = flatten(en, '', new Map());

describe('locale resources — tr/en parity', () => {
  // A key present in one language but not the other would silently fall back at
  // runtime; this makes it a build failure instead.
  it('has identical key sets in both languages', () => {
    const trKeys = [...trFlat.keys()].sort();
    const enKeys = [...enFlat.keys()].sort();
    const missingInEn = trKeys.filter((key) => !enFlat.has(key));
    const missingInTr = enKeys.filter((key) => !trFlat.has(key));
    expect({ missingInEn, missingInTr }).toEqual({ missingInEn: [], missingInTr: [] });
  });

  it.each([
    ['tr', trFlat],
    ['en', enFlat],
  ])('has no empty values in %s', (_locale, flat) => {
    const empty = [...flat.entries()].filter(([, value]) => value.trim().length === 0);
    expect(empty).toEqual([]);
  });

  // The one plural pair must resolve through Intl.PluralRules in both languages
  // ("1 seconds left" would be the visible symptom of a broken plural setup).
  it('resolves the timer plural correctly per language', () => {
    const tEn = i18n.getFixedT('en', 'exercise');
    const tTr = i18n.getFixedT('tr', 'exercise');
    expect(tEn('timeLeft', { count: 1 })).toBe('1 second left');
    expect(tEn('timeLeft', { count: 12 })).toBe('12 seconds left');
    expect(tTr('timeLeft', { count: 1 })).toBe('Kalan süre 1 saniye');
    expect(tTr('timeLeft', { count: 12 })).toBe('Kalan süre 12 saniye');
  });

  // "Soru {{current}}/{{total}}" translated without {{total}} would render a
  // broken counter; interpolation slots must survive translation.
  it('keeps the same interpolation placeholders per key', () => {
    const mismatched = [...trFlat.entries()]
      .filter(([key]) => enFlat.has(key))
      .filter(
        ([key, value]) =>
          JSON.stringify(placeholdersOf(value)) !==
          JSON.stringify(placeholdersOf(enFlat.get(key)!)),
      )
      .map(([key]) => key);
    expect(mismatched).toEqual([]);
  });
});
