-- 회의 일정·결과 메뉴: 일정 안내(일시·안건·방법·장소)와 회의 결과(참석자·결과·결정·후속 조치), 첨부파일
-- 조회·내려받기: 승인된 교직원 / 등록·수정·첨부: UC 사업단 (기존 meetings 정책 유지)
set local lock_timeout = '5s';

alter table public.meetings
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists method text check (method is null or method in ('대면', '온라인', '대면+온라인')),
  add column if not exists place text check (place is null or length(place) <= 500),
  add column if not exists host text check (host is null or length(host) <= 200),
  add column if not exists agenda text[] not null default '{}',
  add column if not exists notice text check (notice is null or length(notice) <= 3000),
  add column if not exists status text not null default 'planned' check (status in ('planned', 'done', 'canceled')),
  add column if not exists decisions text[] not null default '{}',
  add column if not exists actions text[] not null default '{}',
  add column if not exists created_by uuid references public.profiles on delete set null default auth.uid(),
  add column if not exists updated_at timestamptz not null default now();
alter table public.meetings add constraint meetings_time_order check (ends_at is null or starts_at is null or ends_at >= starts_at);
comment on column public.meetings.summary is '회의 결과';
create index if not exists meetings_held_on_idx on public.meetings (held_on desc);
create index if not exists meetings_created_by_idx on public.meetings (created_by);

-- 이미 지난 회의 기록은 완료로
update public.meetings set status = 'done' where held_on < (now() at time zone 'Asia/Seoul')::date;

-- 일시가 있으면 일자(held_on)를 맞추고 수정 시각 기록
create or replace function private.meeting_touch()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.starts_at is not null then
    new.held_on := (new.starts_at at time zone 'Asia/Seoul')::date;
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke execute on function private.meeting_touch() from public, anon, authenticated;
drop trigger if exists meeting_touch on public.meetings;
create trigger meeting_touch before insert or update on public.meetings
  for each row execute function private.meeting_touch();

-- 첨부파일: 비공개 버킷 meeting-files, 경로 <meeting_id>/<uuid>.<ext>, 회의당 10개, 파일당 20MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meeting-files', 'meeting-files', false, 20 * 1024 * 1024,
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

create table public.meeting_files (
  id bigint generated always as identity primary key,
  meeting_id bigint not null references public.meetings on delete cascade,
  object_path text not null unique,
  file_name text not null check (length(file_name) between 1 and 200),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 20 * 1024 * 1024),
  mime_type text,
  sha256 text,
  uploaded_by uuid references public.profiles on delete set null default auth.uid(),
  author_name text,
  created_at timestamptz not null default now()
);
comment on table public.meeting_files is '회의 첨부파일 (회의당 10개, 20MB). 추후 AI 분석 대상';
create index meeting_files_meeting_idx on public.meeting_files (meeting_id);
create index meeting_files_uploaded_by_idx on public.meeting_files (uploaded_by);

create or replace function private.meeting_file_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.object_path not like new.meeting_id::text || '/%' then
    raise exception 'GNIUC_FILE_PATH: 파일 경로가 올바르지 않습니다.' using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtext('meeting_files:' || new.meeting_id));
  if (select count(*) from public.meeting_files f where f.meeting_id = new.meeting_id) >= 10 then
    raise exception 'GNIUC_FILE_LIMIT: 회의 첨부파일은 10개까지 올릴 수 있습니다.' using errcode = 'P0001';
  end if;
  new.uploaded_by := auth.uid();
  new.author_name := (select p.name from public.profiles p where p.id = auth.uid());
  new.created_at := now();
  return new;
end $$;
revoke execute on function private.meeting_file_guard() from public, anon, authenticated;
create trigger meeting_file_guard before insert on public.meeting_files
  for each row execute function private.meeting_file_guard();

alter table public.meeting_files enable row level security;
create policy "staff read" on public.meeting_files for select using (private.is_approved());
create policy "hub insert" on public.meeting_files for insert with check (private.is_hub());
create policy "hub delete" on public.meeting_files for delete using (private.is_hub());
revoke all on public.meeting_files from anon;
grant select, insert, delete on public.meeting_files to authenticated;

create policy "meeting files read" on storage.objects for select to authenticated
  using (bucket_id = 'meeting-files' and private.is_approved());
create policy "meeting files insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'meeting-files' and private.is_hub());
create policy "meeting files delete" on storage.objects for delete to authenticated
  using (bucket_id = 'meeting-files' and private.is_hub());

create trigger audit_meeting_files after insert or update or delete on public.meeting_files
  for each row execute function private.audit_row();
