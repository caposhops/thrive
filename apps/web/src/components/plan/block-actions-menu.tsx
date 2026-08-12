"use client";

/**
 * The ⋯ menu on each plan block. Replaces the standalone delete button
 * and adds reschedule options. One menu, one row footprint.
 *
 *   Move to tomorrow
 *   Move to yesterday
 *   Move to date…       (native date picker inside a label)
 *   ─
 *   Delete
 */

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Trash2, ArrowRight, ArrowLeft, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { isoDay, todayISO } from "@/lib/streaks";

type Props = {
  currentDate: string; // ISO — the date the block currently belongs to
  onMoveToDate: (targetDate: string) => void;
  onDelete: () => void;
};

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return isoDay(dt);
}

function relativeLabel(target: string, source: string): string {
  const today = todayISO();
  if (target === today) return "today";
  if (target === shiftDate(today, 1)) return "tomorrow";
  if (target === shiftDate(today, -1)) return "yesterday";
  // Fall back to a short calendar label if we're moving somewhere further
  void source;
  const [y, m, d] = target.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export { relativeLabel };

export function BlockActionsMenu({ currentDate, onMoveToDate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const tomorrow = shiftDate(currentDate, 1);
  const yesterday = shiftDate(currentDate, -1);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-white/[0.06] hover:text-fg focus:bg-white/[0.06] focus:text-fg"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Block actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "glass-strong absolute right-0 top-full z-30 mt-1 flex w-52 flex-col overflow-hidden rounded-2xl p-1 text-sm shadow-soft",
          )}
        >
          <MenuItem
            icon={<ArrowRight className="h-3.5 w-3.5" />}
            onClick={() => pick(() => onMoveToDate(tomorrow))}
          >
            Move to tomorrow
          </MenuItem>
          <MenuItem
            icon={<ArrowLeft className="h-3.5 w-3.5" />}
            onClick={() => pick(() => onMoveToDate(yesterday))}
          >
            Move to yesterday
          </MenuItem>

          {/* Date input hidden behind a "Move to date…" label so tapping
              anywhere in the row opens the OS date picker */}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Move to date…</span>
            <input
              ref={dateInputRef}
              type="date"
              defaultValue={currentDate}
              onChange={(e) => {
                const next = e.target.value;
                if (next && next !== currentDate) {
                  onMoveToDate(next);
                }
                setOpen(false);
              }}
              className="sr-only"
              aria-label="Pick a date"
            />
          </label>

          <div className="my-1 h-px bg-white/[0.08]" aria-hidden />

          <MenuItem
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => pick(onDelete)}
            danger
          >
            Delete
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  onClick,
  danger,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors",
        danger
          ? "text-rose-300 hover:bg-rose-500/15"
          : "text-fg-muted hover:bg-white/[0.06] hover:text-fg",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span>{children}</span>
    </button>
  );
}
