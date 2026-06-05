"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { useUser, signOut } from "@/lib/supabase/use-user";

/**
 * Shown in the sidebar — tells the user whether their data is local-only
 * or synced to their account, and provides sign-in / sign-out.
 */
export function AuthPill() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="glass rounded-2xl p-3 text-xs text-fg-subtle">
        <span className="inline-block h-3 w-20 rounded-full bg-white/10 animate-pulse-glow" />
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="glass group flex items-center justify-between rounded-2xl px-3 py-3 text-xs transition-all hover:bg-white/[0.06]"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.05]">
            <User className="h-3.5 w-3.5 text-fg-muted" />
          </span>
          <div>
            <p className="font-medium text-fg">Sign in to sync</p>
            <p className="text-fg-subtle">Saved on this device only</p>
          </div>
        </div>
      </Link>
    );
  }

  const name = (user.user_metadata?.display_name as string | undefined) ?? user.email?.split("@")[0] ?? "You";
  const initial = name[0]?.toUpperCase() ?? "T";

  return (
    <div className="glass flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-[11px] font-semibold text-black">
          {initial}
        </span>
        <div className="overflow-hidden">
          <p className="truncate text-xs font-medium text-fg">{name}</p>
          <p className="truncate text-[10px] text-fg-subtle">Synced</p>
        </div>
      </div>
      <button
        onClick={signOut}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-white/[0.05] hover:text-fg"
        aria-label="Sign out"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
