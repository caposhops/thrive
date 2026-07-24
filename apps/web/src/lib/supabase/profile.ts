"use client";

import { getBrowserClient } from "./client";
import type { CoachStyleKey } from "@/lib/coach-styles";

export type ProfileUpdate = {
  display_name?: string;
  intent?: string;
  vision?: string;
  focus_areas?: string[];
  coach_style?: CoachStyleKey;
  onboarded_at?: string;
};

export async function upsertProfile(userId: string, patch: ProfileUpdate) {
  const supabase = getBrowserClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...patch }, { onConflict: "id" });
  return { error };
}

export async function fetchProfile(userId: string) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, intent, vision, focus_areas, coach_style, onboarded_at")
    .eq("id", userId)
    .maybeSingle();
  return { profile: data, error };
}

/**
 * Fast helper for the coach — just the style. Falls back to null if the row
 * or column isn't there (e.g. before the migration lands).
 */
export async function fetchCoachStyle(userId: string): Promise<string | null> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("coach_style")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return (data.coach_style as string | null) ?? null;
}

export async function setCoachStyle(userId: string, style: CoachStyleKey) {
  const supabase = getBrowserClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, coach_style: style }, { onConflict: "id" });
  return { error };
}
