/**
 * Affirmations for daily card + completion moments.
 *
 * Rules I follow when adding lines:
 *   1. Concrete over abstract. "Start with two minutes" beats "trust the process".
 *   2. Present tense. Not a promise, not a prediction.
 *   3. Never a puzzle. If it takes a second to parse, cut it.
 *   4. No wellness clichés. No "you got this", no "you are enough", no puzzle-koans.
 *   5. Short. Under 12 words unless the line genuinely needs the extra breath.
 *   6. Match Thrive's voice: quiet, direct, warm, ADHD-aware.
 */

// ─── Daily card pool ──────────────────────────────────────────────────────
// One-a-day, deterministic by date. What you see on /today's affirmation card.

const DAILY: string[] = [
  "One thing at a time. That's enough.",
  "The small step still counts.",
  "Half-done is still done.",
  "Getting back on track is track.",
  "Being here is the first thing.",
  "Slower is often faster.",
  "Rest is part of the work.",
  "Your body knows when to slow down.",
  "You're not late. You're on your rhythm.",
  "The version of you that showed up matters.",
  "Doing this well beats doing more.",
  "Notice the breath. That's the reset.",
  "Being scattered doesn't mean broken.",
  "Two minutes. See what happens.",
  "Small, then again, then again. That's the whole thing.",
];

// ─── Completion moment lines ──────────────────────────────────────────────
// Brief, quiet, said-once-then-gone. Grouped by what was just completed.

const BLOCK_DONE: string[] = [
  "Rhythm honored.",
  "One block, done.",
  "That's momentum.",
  "You showed up.",
  "Small, repeated.",
  "The rhythm builds.",
  "Nice.",
  "That's the shape of a good day.",
];

const PRIORITY_DONE: string[] = [
  "One of three.",
  "That mattered.",
  "The important thing, done.",
  "Held the promise.",
  "That was on your heart. Now it's not.",
];

const HABIT_DONE: string[] = [
  "One more brick.",
  "Consistency stacks.",
  "That's a day of you being you.",
  "The pattern deepens.",
  "You kept the small promise.",
];

const FOCUS_DONE: string[] = [
  "Well done. Time well used.",
  "That's real work.",
  "Deep, honest attention.",
  "Time given fully.",
  "You held the container.",
];

const DAY_COMPLETE: string[] = [
  "Every block, honored. That's the whole day.",
  "You did what you said you'd do. All of it.",
  "A full rhythm, held. That's rare.",
  "Today, complete. That was the whole thing.",
];

export type CompletionContext =
  | "block-done"
  | "priority-done"
  | "habit-done"
  | "focus-done"
  | "day-complete";

/**
 * Pick a completion-moment line. Uses a mildly-random pick so users don't
 * see the same line twice in a row for the same context (in one session).
 * State is per-context to avoid cross-contamination.
 */
const recentByContext = new Map<CompletionContext, string>();

export function pickCompletionAffirmation(context: CompletionContext): string {
  const pool = poolFor(context);
  const last = recentByContext.get(context);
  const candidates = pool.length > 1 ? pool.filter((l) => l !== last) : pool;
  const line = candidates[Math.floor(Math.random() * candidates.length)];
  recentByContext.set(context, line);
  return line;
}

function poolFor(context: CompletionContext): string[] {
  switch (context) {
    case "block-done":
      return BLOCK_DONE;
    case "priority-done":
      return PRIORITY_DONE;
    case "habit-done":
      return HABIT_DONE;
    case "focus-done":
      return FOCUS_DONE;
    case "day-complete":
      return DAY_COMPLETE;
  }
}

/**
 * Deterministic daily affirmation — same line all day, changes at midnight.
 * Uses date + a stable hash so the sequence looks random but repeats every ~15 days.
 */
export function pickDailyAffirmation(date: Date = new Date()): string {
  const iso = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < iso.length; i++) hash = (hash * 31 + iso.charCodeAt(i)) | 0;
  const index = Math.abs(hash) % DAILY.length;
  return DAILY[index];
}
