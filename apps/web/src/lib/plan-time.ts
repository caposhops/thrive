/**
 * Shared time utilities for the daily rhythm planner.
 * Times are "HH:MM" strings (from Postgres time), local to the user's browser.
 */

export type BlockLike = { start_time: string; title: string };

/** Parse an "HH:MM" or "HH:MM:SS" string into minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [hh, mm] = t.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

/** Convert a Date to "HH:MM" in local time. */
export function dateToHHMM(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Current minutes since midnight (local time). */
export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** Format "09:00" → "9:00 am". Handles noon and midnight cleanly. */
export function formatTime12(t: string): string {
  const [hh, mm] = t.split(":").map(Number);
  const h = hh % 12 === 0 ? 12 : hh % 12;
  const suffix = hh < 12 ? "am" : "pm";
  return `${h}:${String(mm).padStart(2, "0")} ${suffix}`;
}

/** Normalize "HH:MM:SS" (Postgres) or "HH:MM" (input) → "HH:MM". */
export function normalizeTime(t: string): string {
  const parts = t.split(":");
  return `${parts[0].padStart(2, "0")}:${(parts[1] ?? "00").padStart(2, "0")}`;
}

/** Given a sorted-by-time list of blocks, find current + next. */
export function findCurrentAndNext<T extends BlockLike>(
  blocks: T[],
  atMinutes: number = nowMinutes(),
): { current: T | null; next: T | null } {
  if (blocks.length === 0) return { current: null, next: null };
  let current: T | null = null;
  let next: T | null = null;
  for (const b of blocks) {
    const m = timeToMinutes(b.start_time);
    if (m <= atMinutes) {
      current = b;
    } else if (!next) {
      next = b;
      break;
    }
  }
  return { current, next };
}

/**
 * Minutes until a "HH:MM" today. Negative if already passed.
 */
export function minutesUntil(t: string): number {
  return timeToMinutes(t) - nowMinutes();
}
