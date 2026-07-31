"use client";

/**
 * Detects how many calendar days have passed since the user last opened
 * Thrive. Used to render a warm welcome-back card without shame math.
 *
 * On every mount:
 *  - reads thrive:last-opened
 *  - computes calendar-day gap
 *  - writes today's ISO date back
 *
 * Consumers should render a welcome-back UI only when lapseDays >= 2
 * (i.e. the user missed at least one full day). Same-day opens and
 * back-to-back days feel normal and don't get called out.
 */

import { useEffect, useState } from "react";

const LAST_OPENED_KEY = "thrive:last-opened";

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calendarDaysBetween(pastISO: string, todayISO: string): number {
  const [py, pm, pd] = pastISO.split("-").map(Number);
  const [ty, tm, td] = todayISO.split("-").map(Number);
  const past = new Date(py, pm - 1, pd);
  const today = new Date(ty, tm - 1, td);
  return Math.floor(
    (today.getTime() - past.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function useLapse() {
  const [lapseDays, setLapseDays] = useState<number>(0);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const todayISO = isoDay(new Date());
    let prev: string | null = null;
    try {
      prev = window.localStorage.getItem(LAST_OPENED_KEY);
    } catch {
      prev = null;
    }

    if (prev && /^\d{4}-\d{2}-\d{2}$/.test(prev)) {
      const gap = calendarDaysBetween(prev, todayISO);
      // Only positive gaps count — clock skew (or a user rewinding their
      // system time) should not accidentally trigger the welcome card.
      setLapseDays(gap > 0 ? gap : 0);
    } else {
      // First-ever visit: no lapse to celebrate or forgive.
      setLapseDays(0);
    }

    try {
      window.localStorage.setItem(LAST_OPENED_KEY, todayISO);
    } catch {
      /* ignore */
    }

    setReady(true);
  }, []);

  const dismiss = () => setDismissed(true);

  return { lapseDays, ready, dismissed, dismiss };
}
