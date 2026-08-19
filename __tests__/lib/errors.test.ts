import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleError } from '../../src/lib/errors/handleError';
import { normalizeError } from '../../src/lib/errors/normalize';
import { createAppError, isAppError } from '../../src/lib/errors/types';
import { reportingStorage } from '../../src/lib/storage';
import { useErrorStore } from '../../src/store/errorStore';

// The logger prints through the dev console in jest; silence and observe it.
let consoleSpy: jest.SpyInstance;

beforeEach(() => {
  useErrorStore.setState({ current: null });
  consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('normalizeError — unknown values become AppError', () => {
  it('passes an existing AppError through unchanged', () => {
    const original = createAppError('MEDIA', { cause: 'x' });
    expect(normalizeError(original)).toBe(original);
    expect(normalizeError(original, 'NETWORK')).toBe(original); // code never overrides
  });

  it('recognizes a fetch timeout abort as NETWORK', () => {
    const abort = new Error('Aborted');
    abort.name = 'AbortError';
    expect(normalizeError(abort).code).toBe('NETWORK');
  });

  it("recognizes React Native's fetch failure TypeError as NETWORK", () => {
    expect(normalizeError(new TypeError('Network request failed')).code).toBe('NETWORK');
  });

  it('uses the explicit code for values it cannot classify', () => {
    expect(normalizeError(new Error('boom'), 'MEDIA').code).toBe('MEDIA');
    expect(normalizeError('string throw', 'STORAGE').code).toBe('STORAGE');
  });

  it('falls back to UNKNOWN and keeps the cause for the logger', () => {
    const cause = new Error('boom');
    const normalized = normalizeError(cause);
    expect(normalized.code).toBe('UNKNOWN');
    expect(normalized.userMessageKey).toBe('unknown');
    expect(normalized.cause).toBe(cause);
    expect(isAppError(normalized)).toBe(true);
  });
});

describe('handleError — the central funnel', () => {
  it('always logs, with the call-site context', () => {
    handleError(new Error('boom'), { context: 'test.context', severity: 'silent' });
    expect(consoleSpy).toHaveBeenCalledWith('[test.context]', 'UNKNOWN', expect.any(Error));
  });

  it('notifies the error store by default', () => {
    handleError(new Error('boom'), { context: 'test', code: 'NETWORK' });
    expect(useErrorStore.getState().current?.error.userMessageKey).toBe('network');
  });

  it('keeps silent errors out of the store but still logs them', () => {
    handleError(new Error('boom'), { context: 'test', severity: 'silent' });
    expect(useErrorStore.getState().current).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('attaches the retry action for the banner', () => {
    const retry = jest.fn();
    handleError(new Error('boom'), { context: 'test', retry });
    expect(useErrorStore.getState().current?.error.retry).toBe(retry);
  });

  it('replaces the current error instead of queueing', () => {
    handleError(new Error('first'), { context: 'test', code: 'NETWORK' });
    const firstId = useErrorStore.getState().current?.id;
    handleError(new Error('second'), { context: 'test', code: 'STORAGE' });
    const current = useErrorStore.getState().current;
    expect(current?.error.userMessageKey).toBe('storage');
    expect(current?.id).not.toBe(firstId);
  });
});

describe('reportingStorage — AsyncStorage with failure reporting', () => {
  it('degrades a failed read to "no data" without a banner', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));
    await expect(reportingStorage.getItem('progress-v1')).resolves.toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    expect(useErrorStore.getState().current).toBeNull();
  });

  it('reports a failed write with a banner (STORAGE message)', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await expect(reportingStorage.setItem('progress-v1', '{}')).resolves.toBeUndefined();
    expect(useErrorStore.getState().current?.error.userMessageKey).toBe('storage');
  });

  it('passes successful reads and writes through', async () => {
    await reportingStorage.setItem('k', 'v');
    await expect(reportingStorage.getItem('k')).resolves.toBe('v');
    expect(useErrorStore.getState().current).toBeNull();
  });
});
