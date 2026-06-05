"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { Aurora } from "@/components/brand/aurora";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getBrowserClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setError(null);

    const supabase = getBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <>
      <Aurora />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-8">
        <header className="mb-12">
          <button onClick={() => router.push("/")} className="inline-flex">
            <Logo />
          </button>
        </header>

        <div className="flex flex-1 flex-col justify-center">
          {status !== "sent" ? (
            <>
              <p className="font-display text-xs uppercase tracking-[0.3em] text-fg-subtle">
                Welcome back
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Sign in to <span className="text-gradient">Thrive</span>.
              </h1>
              <p className="mt-3 text-fg-muted">
                We&apos;ll email you a magic link. No passwords. Ever.
              </p>

              <form onSubmit={send} className="mt-8 flex flex-col gap-3">
                <div className="glass-strong flex h-14 items-center gap-3 rounded-2xl px-5">
                  <Mail className="h-5 w-5 text-fg-subtle" />
                  <input
                    type="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-full flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
                    disabled={status === "sending"}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={status === "sending" || !email.trim()}
                >
                  {status === "sending" ? "Sending…" : "Send magic link"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              {error && (
                <p className="mt-4 rounded-2xl bg-rose-500/10 p-3 text-sm text-rose-300">
                  {error}
                </p>
              )}

              <p className="mt-8 text-center text-xs text-fg-subtle">
                New here?{" "}
                <a href="/onboarding" className="text-fg underline-offset-4 hover:underline">
                  Start the journey
                </a>
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
                <Mail className="h-7 w-7 text-black" />
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Check your email.
              </h1>
              <p className="mt-4 text-fg-muted">
                We sent a magic link to <span className="text-fg">{email}</span>.
                Click it to sign in.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-8 text-sm text-fg-subtle underline-offset-4 hover:text-fg hover:underline"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
