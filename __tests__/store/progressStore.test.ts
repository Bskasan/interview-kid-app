import { migrateProgress, PROGRESS_VERSION, useProgressStore } from '../../src/store/progressStore';

describe('progressStore — persisted per-lesson results', () => {
  beforeEach(() => {
    useProgressStore.setState({ results: {} });
  });

  it('creates a result entry for a lesson completed the first time', () => {
    useProgressStore.getState().recordResult('42', 2, 3);

    expect(useProgressStore.getState().results['42']).toEqual({
      best: 2,
      total: 3,
      badge: 'earned',
    });
  });

  // Best-result/badge policy itself is covered at the mergeResult layer; here we
  // only test what the store adds on top: keying, isolation and persistence shape.
  it('tracks results for different lessons independently', () => {
    const { recordResult } = useProgressStore.getState();
    recordResult('1', 3, 3);
    recordResult('2', 0, 3);

    const { results } = useProgressStore.getState();
    expect(results['1']?.badge).toBe('perfect');
    expect(results['2']?.badge).toBe('none');
  });

  // Pins today's semantics: an invalid total still creates a neutral entry
  // instead of throwing or storing a bogus badge.
  it('stores a neutral empty entry when an attempt reports an invalid total', () => {
    useProgressStore.getState().recordResult('42', 3, 0);

    expect(useProgressStore.getState().results['42']).toEqual({
      best: 0,
      total: 0,
      badge: 'none',
    });
  });

  it('persists only results under the versioned key, never the hydration flag', () => {
    const options = useProgressStore.persist.getOptions();

    expect(options.name).toBe('progress-v1');
    expect(options.version).toBe(PROGRESS_VERSION);
    const persisted = options.partialize?.(useProgressStore.getState());
    expect(Object.keys(persisted ?? {})).toEqual(['results']);
  });
});

describe('migrateProgress — v0 → v1 normalization', () => {
  it('keeps valid legacy records byte-identical', () => {
    const legacy = {
      results: {
        a: { best: 3, total: 3, badge: 'perfect' },
        b: { best: 1, total: 3, badge: 'none' },
      },
    };

    expect(migrateProgress(legacy, 0)).toEqual(legacy);
  });

  it('drops garbage entries and recomputes inconsistent badges', () => {
    const legacy = {
      results: {
        ok: { best: 2, total: 3, badge: 'earned' },
        wrongBadge: { best: 3, total: 3, badge: 'none' }, // stored badge lies
        inflated: { best: 99, total: 3, badge: 'perfect' },
        noTotal: { best: 2 },
        junk: 'not-a-record',
        alsoJunk: null,
      },
    };

    expect(migrateProgress(legacy, 0)).toEqual({
      results: {
        ok: { best: 2, total: 3, badge: 'earned' },
        wrongBadge: { best: 3, total: 3, badge: 'perfect' },
        inflated: { best: 3, total: 3, badge: 'perfect' },
      },
    });
  });

  it('turns a fully corrupt payload into an empty result set', () => {
    expect(migrateProgress(null, 0)).toEqual({ results: {} });
    expect(migrateProgress({ results: 'garbage' }, 0)).toEqual({ results: {} });
  });

  it('passes current-version payloads through untouched', () => {
    const current = { results: { a: { best: 1, total: 3, badge: 'none' } } };
    expect(migrateProgress(current, PROGRESS_VERSION)).toBe(current);
  });
});
