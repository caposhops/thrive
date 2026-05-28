import { Flame } from "lucide-react";
import { Card, CardEyebrow, CardTitle } from "@/components/ui/card";

export function StreakCard() {
  const days = 12;
  const cells = Array.from({ length: 14 }, (_, i) => i < days);

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
      <CardEyebrow>Current streak</CardEyebrow>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-display text-5xl font-semibold tracking-tight text-fg">{days}</span>
        <span className="mb-1.5 text-sm text-fg-muted">days thriving</span>
        <Flame className="ml-auto h-6 w-6 text-amber-400 animate-pulse-glow" fill="currentColor" />
      </div>
      <div className="mt-6 flex items-center gap-1.5">
        {cells.map((on, i) => (
          <span
            key={i}
            className={
              on
                ? "h-7 w-3.5 rounded-full bg-gradient-brand"
                : "h-7 w-3.5 rounded-full bg-white/[0.06]"
            }
            style={on ? { opacity: 0.3 + (i / cells.length) * 0.7 } : undefined}
          />
        ))}
      </div>
      <p className="mt-5 text-xs text-fg-subtle">
        Two weeks of showing up. The dopamine compounds.
      </p>
    </Card>
  );
}
