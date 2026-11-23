-- GNI 의견수렴 안내 메일: 주제별 안내 문구(사업단이 작성·수정)와 발송 기록
set local lock_timeout = '5s';

alter table public.gni_surveys
  add column if not exists notice_subject text check (notice_subject is null or length(notice_subject) <= 200),
  add column if not exists notice_body text check (notice_body is null or length(notice_body) <= 5000);

create table public.gni_survey_notices (
  id bigint generated always as identity primary key,
  survey_id bigint not null references public.gni_surveys on delete cascade,
  subject text not null check (length(subject) between 1 and 200),
  body text not null check (length(body) between 1 and 5000),
  audience text not null,
  recipient_count int not null check (recipient_count >= 0),
  sent_by uuid references public.profiles on delete set null default auth.uid(),
  sent_by_name text,
  sent_at timestamptz not null default now()
);
comment on table public.gni_survey_notices is 'GNI 의견수렴 안내 메일 발송 기록 (수신자 주소는 저장하지 않음)';
create index gni_survey_notices_survey_idx on public.gni_survey_notices (survey_id, sent_at desc);
create index gni_survey_notices_sent_by_idx on public.gni_survey_notices (sent_by);

create or replace function private.gni_notice_stamp()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.sent_by := auth.uid();
  new.sent_by_name := (select p.name from public.profiles p where p.id = auth.uid());
  new.sent_at := now();
  return new;
end $$;
revoke execute on function private.gni_notice_stamp() from public, anon, authenticated;
create trigger gni_notice_stamp before insert on public.gni_survey_notices
  for each row execute function private.gni_notice_stamp();

alter table public.gni_survey_notices enable row level security;
create policy "hub read"   on public.gni_survey_notices for select using (private.is_hub());
create policy "hub insert" on public.gni_survey_notices for insert with check (private.is_hub());

revoke all on public.gni_survey_notices from anon;
grant select, insert on public.gni_survey_notices to authenticated;

create trigger audit_gni_survey_notices after insert or update or delete on public.gni_survey_notices
  for each row execute function private.audit_row();
