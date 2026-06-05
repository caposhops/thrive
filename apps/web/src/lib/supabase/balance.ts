"use client";

import { getBrowserClient } from "./client";
import { todayISO } from "@/lib/streaks";

export type BalanceCategory =
  | "health"
  | "fitness"
  | "career"
  | "finances"
  | "creativity"
  | "mental"
  | "relationships"
  | "purpose"
  | "spirit"
  | "fun";

export type BalanceRating = { category: BalanceCategory; value: number };

/**
 * Fetches the user's most recent rating per category. Each category gets the
 * latest non-null value. Missing categories return undefined in the map.
 */
export async function fetchLatestBalance(
  userId: string,
): Promise<Map<BalanceCategory, number>> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("balance_ratings")
    .select("category, value, rated_on")
    .eq("user_id", userId)
    .order("rated_on", { ascending: false });

  const map = new Map<BalanceCategory, number>();
  if (error || !data) return map;
  for (const row of data) {
    const cat = row.category as BalanceCategory;
    if (!map.has(cat)) {
      map.set(cat, row.value as number);
    }
  }
  return map;
}

/**
 * Upsert today's rating for a single category.
 * Uses (user_id, category, rated_on) unique key from the schema.
 */
export async function upsertTodayRating(
  userId: string,
  category: BalanceCategory,
  value: number,
) {
  const supabase = getBrowserClient();
  return supabase.from("balance_ratings").upsert(
    {
      user_id: userId,
      category,
      value,
      rated_on: todayISO(),
    },
    { onConflict: "user_id,category,rated_on" },
  );
}
