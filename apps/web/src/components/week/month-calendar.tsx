"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { isoDay, todayISO } from "@/lib/streaks";
import type { WeekDay } from "@/lib/supabase/week";

const MOOD_EMOJI: Record<number, string> = {
  1: "🌧️",
  2: "🌫️",
  3: "🌤️",
  4: "☀️",
  5: "✨",
};

// Monday-first column headers
const COL_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = {
  days: WeekDay[]; // 42 entries — one per grid cell, Monday-first
  visibleYear: number;
  visibleMonth: number; // 0-indexed
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

function monthName(year: number, monthIndex0: number): string {
  return new Date(year, monthIndex0, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function MonthCalendar({
  days,
  visibleYear,
  visibleMonth,
  onPrev,
  onNext,
  onToday,
}: Props) {
  const today = todayISO();
  const currentMonthIso = `${visibleYear}-${String(visibleMonth + 1).padStart(2, "0")}`;
  const isCurrentMonth =
    today.startsWith(currentMonthIso);

  return (
    <div>
      {/* Month navigator */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="glass flex h-9 w-9 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="font-display text-lg font-semibold tracking-tight text-fg">
            {monthName(visibleYear, visibleMonth)}
          </p>
          <button
            type="button"
            onClick={onNext}
            className="glass flex h-9 w-9 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {!isCurrentMonth && (
          <button
            type="button"
            onClick={onToday}
            className="glass rounded-full px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
          >
            Today
          </button>
        )}
      </div>

      {/* Column headers */}
      <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
        {COL_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] uppercase tracking-[0.14em] text-fg-subtle"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((d) => (
          <DayCell
            key={d.date}
            day={d}
            visibleMonth={visibleMonth}
            visibleYear={visibleYear}
            isToday={d.date === today}
          />
        ))}
      </div>
    </div>
  );
}

function DayCell({
  day,
  visibleMonth,
  visibleYear,
  isToday,
}: {
  day: WeekDay;
  visibleMonth: number;
  visibleYear: number;
  isToday: boolean;
}) {
  const [y, m, d] = day.date.split("-").map(Number);
  const inMonth = y === visibleYear && m - 1 === visibleMonth;
  const today = todayISO();
  const isPast = day.date < today;

  const totalCount = day.blocks.length;
  const completedCount = day.blocks.filter((b) => b.done).length;
  const href = isToday ? "/plan" : `/plan?date=${day.date}`;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex aspect-square flex-col rounded-2xl p-1.5 text-left transition-all sm:aspect-auto sm:min-h-[88px] sm:p-2",
        isToday
          ? "bg-gradient-glow ring-1 ring-white/15 shadow-glow"
          : inMonth
            ? "glass hover:bg-white/[0.06]"
            : "bg-white/[0.015] hover:bg-white/[0.04]",
        !inMonth && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            "font-display text-sm font-semibold tabular-nums leading-none sm:text-base",
            isToday ? "text-fg" : inMonth ? "text-fg-muted" : "text-fg-subtle",
          )}
        >
          {d}
        </span>
        {day.mood !== null && (
          <span
            className="text-xs leading-none"
            title={`Mood ${day.mood}/5`}
            aria-label={`Mood ${day.mood} of 5`}
          >
            {MOOD_EMOJI[day.mood]}
          </span>
        )}
      </div>

      {totalCount > 0 && (
        <div className="mt-auto flex items-center justify-between gap-1 pt-1 text-[10px]">
          <span
            className={cn(
              "tabular-nums",
              isPast && completedCount < totalCount
                ? "text-amber-300/70"
                : "text-fg-subtle",
            )}
          >
            {completedCount}/{totalCount}
          </span>
          <div className="ml-1 h-0.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full bg-gradient-brand"
              style={{
                width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
