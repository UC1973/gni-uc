-- GNI-UC 산업AX전공 — 초기 스키마
-- 역할: hub_admin(UC 사업단) / univ_staff(참여대학 담당자) / professor(교수)
-- 가입 상태: pending → approved (사업단이 승인) / rejected

create type public.user_role as enum ('hub_admin', 'univ_staff', 'professor');
create type public.user_status as enum ('pending', 'approved', 'rejected');
create type public.item_status as enum ('draft', 'wip', 'ok');   -- (안) / 협의 중 / 확정

-- ---------- 참여대학 ----------
create table public.universities (
  id text primary key,
  name text not null,
  short_name text not null,
  is_hub boolean not null default false,
  depts text[] not null default '{}',
  quota int not null default 0,
  sort int not null default 0
);

-- ---------- 교직원 프로필 ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  name text not null,
  university_id text references public.universities,
  role public.user_role not null default 'univ_staff',
  status public.user_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ---------- 교과목 ----------
create table public.courses (
  id bigint generated always as identity primary key,
  term text not null,                 -- '2-1' | '2-2' | '동계'
  name text not null,
  degree text not null check (degree in ('ND', 'MD')),
  theory int not null default 0,
  practice int not null default 0,
  credits int not null,
  host text not null default '참여대학 협의',
  course_code text,
  status public.item_status not null default 'draft',
  note text,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- 협의 안건 ----------
create table public.issues (
  id bigint generated always as identity primary key,
  category text not null,
  title text not null,
  detail text,
  status public.item_status not null default 'wip',
  decision text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 회의 ----------
create table public.meetings (
  id bigint generated always as identity primary key,
  held_on date not null,
  title text not null,
  attendees text,
  summary text,
  material_url text,
  created_at timestamptz not null default now()
);

-- ---------- 대학별 회신 현황 ----------
create table public.replies (
  university_id text primary key references public.universities on delete cascade,
  install_doc boolean not null default false,
  curriculum_doc boolean not null default false,
  enroll_period text,
  grade_period text,
  updated_at timestamptz not null default now()
);

-- ---------- 학생 ----------
create table public.students (
  id bigint generated always as identity primary key,
  university_id text not null references public.universities,
  dept text not null,
  student_no text not null,
  name text not null,
  gpa numeric(3,2),
  status text not null default '신청' check (status in ('신청', '선발', '이수중', '이수완료', '중도포기')),
  created_at timestamptz not null default now(),
  unique (university_id, student_no)
);

-- ---------- 비교과 수요조사 ----------
create table public.extra_programs (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  status public.item_status not null default 'draft',
  sort int not null default 0
);
create table public.extra_demand (
  program_id bigint references public.extra_programs on delete cascade,
  university_id text references public.universities on delete cascade,
  count int not null default 0,
  primary key (program_id, university_id)
);

-- ---------- 성과지표 ----------
create table public.kpis (
  id bigint generated always as identity primary key,
  name text not null,
  unit text not null,
  target numeric,
  actual numeric,
  status public.item_status not null default 'draft',
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

-- ---------- 공지 · 홍보자료 · 설정 ----------
create table public.notices (
  id bigint generated always as identity primary key,
  category text not null default '안내',
  title text not null,
  body text,
  published boolean not null default false,
  author_id uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
create table public.materials (
  id bigint generated always as identity primary key,
  kind text not null,          -- PDF / PNG / VIDEO / HWP
  title text not null,
  caption text,
  url text,
  published boolean not null default true,
  sort int not null default 0
);
create table public.site_settings (
  key text primary key,
  value text not null
);

-- =========================================================
-- 권한 도우미 함수 (security definer: RLS 재귀 방지)
-- =========================================================
create or replace function public.my_profile()
returns public.profiles language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid()
$$;
create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'approved')
$$;
create or replace function public.is_hub()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'approved' and role = 'hub_admin')
$$;
create or replace function public.my_univ()
returns text language sql stable security definer set search_path = public as $$
  select university_id from public.profiles where id = auth.uid() and status = 'approved'
$$;

-- 가입 시 프로필 자동 생성 (역할은 항상 univ_staff/professor로 시작, 사업단 승인 필요)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, university_id, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'university_id', ''),
    case when new.raw_user_meta_data->>'role' = 'professor' then 'professor'::public.user_role
         else 'univ_staff'::public.user_role end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- RLS
-- =========================================================
alter table public.universities  enable row level security;
alter table public.profiles      enable row level security;
alter table public.courses       enable row level security;
alter table public.issues        enable row level security;
alter table public.meetings      enable row level security;
alter table public.replies       enable row level security;
alter table public.students      enable row level security;
alter table public.extra_programs enable row level security;
alter table public.extra_demand  enable row level security;
alter table public.kpis          enable row level security;
alter table public.notices       enable row level security;
alter table public.materials     enable row level security;
alter table public.site_settings enable row level security;

-- 공개(학생 홈페이지)에서 읽는 데이터
create policy "public read" on public.universities  for select using (true);
create policy "public read" on public.courses       for select using (true);
create policy "public read" on public.site_settings for select using (true);
create policy "public read" on public.extra_programs for select using (true);
create policy "public read published" on public.notices   for select using (published or public.is_approved());
create policy "public read published" on public.materials for select using (published or public.is_approved());

-- 사업단 전체 관리
create policy "hub all" on public.universities  for all using (public.is_hub()) with check (public.is_hub());
create policy "hub all" on public.courses       for all using (public.is_hub()) with check (public.is_hub());
create policy "hub all" on public.site_settings for all using (public.is_hub()) with check (public.is_hub());
create policy "hub all" on public.extra_programs for all using (public.is_hub()) with check (public.is_hub());
create policy "hub all" on public.notices       for all using (public.is_hub()) with check (public.is_hub());
create policy "hub all" on public.materials     for all using (public.is_hub()) with check (public.is_hub());
create policy "hub all" on public.issues        for all using (public.is_hub()) with check (public.is_hub());
create policy "hub all" on public.meetings      for all using (public.is_hub()) with check (public.is_hub());
create policy "hub all" on public.kpis          for all using (public.is_hub()) with check (public.is_hub());

-- 승인된 교직원은 협의·회의·성과 조회
create policy "staff read" on public.issues   for select using (public.is_approved());
create policy "staff read" on public.meetings for select using (public.is_approved());
create policy "staff read" on public.kpis     for select using (public.is_approved());

-- 프로필: 본인 조회, 사업단은 전체 조회·승인
create policy "self read" on public.profiles for select using (id = auth.uid() or public.is_hub());
create policy "hub update" on public.profiles for update using (public.is_hub()) with check (public.is_hub());

-- 회신 현황: 모두 조회, 소속 대학 담당자가 수정, 사업단 전체 수정
create policy "staff read" on public.replies for select using (public.is_approved());
create policy "own univ write" on public.replies for all
  using (public.is_hub() or university_id = public.my_univ())
  with check (public.is_hub() or university_id = public.my_univ());

-- 학생: 사업단 전체, 그 외 소속 대학만
create policy "scoped students" on public.students for all
  using (public.is_hub() or (public.is_approved() and university_id = public.my_univ()))
  with check (public.is_hub() or (public.is_approved() and university_id = public.my_univ()));

-- 비교과 수요: 조회는 교직원, 입력은 소속 대학
create policy "staff read" on public.extra_demand for select using (public.is_approved());
create policy "own univ write" on public.extra_demand for all
  using (public.is_hub() or university_id = public.my_univ())
  with check (public.is_hub() or university_id = public.my_univ());

-- 공개 페이지용 이수 인원 등 집계가 필요해질 때를 대비한 인덱스
create index on public.students (university_id);
create index on public.courses (sort);
