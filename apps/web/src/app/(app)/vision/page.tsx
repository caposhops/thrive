"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Upload,
  Download,
  Wand2,
  Cloud,
  HardDrive,
  X,
  Plus,
  ChevronDown,
  Trash2,
  Check,
} from "lucide-react";
import { useLocalStorage } from "@/lib/use-local-storage";
import { Card, CardEyebrow } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/supabase/use-user";
import {
  fetchGeneratedVisionItems,
  createVisionItem,
  deleteVisionItem,
  type VisionItemRow,
} from "@/lib/supabase/vision";
import {
  fetchTodayPriorities,
  createPriority,
} from "@/lib/supabase/priorities";
import {
  useVisionStore,
  visionIdFromTitle,
  type VisionAction,
} from "@/lib/vision-store";

const boards = [
  {
    title: "The Founder Era",
    horizon: "1 year",
    why: "I build calm, useful things and people are changed by them.",
    gradient: "from-violet-500 via-fuchsia-500 to-amber-400",
    emoji: "🚀",
  },
  {
    title: "Embodied Health",
    horizon: "6 months",
    why: "Strong, mobile, present in my body. Sleep that restores me.",
    gradient: "from-teal-400 via-emerald-400 to-lime-400",
    emoji: "🌿",
  },
  {
    title: "Sanctuary Home",
    horizon: "2 years",
    why: "A space full of light, plants, art, and music that makes me feel home.",
    gradient: "from-rose-400 via-orange-400 to-amber-300",
    emoji: "🏡",
  },
  {
    title: "Deep Relationships",
    horizon: "Ongoing",
    why: "Slower conversations. People who know my full self.",
    gradient: "from-indigo-400 via-violet-400 to-pink-400",
    emoji: "💞",
  },
];

type GeneratedLocal = { url: string; prompt: string };

type DisplayItem = { id: string; url: string; prompt: string };

