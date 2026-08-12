"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Plus,
  Bell,
  BellOff,
  ArrowRight,
  Cloud,
  HardDrive,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import { Card, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlanBlocks, moveBlockBetweenDates } from "@/lib/use-plan-blocks";
import { formatTime12 } from "@/lib/plan-time";
import {
  permissionState,
  requestPermission,
  scheduleAll,
} from "@/lib/plan-notifications";
import { WeeklyRhythm } from "@/components/plan/weekly-rhythm";
import { CompletionFlash, useCompletionFlash } from "@/components/completion-flash";
import { DurationPicker } from "@/components/plan/duration-picker";
import type { DurationMinutes } from "@/lib/plan-duration";
import { PlanDatePicker } from "@/components/plan/date-picker";
import {
  BlockActionsMenu,
  relativeLabel,
} from "@/components/plan/block-actions-menu";
import { todayISO } from "@/lib/streaks";

type Suggestion = { start_time: string; title: string };

const suggestions: Suggestion[] = [
  { start_time: "07:00", title: "Morning stillness · no phone" },
  { start_time: "09:00", title: "Deep work · the one thing that matters" },
  { start_time: "12:00", title: "Lunch away from screens" },
  { start_time: "14:00", title: "Reactive block · emails + admin" },
  { start_time: "17:00", title: "Move the body" },
  { start_time: "19:00", title: "Dinner · people, not tasks" },
  { start_time: "22:00", title: "Wind down · read, breathe, sleep" },
];

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-3xl"><Card className="animate-pulse-glow py-12 text-center text-fg-subtle">Loading…</Card></div>}>
      <PlanPageInner />
    </Suspense>
  );
}

function PlanPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date");
  const selectedDate = isValidISODate(urlDate) ? (urlDate as string) : todayISO();
  const isToday = selectedDate === todayISO();

  const { blocks, loading, addBlock, editBlock, removeBlock, moveBlockDate, isAuthed } =
    usePlanBlocks(selectedDate);
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [draftTime, setDraftTime] = useState(defaultNextTime(blocks));
  const [draftTitle, setDraftTitle] = useState("");
  const { flash, trigger } = useCompletionFlash();
  const [draftDuration, setDraftDuration] = useState<DurationMinutes>(null);

  // Small toast that appears after a Move-to-date and offers Undo for a few
  // seconds. Cleared on any subsequent move so it always reflects the latest.
  type MoveToast = {
    id: string;
    title: string;
    from: string; // ISO
    to: string;   // ISO
    // A snapshot of the block at the moment of the move — used by undo so
    // the local-storage path can restore it into the source day even after
    // the hook has already dropped it from the visible list.
    snapshot: {
      id: string;
      start_time: string;
      duration_minutes: number | null;
      title: string;
      done: boolean;
    };
    key: number; // re-triggers the auto-dismiss timer
  };
  const [moveToast, setMoveToast] = useState<MoveToast | null>(null);

  useEffect(() => {
    if (!moveToast) return;
    const t = window.setTimeout(() => setMoveToast(null), 5500);
    return () => window.clearTimeout(t);
  }, [moveToast?.key]);

  const handleMove = async (blockId: string, targetDate: string) => {
    const b = blocks.find((x) => x.id === blockId);
    if (!b || targetDate === selectedDate) return;
    await moveBlockDate(blockId, targetDate);
    setMoveToast({
      id: blockId,
      title: b.title,
      from: selectedDate,
      to: targetDate,
      snapshot: {
        id: b.id,
        start_time: b.start_time,
        duration_minutes: b.duration_minutes,
        title: b.title,
        done: b.done,
      },
      key: Date.now(),
    });
  };

  const undoMove = async () => {
    if (!moveToast) return;
    await moveBlockBetweenDates({
      id: moveToast.id,
      block: moveToast.snapshot,
      fromDate: moveToast.to,
      toDate: moveToast.from,
      isAuthed,
    });
    // If the user is currently viewing the source day, the block will
    // reappear on next hydrate. Force a re-hydrate by nudging the URL.
    if (selectedDate === moveToast.from) {
      router.refresh();
    }
    setMoveToast(null);
  };

  const setSelectedDate = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === todayISO()) {
      params.delete("date");
    } else {
      params.set("date", next);
    }
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  };

  useEffect(() => {
    setPermission(permissionState());
  }, []);

  useEffect(() => {
    // Only schedule notifications for today's plan. Tomorrow's nudges will
    // schedule themselves when tomorrow becomes today.
    if (!isToday) return;
    scheduleAll(
      blocks
        .filter((b) => !b.done)
        .map((b) => ({ id: b.id, start_time: b.start_time, title: b.title })),
    );
  }, [blocks, isToday]);

  const askForPermission = async () => {
    const next = await requestPermission();
    setPermission(next);
    if (next === "granted") {
      scheduleAll(
        blocks
          .filter((b) => !b.done)
          .map((b) => ({ id: b.id, start_time: b.start_time, title: b.title })),
      );
    }
  };

  const addFromDraft = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const title = draftTitle.trim();
    if (!title) return;
    await addBlock({
      start_time: draftTime,
      title,
      duration_minutes: draftDuration,
    });
    setDraftTitle("");
    setDraftDuration(null);
    setDraftTime(
      defaultNextTime([
        ...blocks,
        {
          id: "",
          start_time: draftTime,
          title,
          done: false,
          duration_minutes: draftDuration,
        },
      ]),
    );
  };

  const addSuggestion = async (s: Suggestion) => {
    // Skip if a block with the same time already exists
    if (blocks.some((b) => b.start_time === s.start_time)) return;
    await addBlock(s);
  };

  const remainingSuggestions = useMemo(
    () => suggestions.filter((s) => !blocks.some((b) => b.start_time === s.start_time)),
    [blocks],
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      <CompletionFlash flash={flash} />
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Design your rhythm</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {isToday
            ? "Shape today, gently."
            : `Shape ${headlineLabel(selectedDate)}.`}
        </h1>
        <p className="mt-3 text-fg-muted">
          {formatSelectedDate(selectedDate)} · pick 3&ndash;5 moments. Rough times, not rigid slots.
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] tracking-wide text-fg-subtle">
          {isAuthed ? (
            <>
              <Cloud className="h-3 w-3 text-teal-300" />
              <span className="text-teal-300">Synced</span>
              <span>· your rhythm follows you across devices</span>
            </>
          ) : (
            <>
              <HardDrive className="h-3 w-3" />
              <span>Local · saved on this device only</span>
            </>
          )}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <PlanDatePicker value={selectedDate} onChange={setSelectedDate} />
          <Link
            href="/week"
            className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            See the whole week
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {moveToast && (
        <div
          key={moveToast.key}
          className="glass mb-4 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm"
          role="status"
        >
          <p className="text-fg">
            Moved <span className="font-medium">&ldquo;{moveToast.title}&rdquo;</span>{" "}
            to <span className="text-fg">{relativeLabel(moveToast.to, moveToast.from)}</span>
          </p>
          <button
            onClick={undoMove}
            className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-white/[0.12]"
          >
            Undo
          </button>
        </div>
      )}

      {/* Notifications banner — only for today's plan */}
      {isToday && permission === "default" && blocks.length > 0 && (
        <Card className="mb-6 flex flex-col gap-3 bg-gradient-glow sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-fg">Gentle nudges at every transition?</p>
            <p className="mt-1 text-xs text-fg-muted">
              A soft browser notification 5 min before each block. Only while the app is open.
            </p>
          </div>
          <Button size="sm" onClick={askForPermission}>
            <Bell className="h-4 w-4" />
            Enable
          </Button>
        </Card>
      )}
      {isToday && permission === "denied" && (
        <Card className="mb-6 flex items-center gap-3 text-xs text-fg-muted">
          <BellOff className="h-4 w-4 shrink-0" />
          Notifications are blocked in this browser. You can enable them in Site Settings.
        </Card>
      )}

      {/* Existing blocks */}
      {loading ? (
        <Card className="py-12 text-center text-fg-muted">Loading your rhythm…</Card>
      ) : blocks.length === 0 ? (
        <Card className="py-10 text-center">
          <CardEyebrow>Empty canvas</CardEyebrow>
          <CardTitle className="mt-2">No blocks yet.</CardTitle>
          <CardDescription className="mx-auto mt-2 max-w-sm">
            Start with just one. The morning anchor, or the block that always gets away from you.
          </CardDescription>
        </Card>
      ) : (
        <ul className="mb-6 flex flex-col gap-3">
          {blocks.map((block) => (
            <li key={block.id}>
              <BlockRow
                block={block}
                currentDate={selectedDate}
                onTitleChange={(title) => editBlock(block.id, { title })}
                onTimeChange={(start_time) => editBlock(block.id, { start_time })}
                onDurationChange={(duration_minutes) =>
                  editBlock(block.id, { duration_minutes })
                }
                onToggleDone={() => {
                  const wasDone = block.done;
                  editBlock(block.id, { done: !block.done });
                  if (!wasDone) {
                    const remaining = blocks.filter(
                      (b) => !b.done && b.id !== block.id,
                    ).length;
                    trigger(remaining === 0 ? "day-complete" : "block-done");
                  }
                }}
                onMove={(targetDate) => handleMove(block.id, targetDate)}
                onDelete={() => removeBlock(block.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Add new */}
      <Card className="mb-6">
        <CardEyebrow>Add a block</CardEyebrow>
        <form onSubmit={addFromDraft} className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            type="time"
            value={draftTime}
            onChange={(e) => setDraftTime(e.target.value)}
            className="h-11 w-full rounded-2xl bg-white/[0.04] px-4 text-[15px] text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15 sm:h-12 sm:w-32"
            aria-label="Block time"
          />
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="What's the intent?"
            className="h-11 flex-1 rounded-2xl bg-white/[0.04] px-5 text-[15px] text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15 sm:h-12"
            aria-label="Block title"
          />
          <DurationPicker
            value={draftDuration}
            onChange={setDraftDuration}
            variant="input"
            className="sm:h-12"
          />
          <Button type="submit" disabled={!draftTitle.trim()}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </form>
      </Card>

      {/* Suggestions */}
      {remainingSuggestions.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-fg-subtle">
            <Sparkles className="mr-1 inline-block h-3 w-3" />
            Rhythm ideas
          </p>
          <div className="flex flex-wrap gap-2">
            {remainingSuggestions.map((s) => (
              <button
                key={s.start_time + s.title}
                onClick={() => addSuggestion(s)}
                className="glass group flex items-center gap-2 rounded-full px-4 py-2 text-xs text-fg-muted transition-all hover:bg-white/[0.06] hover:text-fg"
              >
                <span className="font-medium text-fg-subtle group-hover:text-fg-muted">
                  {formatTime12(s.start_time)}
                </span>
                <span>{s.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weekly rhythm template */}
      <div className="mb-8">
        <WeeklyRhythm
          todaysBlocks={blocks.map((b) => ({
            start_time: b.start_time,
            title: b.title,
            duration_minutes: b.duration_minutes,
          }))}
        />
      </div>

      <div className="mt-8 flex justify-center">
        <Link href="/today">
          <Button size="lg" variant="secondary">
            Done designing
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function BlockRow({
  block,
  currentDate,
  onTitleChange,
  onTimeChange,
  onDurationChange,
  onToggleDone,
  onMove,
  onDelete,
}: {
  block: {
    id: string;
    start_time: string;
    title: string;
    done: boolean;
    duration_minutes: DurationMinutes;
  };
  currentDate: string;
  onTitleChange: (title: string) => void;
  onTimeChange: (time: string) => void;
  onDurationChange: (duration: DurationMinutes) => void;
  onToggleDone: () => void;
  onMove: (targetDate: string) => void;
  onDelete: () => void;
}) {
  const [localTitle, setLocalTitle] = useState(block.title);
  const [localTime, setLocalTime] = useState(block.start_time);

  useEffect(() => {
    setLocalTitle(block.title);
  }, [block.title]);
  useEffect(() => {
    setLocalTime(block.start_time);
  }, [block.start_time]);

  const commitTitle = () => {
    const trimmed = localTitle.trim();
    if (trimmed && trimmed !== block.title) onTitleChange(trimmed);
    else setLocalTitle(block.title);
  };
  const commitTime = () => {
    if (localTime && localTime !== block.start_time) onTimeChange(localTime);
  };

  return (
    <div
      className={cn(
        // flex-wrap + order-last on title puts the title on its own full-width
        // row on mobile, then everything reflows to a single row at sm.
        "glass group flex flex-wrap items-center gap-2 rounded-2xl p-2 pl-3 transition-all",
        block.done && "opacity-60",
      )}
    >
      <input
        type="time"
        value={localTime}
        onChange={(e) => setLocalTime(e.target.value)}
        onBlur={commitTime}
        className="h-10 w-[110px] shrink-0 rounded-xl bg-transparent px-2 text-sm tabular-nums text-fg outline-none focus:bg-white/[0.04]"
        aria-label="Block time"
      />
      <input
        type="text"
        value={localTitle}
        onChange={(e) => setLocalTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => e.key === "Enter" && commitTitle()}
        className={cn(
          "h-10 order-last basis-full rounded-xl bg-transparent px-2 text-[15px] text-fg outline-none focus:bg-white/[0.04]",
          "sm:order-none sm:basis-auto sm:flex-1 sm:min-w-0",
          block.done && "line-through decoration-white/20",
        )}
        aria-label="Block title"
      />
      <DurationPicker
        value={block.duration_minutes}
        onChange={onDurationChange}
        variant="pill"
      />
      <button
        onClick={onToggleDone}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
          block.done
            ? "bg-gradient-brand text-black"
            : "border border-white/15 text-fg-subtle hover:border-white/30 hover:text-fg",
        )}
        aria-label={block.done ? "Mark not done" : "Mark done"}
        aria-pressed={block.done}
      >
        <span className="text-xs font-semibold">{block.done ? "✓" : ""}</span>
      </button>
      <BlockActionsMenu
        currentDate={currentDate}
        onMoveToDate={onMove}
        onDelete={onDelete}
      />
    </div>
  );
}

function defaultNextTime(blocks: { start_time: string }[]): string {
  if (blocks.length === 0) return "09:00";
  const last = blocks[blocks.length - 1].start_time;
  const [hh, mm] = last.split(":").map(Number);
  const nextHour = Math.min(23, (hh || 0) + 1);
  return `${String(nextHour).padStart(2, "0")}:${String(mm || 0).padStart(2, "0")}`;
}

function isValidISODate(v: string | null): boolean {
  if (!v) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
}

function formatSelectedDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function headlineLabel(iso: string): string {
  const today = todayISO();
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const [ty, tm, td] = today.split("-").map(Number);
  const todayDt = new Date(ty, tm - 1, td);
  const diffDays = Math.round(
    (dt.getTime() - todayDt.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === -1) return "yesterday, gently";
  if (diffDays === 1) return "tomorrow, gently";
  return `${dt.toLocaleDateString(undefined, { weekday: "long" })}, gently`;
}
