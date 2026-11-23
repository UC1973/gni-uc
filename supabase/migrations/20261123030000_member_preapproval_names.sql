-- 사전 승인 교직원 정보 정정: 성함을 함께 저장해 승인 시 등록된 성함으로 표시
-- hhlee3@uc.ac.kr: 이흔희, 직위 선임연구원 (이전 마이그레이션의 '신임연구원' 정정)
set local lock_timeout = '2s';

alter table private.member_preapprovals add column if not exists name text;

update private.member_preapprovals
   set name = '이흔희', position = '5극3특공유대학사업단운영실 선임연구원'
 where email = 'hhlee3@uc.ac.kr';

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

  update public.profiles
     set role = pa.role, status = 'approved', name = coalesce(pa.name, pr.name)
   where id = p_user_id;
  update private.member_preapprovals set applied_at = now() where email = pa.email;
end $$;
revoke execute on function private.apply_preapproval(uuid) from public, anon, authenticated;

-- 이미 승인된 계정은 성함만 정정
update public.profiles p
   set name = pa.name
  from private.member_preapprovals pa
 where lower(p.email) = pa.email and pa.name is not null and p.name is distinct from pa.name
   and pa.applied_at is not null;
