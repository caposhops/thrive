/**
 * Streak computation helpers. Honest math, no hardcoded magic numbers.
 *
 * Convention for habit history arrays:
 *   - history[length - 1] = yesterday
 *   - history[length - 2] = two days ago
 *   - ... and so on
 *   - "today" is tracked separately via the `doneToday` flag, because the day
 *     isn't over yet — missing today doesn't yet break a streak that was alive
 *     yesterday.
 */

/**
 * Current streak length:
 *   - If today is done → 1 + consecutive trues at the end of history
 *   - If today is not done but yesterday was → consecutive trues at end of history
 *     (the streak is "alive at risk" — still salvageable)
 *   - Else → 0 (broken)
 */
export function computeStreak(history: boolean[], doneToday: boolean): number {
  let historyStreak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]) historyStreak++;
    else break;
  }

  if (doneToday) return historyStreak + 1;
  if (history.length > 0 && history[history.length - 1]) return historyStreak;
  return 0;
}

/**
 * Longest streak ever observed in the given window.
 * Considers `doneToday` as one more day appended to history.
 */
export function longestStreak(history: boolean[], doneToday: boolean): number {
  const full = [...history, doneToday];
  let best = 0;
  let current = 0;
  for (const day of full) {
    if (day) {
      current++;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

/**
 * Returns true if the streak is "at risk" — yesterday was done but today isn't yet.
 * The gentle nudge target.
 */
export function isStreakAtRisk(history: boolean[], doneToday: boolean): boolean {
  if (doneToday) return false;
  if (history.length === 0) return false;
  return history[history.length - 1] === true;
}

/**
 * Compute the user's overall "days thriving" streak based on a set of date strings
 * (ISO yyyy-mm-dd) representing days they engaged with the app (e.g. mood check-ins).
 *
 * Returns the longest run of consecutive days ending at today (or yesterday if not
 * yet checked in today).
 */
export function computeAppStreak(checkInDates: Iterable<string>, today: Date = new Date()): number {
  const set = new Set(checkInDates);
  if (set.size === 0) return 0;

  const todayISO = isoDay(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = isoDay(yesterday);

  // Find the anchor — today if checked in, else yesterday if checked in, else 0
  let cursor: Date;
  if (set.has(todayISO)) {
    cursor = today;
  } else if (set.has(yesterdayISO)) {
    cursor = yesterday;
  } else {
    return 0;
  }

  let count = 0;
  while (set.has(isoDay(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return isoDay(new Date());
}
