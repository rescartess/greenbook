-- 0002 Content: questions and the sets they belong to.
-- Signed-in students can read published content. Only admins can write.
-- Correct answers live in question_answers, which students can never read.

create table public.domains (
  id smallint generated always as identity primary key,
  subject text not null check (subject in ('english', 'math')),
  name text not null,
  sort_order smallint not null,
  unique (subject, name)
);

create table public.skills (
  id integer generated always as identity primary key,
  domain_id smallint not null references public.domains (id),
  name text not null,
  slug text not null unique,
  sort_order smallint not null
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  subject text not null check (subject in ('english', 'math')),
  skill_id integer references public.skills (id),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  type text not null check (type in ('mcq', 'spr')),
  passage text,
  prompt text not null,
  choices jsonb,
  image_path text,
  source text,
  month date,
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_subject_skill on public.questions (subject, skill_id) where status = 'published';
create index questions_month on public.questions (month) where month is not null;

create table public.question_answers (
  question_id uuid primary key references public.questions (id) on delete cascade,
  correct_answer text not null,
  accepted_answers text[] not null default '{}',
  explanation text
);

create table public.question_sets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('full_test', 'topic', 'monthly')),
  title text not null,
  subject text not null check (subject in ('english', 'math')),
  skill_id integer references public.skills (id),
  month date,
  is_adaptive boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.question_sets (id) on delete cascade,
  module_number smallint not null check (module_number in (1, 2)),
  tier text not null default 'standard' check (tier in ('standard', 'easier', 'harder')),
  time_limit_sec integer,
  sort_order smallint not null default 0
);

create table public.module_questions (
  module_id uuid not null references public.modules (id) on delete cascade,
  question_id uuid not null references public.questions (id),
  position smallint not null,
  primary key (module_id, position),
  unique (module_id, question_id)
);

create table public.score_tables (
  subject text not null check (subject in ('english', 'math')),
  tier text not null check (tier in ('easier', 'harder')),
  raw_correct smallint not null,
  scaled_score smallint not null check (scaled_score between 200 and 800),
  primary key (subject, tier, raw_correct)
);

alter table public.domains enable row level security;
alter table public.skills enable row level security;
alter table public.questions enable row level security;
alter table public.question_answers enable row level security;
alter table public.question_sets enable row level security;
alter table public.modules enable row level security;
alter table public.module_questions enable row level security;
alter table public.score_tables enable row level security;

-- Reading
create policy "Signed-in users read domains" on public.domains for select to authenticated using (true);
create policy "Signed-in users read skills" on public.skills for select to authenticated using (true);
create policy "Signed-in users read score tables" on public.score_tables for select to authenticated using (true);
create policy "Signed-in users read published questions" on public.questions
  for select to authenticated using (status = 'published' or (select public.is_admin()));
create policy "Signed-in users read published sets" on public.question_sets
  for select to authenticated using (published or (select public.is_admin()));
create policy "Signed-in users read modules of published sets" on public.modules
  for select to authenticated using (
    (select public.is_admin())
    or exists (select 1 from public.question_sets s where s.id = set_id and s.published)
  );
create policy "Signed-in users read questions of published sets" on public.module_questions
  for select to authenticated using (
    (select public.is_admin())
    or exists (
      select 1 from public.modules m join public.question_sets s on s.id = m.set_id
      where m.id = module_id and s.published
    )
  );
-- question_answers: no student policy at all, so only admins and server-side grading can read it.

-- Writing (admins only)
create policy "Admins manage domains" on public.domains for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage skills" on public.skills for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage questions" on public.questions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage answers" on public.question_answers for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage sets" on public.question_sets for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage modules" on public.modules for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage module questions" on public.module_questions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage score tables" on public.score_tables for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Editing a question bumps its version, so old answers stay explainable.
create function public.bump_question_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.prompt, new.passage, new.choices, new.image_path)
     is distinct from (old.prompt, old.passage, old.choices, old.image_path) then
    new.version := old.version + 1;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger questions_version
  before update on public.questions
  for each row execute function public.bump_question_version();
