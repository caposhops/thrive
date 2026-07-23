"use client";

/**
 * useFocusTimer — a persistent Pomodoro-style timer.
 *
 * State lives in localStorage so the timer survives page navigation and
 * refreshes. On mount, the hook checks for a saved session and resumes it.
 *
 * When a session completes (either the countdown hits zero or the user
 * stops early), it's logged to Supabase (when signed in) as a focus_session
 * with `completed = true|false`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "./supabase/use-user";
import { logFocusSession } from "./supabase/focus";

const STORAGE_KEY = "thrive:focus";

type PersistedTimer = {
  startedAt: number; // epoch ms of the *original* start
  targetDurationMs: number; // planned length
  label: string | null;
  // Pause bookkeeping
  paused: boolean;
  pausedAt: number | null;
  pausedMsAccumulated: number;
};

type TimerState =
  | { kind: "idle" }
  | {
      kind: "running";
      remainingMs: number;
      label: string | null;
      targetDurationMs: number;
    }
  | {
      kind: "paused";
      remainingMs: number;
      label: string | null;
      targetDurationMs: number;
    };

function readPersisted(): PersistedTimer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedTimer;
  } catch {
    return null;
  }
}

function writePersisted(p: PersistedTimer | null): void {
  if (typeof window === "undefined") return;
  if (p === null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }
}

function computeState(p: PersistedTimer | null, now: number): TimerState {
  if (!p) return { kind: "idle" };
  const elapsed = p.paused && p.pausedAt !== null
    ? p.pausedAt - p.startedAt - p.pausedMsAccumulated
    : now - p.startedAt - p.pausedMsAccumulated;
  const remainingMs = Math.max(0, p.targetDurationMs - elapsed);
  if (p.paused) {
    return {
      kind: "paused",
      remainingMs,
      label: p.label,
      targetDurationMs: p.targetDurationMs,
    };
  }
  return {
    kind: "running",
    remainingMs,
    label: p.label,
    targetDurationMs: p.targetDurationMs,
  };
}

// Web Audio bell — a soft two-note chime with an exponential decay.
function playChime(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [880, 1320]; // A5 then E6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.35;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.5);
    });
    // Close context after the chime finishes to release resources.
    window.setTimeout(() => ctx.close().catch(() => {}), 2200);
  } catch {
    // Audio unavailable — silent failure is fine
  }
}

export function useFocusTimer() {
  const { user } = useUser();
  const [state, setState] = useState<TimerState>({ kind: "idle" });
  const completedRef = useRef(false);

  // Tick loop while a session is active
  useEffect(() => {
    const tick = () => {
      const persisted = readPersisted();
      const next = computeState(persisted, Date.now());
      setState(next);
      // Auto-complete when it hits zero
      if (
        next.kind === "running" &&
        next.remainingMs === 0 &&
        persisted &&
        !completedRef.current
      ) {
        completedRef.current = true;
        void completeSession(true);
      }
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const start = useCallback(
    (opts: { durationMs: number; label?: string | null }) => {
      const durationMs = Math.max(30_000, Math.min(4 * 60 * 60_000, opts.durationMs));
      const persisted: PersistedTimer = {
        startedAt: Date.now(),
        targetDurationMs: durationMs,
        label: opts.label ?? null,
        paused: false,
        pausedAt: null,
        pausedMsAccumulated: 0,
      };
      writePersisted(persisted);
      completedRef.current = false;
      setState(computeState(persisted, Date.now()));
    },
    [],
  );

  const pause = useCallback(() => {
    const persisted = readPersisted();
    if (!persisted || persisted.paused) return;
    const next: PersistedTimer = {
      ...persisted,
      paused: true,
      pausedAt: Date.now(),
    };
    writePersisted(next);
    setState(computeState(next, Date.now()));
  }, []);

  const resume = useCallback(() => {
    const persisted = readPersisted();
    if (!persisted || !persisted.paused || persisted.pausedAt === null) return;
    const pauseDuration = Date.now() - persisted.pausedAt;
    const next: PersistedTimer = {
      ...persisted,
      paused: false,
      pausedAt: null,
      pausedMsAccumulated: persisted.pausedMsAccumulated + pauseDuration,
    };
    writePersisted(next);
    setState(computeState(next, Date.now()));
  }, []);

  const completeSession = useCallback(
    async (didFinish: boolean) => {
      const persisted = readPersisted();
      if (!persisted) return;
      const endedAt = Date.now();
      const elapsedMs = didFinish
        ? persisted.targetDurationMs
        : Math.max(
            0,
            endedAt - persisted.startedAt - persisted.pausedMsAccumulated,
          );
      writePersisted(null);
      setState({ kind: "idle" });

      if (didFinish) {
        playChime();
        try {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Focus complete", {
              body: persisted.label
                ? `${persisted.label} · ${Math.round(elapsedMs / 60000)} min`
                : `${Math.round(elapsedMs / 60000)} minutes done`,
              icon: "/icon.svg",
              tag: "thrive-focus-complete",
            });
          }
        } catch {
          /* ignore */
        }
      }

      if (user) {
        try {
          await logFocusSession(user.id, {
            started_at: new Date(persisted.startedAt).toISOString(),
            ended_at: new Date(endedAt).toISOString(),
            duration_seconds: Math.round(persisted.targetDurationMs / 1000),
            actual_seconds: Math.round(elapsedMs / 1000),
            label: persisted.label ?? undefined,
            completed: didFinish,
          });
        } catch {
          /* silently ignore — timer still worked locally */
        }
      }
    },
    [user],
  );

  const stop = useCallback(() => completeSession(false), [completeSession]);
  const reset = useCallback(() => {
    writePersisted(null);
    setState({ kind: "idle" });
  }, []);

  return { state, start, pause, resume, stop, reset };
}
