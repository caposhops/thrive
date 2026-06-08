"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * We use the **implicit** auth flow instead of the default PKCE. PKCE requires
 * a code_verifier that gets stored in browser storage when sign-in starts and
 * read back when the email link redirects to /auth/callback. In practice this
 * is fragile across email clients, multiple sign-in attempts, and privacy-
 * focused browsers — the verifier disappears and the link fails.
 *
 * Implicit flow puts the session token directly in the URL fragment after the
 * redirect. The browser client picks it up automatically (`detectSessionInUrl`)
 * and persists the session to cookies. No verifier, no storage matching, no
 * cross-browser fragility. Still secure for our use case (single-user sessions
 * gated by Supabase RLS).
 */
export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  );
}
