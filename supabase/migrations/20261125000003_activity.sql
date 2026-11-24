-- 0003 Activity: what each student did.
-- Students can read only their own rows. Writing (starting tests, saving and
-- grading answers) is added with the practice and test features, through
-- server-side functions, so nobody can mark their own answers correct.

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  set_id uuid references public.question_sets (id),
  subject text not null check (subject in ('english', 'math')),
  kind text not null default 'set' check (kind in ('set', 'mistakes_review')),
  mode text not null check (mode in ('timed', 'practice')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  raw_correct smallint,
  scaled_score smallint check (scaled_score between 200 and 800)
);
create index attempts_user on public.attempts (user_id, started_at desc);

create table public.attempt_modules (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  module_id uuid references public.modules (id),
  question_ids uuid[] not null,
  started_at timestamptz not null default now(),
  deadline_at timestamptz,
  submitted_at timestamptz,
  correct_count smallint
);

create table public.responses (
  attempt_module_id uuid not null references public.attempt_modules (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  question_version integer not null default 1,
  answer text,
  is_correct boolean,
  marked_for_review boolean not null default false,
  eliminated text[] not null default '{}',
  time_spent_sec integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (attempt_module_id, question_id)
);

create table public.question_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  times_seen integer not null default 0,
  times_wrong integer not null default 0,
  last_result text check (last_result in ('correct', 'wrong')),
  correct_streak smallint not null default 0,
  last_seen_at timestamptz,
  mastered boolean not null default false,
  primary key (user_id, question_id)
);
create index question_progress_mistakes on public.question_progress (user_id) where times_wrong > 0 and not mastered;

alter table public.attempts enable row level security;
alter table public.attempt_modules enable row level security;
alter table public.responses enable row level security;
alter table public.question_progress enable row level security;

create policy "Students read their own attempts" on public.attempts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students read their own modules" on public.attempt_modules
  for select to authenticated using (
    exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = (select auth.uid()))
  );
create policy "Students read their own responses" on public.responses
  for select to authenticated using (
    exists (
      select 1 from public.attempt_modules am join public.attempts a on a.id = am.attempt_id
      where am.id = attempt_module_id and a.user_id = (select auth.uid())
    )
  );
create policy "Students read their own progress" on public.question_progress
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Admins read all activity" on public.attempts for select to authenticated using ((select public.is_admin()));
