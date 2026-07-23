import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { COACH_SYSTEM_PROMPT } from "@/lib/coach-prompt";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "coach"; text: string };

function fallbackReply(userText: string): string {
  const lower = userText.toLowerCase();
  if (lower.includes("procrastinat"))
    return "Procrastination is rarely about laziness — it's usually fear wearing a costume. What's the smallest, almost absurd version of the thing you could do in the next two minutes?";
  if (lower.includes("morning"))
    return "Mornings are won the night before. What if we designed an evening landing strip instead — three things that make tomorrow's first hour feel safe?";
  if (lower.includes("scatter") || lower.includes("foggy") || lower.includes("overwhelm"))
    return "Scattered minds are full minds. Before we organize anything, let's empty. Name the three loudest things — even one word each.";
  if (lower.includes("focus"))
    return "Beautiful intention. Thirty days is enough to feel a real shift. What single identity shift would make the habits obvious?";
  if (lower.includes("tired") || lower.includes("exhaust") || lower.includes("burn"))
    return "Tired is information, not failure. What would it look like to honor the tiredness for the next hour, instead of pushing through it?";
  return "Tell me more — what does that feel like in your body right now?";
}

export async function POST(req: Request) {
  let body: { messages: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json({ error: "No user message" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: fallbackReply(lastUser.text),
      source: "fallback",
    });
  }

  try {
    const client = new Anthropic({ apiKey });
    const apiMessages = messages.map((m) => ({
      role: m.role === "coach" ? ("assistant" as const) : ("user" as const),
      content: m.text,
    }));

    // Haiku is the default — the quality/cost balance is right for a coach
    // used many times a day. Override via COACH_MODEL env if you want Sonnet
    // for premium tier or Opus for evals.
    const model = process.env.COACH_MODEL || "claude-haiku-4-5-20251001";
    const response = await client.messages.create({
      model,
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: COACH_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: apiMessages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply = textBlock && textBlock.type === "text" ? textBlock.text : "I'm here — say more?";

    return NextResponse.json({ reply, source: "claude" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({
      reply: fallbackReply(lastUser.text),
      source: "fallback",
      error: message,
    });
  }
}
