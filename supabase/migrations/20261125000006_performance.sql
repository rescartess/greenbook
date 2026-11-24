-- 0006 Performance: index every foreign key, and give admins separate write rules so each read runs one policy.

create index if not exists attempt_modules_attempt_id_idx on public.attempt_modules (attempt_id);
create index if not exists attempt_modules_module_id_idx on public.attempt_modules (module_id);
create index if not exists attempts_set_id_idx on public.attempts (set_id);
create index if not exists module_questions_question_id_idx on public.module_questions (question_id);
create index if not exists modules_set_id_idx on public.modules (set_id);
create index if not exists question_progress_question_id_idx on public.question_progress (question_id);
create index if not exists question_sets_skill_id_idx on public.question_sets (skill_id);
create index if not exists questions_skill_id_idx on public.questions (skill_id);
create index if not exists responses_question_id_idx on public.responses (question_id);
create index if not exists skills_domain_id_idx on public.skills (domain_id);

drop policy "Admins manage domains" on public.domains;
create policy "Admins insert domains" on public.domains for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update domains" on public.domains for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete domains" on public.domains for delete to authenticated using ((select private.is_admin()));

drop policy "Admins manage skills" on public.skills;
create policy "Admins insert skills" on public.skills for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update skills" on public.skills for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete skills" on public.skills for delete to authenticated using ((select private.is_admin()));

drop policy "Admins manage questions" on public.questions;
create policy "Admins insert questions" on public.questions for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update questions" on public.questions for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete questions" on public.questions for delete to authenticated using ((select private.is_admin()));

drop policy "Admins manage sets" on public.question_sets;
create policy "Admins insert sets" on public.question_sets for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update sets" on public.question_sets for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete sets" on public.question_sets for delete to authenticated using ((select private.is_admin()));

drop policy "Admins manage modules" on public.modules;
create policy "Admins insert modules" on public.modules for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update modules" on public.modules for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete modules" on public.modules for delete to authenticated using ((select private.is_admin()));

drop policy "Admins manage module questions" on public.module_questions;
create policy "Admins insert module questions" on public.module_questions for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update module questions" on public.module_questions for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete module questions" on public.module_questions for delete to authenticated using ((select private.is_admin()));

drop policy "Admins manage score tables" on public.score_tables;
create policy "Admins insert score tables" on public.score_tables for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update score tables" on public.score_tables for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete score tables" on public.score_tables for delete to authenticated using ((select private.is_admin()));

drop policy "Admins read all activity" on public.attempts;
drop policy "Students read their own attempts" on public.attempts;
create policy "Students read their own attempts, admins read all" on public.attempts
  for select to authenticated using ((select auth.uid()) = user_id or (select private.is_admin()));
