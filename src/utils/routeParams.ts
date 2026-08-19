/**
 * Route params arrive as string | string[] | undefined (and as garbage on a
 * bad deep link); these coercions give screens one honest default each.
 */
export function paramString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function paramNumber(value: unknown): number {
  if (typeof value !== 'string') {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
