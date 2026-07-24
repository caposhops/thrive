/**
 * Duration presets and formatting for plan blocks.
 * `null` means "open-ended" — block runs until the next block starts.
 */

export type DurationMinutes = number | null;

export type DurationPreset = {
  minutes: number;
  label: string;
  short: string; // for compact displays
};

export const DURATION_PRESETS: DurationPreset[] = [
  { minutes: 15, label: "15 minutes", short: "15m" },
  { minutes: 30, label: "30 minutes", short: "30m" },
  { minutes: 45, label: "45 minutes", short: "45m" },
  { minutes: 60, label: "1 hour", short: "1h" },
  { minutes: 90, label: "90 minutes", short: "1h 30m" },
  { minutes: 120, label: "2 hours", short: "2h" },
  { minutes: 180, label: "3 hours", short: "3h" },
];

/** Turn a raw minute count into "1h 30m" style. */
export function formatDurationShort(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return "";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Long form for a11y / picker labels. */
export function formatDurationLong(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return "open-ended";
  const preset = DURATION_PRESETS.find((p) => p.minutes === minutes);
  return preset?.label ?? formatDurationShort(minutes);
}
