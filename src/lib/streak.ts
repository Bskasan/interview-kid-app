/**
 * Pure day-streak rules: local calendar dates only, same-day idempotence,
 * +1 on consecutive days, reset on a gap, unchanged on a clock rollback.
 * The store applies these; this module never touches persistence or time.
 */

export type StreakRecord = {
  /** Local calendar date ('YYYY-MM-DD') of the last counted open; null = never. */
  lastOpenDate: string | null;
  count: number;
};

/**
 * The device's local calendar date. Local, not UTC: "streak day" must roll at
 * the child's midnight, not at 02:00 or 21:00 depending on timezone.
 */
export function localTodayISO(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Calendar-day difference b − a. UTC epoch math on date parts is DST-proof. */
function dayDiff(a: string, b: string): number | null {
  const pa = parseISODate(a);
  const pb = parseISODate(b);
  if (!pa || !pb) {
    return null;
  }
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return (Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / MS_PER_DAY;
}

function parseISODate(text: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    return null;
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Applies one app-open to the streak. Same day → the SAME object back
 * (callers can skip a persist write on identity); yesterday → +1; a gap →
 * back to 1; today before the stored date (clock rolled back) → unchanged, so
 * a device-time hiccup can't wipe an earned streak. A corrupt stored date
 * restarts at 1.
 */
export function nextStreak(prev: StreakRecord, todayISO: string): StreakRecord {
  if (parseISODate(todayISO) === null) {
    return prev;
  }
  if (prev.lastOpenDate === null) {
    return { lastOpenDate: todayISO, count: 1 };
  }
  const diff = dayDiff(prev.lastOpenDate, todayISO);
  if (diff === null) {
    return { lastOpenDate: todayISO, count: 1 };
  }
  if (diff === 0 || diff < 0) {
    return prev;
  }
  return { lastOpenDate: todayISO, count: diff === 1 ? prev.count + 1 : 1 };
}
