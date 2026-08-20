import i18n from '../../src/i18n';
import en from '../../src/locales/en.json';
import tr from '../../src/locales/tr.json';

// The project ships without @types/node on purpose (Node globals must not
// bleed into React Native code), so the two Node touchpoints the raw-source
// test needs are declared locally instead.
declare const require: (id: string) => unknown;
declare const __dirname: string;

const { readFileSync } = require('fs') as {
  readFileSync: (filePath: string, encoding: 'utf8') => string;
};

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

/**
 * Every key path in the raw JSON source. JSON.parse silently keeps only the
 * last of two duplicate keys, so duplicates must be caught in the text. The
 * locale files are nested objects of strings (no arrays), which keeps the
 * walk simple: a string followed by ":" is a key, braces track nesting, and
 * interpolation braces never leak in because strings are consumed whole.
 */
function keyPathsInSource(source: string): string[] {
  const paths: string[] = [];
  const stack: string[] = [];
  let pendingKey: string | null = null;
  let index = 0;
  while (index < source.length) {
    const char = source[index]!;
    if (char === '"') {
      let end = index + 1;
      while (source[end] !== '"' || source[end - 1] === '\\') {
        end += 1;
      }
      const text = source.slice(index + 1, end);
      if (/^\s*:/.test(source.slice(end + 1))) {
        pendingKey = text;
        paths.push([...stack.filter((segment) => segment !== ''), text].join('.'));
      }
      index = end + 1;
      continue;
    }
    if (char === '{') {
      stack.push(pendingKey ?? '');
      pendingKey = null;
    } else if (char === '}') {
      stack.pop();
    }
    index += 1;
  }
  return paths;
}

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

  it.each([['tr'], ['en']])('has no duplicate keys in the %s source', (locale) => {
    const source = readFileSync(`${__dirname}/../../src/locales/${locale}.json`, 'utf8');
    const paths = keyPathsInSource(source);
    // Scanner sanity: a broken walker returning nothing must not pass green.
    expect(paths).toContain('common.retry');

    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const path of paths) {
      if (seen.has(path)) {
        duplicates.push(path);
      }
      seen.add(path);
    }
    expect(duplicates).toEqual([]);
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
