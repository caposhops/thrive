"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Download,
  Trash2,
  LogOut,
  Mail,
  Cloud,
  HardDrive,
  ExternalLink,
  Code2,
} from "lucide-react";
import { Card, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser, signOut } from "@/lib/supabase/use-user";
import { fetchProfile } from "@/lib/supabase/profile";
import {
  downloadExport,
  clearAllLocalData,
  countLocalEntries,
} from "@/lib/thrive-data";
import { SoundToggle } from "@/components/settings/sound-toggle";

type CloudProfile = {
  display_name: string | null;
  intent: string | null;
  vision: string | null;
  focus_areas: string[] | null;
};

export default function SettingsPage() {
  const { user, loading } = useUser();
  const [entries, setEntries] = useState(0);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [cloudProfile, setCloudProfile] = useState<CloudProfile | null>(null);

  useEffect(() => {
    setEntries(countLocalEntries());
  }, [resetDone]);

  useEffect(() => {
    if (!user) {
      setCloudProfile(null);
      return;
    }
    let cancelled = false;
    fetchProfile(user.id).then(({ profile }) => {
      if (!cancelled && profile) setCloudProfile(profile as CloudProfile);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const local = readOnboarding();
  const onboarding = cloudProfile
    ? {
        name: cloudProfile.display_name ?? local?.name,
        intent: cloudProfile.intent ?? local?.intent,
        focus: cloudProfile.focus_areas ?? local?.focus,
        vision: cloudProfile.vision ?? local?.vision,
      }
    : local;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Settings</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Your space.
        </h1>
        <p className="mt-2 text-fg-muted">
          Profile, data, account. Everything you own about Thrive.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {/* Profile */}
        <Card>
          <CardEyebrow>Profile</CardEyebrow>
          <CardTitle className="mt-1">
            {onboarding?.name ?? "Anonymous traveler"}
          </CardTitle>
          <CardDescription className="mt-1">
            {onboarding?.intent
              ? `Here because: "${truncate(onboarding.intent, 100)}"`
              : "Tell Thrive why you're here — restart onboarding to share."}
          </CardDescription>
          {onboarding?.focus && onboarding.focus.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {onboarding.focus.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-fg-muted"
                >
                  {focusLabel(f)}
                </span>
              ))}
            </div>
          )}
          <div className="mt-5">
            <Link href="/onboarding">
              <Button variant="secondary" size="sm">
                Redo onboarding
              </Button>
            </Link>
          </div>
        </Card>

        {/* Sound */}
        <SoundToggle />

        {/* Account */}
        <Card>
          <CardEyebrow>Account</CardEyebrow>
          {loading ? (
            <div className="mt-3 h-5 w-48 rounded-full bg-white/5 animate-pulse-glow" />
          ) : user ? (
            <>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-black">
                  {(user.email?.[0] ?? "T").toUpperCase()}
                </span>
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-medium text-fg">{user.email}</p>
                  <p className="flex items-center gap-1.5 text-xs text-teal-300">
                    <Cloud className="h-3 w-3" />
                    Synced across devices
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <Button variant="secondary" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </>
          ) : (
            <>
              <CardTitle className="mt-1">Sign in to sync</CardTitle>
              <CardDescription className="mt-1">
                Your data lives only on this device. Sign in with a magic link to
                save it to your account and access it anywhere.
              </CardDescription>
              <div className="mt-5">
                <Link href="/sign-in">
                  <Button size="sm">
                    <Mail className="h-4 w-4" />
                    Sign in with email
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Card>

        {/* Data */}
        <Card>
          <CardEyebrow>Your data</CardEyebrow>
          <CardTitle className="mt-1">It&apos;s yours. Always.</CardTitle>
          <CardDescription className="mt-1">
            {entries} entries stored on this device. Export anytime.
          </CardDescription>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={downloadExport}>
              <Download className="h-4 w-4" />
              Export as JSON
            </Button>
            {!confirmingReset ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingReset(true)}
                className="text-rose-300 hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Reset this device
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingReset(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    clearAllLocalData();
                    setConfirmingReset(false);
                    setResetDone(true);
                    setTimeout(() => setResetDone(false), 2000);
                  }}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                >
                  Yes, clear everything
                </Button>
              </>
            )}
          </div>
          {resetDone && (
            <p className="mt-3 text-xs text-teal-300">
              ✓ Local data cleared. Refresh to start fresh.
            </p>
          )}
        </Card>

        {/* About */}
        <Card>
          <CardEyebrow>About</CardEyebrow>
          <CardTitle className="mt-1">Thrive · v0.1</CardTitle>
          <CardDescription className="mt-1">
            Built with care. Storage:{" "}
            <span className="inline-flex items-center gap-1 text-fg">
              <HardDrive className="h-3 w-3" />
              this device
            </span>
            {user && (
              <>
                {" + "}
                <span className="inline-flex items-center gap-1 text-fg">
                  <Cloud className="h-3 w-3" />
                  your account
                </span>
              </>
            )}
          </CardDescription>
          <div className="mt-5 flex flex-wrap gap-3 text-xs">
            <a
              href="https://github.com/caposhops/thrive"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-fg-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
            >
              <Code2 className="h-3.5 w-3.5" />
              Source
              <ExternalLink className="h-3 w-3" />
            </a>
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-fg-muted transition-colors hover:bg-white/[0.08] hover:text-fg"
            >
              Manifesto
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function readOnboarding() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("thrive:onboarding");
    if (!raw) return null;
    return JSON.parse(raw) as {
      name?: string;
      intent?: string;
      focus?: string[];
      vision?: string;
    };
  } catch {
    return null;
  }
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

function focusLabel(key: string) {
  return (
    {
      structure: "Daily structure",
      habits: "Better habits",
      focus: "Deeper focus",
      healing: "Emotional healing",
      vision: "Future vision",
      energy: "More energy",
    }[key] ?? key
  );
}
