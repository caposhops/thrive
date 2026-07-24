import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getStylePrompt } from "@/lib/coach-styles";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "coach"; text: string };
type CoachRequest = {
  messages: ChatMessage[];
  context?: string | null;
  style?: string | null;
};

const OFFLINE_REPLY =
  "I can't reach my brain right now — the connection to Claude dropped. Give me a moment and try again.";

export async function POST(req: Request) {
  let body: CoachRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const contextBlock = body.context?.trim() || null;
  const styleKey = body.style || null;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json({ error: "No user message" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: OFFLINE_REPLY,
      source: "offline",
      error: "missing_api_key",
    });
  }

  try {
    const client = new Anthropic({ apiKey });
    const apiMessages = messages.map((m) => ({
      role: m.role === "coach" ? ("assistant" as const) : ("user" as const),
      content: m.text,
    }));

    const model = process.env.COACH_MODEL || "claude-haiku-4-5-20251001";

    const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
      {
        type: "text",
        text: getStylePrompt(styleKey),
        cache_control: { type: "ephemeral" },
      },
    ];
    if (contextBlock) {
      systemBlocks.push({ type: "text", text: contextBlock });
    }

    const response = await client.messages.create({
      model,
      max_tokens: 600,
      system: systemBlocks,
      messages: apiMessages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply =
      textBlock && textBlock.type === "text"
        ? textBlock.text
        : "I'm here — say more?";

    return NextResponse.json({ reply, source: "claude", style: styleKey });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({
      reply: OFFLINE_REPLY,
      source: "offline",
      error: message,
    });
  }
}
