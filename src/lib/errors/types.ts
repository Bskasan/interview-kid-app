/**
 * The app's error vocabulary: the AppError shape every failure normalizes to,
 * its code → translated-message-key mapping, and the factory/guard around it.
 */
import type tr from '@/locales/tr.json';

export type AppErrorCode = 'NETWORK' | 'MEDIA' | 'STORAGE' | 'UNKNOWN';

/** Keys under the `errors` namespace that are user-facing messages. */
type ErrorMessageKey = Exclude<keyof (typeof tr)['errors'], 'ok'>;

/**
 * The app's normalized error shape. A plain object rather than an Error
 * subclass: `instanceof` is brittle across realms/minification, and a plain
 * object stores cleanly in zustand and asserts cleanly in tests. The child
 * only ever sees `userMessageKey` translated — never `cause`.
 */
export type AppError = {
  readonly kind: 'AppError';
  readonly code: AppErrorCode;
  readonly userMessageKey: ErrorMessageKey;
  /** Optional recovery action, surfaced as a "try again" button. */
  readonly retry?: () => void;
  /** The original thrown value — for the logger only, never for the UI. */
  readonly cause?: unknown;
};

const MESSAGE_KEY_BY_CODE: Record<AppErrorCode, ErrorMessageKey> = {
  NETWORK: 'network',
  MEDIA: 'media',
  STORAGE: 'storage',
  UNKNOWN: 'unknown',
};

export function createAppError(
  code: AppErrorCode,
  options: { cause?: unknown; retry?: () => void } = {},
): AppError {
  return {
    kind: 'AppError',
    code,
    userMessageKey: MESSAGE_KEY_BY_CODE[code],
    ...options,
  };
}

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' && value !== null && (value as { kind?: unknown }).kind === 'AppError'
  );
}
