-- 성능·보안 점검(Supabase advisors) 반영
-- 1) 인덱스 없는 외래키 5개에 인덱스 추가 (조인·참조 무결성 검사·삭제 속도)
-- 2) 사전 승인 목록: SECURITY DEFINER 함수 대신 RLS(사업단만 조회) + SECURITY INVOKER
set local lock_timeout = '5s';

create index if not exists profiles_university_id_idx       on public.profiles (university_id);
create index if not exists extra_demand_university_id_idx   on public.extra_demand (university_id);
create index if not exists notices_author_id_idx            on public.notices (author_id);
create index if not exists reply_files_uploaded_by_idx      on public.reply_files (uploaded_by);
create index if not exists member_preapprovals_university_idx on private.member_preapprovals (university_id);

-- 사전 승인 목록은 API에 노출되지 않는 private 스키마에 있고, 사업단만 읽을 수 있음
grant select on private.member_preapprovals to authenticated;
drop policy if exists "hub read" on private.member_preapprovals;
create policy "hub read" on private.member_preapprovals for select to authenticated using (private.is_hub());

create or replace function public.member_preapproval_status()
returns table (
  email text,
  name text,
  university_id text,
  role public.user_role,
  "position" text,
  applied_at timestamptz,
  signed_up boolean,
  email_confirmed boolean,
  status public.user_status
)
language sql stable security invoker set search_path = public as $$
  select pa.email, coalesce(pa.name, p.name), pa.university_id, pa.role, pa.position, pa.applied_at,
         p.id is not null, coalesce(p.email_confirmed, false), p.status
    from private.member_preapprovals pa
    left join public.profiles p on lower(p.email) = pa.email
   order by pa.created_at, pa.email
$$;
revoke execute on function public.member_preapproval_status() from public, anon;
grant execute on function public.member_preapproval_status() to authenticated;
