"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Card, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  isCompletionSoundMuted,
  setCompletionSoundMuted,
  playTap,
} from "@/lib/completion-sound";

/**
 * Global mute for completion chimes (block done, priority done, habit done,
 * focus complete). Does NOT affect the focus-timer bell — that's tied to the
 * session ending and needs to be audible for the feature to work.
 */
export function SoundToggle() {
  const [muted, setMuted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMuted(isCompletionSoundMuted());
    setHydrated(true);
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setCompletionSoundMuted(next);
    if (!next) playTap(); // preview the sound when unmuting
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <CardEyebrow>Sound</CardEyebrow>
          <CardTitle className="mt-1">Completion chimes</CardTitle>
          <CardDescription className="mt-1">
            A soft tone when you mark something done or finish a focus session.
            The focus-timer bell at the end of a session isn&apos;t affected — that
            one is the whole point.
          </CardDescription>
        </div>
        {hydrated && (
          <button
            onClick={toggle}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all",
              muted
                ? "bg-white/[0.05] text-fg-subtle hover:bg-white/[0.08]"
                : "bg-gradient-brand text-black shadow-glow hover:brightness-110",
            )}
            aria-label={muted ? "Unmute completion sounds" : "Mute completion sounds"}
            aria-pressed={muted}
            title={muted ? "Sounds off" : "Sounds on"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        )}
      </div>
    </Card>
  );
}
