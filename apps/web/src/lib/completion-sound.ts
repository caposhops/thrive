"use client";

/**
 * Soft completion chimes — separate from the focus-timer bell.
 * Web Audio API only; no external files.
 *
 * A user preference (localStorage) lets people mute all completion sounds
 * without affecting the focus-timer chime.
 */

const MUTE_KEY = "thrive:sound:completion-muted";

export function isCompletionSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setCompletionSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  if (muted) window.localStorage.setItem(MUTE_KEY, "1");
  else window.localStorage.removeItem(MUTE_KEY);
}

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sharedCtx) return sharedCtx;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    sharedCtx = new AudioCtx();
    return sharedCtx;
  } catch {
    return null;
  }
}

/**
 * A single soft "tap" tone — used for individual completions
 * (a block done, a priority checked, a habit toggled).
 */
export function playTap(): void {
  if (isCompletionSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1046.5; // C6 — bright but soft
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch {
    /* ignore */
  }
}

/**
 * A two-note "the day is honored" chord — used only for the day-100% moment.
 * Slightly bigger than a tap, still restrained.
 */
export function playDayComplete(): void {
  if (isCompletionSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const freqs = [523.25, 783.99]; // C5 + G5, a fifth apart
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.7);
    });
  } catch {
    /* ignore */
  }
}
