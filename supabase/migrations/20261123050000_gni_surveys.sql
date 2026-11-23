-- GNI 의견수렴: 사업단이 주제를 정하면 대학별 관계자가 소속 대학 의견을 입력
-- 조회: 승인된 교직원 전체(다른 대학 의견은 참고용)
-- 의견 입력·수정: 소속 대학의 UC 사업단·대학 담당자, 진행 중인 주제만 (교수는 조회)
-- 주제 등록·수정·마감: UC 사업단
set local lock_timeout = '5s';

create table public.gni_surveys (
  id bigint generated always as identity primary key,
  area text not null default '교육과정' check (area in ('교육과정', '수업운영', '학생', '학사', '비교과', '행정')),
  title text not null check (length(title) between 1 and 300),
  question text check (question is null or length(question) <= 2000),
  due_on date,
  status text not null default 'open' check (status in ('open', 'closed')),
  doc_id bigint references public.gni_docs on delete set null,
  decision_id bigint references public.gni_decisions on delete set null,
  sort int not null default 0,
  created_by uuid references public.profiles on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.gni_surveys is 'GNI 의견수렴 주제. 대학별 의견은 gni_survey_responses';
create index gni_surveys_doc_idx on public.gni_surveys (doc_id);
create index gni_surveys_decision_idx on public.gni_surveys (decision_id);
create index gni_surveys_created_by_idx on public.gni_surveys (created_by);

create table public.gni_survey_responses (
  survey_id bigint not null references public.gni_surveys on delete cascade,
  university_id text not null references public.universities on delete cascade,
  body text not null check (length(body) between 1 and 5000),
  updated_by uuid references public.profiles on delete set null,
  author_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (survey_id, university_id)
);
comment on table public.gni_survey_responses is 'GNI 의견수렴 대학별 의견 (대학당 1건, 소속 대학만 수정)';
create index gni_survey_responses_univ_idx on public.gni_survey_responses (university_id);
create index gni_survey_responses_updated_by_idx on public.gni_survey_responses (updated_by);

-- 소속 대학 의견을 쓸 수 있는지: 승인된 사업단·대학 담당자 + 소속 대학 일치 + 진행 중인 주제
create or replace function private.can_respond(p_survey bigint, p_univ text)
returns boolean language sql stable security definer set search_path = public as $$
  select p_univ = private.my_univ()
     and exists (select 1 from public.profiles
                  where id = auth.uid() and status = 'approved' and role in ('hub_admin', 'univ_staff'))
     and exists (select 1 from public.gni_surveys where id = p_survey and status = 'open')
$$;
revoke execute on function private.can_respond(bigint, text) from public, anon;
grant execute on function private.can_respond(bigint, text) to authenticated;

-- 작성자 기록 (클라이언트 값 무시). 다른 대학 프로필은 RLS로 보이지 않으므로 이름을 함께 저장
create or replace function private.gni_response_stamp()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_by := auth.uid();
  new.author_name := (select p.name from public.profiles p where p.id = auth.uid());
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.survey_id := old.survey_id;
    new.university_id := old.university_id;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
revoke execute on function private.gni_response_stamp() from public, anon, authenticated;

create trigger gni_touch_gni_surveys before insert or update on public.gni_surveys
  for each row execute function private.gni_touch();
create trigger gni_response_stamp before insert or update on public.gni_survey_responses
  for each row execute function private.gni_response_stamp();

alter table public.gni_surveys enable row level security;
alter table public.gni_survey_responses enable row level security;

create policy "staff read"  on public.gni_surveys for select using (private.is_approved());
create policy "hub insert"  on public.gni_surveys for insert with check (private.is_hub());
create policy "hub update"  on public.gni_surveys for update using (private.is_hub()) with check (private.is_hub());
create policy "hub delete"  on public.gni_surveys for delete using (private.is_hub());

create policy "staff read"  on public.gni_survey_responses for select using (private.is_approved());
create policy "own univ insert" on public.gni_survey_responses for insert
  with check (private.can_respond(survey_id, university_id));
create policy "own univ update" on public.gni_survey_responses for update
  using (private.can_respond(survey_id, university_id)) with check (private.can_respond(survey_id, university_id));
create policy "own univ delete" on public.gni_survey_responses for delete
  using (private.can_respond(survey_id, university_id));

revoke all on public.gni_surveys, public.gni_survey_responses from anon;
grant select, insert, update, delete on public.gni_surveys, public.gni_survey_responses to authenticated;

-- 변경 이력
create trigger audit_gni_surveys after insert or update or delete on public.gni_surveys
  for each row execute function private.audit_row();
create trigger audit_gni_survey_responses after insert or update or delete on public.gni_survey_responses
  for each row execute function private.audit_row();

-- 첫 주제 예시: 나노디그리 개설(포함) 희망 교과목
insert into public.gni_surveys (area, title, question, status, sort) values
  ('교육과정', '나노디그리 개설(포함) 희망 교과목',
   '소속 대학에서 나노디그리(ND)에 개설하거나 포함하기를 희망하는 교과목을 한 줄에 하나씩 적어 주세요. 예: 교과목명 | 학점 | 개설 학기 | 비고',
   'open', 1);
