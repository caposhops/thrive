"use client";

/**
 * Magic-link landing page.
 *
 * Why client-side and not a server route handler?
 *   The Supabase browser client uses PKCE, which stores a `code_verifier` in
 *   browser cookies + localStorage. Server-side `exchangeCodeForSession` can
 *   sometimes fail to read the verifier (cross-domain cookies, samesite quirks,
 *   wrong path). Running the exchange in the browser uses whatever storage the
 *   original sign-in call used, and it's more reliable across browsers + email
 *   clients.
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
    const code = searchParams.get("code");
    const errorDescription = searchParams.get("error_description");

    if (errorDescription) {
      setStatus("error");
      setErrorMessage(errorDescription);
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage(
        "No sign-in code found in the URL. The link may have been opened incorrectly.",
      );
      return;
    }

    const next = searchParams.get("next") ?? "/today";
    const supabase = getBrowserClient();

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
      } else {
        setStatus("success");
        // Use replace so the user can't navigate back to the callback page
        router.replace(next);
      }
    });
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
                This usually happens when the link is opened in a different browser
                than the one you requested it from, or if it&apos;s already been used.
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
