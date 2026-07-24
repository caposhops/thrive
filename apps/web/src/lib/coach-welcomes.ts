/**
 * Rotating welcome seeds for the coach.
 *
 * Instead of one fixed opening line for every session, the coach greets by
 * time-of-day. Same window → same greeting through the day (feels stable),
 * different windows → different greeting (feels alive).
 */

type Window = "morning" | "midday" | "evening" | "night";

const MORNING = [
  "Morning. What's the one thing you want today to be about?",
  "Good morning. Before anything else — what would make this day feel worth it?",
  "You're here. What's on your mind as the day begins?",
];

const MIDDAY = [
  "Midday check-in. How is the shape of today so far?",
  "Where are you in the day right now — riding it, or wrestling it?",
  "You made it to the middle. What needs your attention next?",
];

const EVENING = [
  "Evening. What flowed today, and what didn't?",
  "The day is winding down. What's still open in your head?",
  "Coming into the softer hours. What are you carrying that could be set down?",
];

const NIGHT = [
  "It's late. What's keeping you up — or what wants to be said before rest?",
  "Quiet hour. What's on your mind at this hour?",
  "Late check-in. What's still with you?",
];

function windowFor(hour: number): Window {
  if (hour < 11) return "morning";
  if (hour < 16) return "midday";
  if (hour < 21) return "evening";
  return "night";
}

export function pickCoachWelcome(now: Date = new Date()): string {
  const win = windowFor(now.getHours());
  const pool =
    win === "morning"
      ? MORNING
      : win === "midday"
        ? MIDDAY
        : win === "evening"
          ? EVENING
          : NIGHT;
  const seed = now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate();
  return pool[seed % pool.length];
}
