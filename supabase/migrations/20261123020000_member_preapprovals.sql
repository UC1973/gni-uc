-- 사전 승인 교직원: UC 사업단이 미리 지정한 메일 주소로 본인이 /signup 가입하고
-- 이메일 인증을 마치면 지정한 역할로 자동 승인합니다. (비밀번호는 본인이 정함)
-- 목록은 API에 노출되지 않는 private 스키마에 두며, 전화번호 등 연락처는 저장하지 않습니다.
set local lock_timeout = '2s';

create table if not exists private.member_preapprovals (
  email text primary key check (email = lower(email)),
  university_id text not null references public.universities,
  role public.user_role not null,
  position text,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);
alter table private.member_preapprovals enable row level security;
revoke all on private.member_preapprovals from public, anon, authenticated;

-- 승인 대기 + 이메일 인증 완료 + 사전 승인 목록과 메일·소속 대학이 일치할 때만 승인
create or replace function private.apply_preapproval(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  pr public.profiles;
  pa private.member_preapprovals;
begin
  select * into pr from public.profiles where id = p_user_id;
  if not found or pr.status <> 'pending' or not pr.email_confirmed then return; end if;

  select * into pa from private.member_preapprovals
   where email = lower(pr.email) and applied_at is null;
  if not found or pr.university_id is distinct from pa.university_id then return; end if;

  update public.profiles set role = pa.role, status = 'approved' where id = p_user_id;
  update private.member_preapprovals set applied_at = now() where email = pa.email;
end $$;
revoke execute on function private.apply_preapproval(uuid) from public, anon, authenticated;

-- 이메일 인증 동기화 트리거에서 사전 승인 반영
create or replace function private.sync_email_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set email_confirmed = (new.email_confirmed_at is not null),
         email = new.email
   where id = new.id;
  if new.email_confirmed_at is not null then
    perform private.apply_preapproval(new.id);
  end if;
  return new;
end $$;
revoke execute on function private.sync_email_confirmed() from public, anon, authenticated;
grant execute on function private.sync_email_confirmed() to supabase_auth_admin;

-- 5극3특공유대학사업단운영실 (UC 사업단)
insert into private.member_preapprovals (email, university_id, role, position) values
  ('hmsim@uc.ac.kr',  'uc', 'hub_admin', '5극3특공유대학사업단운영실 운영실장'),
  ('hhlee3@uc.ac.kr', 'uc', 'hub_admin', '5극3특공유대학사업단운영실 신임연구원')
on conflict (email) do nothing;

-- 이미 가입·인증을 마친 경우 바로 반영
select private.apply_preapproval(p.id)
  from public.profiles p
 where lower(p.email) in (select email from private.member_preapprovals);
