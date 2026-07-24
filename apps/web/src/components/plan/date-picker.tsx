"use client";

import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { isoDay, todayISO } from "@/lib/streaks";

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (next: string) => void;
};

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return isoDay(dt);
}

function labelForDate(iso: string): string {
  const today = todayISO();
  if (iso === today) return "Today";
  if (iso === shiftDate(today, -1)) return "Yesterday";
  if (iso === shiftDate(today, 1)) return "Tomorrow";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const diffDays = Math.round(
    (dt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  );
  if (Math.abs(diffDays) < 7) {
    return dt.toLocaleDateString(undefined, { weekday: "long" });
  }
  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: dt.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export function PlanDatePicker({ value, onChange }: Props) {
  const today = todayISO();
  const yesterday = shiftDate(today, -1);
  const tomorrow = shiftDate(today, 1);

  const options = [
    { key: yesterday, label: "Yesterday" },
    { key: today, label: "Today" },
    { key: tomorrow, label: "Tomorrow" },
  ];

  const isCustom = !options.some((o) => o.key === value);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
            value === o.key
              ? "bg-gradient-brand text-black shadow-glow"
              : "glass text-fg-muted hover:bg-white/[0.08] hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}

      {isCustom && (
        <span className="rounded-full bg-gradient-brand px-3 py-1.5 text-xs font-medium text-black shadow-glow">
          {labelForDate(value)}
        </span>
      )}

      {/* Native date input wrapped in a label so tapping the pill anywhere opens
          the OS date picker on every browser we support (Chrome/FF/Edge/Safari
          desktop + iOS Safari + Android). No showPicker() needed. */}
      <label className="glass relative inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs text-fg-muted transition-all hover:bg-white/[0.08] hover:text-fg">
        <CalendarDays className="h-3.5 w-3.5" />
        Pick date
        <input
          type="date"
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            if (next) onChange(next);
          }}
          onClick={(e) => {
            // Modern browsers open the picker when the input receives the click
            // (from the label). This showPicker() is belt-and-suspenders for
            // browsers where the default click doesn't open it.
            const el = e.currentTarget as HTMLInputElement & {
              showPicker?: () => void;
            };
            try {
              el.showPicker?.();
            } catch {
              // showPicker throws in some contexts (non-secure origin, etc.)
              // Silent — the label-driven default already handles most cases.
            }
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label="Pick any date"
        />
      </label>
    </div>
  );
}
