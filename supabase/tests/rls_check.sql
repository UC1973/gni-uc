-- 권한(RLS) 점검 스크립트 — 운영 DB에서 실행해도 마지막에 예외를 일으켜 전부 되돌립니다.
-- 실행: supabase db query --remote=<ref> --yes -f supabase/tests/rls_check.sql
-- 결과는 오류 메시지(RLS_RESULT ...)로 출력됩니다.
do $$
declare
  staff uuid := gen_random_uuid();   -- 동의과학대 담당자 (승인)
  prof  uuid := gen_random_uuid();   -- 동의과학대 교수 (승인)
  pend  uuid := gen_random_uuid();   -- 김해대 담당자 (승인 대기)
  r text := '';
  n int;
  ok boolean;

  procedure_as text;
begin
  -- ---------- 준비 (관리자 권한) ----------
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (staff, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-staff@dit.ac.kr', '{"name":"t1","university_id":"dy","role":"univ_staff"}', now(), now()),
         (prof,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-prof@dit.ac.kr',  '{"name":"t2","university_id":"dy","role":"professor"}', now(), now()),
         (pend,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-pend@kimhae.ac.kr','{"name":"t3","university_id":"gh","role":"univ_staff"}', now(), now());
  update public.profiles set status = 'approved' where id in (staff, prof);
  insert into public.students (university_id, dept, student_no, name) values ('uc', '기계공학부', 'RLS-UC', 't'), ('dy', '전기자동차과', 'RLS-DY', 't');

  -- 가입 도메인 검사: 다른 대학 메일로 가입 시도
  begin
    insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
    values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'x@gmail.com', '{"university_id":"dy"}', now(), now());
    r := r || ' | FAIL signup gmail allowed';
  exception when others then r := r || ' | ok signup gmail blocked'; end;

  -- ---------- 동의과학대 담당자 ----------
  perform set_config('request.jwt.claims', json_build_object('sub', staff, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.students where university_id = 'uc';
  r := r || case when n = 0 then ' | ok staff cannot read other univ students' else ' | FAIL staff reads uc students' end;
  select count(*) into n from public.students where university_id = 'dy';
  r := r || case when n = 1 then ' | ok staff reads own students' else ' | FAIL staff own students='||n end;

  update public.replies set install_doc = true where university_id = 'uc';
  get diagnostics n = row_count;
  r := r || case when n = 0 then ' | ok staff cannot edit other univ reply' else ' | FAIL staff edited uc reply' end;
  update public.replies set grade_period = 'x' where university_id = 'dy';
  get diagnostics n = row_count;
  r := r || case when n = 1 then ' | ok staff edits own reply' else ' | FAIL staff own reply' end;

  update public.profiles set role = 'hub_admin' where id = staff;
  get diagnostics n = row_count;
  r := r || case when n = 0 then ' | ok staff cannot self-promote' else ' | FAIL staff self-promoted' end;

  update public.courses set status = 'ok';
  get diagnostics n = row_count;
  r := r || case when n = 0 then ' | ok staff cannot confirm courses' else ' | FAIL staff changed courses' end;

  select count(*) into n from public.profiles;
  r := r || case when n = 1 then ' | ok staff sees only own profile' else ' | FAIL staff sees profiles='||n end;

  begin
    insert into public.notices (title, published) values ('x', true);
    r := r || ' | FAIL staff posted notice';
  exception when others then r := r || ' | ok staff cannot post notice'; end;

  begin
    insert into storage.objects (bucket_id, name, owner) values ('replies', 'uc/install_doc/rls.pdf', staff);
    r := r || ' | FAIL staff uploaded to uc';
  exception when others then r := r || ' | ok staff cannot upload to uc'; end;
  begin
    insert into storage.objects (bucket_id, name, owner) values ('replies', 'dy/install_doc/rls.pdf', staff);
    r := r || ' | ok staff uploads to own univ';
  exception when others then r := r || ' | FAIL staff own upload: ' || sqlerrm; end;

  begin
    insert into public.reply_files (university_id, kind, object_path, file_name, size_bytes) values ('uc', 'install_doc', 'uc/install_doc/rls2.pdf', 'x', 1);
    r := r || ' | FAIL staff recorded uc file';
  exception when others then r := r || ' | ok staff cannot record uc file'; end;

  -- ---------- 동의과학대 교수 ----------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', prof, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  begin
    insert into storage.objects (bucket_id, name, owner) values ('replies', 'dy/curriculum_doc/rls.pdf', prof);
    r := r || ' | FAIL professor uploaded';
  exception when others then r := r || ' | ok professor cannot upload'; end;
  select count(*) into n from storage.objects where bucket_id = 'replies' and name like 'dy/%';
  r := r || case when n >= 1 then ' | ok professor reads own univ files' else ' | FAIL professor reads files='||n end;

  -- ---------- 승인 대기 ----------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', pend, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  select count(*) into n from public.issues;
  r := r || case when n = 0 then ' | ok pending cannot read issues' else ' | FAIL pending reads issues' end;
  select count(*) into n from public.students;
  r := r || case when n = 0 then ' | ok pending cannot read students' else ' | FAIL pending reads students' end;
  select count(*) into n from storage.objects where bucket_id = 'replies';
  r := r || case when n = 0 then ' | ok pending cannot read files' else ' | FAIL pending reads files' end;

  -- ---------- 비로그인 ----------
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';
  begin
    select count(*) into n from public.profiles;
    r := r || ' | FAIL anon read profiles';
  exception when others then r := r || ' | ok anon cannot read profiles'; end;
  select count(*) into n from storage.objects where bucket_id = 'replies';
  r := r || case when n = 0 then ' | ok anon cannot read files' else ' | FAIL anon reads files' end;

  execute 'reset role';
  raise exception 'RLS_RESULT%', r;
end $$;
