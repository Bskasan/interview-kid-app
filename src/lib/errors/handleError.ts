import { logger } from '@/lib/logger';
import { useErrorStore } from '@/store/errorStore';
import { normalizeError } from './normalize';
import type { AppError, AppErrorCode } from './types';

export type HandleErrorOptions = {
  /** Where it happened, for the log line — e.g. "query.lessons". */
  context: string;
  /**
   * "notify" (default) also shows the global banner. Use "silent" when the
   * screen already renders the failure (Home error state, video card, image
   * fallback) — logging still happens, the child is not told twice.
   */
  severity?: 'notify' | 'silent';
  /** Code to use when the cause isn't already an AppError. */
  code?: AppErrorCode;
  /** Recovery action; the banner renders it as a "try again" button. */
  retry?: () => void;
};

/**
 * The single funnel for every runtime failure: normalize → log (always) →
 * banner (unless silent). Returns the normalized error for callers that keep
 * their own failure UI.
 */
export function handleError(cause: unknown, options: HandleErrorOptions): AppError {
  const normalized = normalizeError(cause, options.code);
  const appError: AppError = options.retry ? { ...normalized, retry: options.retry } : normalized;

  logger.error(options.context, appError.code, appError.cause);

  if ((options.severity ?? 'notify') === 'notify') {
    useErrorStore.getState().show(appError);
  }
  return appError;
}
