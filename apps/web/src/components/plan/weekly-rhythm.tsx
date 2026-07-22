"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Copy, ChevronDown, ChevronUp, HardDrive } from "lucide-react";
import { Card, CardEyebrow, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTime12 } from "@/lib/plan-time";
import { useUser } from "@/lib/supabase/use-user";
import {
  fetchAllRecurring,
  createRecurring,
  deleteRecurring,
  type RecurringBlockRow,
} from "@/lib/supabase/recurring";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayLabelsLong = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type CurrentBlock = { start_time: string; title: string };

export function WeeklyRhythm({
  todaysBlocks,
}: {
  todaysBlocks: CurrentBlock[];
}) {
  const { user } = useUser();
  const [expanded, setExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [rows, setRows] = useState<RecurringBlockRow[] | null>(null);
  const [draftTime, setDraftTime] = useState("09:00");
  const [draftTitle, setDraftTitle] = useState("");

  useEffect(() => {
    if (!user || !expanded) return;
    let cancelled = false;
    fetchAllRecurring(user.id).then((r) => {
      if (!cancelled) setRows(r);
    });
    return () => {
      cancelled = true;
    };
  }, [user, expanded]);

  const dayRows = useMemo(
    () => (rows ?? []).filter((r) => r.day_of_week === selectedDay),
    [rows, selectedDay],
  );

  const addDraft = async () => {
    if (!user) return;
    const title = draftTitle.trim();
    if (!title) return;
    const { row } = await createRecurring(user.id, {
      day_of_week: selectedDay,
      start_time: draftTime,
      title,
    });
    if (row) {
      setRows((prev) => [...(prev ?? []), row]);
      setDraftTitle("");
    }
  };

  const remove = async (id: string) => {
    setRows((prev) => (prev ?? []).filter((r) => r.id !== id));
    await deleteRecurring(id);
  };

  const copyTodayInto = async (targetDay: number) => {
    if (!user || todaysBlocks.length === 0) return;
    // Skip any duplicates already recurring on that day
    const existing = new Set(
      (rows ?? [])
        .filter((r) => r.day_of_week === targetDay)
        .map((r) => `${r.start_time}|${r.title}`),
    );
    const toAdd = todaysBlocks.filter(
      (b) => !existing.has(`${b.start_time}|${b.title}`),
    );
    const results = await Promise.all(
      toAdd.map((b) =>
        createRecurring(user.id, {
          day_of_week: targetDay,
          start_time: b.start_time,
          title: b.title,
        }),
      ),
    );
    const newRows = results.map((r) => r.row).filter((r): r is RecurringBlockRow => !!r);
    setRows((prev) => [...(prev ?? []), ...newRows]);
  };

  // Anonymous users see a call-to-action to sign in — recurring blocks
  // require the cloud since they span across days.
  if (!user) {
    return (
      <Card className="glass rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
            <HardDrive className="h-4 w-4 text-fg-subtle" />
          </div>
          <div>
            <CardEyebrow>Weekly rhythm</CardEyebrow>
            <p className="mt-1 font-display text-lg font-semibold text-fg">
              Repeat your rhythm every week.
            </p>
            <CardDescription className="mt-1">
              Sign in to save a template — the same blocks fill in every Monday
              (or Tuesday, or Sunday) automatically.
            </CardDescription>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between text-left"
        aria-expanded={expanded}
      >
        <div>
          <CardEyebrow>Weekly rhythm</CardEyebrow>
          <p className="mt-1 font-display text-lg font-semibold text-fg">
            Every week, repeat these.
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            {rows === null
              ? "Tap to open"
              : rows.length === 0
                ? "No template yet — pick a day to add to"
                : `${rows.length} recurring block${rows.length === 1 ? "" : "s"} across the week`}
          </p>
        </div>
        <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-fg-muted">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {expanded && (
        <div className="mt-6 space-y-5">
          {/* Day-of-week tabs */}
          <div className="flex flex-wrap gap-1.5">
            {dayLabels.map((label, i) => {
              const active = selectedDay === i;
              const count = (rows ?? []).filter((r) => r.day_of_week === i).length;
              return (
                <button
                  key={label}
                  onClick={() => setSelectedDay(i)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 text-xs font-medium transition-all",
                    active
                      ? "bg-gradient-glow text-fg ring-1 ring-white/15"
                      : "text-fg-muted hover:bg-white/[0.04] hover:text-fg",
                  )}
                >
                  <span>{label}</span>
                  <span
                    className={cn(
                      "text-[9px] tabular-nums",
                      active ? "text-fg" : "text-fg-subtle",
                    )}
                  >
                    {count > 0 ? `${count} block${count === 1 ? "" : "s"}` : "—"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected day's recurring blocks */}
          {dayRows.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {dayRows.map((r) => (
                <li
                  key={r.id}
                  className="group flex items-center gap-3 rounded-xl bg-white/[0.03] p-3"
                >
                  <span className="w-20 shrink-0 text-sm tabular-nums text-fg-muted">
                    {formatTime12(r.start_time)}
                  </span>
                  <span className="flex-1 text-[15px] text-fg">{r.title}</span>
                  <button
                    onClick={() => remove(r.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-fg-subtle transition-all hover:bg-rose-500/20 hover:text-rose-300 focus:bg-rose-500/20 focus:text-rose-300 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    aria-label={`Remove ${r.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-white/[0.02] p-3 text-center text-xs text-fg-subtle">
              Nothing recurring on {dayLabelsLong[selectedDay]} yet.
            </p>
          )}

          {/* Inline add form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addDraft();
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="time"
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value)}
              className="h-11 w-full rounded-2xl bg-white/[0.04] px-3 text-sm tabular-nums text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15 sm:w-[110px]"
              aria-label="Recurring block time"
            />
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder={`Every ${dayLabelsLong[selectedDay]}…`}
              className="h-11 flex-1 rounded-2xl bg-white/[0.04] px-4 text-[15px] text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15"
              aria-label="Recurring block title"
            />
            <Button type="submit" size="sm" disabled={!draftTitle.trim()}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>

          {/* Copy today into a day */}
          {todaysBlocks.length > 0 && (
            <div className="rounded-2xl bg-white/[0.02] p-3">
              <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
                <Copy className="mr-1 inline-block h-3 w-3" />
                Save today&apos;s rhythm as recurring
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dayLabels.map((label, i) => (
                  <button
                    key={`copy-${label}`}
                    onClick={() => copyTodayInto(i)}
                    className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-fg-muted transition-colors hover:bg-white/[0.1] hover:text-fg"
                  >
                    → {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-fg-subtle">
            Blocks auto-fill on the morning you open Thrive. Editing today
            doesn&apos;t change the template. Deleting a template block only
            affects future days.
          </p>
        </div>
      )}
    </Card>
  );
}
