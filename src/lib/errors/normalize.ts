/**
 * Turns any thrown value into an AppError. An explicit code from the call site
 * wins (it knows what it was doing); otherwise a couple of well-known runtime
 * shapes are recognized, and everything else lands on the fallback.
 */
import { createAppError, isAppError, type AppError, type AppErrorCode } from './types';

export function normalizeError(cause: unknown, code?: AppErrorCode): AppError {
  if (isAppError(cause)) {
    return cause;
  }
  return createAppError(code ?? detectCode(cause), { cause });
}

function detectCode(cause: unknown): AppErrorCode {
  if (cause instanceof Error) {
    // fetch abort (our request timeout) — surfaces as a DOMException-like
    // object whose name survives even when the class doesn't exist on Hermes.
    if (cause.name === 'AbortError') {
      return 'NETWORK';
    }
    // fetch network failure — React Native rejects with exactly this TypeError.
    if (cause instanceof TypeError && /network request failed/i.test(cause.message)) {
      return 'NETWORK';
    }
  }
  return 'UNKNOWN';
}
