"use client";

import { useEffect, useState } from "react";
import { Cloud, HardDrive } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { Card, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/supabase/use-user";
import { fetchTodayMood, setTodayMood, type MoodValue } from "@/lib/supabase/moods";

const moods = [
  { emoji: "🌧️", label: "Heavy", value: 1 },
  { emoji: "🌫️", label: "Foggy", value: 2 },
  { emoji: "🌤️", label: "Steady", value: 3 },
  { emoji: "☀️", label: "Bright", value: 4 },
  { emoji: "✨", label: "Radiant", value: 5 },
] as const;

const todayKey = () => `thrive:mood:${new Date().toISOString().slice(0, 10)}`;

export function MoodCheckin() {
  const { user } = useUser();
  // localStorage is the always-on fallback. When authed we also write to Supabase.
  const [local, setLocal] = useLocalStorage<MoodValue | null>(todayKey(), null);
  const [cloud, setCloud] = useState<MoodValue | null>(null);
  const [cloudHydrated, setCloudHydrated] = useState(false);

  useEffect(() => {
    if (!user) {
      setCloud(null);
      setCloudHydrated(false);
      return;
    }
    let cancelled = false;
    fetchTodayMood(user.id).then((value) => {
      if (!cancelled) {
        setCloud(value);
        setCloudHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const selected = user && cloudHydrated ? cloud : local;

  const pick = async (value: MoodValue) => {
    setLocal(value); // optimistic + offline fallback
    if (user) {
      setCloud(value);
      const { error } = await setTodayMood(user.id, value);
      if (error) {
        // Roll back cloud-only state on failure; local copy stays.
        setCloud(null);
      }
    }
  };

  return (
    <Card className="hover:bg-white/[0.05]">
      <div className="flex items-start justify-between">
        <div>
          <CardEyebrow>Morning check-in</CardEyebrow>
          <CardTitle className="mt-1">How are you arriving today?</CardTitle>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] tracking-wide",
            user ? "text-teal-300" : "text-fg-subtle",
          )}
          title={user ? "Synced to your account" : "Saved on this device"}
        >
          {user ? (
            <>
              <Cloud className="h-2.5 w-2.5" />
              Synced
            </>
          ) : (
            <>
              <HardDrive className="h-2.5 w-2.5" />
              Local
            </>
          )}
        </span>
      </div>
      <CardDescription className="mt-1">
        No wrong answers. Just notice.
      </CardDescription>
      <div className="mt-6 flex items-center justify-between gap-2">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => pick(mood.value)}
            className={cn(
              "group flex flex-1 flex-col items-center gap-1.5 rounded-2xl p-3 transition-all",
              selected === mood.value
                ? "bg-gradient-glow ring-1 ring-white/15"
                : "hover:bg-white/[0.04]",
            )}
            aria-label={mood.label}
            aria-pressed={selected === mood.value}
          >
            <span
              className={cn(
                "text-3xl transition-transform",
                selected === mood.value ? "scale-110" : "group-hover:scale-105",
              )}
            >
              {mood.emoji}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium tracking-wide transition-colors",
                selected === mood.value ? "text-fg" : "text-fg-subtle",
              )}
            >
              {mood.label}
            </span>
          </button>
        ))}
      </div>
      {selected !== null && (
        <p className="mt-5 rounded-2xl bg-white/[0.03] p-4 text-sm text-fg-muted">
          {selected <= 2 &&
            "Heavy days are part of the journey. One small kind thing for yourself today."}
          {selected === 3 && "Steady is a gift. Let's keep the rhythm gentle."}
          {selected >= 4 && "Beautiful. Carry that light into one thing that matters."}
        </p>
      )}
    </Card>
  );
}
