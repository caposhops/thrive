"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useUser } from "@/lib/supabase/use-user";

/**
 * Sticky top bar visible only on mobile. Replaces the desktop sidebar's role
 * of providing brand + account access on small screens.
 */
export function MobileTopBar() {
  const { user } = useUser();
  const initial =
    (user?.user_metadata?.display_name as string | undefined)?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    null;

  return (
    <header className="sticky top-0 z-30 -mx-5 mb-3 flex items-center justify-between px-5 py-2.5 sm:hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-bg via-bg/90 to-transparent"
        aria-hidden
      />
      <Link href="/today" className="inline-flex" aria-label="Today">
        <Logo showWord={false} />
      </Link>
      <Link
        href="/settings"
        aria-label={user ? "Account & settings" : "Sign in & settings"}
        className="glass flex h-9 w-9 items-center justify-center rounded-full transition-all hover:bg-white/[0.08]"
      >
        {initial ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-brand text-xs font-semibold text-black">
            {initial}
          </span>
        ) : (
          <User className="h-4 w-4 text-fg-muted" />
        )}
      </Link>
    </header>
  );
}
