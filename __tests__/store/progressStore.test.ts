import { useProgressStore } from '../../src/store/progressStore';

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
});
