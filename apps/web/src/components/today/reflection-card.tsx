"use client";

import { useEffect, useMemo, useState } from "react";
import { Sunrise, Sun, Moon, Stars, Check, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardEyebrow, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useUser } from "@/lib/supabase/use-user";
import {
  fetchTodayReflection,
  upsertReflection,
  fetchRecentReflections,
  type DayReflectionRow,
} from "@/lib/supabase/plan";
import { pickPromptForNow, timeOfDay } from "@/lib/reflection-prompts";

/**
 * Daily reflection. Always available. Rotating prompt by time-of-day.
 * Autosaves. Recent entries expandable below.
 */

const feelings: { emoji: string; label: string; value: 1 | 2 | 3 | 4 | 5 }[] = [
  { emoji: "🌧️", label: "Hard", value: 1 },
  { emoji: "🌫️", label: "Foggy", value: 2 },
  { emoji: "🌤️", label: "Okay", value: 3 },
  { emoji: "☀️", label: "Good", value: 4 },
  { emoji: "✨", label: "Beautiful", value: 5 },
];

const localKey = () => `thrive:reflection:${new Date().toISOString().slice(0, 10)}`;

type LocalReflection = { text: string; mood: number | null; savedAt: string };

function IconForWindow({ window }: { window: ReturnType<typeof timeOfDay> }) {
  const cls = "mr-1 inline-block h-3 w-3";
  if (window === "morning") return <Sunrise className={cls} />;
  if (window === "midday") return <Sun className={cls} />;
  if (window === "evening") return <Moon className={cls} />;
  return <Stars className={cls} />;
}

export function ReflectionCard() {
  const { user } = useUser();
  const [now, setNow] = useState<Date | null>(null);
  const [local, setLocal] = useLocalStorage<LocalReflection>(localKey(), {
    text: "",
    mood: null,
    savedAt: "",
  });
  const [cloudLoaded, setCloudLoaded] = useState(!user);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [history, setHistory] = useState<DayReflectionRow[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) {
      setCloudLoaded(true);
      setHistory([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const row = await fetchTodayReflection(user.id);
      if (cancelled) return;
      if (row) {
        setLocal({
          text: row.reflection ?? "",
          mood: row.mood_after,
          savedAt: row.updated_at,
        });
      }
      const recent = await fetchRecentReflections(user.id, 8);
      if (cancelled) return;
      const today = new Date().toISOString().slice(0, 10);
      setHistory(recent.filter((r) => r.for_date !== today));
      setCloudLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, setLocal]);

  const promptInfo = useMemo(() => pickPromptForNow(now ?? new Date()), [now]);

  if (!cloudLoaded || !now) return null;

  const save = async (patch: Partial<LocalReflection>) => {
    const next = { ...local, ...patch, savedAt: new Date().toISOString() };
    setLocal(next);
    if (user) {
      setSaving(true);
      await upsertReflection(user.id, {
        reflection: next.text,
        mood_after: next.mood ?? undefined,
      });
      setSaving(false);
    }
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardEyebrow>
            <IconForWindow window={promptInfo.window} />
            {promptInfo.label}
          </CardEyebrow>
          <p className="mt-1 font-display text-xl font-semibold leading-tight tracking-tight text-fg sm:text-2xl">
            {promptInfo.prompt}
          </p>
          <CardDescription className="mt-1">
            Thirty seconds. No wrong answers. Just notice.
          </CardDescription>
        </div>
        {savedFlash && (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-400/10 px-2.5 py-1 text-[10px] font-medium text-teal-300">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        {feelings.map((f) => (
          <button
            key={f.value}
            onClick={() => save({ mood: f.value })}
            className={cn(
              "group flex flex-1 flex-col items-center gap-1.5 rounded-2xl p-3 transition-all",
              local.mood === f.value
                ? "bg-gradient-glow ring-1 ring-white/15"
                : "hover:bg-white/[0.04]",
            )}
            aria-label={f.label}
            aria-pressed={local.mood === f.value}
          >
            <span
              className={cn(
                "text-2xl transition-transform",
                local.mood === f.value ? "scale-110" : "group-hover:scale-105",
              )}
            >
              {f.emoji}
            </span>
            <span
              className={cn(
                "text-[10px] font-medium tracking-wide",
                local.mood === f.value ? "text-fg" : "text-fg-subtle",
              )}
            >
              {f.label}
            </span>
          </button>
        ))}
      </div>

      <textarea
        value={local.text}
        onChange={(e) => setLocal({ ...local, text: e.target.value })}
        onBlur={() => save({ text: local.text })}
        placeholder="Type freely — Thrive keeps it safe."
        rows={3}
        className="mt-5 w-full resize-none rounded-2xl bg-white/[0.03] p-4 text-[15px] leading-relaxed text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15"
      />
      {saving && (
        <p className="mt-2 text-[10px] text-fg-subtle">Saving to your account…</p>
      )}

      {history.length > 0 && (
        <div className="mt-6 border-t border-white/[0.06] pt-4">
          <button
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 rounded-xl px-1 py-1 text-left text-xs font-medium text-fg-muted transition-colors hover:text-fg"
            aria-expanded={historyOpen}
          >
            <span>
              Recent reflections{" "}
              <span className="text-fg-subtle">({history.length})</span>
            </span>
            {historyOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          {historyOpen && (
            <ul className="mt-3 flex flex-col gap-2">
              {history.map((r) => {
                const isExpanded = expanded.has(r.id);
                const text = r.reflection ?? "";
                const mood = feelings.find((f) => f.value === r.mood_after);
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => toggleExpand(r.id)}
                      className="w-full rounded-xl bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-fg-subtle">
                        <span className="font-medium text-fg-muted">
                          {formatDayLabel(r.for_date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {mood && <span title={mood.label}>{mood.emoji}</span>}
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-1.5 text-[13px] leading-snug text-fg",
                          !isExpanded && "line-clamp-2",
                        )}
                      >
                        {text}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (date.toDateString() === yest.toDateString()) return "Yesterday";
  const diffDays = Math.round(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
