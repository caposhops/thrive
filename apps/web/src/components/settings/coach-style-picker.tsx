"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Card, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useUser } from "@/lib/supabase/use-user";
import { fetchCoachStyle, setCoachStyle } from "@/lib/supabase/profile";
import {
  COACH_STYLES,
  DEFAULT_STYLE,
  resolveStyle,
  type CoachStyleKey,
} from "@/lib/coach-styles";

/**
 * Picker for the coach's personality. Cloud-syncs to profiles.coach_style
 * when authed; localStorage fallback for anonymous.
 */
export function CoachStylePicker() {
  const { user } = useUser();
  const [localStyle, setLocalStyle] = useLocalStorage<CoachStyleKey>(
    "thrive:coach:style",
    DEFAULT_STYLE,
  );
  const [cloudStyle, setCloudStyle] = useState<CoachStyleKey | null>(null);
  const [saving, setSaving] = useState<CoachStyleKey | null>(null);
  const [flashSaved, setFlashSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      setCloudStyle(null);
      return;
    }
    let cancelled = false;
    fetchCoachStyle(user.id).then((v) => {
      if (!cancelled) setCloudStyle((v as CoachStyleKey | null) ?? DEFAULT_STYLE);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const active: CoachStyleKey = user ? (cloudStyle ?? DEFAULT_STYLE) : localStyle;

  const pick = async (key: CoachStyleKey) => {
    if (key === active) return;
    setSaving(key);
    setLocalStyle(key); // always update local for offline consistency
    if (user) {
      setCloudStyle(key);
      const { error } = await setCoachStyle(user.id, key);
      if (error) {
        // Roll back cloud state on failure — local still holds
        setCloudStyle(active);
      }
    }
    setSaving(null);
    setFlashSaved(true);
    window.setTimeout(() => setFlashSaved(false), 1500);
  };

  return (
    <Card id="coach">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardEyebrow>Coach voice</CardEyebrow>
          <CardTitle className="mt-1">
            Choose the coach that speaks to you.
          </CardTitle>
          <CardDescription className="mt-1">
            All three use the same underlying model. Only the personality changes.
            Switch anytime — your history stays.
          </CardDescription>
        </div>
        {flashSaved && (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-400/10 px-2.5 py-1 text-[10px] font-medium text-teal-300">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3">
        {Object.values(COACH_STYLES).map((style) => {
          const isActive = active === style.key;
          const isSaving = saving === style.key;
          return (
            <button
              key={style.key}
              onClick={() => pick(style.key)}
              className={cn(
                "group flex items-start gap-3 rounded-2xl p-4 text-left transition-all",
                isActive
                  ? "bg-white/[0.06] ring-1 ring-white/15"
                  : "bg-white/[0.02] hover:bg-white/[0.05]",
              )}
              aria-pressed={isActive}
              disabled={isSaving}
            >
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-glow transition-transform",
                  style.gradient,
                  isActive ? "scale-100" : "scale-95 group-hover:scale-100",
                )}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {style.emoji}
                </span>
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className={cn(
                      "font-display text-base font-semibold",
                      isActive ? "text-fg" : "text-fg-muted",
                    )}
                  >
                    {style.name}
                  </h3>
                  {isActive && (
                    <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-black">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-fg-subtle">{style.tagline}</p>
                <p className="mt-2 rounded-xl bg-white/[0.03] px-3 py-2 text-[13px] italic leading-relaxed text-fg-muted">
                  &ldquo;{style.preview}&rdquo;
                </p>
                <p className="mt-2 text-[11px] text-fg-subtle">
                  Best when: {style.when.toLowerCase()}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {!user && (
        <p className="mt-4 text-[11px] text-fg-subtle">
          Your choice is saved on this device. Sign in to keep the same coach
          across your phone and laptop.
        </p>
      )}

      <p className="mt-3 text-[10px] text-fg-subtle">
        Currently speaking as: <span className="text-fg">{resolveStyle(active).name}</span>
      </p>
    </Card>
  );
}
