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
const ONBOARDING_KEY = "thrive:onboarding";
// A sensible default gap for users who clearly used Thrive before but never
// had their last-opened tracked (feature shipped while they were away).
// 7 days puts them in tier 2 — "You're here. That's the whole thing."
const BACKFILL_LAPSE_DAYS = 7;

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

/**
 * Detect real Thrive activity in localStorage — priorities, plans, reflections,
 * coach messages, vision milestones, etc. `thrive:onboarding` is excluded so a
 * user who just finished onboarding and lands on /today for the first time
 * doesn't get greeted as a returner.
 */
function hasPriorActivity(): boolean {
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (
        key &&
        key.startsWith("thrive:") &&
        key !== LAST_OPENED_KEY &&
        key !== ONBOARDING_KEY
      ) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
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
    } else if (hasPriorActivity()) {
      // Missing last-opened but the user clearly has Thrive history — this
      // happens the first time an existing user opens Thrive after the
      // welcome-back feature ships. Show them a card too; we just don't
      // know the exact gap, so default to tier 2.
      setLapseDays(BACKFILL_LAPSE_DAYS);
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
