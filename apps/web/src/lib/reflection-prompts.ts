/**
 * Rotating prompts for the Daily Reflection card.
 *
 * Prompt pool varies by time of day so the same user opening in the morning
 * vs. evening gets a different lens. Within each window we pick deterministically
 * from the date, so the prompt is stable across the session but rotates day-to-day.
 */

type TimeOfDay = "morning" | "midday" | "evening" | "night";

const MORNING = [
  "What is one thing you want to protect today?",
  "What is your body asking for this morning?",
  "What would make today feel worth it?",
  "What are you carrying in from yesterday? Can you set it down?",
  "What is the softest way to begin?",
];

const MIDDAY = [
  "What has flowed so far? What has snagged?",
  "How is your energy right now — honestly?",
  "What have you noticed about yourself today?",
  "Is there a small course-correction worth making?",
  "What deserves a breath before you continue?",
];

const EVENING = [
  "What flowed today? What slipped?",
  "What surprised you today?",
  "What are you proud of, even if it was small?",
  "What would you like to leave behind before sleep?",
  "What did today teach you about how you work?",
  "What is one thing you'd do the same tomorrow?",
];

const NIGHT = [
  "What is worth remembering from today?",
  "What are you grateful for as this day closes?",
  "What can rest tonight?",
  "What is the truest sentence you could write about today?",
];

export function timeOfDay(hour: number): TimeOfDay {
  if (hour < 11) return "morning";
  if (hour < 16) return "midday";
  if (hour < 21) return "evening";
  return "night";
}

export function labelForTimeOfDay(t: TimeOfDay): string {
  switch (t) {
    case "morning":
      return "Morning reflection";
    case "midday":
      return "Midday reflection";
    case "evening":
      return "Evening reflection";
    case "night":
      return "Late reflection";
  }
}

export function pickPromptForNow(now: Date = new Date()): {
  prompt: string;
  window: TimeOfDay;
  label: string;
} {
  const window = timeOfDay(now.getHours());
  const pool =
    window === "morning"
      ? MORNING
      : window === "midday"
        ? MIDDAY
        : window === "evening"
          ? EVENING
          : NIGHT;
  const daySeed = now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate();
  const prompt = pool[(daySeed + window.length) % pool.length];
  return { prompt, window, label: labelForTimeOfDay(window) };
}
