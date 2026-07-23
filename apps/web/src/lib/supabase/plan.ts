"use client";

import { getBrowserClient } from "./client";
import { todayISO } from "@/lib/streaks";

export type PlanBlockRow = {
  id: string;
  for_date: string;
  start_time: string; // "HH:MM:SS" from Postgres time type
  duration_minutes: number | null;
  title: string;
  notes: string | null;
  done: boolean;
  position: number;
  created_at: string;
};

export type DayReflectionRow = {
  id: string;
  for_date: string;
  reflection: string | null;
  mood_after: number | null;
  updated_at: string;
};

const SELECT_COLS =
  "id, for_date, start_time, duration_minutes, title, notes, done, position, created_at";

export async function fetchTodaysPlan(userId: string): Promise<PlanBlockRow[]> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("plan_blocks")
    .select(SELECT_COLS)
    .eq("user_id", userId)
    .eq("for_date", todayISO())
    .order("start_time", { ascending: true });
  if (error || !data) return [];
  return data as PlanBlockRow[];
}

export async function createBlock(
  userId: string,
  block: {
    start_time: string;
    title: string;
    notes?: string;
    position?: number;
    duration_minutes?: number | null;
  },
) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("plan_blocks")
    .insert({
      user_id: userId,
      for_date: todayISO(),
      start_time: block.start_time,
      duration_minutes: block.duration_minutes ?? null,
      title: block.title,
      notes: block.notes ?? null,
      position: block.position ?? 0,
    })
    .select(SELECT_COLS)
    .single();
  return { row: data as PlanBlockRow | null, error };
}

export async function updateBlock(
  id: string,
  patch: Partial<
    Pick<
      PlanBlockRow,
      "start_time" | "duration_minutes" | "title" | "notes" | "done" | "position"
    >
  >,
) {
  const supabase = getBrowserClient();
  return supabase.from("plan_blocks").update(patch).eq("id", id);
}

export async function deleteBlock(id: string) {
  const supabase = getBrowserClient();
  return supabase.from("plan_blocks").delete().eq("id", id);
}

export async function fetchTodayReflection(
  userId: string,
): Promise<DayReflectionRow | null> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("day_reflections")
    .select("id, for_date, reflection, mood_after, updated_at")
    .eq("user_id", userId)
    .eq("for_date", todayISO())
    .maybeSingle();
  if (error) return null;
  return (data as DayReflectionRow | null) ?? null;
}

export async function upsertReflection(
  userId: string,
  fields: { reflection?: string; mood_after?: number },
) {
  const supabase = getBrowserClient();
  return supabase.from("day_reflections").upsert(
    {
      user_id: userId,
      for_date: todayISO(),
      reflection: fields.reflection ?? null,
      mood_after: fields.mood_after ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,for_date" },
  );
}

export async function fetchRecentReflections(
  userId: string,
  limit = 7,
): Promise<DayReflectionRow[]> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("day_reflections")
    .select("id, for_date, reflection, mood_after, updated_at")
    .eq("user_id", userId)
    .not("reflection", "is", null)
    .order("for_date", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as DayReflectionRow[]).filter(
    (r) => (r.reflection ?? "").trim().length > 0,
  );
}