export default function VisionPage() {
  const { user } = useUser();
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [localGenerated, setLocalGenerated] = useLocalStorage<GeneratedLocal[]>(
    "thrive:vision:generated",
    [],
  );
  const [cloudItems, setCloudItems] = useState<VisionItemRow[] | null>(null);
  const [selectedVisionId, setSelectedVisionId] = useState<string | null>(null);

  const isAuthed = !!user;

  useEffect(() => {
    if (!user) {
      setCloudItems(null);
      return;
    }
    let cancelled = false;
    fetchGeneratedVisionItems(user.id).then((items) => {
      if (!cancelled) setCloudItems(items);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const items: DisplayItem[] = isAuthed
    ? (cloudItems ?? []).map((r) => ({
        id: r.id,
        url: r.image_url,
        prompt: r.prompt ?? "",
      }))
    : localGenerated.map((g, i) => ({
        id: `${g.prompt}-${i}`,
        url: g.url,
        prompt: g.prompt,
      }));

  const generate = async () => {
    const p = prompt.trim();
    if (!p) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/vision/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const data = (await res.json()) as { image_url: string };
      if (isAuthed && user) {
        const { row } = await createVisionItem(user.id, {
          image_url: data.image_url,
          prompt: p,
        });
        if (row) setCloudItems((prev) => [row, ...(prev ?? [])].slice(0, 24));
      } else {
        setLocalGenerated((g) =>
          [{ url: data.image_url, prompt: p }, ...g].slice(0, 8),
        );
      }
      setPrompt("");
    } finally {
      setGenerating(false);
    }
  };

  const remove = async (id: string) => {
    if (isAuthed) {
      setCloudItems((prev) => prev?.filter((r) => r.id !== id) ?? prev);
      await deleteVisionItem(id);
    } else {
      const idx = parseInt(id.split("-").pop() ?? "-1", 10);
      if (!Number.isNaN(idx) && idx >= 0) {
        setLocalGenerated((g) => g.filter((_, i) => i !== idx));
      }
    }
  };

  const selectedBoard = boards.find(
    (b) => visionIdFromTitle(b.title) === selectedVisionId,
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Vision</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            The life you&apos;re <span className="text-gradient">walking toward</span>.
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] tracking-wide text-fg-subtle">
            {isAuthed ? (
              <>
                <Cloud className="h-3 w-3 text-teal-300" />
                <span className="text-teal-300">Synced</span>
                <span>· generated images saved to your account</span>
              </>
            ) : (
              <>
                <HardDrive className="h-3 w-3" />
                <span>Local · saved on this device only</span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Export wallpaper
          </Button>
          <Button size="sm">
            <Sparkles className="h-4 w-4" />
            New board
          </Button>
        </div>
      </header>

      {/* AI generator */}
      <Card className="mb-8 bg-gradient-glow">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
            <Wand2 className="h-6 w-6 text-black" />
          </div>
          <div className="flex-1">
            <CardEyebrow>AI vision generator</CardEyebrow>
            <p className="mt-1 font-display text-xl font-semibold text-fg">
              Describe a moment from your future life.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A sunrise studio, plants, my book on the desk…"
                className="h-12 flex-1 rounded-full bg-white/[0.04] px-5 text-[15px] text-fg outline-none ring-1 ring-inset ring-white/[0.06] placeholder:text-fg-subtle focus:ring-white/15"
              />
              <Button onClick={generate} disabled={generating || !prompt.trim()}>
                {generating ? "Manifesting…" : "Generate"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-fg-subtle">
              Set FAL_KEY in .env.local to enable real image generation.
            </p>
            {items.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {items.map((g) => (
                  <div
                    key={g.id}
                    className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-white/10"
                  >
                    <Image
                      src={g.url}
                      alt={g.prompt}
                      fill
                      sizes="200px"
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      onClick={() => remove(g.id)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                      aria-label="Delete vision"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="line-clamp-2 text-[10px] leading-tight text-white/90">
                        {g.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Boards grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => {
          const vid = visionIdFromTitle(board.title);
          const isSelected = selectedVisionId === vid;
          return (
            <button
              key={board.title}
              onClick={() => setSelectedVisionId(isSelected ? null : vid)}
              className={cn(
                "group relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-white/10 transition-all hover:ring-white/20",
                isSelected && "ring-2 ring-white/40 shadow-glow",
              )}
              aria-expanded={isSelected}
              aria-controls="vision-detail-panel"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${board.gradient} opacity-90`}
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 flex flex-col justify-between p-5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-3xl drop-shadow">{board.emoji}</span>
                  <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {board.horizon}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold leading-tight text-white drop-shadow-sm">
                    {board.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">
                    {board.why}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-white/90">
                    {isSelected ? "Hide milestones" : "Open milestones"}
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        isSelected && "rotate-180",
                      )}
                    />
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {/* Add new */}
        <button className="group flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-white/15 transition-all hover:border-white/30 hover:bg-white/[0.02]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] transition-transform group-hover:scale-110">
            <Upload className="h-6 w-6 text-fg-muted" />
          </div>
          <p className="font-display text-base font-medium text-fg">Add a vision</p>
          <p className="max-w-[180px] text-center text-xs text-fg-subtle">
            Upload an image or describe a future moment
          </p>
        </button>
      </div>

      {/* Vision-to-action detail panel */}
      {selectedBoard && (
        <div id="vision-detail-panel" className="mt-6">
          <VisionDetail
            visionId={selectedVisionId as string}
            visionTitle={selectedBoard.title}
            visionEmoji={selectedBoard.emoji}
            onClose={() => setSelectedVisionId(null)}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Detail panel for one vision: milestones and their actions, with the ability
 * to push any action to today's Top 3 (Priorities). The push creates a
 * priority via the same code paths PriorityList uses, then records the link
 * in vision-store so completing the priority fires the vision toast.
 */
function VisionDetail({
  visionId,
  visionTitle,
  visionEmoji,
  onClose,
}: {
  visionId: string;
  visionTitle: string;
  visionEmoji: string;
  onClose: () => void;
}) {
  const { user } = useUser();
  const {
    milestonesForVision,
    actionsForMilestone,
    addMilestone,
    removeMilestone,
    addAction,
    removeAction,
    linkPriorityToAction,
  } = useVisionStore();

  const [milestoneDraft, setMilestoneDraft] = useState("");
  const [actionDrafts, setActionDrafts] = useState<Record<string, string>>({});
  const [pushBusy, setPushBusy] = useState<string | null>(null); // actionId in flight
  const [status, setStatus] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  const milestones = milestonesForVision(visionId);

  const submitMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (addMilestone(visionId, milestoneDraft)) {
      setMilestoneDraft("");
    }
  };

  const submitAction = (milestoneId: string) => (e: React.FormEvent) => {
    e.preventDefault();
    const text = actionDrafts[milestoneId] ?? "";
    if (addAction(milestoneId, visionId, text)) {
      setActionDrafts((prev) => ({ ...prev, [milestoneId]: "" }));
    }
  };

  const flashStatus = (text: string, kind: "ok" | "error") => {
    setStatus({ kind, text });
    window.setTimeout(() => setStatus(null), 2500);
  };

  const pushActionToToday = async (action: VisionAction) => {
    setPushBusy(action.id);
    try {
      if (user) {
        // Cloud path — respect the 3-priority ceiling
        const existing = await fetchTodayPriorities(user.id);
        if (existing.length >= 3) {
          flashStatus("Top 3 is full. Clear one and try again.", "error");
          return;
        }
        const { row } = await createPriority(
          user.id,
          action.title,
          existing.length,
        );
        if (!row) {
          flashStatus("Couldn't add to Top 3.", "error");
          return;
        }
        linkPriorityToAction(row.id, action.id, visionId, visionTitle);
      } else {
        // Anon path — mutate localStorage directly, mirroring priority-list's shape
        const dayKey = `thrive:priorities:${new Date().toISOString().slice(0, 10)}`;
        let current: Array<{ id: string; text: string; done: boolean }> = [];
        try {
          const raw = window.localStorage.getItem(dayKey);
          current = raw ? JSON.parse(raw) : [];
        } catch {
          current = [];
        }
        // Strip completed placeholders so a fresh vision-driven Top 3 has room
        const active = current.filter((t) => !t.done);
        if (active.length >= 3) {
          flashStatus("Top 3 is full. Clear one and try again.", "error");
          return;
        }
        const newTask = {
          id: crypto.randomUUID(),
          text: action.title,
          done: false,
        };
        const next = [...active, newTask];
        window.localStorage.setItem(dayKey, JSON.stringify(next));
        linkPriorityToAction(newTask.id, action.id, visionId, visionTitle);
      }
      flashStatus("Added to today's Top 3.", "ok");
    } finally {
      setPushBusy(null);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <CardEyebrow>Vision → Milestones → Actions</CardEyebrow>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-fg">
            <span className="mr-2">{visionEmoji}</span>
            {visionTitle}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            Break it into milestones. Break those into small next actions.
            Push any action to today&apos;s Top 3.
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-white/[0.05] hover:text-fg"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {status && (
        <div
          className={cn(
            "mt-4 rounded-xl px-3 py-2 text-xs",
            status.kind === "ok"
              ? "bg-teal-500/15 text-teal-200"
              : "bg-rose-500/15 text-rose-200",
          )}
          role="status"
        >
          {status.text}
        </div>
      )}

      {/* Milestones list */}
      {milestones.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white/[0.02] p-4 text-center text-sm text-fg-subtle">
          No milestones yet. Add one below to start the thread.
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {milestones.map((m) => {
            const actions = actionsForMilestone(m.id);
            return (
              <li
                key={m.id}
                className="rounded-2xl bg-white/[0.03] p-4"
              >
                <div className="group flex items-start justify-between gap-3">
                  <h3 className="font-display text-base font-semibold text-fg">
                    {m.title}
                  </h3>
                  <button
                    onClick={() => removeMilestone(m.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-fg-subtle transition-all hover:bg-rose-500/15 hover:text-rose-300 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Remove milestone ${m.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {actions.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {actions.map((a) => (
                      <li
                        key={a.id}
                        className="group flex items-center gap-2 rounded-xl bg-white/[0.03] p-2 pl-3"
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                            a.done
                              ? "border-transparent bg-gradient-brand"
                              : "border-white/20",
                          )}
                        >
                          {a.done && (
                            <Check
                              className="h-2.5 w-2.5 text-black"
                              strokeWidth={3}
                            />
                          )}
                        </span>
                        <span
                          className={cn(
                            "flex-1 text-[14px] leading-snug",
                            a.done
                              ? "text-fg-subtle line-through decoration-white/20"
                              : "text-fg",
                          )}
                        >
                          {a.title}
                        </span>
                        {!a.done && (
                          <button
                            onClick={() => pushActionToToday(a)}
                            disabled={pushBusy === a.id}
                            className="glass shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium text-fg-muted transition-colors hover:bg-white/[0.08] hover:text-fg disabled:opacity-40"
                            title="Add this action to today's Top 3"
                          >
                            {pushBusy === a.id ? "Adding…" : "→ Top 3"}
                          </button>
                        )}
                        <button
                          onClick={() => removeAction(a.id)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-fg-subtle transition-all hover:bg-rose-500/15 hover:text-rose-300 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label={`Remove action ${a.title}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <form
                  onSubmit={submitAction(m.id)}
                  className="mt-3 flex items-center gap-2"
                >
                  <div className="flex h-9 flex-1 items-center gap-2 rounded-full bg-white/[0.03] px-3">
                    <Plus className="h-3 w-3 text-fg-subtle" />
                    <input
                      value={actionDrafts[m.id] ?? ""}
                      onChange={(e) =>
                        setActionDrafts((prev) => ({
                          ...prev,
                          [m.id]: e.target.value,
                        }))
                      }
                      placeholder="A small next action…"
                      className="h-full flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-subtle"
                      aria-label={`New action for ${m.title}`}
                    />
                  </div>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add milestone */}
      <form onSubmit={submitMilestone} className="mt-5 flex items-center gap-2">
        <div className="glass flex h-11 flex-1 items-center gap-2 rounded-full px-4">
          <Plus className="h-4 w-4 text-fg-subtle" />
          <input
            value={milestoneDraft}
            onChange={(e) => setMilestoneDraft(e.target.value)}
            placeholder="A milestone toward this vision…"
            className="h-full flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
            aria-label="New milestone"
          />
        </div>
        <Button type="submit" size="sm" disabled={!milestoneDraft.trim()}>
          Add
        </Button>
      </form>
    </Card>
  );
}
