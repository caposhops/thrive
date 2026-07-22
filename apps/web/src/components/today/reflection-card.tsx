"use client";

import { useEffect, useState } from "react";
import { Moon, Check } from "lucide-react";
import { Card, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useUser } from "@/lib/supabase/use-user";
import { fetchTodayReflection, upsertReflection } from "@/lib/supabase/plan";

/**
 * End-of-day reflection prompt. Appears from 6pm onward.
 * 30 seconds. No wrong answers. Not shameful.
 */

const AFTER_HOUR = 18; // 6pm

const feelings: { emoji: string; label: string; value: 1 | 2 | 3 | 4 | 5 }[] = [
  { emoji: "🌧️", label: "Hard", value: 1 },
  { emoji: "🌫️", label: "Foggy", value: 2 },
  { emoji: "🌤️", label: "Okay", value: 3 },
  { emoji: "☀️", label: "Good", value: 4 },
  { emoji: "✨", label: "Beautiful", value: 5 },
];

const localKey = () => `thrive:reflection:${new Date().toISOString().slice(0, 10)}`;

type LocalReflection = { text: string; mood: number | null; savedAt: string };

export function ReflectionCard() {
  const { user } = useUser();
  const [hour, setHour] = useState<number | null>(null);
  const [local, setLocal] = useLocalStorage<LocalReflection>(localKey(), {
    text: "",
    mood: null,
    savedAt: "",
  });
  const [cloudLoaded, setCloudLoaded] = useState(!user);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setHour(new Date().getHours());
    const id = window.setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Hydrate from cloud when signed in
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchTodayReflection(user.id).then((row) => {
      if (cancelled) return;
      if (row) {
        setLocal({
          text: row.reflection ?? "",
          mood: row.mood_after,
          savedAt: row.updated_at,
        });
      }
      setCloudLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user, setLocal]);

  if (hour === null || hour < AFTER_HOUR) return null;
  if (!cloudLoaded) return null;

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

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-indigo-500/25 blur-3xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardEyebrow>
            <Moon className="mr-1 inline-block h-3 w-3" />
            Evening reflection
          </CardEyebrow>
          <CardTitle className="mt-1">How was the shape of today?</CardTitle>
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
        placeholder="What flowed? What slipped? What surprised you?"
        rows={3}
        className="mt-5 w-full resize-none rounded-2xl bg-white/[0.03] p-4 text-[15px] leading-relaxed text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15"
      />
      {saving && (
        <p className="mt-2 text-[10px] text-fg-subtle">Saving to your account…</p>
      )}
    </Card>
  );
}
