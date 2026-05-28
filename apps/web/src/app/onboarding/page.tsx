"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Aurora } from "@/components/brand/aurora";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step =
  | { id: "welcome" }
  | { id: "name" }
  | { id: "intent" }
  | { id: "focus" }
  | { id: "vision" }
  | { id: "ready" };

const focusOptions = [
  { key: "structure", label: "Daily structure", emoji: "🌅" },
  { key: "habits", label: "Better habits", emoji: "🌱" },
  { key: "focus", label: "Deeper focus", emoji: "🎯" },
  { key: "healing", label: "Emotional healing", emoji: "💗" },
  { key: "vision", label: "Future vision", emoji: "✨" },
  { key: "energy", label: "More energy", emoji: "⚡" },
];

const steps: Step[] = [
  { id: "welcome" },
  { id: "name" },
  { id: "intent" },
  { id: "focus" },
  { id: "vision" },
  { id: "ready" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);
  const [name, setName] = useState("");
  const [intent, setIntent] = useState("");
  const [focus, setFocus] = useState<string[]>([]);
  const [vision, setVision] = useState("");

  const step = steps[stepIdx];
  const next = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setStepIdx((i) => Math.max(i - 1, 0));

  const canAdvance =
    (step.id === "welcome") ||
    (step.id === "name" && name.trim().length > 0) ||
    (step.id === "intent" && intent.trim().length > 0) ||
    (step.id === "focus" && focus.length > 0) ||
    (step.id === "vision" && vision.trim().length > 0) ||
    step.id === "ready";

  const finish = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "thrive:onboarding",
        JSON.stringify({ name, intent, focus, vision, completedAt: Date.now() }),
      );
    }
    router.push("/today");
  };

  return (
    <>
      <Aurora />
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i <= stepIdx ? "w-8 bg-gradient-brand" : "w-4 bg-white/10",
                )}
              />
            ))}
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center">
          {step.id === "welcome" && (
            <div className="text-center">
              <p className="font-display text-xs uppercase tracking-[0.3em] text-fg-subtle">
                Welcome to Thrive
              </p>
              <h1 className="mt-4 font-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Take one <span className="text-gradient">slow breath</span>.
              </h1>
              <p className="mx-auto mt-6 max-w-md text-lg text-fg-muted">
                You&apos;re not here by accident. The next few minutes will shape something quietly powerful.
              </p>
              <div className="mt-12">
                <Button size="lg" onClick={next}>
                  I&apos;m ready
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step.id === "name" && (
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-fg-subtle">
                Step 1 of 4
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                What would you like to be called?
              </h2>
              <p className="mt-3 text-fg-muted">First name, nickname, or whatever feels right.</p>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-8 h-16 w-full rounded-2xl bg-white/[0.04] px-6 font-display text-2xl text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15"
              />
            </div>
          )}

          {step.id === "intent" && (
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-fg-subtle">
                Step 2 of 4
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {name ? `${name}, w` : "W"}hat brought you here?
              </h2>
              <p className="mt-3 text-fg-muted">In your own words. No pressure to sound polished.</p>
              <textarea
                autoFocus
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="I want to feel less scattered. I want to..."
                rows={5}
                className="mt-8 w-full resize-none rounded-3xl bg-white/[0.04] p-6 text-[17px] leading-relaxed text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15"
              />
            </div>
          )}

          {step.id === "focus" && (
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-fg-subtle">
                Step 3 of 4
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Where shall we start?
              </h2>
              <p className="mt-3 text-fg-muted">Pick anything that calls to you. You can change this later.</p>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {focusOptions.map((opt) => {
                  const active = focus.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() =>
                        setFocus((f) =>
                          active ? f.filter((x) => x !== opt.key) : [...f, opt.key],
                        )
                      }
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-2xl p-5 text-center transition-all",
                        active
                          ? "bg-gradient-glow ring-1 ring-white/20"
                          : "glass hover:bg-white/[0.06]",
                      )}
                    >
                      <span className="text-3xl">{opt.emoji}</span>
                      <span className="text-sm font-medium text-fg">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step.id === "vision" && (
            <div>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-fg-subtle">
                Step 4 of 4
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Picture yourself <span className="text-gradient">one year from now</span>.
              </h2>
              <p className="mt-3 text-fg-muted">What&apos;s one thing about your life that&apos;s different?</p>
              <textarea
                autoFocus
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="I wake up feeling..."
                rows={5}
                className="mt-8 w-full resize-none rounded-3xl bg-white/[0.04] p-6 text-[17px] leading-relaxed text-fg outline-none ring-1 ring-inset ring-white/[0.06] focus:ring-white/15"
              />
            </div>
          )}

          {step.id === "ready" && (
            <div className="text-center">
              <p className="font-display text-xs uppercase tracking-[0.3em] text-fg-subtle">
                You&apos;re in
              </p>
              <h2 className="mt-4 font-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Beautiful, {name || "friend"}.
              </h2>
              <p className="mx-auto mt-6 max-w-md text-lg text-fg-muted">
                Your Thrive space is ready. The work now is gentle, daily, and yours.
              </p>
              <div className="mt-12">
                <Button size="lg" onClick={finish}>
                  Enter Thrive
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between pt-6">
          {stepIdx > 0 && step.id !== "ready" ? (
            <Button variant="ghost" size="sm" onClick={back}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <span />
          )}
          {step.id !== "welcome" && step.id !== "ready" && (
            <Button size="md" onClick={next} disabled={!canAdvance}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </footer>
      </div>
    </>
  );
}
