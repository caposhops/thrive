import { MoodCheckin } from "@/components/today/mood-checkin";
import { PriorityList } from "@/components/today/priority-list";
import { StreakCard } from "@/components/today/streak-card";
import { AffirmationCard } from "@/components/today/affirmation-card";
import { greet, today } from "@/lib/utils";

export default function TodayPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">{today()}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {greet()}.
        </h1>
        <p className="mt-2 text-fg-muted">Let&apos;s shape a day that nourishes you.</p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <MoodCheckin />
          <PriorityList />
          <AffirmationCard />
        </div>
        <div className="flex flex-col gap-5">
          <StreakCard />
          <div className="glass rounded-3xl p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.18em] text-fg-subtle">Focus session</p>
            <p className="mt-3 font-display text-2xl font-semibold tracking-tight">25:00</p>
            <p className="mt-1 text-sm text-fg-muted">Pomodoro · soft chime at end</p>
            <button className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-gradient-brand px-5 text-sm font-medium text-black shadow-glow active:scale-[0.98]">
              Begin focus
            </button>
          </div>
          <div className="glass rounded-3xl p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.18em] text-fg-subtle">Energy</p>
            <p className="mt-3 text-sm text-fg-muted">Right now</p>
            <div className="mt-3 flex items-end gap-1.5">
              {[40, 55, 70, 62, 80, 72, 68].map((v, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t-lg bg-gradient-calm"
                  style={{ height: `${v}%` }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-fg-subtle">Last 7 days · trending up</p>
          </div>
        </div>
      </div>
    </div>
  );
}
