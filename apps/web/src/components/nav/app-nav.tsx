"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, ListChecks, Image as ImageIcon, Sparkles, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/habits", label: "Habits", icon: ListChecks },
  { href: "/vision", label: "Vision", icon: ImageIcon },
  { href: "/coach", label: "Coach", icon: Sparkles },
  { href: "/balance", label: "Balance", icon: CircleDot },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-4 sm:hidden">
        <div className="glass-strong mx-auto flex max-w-md items-center justify-between rounded-full px-2 py-2 shadow-soft">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 transition-colors",
                  active ? "text-fg" : "text-fg-subtle hover:text-fg-muted",
                )}
              >
                {active && (
                  <span className="absolute inset-0 -z-10 rounded-full bg-gradient-glow" />
                )}
                <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.6} />
                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop side nav */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/5 px-4 py-6 sm:flex">
        <div className="mb-10 px-2">
          <Link href="/today" className="inline-flex">
            {/* Re-export Logo locally is heavy; using inline minimal mark */}
            <span className="font-display text-lg font-semibold tracking-tight text-gradient">
              Thrive
            </span>
          </Link>
        </div>
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all",
                    active
                      ? "bg-white/[0.06] text-fg"
                      : "text-fg-muted hover:bg-white/[0.03] hover:text-fg",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                      active ? "bg-gradient-glow ring-1 ring-white/10" : "bg-white/[0.03]",
                    )}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.7} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto px-2">
          <div className="glass rounded-2xl p-4 text-xs text-fg-muted">
            <p className="mb-1 font-medium text-fg">Daily intention</p>
            <p className="leading-relaxed">Small steps. Soft heart. Steady breath.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
