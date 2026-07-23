"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Compass, CalendarDays, Play } from "lucide-react";
import { Card, CardEyebrow } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePlanBlocks } from "@/lib/use-plan-blocks";
import {
  findCurrentAndNext,
  formatTime12,
  minutesUntil,
} from "@/lib/plan-time";
import {
  permissionState,
  scheduleAll,
} from "@/lib/plan-notifications";
import { useFocusTimer } from "@/lib/use-focus-timer";

/**
 * "Now / Next" widget for the Today page. Shows the current planned block
 * prominently and the next one below. Updates every 30s so timing stays fresh.
 */
export function NowNextCard() {
  const { blocks, loading, editBlock } = usePlanBlocks();
  const { state: focusState, start: startFocus } = useFocusTimer();
  const [tick, setTick] = useState(0);

  // Re-render every 30s so current/next stays accurate as time passes
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Re-schedule notifications whenever the block list changes
  useEffect(() => {
    if (permissionState() !== "granted") return;
    scheduleAll(
      blocks
        .filter((b) => !b.done)
        .map((b) => ({ id: b.id, start_time: b.start_time, title: b.title })),
    );
  }, [blocks]);

  if (loading) {
    return (
      <Card className="animate-pulse-glow py-10 text-center text-fg-subtle">
        Reading your rhythm…
      </Card>
    );
  }

  if (blocks.length === 0) {
    return <PlanRhythmCard />;
  }

  const { current, next } = findCurrentAndNext(blocks);
  // Silence the tick-driven re-render warning — the value is only used to force refresh
  void tick;

  // Focus button starts a timer sized to the gap until the next block, capped
  // at 90 min and floored at 10 min. Falls back to 25 min if no next block.
  const focusMinutesForCurrent = (): number => {
    if (!next) return 25;
    const minutes = Math.max(0, minutesUntil(next.start_time));
    if (minutes < 10) return 10;
    if (minutes > 90) return 90;
    return minutes;
  };
  const focusActive = focusState.kind !== "idle";

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/25 blur-3xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardEyebrow>Right now</CardEyebrow>
          {current ? (
            <>
              <h3
                className={cn(
                  "mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-fg sm:text-3xl",
                  current.done && "text-fg-muted line-through decoration-white/20",
                )}
              >
                {current.title}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-fg-subtle">
                Since {formatTime12(current.start_time)}
              </p>
            </>
          ) : (
            <>
              <h3 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-fg-muted sm:text-3xl">
                Before your first block
              </h3>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-fg-subtle">
                First block: {formatTime12(blocks[0].start_time)}
              </p>
            </>
          )}
        </div>
        {current && (
          <div className="flex shrink-0 items-center gap-2">
            {!current.done && !focusActive && (
              <button
                onClick={() =>
                  startFocus({
                    durationMs: focusMinutesForCurrent() * 60_000,
                    label: current.title,
                  })
                }
                className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-fg transition-all hover:bg-white/[0.08]"
                title={`Start a ${focusMinutesForCurrent()}-min focus session`}
              >
                <Play className="h-3 w-3" fill="currentColor" />
                Focus
              </button>
            )}
            <button
              onClick={() => editBlock(current.id, { done: !current.done })}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                current.done
                  ? "border-transparent bg-gradient-brand text-black shadow-glow"
                  : "border-white/20 text-fg-subtle hover:border-white/40 hover:text-fg",
              )}
              aria-label={current.done ? "Mark not done" : "Mark done"}
              aria-pressed={current.done}
            >
              <Check className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
        )}
      </div>

      {next && (
        <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/[0.03] p-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
              Next up
            </p>
            <p className="mt-1 text-sm font-medium text-fg">{next.title}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-fg-muted">{formatTime12(next.start_time)}</p>
            <p className="mt-0.5 text-[10px] tabular-nums text-fg-subtle">
              in {minutesUntil(next.start_time)} min
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-fg-subtle">
        <span>
          {blocks.filter((b) => b.done).length}/{blocks.length} complete
        </span>
        <div className="flex items-center gap-1">
          <Link
            href="/week"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-fg-muted transition-colors hover:bg-white/[0.05] hover:text-fg"
          >
            <CalendarDays className="h-3 w-3" />
            Week
          </Link>
          <Link
            href="/plan"
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-fg-muted transition-colors hover:bg-white/[0.05] hover:text-fg"
          >
            Edit rhythm
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function PlanRhythmCard() {
  return (
    <Card className="relative overflow-hidden bg-gradient-glow">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
          <Compass className="h-6 w-6 text-black" />
        </div>
        <div className="flex-1">
          <CardEyebrow>Your rhythm today</CardEyebrow>
          <h3 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight">
            Plan the shape of today.
          </h3>
          <p className="mt-2 text-sm text-fg-muted">
            Pick 3&ndash;5 gentle intents with rough times. We&apos;ll nudge you 5 minutes
            before each one so time stops slipping.
          </p>
          <Link href="/plan" className="mt-5 inline-block">
            <button className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-medium text-black shadow-glow transition-all hover:brightness-110">
              Design your rhythm
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
