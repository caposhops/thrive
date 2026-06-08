"use client";

/**
 * Magic-link landing page.
 *
 * With implicit flow, Supabase puts the session token in the URL fragment
 * (e.g. /auth/callback#access_token=...). The browser client picks it up
 * automatically thanks to `detectSessionInUrl: true`, then we just wait for
 * a session to materialize and redirect.
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, AlertCircle } from "lucide-react";
import { Aurora } from "@/components/brand/aurora";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getBrowserClient } from "@/lib/supabase/client";

type Status = "exchanging" | "success" | "error";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<ExchangingShell />}>
      <CallbackInner />
    </Suspense>
  );
}

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("exchanging");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Supabase puts errors in the URL fragment for implicit flow, but Next.js
    // useSearchParams only reads the query string. We need to parse both.
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
    const queryError = searchParams.get("error_description");
    const hashError = hashParams.get("error_description");
    const errMsg = hashError || queryError;

    if (errMsg) {
      setStatus("error");
      setErrorMessage(errMsg);
      return;
    }

    const next = searchParams.get("next") ?? "/today";
    const supabase = getBrowserClient();

    // Subscribe first so we don't miss the SIGNED_IN event that fires when
    // detectSessionInUrl parses the fragment.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setStatus("success");
        subscription.unsubscribe();
        router.replace(next);
      }
    });

    // Fallback: if implicit-flow detection already fired before our listener
    // attached, check directly.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setStatus("success");
        subscription.unsubscribe();
        router.replace(next);
      }
    });

    // Safety net: if nothing happens within 8s, treat as error.
    const timeout = setTimeout(() => {
      setStatus("error");
      setErrorMessage(
        "We couldn't read the sign-in details from the link. Try requesting a new one.",
      );
      subscription.unsubscribe();
    }, 8000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [router, searchParams]);

  return (
    <>
      <Aurora />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-8">
        <header className="mb-12">
          <Logo />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {status === "exchanging" && <ExchangingShellContent />}

          {status === "success" && (
            <>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
                <Sparkles className="h-7 w-7 text-black" />
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome back.
              </h1>
              <p className="mt-3 text-fg-muted">Redirecting you now…</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 ring-1 ring-rose-400/30">
                <AlertCircle className="h-7 w-7 text-rose-300" />
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Sign-in didn&apos;t go through.
              </h1>
              <p className="mt-3 text-fg-muted">
                The link may have expired or already been used.
              </p>
              {errorMessage && (
                <p className="mt-4 max-w-xs rounded-2xl bg-rose-500/10 p-3 text-xs text-rose-300">
                  {errorMessage}
                </p>
              )}
              <div className="mt-8 flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => router.push("/sign-in")}>
                  Request a new link
                </Button>
                <Button variant="ghost" onClick={() => router.push("/")}>
                  Go home
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ExchangingShellContent() {
  return (
    <>
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
        <Sparkles className="h-7 w-7 animate-pulse-glow text-black" />
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Signing you in…
      </h1>
      <p className="mt-3 text-fg-muted">A breath. Almost there.</p>
    </>
  );
}

function ExchangingShell() {
  return (
    <>
      <Aurora />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-8">
        <header className="mb-12">
          <Logo />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <ExchangingShellContent />
        </div>
      </div>
    </>
  );
}
