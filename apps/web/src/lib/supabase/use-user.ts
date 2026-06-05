"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserClient } from "./client";

/**
 * Reactive user hook. Returns the current Supabase user (or null if anonymous)
 * and updates automatically on sign-in / sign-out.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export async function signOut() {
  const supabase = getBrowserClient();
  await supabase.auth.signOut();
  if (typeof window !== "undefined") window.location.href = "/";
}
