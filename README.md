# Thrive

> An emotionally intelligent ADHD productivity and personal transformation platform.

## Monorepo layout

```
thrive/
├── apps/
│   └── web/        Next.js 16 — primary product (web + canonical API)
├── packages/       (shared UI, core logic, db types — coming as we add mobile)
└── package.json    npm workspaces root
```

The web app ships first. A React Native (Expo) app comes later and shares code via `packages/`.

## Quick start

```bash
# from the repo root
npm run dev          # starts apps/web on http://localhost:3000
```

## Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **Tailwind CSS v4** (in-CSS theme tokens, no config file)
- **Framer Motion** + custom motion primitives
- **Supabase** for auth, Postgres, storage, realtime (scaffolded; see `apps/web/src/lib/supabase/`)
- **Anthropic Claude API** for the coach (planned; endpoint at `/api/coach`)
- **fal.ai or Replicate** for vision board image generation

## App map

| Route             | Purpose                                                |
| ----------------- | ------------------------------------------------------ |
| `/`               | Landing                                                |
| `/onboarding`     | 4-step welcome flow (name → intent → focus → vision)   |
| `/today`          | Daily dashboard — mood, top 3, streak, affirmation     |
| `/habits`         | Build / break habits with XP & levels                  |
| `/vision`         | Vision boards + AI generator                           |
| `/coach`          | Calm-mentor AI conversation                            |
| `/balance`        | Circle of Life wheel — rate 10 categories              |

## What's next

1. Connect Supabase (set env vars, run `schema.sql`)
2. Wire `/api/coach` to Anthropic with a calm-mentor system prompt + streaming
3. Wire `/api/vision/generate` to fal.ai
4. Build out the Expo app under `apps/mobile`
