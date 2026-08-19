/* eslint-disable no-console -- The one sanctioned console site: every log in the
   app funnels through this module (enforced by the repo-wide no-console rule),
   so swapping in a crash reporter later is a one-file change. */

/**
 * Dev-only logger. In production builds both methods are no-ops: children never
 * benefit from console output, and the useful signal belongs in a crash
 * reporter, which is exactly what the hook points below are for.
 */
export const logger = {
  error(context: string, ...details: unknown[]): void {
    if (__DEV__) {
      console.error(`[${context}]`, ...details);
      return;
    }
    // hook point: forward to a crash reporter (e.g. Sentry.captureException).
  },
  warn(context: string, ...details: unknown[]): void {
    if (__DEV__) {
      console.warn(`[${context}]`, ...details);
      return;
    }
    // hook point: forward to a crash reporter as a breadcrumb.
  },
};
