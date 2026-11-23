-- GNI 공유대학 공문·메일, 준비 일정, 결정 필요 사항, 준비 체크리스트
-- 조회: 승인된 교직원 / 등록·수정·삭제: UC 사업단(hub_admin)
-- 사업단 전용 메모는 별도 테이블(gni_doc_notes)에 두어 사업단만 조회합니다.
set local lock_timeout = '5s';

create table public.gni_docs (
  id bigint generated always as identity primary key,
  ref text unique,
  doc_date date not null,
  kind text not null default '공문' check (kind in ('공문', '메일', '회의')),
  direction text not null default '수신' check (direction in ('수신', '발신', '내부')),
  sender text not null,
  recipient text,
  doc_no text,
  title text not null check (length(title) between 1 and 300),
  points text[] not null default '{}',
  requests jsonb not null default '[]' check (jsonb_typeof(requests) = 'array'),
  attachments jsonb not null default '[]' check (jsonb_typeof(attachments) = 'array'),
  internal_note text,
  created_by uuid references public.profiles on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.gni_docs is 'GNI 공유대학 관련 수신·발신 공문과 메일. requests: [{what,due,time,how}], attachments: [{name,file(원본|보관본|미확보),note}]';
create index gni_docs_date_idx on public.gni_docs (doc_date desc);
create index gni_docs_created_by_idx on public.gni_docs (created_by);

create table public.gni_doc_notes (
  doc_id bigint primary key references public.gni_docs on delete cascade,
  note text not null,
  updated_at timestamptz not null default now()
);
comment on table public.gni_doc_notes is 'GNI 공문의 사업단 전용 메모(사업비 등)';

create table public.gni_schedule (
  id bigint generated always as identity primary key,
  starts_on date not null,
  ends_on date check (ends_on is null or ends_on >= starts_on),
  title text not null check (length(title) between 1 and 300),
  owner text,
  phase text not null default '운영 준비' check (phase in ('사업 착수', '교육과정 신설', '운영 준비', '학기 운영')),
  doc_id bigint references public.gni_docs on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gni_schedule_starts_idx on public.gni_schedule (starts_on);
create index gni_schedule_doc_idx on public.gni_schedule (doc_id);

create table public.gni_decisions (
  id bigint generated always as identity primary key,
  area text not null default '학사' check (area in ('교육과정', '수업운영', '학생', '학사', '비교과', '행정')),
  title text not null check (length(title) between 1 and 300),
  options text[] not null default '{}',
  basis text,
  status text not null default 'wip' check (status in ('draft', 'wip', 'ok')),
  decision text,
  doc_id bigint references public.gni_docs on delete set null,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gni_decisions_doc_idx on public.gni_decisions (doc_id);

create table public.gni_checklist (
  id bigint generated always as identity primary key,
  grp text not null check (length(grp) between 1 and 60),
  task text not null check (length(task) between 1 and 300),
  owner text,
  due_on date,
  doc_id bigint references public.gni_docs on delete set null,
  done boolean not null default false,
  done_at timestamptz,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index gni_checklist_doc_idx on public.gni_checklist (doc_id);

-- updated_at 자동 갱신, 완료 시각 기록
create or replace function private.gni_touch()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_table_name = 'gni_checklist' then
    if new.done and (tg_op = 'INSERT' or not old.done) then new.done_at := now();
    elsif not new.done then new.done_at := null;
    end if;
  end if;
  return new;
end $$;
revoke execute on function private.gni_touch() from public, anon, authenticated;

-- 권한
alter table public.gni_docs      enable row level security;
alter table public.gni_doc_notes enable row level security;
alter table public.gni_schedule  enable row level security;
alter table public.gni_decisions enable row level security;
alter table public.gni_checklist enable row level security;

do $$
declare t text;
begin
  foreach t in array array['gni_docs', 'gni_schedule', 'gni_decisions', 'gni_checklist'] loop
    execute format('create policy "staff read" on public.%I for select using (private.is_approved())', t);
    execute format('create policy "hub insert" on public.%I for insert with check (private.is_hub())', t);
    execute format('create policy "hub update" on public.%I for update using (private.is_hub()) with check (private.is_hub())', t);
    execute format('create policy "hub delete" on public.%I for delete using (private.is_hub())', t);
  end loop;
  foreach t in array array['gni_docs', 'gni_doc_notes', 'gni_schedule', 'gni_decisions', 'gni_checklist'] loop
    execute format('create trigger gni_touch_%1$s before insert or update on public.%1$I for each row execute function private.gni_touch()', t);
  end loop;
end $$;

create policy "hub read"   on public.gni_doc_notes for select using (private.is_hub());
create policy "hub insert" on public.gni_doc_notes for insert with check (private.is_hub());
create policy "hub update" on public.gni_doc_notes for update using (private.is_hub()) with check (private.is_hub());
create policy "hub delete" on public.gni_doc_notes for delete using (private.is_hub());

revoke all on public.gni_docs, public.gni_doc_notes, public.gni_schedule, public.gni_decisions, public.gni_checklist from anon;
grant select, insert, update, delete on public.gni_docs, public.gni_doc_notes, public.gni_schedule, public.gni_decisions, public.gni_checklist to authenticated;

-- 초기 데이터: 울산과학대학교 그룹웨어 수신·발신 공문과 메일(2026.08.18.~11.18.) 정리본
insert into public.gni_docs (ref, doc_date, kind, direction, sender, recipient, doc_no, title, points, requests, attachments, internal_note) values
  ('0818', '2026-08-18', '메일', '수신', '경상국립대 RISE사업단 지역교육혁신센터', '중심대학 실무 담당자(대학별 1인)', null, '앵커 5극3특 공유대학(경남) 전공명 제출 및 수요조사 협조 요청',
   array['전공별 교육과정 구성·사업계획 수립을 위한 전략산업 분야 전공명 제출 요청 (추후 조정·변경 기간 별도 안내)', '산업체 수요조사: 분야 관련 산업체 30개 이상 확보, 이 중 심층 인터뷰 가능 기업 5개 이상 별도 표기', '학생 수요조사: 명단 제출 없이 웹 설문 링크를 학생에게 안내·독려, 8.18~8.19 현장 조사원 투입', '대학 내 공유대학 실무 담당자 확정 후 성명·연락처 회신 요청']::text[],
   '[{"what":"전공명 제출([붙임1] 양식)","due":"2026-08-19","time":"15:00","how":"이메일 회신"},{"what":"산업체 수요조사 목록 제출([붙임2])","due":"2026-08-19","time":"15:00","how":"이메일 회신"},{"what":"학생 수요조사 웹 설문 참여 독려","due":"2026-08-24","time":null,"how":null}]'::jsonb,
   '[{"name":"[붙임1] 앵커 5극 3특 공유대학(경남) 전공명 제출 양식_2026.8.18.hwp","file":"미확보"},{"name":"[붙임2] 앵커 5극 3특 공유대학(경남) 수요조사 협조 요청_2026.8.18.hwp","file":"미확보"}]'::jsonb, '앵커사업단 운영팀에서 본부장·사업단장 등에게 전달'),
  ('0820', '2026-08-20', '메일', '수신', '경상국립대 지역교육혁신센터(공유대학2.0)', null, null, '앵커 5극3특 공유대학(경남) 중심대학 사업계획서 양식 전달 및 제출 안내',
   array['중심대학 사업계획서 양식(2차), 교육부 핵심성과지표 정의서, 전공명(안) 송부', '제출한 전공명은 일부 조정이 필요하여 본부 제시 후보안 중 최종 전공명 선택', '제출된 사업계획서로 9.2.(수) 또는 9.4.(금) 대학별 대면 협의 예정']::text[],
   '[{"what":"전공명 최종 선택 회신","due":"2026-08-24","time":null,"how":"이메일(rise_edc@gnu.ac.kr)"},{"what":"중심대학 사업계획서 제출 (기한 엄수)","due":"2026-08-28","time":null,"how":"이메일(rise_edc@gnu.ac.kr)"}]'::jsonb,
   '[{"name":"앵커 5극 3특 공유대학(경남) 중심대학 사업계획서 양식 안내_2026.8.20.hwp","file":"미확보"},{"name":"(별첨1) (교육부)지역성장 인재양성체계(앵커) 5극 3특 공유대학 핵심성과지표 정의서.hwpx","file":"미확보"},{"name":"(별첨2) 전공명(안).hwp","file":"미확보"}]'::jsonb, null),
  ('0912', '2026-09-12', '메일', '수신', '경상국립대 지역교육혁신센터(공유대학2.0)', null, null, '앵커 5극3특 공유대학(경남) 사업계획 편집본 전달',
   array['울산과학대 분량(3장 1-N 산업AX전공) 사업계획서 편집본 확인 요청', '수정 사항은 푸른색 글자로 표기해 회신']::text[],
   '[{"what":"사업계획서 편집본 수정본 회신","due":"2026-09-14","time":"17:00","how":null}]'::jsonb,
   '[{"name":"[울산과학대] 동남권 공유대학_3장 1-N 산업 AX전공.hwp","file":"미확보"}]'::jsonb, null),
  ('0917', '2026-09-17', '공문', '발신', '울산과학대학교 (앵커사업단운영팀)', '경상국립대학교총장 (경유: RISE사업단 지역교육혁신센터)', '앵커사업단운영팀-3809', '[경상국립대학교] 앵커 5극3특 공유대학 참여대학 신청(울산과학대학교)',
   array['관련: 경상국립대 지역교육혁신센터-5952(2026.9.14.) 참여대학 신청 안내', '경상국립대 주관 5극3특 공유대학 울산과학대학교 참여신청서 제출']::text[],
   '[]'::jsonb,
   '[{"name":"1. 앵커 5극3특 공유대학(경상국립대) 참여신청서(울산과학대학교).pdf","file":"미확보"},{"name":"2. 울산과학대학교 대학발전계획 요약본.pdf","file":"미확보"},{"name":"3. 울산과학대학교 대학발전계획서.pdf","file":"미확보"}]'::jsonb, null),
  ('0918', '2026-09-18', '공문', '수신', '부산광역시 (지산학협력과)', null, '지산학협력과-7805', '동남권 공유대학의 성공적 추진을 위한 참여기관 간 협약 체결 요청',
   array['협약명: 동남권 공유대학 협력위원회 협약서', '참여기관: 부산광역시·울산광역시·경상남도, 각 지자체 앵커센터, 주관대학(부산대·경상국립대) 및 참여대학', '주관 공유대학이 협약서 직인 날인을 위해 대학·기관 방문 예정', '공문 별첨 ''부산공유대학 사업계획서(요약)''는 그룹웨어 첨부란에 표시되지 않음']::text[],
   '[{"what":"동남권 공유대학 참여 및 협약서 직인 날인","due":null,"time":null,"how":null}]'::jsonb,
   '[{"name":"동남권 공유대학 협력위원회 협약서(안).hwpx","file":"미확보"}]'::jsonb, null),
  ('0921', '2026-09-21', '공문', '수신', '경상남도 (대학협력과)', null, '대학협력과-5274', '동남권 공유대학 성공적 추진을 위한 참여기관 간 협약 체결 요청',
   array['부산광역시 공문과 같은 동남권 공유대학 협력위원회 협약 체결 요청', '주관 공유대학이 직인 날인을 위해 대학·기관 방문 예정']::text[],
   '[{"what":"동남권 공유대학 참여 및 협약서 직인 날인","due":null,"time":null,"how":null},{"what":"직인 날인 담당자 연락처 회신","due":"2026-09-23","time":null,"how":"이메일(경상남도 대학협력과)"}]'::jsonb,
   '[{"name":"동남권 공유대학 협력위원회 협약서(안)_최종경남.hwpx","file":"미확보","note":"그룹웨어에는 링크(html)로 표시 — 링크에서 실제 파일을 받아야 함"},{"name":"GNI(지니)공유대학 참여대학 설명회_2026916_수정.pdf","file":"미확보","note":"그룹웨어에는 링크(html)로 표시"}]'::jsonb, null),
  ('1021a', '2026-10-21', '공문', '수신', '경상국립대학교 앵커사업단 지역교육혁신센터', '경남대·국립부경대·동아대·마산대·울산과학대', '지역교육혁신센터-6572', '2027학년도 GNI공유대학 교육과정 신설 안내 및 자료 제출 요청',
   array['GNI(지니)공유대학 출범에 따라 동남권 3대 핵심 전략산업 융합인재 양성을 위한 공동교육과정 신설', '기본방향: ① 권역 공통 학사제도 표준화 기준 준수·학사 연계성 확보 ② 학생 이수 안정성을 고려한 이수체계 ③ 실무 중심 산학공동교과목·유연 학기제 기반 편성', '고려사항: 사업계획서 교과목 구성표 기반 편성, 학점교류 시스템 기반 공동운영, 2027학년도 상반기 학기·하계계절학기(일반대 3학년, 전문대 2학년) 교육과정 우선 확정']::text[],
   '[{"what":"[붙임2] 의견조회, [붙임3] 총괄표 작성 후 공문 제출","due":"2026-10-29","time":"16:00","how":"공문 (→ 11.3. 공문으로 11.6. 12:00까지 연장)"}]'::jsonb,
   '[{"name":"(붙임1) 2027학년도 GNI공유대학 융합전공 교육과정 신설 기본계획.pdf","file":"미확보"},{"name":"(붙임2) 2027학년도 GNI공유대학 융합전공 신설 기본계획 의견조회(양식).hwp","file":"미확보"},{"name":"(붙임3) 2027학년도 GNI공유대학 융합전공 교육과정 신설 총괄표(양식).hwpx","file":"미확보"}]'::jsonb, null),
  ('1021b', '2026-10-21', '공문', '수신', '경상국립대학교 앵커사업단 지역교육혁신센터', '경남대·국립부경대·동아대·마산대·울산과학대', '지역교육혁신센터-6571', '5극3특 공유대학(경남) 운영 중심대학 실무자 간담회 개최 안내 및 참석 요청',
   array['목적: 2027학년도 GNI공유대학 교육과정 신설을 위한 중심대학 간 의견 수렴', '일시·장소: 2026.10.26.(월) 11:30~, 롯데호텔앤리조트 김해 8층', '대상: 중심대학 학사운영 실무담당자 2~3명 (학사일정 논의를 위해 팀장급 이상 1명 필수)']::text[],
   '[{"what":"대학별 참석자 명단 제출","due":"2026-10-22","time":"15:00","how":"담당자 이메일"}]'::jsonb,
   '[{"name":"(붙임) 5극 3특 공유대학(경남) 운영 중심대학 실무자 간담회 참석자 명단(양식).hwp","file":"미확보"}]'::jsonb, '교무팀 팀장·차장, 앵커사업단 팀장 참석 의견으로 결재'),
  ('1022', '2026-10-22', '공문', '수신', '경상국립대학교 RISE사업단 지역교육혁신센터', '울산과학대학교총장', '지역교육혁신센터-6624', '「지역성장 인재양성체계(앵커) 5극3특 공유대학」 울산과학대학교 참여 분야 및 역할 안내',
   array['주관대학: 경상국립대학교 / 중심대학: 울산과학대·마산대·경남대·국립부경대·동아대', '사업기간: 2026.9.1.~2030.2. (1차년도 2026.9.1.~2027.2.28.)', '울산과학대 역할: 미래모빌리티 혁신제조분야 중심대학 — 해당 분야 1개 전공 운영·관리, 참여대학 간 협력사항 총괄, 산업AX전공 직접 운영', '붙임 협약서 사본을 향후 관련 업무에 활용']::text[],
   '[]'::jsonb,
   '[{"name":"[붙임] 동남권 공유대학 협력위원회 협약서.pdf","file":"미확보"}]'::jsonb, null),
  ('1030', '2026-10-30', '공문', '수신', '경상국립대학교 5극3특공유대학사업단', '경남대·국립부경대·동아대·마산대·울산과학대 (공유대학 운영부서)', '지역교육혁신센터-6742', '5극3특공유대학(경남) 공동교육과정 신설 관련 협조 요청',
   array['공유대학 교육과정은 학점 교류, 공동 교과목 개설, 표준 이수체계 구축이 수반되어 각 대학 정규 학사일정과의 연계가 필수', '대학별 교육과정 주관부서(교무처 등) 협의·심의 일정 조정: 개편 마감 일정 유예, 수시/추가 개편 절차 검토, 확정 시 즉시 반영', '사전 학사 연계 및 규정 정비: 학사제도·학칙·규정 점검, 2027학년도 상반기 개설 교과목 사전 확인']::text[],
   '[{"what":"교무처와 교육과정 심의 일정 조정 및 학칙·규정 점검","due":null,"time":null,"how":null}]'::jsonb,
   '[{"name":"(붙임) 5극3특공유대학(경남) 공동교육과정 신설 관련 협조 요청.hwp","file":"미확보"}]'::jsonb, null),
  ('1102', '2026-11-02', '회의', '내부', '울산과학대학교 5극3특 공유대학사업단', null, null, '5극3특 GNI공유대학 산업AX전공 신규 교과목 개설 회의',
   array['장소: 울산과학대학교 서부캠퍼스, 참석 12명', '11.5. 제출 총괄표의 ''교육과정개발 관련 회의자료''로 기재된 회의']::text[],
   '[]'::jsonb,
   '[]'::jsonb, null),
  ('1103', '2026-11-03', '공문', '수신', '경상국립대학교 5극3특공유대학사업단', '경남대·국립부경대·동아대·마산대·울산과학대', '지역교육혁신센터-6786', '2027학년도 GNI공유대학 교육과정 신설 기본계획 변경 안내',
   array['제출기한 연장: 2026.10.29.(목) → 2026.11.6.(금) 12:00', '제출서류 간소화: 교육과정위원회 개최 결과는 생략 가능, 단 반드시 책임교원 최종 확인 후 제출', '사유: 각 참여대학 학사일정 반영']::text[],
   '[{"what":"교육과정 신설 자료(의견조회·총괄표) 제출","due":"2026-11-06","time":"12:00","how":"공문"}]'::jsonb,
   '[{"name":"(붙임1) 2027학년도 GNI공유대학 융합전공 교육과정 신설 기본계획 안내_수정.pdf","file":"미확보"},{"name":"(붙임2) 2027학년도 GNI공유대학 융합전공 신설 기본계획(안) 의견조회(양식).hwp","file":"미확보"},{"name":"(붙임3) 2027학년도 GNI공유대학 융합전공 교육과정 신설 총괄표(양식).hwpx","file":"미확보"}]'::jsonb, null),
  ('1104', '2026-11-04', '공문', '수신', '경상국립대학교 (5극3특공유대학(경남))', '부산·경남권 참여대학 전체', '지역교육혁신센터-6803', '5극3특공유대학 융합전공 학위명(영문명 포함) 안내',
   array['융합전공(복수전공·부전공) 학위명: 5극3특공유대학융합학사', '영문명: Bachelor of Convergence Studies (5 Poles and 3 Special Zones Shared University)', '지역성장엔진 전공분야별 구분 없이 공통 기재', '마이크로디그리·나노디그리 과정은 각 대학별 지침에 따름', '2027학년도 교육과정 확정(안)은 11월 둘째 주 안내 예정']::text[],
   '[]'::jsonb,
   '[]'::jsonb, null),
  ('1105', '2026-11-05', '공문', '발신', '울산과학대학교 (5극3특공유대학사업단운영실)', '경상국립대학교총장 (경유: 지역교육혁신센터)', '5극3특공유대학사업단운영실-1', '2027학년도 GNI공유대학 교육과정 신설 자료 제출_울산과학대학교',
   array['편성 학점: MD 산업AX실무 12학점(전공선택), ND 산업AX기초 8학점(전공선택)', '교과목 7개 — 2-1 자동제어실무·설비데이터수집분석(MD), 산업IoT기초(ND) / 2-2 협동로봇운용·스마트공장설비관리(MD), 제조데이터분석(ND) / 동계 AI프로그래밍(ND), 전 과목 기업인증 교육과정', '산업AX전공 교육과정위원회 14명(내부 7: 울산과학대·연암공대·동의과학대·김해대·인하공전·연성대·한국승강기대, 외부 7: 기업·울산대·지원기관)', '의견: 촉박한 일정을 고려한 한시적 절차 간소화 요청, 수강신청~이수·인증서 발급까지 공통 학사운영규정과 표준 운영모델 제시 요청']::text[],
   '[]'::jsonb,
   '[{"name":"(붙임1) 2027학년도 GNI공유대학 교육과정 신설 기본계획 의견조회(울산과학대학교).hwp","file":"보관본","note":"로컬 보관본 PDF만 있음 — 제출본 대조에 원본 필요"},{"name":"(붙임2) 2027학년도 GNI공유대학 교육과정 신설 총괄표(울산과학대학교).hwpx","file":"보관본","note":"로컬 보관본에는 작성일 ''26.11.06.(금)으로 적혀 있음 — 원본 대조 필요"}]'::jsonb, null),
  ('1116', '2026-11-16', '공문', '수신', '경상국립대학교 5극3특공유대학사업단', '5극3특공유대학(경남) 전체 참여대학', '5극3특공유대학사업단-75', '2027학년도 5극3특공유대학(경남) 공동교육과정 안내 및 신설 협조 요청',
   array['전공별 교육과정 확정 안내: 11개 전공 (복수전공 9, 부전공 10, MD 27, ND 1)', '산업AX(전문대, 운영대학 울산과학대학교): MD 1개, ND 1개', '학사운영은 공동교육과정 운영 방식이 원칙, 학점교류 방식은 검토 후 단계적 추진', '2027학년도 1학기 개시 및 학생 선발(''26.12월 예정)에 차질이 없도록 학내 행정 절차 점검']::text[],
   '[{"what":"참여 전공 우선 신설(융합전공·마이크로디그리 신설 절차 추진)","due":null,"time":null,"how":null},{"what":"교육과정 신설(설치) 완료 공문 + 교육과정표(교과목코드 포함) 회신","due":"2026-12-04","time":null,"how":"공문"}]'::jsonb,
   '[{"name":"(붙임1) 2027학년도 GNI공유대학 교육과정 신설 계획서.zip","file":"미확보","note":"ZIP 묶음 그대로 받기"},{"name":"(붙임2) 2027학년도 GNI공유대학 교육과정 신설 총괄표(취합본).xlsx","file":"미확보"}]'::jsonb, null),
  ('1117', '2026-11-17', '공문', '발신', '울산과학대학교 5극3특 공유대학사업단', '김해대·동의과학대·연암공대·한국승강기대', '5극3특공유대학사업단운영실-2', 'GNI공유대학 산업AX전공 교육과정 운영을 위한 회의 개최 및 참석 요청',
   array['일시·방법: 2026.11.20.(금) 16:00~, ZOOM (접속 정보는 원문 공문 참고)', '안건: GNI공유대학 산업AX전공 교육과정 운영방안 논의 등', '대상: 학사운영 관계자 및 사업단 실무 운영진, 회의 전 자료 배포']::text[],
   '[{"what":"참여대학 참석자 명단 제출","due":"2026-11-19","time":"15:00","how":"울산과학대 사업단 담당자 이메일"}]'::jsonb,
   '[{"name":"(붙임) GNI공유대학 산업AX전공 교육과정 운영을 위한 회의 참석자 명단(양식).hwp","file":"미확보"}]'::jsonb, null),
  ('1118', '2026-11-18', '메일', '내부', '울산과학대학교 5극3특공유대학사업단', null, null, 'GNI공유대학 산업AX전공 교육과정 회의자료(수정2) 확인 요청',
   array['11.20.(금) 16:00 회의자료: 추진배경, 전공 개요, 기본방향, 참여학과 11개, 이수학점표·교육과정표(안), 협의사항', '참여학과: 울산과학대(기계공학부·전기전자공학부·조선해양시스템공학과), 김해대(미래자동차과), 동의과학대(전기자동차과·전기전자공학과·스마트전기전자공학과), 연암공대(기계공학과·스마트기계공학과·스마트소프트웨어학과), 한국승강기대(승강기검사학과)', 'AI프로그래밍은 AX프로그래밍으로 교과목명 변경 예정']::text[],
   '[{"what":"참여대학 교육과정 신설(설치) 결과 공문 회신(취합 후 주관대학 제출)","due":"2026-12-02","time":null,"how":null}]'::jsonb,
   '[{"name":"GNI공유대학 산업AX전공 교육과정 운영을 위한 회의 자료_수정2.hwpx","file":"원본","note":"PDF 변환본 보관"}]'::jsonb, null);

insert into public.gni_doc_notes (doc_id, note) values
  ((select id from public.gni_docs where ref = '1022'), '사업비: 1~4차년도 연 300백만원 (총 1,200백만원)');

insert into public.gni_schedule (starts_on, ends_on, title, owner, phase, doc_id) values
  ('2026-08-19', null, '전공명·산업체 수요조사 제출', '사업단', '사업 착수', (select id from public.gni_docs where ref = '0818')),
  ('2026-08-18', '2026-08-24', '학생 수요조사(웹 설문)', '사업단·학과', '사업 착수', (select id from public.gni_docs where ref = '0818')),
  ('2026-08-24', null, '전공명 최종 선택 회신', '사업단', '사업 착수', (select id from public.gni_docs where ref = '0820')),
  ('2026-08-28', null, '중심대학 사업계획서 제출', '사업단', '사업 착수', (select id from public.gni_docs where ref = '0820')),
  ('2026-09-01', null, '사업 1차년도 시작 (~2027.2.28.)', '전체', '사업 착수', (select id from public.gni_docs where ref = '1022')),
  ('2026-09-14', null, '사업계획서 편집본 수정 회신', '사업단', '사업 착수', (select id from public.gni_docs where ref = '0912')),
  ('2026-09-17', null, '참여대학 신청 공문 발송', '사업단', '사업 착수', (select id from public.gni_docs where ref = '0917')),
  ('2026-09-23', null, '협약서 직인 날인 담당자 연락처 회신(경상남도)', '사업단', '사업 착수', (select id from public.gni_docs where ref = '0921')),
  ('2026-10-22', null, '중심대학 실무자 간담회 참석자 명단 제출', '사업단·교무팀', '교육과정 신설', (select id from public.gni_docs where ref = '1021b')),
  ('2026-10-26', null, '중심대학 실무자 간담회 (김해)', '교무팀·사업단', '교육과정 신설', (select id from public.gni_docs where ref = '1021b')),
  ('2026-11-02', null, '산업AX전공 신규 교과목 개설 회의', '사업단·학과', '교육과정 신설', (select id from public.gni_docs where ref = '1102')),
  ('2026-11-06', null, '교육과정 신설 자료 제출 기한 (11.5. 제출 완료)', '사업단', '교육과정 신설', (select id from public.gni_docs where ref = '1103')),
  ('2026-11-16', null, 'GNI 공동교육과정 확정 안내 수신', '사업단', '교육과정 신설', (select id from public.gni_docs where ref = '1116')),
  ('2026-11-19', null, '참여대학 회의 참석자 명단 접수', '참여대학', '교육과정 신설', (select id from public.gni_docs where ref = '1117')),
  ('2026-11-20', null, '산업AX전공 교육과정 운영 회의 (ZOOM)', '5개 참여대학', '교육과정 신설', (select id from public.gni_docs where ref = '1117')),
  ('2026-12-02', null, '참여대학 교육과정 신설(설치) 결과 공문 회신 → 사업단 취합', '참여대학', '운영 준비', (select id from public.gni_docs where ref = '1118')),
  ('2026-12-04', null, '교육과정 설치 공문 + 교육과정표(교과목코드) 경상국립대 회신', '사업단', '운영 준비', (select id from public.gni_docs where ref = '1116')),
  ('2026-12-01', '2026-12-31', '학생 선발 (12월 예정)', '참여대학·사업단', '운영 준비', (select id from public.gni_docs where ref = '1116')),
  ('2027-02-10', '2027-02-12', '울산과학대 수강신청 (타 대학 일정 입력 필요)', '참여대학', '학기 운영', (select id from public.gni_docs where ref = '1118')),
  ('2027-02-28', null, '사업 1차년도 종료', '전체', '학기 운영', (select id from public.gni_docs where ref = '1022')),
  ('2027-03-01', null, '2027학년도 1학기 GNI 교육과정 개시', '전체', '학기 운영', (select id from public.gni_docs where ref = '1116'));

insert into public.gni_decisions (area, title, options, basis, doc_id, sort) values
  ('교육과정', '교육과정 개발 서식', array['1안: 공동 서식 사용', '2안: 대학별 서식 사용 (강의계획서 서식은 통일)']::text[], '11.20 회의 협의사항', (select id from public.gni_docs where ref = '1118'), 1),
  ('교육과정', '교과목 개발 분담 및 개설·운영 대학', array['2-2 협동로봇운용·스마트공장설비관리·제조데이터분석, 동계 AI(AX)프로그래밍의 개설대학 지정 (현재 참여대학1~4로 미정)']::text[], '중심대학 개설 비율 50% 이하 원칙 — 현재안 울산과학대 3과목 9학점 / 전체 7과목 20학점 (45%)', (select id from public.gni_docs where ref = '1118'), 2),
  ('교육과정', '교과목 공동개발 책임시수', array['참여대학별 책임시수 부여 방안']::text[], '교과목은 참여대학 간 공동개발 원칙', (select id from public.gni_docs where ref = '1118'), 3),
  ('교육과정', 'AI프로그래밍 → AX프로그래밍 교과목명 변경', array['명칭 변경 확정 및 교과목코드·이수구분·학점 대학 간 일치 확인']::text[], '11.18 회의자료 ''변경 예정''', (select id from public.gni_docs where ref = '1118'), 4),
  ('수업운영', '수업운영 방식', array['비대면 수업 원칙', '실습과목 하이브리드(대면 + 실시간 비대면) 가능', '필요 시 학기 중 대면 집합교육 대상 과목·장소']::text[], '11.20 회의 협의사항', (select id from public.gni_docs where ref = '1118'), 5),
  ('학생', '모집인원 배분', array['총 30명(확인 필요): 중심대학 10명 / 참여대학 각 5명']::text[], '학생 선발 2026년 12월 예정', (select id from public.gni_docs where ref = '1118'), 6),
  ('학생', '선발기준', array['성적순', '학부(과) 추천', '현행 타 대학 학점교류 신청 기준(평점평균 2.5 이상) 적용 여부']::text[], '11.20 회의 협의사항', (select id from public.gni_docs where ref = '1118'), 7),
  ('학생', '학생지원비', array['지원 예정 — 세부 기준·금액은 미확정, 추후 협의·안내']::text[], '주관대학 안내 대기', (select id from public.gni_docs where ref = '1118'), 8),
  ('학사', '수강신청 운영 경로', array['학점교류 시스템 활용 (세부 방식 협의)', '각 대학 수강시스템: 대학별 인원을 공문으로 받아 주관대학이 수강신청']::text[], '울산과학대 수강신청 2027.2.10.~2.12. — 타 대학 일정 입력 필요', (select id from public.gni_docs where ref = '1118'), 9),
  ('학사', '성적부여 방식', array['1안: 등급제 — 상대평가(A+·A0 30% 이내) 또는 절대평가', '2안: S/U (대학별 P/F 가능)']::text[], '대학별 학칙·학점교류 인정 가능 여부 고려, 성적은 각 대학에 공문 발송 (대학별 성적입력기간 입력 필요)', (select id from public.gni_docs where ref = '1118'), 10),
  ('학사', '공통 학사운영규정·표준 운영모델', array['수강신청·편성·성적·학점 인정·이수 관리·인증서 발급까지 단계별 공통 기준']::text[], '11.5. 의견조회로 주관대학에 제시 요청 — 회신 대기. 학점교류 방식은 단계적 추진 예정(11.16.)', (select id from public.gni_docs where ref = '1105'), 11),
  ('비교과', '겨울학기 비교과 프로그램 수요조사', array['자격증: AICE, 스마트공장 기능사', '전문가 과정: 바이브 코딩', '참여대학 학생 대상 사전 수요조사 실시']::text[], '11.20 회의 협의사항', (select id from public.gni_docs where ref = '1118'), 12),
  ('행정', '제출 총괄표 작성일 확인', array['11.5. 발송 공문 첨부 원본과 로컬 보관본(''26.11.06. 표기) 대조']::text[], '붙임 원본 미확보', (select id from public.gni_docs where ref = '1105'), 13);

insert into public.gni_checklist (grp, task, owner, due_on, doc_id, done, sort) values
  ('협약·사업 기반', '참여대학 신청서·대학발전계획 제출', '사업단', '2026-09-17', (select id from public.gni_docs where ref = '0917'), true, 1),
  ('협약·사업 기반', '동남권 공유대학 협력위원회 협약서 직인 날인 (주관대학 방문)', '사업단·총무', null, (select id from public.gni_docs where ref = '0918'), false, 2),
  ('협약·사업 기반', '협약서 사본(10.22. 공문 붙임) 보관 및 업무 활용', '사업단', null, (select id from public.gni_docs where ref = '1022'), false, 3),
  ('협약·사업 기반', '사업 1차년도(~2027.2.28.) 사업비 집행 계획 확인', '사업단', null, (select id from public.gni_docs where ref = '1022'), false, 4),
  ('교육과정 신설(설치)', '교육과정 신설 자료(의견조회·총괄표) 제출', '사업단', '2026-11-06', (select id from public.gni_docs where ref = '1105'), true, 5),
  ('교육과정 신설(설치)', 'MD 산업AX실무(12학점)·ND 산업AX기초(8학점) 학내 교육과정 설치', '교무팀·학과', null, (select id from public.gni_docs where ref = '1116'), false, 6),
  ('교육과정 신설(설치)', '교무처 교육과정 심의 일정 조정(마감 유예·수시/추가 개편)', '교무팀', null, (select id from public.gni_docs where ref = '1030'), false, 7),
  ('교육과정 신설(설치)', '참여대학 4곳 교육과정 설치 결과 공문 접수·취합', '사업단', '2026-12-02', (select id from public.gni_docs where ref = '1118'), false, 8),
  ('교육과정 신설(설치)', '설치 공문 + 교육과정표(교과목코드 포함) 경상국립대 회신', '사업단', '2026-12-04', (select id from public.gni_docs where ref = '1116'), false, 9),
  ('교육과정 신설(설치)', '융합전공 학위명(5극3특공유대학융합학사) 반영 여부 확인 — MD·ND는 대학 지침', '교무팀', null, (select id from public.gni_docs where ref = '1104'), false, 10),
  ('학사·규정', '학사제도·학칙·규정 점검 (공동교육과정·학점 인정)', '교무팀', null, (select id from public.gni_docs where ref = '1030'), false, 11),
  ('학사·규정', '2027학년도 1학기 개설 교과목 사전 확인', '교무팀·학과', null, (select id from public.gni_docs where ref = '1030'), false, 12),
  ('학사·규정', '교과목코드 통합관리·이수구분(전선) 대학 간 통일', '교무팀·참여대학', null, (select id from public.gni_docs where ref = '1118'), false, 13),
  ('학사·규정', '통합 LMS 성적 전송·등급 환산·이수 판정 기준 사전 정리', '교무팀', null, (select id from public.gni_docs where ref = '1118'), false, 14),
  ('학생 모집·지원', '모집인원·선발기준 확정 후 대학별 안내', '사업단·참여대학', null, (select id from public.gni_docs where ref = '1118'), false, 15),
  ('학생 모집·지원', '학생 선발 (12월 예정)', '참여대학', '2026-12-31', (select id from public.gni_docs where ref = '1116'), false, 16),
  ('학생 모집·지원', '학생지원비 기준 확정 시 안내', '사업단', null, (select id from public.gni_docs where ref = '1118'), false, 17),
  ('수강신청·성적', '참여대학별 수강신청 일정·성적입력기간 수합', '참여대학', null, (select id from public.gni_docs where ref = '1118'), false, 18),
  ('수강신청·성적', '울산과학대 수강신청 운영 (2.10.~2.12.)', '교무팀', '2027-02-12', (select id from public.gni_docs where ref = '1118'), false, 19),
  ('수강신청·성적', '성적 확인 후 각 대학에 공문 발송 절차 마련', '교무팀·사업단', null, (select id from public.gni_docs where ref = '1118'), false, 20),
  ('수업·비교과', '교과목별 강의계획서 작성 (서식 확정 후)', '담당교원', null, (select id from public.gni_docs where ref = '1118'), false, 21),
  ('수업·비교과', '비대면·하이브리드 수업 환경 및 공동 LMS 준비', '사업단', null, (select id from public.gni_docs where ref = '1118'), false, 22),
  ('수업·비교과', '산학공동·기업인증 교육과정 참여 기업 확정', '학과·사업단', null, (select id from public.gni_docs where ref = '1118'), false, 23),
  ('수업·비교과', '겨울학기 비교과(AICE·스마트공장 기능사·바이브 코딩) 수요조사', '사업단·참여대학', null, (select id from public.gni_docs where ref = '1118'), false, 24),
  ('문서 관리', '그룹웨어에서 붙임 원본 받기 (미확보 목록 참고)', '사업단', null, (select id from public.gni_docs where ref = '1116'), false, 25),
  ('문서 관리', '11.20 회의 결과(결정사항) 정리·공유', '사업단', null, (select id from public.gni_docs where ref = '1117'), false, 26);

-- 변경 이력(감사 로그): 초기 데이터 입력 뒤에 연결
do $$
declare t text;
begin
  foreach t in array array['gni_docs', 'gni_doc_notes', 'gni_schedule', 'gni_decisions', 'gni_checklist'] loop
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I
                    for each row execute function private.audit_row()', t);
  end loop;
end $$;
