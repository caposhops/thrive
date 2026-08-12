"use client";

/**
 * usePlanBlocks — single source of truth for the plan blocks of a given date.
 * Dual-store: Supabase when signed in, localStorage otherwise.
 * Same API either way so the UI doesn't branch.
 *
 * Defaults to today's date; pass a `forDate` (YYYY-MM-DD) to plan any other day.
 */

import { useCallback, useEffect, useState } from "react";
import { useUser } from "./supabase/use-user";
import {
  fetchPlanForDate,
  createBlock as cloudCreate,
  updateBlock as cloudUpdate,
  deleteBlock as cloudDelete,
  type PlanBlockRow,
} from "./supabase/plan";
import { materializeToday } from "./supabase/recurring";
import { normalizeTime } from "./plan-time";
import { todayISO } from "./streaks";

export type PlanBlock = {
  id: string;
  start_time: string; // "HH:MM"
  duration_minutes: number | null;
  title: string;
  done: boolean;
};

function localKey(forDate: string): string {
  return `thrive:plan:${forDate}`;
}

function readLocal(forDate: string): PlanBlock[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(localKey(forDate));
    if (!raw) return [];
    return JSON.parse(raw) as PlanBlock[];
  } catch {
    return [];
  }
}

function writeLocal(forDate: string, blocks: PlanBlock[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(localKey(forDate), JSON.stringify(blocks));
}

function fromCloud(row: PlanBlockRow): PlanBlock {
  return {
    id: row.id,
    start_time: normalizeTime(row.start_time),
    duration_minutes: row.duration_minutes,
    title: row.title,
    done: row.done,
  };
}

/**
 * View-independent move: works for cloud + local, no React state involved.
 * The hook's moveBlockDate uses this after updating its local list; undo
 * flows can call it directly from anywhere without needing a hook bound to
 * either the source or target date.
 */
export async function moveBlockBetweenDates(args: {
  id: string;
  block: PlanBlock;
  fromDate: string;
  toDate: string;
  isAuthed: boolean;
}): Promise<void> {
  const { id, block, fromDate, toDate, isAuthed } = args;
  if (fromDate === toDate) return;
  if (isAuthed) {
    await cloudUpdate(id, { for_date: toDate });
    return;
  }
  // Local storage: remove from source key, append to target key
  const fromList = readLocal(fromDate).filter((b) => b.id !== id);
  writeLocal(fromDate, fromList);
  const toList = readLocal(toDate);
  writeLocal(toDate, sortByTime([...toList, block]));
}

function sortByTime(blocks: PlanBlock[]): PlanBlock[] {
  return [...blocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export function usePlanBlocks(forDate?: string) {
  const effectiveDate = forDate ?? todayISO();
  const isToday = effectiveDate === todayISO();
  const { user, loading: authLoading } = useUser();
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthed = !!user;

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      if (user) {
        // Only materialize today's recurring template. Future dates get
        // filled in when they arrive.
        if (isToday) {
          await materializeToday(user.id);
        }
        const rows = await fetchPlanForDate(user.id, effectiveDate);
        if (cancelled) return;
        setBlocks(sortByTime(rows.map(fromCloud)));
      } else {
        setBlocks(sortByTime(readLocal(effectiveDate)));
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, effectiveDate, isToday]);

  const addBlock = useCallback(
    async (block: {
      start_time: string;
      title: string;
      duration_minutes?: number | null;
    }) => {
      const normalized = { ...block, start_time: normalizeTime(block.start_time) };
      const durationMinutes = normalized.duration_minutes ?? null;
      if (isAuthed && user) {
        const { row } = await cloudCreate(user.id, {
          start_time: normalized.start_time,
          title: normalized.title,
          duration_minutes: durationMinutes,
          for_date: effectiveDate,
        });
        if (row) {
          setBlocks((prev) => sortByTime([...prev, fromCloud(row)]));
        }
      } else {
        const nb: PlanBlock = {
          id: crypto.randomUUID(),
          start_time: normalized.start_time,
          duration_minutes: durationMinutes,
          title: normalized.title,
          done: false,
        };
        setBlocks((prev) => {
          const next = sortByTime([...prev, nb]);
          writeLocal(effectiveDate, next);
          return next;
        });
      }
    },
    [isAuthed, user, effectiveDate],
  );

  const updateLocalBlock = useCallback(
    (id: string, patch: Partial<PlanBlock>) => {
      setBlocks((prev) => {
        const next = sortByTime(
          prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        );
        if (!isAuthed) writeLocal(effectiveDate, next);
        return next;
      });
    },
    [isAuthed, effectiveDate],
  );

  const editBlock = useCallback(
    async (
      id: string,
      patch: Partial<
        Pick<PlanBlock, "start_time" | "duration_minutes" | "title" | "done">
      >,
    ) => {
      const normalizedPatch = patch.start_time
        ? { ...patch, start_time: normalizeTime(patch.start_time) }
        : patch;
      updateLocalBlock(id, normalizedPatch);
      if (isAuthed) {
        await cloudUpdate(id, normalizedPatch);
      }
    },
    [isAuthed, updateLocalBlock],
  );

  const removeBlock = useCallback(
    async (id: string) => {
      setBlocks((prev) => {
        const next = prev.filter((b) => b.id !== id);
        if (!isAuthed) writeLocal(effectiveDate, next);
        return next;
      });
      if (isAuthed) {
        await cloudDelete(id);
      }
    },
    [isAuthed, effectiveDate],
  );

  /**
   * Move a block from the current view's date onto a different date. Removes
   * it from the visible list optimistically. For local mode, mutates both
   * the source day's key AND the target day's key so the block reappears on
   * the target date's plan. For cloud mode, updates the row's for_date.
   */
  const moveBlockDate = useCallback(
    async (id: string, targetDate: string) => {
      if (targetDate === effectiveDate) return;
      const moving = blocks.find((b) => b.id === id);
      if (!moving) return;
      // Optimistic UI: drop it from the current view immediately
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      await moveBlockBetweenDates({
        id,
        block: moving,
        fromDate: effectiveDate,
        toDate: targetDate,
        isAuthed,
      });
    },
    [blocks, isAuthed, effectiveDate],
  );

  return {
    blocks,
    loading,
    addBlock,
    editBlock,
    removeBlock,
    moveBlockDate,
    isAuthed,
    forDate: effectiveDate,
    isToday,
  };
}
