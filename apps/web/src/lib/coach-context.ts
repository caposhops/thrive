"use client";

/**
 * Assembles a compact "who this person is right now" snapshot to hand to the
 * coach on every message. The coach uses this to say things like:
 *
 *   "You had 3 blocks today, only Morning Stillness got done — what happened
 *   around 2pm?"
 *
 * instead of the generic reflection prompt it would otherwise offer.
 *
 * Kept tight (~200 tokens) so it doesn't inflate cost meaningfully. Only
 * runs client-side when the user is authenticated; anonymous users get the
 * base coach with no personalization.
 */

import { getBrowserClient } from "./supabase/client";
import { todayISO } from "./streaks";
import { formatTime12, normalizeTime } from "./plan-time";

export type CoachContext = {
  profile?: {
    name?: string;
    intent?: string;
    focus_areas?: string[];
  };
  today: {
    date: string;
    mood?: { value: number; label: string };
    blocks: Array<{ time: string; title: string; done: boolean }>;
    priorities: Array<{ text: string; done: boolean }>;
  };
  recent_reflection?: {
    for_date: string;
    text: string;
  };
};

const MOOD_LABELS: Record<number, string> = {
  1: "heavy",
  2: "foggy",
  3: "steady",
  4: "bright",
  5: "radiant",
};

export async function fetchCoachContext(userId: string): Promise<CoachContext> {
  const supabase = getBrowserClient();
  const today = todayISO();
  const startOfDay = `${today}T00:00:00.000Z`;

  const [profileRes, moodRes, blocksRes, prioritiesRes, reflectionRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, intent, focus_areas")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("mood_checkins")
        .select("value")
        .eq("user_id", userId)
        .gte("created_at", startOfDay)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("plan_blocks")
        .select("start_time, title, done")
        .eq("user_id", userId)
        .eq("for_date", today)
        .order("start_time", { ascending: true }),
      supabase
        .from("priorities")
        .select("text, done")
        .eq("user_id", userId)
        .eq("for_date", today)
        .order("position", { ascending: true }),
      supabase
        .from("day_reflections")
        .select("for_date, reflection")
        .eq("user_id", userId)
        .not("reflection", "is", null)
        .order("for_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const context: CoachContext = {
    today: {
      date: today,
      blocks: (blocksRes.data ?? []).map((b) => ({
        time: normalizeTime(b.start_time as string),
        title: b.title as string,
        done: !!b.done,
      })),
      priorities: (prioritiesRes.data ?? []).map((p) => ({
        text: p.text as string,
        done: !!p.done,
      })),
    },
  };

  if (profileRes.data) {
    context.profile = {
      name: (profileRes.data.display_name as string | null) ?? undefined,
      intent: (profileRes.data.intent as string | null) ?? undefined,
      focus_areas:
        (profileRes.data.focus_areas as string[] | null) ?? undefined,
    };
  }

  if (moodRes.data?.value) {
    const v = moodRes.data.value as number;
    context.today.mood = { value: v, label: MOOD_LABELS[v] ?? "unknown" };
  }

  if (reflectionRes.data?.reflection) {
    context.recent_reflection = {
      for_date: reflectionRes.data.for_date as string,
      text: reflectionRes.data.reflection as string,
    };
  }

  return context;
}

/**
 * Renders a CoachContext into a compact string block the LLM sees.
 * Kept short and prosaic; the coach reads this and knows what to reference.
 */
export function renderCoachContext(ctx: CoachContext): string {
  const lines: string[] = [];
  lines.push(`Snapshot of the user right now (${ctx.today.date}):`);

  if (ctx.profile?.name) {
    lines.push(`- Name: ${ctx.profile.name}`);
  }
  if (ctx.profile?.intent) {
    lines.push(`- Why they came to Thrive: "${ctx.profile.intent.trim()}"`);
  }
  if (ctx.profile?.focus_areas?.length) {
    lines.push(`- Focus areas they picked: ${ctx.profile.focus_areas.join(", ")}`);
  }

  if (ctx.today.mood) {
    lines.push(`- Mood check-in today: ${ctx.today.mood.label} (${ctx.today.mood.value}/5)`);
  } else {
    lines.push(`- No mood check-in yet today.`);
  }

  if (ctx.today.blocks.length === 0) {
    lines.push(`- No planned blocks today.`);
  } else {
    const done = ctx.today.blocks.filter((b) => b.done).length;
    lines.push(`- Today's plan (${done}/${ctx.today.blocks.length} done):`);
    for (const b of ctx.today.blocks) {
      lines.push(`    ${b.done ? "✓" : "○"} ${formatTime12(b.time)} — ${b.title}`);
    }
  }

  if (ctx.today.priorities.length > 0) {
    const done = ctx.today.priorities.filter((p) => p.done).length;
    lines.push(`- Top 3 today (${done}/${ctx.today.priorities.length} done):`);
    for (const p of ctx.today.priorities) {
      lines.push(`    ${p.done ? "✓" : "○"} ${p.text}`);
    }
  }

  if (ctx.recent_reflection) {
    lines.push(
      `- Last reflection (${ctx.recent_reflection.for_date}): "${ctx.recent_reflection.text.trim().slice(0, 300)}"`,
    );
  }

  lines.push("");
  lines.push(
    "Use this snapshot to reference specific things — a block that slipped, a mood pattern, a stated intent. Don't recite it back at them; weave it in as a wise friend would. If nothing here is relevant to what they said, ignore it.",
  );

  return lines.join("\n");
}
