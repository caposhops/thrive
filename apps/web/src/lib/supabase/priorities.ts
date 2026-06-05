"use client";

import { getBrowserClient } from "./client";
import { todayISO } from "@/lib/streaks";

export type PriorityRow = {
  id: string;
  text: string;
  done: boolean;
  position: number;
};

export async function fetchTodayPriorities(userId: string): Promise<PriorityRow[]> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("priorities")
    .select("id, text, done, position")
    .eq("user_id", userId)
    .eq("for_date", todayISO())
    .order("position", { ascending: true });
  if (error || !data) return [];
  return data as PriorityRow[];
}

export async function createPriority(
  userId: string,
  text: string,
  position: number,
) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("priorities")
    .insert({
      user_id: userId,
      text,
      position,
      for_date: todayISO(),
    })
    .select("id, text, done, position")
    .single();
  return { row: data as PriorityRow | null, error };
}

export async function togglePriority(id: string, done: boolean) {
  const supabase = getBrowserClient();
  return supabase.from("priorities").update({ done }).eq("id", id);
}
