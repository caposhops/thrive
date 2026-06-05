"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Use in Client Components and hooks.
 * The publishable/anon key is safe to expose — security is enforced by RLS policies.
 */
export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
