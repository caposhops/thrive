"use client";

import { useLocalStorage } from "@/lib/use-local-storage";
import { Card, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const moods = [
  { emoji: "🌧️", label: "Heavy", value: 1 },
  { emoji: "🌫️", label: "Foggy", value: 2 },
  { emoji: "🌤️", label: "Steady", value: 3 },
  { emoji: "☀️", label: "Bright", value: 4 },
  { emoji: "✨", label: "Radiant", value: 5 },
];

const todayKey = () => `thrive:mood:${new Date().toISOString().slice(0, 10)}`;

export function MoodCheckin() {
  const [selected, setSelected] = useLocalStorage<number | null>(todayKey(), null);

  return (
    <Card className="hover:bg-white/[0.05]">
      <CardEyebrow>Morning check-in</CardEyebrow>
      <CardTitle className="mt-1">How are you arriving today?</CardTitle>
      <CardDescription className="mt-1">
        No wrong answers. Just notice.
      </CardDescription>
      <div className="mt-6 flex items-center justify-between gap-2">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => setSelected(mood.value)}
            className={cn(
              "group flex flex-1 flex-col items-center gap-1.5 rounded-2xl p-3 transition-all",
              selected === mood.value
                ? "bg-gradient-glow ring-1 ring-white/15"
                : "hover:bg-white/[0.04]",
            )}
            aria-label={mood.label}
          >
            <span
              className={cn(
                "text-3xl transition-transform",
                selected === mood.value ? "scale-110" : "group-hover:scale-105",
              )}
            >
              {mood.emoji}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium tracking-wide transition-colors",
                selected === mood.value ? "text-fg" : "text-fg-subtle",
              )}
            >
              {mood.label}
            </span>
          </button>
        ))}
      </div>
      {selected !== null && (
        <p className="mt-5 rounded-2xl bg-white/[0.03] p-4 text-sm text-fg-muted">
          {selected <= 2 &&
            "Heavy days are part of the journey. One small kind thing for yourself today."}
          {selected === 3 && "Steady is a gift. Let's keep the rhythm gentle."}
          {selected >= 4 && "Beautiful. Carry that light into one thing that matters."}
        </p>
      )}
    </Card>
  );
}
