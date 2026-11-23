-- GNI 의견수렴 대학별 첨부파일: 대학당 주제별 최대 3개, 파일당 10MB
-- 비공개 버킷 survey-files, 경로: <survey_id>/<university_id>/<uuid>.<ext>
-- 조회·내려받기: 승인된 교직원(다른 대학 파일은 참고용)
-- 올리기·삭제: 소속 대학 UC 사업단·대학 담당자, 진행 중인 주제만 (private.can_respond)
set local lock_timeout = '5s';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'survey-files', 'survey-files', false, 10 * 1024 * 1024,
  array[
    'application/pdf',
    'application/x-hwp', 'application/haansofthwp', 'application/vnd.hancom.hwp',
    'application/hwp+zip', 'application/vnd.hancom.hwpx', 'application/haansofthwpx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/zip', 'application/x-zip-compressed',
    'image/jpeg', 'image/png',
    'application/octet-stream'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create table public.gni_survey_files (
  id bigint generated always as identity primary key,
  survey_id bigint not null references public.gni_surveys on delete cascade,
  university_id text not null references public.universities on delete cascade,
  object_path text not null unique,
  file_name text not null check (length(file_name) between 1 and 200),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10 * 1024 * 1024),
  mime_type text,
  sha256 text,
  uploaded_by uuid references public.profiles on delete set null default auth.uid(),
  author_name text,
  created_at timestamptz not null default now()
);
comment on table public.gni_survey_files is 'GNI 의견수렴 대학별 첨부파일 (대학·주제당 최대 3개, 10MB)';
create index gni_survey_files_survey_univ_idx on public.gni_survey_files (survey_id, university_id);
create index gni_survey_files_univ_idx on public.gni_survey_files (university_id);
create index gni_survey_files_uploaded_by_idx on public.gni_survey_files (uploaded_by);

-- 경로가 <survey_id>/<university_id>/... 인지 확인하고 권한 판단
create or replace function private.can_respond_path(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select (storage.foldername(p_name))[1] ~ '^[0-9]{1,18}$'
     and private.can_respond(((storage.foldername(p_name))[1])::bigint, (storage.foldername(p_name))[2])
$$;
revoke execute on function private.can_respond_path(text) from public, anon;
grant execute on function private.can_respond_path(text) to authenticated;

-- 개수 제한(대학·주제당 3개), 작성자 기록, 경로와 행 정보 일치
create or replace function private.gni_survey_file_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.object_path not like new.survey_id::text || '/' || new.university_id || '/%' then
    raise exception 'GNIUC_FILE_PATH: 파일 경로가 올바르지 않습니다.' using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtext('gni_survey_files:' || new.survey_id || ':' || new.university_id));
  if (select count(*) from public.gni_survey_files f
       where f.survey_id = new.survey_id and f.university_id = new.university_id) >= 3 then
    raise exception 'GNIUC_FILE_LIMIT: 첨부파일은 대학별로 3개까지 올릴 수 있습니다.' using errcode = 'P0001';
  end if;
  new.uploaded_by := auth.uid();
  new.author_name := (select p.name from public.profiles p where p.id = auth.uid());
  new.created_at := now();
  return new;
end $$;
revoke execute on function private.gni_survey_file_guard() from public, anon, authenticated;
create trigger gni_survey_file_guard before insert on public.gni_survey_files
  for each row execute function private.gni_survey_file_guard();

alter table public.gni_survey_files enable row level security;
create policy "staff read" on public.gni_survey_files for select using (private.is_approved());
create policy "own univ insert" on public.gni_survey_files for insert
  with check (private.can_respond(survey_id, university_id));
create policy "own univ delete" on public.gni_survey_files for delete
  using (private.can_respond(survey_id, university_id));

revoke all on public.gni_survey_files from anon;
grant select, insert, delete on public.gni_survey_files to authenticated;

-- Storage 객체 권한 (경로로 주제·대학 판별). 사업단은 주제 삭제 시 정리를 위해 삭제 가능
create policy "survey files read" on storage.objects for select to authenticated
  using (bucket_id = 'survey-files' and private.is_approved());
create policy "survey files insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'survey-files' and private.can_respond_path(name));
create policy "survey files delete" on storage.objects for delete to authenticated
  using (bucket_id = 'survey-files' and (private.can_respond_path(name) or private.is_hub()));

create trigger audit_gni_survey_files after insert or update or delete on public.gni_survey_files
  for each row execute function private.audit_row();

-- 울산과학대학교 교무팀 직원 사전 승인 (대학 담당자)
insert into private.member_preapprovals (email, name, university_id, role, position) values
  ('gylee@uc.ac.kr',  '이귀영', 'uc', 'univ_staff', '교무팀(교육혁신지원팀) 행정 차장'),
  ('ihkwon@uc.ac.kr', '권익현', 'uc', 'univ_staff', '교무팀(교육혁신지원팀) 행정 사원')
on conflict (email) do update
  set name = excluded.name, university_id = excluded.university_id, role = excluded.role, position = excluded.position;
select private.apply_preapproval(p.id) from public.profiles p where lower(p.email) in ('gylee@uc.ac.kr', 'ihkwon@uc.ac.kr');
