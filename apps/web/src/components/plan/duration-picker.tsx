"use client";

/**
 * Shared duration picker used by the /plan add form, the block row
 * "edit duration" pill, and the WeeklyRhythm editor.
 *
 * Two visual modes:
 *   - `variant="pill"` — compact inline pill for existing blocks
 *   - `variant="input"` — form field for the add row
 */

import { useEffect, useRef, useState } from "react";
import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DURATION_PRESETS,
  formatDurationShort,
  type DurationMinutes,
} from "@/lib/plan-duration";

export function DurationPicker({
  value,
  onChange,
  variant = "input",
  className,
}: {
  value: DurationMinutes;
  onChange: (next: DurationMinutes) => void;
  variant?: "input" | "pill";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const label = value ? formatDurationShort(value) : variant === "pill" ? "Set duration" : "Any";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap transition-all",
          variant === "input"
            ? "h-11 rounded-2xl bg-white/[0.04] px-4 text-sm text-fg ring-1 ring-inset ring-white/[0.06] hover:ring-white/15"
            : value
              ? "rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-fg-muted hover:bg-white/[0.1] hover:text-fg"
              : "rounded-full bg-white/[0.03] px-2 py-0.5 text-[10px] text-fg-subtle opacity-0 group-hover:opacity-100 hover:bg-white/[0.08] hover:text-fg-muted focus:opacity-100 sm:opacity-100",
        )}
        aria-label={`Duration: ${label}`}
        aria-expanded={open}
      >
        <Clock className={variant === "input" ? "h-4 w-4" : "h-3 w-3"} />
        <span>{label}</span>
      </button>

      {open && (
        <div
          className="glass-strong absolute right-0 z-30 mt-1.5 flex w-40 flex-col overflow-hidden rounded-2xl p-1 shadow-soft"
          role="menu"
        >
          <MenuItem
            active={value == null}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Open-ended
          </MenuItem>
          <div className="my-1 h-px bg-white/[0.05]" />
          {DURATION_PRESETS.map((preset) => (
            <MenuItem
              key={preset.minutes}
              active={value === preset.minutes}
              onClick={() => {
                onChange(preset.minutes);
                setOpen(false);
              }}
            >
              {preset.label}
            </MenuItem>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors",
        active
          ? "bg-white/[0.08] text-fg"
          : "text-fg-muted hover:bg-white/[0.05] hover:text-fg",
      )}
    >
      {children}
      {active && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}
