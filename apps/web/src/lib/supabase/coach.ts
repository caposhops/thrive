"use client";

import { getBrowserClient } from "./client";

export type CoachRole = "user" | "coach" | "system";

export type CoachMessageRow = {
  id: string;
  role: CoachRole;
  content: string;
  created_at: string;
};

/**
 * Full chat history for the user, oldest first.
 * Capped at the last 200 messages to keep the payload small.
 */
export async function fetchCoachHistory(
  userId: string,
): Promise<CoachMessageRow[]> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("coach_messages")
    .select("id, role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return (data as CoachMessageRow[]).reverse();
}

export async function saveCoachMessage(
  userId: string,
  role: CoachRole,
  content: string,
): Promise<CoachMessageRow | null> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("coach_messages")
    .insert({ user_id: userId, role, content })
    .select("id, role, content, created_at")
    .single();
  if (error || !data) return null;
  return data as CoachMessageRow;
}

/**
 * Clear the user's chat history. Confirmation happens in the UI layer.
 */
export async function clearCoachHistory(userId: string) {
  const supabase = getBrowserClient();
  return supabase.from("coach_messages").delete().eq("user_id", userId);
}
