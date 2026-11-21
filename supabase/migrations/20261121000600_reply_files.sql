-- 대학별 회신 파일 (교육과정 신설(설치) 공문, 교육과정표)
-- 비공개 버킷: 파일 경로의 첫 폴더가 대학 ID (예: dy/install_doc/<uuid>.pdf)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'replies', 'replies', false, 20 * 1024 * 1024,
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

create table public.reply_files (
  id bigint generated always as identity primary key,
  university_id text not null references public.universities on delete cascade,
  kind text not null check (kind in ('install_doc', 'curriculum_doc')),
  object_path text not null unique,
  file_name text not null,
  size_bytes bigint not null,
  mime_type text,
  uploaded_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
create index on public.reply_files (university_id, kind);

alter table public.reply_files enable row level security;

-- 조회: 사업단 전체, 참여대학은 자기 대학 파일만
create policy "scoped read" on public.reply_files for select
  using (private.is_hub() or (private.is_approved() and university_id = private.my_univ()));
-- 등록·삭제: 사업단 또는 자기 대학 담당자 (교수 제외)
create policy "scoped insert" on public.reply_files for insert
  with check (private.is_hub() or (university_id = private.my_univ() and (select role from public.profiles where id = (select auth.uid())) = 'univ_staff'));
create policy "scoped delete" on public.reply_files for delete
  using (private.is_hub() or (university_id = private.my_univ() and (select role from public.profiles where id = (select auth.uid())) = 'univ_staff'));

grant select, insert, delete on public.reply_files to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Storage 객체 권한 (같은 규칙, 경로 첫 폴더로 대학 판별)
create or replace function private.can_write_univ(p_univ text)
returns boolean language sql stable security definer set search_path = public as $$
  select private.is_hub()
      or (p_univ = private.my_univ()
          and exists (select 1 from public.profiles where id = auth.uid() and role = 'univ_staff' and status = 'approved'))
$$;
create or replace function private.can_read_univ(p_univ text)
returns boolean language sql stable security definer set search_path = public as $$
  select private.is_hub() or (private.is_approved() and p_univ = private.my_univ())
$$;

create policy "replies read" on storage.objects for select to authenticated
  using (bucket_id = 'replies' and private.can_read_univ((storage.foldername(name))[1]));
create policy "replies insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'replies' and private.can_write_univ((storage.foldername(name))[1]));
create policy "replies delete" on storage.objects for delete to authenticated
  using (bucket_id = 'replies' and private.can_write_univ((storage.foldername(name))[1]));
