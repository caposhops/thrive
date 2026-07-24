"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Cloud, HardDrive, Waypoints } from "lucide-react";
import { Card, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isoDay } from "@/lib/streaks";
import { formatTime12 } from "@/lib/plan-time";
import { useUser } from "@/lib/supabase/use-user";
import {
  fetchDateRange,
  fetchWeek,
  monthGridRange,
  type WeekDay,
  type WeekDirection,
} from "@/lib/supabase/week";
import { MonthCalendar } from "@/components/week/month-calendar";

type ViewMode = "past" | "next" | "month";

const moodEmoji: Record<number, string> = {
  1: "🌧️",
  2: "🌫️",
  3: "🌤️",
  4: "☀️",
  5: "✨",
};

const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeekPage() {
  const { user, loading: authLoading } = useUser();
  const [days, setDays] = useState<WeekDay[] | null>(null);
  const [mode, setMode] = useState<ViewMode>("past");

  // Month mode owns its own visible month, defaulting to the current one
  const now = new Date();
  const [monthCursor, setMonthCursor] = useState<{ year: number; month: number }>({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  useEffect(() => {
    if (!user) {
      setDays(null);
      return;
    }
    let cancelled = false;
    setDays(null);
    const fetcher =
      mode === "month"
        ? (() => {
            const { startISO, endISO } = monthGridRange(
              monthCursor.year,
              monthCursor.month,
            );
            return fetchDateRange(user.id, startISO, endISO);
          })()
        : fetchWeek(user.id, mode as WeekDirection);
    fetcher.then((w) => {
      if (!cancelled) setDays(w);
    });
    return () => {
      cancelled = true;
    };
  }, [user, mode, monthCursor.year, monthCursor.month]);

  const stats = useMemo(() => {
    if (!days) return null;
    // For month mode, only count days that fall in the visible month
    const inScope =
      mode === "month"
        ? days.filter((d) => {
            const [y, m] = d.date.split("-").map(Number);
            return y === monthCursor.year && m - 1 === monthCursor.month;
          })
        : days;
    const activeDays = inScope.filter((d) => d.blocks.length > 0).length;
    const totalBlocks = inScope.reduce((sum, d) => sum + d.blocks.length, 0);
    const completedBlocks = inScope.reduce(
      (sum, d) => sum + d.blocks.filter((b) => b.done).length,
      0,
    );
    const moodDays = inScope.filter((d) => d.mood !== null).length;
    const denominator = inScope.length;
    return { activeDays, totalBlocks, completedBlocks, moodDays, denominator };
  }, [days, mode, monthCursor.year, monthCursor.month]);

  const goPrevMonth = () =>
    setMonthCursor(({ year, month }) => {
      if (month === 0) return { year: year - 1, month: 11 };
      return { year, month: month - 1 };
    });
  const goNextMonth = () =>
    setMonthCursor(({ year, month }) => {
      if (month === 11) return { year: year + 1, month: 0 };
      return { year, month: month + 1 };
    });
  const goThisMonth = () =>
    setMonthCursor({ year: now.getFullYear(), month: now.getMonth() });

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-fg-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-2xl pt-8">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">This week</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Sign in to see the shape of your week.
          </h1>
        </header>
        <Card className="bg-gradient-glow">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
              <HardDrive className="h-6 w-6 text-black" />
            </div>
            <div className="flex-1">
              <CardEyebrow>Weekly view</CardEyebrow>
              <p className="mt-1 font-display text-xl font-semibold text-fg">
                Patterns only show up across days.
              </p>
              <CardDescription className="mt-2">
                The week view needs your history to be somewhere it can add up.
                Sign in once and Thrive will show you the last 7 days of blocks,
                moods, and reflections.
              </CardDescription>
              <Link href="/sign-in" className="mt-4 inline-block">
                <Button size="sm">
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">
            {mode === "past"
              ? "This week"
              : mode === "next"
                ? "The week ahead"
                : "This month"}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {mode === "past" ? (
              <>
                The shape of your{" "}
                <span className="text-gradient-calm">last seven days</span>.
              </>
            ) : mode === "next" ? (
              <>
                What&apos;s coming in your{" "}
                <span className="text-gradient-calm">next seven days</span>.
              </>
            ) : (
              <>
                Zoom out to the{" "}
                <span className="text-gradient-calm">whole month</span>.
              </>
            )}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] tracking-wide text-teal-300">
            <Cloud className="h-3 w-3" />
            <span>Synced</span>
            <span className="text-fg-subtle">
              ·{" "}
              {mode === "past"
                ? "rolling window ending today"
                : mode === "next"
                  ? "today + next 6 days"
                  : "tap any day to plan it"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="glass flex items-center rounded-full p-0.5 text-xs">
            <ModeButton active={mode === "past"} onClick={() => setMode("past")}>
              Past 7
            </ModeButton>
            <ModeButton active={mode === "next"} onClick={() => setMode("next")}>
              Next 7
            </ModeButton>
            <ModeButton active={mode === "month"} onClick={() => setMode("month")}>
              Month
            </ModeButton>
          </div>
          <Link href="/plan">
            <Button size="sm" variant="secondary">
              <Waypoints className="h-4 w-4" />
              Edit today
            </Button>
          </Link>
        </div>
      </header>

      {/* Summary stats */}
      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Days active"
            value={stats.activeDays}
            suffix={`/ ${stats.denominator}`}
          />
          <StatCard
            label="Blocks planned"
            value={stats.totalBlocks}
            suffix={stats.totalBlocks > 0 ? `· ${stats.completedBlocks} done` : ""}
          />
          <StatCard
            label="Mood check-ins"
            value={stats.moodDays}
            suffix={`/ ${stats.denominator}`}
          />
          <StatCard
            label="Completion"
            value={
              stats.totalBlocks > 0
                ? Math.round((stats.completedBlocks / stats.totalBlocks) * 100)
                : 0
            }
            suffix="%"
          />
        </div>
      )}

      {/* Body — week grid OR month calendar */}
      {days === null ? (
        <Card className="animate-pulse-glow py-16 text-center text-fg-subtle">
          Reading…
        </Card>
      ) : mode === "month" ? (
        <MonthCalendar
          days={days}
          visibleYear={monthCursor.year}
          visibleMonth={monthCursor.month}
          onPrev={goPrevMonth}
          onNext={goNextMonth}
          onToday={goThisMonth}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {days.map((d) => (
            <DayCard key={d.date} day={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 font-medium transition-all",
        active
          ? "bg-gradient-brand text-black shadow-glow"
          : "text-fg-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight text-fg">
        {value}
        {suffix && (
          <span className="ml-1 text-xs font-normal text-fg-muted">{suffix}</span>
        )}
      </p>
    </div>
  );
}

function DayCard({ day }: { day: WeekDay }) {
  const dateObj = new Date(day.date + "T12:00:00");
  const today = isoDay(new Date());
  const isToday = day.date === today;
  const isFuture = day.date > today;
  const dayName = dayShort[dateObj.getDay()];
  const dayNum = dateObj.getDate();
  const completedCount = day.blocks.filter((b) => b.done).length;
  const totalCount = day.blocks.length;
  const planHref = isToday ? "/plan" : `/plan?date=${day.date}`;

  return (
    <Link
      href={planHref}
      className={cn(
        "flex flex-col gap-3 rounded-3xl p-4 transition-all hover:ring-1 hover:ring-white/15",
        isToday
          ? "bg-gradient-glow ring-1 ring-white/15 shadow-glow"
          : "glass",
      )}
      title={isFuture ? `Plan ${dateObj.toLocaleDateString(undefined, { weekday: "long" })}` : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              "text-[10px] uppercase tracking-[0.18em]",
              isToday ? "text-fg" : "text-fg-subtle",
            )}
          >
            {dayName}
          </p>
          <p
            className={cn(
              "mt-0.5 font-display text-2xl font-semibold tabular-nums leading-none",
              isToday ? "text-fg" : "text-fg-muted",
            )}
          >
            {dayNum}
          </p>
        </div>
        {day.mood !== null && (
          <span
            className="text-2xl leading-none"
            title={`Mood: ${day.mood}/5`}
            aria-label={`Mood ${day.mood} of 5`}
          >
            {moodEmoji[day.mood]}
          </span>
        )}
      </div>

      {totalCount === 0 ? (
        <p className="text-[11px] text-fg-subtle">No plan.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-1.5">
            {day.blocks.slice(0, 5).map((b) => (
              <li key={b.id} className="flex items-center gap-2 text-[11px]">
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    b.done ? "bg-teal-300" : "bg-white/25",
                  )}
                />
                <span className="w-12 shrink-0 tabular-nums text-fg-subtle">
                  {formatTime12(b.start_time)}
                </span>
                <span
                  className={cn(
                    "flex-1 truncate",
                    b.done ? "text-fg-subtle line-through decoration-white/20" : "text-fg-muted",
                  )}
                >
                  {b.title}
                </span>
              </li>
            ))}
          </ul>
          {day.blocks.length > 5 && (
            <p className="text-[10px] text-fg-subtle">
              +{day.blocks.length - 5} more
            </p>
          )}
          <div className="mt-auto flex items-center justify-between text-[10px] text-fg-subtle">
            <span>
              {completedCount}/{totalCount} done
            </span>
            <div className="ml-2 h-1 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full bg-gradient-brand"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </>
      )}

      {day.reflection && (
        <p className="mt-1 line-clamp-2 rounded-xl bg-white/[0.03] p-2 text-[10px] italic leading-relaxed text-fg-muted">
          &ldquo;{day.reflection}&rdquo;
        </p>
      )}
    </Link>
  );
}
