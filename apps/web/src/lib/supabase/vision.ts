"use client";

import { getBrowserClient } from "./client";

export type VisionItemRow = {
  id: string;
  board_id: string | null;
  image_url: string;
  prompt: string | null;
  caption: string | null;
  position: number;
  created_at: string;
};

/**
 * Fetch the user's generated vision items (most recent first, capped at 24).
 * Board concept isn't surfaced yet — we keep all items in a flat list and bind
 * them to a default "Generated" board lazily if needed.
 */
export async function fetchGeneratedVisionItems(
  userId: string,
): Promise<VisionItemRow[]> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("vision_items")
    .select("id, board_id, image_url, prompt, caption, position, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(24);
  if (error || !data) return [];
  return data as VisionItemRow[];
}

export async function createVisionItem(
  userId: string,
  fields: { image_url: string; prompt?: string; caption?: string },
) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from("vision_items")
    .insert({
      user_id: userId,
      image_url: fields.image_url,
      prompt: fields.prompt ?? null,
      caption: fields.caption ?? null,
      position: 0,
    })
    .select("id, board_id, image_url, prompt, caption, position, created_at")
    .single();
  return { row: data as VisionItemRow | null, error };
}

export async function deleteVisionItem(id: string) {
  const supabase = getBrowserClient();
  return supabase.from("vision_items").delete().eq("id", id);
}
