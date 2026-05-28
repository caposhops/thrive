"use client";

import { useLocalStorage } from "@/lib/use-local-storage";
import { Card, CardEyebrow, CardTitle, CardDescription } from "@/components/ui/card";

const categories = [
  { key: "health", label: "Health", color: "#f472b6", value: 7 },
  { key: "fitness", label: "Fitness", color: "#fb923c", value: 5 },
  { key: "career", label: "Career", color: "#fbbf24", value: 8 },
  { key: "finances", label: "Finances", color: "#a3e635", value: 6 },
  { key: "creativity", label: "Creativity", color: "#5eead4", value: 9 },
  { key: "mental", label: "Mental", color: "#38bdf8", value: 7 },
  { key: "relationships", label: "Relationships", color: "#818cf8", value: 6 },
  { key: "purpose", label: "Purpose", color: "#a78bfa", value: 8 },
  { key: "spirit", label: "Spirit", color: "#c084fc", value: 5 },
  { key: "fun", label: "Fun", color: "#f0abfc", value: 4 },
];

export default function BalancePage() {
  const [values, setValues] = useLocalStorage("thrive:balance", categories);

  const size = 360;
  const center = size / 2;
  const maxR = size / 2 - 36;
  const slice = (Math.PI * 2) / values.length;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Circle of life</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Where are you <span className="text-gradient-calm">growing</span>?
        </h1>
        <p className="mt-2 text-fg-muted">
          Rate each area 1–10. The wheel reveals your shape over time.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="flex items-center justify-center p-8">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full">
              {/* Grid rings */}
              {[2, 4, 6, 8, 10].map((r) => (
                <circle
                  key={r}
                  cx={center}
                  cy={center}
                  r={(r / 10) * maxR}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
              ))}
              {/* Spokes */}
              {values.map((_, i) => {
                const angle = i * slice - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={center + Math.cos(angle) * maxR}
                    y2={center + Math.sin(angle) * maxR}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                  />
                );
              })}
              {/* Filled shape */}
              <polygon
                points={values
                  .map((v, i) => {
                    const angle = i * slice - Math.PI / 2;
                    const r = (v.value / 10) * maxR;
                    return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
                  })
                  .join(" ")}
                fill="url(#wheelGrad)"
                fillOpacity="0.4"
                stroke="url(#wheelGrad)"
                strokeWidth="2"
              />
              {/* Points */}
              {values.map((v, i) => {
                const angle = i * slice - Math.PI / 2;
                const r = (v.value / 10) * maxR;
                return (
                  <circle
                    key={v.key}
                    cx={center + Math.cos(angle) * r}
                    cy={center + Math.sin(angle) * r}
                    r="4"
                    fill={v.color}
                  />
                );
              })}
              {/* Labels */}
              {values.map((v, i) => {
                const angle = i * slice - Math.PI / 2;
                const lx = center + Math.cos(angle) * (maxR + 22);
                const ly = center + Math.sin(angle) * (maxR + 22);
                return (
                  <text
                    key={`l-${v.key}`}
                    x={lx}
                    y={ly}
                    fontSize="11"
                    fill="rgba(245,241,255,0.7)"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="var(--font-sans)"
                  >
                    {v.label}
                  </text>
                );
              })}
              <defs>
                <linearGradient id="wheelGrad" x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#a78bfa" />
                  <stop offset="0.5" stopColor="#f472b6" />
                  <stop offset="1" stopColor="#5eead4" />
                </linearGradient>
              </defs>
            </svg>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-3">
          <Card>
            <CardEyebrow>Adjust</CardEyebrow>
            <CardTitle className="mt-1">How are you feeling here?</CardTitle>
            <CardDescription className="mt-1">
              Drag the sliders. Be honest, not aspirational.
            </CardDescription>
            <ul className="mt-5 space-y-3.5">
              {values.map((v, i) => (
                <li key={v.key} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: v.color }}
                  />
                  <span className="w-24 shrink-0 text-sm text-fg">{v.label}</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={v.value}
                    onChange={(e) => {
                      const next = [...values];
                      next[i] = { ...v, value: Number(e.target.value) };
                      setValues(next);
                    }}
                    className="flex-1 accent-violet-400"
                  />
                  <span className="w-6 text-right text-sm tabular-nums text-fg-muted">
                    {v.value}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
