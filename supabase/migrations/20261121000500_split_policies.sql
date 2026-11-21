-- 성능 경고 정리: 같은 동작(SELECT)에 겹치는 허용 정책을 없앰. 권한 범위는 그대로.
-- "hub all"(FOR ALL) → 사업단 INSERT/UPDATE/DELETE 정책으로 분리 (조회는 기존 read 정책이 담당)

drop policy "hub all" on public.universities;
create policy "hub insert" on public.universities for insert with check (private.is_hub());
create policy "hub update" on public.universities for update using (private.is_hub()) with check (private.is_hub());
create policy "hub delete" on public.universities for delete using (private.is_hub());

drop policy "hub all" on public.courses;
create policy "hub insert" on public.courses for insert with check (private.is_hub());
create policy "hub update" on public.courses for update using (private.is_hub()) with check (private.is_hub());
create policy "hub delete" on public.courses for delete using (private.is_hub());

drop policy "hub all" on public.site_settings;
create policy "hub insert" on public.site_settings for insert with check (private.is_hub());
create policy "hub update" on public.site_settings for update using (private.is_hub()) with check (private.is_hub());
create policy "hub delete" on public.site_settings for delete using (private.is_hub());

drop policy "hub all" on public.extra_programs;
create policy "hub insert" on public.extra_programs for insert with check (private.is_hub());
create policy "hub update" on public.extra_programs for update using (private.is_hub()) with check (private.is_hub());
create policy "hub delete" on public.extra_programs for delete using (private.is_hub());

drop policy "hub all" on public.notices;
create policy "hub insert" on public.notices for insert with check (private.is_hub());
create policy "hub update" on public.notices for update using (private.is_hub()) with check (private.is_hub());
create policy "hub delete" on public.notices for delete using (private.is_hub());

drop policy "hub all" on public.materials;
create policy "hub insert" on public.materials for insert with check (private.is_hub());
create policy "hub update" on public.materials for update using (private.is_hub()) with check (private.is_hub());
create policy "hub delete" on public.materials for delete using (private.is_hub());

drop policy "hub all" on public.issues;
create policy "hub insert" on public.issues for insert with check (private.is_hub());
create policy "hub update" on public.issues for update using (private.is_hub()) with check (private.is_hub());
create policy "hub delete" on public.issues for delete using (private.is_hub());

drop policy "hub all" on public.meetings;
create policy "hub insert" on public.meetings for insert with check (private.is_hub());
create policy "hub update" on public.meetings for update using (private.is_hub()) with check (private.is_hub());
create policy "hub delete" on public.meetings for delete using (private.is_hub());

drop policy "hub all" on public.kpis;
create policy "hub insert" on public.kpis for insert with check (private.is_hub());
create policy "hub update" on public.kpis for update using (private.is_hub()) with check (private.is_hub());
create policy "hub delete" on public.kpis for delete using (private.is_hub());

drop policy "own univ write" on public.replies;
create policy "own univ insert" on public.replies for insert with check (private.is_hub() or university_id = private.my_univ());
create policy "own univ update" on public.replies for update using (private.is_hub() or university_id = private.my_univ()) with check (private.is_hub() or university_id = private.my_univ());
create policy "own univ delete" on public.replies for delete using (private.is_hub() or university_id = private.my_univ());

drop policy "own univ write" on public.extra_demand;
create policy "own univ insert" on public.extra_demand for insert with check (private.is_hub() or university_id = private.my_univ());
create policy "own univ update" on public.extra_demand for update using (private.is_hub() or university_id = private.my_univ()) with check (private.is_hub() or university_id = private.my_univ());
create policy "own univ delete" on public.extra_demand for delete using (private.is_hub() or university_id = private.my_univ());
