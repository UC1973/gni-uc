-- 사전 승인 추가: 울산과학대학교 교무처장 (교수 역할)
set local lock_timeout = '2s';

insert into private.member_preapprovals (email, name, university_id, role, position) values
  ('hsbyun@uc.ac.kr', '변홍석', 'uc', 'professor', '교무처 교무처장')
on conflict (email) do update
  set name = excluded.name, university_id = excluded.university_id, role = excluded.role, position = excluded.position;

-- 이미 가입·인증을 마친 승인 대기 계정이면 바로 반영
select private.apply_preapproval(p.id) from public.profiles p where lower(p.email) = 'hsbyun@uc.ac.kr';
