"use client";

/**
 * usePlanBlocks — the single source of truth for today's plan blocks.
 * Dual-store: Supabase when signed in, localStorage otherwise.
 * Same API either way so the UI doesn't branch.
 */

import { useCallback, useEffect, useState } from "react";
import { useUser } from "./supabase/use-user";
import {
  fetchTodaysPlan,
  createBlock as cloudCreate,
  updateBlock as cloudUpdate,
  deleteBlock as cloudDelete,
  type PlanBlockRow,
} from "./supabase/plan";
import { materializeToday } from "./supabase/recurring";
import { normalizeTime } from "./plan-time";

export type PlanBlock = {
  id: string;
  start_time: string; // "HH:MM"
  title: string;
  done: boolean;
};

function todayLocalKey(): string {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `thrive:plan:${iso}`;
}

function readLocal(): PlanBlock[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(todayLocalKey());
    if (!raw) return [];
    return JSON.parse(raw) as PlanBlock[];
  } catch {
    return [];
  }
}

function writeLocal(blocks: PlanBlock[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(todayLocalKey(), JSON.stringify(blocks));
}

function fromCloud(row: PlanBlockRow): PlanBlock {
  return {
    id: row.id,
    start_time: normalizeTime(row.start_time),
    title: row.title,
    done: row.done,
  };
}

function sortByTime(blocks: PlanBlock[]): PlanBlock[] {
  return [...blocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export function usePlanBlocks() {
  const { user, loading: authLoading } = useUser();
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthed = !!user;

  // Hydrate on mount and whenever auth state flips
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    (async () => {
      if (user) {
        // Fill in today's blocks from the weekly template if this is the
        // first visit today. No-op after the first call each day.
        await materializeToday(user.id);
        const rows = await fetchTodaysPlan(user.id);
        if (cancelled) return;
        setBlocks(sortByTime(rows.map(fromCloud)));
      } else {
        setBlocks(sortByTime(readLocal()));
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const addBlock = useCallback(
    async (block: { start_time: string; title: string }) => {
      const normalized = { ...block, start_time: normalizeTime(block.start_time) };
      if (isAuthed && user) {
        const { row } = await cloudCreate(user.id, {
          start_time: normalized.start_time,
          title: normalized.title,
        });
        if (row) {
          setBlocks((prev) => sortByTime([...prev, fromCloud(row)]));
        }
      } else {
        const nb: PlanBlock = {
          id: crypto.randomUUID(),
          start_time: normalized.start_time,
          title: normalized.title,
          done: false,
        };
        setBlocks((prev) => {
          const next = sortByTime([...prev, nb]);
          writeLocal(next);
          return next;
        });
      }
    },
    [isAuthed, user],
  );

  const updateLocalBlock = useCallback(
    (id: string, patch: Partial<PlanBlock>) => {
      setBlocks((prev) => {
        const next = sortByTime(
          prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        );
        if (!isAuthed) writeLocal(next);
        return next;
      });
    },
    [isAuthed],
  );

  const editBlock = useCallback(
    async (id: string, patch: Partial<Pick<PlanBlock, "start_time" | "title" | "done">>) => {
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
        if (!isAuthed) writeLocal(next);
        return next;
      });
      if (isAuthed) {
        await cloudDelete(id);
      }
    },
    [isAuthed],
  );

  return { blocks, loading, addBlock, editBlock, removeBlock, isAuthed };
}
