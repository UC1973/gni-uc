-- 가입자 현황(관리 화면): 사전 승인 목록과 가입·인증·승인 진행 상태를 UC 사업단만 조회
set local lock_timeout = '2s';

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
language sql stable security definer set search_path = public as $$
  select pa.email, coalesce(pa.name, p.name), pa.university_id, pa.role, pa.position, pa.applied_at,
         p.id is not null, coalesce(p.email_confirmed, false), p.status
    from private.member_preapprovals pa
    left join public.profiles p on lower(p.email) = pa.email
   where private.is_hub()
   order by pa.created_at, pa.email
$$;
revoke execute on function public.member_preapproval_status() from public, anon;
grant execute on function public.member_preapproval_status() to authenticated;
