"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, Upload, Download, Wand2 } from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { Card, CardEyebrow } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const boards = [
  {
    title: "The Founder Era",
    horizon: "1 year",
    why: "I build calm, useful things and people are changed by them.",
    gradient: "from-violet-500 via-fuchsia-500 to-amber-400",
    emoji: "🚀",
  },
  {
    title: "Embodied Health",
    horizon: "6 months",
    why: "Strong, mobile, present in my body. Sleep that restores me.",
    gradient: "from-teal-400 via-emerald-400 to-lime-400",
    emoji: "🌿",
  },
  {
    title: "Sanctuary Home",
    horizon: "2 years",
    why: "A space full of light, plants, art, and music that makes me feel home.",
    gradient: "from-rose-400 via-orange-400 to-amber-300",
    emoji: "🏡",
  },
  {
    title: "Deep Relationships",
    horizon: "Ongoing",
    why: "Slower conversations. People who know my full self.",
    gradient: "from-indigo-400 via-violet-400 to-pink-400",
    emoji: "💞",
  },
];

type Generated = { url: string; prompt: string };

export default function VisionPage() {
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useLocalStorage<Generated[]>(
    "thrive:vision:generated",
    [],
  );

  const generate = async () => {
    const p = prompt.trim();
    if (!p) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/vision/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const data = (await res.json()) as { image_url: string };
      setGenerated((g) => [{ url: data.image_url, prompt: p }, ...g].slice(0, 8));
      setPrompt("");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Vision</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            The life you&apos;re <span className="text-gradient">walking toward</span>.
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export wallpaper
          </Button>
          <Button size="sm">
            <Sparkles className="h-4 w-4" />
            New board
          </Button>
        </div>
      </header>

      {/* AI generator */}
      <Card className="mb-8 bg-gradient-glow">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
            <Wand2 className="h-6 w-6 text-black" />
          </div>
          <div className="flex-1">
            <CardEyebrow>AI vision generator</CardEyebrow>
            <p className="mt-1 font-display text-xl font-semibold text-fg">
              Describe a moment from your future life.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A sunrise studio, plants, my book on the desk…"
                className="h-12 flex-1 rounded-full bg-white/[0.04] px-5 text-[15px] text-fg outline-none ring-1 ring-inset ring-white/[0.06] placeholder:text-fg-subtle focus:ring-white/15"
              />
              <Button onClick={generate} disabled={generating || !prompt.trim()}>
                {generating ? "Manifesting…" : "Generate"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-fg-subtle">
              Set FAL_KEY in .env.local to enable real image generation.
            </p>
            {generated.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {generated.map((g, i) => (
                  <div
                    key={`${g.prompt}-${i}`}
                    className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-white/10"
                  >
                    <Image
                      src={g.url}
                      alt={g.prompt}
                      fill
                      sizes="200px"
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="line-clamp-2 text-[10px] leading-tight text-white/90">
                        {g.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Boards grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => (
          <button
            key={board.title}
            className="group relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-white/10 transition-all hover:ring-white/20"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${board.gradient} opacity-90`} />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex flex-col justify-between p-5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-3xl drop-shadow">{board.emoji}</span>
                <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                  {board.horizon}
                </span>
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold leading-tight text-white drop-shadow-sm">
                  {board.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/85">
                  {board.why}
                </p>
              </div>
            </div>
          </button>
        ))}

        {/* Add new */}
        <button className="group flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-white/15 transition-all hover:border-white/30 hover:bg-white/[0.02]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] transition-transform group-hover:scale-110">
            <Upload className="h-6 w-6 text-fg-muted" />
          </div>
          <p className="font-display text-base font-medium text-fg">Add a vision</p>
          <p className="max-w-[180px] text-center text-xs text-fg-subtle">
            Upload an image or describe a future moment
          </p>
        </button>
      </div>
    </div>
  );
}
