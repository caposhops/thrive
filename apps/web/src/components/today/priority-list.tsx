"use client";

import { useEffect, useState } from "react";
import { Plus, Check } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { Card, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/supabase/use-user";
import {
  fetchTodayPriorities,
  createPriority,
  togglePriority,
  type PriorityRow,
} from "@/lib/supabase/priorities";

type Task = { id: string; text: string; done: boolean };

const seed: Task[] = [
  { id: "1", text: "Five minutes of stillness before opening anything", done: true },
  { id: "2", text: "Ship one small thing toward Thrive", done: false },
  { id: "3", text: "Move the body — walk, stretch, breathe", done: false },
];

const dayKey = () => `thrive:priorities:${new Date().toISOString().slice(0, 10)}`;

const defaultsForNewUser = [
  "Five minutes of stillness before opening anything",
  "Ship one small thing toward something that matters",
  "Move the body — walk, stretch, breathe",
];

export function PriorityList() {
  const { user } = useUser();
  const [localTasks, setLocalTasks] = useLocalStorage<Task[]>(dayKey(), seed);
  const [cloudTasks, setCloudTasks] = useState<PriorityRow[] | null>(null);
  const [draft, setDraft] = useState("");
  const isAuthed = !!user;

  useEffect(() => {
    if (!user) {
      setCloudTasks(null);
      return;
    }
    let cancelled = false;
    (async () => {
      let rows = await fetchTodayPriorities(user.id);
      if (cancelled) return;
      if (rows.length === 0) {
        // Auto-seed today with the 3 defaults so the user sees something
        await Promise.all(
          defaultsForNewUser.map((text, i) => createPriority(user.id, text, i)),
        );
        rows = await fetchTodayPriorities(user.id);
        if (cancelled) return;
      }
      setCloudTasks(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const tasks: Task[] = isAuthed
    ? (cloudTasks ?? []).map((r) => ({ id: r.id, text: r.text, done: r.done }))
    : localTasks;

  const toggle = async (id: string) => {
    if (isAuthed) {
      setCloudTasks((prev) =>
        prev ? prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p)) : prev,
      );
      const current = cloudTasks?.find((p) => p.id === id);
      if (current) await togglePriority(id, !current.done);
    } else {
      setLocalTasks((t) =>
        t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)),
      );
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || tasks.length >= 3) return;
    if (isAuthed && user) {
      const { row } = await createPriority(user.id, text, tasks.length);
      if (row) {
        setCloudTasks((prev) => [...(prev ?? []), row]);
      }
    } else {
      setLocalTasks((t) => [
        ...t,
        { id: crypto.randomUUID(), text, done: false },
      ]);
    }
    setDraft("");
  };

  const completed = tasks.filter((t) => t.done).length;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardEyebrow>Top 3 today</CardEyebrow>
          <CardTitle className="mt-1">What would make today feel complete?</CardTitle>
        </div>
        <div className="shrink-0 rounded-full bg-white/[0.04] px-3 py-1 text-xs text-fg-muted">
          {completed}/{tasks.length}
        </div>
      </div>
      <CardDescription className="mt-1">Three things. Not more. Honor the ceiling.</CardDescription>

      <ul className="mt-6 flex flex-col gap-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              onClick={() => toggle(task.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all",
                "hover:bg-white/[0.04]",
              )}
              aria-pressed={task.done}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  task.done
                    ? "border-transparent bg-gradient-brand"
                    : "border-white/20 group-hover:border-white/40",
                )}
              >
                {task.done && <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} />}
              </span>
              <span
                className={cn(
                  "text-[15px] leading-snug transition-all",
                  task.done ? "text-fg-subtle line-through decoration-white/20" : "text-fg",
                )}
              >
                {task.text}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {tasks.length < 3 && (
        <form onSubmit={add} className="mt-3 flex items-center gap-2">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-2xl bg-white/[0.03] px-3">
            <Plus className="h-4 w-4 text-fg-subtle" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a meaningful priority…"
              className="h-full flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
              aria-label="New priority"
            />
          </div>
        </form>
      )}
    </Card>
  );
}
