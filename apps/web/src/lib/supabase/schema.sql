-- Thrive — Supabase schema sketch (v0.1)
-- Run in the Supabase SQL editor after creating a fresh project.

-- =========================
-- Profiles
-- =========================
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text,
  intent       text,
  vision       text,
  focus_areas  text[] default '{}',
  onboarded_at timestamptz,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "self read"  on public.profiles for select using (auth.uid() = id);
create policy "self write" on public.profiles for update using (auth.uid() = id);
create policy "self insert" on public.profiles for insert with check (auth.uid() = id);

-- =========================
-- Mood check-ins
-- =========================
create table public.mood_checkins (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  value     smallint not null check (value between 1 and 5),
  note      text,
  energy    smallint check (energy between 1 and 10),
  created_at timestamptz default now()
);
create index on public.mood_checkins (user_id, created_at desc);
alter table public.mood_checkins enable row level security;
create policy "self all" on public.mood_checkins for all using (auth.uid() = user_id);

-- =========================
-- Habits
-- =========================
create table public.habits (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  icon            text,
  type            text check (type in ('build','break')) default 'build',
  goal_per_week   smallint default 7,
  active          boolean default true,
  created_at      timestamptz default now()
);

create table public.habit_logs (
  id        uuid primary key default gen_random_uuid(),
  habit_id  uuid not null references public.habits(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  done_on   date not null,
  unique (habit_id, done_on)
);
create index on public.habit_logs (user_id, done_on desc);

alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
create policy "self all" on public.habits for all using (auth.uid() = user_id);
create policy "self all" on public.habit_logs for all using (auth.uid() = user_id);

-- =========================
-- Priorities (Top 3 today)
-- =========================
create table public.priorities (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  done       boolean default false,
  for_date   date not null default current_date,
  position   smallint default 0,
  created_at timestamptz default now()
);
alter table public.priorities enable row level security;
create policy "self all" on public.priorities for all using (auth.uid() = user_id);

-- =========================
-- Vision boards
-- =========================
create table public.vision_boards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  horizon    text,                 -- "6 months", "1 year", "5 years"
  why        text,
  cover_url  text,
  created_at timestamptz default now()
);

create table public.vision_items (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.vision_boards(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  image_url  text,
  prompt     text,
  caption    text,
  position   smallint default 0,
  created_at timestamptz default now()
);

alter table public.vision_boards enable row level security;
alter table public.vision_items enable row level security;
create policy "self all" on public.vision_boards for all using (auth.uid() = user_id);
create policy "self all" on public.vision_items for all using (auth.uid() = user_id);

-- =========================
-- Coach conversations
-- =========================
create table public.coach_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null check (role in ('user','coach','system')),
  content    text not null,
  created_at timestamptz default now()
);
create index on public.coach_messages (user_id, created_at);
alter table public.coach_messages enable row level security;
create policy "self all" on public.coach_messages for all using (auth.uid() = user_id);

-- =========================
-- Circle of life ratings
-- =========================
create table public.balance_ratings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  category   text not null,         -- 'health','fitness','career','finances',etc
  value      smallint not null check (value between 1 and 10),
  rated_on   date not null default current_date,
  unique (user_id, category, rated_on)
);
alter table public.balance_ratings enable row level security;
create policy "self all" on public.balance_ratings for all using (auth.uid() = user_id);

-- =========================
-- Daily rhythm — the "ritual rhythm" planner
-- =========================
create table public.plan_blocks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  for_date   date not null default current_date,
  start_time time not null,             -- rough target time, e.g. '09:00'
  title      text not null,
  notes      text,
  done       boolean default false,
  position   smallint default 0,
  created_at timestamptz default now()
);
create index on public.plan_blocks (user_id, for_date, start_time);
alter table public.plan_blocks enable row level security;
create policy "self all" on public.plan_blocks for all using (auth.uid() = user_id);

create table public.day_reflections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  for_date   date not null default current_date,
  reflection text,
  mood_after smallint check (mood_after between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, for_date)
);
alter table public.day_reflections enable row level security;
create policy "self all" on public.day_reflections for all using (auth.uid() = user_id);

-- =========================
-- Weekly rhythm — recurring blocks per day of week
-- =========================
create table public.recurring_blocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),  -- 0 = Sunday
  start_time  time not null,
  title       text not null,
  active      boolean default true,
  created_at  timestamptz default now()
);
create index on public.recurring_blocks (user_id, day_of_week);
alter table public.recurring_blocks enable row level security;
create policy "self all" on public.recurring_blocks for all using (auth.uid() = user_id);

-- Tracks which days have already had their recurring template materialized
-- into plan_blocks, so we don't re-materialize on every page load.
create table public.materialized_days (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  for_date        date not null,
  materialized_at timestamptz default now(),
  primary key (user_id, for_date)
);
alter table public.materialized_days enable row level security;
create policy "self all" on public.materialized_days for all using (auth.uid() = user_id);

-- =========================
-- Focus sessions — logged Pomodoro runs
-- =========================
create table public.focus_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  started_at       timestamptz not null,
  ended_at         timestamptz,
  duration_seconds integer not null,   -- planned duration
  actual_seconds   integer,             -- actual completed time
  label            text,
  completed        boolean default false,
  created_at       timestamptz default now()
);
create index on public.focus_sessions (user_id, started_at desc);
alter table public.focus_sessions enable row level security;
create policy "self all" on public.focus_sessions for all using (auth.uid() = user_id);
