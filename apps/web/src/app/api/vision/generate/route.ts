import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = { prompt?: string };

const FAL_MODEL = "fal-ai/flux/schnell";

function gradientPlaceholder(prompt: string): string {
  const palettes = [
    ["#a78bfa", "#f472b6", "#fbbf24"],
    ["#5eead4", "#818cf8", "#f472b6"],
    ["#fb923c", "#f472b6", "#a78bfa"],
    ["#34d399", "#5eead4", "#818cf8"],
  ];
  const idx = Math.abs(hash(prompt)) % palettes.length;
  const [a, b, c] = palettes[idx];
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="50%" stop-color="${b}"/>
      <stop offset="100%" stop-color="${c}"/>
    </linearGradient>
    <filter id="n">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.08 0"/>
    </filter>
  </defs>
  <rect width="800" height="1000" fill="url(#g)"/>
  <rect width="800" height="1000" filter="url(#n)" opacity="0.6"/>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  const key = process.env.FAL_KEY;
  if (!key) {
    return NextResponse.json({
      image_url: gradientPlaceholder(prompt),
      source: "placeholder",
      prompt,
    });
  }

  try {
    const res = await fetch(`https://fal.run/${FAL_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `cinematic, dreamlike, soft light, premium aesthetic — ${prompt}`,
        image_size: "portrait_4_3",
        num_inference_steps: 4,
      }),
    });
    if (!res.ok) throw new Error(`fal.ai ${res.status}`);
    const data = (await res.json()) as { images?: { url: string }[] };
    const url = data.images?.[0]?.url;
    if (!url) throw new Error("no image in response");
    return NextResponse.json({ image_url: url, source: "fal.ai", prompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({
      image_url: gradientPlaceholder(prompt),
      source: "placeholder",
      prompt,
      error: message,
    });
  }
}
