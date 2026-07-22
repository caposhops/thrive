"use client";

/**
 * Schedules in-page browser notifications for upcoming block transitions.
 * Fires 5 minutes before each block starts.
 *
 * Limitations:
 *   - Only fires while the tab is open. For true background notifications
 *     we'd need a service worker + Push API + VAPID keys. Future work.
 *   - Requires the user to have granted Notification permission.
 */

import { timeToMinutes, formatTime12, nowMinutes } from "./plan-time";

export type ScheduledBlock = { id: string; start_time: string; title: string };

const LEAD_MINUTES = 5;
const activeTimeouts = new Map<string, number>();

export function permissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return await Notification.requestPermission();
}

/** Cancel all pending scheduled notifications. */
export function clearAllScheduled(): void {
  for (const [, id] of activeTimeouts) {
    window.clearTimeout(id);
  }
  activeTimeouts.clear();
}

/**
 * (Re)schedule notifications for a list of blocks. Idempotent — safe to call
 * repeatedly when blocks change.
 */
export function scheduleAll(blocks: ScheduledBlock[]): void {
  if (typeof window === "undefined") return;
  clearAllScheduled();
  if (permissionState() !== "granted") return;

  const nowM = nowMinutes();
  for (const block of blocks) {
    const targetM = timeToMinutes(block.start_time) - LEAD_MINUTES;
    const deltaMin = targetM - nowM;
    if (deltaMin <= 0) continue; // already passed
    if (deltaMin > 12 * 60) continue; // more than 12h away, don't bother

    const timeoutId = window.setTimeout(
      () => fireNotification(block),
      deltaMin * 60 * 1000,
    );
    activeTimeouts.set(block.id, timeoutId);
  }
}

function fireNotification(block: ScheduledBlock) {
  try {
    new Notification("In 5 minutes", {
      body: `${block.title} · at ${formatTime12(block.start_time)}`,
      icon: "/icon.svg",
      tag: `thrive-block-${block.id}`,
      silent: false,
    });
  } catch {
    // Some browsers throw if the tab is fully hidden — swallow silently
  }
}
