"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Bell,
  BellOff,
  ArrowRight,
  Cloud,
  HardDrive,
  Sparkles,
} from "lucide-react";
import { Card, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, today } from "@/lib/utils";
import { usePlanBlocks } from "@/lib/use-plan-blocks";
import { formatTime12 } from "@/lib/plan-time";
import {
  permissionState,
  requestPermission,
  scheduleAll,
} from "@/lib/plan-notifications";

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
  const { blocks, loading, addBlock, editBlock, removeBlock, isAuthed } =
    usePlanBlocks();
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [draftTime, setDraftTime] = useState(defaultNextTime(blocks));
  const [draftTitle, setDraftTitle] = useState("");

  useEffect(() => {
    setPermission(permissionState());
  }, []);

  useEffect(() => {
    scheduleAll(
      blocks
        .filter((b) => !b.done)
        .map((b) => ({ id: b.id, start_time: b.start_time, title: b.title })),
    );
  }, [blocks]);

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
    await addBlock({ start_time: draftTime, title });
    setDraftTitle("");
    setDraftTime(defaultNextTime([...blocks, { id: "", start_time: draftTime, title, done: false }]));
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
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Design your rhythm</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Shape today, gently.
        </h1>
        <p className="mt-3 text-fg-muted">
          {today()} · pick 3&ndash;5 moments. Rough times, not rigid slots.
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
      </header>

      {/* Notifications banner */}
      {permission === "default" && blocks.length > 0 && (
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
      {permission === "denied" && (
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
                onTitleChange={(title) => editBlock(block.id, { title })}
                onTimeChange={(start_time) => editBlock(block.id, { start_time })}
                onToggleDone={() => editBlock(block.id, { done: !block.done })}
                onDelete={() => removeBlock(block.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Add new */}
      <Card className="mb-6">
        <CardEyebrow>Add a block</CardEyebrow>
        <form onSubmit={addFromDraft} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="time"
            value={draftTime}
            onChange={(e) => setDraftTime(e.target.value)}
            className="h-12 w-full rounded-2xl bg-white/[0.04] px-4 text-[15px] text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15 sm:w-32"
            aria-label="Block time"
          />
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="What's the intent?"
            className="h-12 flex-1 rounded-2xl bg-white/[0.04] px-5 text-[15px] text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15"
            aria-label="Block title"
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
  onTitleChange,
  onTimeChange,
  onToggleDone,
  onDelete,
}: {
  block: { id: string; start_time: string; title: string; done: boolean };
  onTitleChange: (title: string) => void;
  onTimeChange: (time: string) => void;
  onToggleDone: () => void;
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
        "glass group flex items-center gap-2 rounded-2xl p-2 pl-3 transition-all",
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
          "h-10 flex-1 min-w-0 rounded-xl bg-transparent px-2 text-[15px] text-fg outline-none focus:bg-white/[0.04]",
          block.done && "line-through decoration-white/20",
        )}
        aria-label="Block title"
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
      <button
        onClick={onDelete}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-fg-subtle transition-all hover:bg-rose-500/20 hover:text-rose-300 focus:bg-rose-500/20 focus:text-rose-300 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        aria-label="Delete block"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
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
