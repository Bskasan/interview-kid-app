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

  it('keeps the higher score when a retake performs worse', () => {
    const { recordResult } = useProgressStore.getState();
    recordResult('42', 3, 3);
    recordResult('42', 1, 3);

    expect(useProgressStore.getState().results['42']).toEqual({
      best: 3,
      total: 3,
      badge: 'perfect',
    });
  });

  it('upgrades the badge when a retake performs better', () => {
    const { recordResult } = useProgressStore.getState();
    recordResult('42', 1, 3);
    recordResult('42', 2, 3);

    expect(useProgressStore.getState().results['42']?.badge).toBe('earned');
  });

  it('tracks results for different lessons independently', () => {
    const { recordResult } = useProgressStore.getState();
    recordResult('1', 3, 3);
    recordResult('2', 0, 3);

    const { results } = useProgressStore.getState();
    expect(results['1']?.badge).toBe('perfect');
    expect(results['2']?.badge).toBe('none');
  });
});
