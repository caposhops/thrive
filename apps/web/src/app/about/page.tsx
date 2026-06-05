import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Aurora } from "@/components/brand/aurora";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Manifesto",
  description:
    "Why Thrive exists. The ideas behind the app and the world we hope to help create.",
  openGraph: {
    title: "Manifesto · Thrive",
    description:
      "Why Thrive exists. The ideas behind the app and the world we hope to help create.",
  },
};

export default function AboutPage() {
  return (
    <>
      <Aurora />

      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-6">
        <Link href="/" className="inline-flex">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-fg-muted sm:flex">
          <Link href="/" className="transition-colors hover:text-fg">
            Home
          </Link>
          <Link href="/today" className="transition-colors hover:text-fg">
            App
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-24">
        <p className="text-xs uppercase tracking-[0.3em] text-fg-subtle">Manifesto</p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          We don&apos;t need another <span className="text-gradient">productivity app</span>.
          We need a kinder one.
        </h1>

        <div className="mt-12 space-y-7 text-lg leading-relaxed text-fg-muted [&_strong]:font-semibold [&_strong]:text-fg">
          <p>
            Most productivity apps are built on a quiet assumption: that you are
            broken, and that with the right system, you could be fixed. Open them
            and you feel the weight of that diagnosis. The empty checkboxes. The
            broken streaks. The graphs trending in the wrong direction.
          </p>
          <p>
            For ADHD minds especially — and for the millions of people working
            against shame, burnout, and overwhelm — that framing is poison. It
            doesn&apos;t produce more effort. It produces avoidance. It produces
            shame. It produces the very thing it claims to cure.
          </p>
          <p>
            <strong>Thrive is built on a different premise.</strong> You are not
            broken. You are growing. The work of being a person is hard and
            non-linear and worth honoring. The job of a tool isn&apos;t to fix you
            — it&apos;s to hold you while you become yourself.
          </p>

          <h2 className="font-display text-3xl font-semibold tracking-tight text-fg pt-6">
            Three commitments
          </h2>

          <p>
            <strong>1. No shame.</strong> Streaks reflect what you actually did.
            Broken streaks aren&apos;t failures — they&apos;re information. Missing
            today doesn&apos;t kill yesterday. Tomorrow is always open.
          </p>
          <p>
            <strong>2. Beauty matters.</strong> Apps that ask us to do hard inner
            work should feel like sanctuary, not like spreadsheets. Soft gradients.
            Calm typography. Animations that feel like breath. The visual language
            should regulate your nervous system, not stress it.
          </p>
          <p>
            <strong>3. Your data is yours.</strong> Export it any time. Delete it
            any time. We don&apos;t sell it, ever. The cloud is a convenience, not
            a hostage situation.
          </p>

          <h2 className="font-display text-3xl font-semibold tracking-tight text-fg pt-6">
            What Thrive is becoming
          </h2>

          <p>
            A daily structure system that meets you at your energy.
            A habit tracker that rewards consistency without punishing imperfection.
            A vision board that connects you to the future self you&apos;re becoming.
            A coach in your pocket who is calm, never preachy, never robotic.
            A way to see the whole shape of your life — health, relationships,
            purpose, fun — and notice gently where you need more love.
          </p>
          <p>
            It is also, today, very small. A first sketch. We&apos;ll grow it with
            care, with you, in public. The version of Thrive you use a year from
            now will look nothing like this one — and we&apos;ll be proud of both.
          </p>

          <h2 className="font-display text-3xl font-semibold tracking-tight text-fg pt-6">
            Built in public
          </h2>

          <p>
            The whole codebase is{" "}
            <a
              href="https://github.com/caposhops/thrive"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg underline-offset-4 hover:underline"
            >
              open on GitHub
            </a>
            . Issues, ideas, pull requests welcome. If something is broken or
            beautiful or missing, we want to hear from you.
          </p>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 sm:flex-row">
          <Link href="/onboarding">
            <Button size="lg">
              Begin your journey
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/today">
            <Button size="lg" variant="secondary">
              Open the app
            </Button>
          </Link>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-4xl px-6 py-12 text-center text-xs text-fg-subtle">
        <Logo className="mx-auto mb-4 opacity-70" />
        <p>© {new Date().getFullYear()} Thrive. Raise your vibration.</p>
      </footer>
    </>
  );
}
