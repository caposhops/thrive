"use client";

import { useEffect, useRef, useState } from "react";
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const options = [
    { key: yesterday, label: "Yesterday" },
    { key: today, label: "Today" },
    { key: tomorrow, label: "Tomorrow" },
  ];

  // Value that's not one of the three quick options — show it as a custom pill
  const isCustom = !options.some((o) => o.key === value);

  useEffect(() => {
    if (pickerOpen) dateInputRef.current?.showPicker?.();
  }, [pickerOpen]);

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
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded-full bg-gradient-brand px-3 py-1.5 text-xs font-medium text-black shadow-glow"
        >
          {labelForDate(value)}
        </button>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-fg-muted transition-all hover:bg-white/[0.08] hover:text-fg"
          aria-label="Pick any date"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Pick date
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            if (next) onChange(next);
            setPickerOpen(false);
          }}
          className="absolute inset-0 opacity-0"
          tabIndex={-1}
          aria-hidden
        />
      </div>
    </div>
  );
}
