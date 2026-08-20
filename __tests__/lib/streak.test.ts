import { localTodayISO, nextStreak, type StreakRecord } from '../../src/lib/streak';

const rec = (lastOpenDate: string | null, count: number): StreakRecord => ({
  lastOpenDate,
  count,
});

describe('nextStreak — day-boundary rules', () => {
  it('starts a first-ever open at 1', () => {
    expect(nextStreak(rec(null, 0), '2026-08-20')).toEqual(rec('2026-08-20', 1));
  });

  it('returns the SAME object for a second open on the same day', () => {
    const prev = rec('2026-08-20', 3);
    // Identity, not just equality: the store skips the persist write on it.
    expect(nextStreak(prev, '2026-08-20')).toBe(prev);
  });

  it('increments on the next consecutive day', () => {
    expect(nextStreak(rec('2026-08-20', 3), '2026-08-21')).toEqual(rec('2026-08-21', 4));
  });

  it('resets to 1 after a gap', () => {
    expect(nextStreak(rec('2026-08-20', 7), '2026-08-23')).toEqual(rec('2026-08-23', 1));
  });

  it('spans a month boundary as consecutive', () => {
    expect(nextStreak(rec('2026-08-31', 2), '2026-09-01')).toEqual(rec('2026-09-01', 3));
    expect(nextStreak(rec('2026-02-28', 1), '2026-03-01')).toEqual(rec('2026-03-01', 2)); // non-leap
  });

  it('spans a year boundary as consecutive', () => {
    expect(nextStreak(rec('2026-12-31', 9), '2027-01-01')).toEqual(rec('2027-01-01', 10));
  });

  it('keeps the streak untouched when the clock rolls backwards', () => {
    const prev = rec('2026-08-20', 5);
    expect(nextStreak(prev, '2026-08-18')).toBe(prev);
  });

  it('restarts at 1 when the stored date is corrupt, and ignores a corrupt today', () => {
    expect(nextStreak(rec('garbage', 4), '2026-08-20')).toEqual(rec('2026-08-20', 1));
    const prev = rec('2026-08-20', 4);
    expect(nextStreak(prev, 'not-a-date')).toBe(prev);
  });
});

describe('localTodayISO — local calendar date', () => {
  it('formats local date parts zero-padded', () => {
    expect(localTodayISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localTodayISO(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });
});
