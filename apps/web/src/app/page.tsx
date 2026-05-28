import Link from "next/link";
import { ArrowRight, Sparkles, HeartPulse, Target, Compass, Brain, CircleDot } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Aurora } from "@/components/brand/aurora";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: Target,
    title: "Daily Structure",
    body: "ADHD-friendly micro-steps, energy-based scheduling, and a calm focus mode that meets you where you are.",
  },
  {
    icon: HeartPulse,
    title: "Mood & Healing",
    body: "Emoji check-ins, burnout detection, and gentle pattern recognition — no shame, just self-awareness.",
  },
  {
    icon: Sparkles,
    title: "Vision Board",
    body: "AI-generated future self imagery. Export as wallpaper, poster, or canvas. Stay connected to your why.",
  },
  {
    icon: Brain,
    title: "AI Coach",
    body: "A calm mentor in your pocket. Reflective prompts, schedule suggestions, never preachy or robotic.",
  },
  {
    icon: CircleDot,
    title: "Circle of Life",
    body: "Ten life categories tracked over time. See where you're growing, where you're stuck, what needs love.",
  },
  {
    icon: Compass,
    title: "Habit Streaks",
    body: "Build, break, and replace habits with XP, levels, and unlockables that reward consistency — not perfection.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Aurora />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-fg-muted sm:flex">
          <a href="#features" className="transition-colors hover:text-fg">Features</a>
          <a href="#philosophy" className="transition-colors hover:text-fg">Philosophy</a>
          <Link href="/onboarding" className="transition-colors hover:text-fg">Sign in</Link>
        </nav>
        <Link href="/onboarding">
          <Button size="sm">Start free</Button>
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="flex flex-col items-center text-center">
            <div className="glass mb-6 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-fg-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse-glow" />
              Built for ADHD minds. Loved by anyone seeking depth.
            </div>
            <h1 className="font-display text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
              The calm space where{" "}
              <span className="text-gradient">your future self</span>
              <br className="hidden sm:block" />
              {" "}becomes inevitable.
            </h1>
            <p className="mt-6 max-w-2xl text-balance text-lg text-fg-muted sm:text-xl">
              Thrive is an emotionally intelligent operating system for your life — structure,
              healing, vision boards, and an AI coach in one immersive ecosystem.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/onboarding">
                <Button size="lg" className="group">
                  Begin your journey
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/today">
                <Button size="lg" variant="secondary">
                  Explore the app
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-xs text-fg-subtle">
              Free forever for the essentials. Premium unlocks vision boards & AI coaching.
            </p>
          </div>

          {/* Floating preview card */}
          <div className="relative mt-20">
            <div className="absolute -inset-x-20 -inset-y-10 bg-gradient-glow blur-3xl" />
            <div className="glass-strong relative mx-auto max-w-4xl rounded-[2.5rem] p-2 shadow-soft">
              <div className="rounded-[2rem] bg-bg-elevated/80 p-8 sm:p-12">
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {[
                    { label: "Days thriving", value: "47" },
                    { label: "Habits formed", value: "12" },
                    { label: "Mood trend", value: "↑ 18%" },
                    { label: "Vision clarity", value: "92%" },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                        {s.value}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-fg-subtle">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section id="features" className="mx-auto w-full max-w-6xl px-6 py-24">
          <div className="mb-16 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Six pillars, one ecosystem</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Everything you need to <span className="text-gradient-calm">become inevitable</span>.
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="glass group rounded-3xl p-7 transition-all hover:bg-white/[0.06]"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-glow ring-1 ring-white/10">
                  <p.icon className="h-5 w-5 text-violet-300" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-lg font-semibold text-fg">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Philosophy */}
        <section id="philosophy" className="mx-auto w-full max-w-4xl px-6 py-24 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Our philosophy</p>
          <p className="mt-6 font-display text-3xl font-medium leading-[1.3] tracking-tight text-fg sm:text-4xl">
            Productivity apps treat you like a machine that&apos;s broken.
            <br />
            <span className="text-gradient">Thrive treats you like a soul that&apos;s growing.</span>
          </p>
          <p className="mx-auto mt-8 max-w-2xl text-base text-fg-muted">
            We don&apos;t shame the dopamine crashes. We don&apos;t guilt the procrastination. We design
            for emotional regulation, micro-wins, and a deep, durable connection to your future self.
          </p>
          <div className="mt-12">
            <Link href="/onboarding">
              <Button size="lg">
                Start with one breath
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-12 text-center text-xs text-fg-subtle">
        <Logo className="mx-auto mb-4 opacity-70" />
        <p>© {new Date().getFullYear()} Thrive. Raise your vibration.</p>
      </footer>
    </>
  );
}
