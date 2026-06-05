"use client";

import { getBrowserClient } from "./client";

export type ProfileUpdate = {
  display_name?: string;
  intent?: string;
  vision?: string;
  focus_areas?: string[];
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
    .select("display_name, intent, vision, focus_areas, onboarded_at")
    .eq("id", userId)
    .maybeSingle();
  return { profile: data, error };
}
